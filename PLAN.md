# PLAN — Ukeplan1E v4

## Status: GODKJENT 11.06.2026 — Del A og B fullført
## Neste steg: Del C (forbedret AI-import av skolerute)

Forrige runde (oppgave 1–8) er fullført — arkivert nederst.
Denne planen dekker tre nye deler: AI-overlay (A), funfacts-FIFO (B)
og forbedret skolerute-import (C). Rekkefølgen A → B → C er bevisst:
Del A bygger overlayet som Del C bruker fra start.

---

## Kartlegging (gjort før planen)

### Dagens oppførsel — funfacts-maksgrense (Del B)
- Grensen på **100** håndheves KUN i frontend, i `renderFaktaTab`
  (app.js ~3640): etter AI-generering beregnes `ledigePlasser =
  100 − antall`. Er listen full vises toast «Listen er full (maks 100
  funfacts). Slett noen først.» og ingenting lagres; ellers kuttes de
  nye faktaene til å passe (`ny.slice(0, ledigePlasser)`).
- Edge-funksjonen `generate-facts` har INGEN grenselogikk — den
  genererer ~40 fakta og returnerer dem.
- `school_facts` har bare `id, school_id, fact_text` — **mangler både
  `created_at` (trengs for å finne «eldste») og `deleted_at` (trengs
  for soft-delete)**. Sletting i appen i dag er hard delete.
  → Del B krever migrasjon 011.

### Dagens oppførsel — skolerute-import (Del C)
- `ai-parse-skolerute` har en enkel prompt uten skoleår-forankring
  («Anta inneværende eller kommende skoleår om årstall mangler») og
  uten regler mot milepæler — derfor kommer «Første skoledag» og feil
  årstall med.
- Frontend (`renderSkolerute`, app.js ~3535): AI-svaret vises bare som
  `confirm()`-tekst, deretter insert rett i `school_calendar`. Ingen
  redigerbar forhåndsvisning, ingen erstatt-mulighet.
- `school_calendar` har **ikke `deleted_at`** (og ikke `school_year`)
  → «erstatt med soft-delete» krever migrasjon 011. Skoleår-tilhørighet
  avgjøres via datointervall (1. aug år1 – 31. jul år2), ikke ny kolonne.
- Gammel prompt i fredet `appsscript.gs` (`tolkSkoleruteAction_` — lest,
  ikke endret) gjenbrukes der den fungerer: eksplisitt årsforankring
  (uker 30–52 → år1, uker 1–29 → år2, omformuleres til måneder:
  aug–des → år1, jan–jul → år2) og regelen «'Siste skoledag før jul' /
  'Første skoledag etter jul/påske' skal IKKE inkluderes som egne
  rader — brukes kun til å beregne ferieukene».

---

## Migrasjon 011 (felles for Del B og C)

`v4/supabase/migrations/011_softdelete_facts_kalender.sql`:
- [x] `school_facts`: legg til `created_at timestamptz not null
      default now()` og `deleted_at timestamptz` (eksisterende rader
      får created_at = nå; FIFO blant dem avgjøres sekundært av `id`)
- [x] `school_calendar`: legg til `deleted_at timestamptz`
- [x] Utvid `purge_old_soft_deletes()` med `school_facts` og
      `school_calendar` (30-dagers permanent sletting, eksisterende cron)
- [x] Alle lesinger i app.js filtrerer `deleted_at is null`:
      `finnFridag`, elevvisningens kalenderoppslag, `renderSkolerute`,
      `renderFaktaTab`, facts-lasting i `init()`

KJØRES MANUELT i SQL Editor FØR ny app.js tas i bruk (filtrene
forutsetter at kolonnene finnes).

---

## DEL A: «AI jobber»-overlay med funfacts

