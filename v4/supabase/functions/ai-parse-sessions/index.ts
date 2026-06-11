// Ukeplan v4 – AI parse sessions Edge Function
// Accepts pasted text + context, returns structured session array via Gemini Flash

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Portet fra kallGemini_ i appsscript.gs (velprøvd i produksjon).
// Identisk kopi ligger i generate-facts og ai-parse-skolerute,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  // Auth
  const callerClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Ikke autentisert' }), { status: 401, headers: corsHeaders })

  const { text, context } = await req.json()
  // context: { subjects: [{id, name, short_code}], classes: [{id, name}], teachers: [{id, full_name}], divisions: [{id, name, subject_id, division_type}] }

  if (!text) return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400, headers: corsHeaders })

  const systemPrompt = `Du er en assistent som hjelper lærere med å legge inn ukeplaner.
Brukeren limer inn tekst med informasjon om undervisningsøkter. Du skal tolke teksten og returnere
en JSON-array med økter. Returner KUN gyldig JSON, ingen forklaringer.

Tilgjengelige fag (bruk id): ${JSON.stringify(context?.subjects ?? [])}
Tilgjengelige klasser (bruk id): ${JSON.stringify(context?.classes ?? [])}
Tilgjengelige lærere (bruk id): ${JSON.stringify(context?.teachers ?? [])}
Tilgjengelige inndelinger (bruk id): ${JSON.stringify(context?.divisions ?? [])}

Hvert økt-objekt skal ha disse feltene:
{
  "class_id": "uuid eller null",
  "subject_id": "uuid eller null",
  "division_id": "uuid eller null",
  "week_nr": tall (ISO-uke),
  "day_of_week": tall 1-5 (1=mandag),
  "activity": "tekst",
  "meeting_point": "tekst eller tom streng",
  "info": "tekst eller tom streng",
  "_confidence": "high|medium|low",
  "_note": "eventuell merknad om usikkerhet"
}

Dersom du ikke kan fastslå et felt med rimelig sikkerhet, sett det til null.
Returner et objekt: { "sessions": [...], "warnings": ["eventuell advarsel"] }`

  let rawText: string
  try {
    rawText = await kallGemini(
      `${systemPrompt}\n\nTekst fra bruker:\n${text}`,
      { temperature: 0.1, responseMimeType: 'application/json' }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: corsHeaders })
  }

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return new Response(JSON.stringify({ error: 'Could not parse Gemini response', raw: rawText }), { status: 502, headers: corsHeaders })
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
