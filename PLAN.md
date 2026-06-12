# PLAN — Ukeplan1E v4

## Status: INGEN PÅGÅENDE OPPGAVE
## Neste steg: avvent neste oppgave

Forrige runde (fire små UI/prompt-justeringer: «høytid», ukenummer og
kompakt AI-forhåndsvisning, funfacts-overlay) er fullført og merget til
main via PR #77 — arkivert under.

---

## Beslutninger tatt (tidligere runder — gjelder fortsatt)
- **Uke er primær tidsenhet** (12.06.2026): ukenummer/ukedag er det
  lærere og elever forholder seg til; datoer beregnes fra uke +
  skoleår. Ved AI-tolkning sendes skoleåret alltid som kontekst, og
  årstall skal aldri gjettes av modellen. Skoleåret sendes i
  request-body (IKKE DB-oppslag) — funksjonen er stateless, og
  brukeren ser samme skoleår i UI som AI-en får.
- Fellesundervisning er løst som «koblede kopier»: én rad per klasse
  med felles `shared_group_id`. Kortene viser «👥 Felles med …».
- Fridagsblokkering gjelder typene ferie/helligdag/planleggingsdag.
  Typen «annet» blokkerer ikke.
- Konflikt: enkel melding med navn/tidspunkt (som bygget 11.06).
  Ingen endringsvisning, fletting eller kopiering.
- Elevtilgang: åpen klasseliste beholdes.
- Skolerute-import: håndterte feil returneres som 200 + `{ error }`
  slik at meldingen når brukeren (supabase-js skjuler body ved
  non-2xx). AI får kun bruke typene ferie/helligdag/planleggingsdag;
  milepæler filtreres i prompt + sikkerhetsnett.

## Arkiv: fullførte runder

### Fire små UI/prompt-justeringer (fullført 12.06.2026, PR #77)
- **«Helligdag» vises som «høytid»** — kun visningstekst via ny
  `kalenderTypeNavn()` (type-badge i skolerute-listen, nedtrekksmenyer
  i skolerute-redigering og AI-forhåndsvisning); DB-verdien
  `helligdag` er uendret, ingen migrasjon. Prompten i
  `ai-parse-skolerute` klassifiserer nå juleferie/påskeferie som
  `helligdag` (minimalt tillegg, uke-først-logikken urørt).
  Blokkeringslogikken upåvirket.
- **Ukenummer i AI-forhåndsvisningen** — ny «Uke»-kolonne per hendelse
  («uke 41», «uke 51–1» over flere uker) via `getISOWeek` med lokal
  datoparsing; oppdateres live ved datoredigering.
- **Kompaktere forhåndsvisningsmodal** — nullet arvet bunnmarg og
  mindre padding/skrift i radene; modalen er flex-kolonne der bare
  listen scroller, mens erstatt/legg til-valget og Avbryt/Lagre ligger
  i fast bunnfelt (alltid synlig).
- **Funfacts-overlay** — nesten dekkende mørk bakgrunn på faktaboksen
  og 10 s visningstid per setning (var 7 s).
- Cache-busting bumpet til `20260612a`. Manuelt steg utført:
  `ai-parse-skolerute` re-deployet i Supabase Dashboard 12.06.2026.

### Manuelle steg og opprydding bekreftet (12.06.2026)
- [x] Migrasjon 011 (`011_softdelete_facts_kalender.sql`) bekreftet
      kjørt — verifisert med spørring mot information_schema
      (`deleted_at` finnes på både school_facts og school_calendar).
- [x] Edge-funksjonen `generate-facts` re-deployet og testet OK med
      «✨ Generer med AI».
- [x] PR #76 (uke-først-runden, branch claude/blissful-ride-pxspuy)
      merget til main.
- [x] Foreldede brancher slettet på GitHub (`claude/favicon-fix`,
      `claude/margins-layout`, `claude/remember-tab`,
      `claude/snapshot-radio-fix`).

### Uke-først og årsforankring i ai-parse-skolerute (fullført 12.06.2026)
Bakgrunn: en skolerute for 26/27 uten årstall ble tolket som 2020/21
fordi modellen gjettet år fra gamle publiserte skoleruter.
- **Prompt:** semesterkontekst (uke 33–52 = høstår, uke 1–24 = vårår),
  eksplisitt forbud mot å gjette årstall, og `week_nr` som eget felt
  der teksten oppgir ukenummer (kun perioder innenfor én uke).
- **Kode:** `isoWeekToDate`/`isoWeekOf`/`korrigerAar` i
  edge-funksjonen. Med `week_nr` beregnes kalenderår og datoer i kode
  (uke ≥ 33 → høstår, ellers vårår); modellens ukedagsspenn beholdes
  når datoene bekrefter uka, ellers settes man–fre med advarsel.
  Uten `week_nr` korrigeres feil årstall ut fra måneden (aug–des →
  høstår, jan–jul → vårår) med advarsel. Den harde avvisningen
  («Dette ser ut som skoleruten for XX/YY») utgikk — erstattet av
  korrigering + advarsler som vises i forhåndsvisningen.
- **Milepæler retningsbestemt** (etterjustering): «første skoledag
  etter [ferie]» → dagene/uka før var ferien (ukesferier: man–fre +
  week_nr); «siste skoledag før [ferie]» → ferien starter dagen etter
  (alene: uka etter); finnes begge, spenner ferien mellom dem.
  Milepælene selv blir aldri egne rader.
- **Frontend:** ingen endring (skoleår sendtes allerede i body,
  advarsler vistes allerede i forhåndsvisningen) — ingen `?v=`-bump.
- **Dokumentasjon:** «Uke er primær tidsenhet» lagt til under «Regler
  og prinsipper» i FUNKSJONELL-BESKRIVELSE.md + to avkryssede punkter
  i sjekklisten der.
- Testet ende-til-ende i Node med stubbet Gemini-svar som gjetter
  2020/21: alle datoer landet i 26/27. Manuelt steg (utført):
  re-deploy av `ai-parse-skolerute` i Supabase Dashboard.
- Avgrensning videreført: `ai-parse-sessions` bruker ennå IKKE
  uke-først — kandidat for egen runde.

### Del A/B/C (fullført 11.06.2026)
AI-overlay med funfacts (`medAIOverlay`), funfacts-FIFO med maks 100
og soft-delete av eldste (migrasjon 011), og forbedret skolerute-
import med skoleår-forankring, redigerbar forhåndsvisning og
erstatt/legg til-valg. Manuelle steg den gangen: migrasjon 011 i SQL
Editor + re-deploy av `ai-parse-skolerute`.

### Oppgave 1–8 (fullført 11.06.2026)
Alle åtte oppgavene fra gjennomgangen av FUNKSJONELL-BESKRIVELSE.md er
fullført og merget til main: sporbarhet (migrasjon 007), skolenøytrale
funfacts, fridagsblokkering (`finnFridag`), kollegahjelp (migrasjon
008), rollegrenser i databasen (migrasjon 009), fellesundervisning
(migrasjon 010), elevtilgang (avklart, ingen endring) og
konflikthåndtering med navngitt varsel. I samme runde ble
kallGemini-mønsteret fra appsscript.gs (retry ved 503/429,
thought-filtrering, feilhåndtering) portet som identisk hjelpefunksjon
til alle tre AI-edge-functions (generate-facts, ai-parse-sessions,
ai-parse-skolerute). Migrasjon 004–010 er kjørt;
`GEMINI_API_KEY` er satt og `006_fix_school_facts_rls.sql` bekreftet
kjørt i prod.
