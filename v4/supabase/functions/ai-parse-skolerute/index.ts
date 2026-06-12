// Ukeplan v4 – AI parse skolerute Edge Function
// Tar imot limt skolerute-tekst + aktivt skoleår, og returnerer
// strukturerte fridager: KUN dager uten undervisning (ferie,
// helligdag, planleggingsdag), forankret i skoleårets datointervall.
// Milepæler («første skoledag» o.l.) filtreres bort både i prompten
// og i et sikkerhetsnett etter AI-svaret.

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

// Typen «annet» finnes i skjemaet, men er forbeholdt manuelle
// oppføringer — AI-en får ikke bruke den.
const GYLDIGE_TYPER = ['ferie', 'helligdag', 'planleggingsdag']

// Sikkerhetsnett: milepæler skal aldri inn i skoleruten,
// uansett hvordan AI-en har klassifisert dem.
const MILEPAEL = /skoledag|skolestart|skoleslutt/i

// Uke er primær tidsenhet: ukenummer ≥ 33 hører til høståret,
// ellers våråret (samme prinsipp som skoleaarKalenderaar i app.js).
const SKOLESTART_UKE = 33

function gyldigDato(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

// ISO 8601: dato (YYYY-MM-DD) for gitt år/uke/ukedag (1 = mandag … 7 = søndag).
// Uke 1 er uka som inneholder 4. januar.
function isoWeekToDate(year: number, week: number, weekday: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const mandagUke1 = new Date(jan4)
  mandagUke1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1))
  const d = new Date(mandagUke1)
  d.setUTCDate(mandagUke1.getUTCDate() + (week - 1) * 7 + (weekday - 1))
  return d.toISOString().slice(0, 10)
}

// ISO-år, -uke og ukedag (1–7) for en dato. Torsdagen i samme uke
// avgjør hvilket ISO-år uka tilhører.
function isoWeekOf(dateStr: string): { year: number; week: number; weekday: number } {
  const d = new Date(dateStr + 'T00:00:00Z')
  const weekday = d.getUTCDay() || 7
  const torsdag = new Date(d)
  torsdag.setUTCDate(d.getUTCDate() + 4 - weekday)
  const year = torsdag.getUTCFullYear()
  const aarStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((torsdag.getTime() - aarStart.getTime()) / 86400000 + 1) / 7)
  return { year, week, weekday }
}

// Tvinger året inn i skoleåret ut fra måneden (aug–des → høstår,
// jan–jul → vårår) — dag og måned beholdes som de er.
function korrigerAar(dateStr: string, aar1: number, aar2: number): string {
  const mnd = parseInt(dateStr.slice(5, 7), 10)
  return `${mnd >= 8 ? aar1 : aar2}${dateStr.slice(4)}`
}

