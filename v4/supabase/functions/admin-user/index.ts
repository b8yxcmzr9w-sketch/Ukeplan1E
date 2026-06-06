import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sender et enkelt varsel til en e-postadresse via Resend (hvis konfigurert).
// Returnerer true ved suksess, false hvis Resend ikke er satt opp / feiler.
async function sendVarsel(til: string, emne: string, html: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY')
  const fra = Deno.env.get('RESEND_FROM')
  if (!key || !fra) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fra, to: til, subject: emne, html }),
    })
    return res.ok
  } catch {
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verifiser at den som kaller er aktiv admin
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Ikke autentisert' }, 401)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: callerProfile } = await adminClient.from('users')
      .select('school_id, role, is_admin_active')
      .eq('id', caller.id)
      .single()
    if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_admin_active) {
      return json({ error: 'Krever admin-tilgang' }, 403)
    }

    const body = await req.json()
    const { action, user_id } = body
    if (!action || !user_id) return json({ error: 'Mangler action eller user_id' }, 400)

    // Mål-bruker må tilhøre samme skole
    const { data: target } = await adminClient.from('users')
      .select('school_id, full_name')
      .eq('id', user_id)
      .single()
    if (!target || target.school_id !== callerProfile.school_id) {
      return json({ error: 'Brukeren finnes ikke i din skole' }, 403)
    }

    const { data: targetAuth } = await adminClient.auth.admin.getUserById(user_id)
    const gammelEpost = targetAuth?.user?.email || ''

    const skoleNavn = (await adminClient.from('schools').select('name').eq('id', callerProfile.school_id).single()).data?.name || 'Ukeplan'

    if (action === 'get_email') {
      return json({ email: gammelEpost })
    }

    if (action === 'set_password') {
      const { password } = body
      if (!password || password.length < 8) return json({ error: 'Passord må være minst 8 tegn' }, 400)
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password })
      if (error) throw error
      // Varsle brukeren om at passordet er endret av admin (best effort)
      const notified = await sendVarsel(gammelEpost, `Passordet ditt i ${skoleNavn} er endret`,
        `<p>Hei!</p><p>En administrator har satt et nytt passord på kontoen din i ${skoleNavn}.</p>
         <p>Hvis du ikke ba om dette, kontakt administrator ved skolen.</p>`)
      return json({ ok: true, notified })
    }

    if (action === 'send_reset') {
      if (!gammelEpost) return json({ error: 'Brukeren har ingen e-postadresse' }, 400)
      const { error } = await callerClient.auth.resetPasswordForEmail(gammelEpost, {
        redirectTo: body.redirect_to || undefined,
      })
      if (error) throw error
      return json({ ok: true })
    }

    if (action === 'change_email') {
      const nyEpost = (body.new_email || '').trim()
      if (!nyEpost) return json({ error: 'Mangler ny e-postadresse' }, 400)
      // Sett ny e-post direkte (bekreftet umiddelbart)
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { email: nyEpost, email_confirm: true })
      if (error) throw error
      // Varsle gammel adresse om endringen (best effort)
      let notified = false
      if (gammelEpost && gammelEpost !== nyEpost) {
        notified = await sendVarsel(gammelEpost, `E-postadressen din i ${skoleNavn} er endret`,
          `<p>Hei!</p><p>En administrator har endret e-postadressen som er knyttet til kontoen din i ${skoleNavn} fra
           <strong>${gammelEpost}</strong> til <strong>${nyEpost}</strong>.</p>
           <p>Hvis du ikke kjenner til denne endringen, kontakt administrator ved skolen umiddelbart.</p>`)
      }
      return json({ ok: true, notified })
    }

    return json({ error: 'Ukjent action' }, 400)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
