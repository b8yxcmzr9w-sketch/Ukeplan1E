import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EPOST_DOMENE = /@skole\.rogfk\.no$/i

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
    const body = await req.json()
    const fullName = (body.full_name || '').trim()
    const email = (body.email || '').trim()
    const requestedRole = body.requested_role
    const subjectsText: string[] = Array.isArray(body.subjects_text) ? body.subjects_text : []
    const divisionsText: string[] = Array.isArray(body.divisions_text) ? body.divisions_text : []
    const message = (body.message || '').trim() || null

    if (!fullName) return json({ error: 'Navn er påkrevd' }, 400)
    if (!email || !EPOST_DOMENE.test(email)) {
      return json({ error: 'E-post må være en @skole.rogfk.no-adresse' }, 400)
    }
    if (requestedRole !== 'laerer' && requestedRole !== 'kontaktlaerer') {
      return json({ error: 'Ugyldig ønsket rolle' }, 400)
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Kun én skole per app-instans (samme mønster som init() i app.js)
    const { data: school } = await adminClient.from('schools').select('id, name').limit(1).single()
    if (!school) return json({ error: 'Fant ingen skole' }, 500)

    const { error: insertError } = await adminClient.from('access_requests').insert({
      school_id: school.id,
      full_name: fullName,
      email,
      requested_role: requestedRole,
      subjects_text: subjectsText,
      divisions_text: divisionsText,
      message,
    })
    if (insertError) throw insertError

    // Varsle skolens admin(er) på e-post — best effort, feiler ikke innsendingen
    const { data: admins } = await adminClient.from('users')
      .select('id, full_name')
      .eq('school_id', school.id)
      .is('deleted_at', null)
      .or('is_admin.eq.true,role.eq.admin')

    let notified = false
    const rolleNavn = requestedRole === 'kontaktlaerer' ? 'Kontaktlærer' : 'Lærer'
    const html = `
      <p>Hei!</p>
      <p><strong>${fullName}</strong> (${email}) har bedt om tilgang til ${school.name} i Ukeplan,
      som <strong>${rolleNavn}</strong>.</p>
      <p><strong>Fag:</strong> ${subjectsText.length ? subjectsText.join(', ') : '(ingen valgt)'}</p>
      <p><strong>Parti/gruppe:</strong> ${divisionsText.length ? divisionsText.join(', ') : '(ingen valgt)'}</p>
      <p><strong>Melding:</strong> ${message ? message : '(ingen melding)'}</p>
      <p>Logg inn som admin og se forespørselen under fanen «Forespørsler» i adminpanelet
      for å godkjenne eller avvise.</p>`

    for (const admin of admins || []) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(admin.id)
      const adminEpost = authUser?.user?.email
      if (!adminEpost) continue
      const ok = await sendVarsel(adminEpost, `Ny tilgangsforespørsel i Ukeplan (${school.name})`, html)
      if (ok) notified = true
    }

    return json({ ok: true, notified })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