// Håndterte feil returneres som 200 + { error } slik at meldingen
// når frem til brukeren (supabase-js skjuler body ved non-2xx).
function svar(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function byggPrompt(text: string, schoolYear: string, aar1: number, aar2: number): string {
  return `Du er en assistent som legger inn skoleruten for en norsk videregående skole.
Skoleruta gjelder skoleåret ${schoolYear}. Høstsemesteret (uke 33–52) er i ${aar1}, vårsemesteret (uke 1–24) er i ${aar2}.
Brukeren limer inn tekst (f.eks. fra PDF, nettside eller e-post) med skoleruten.

Trekk ut KUN dager der elevene IKKE har undervisning.
Returner KUN gyldig JSON, ingen forklaringer:
{
  "events": [
    {
      "title": "Navn på ferien/fridagen",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "week_nr": 41,
      "type": "ferie" | "helligdag" | "planleggingsdag"
    }
  ],
  "warnings": ["eventuell advarsel eller usikkerhet"]
}

Typer (bruk nøyaktig én av disse tre — aldri noe annet):
- "ferie": ferieperioder (høstferie, vinterferie, sommerferie) og enkeltstående fridager/klemdager for elevene
- "helligdag": juleferie og påskeferie (hele perioden) samt offisielle norske helligdager på ukedager (1. nyttårsdag, skjærtorsdag, langfredag, 2. påskedag, 1. mai, 17. mai, Kristi himmelfartsdag, 2. pinsedag, 1. og 2. juledag)
- "planleggingsdag": dager der lærerne jobber, men elevene har fri

ÅRSTALL — skoleåret går fra 1. august ${aar1} til 31. juli ${aar2}:
- Hvis teksten mangler årstall, skal du bruke disse årene: august–desember får ${aar1}, januar–juli får ${aar2}
- Du skal ALDRI gjette andre årstall — heller ikke fra skoleruter du kjenner fra før
- Alle datoer skal ligge innenfor dette intervallet

UKENUMMER — uke er primær tidsenhet:
- Der teksten oppgir ukenummer (f.eks. «høstferie uke 41»), returner ukenummeret i "week_nr" i tillegg til datoene
- "week_nr" brukes KUN når hele perioden ligger innenfor én uke; flerukers perioder (f.eks. juleferie) får "week_nr": null
- Uke 33–52 ligger i ${aar1}, uke 1–24 i ${aar2}

Skal IKKE tas med som egne rader (hoppes over, uansett formulering):
- Milepæler som «første skoledag», «siste skoledag», «skolestart», «skoleslutt», «skolestart etter jul», «første skoledag etter påske»
- Eksamensdager, tentamen og heldagsprøver (elevene har oppmøte)
- Foreldremøter, utviklingssamtaler og andre arrangementer på vanlige skoledager
- Helger (lørdag/søndag) som egne oppføringer

Milepæler kan likevel brukes til å BEREGNE ferier — men milepælene selv skal aldri bli egne rader:
- «Siste skoledag før [ferie]» betyr at ferien starter DAGEN ETTER milepælen
- «Første skoledag etter [ferie]» betyr at ferien sluttet DAGEN FØR milepælen — dagene/uka før denne dagen var ferien
- Finnes begge milepælene, spenner ferien mellom dem: står det «siste skoledag før jul 19. desember» og «første skoledag etter jul 5. januar», er juleferien 20. desember ${aar1} – 4. januar ${aar2} (type "helligdag", tittel "Juleferie")
- Finnes bare «første skoledag etter [ferie]» (typisk en mandag), og ferien er en vanlig ukesferie (høstferie, vinterferie), var ferien hele uka før: mandag–fredag, med "week_nr" for den uka
- Finnes bare «siste skoledag før [ferie]» (typisk en fredag), er ferien hele uka etter: mandag–fredag, med "week_nr" for den uka

Andre regler:
- Enkeltdager: sett start_date = end_date
- Ferieperioder: sett start_date og end_date til hele perioden
- Er du usikker på en dato, legg en kort forklaring i warnings

Tekst fra bruker:
${text}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  const { text, school_year } = await req.json()
  if (!text) return svar({ error: 'Mangler tekst' }, 400)
  if (!school_year || !/^\d{2}\/\d{2}$/.test(school_year)) {
    return svar({ error: 'Mangler gyldig skoleår (format YY/YY)' }, 400)
  }

  const aar1 = 2000 + parseInt(school_year.slice(0, 2), 10)
  const aar2 = 2000 + parseInt(school_year.slice(3, 5), 10)
  const fra = `${aar1}-08-01`
  const til = `${aar2}-07-31`

  let rawText: string
  try {
    rawText = await kallGemini(
      byggPrompt(text, school_year, aar1, aar2),
      { temperature: 0.1, responseMimeType: 'application/json' }
    )
  } catch (e) {
    console.error('Gemini feil:', e.message)
    return svar({ error: e.message }, 502)
  }

  let parsed: any
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return svar({ error: 'Kunne ikke tolke AI-svaret', raw: rawText }, 502)
  }

  const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings : []
  const events: { title: string; start_date: string; end_date: string; type: string }[] = []
  const aarKorrigert: string[] = []

  for (const e of parsed.events ?? []) {
    const title = String(e?.title ?? '').trim()
    let start = String(e?.start_date ?? '').trim()
    let end = String(e?.end_date ?? e?.start_date ?? '').trim()
    let type = String(e?.type ?? '').trim()
    const weekNr = Number(e?.week_nr)
    const harUke = Number.isInteger(weekNr) && weekNr >= 1 && weekNr <= 53

    if (!title || (!harUke && (!gyldigDato(start) || !gyldigDato(end)))) {
      warnings.push(`Hoppet over rad med manglende tittel eller ugyldig dato: «${title || start || '?'}»`)
      continue
    }
    if (MILEPAEL.test(title)) continue
    if (!GYLDIGE_TYPER.includes(type)) {
      warnings.push(`«${title}» hadde ukjent type «${type}» – satt til ferie, sjekk før lagring`)
      type = 'ferie'
    }

    if (harUke) {
      // Uke-først: kalenderåret beregnes i kode — aldri fra modellens gjetting.
      const ukeAar = weekNr >= SKOLESTART_UKE ? aar1 : aar2
      let beregnet = false
      if (gyldigDato(start) && gyldigDato(end)) {
        const sKorr = korrigerAar(start, aar1, aar2)
        const tKorr = korrigerAar(end, aar1, aar2)
        if (gyldigDato(sKorr) && gyldigDato(tKorr) && sKorr <= tKorr) {
          const si = isoWeekOf(sKorr)
          const ti = isoWeekOf(tKorr)
          if (si.year === ukeAar && si.week === weekNr && ti.year === ukeAar && ti.week === weekNr) {
            // Datoene bekrefter uka — behold ukedagsspennet (kan være enkeltdag)
            start = isoWeekToDate(ukeAar, weekNr, si.weekday)
            end = isoWeekToDate(ukeAar, weekNr, ti.weekday)
            beregnet = true
          }
        }
      }
      if (!beregnet) {
        // Dato og ukenummer stemmer ikke overens → uka vinner (man–fre)
        start = isoWeekToDate(ukeAar, weekNr, 1)
        end = isoWeekToDate(ukeAar, weekNr, 5)
        warnings.push(`«${title}»: dato og ukenummer i teksten stemte ikke overens – satte uke ${weekNr} (${start} – ${end}), sjekk før lagring`)
      }
    } else {
      // Årskorrigering: riktig dag/måned, men feil (gjettet) år rettes i kode
      const sKorr = korrigerAar(start, aar1, aar2)
      const tKorr = korrigerAar(end, aar1, aar2)
      if (!gyldigDato(sKorr) || !gyldigDato(tKorr)) {
        warnings.push(`«${title}»: ugyldig dato etter årskorrigering (${sKorr} – ${tKorr}) – raden ble droppet`)
        continue
      }
      if (sKorr !== start || tKorr !== end) {
        const gammelt = (sKorr !== start ? start : end).slice(0, 4)
        const nytt = (sKorr !== start ? sKorr : tKorr).slice(0, 4)
        aarKorrigert.push(`«${title}» (${gammelt}→${nytt})`)
      }
      start = sKorr
      end = tKorr
      if (start > end) {
        warnings.push(`«${title}»: fra-dato er etter til-dato (${start} – ${end}) – raden ble droppet, sjekk teksten`)
        continue
      }
    }

    // Sikkerhetsnett: etter korrigering skal alt ligge i skoleåret
    if (start < fra || end > til) {
      warnings.push(`«${title}» (${start} – ${end}) ligger utenfor skoleåret ${school_year} – raden ble droppet`)
      continue
    }
    events.push({ title, start_date: start, end_date: end, type })
  }

  if (aarKorrigert.length) {
    warnings.push(`Årstall korrigert til skoleåret ${school_year} for: ${aarKorrigert.join(', ')} – kontroller at riktig skolerute er limt inn`)
  }

  return svar({ events, warnings })
})
