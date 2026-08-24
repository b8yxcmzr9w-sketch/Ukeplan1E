// Ukeplan v4 – Cleanup Edge Function
// Called by pg_cron daily to hard-delete records soft-deleted > 30 days ago

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { error } = await sb.rpc('purge_old_soft_deletes')
  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  return new Response(JSON.stringify({ ok: true, purged_at: new Date().toISOString() }))
})