- [x] A1. Ny hjelpefunksjon `medAIOverlay(tittel, asyncFn)` i app.js
      (samme mønster som `medLagreOverlay`):
      - Fullskjerms-overlay vises umiddelbart; `asyncFn` kjøres;
        overlay fjernes i `finally` (også ved feil). Resultat
        returneres / feil kastes videre → eksisterende
        toast-feilhåndtering virker som før.
      - Kan ikke lukkes av brukeren; blokkerer interaksjon bak.
      - Innhold: pulserende ✨-animasjon, tittel (parameter),
        undertekst «Dette kan ta litt tid.», funfact fra `APP.facts`
        med merkelapp «Mens du venter …».
      - Fakta byttes hvert 7. sek med myk fade; tilfeldig rekkefølge
        uten samme fakta to ganger på rad (stokket kø).
      - →-knapp (min. 44×44 px treffflate) hopper til neste fakta
        umiddelbart og nullstiller 7-sekunderstimeren.
      - Tom `APP.facts`: kun animasjon + tittel + undertekst (ingen
        faktaboks, ingen →-knapp).
      - Intervall-timer ryddes når overlayet fjernes (ingen lekkasje).
- [x] A2. CSS i style.css: `.ai-overlay` m.m., mørk halvgjennomsiktig
      bakgrunn, skolens temavariabler der naturlig, `z-index: 600`
      (over `.modal-bg` 200 og `.lagre-overlay` 500), mobilvennlig.
- [x] A3. Ta i bruk overlayet rundt AI-kallene (alle tre koblet på;
      skolerute-flyten bygges videre om i Del C):
      - `visAIPasteModal` → `ai-parse-sessions`:
        «AI tolker teksten til økter …»
      - Funfacts-generering → `generate-facts`:
        «AI lager nye funfacts …»
      - Skolerute-import → `ai-parse-skolerute`:
        «AI tolker skoleruten …» (selve flyten bygges om i Del C —
        overlayet brukes der fra start)
- [x] A4. Bump `?v=20260611f` i v4/index.html (CSS + JS), commit Del A

## DEL B: Maks antall funfacts — erstatt de eldste (FIFO)

- [x] B1. Skriv migrasjon 011 (se over) — `created_at`/`deleted_at`
      på `school_facts` + purge-utvidelse
- [x] B2. `renderFaktaTab`-generering: når nye fakta ville overstige
      100, soft-delete (`deleted_at = nå`) akkurat så mange av de
      ELDSTE (etter `created_at`, sekundært `id`) at alle nye får
      plass; deretter settes alle nye inn. Ingen ekstra dialog før —
      kun informasjon etter: «Maks antall er nådd – de N eldste ble
      erstattet med nye.» (vanlig bekreftelse når ingenting erstattes).
- [x] B3. Oppdater `APP.facts` fra databasen etter lagring, slik at
      banner og AI-overlay bruker de nye faktaene uten
      sideoppfriskning (refresh() i fanen laster på nytt og setter
      APP.facts).
- [x] B4. Alle `school_facts`-lesinger filtrerer `deleted_at is null`
      og sorterer på `created_at`. Bump `?v=20260611g`, commit Del B.

      Merk: manuell sletting av enkeltfakta i fanen beholder hard
      delete (utenfor oppgavens omfang).

## DEL C: Forbedret AI-import av skolerute

- [ ] C1. Ny prompt i `ai-parse-skolerute`:
      - Kun DAGER UTEN UNDERVISNING trekkes ut, klassifisert som
        `ferie` | `helligdag` | `planleggingsdag`. AI får IKKE bruke
        `annet` (typen beholdes i skjemaet, kun for manuelle
        oppføringer).
      - Eksplisitte eksempler i prompten på hva som hoppes over:
        «første skoledag», «siste skoledag», «skolestart etter
        jul/påske» — milepæler brukes kun til å utlede ferieperioder
        (gjenbruk fra gammel prompt).
      - Sikkerhetsnett ETTER AI-svaret i edge-funksjonen: dropp rader
        der tittelen matcher /skoledag|skolestart|skoleslutt/i, uansett
        AI-klassifisering; ukjente typer normaliseres bort fra `annet`.
