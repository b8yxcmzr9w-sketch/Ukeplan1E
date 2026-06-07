// Ukeplan v4 – AI parse skolerute Edge Function
// Accepts pasted school calendar text, returns structured calendar events

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')!
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  const { text } = await req.json()
  if (!text) return new Response('Missing text', { status: 400, headers: CORS })

  const systemPrompt = `Du er en assistent som hjelper med å legge inn skoleruter.
Brukeren limer inn tekst med informasjon om ferier, fridager og andre hendelser fra skoleruten.
Returner KUN gyldig JSON, ingen forklaringer.

Returner et objekt med denne strukturen:
{
  "events": [
    {
      "title": "Navn på ferien/fridagen",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "type": "ferie" | "helligdag" | "planleggingsdag" | "annet"
    }
  ],
  "warnings": ["eventuell advarsel eller usikkerhet"]
}

Regler:
- Bruk norsk skolekalender-konvensjoner
- Enkeltdager: sett start_date = end_date
- Ferier er perioder med start og slutt
- Helligdager er offisielle norske helligdager
- Planleggingsdager er dager lærerne jobber men elevene har fri
- Dersom du er usikker på en dato, inkluder den i warnings
- Anta inneværende eller kommende skoleår om årstall mangler`

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
    return new Response(JSON.stringify({ error: 'Gemini error', details: err }), { status: 502, headers: CORS })
  }

  const gemData = await gemRes.json()
  const rawText = gemData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return new Response(JSON.stringify({ error: 'Could not parse Gemini response', raw: rawText }), { status: 502, headers: CORS })
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})

