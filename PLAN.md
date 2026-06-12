# PLAN — Ukeplan1E v4

## Status: PÅGÅENDE — fire små UI/prompt-justeringer (12.06.2026)
## Neste steg: oppgave 1 («helligdag» vises som «høytid»)

## Pågående runde: fire små UI/prompt-justeringer

- [ ] **Oppgave 1 — «helligdag» vises som «høytid» (kun visningstekst)**
      DB-verdien `helligdag` beholdes (ingen migrasjon). Visningstekst
      «høytid» alle steder typen vises: nedtrekksmeny i
      skolerute-redigering, AI-forhåndsvisningen og type-badgen i
      skolerute-listen. I prompten i `ai-parse-skolerute`: juleferie og
      påskeferie klassifiseres som `helligdag` (minimalt tillegg —
      ikke omskriv uke-først-logikken).
- [ ] **Oppgave 2 — ukenummer i AI-forhåndsvisningen av skoleruten**
      Vis ISO-ukenummer per hendelse («uke 41»), intervall ved
      flerukers hendelser («uke 51–1»). Gjenbruk `getISOWeek`.
- [ ] **Oppgave 3 — kompaktere forhåndsvisningsmodal**
      Mindre luft / smalere felt i radene; bunnlinjen med
      Avbryt/Lagre + erstatt/legg til-valget alltid synlig (sticky).
- [ ] **Oppgave 4 — funfacts-overlay**
      Mindre transparent boks (mer dekkende bakgrunn) og 10 s
      visningstid per setning (var 7 s).
- [ ] Bump `?v=YYYYMMDDx` i `v4/index.html` (JS og CSS er endret)

### Manuelt steg etter runden (Supabase Dashboard)

- [ ] Re-deploy `ai-parse-skolerute` (prompten er endret i oppgave 1)

Forrige runde (uke-først og årsforankring i `ai-parse-skolerute`,
inkl. retningsbestemt milepæl-tolkning) er fullført — arkivert under.

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
- Elevtilgang: forsiden beholder den åpne klasselisten.
- Konflikthåndtering: navngitt varsel — «Økten er endret av [navn]
  ([tidspunkt]) — last inn på nytt før du lagrer».
- Skolerute-import: håndterte feil returneres som 200 + `{ error }`
  slik at meldingen når brukeren (supabase-js skjuler body ved
  non-2xx). AI får kun bruke typene ferie/helligdag/planleggingsdag;
  milepæler filtreres i prompt + sikkerhetsnett.

## Arkiv: fullførte runder

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