- [ ] C2. Skoleår-forankring i `ai-parse-skolerute`:
      - Frontend sender `school_year` ('25/26') i body; funksjonen
        beregner gyldig intervall (1. aug 2025 – 31. jul 2026).
      - Prompten instruerer: datoer i august–desember får startåret,
        januar–juli sluttåret.
      - Validering etter tolking: datoer utenfor intervallet → feil
        med melding «Dette ser ut som skoleruten for XX/YY, men aktivt
        skoleår er 25/26. Bytt skoleår under Skoleår-fanen først,
        eller sjekk teksten du limte inn.» (XX/YY utledes fra
        datoene). Frontend viser meldingen som toast.
- [ ] C3. Tydelig skoleår i grensesnittet (app.js):
      - Banner øverst i Skolerute-fanen: «Aktivt skoleår: 25/26
        (uke 33 2025 – uke 24 2026)» — uker fra
        `school_year_start_week`/`school_year_end_week`.
      - I lim-inn-seksjonen, rett over tekstfeltet: «Skoleruten du
        limer inn tolkes for skoleåret 25/26».
- [ ] C4. Forhåndsvisning før lagring (erstatter dagens `confirm()`):
      - AI-kallet kjøres med `medAIOverlay('AI tolker skoleruten …', …)`.
      - Resultatet vises som redigerbare rader: tittel (input),
        fra/til (date-inputs), type (select), stryk-knapp per rad.
        Full dato med årstall vises («5.10.2025»).
      - Valg: «Erstatt eksisterende skolerute for skoleåret»
        (standard) eller «Legg til». Erstatt = soft-delete av
        eksisterende `school_calendar`-rader med start_date i
        skoleårets datointervall, deretter insert av de nye.
      - Ingenting lagres før brukeren trykker «Lagre»
        (via `medLagreOverlay`).
      - IKKE rydd opp i eksisterende feilaktige 26/27-oppføringer
        (gjøres manuelt).
- [ ] C5. Bump `?v=`, commit Del C.

---

## Manuelle steg i Supabase Dashboard (etter koding)

1. **SQL Editor:** kjør `011_softdelete_facts_kalender.sql`
   (FØR ny frontend tas i bruk).
2. **Edge Functions → re-deploy:** `ai-parse-skolerute` (eneste
   edge-funksjon som endres — `generate-facts` og `ai-parse-sessions`
   røres ikke).

## Avgrensninger
- Fredede rotfiler, `info/` og `dev/` røres ikke (appsscript.gs er
  kun lest).
- `annet`-typen beholdes i den manuelle «Legg til»-dialogen.
- Ingen opprydding i eksisterende 26/27-rader i skoleruten.

---

## Beslutninger tatt (tidligere runder — gjelder fortsatt)
- Fellesundervisning (oppgave 6) er løst som «koblede kopier»: én rad
  per klasse med felles `shared_group_id`. Kortene viser
  «👥 Felles med …»; redigering skjer per klasse-kopi.
- Fridagsblokkering gjelder typene ferie/helligdag/planleggingsdag.
  Typen «annet» blokkerer ikke (kan være arrangement på vanlig skoledag).
- Elevtilgang: forsiden beholder den åpne klasselisten. Ingen kodeendring.
- Konflikthåndtering: navngitt varsel — «Økten er endret av [navn]
  ([tidspunkt]) — last inn på nytt før du lagrer».

## Arkiv: oppgave 1–8 (fullført 11.06.2026)
Alle åtte oppgavene fra gjennomgangen av FUNKSJONELL-BESKRIVELSE.md er
fullført og merget til main: sporbarhet (migrasjon 007), skolenøytrale
funfacts, fridagsblokkering (`finnFridag`), kollegahjelp (migrasjon
008), rollegrenser i databasen (migrasjon 009), fellesundervisning
(migrasjon 010), elevtilgang (avklart, ingen endring) og
konflikthåndtering med navngitt varsel. Migrasjon 004–010 er kjørt;
`GEMINI_API_KEY` er satt og `006_fix_school_facts_rls.sql` bekreftet
kjørt i prod.
