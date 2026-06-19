import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Portet fra kallGemini_ i appsscript.gs (velprøvd i produksjon).
// Identisk kopi ligger i ai-parse-sessions og ai-parse-skolerute,
// siden hver Edge Function deployes som én fil i Supabase Dashboard.
const GEMINI_MODEL = 'gemini-2.5-flash'

async function kallGemini(prompt: string, generationConfig?: Record<string, unknown>): Promise<string> {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY ikke satt')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    ...(generationConfig ? { generationConfig } : {}),
  })
  let sisteFeil = ''
  for (let forsok = 0; forsok < 3; forsok++) {
    if (forsok > 0) await new Promise((r) => setTimeout(r, 3000))
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
    const raw = await res.text()
    let json: any = null
    try { json = JSON.parse(raw) } catch { /* ikke-JSON-svar håndteres under */ }
    if (res.status === 503 || res.status === 429 ||
        (json?.error && (json.error.code === 503 || json.error.code === 429))) {
      sisteFeil = json?.error?.message?.slice(0, 100) ?? `Overbelastet (${res.status})`
      continue
    }
    if (!json?.candidates?.[0]?.content) {
      sisteFeil = json?.error?.message?.slice(0, 100) ?? raw.slice(0, 100)
      break
    }
    const parts = json.candidates[0].content.parts ?? []
    const tekst = parts
      .filter((p: any) => !p.thought && p.text)
      .map((p: any) => p.text)
      .join('\n').trim()
    if (tekst) return tekst
    sisteFeil = 'Tomt svar'
    break
  }
  throw new Error(`Gemini-feil: ${sisteFeil}`)
}

// Prompten bygges per skole – tjenesten er skolenøytral.
function byggPrompt(skoleNavn: string): string {
  return `Lag 40 korte og underholdende funfacts på norsk. Faktasetningene skal være sanne, enkle å forstå og passe for ungdom på videregående skole.

Skolen heter «${skoleNavn}». Temaene skal være en blanding av:
- Skolen og stedet/regionen der den ligger (utled dette fra skolenavnet)
- Lokalhistorie, natur og landskap i området rundt skolen
- Fagområder og linjer som er vanlige på en slik skole
- Vitenskap, dyr og natur
- Historie og arkeologi

Krav:
- Maks 1 kort setning per funfact.
- Ingen overskrifter, nummerering eller punktlister – bare én setning per linje.
- Variasjon mellom temaene.
- Faktaene skal være morsomme, overraskende eller interessante.
- Unngå tørre lærebokfakta.
- Alle fakta må være korrekte. Hvis du er usikker på lokale forhold, velg heller et generelt faktum enn å gjette.
- Språket skal være lett og muntlig.
- Ikke bruk emojis.
- Ikke gjenta samme type fakta.
- Minst 10 av faktaene skal ha lokal tilknytning til skolen eller området rundt, så sant du kjenner stedet godt nok.

Svar kun med de 40 faktasetningene, én per linje, ingenting annet.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return new Response(JSON.stringify({ error: 'Ikke autentisert' }), { status: 401, headers: corsHeaders })

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: profile } = await adminClient.from('users').select('is_admin, is_admin_active, school_id').eq('id', caller.id).single()
    if (!profile || (!profile.is_admin_active && !profile.is_admin)) {
      return new Response(JSON.stringify({ error: 'Krever admin-tilgang' }), { status: 403, headers: corsHeaders })
    }

    // Hent skolenavn fra innlogget brukers egen skole (ikke fra request body)
    const { data: school } = await adminClient.from('schools').select('name').eq('id', profile.school_id).single()
    if (!school?.name) throw new Error('Fant ikke skolen til brukeren')

    // maxOutputTokens er fjernet: gemini-2.5-flash bruker tenke-tokens som
    // teller mot grensen, og 2048 ville kuttet svaret før alle faktaene kom.
    const raw = await kallGemini(byggPrompt(school.name), { temperature: 0.9 })
    const facts = raw.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 5)

    return new Response(JSON.stringify({ facts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
