// Ukeplan v4 – AI parse sessions Edge Function
// Accepts pasted text + context, returns structured session array via Gemini Flash

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')!
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

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

  const body = {
    contents: [{ parts: [{ text: `${systemPrompt}\n\nTekst fra bruker:\n${text}` }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  }

  const gemRes = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!gemRes.ok) {
    const err = await gemRes.text()
    return new Response(JSON.stringify({ error: 'Gemini error', details: err }), { status: 502, headers: corsHeaders })
  }

  const gemData = await gemRes.json()
  const rawText = gemData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

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
