import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify caller is an active admin
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return new Response(JSON.stringify({ error: 'Ikke autentisert' }), { status: 401, headers: corsHeaders })

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: callerProfile } = await adminClient.from('users')
      .select('school_id, role, is_admin_active')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_admin_active) {
      return new Response(JSON.stringify({ error: 'Krever admin-tilgang' }), { status: 403, headers: corsHeaders })
    }

    const { email, full_name, role, class_ids } = await req.json()
    if (!email || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'Mangler påkrevde felt' }), { status: 400, headers: corsHeaders })
    }

    // Create auth user and send invite email
    const { data: newAuthUser, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email)
    if (authError) throw authError

    // Insert into users table
    const { error: dbError } = await adminClient.from('users').insert({
      id: newAuthUser.user.id,
      school_id: callerProfile.school_id,
      full_name,
      role,
      is_admin_active: role === 'admin',
    })
    if (dbError) throw dbError

    // Link classes
    for (const class_id of (class_ids || [])) {
      await adminClient.from('user_classes').insert({ user_id: newAuthUser.user.id, class_id })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
