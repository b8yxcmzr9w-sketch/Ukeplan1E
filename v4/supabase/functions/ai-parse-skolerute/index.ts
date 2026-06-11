// Ukeplan v4 – AI parse skolerute Edge Function
// Accepts pasted school calendar text, returns structured calendar events

// Portet fra kallGemini_ i appsscript.gs (velprøvd i produksjon).
// Identisk kopi ligger i generate-facts og ai-parse-sessions,
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

  let rawText: string
  try {
    rawText = await kallGemini(
      `${systemPrompt}\n\nTekst fra bruker:\n${text}`,
      { temperature: 0.1, responseMimeType: 'application/json' }
    )
  } catch (e) {
    console.error('Gemini feil:', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: CORS })
  }

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

