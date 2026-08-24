import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EPOST_DOMENE = /@skole\.rogfk\.no$/i

// Formspree-skjema opprettet av Morfar (mottaker satt til geir.edland@skole.rogfk.no
// i Formspree-kontoen selv — ikke i kode). Erstatter Resend/sendVarsel (P57,
// 20. august 2026): ingen hemmelig nøkkel trengs, samme tjeneste som allerede
// er i bruk og bekreftet fungerende på uno.ganddal.net/ukeplan1e.html.
const FORMSPREE_URL = 'https://formspree.io/f/mqpznaen'

// Sender et enkelt varsel via Formspree. Returnerer true ved suksess, false
// ved feil — best effort, feiler aldri selve innsendingen av forespørselen.
async function sendVarsel(felter: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(felter),
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

    // Varsle admin via Formspree — best effort, feiler ikke innsendingen.
    // Mottaker-e-post er satt i Formspree-kontoen, ikke her — trenger derfor
    // ikke slå opp admin-brukere eller deres e-post i det hele tatt.
    const rolleNavn = requestedRole === 'kontaktlaerer' ? 'Kontaktlærer' : 'Lærer'
    const notified = await sendVarsel({
      _subject: `Ny tilgangsforespørsel i Ukeplan (${school.name})`,
      navn: fullName,
      epost: email,
      rolle: rolleNavn,
      fag: subjectsText.length ? subjectsText.join(', ') : '(ingen valgt)',
      parti_gruppe: divisionsText.length ? divisionsText.join(', ') : '(ingen valgt)',
      melding: message || '(ingen melding)',
      info: `Logg inn som admin og se forespørselen under fanen «Forespørsler» i adminpanelet for å godkjenne eller avvise.`,
    })

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
