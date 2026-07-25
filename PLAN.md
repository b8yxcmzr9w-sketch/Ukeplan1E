# PLAN — Ukeplan1E v4

## STATUSLINJE (oppdateres hver økt, i samme commit som resten av PLAN.md)

- **Siste fullførte P-nummer:** P41
- **Pågående:** ingen
- **Neste ledige P-nummer:** P42
- **Dato sist oppdatert:** 25. juli 2026
- **Åpne sjekkpunkter som ikke kan lukkes ennå:** P33s langtidssjekk —
  «Nå»-knappen etter skoleslutt (juli 2027 med 26/27 aktivt); maskinverifisert,
  ekte manuell bekreftelse skjer naturlig når datoen inntreffer

---

## Backlogg (leses herfra — aldri fra hukommelse eller prosjektminne)

> Verifisert mot koden på main 22. juli 2026 (P39). Punkter merket «(P40)» er
> løftet fra fullførte plan-seksjoner 23. juli 2026 uten ny kodeverifisering.
> UX/mobil-ønsker ligger i egen fil: `BACKLOGG-UX-MOBIL.md` (der er punkt 1
> delvis tatt av P6 og punkt 4 lukket som P7; punkt 2 «parti-filter i
> elevfilter» og punkt 3 «faner/Min plan-omstrukturering» står åpne).
> Innholdet dupliseres ikke hit.

### Klar til bygging

- **Ferie-filtrering i AI-økt-import** (sekundærfunn under P32). Prompten i
  `ai-parse-sessions` har ingen ferie-instruks og mottar ikke skoleruten — AI
  lager økter av «Vinterferie»-tekst. Delvis avbøtet av P30-forhåndsvisningen
  (fridag-rader flagges gule, rader uten fag blir røde og importeres aldri),
  men kjernen står.
- **Uke-først i `ai-parse-sessions`** (P40; fra uke-først-runden og P30).
  Edge-funksjonen bruker ennå ikke uke-først-mønsteret fra
  `ai-parse-skolerute` (skoleår i prompt, datoberegning i kode). Henger
  naturlig sammen med ferie-filtreringspunktet over (samme prompt/funksjon).
  Mulig samtidig utvidelse fra P30: uke-spenn per rad i importen (én rad =
  én uke i dag).
- **Uke-navigator: Enter-tast registreres ikke.** Begge uke-feltene har kun
  `onchange` og står ikke i et skjema (app.js ~1209 elev, ~1819 lærer);
  tooltip sier likevel «trykk Enter».
- **Default-uke lander feil ved åpning av ikke-aktivt skoleår.** Årsvelgeren
  bytter år uten å beregne uke på nytt (app.js ~1759); uke-seedingen bruker
  lagret uke uansett år. Bytte fra 25/26 uke 30 til 26/27 → står på uke 30.
- **Kopiere økter mellom skoleår + skoleår-skille i «Alle mine økter».**
  Kopiering går alltid inn i aktivt skoleår, ingen målårsvelger (app.js ~2712,
  ~2938); «Alle mine økter» er låst til aktivt år (app.js ~2000).
- **Fargekoding per klasse** — egen planleggingsrunde før bygging. Farge
  finnes i dag kun på fag (`subjects.color_hex`) og fargetema; ingen
  klassefarge i skjema eller app.js.
- **Admin bulk-utvalg på tvers av alle læreres økter** (P40; fra gammel
  backlogg) — egen planleggingsrunde før bygging. Lærer kan i dag bare
  bulk-velge egne økter; vurder om admin skal kunne bulk-velge ALLE økter i
  en klasse/uke for opprydding på vegne av skolen. Må avklares: tydelig
  bekreftelse (sterkere enn kollegahjelp-dialogen?), angre-muligheter, og
  RLS-policy som lar admin endre alle økter i egen skole.

### Venter på svar fra Morfar

- ~~**Funfacts-forenkling**~~ — AVKLART 25. juli 2026: (a) fritekst,
  (b) brukeren velger selv mellom «Erstatt alle» og «Fyll opp med nye»
  (revidert samme dag: «Erstatt 50 % (de mest sette)» utgikk).
  Se «Økt (P41)» nederst.
- **Skoleår-dimensjon for fag/klasser/subject_divisions** — status
  «utredning, ikke bygg», 5 åpne punkter, se UTREDNING-skolear-oppsett.md
  (seksjonen «Åpne punkter (avklares før bygging)»).
### Lav prioritet / ikke aktiv

- **Cosmetic: boks-i-boks i Skoleår-fanen** (lav prioritet). P24 legger fanen
  i felles `.settings-card`, og `renderSkoleaarTab` bygger i tillegg egen
  `.subj-config-box` inni → boks i boks.
- **Preview-deployments Cloudflare/Netlify** (backlogg, ikke aktiv). Ingen
  deploy-konfig i repoet i dag.
- **Syntetiske testfag i prod-databasen** (P40; fra importrunden 014–016).
  Fag uten ekte motpart (norsk, matte, engelsk, kroppsøving + ev. YFF) med
  syntetiske økter fra migrasjon 013 beholdes «inntil videre» — vurder
  opprydding før live.

---

## Økt 7 (P40): Rydde planfiler — minimere .md-størrelse

**Branch:** `claude/rydde-planfiler-01u0jz` (miljøets tildelte branch —
oppgaveteksten sa `claude/PN-rydde-planfiler`, samme situasjon som P34–P39).
**Scope:** KUN `PLAN.md` + `DECISIONS.md`. Ingen kode i `v4/`, ingen
cache-bust, ingen migrasjon, ingen edge functions.

PLAN.md var ~197 KB og inneholdt hele prosahistorikken fra P7 og oppover.
Git + PR-ene ER historikken — alle fullførte plan-seksjoner er slettet (ingen
PLAN-ARKIV.md). Uavsluttede tråder er løftet til backloggen over; begrunnelser
som ikke sto i DECISIONS.md er flyttet dit.

### Sjekkliste

- [x] Fase 1: hele PLAN.md lest (100 %), A/B/C-rapport godkjent av Morfar
      («kjør» mottatt: A6/A7/B8 kast, A2 som åpent spørsmål, A1 ikke duplisert)
- [x] Tråder løftet til backlogg: uke-først i ai-parse-sessions (+uke-spenn),
      admin bulk-utvalg, P32-opprydding (åpent spørsmål m/SQL), syntetiske
      testfag
- [x] 7 begrunnelser lagt inn i DECISIONS.md (P10, 018, P27, P33, P12,
      stående valg fra tidligere runder, import 014–016)
- [x] Alle fullførte plan-seksjoner (P2–P39) slettet fra PLAN.md
- [x] Verifisert: kun PLAN.md + DECISIONS.md berørt (git diff --stat)
- [x] Commit + push + PR

---

## Økt (P41): Funfacts-forenkling

**Branch:** `claude/p41-funfacts-forenkling-9hx7zx` (miljøets tildelte branch —
oppgaveteksten sa `claude/p41-funfacts-forenkling`, samme situasjon som P34–P40).
**Status:** FULLFØRT OG VERIFISERT 25. juli 2026 — kode merget til main
(squash, PR #149), Morfars manuelle steg (migrasjon 021 + deploy av
generate-facts) gjennomført, og frontenden verifisert i produksjon av Morfar
etter merge.

### Mål

1. Poolen settes til 20 funfacts (i dag 100).
2. De to genereringsmåtene («✨ Generer med AI» ~40 additivt + «🔄 Generer nye
   funfacts nå» bytt-5-mest-viste) slås sammen til ÉN «Forny»-handling der
   brukeren velger: **«Erstatt alle»** (alt ut, 20 nye inn) eller
   **«Fyll opp med nye»** (behold alt, generer `20 − antall aktive`).
   (Revidert 25. juli 2026: tidligere forslag «Erstatt 50 % (de mest sette)»
   UTGÅR — det slettet nettopp de mest populære faktaene, som var uønsket.)
3. Nytt fritekst-felt i admin (Funfacts-fanen) for temastyring, som sendes med
   til `generate-facts` som ekstra instruksjon. Kun fritekst — ingen automatisk
   innblanding av skoleinfo.
4. Synlig visningsteller i admin: `view_count` (finnes allerede, migrasjon 018)
   vises som kolonne per funfact i Funfacts-fanen, og listen sorteres synkende
   på `view_count` (mest sette øverst). Ingen ny sporing — admin sletter
   uønskede per rad manuelt som i dag (soft delete).

### Kartlegging (dagens tilstand, verifisert 25. juli 2026)

- **Lagring:** tabell `school_facts` (001_initial_schema.sql:149) med
  `id, school_id, fact_text` + `created_at`/`deleted_at` (migrasjon 011) +
  `view_count` (migrasjon 018_funfacts_view_count). RLS: lesing åpen for alle
  (`facts_read_public`, 002_rls.sql:203), skriving admin
  (`facts_write_admin`, sist oppdatert i 018_admin_additiv.sql:63).
  Pool-tak i dag: `MAKS = 100` i `renderFaktaTab` (app.js:5173) med
  FIFO-utkasting av eldste; overskrift «Funfacts (X/100)» (app.js:5155).
- **Genereringsmåte 1:** knapp «✨ Generer med AI» i `renderFaktaTab`
  (app.js:5162–5208) — kaller `sb.functions.invoke('generate-facts')`,
  legger ~40 nye ADDITIVT til lista, soft-deleter eldste over 100.
- **Genereringsmåte 2:** knapp «🔄 Generer nye funfacts nå» (app.js:5210–5224)
  — kaller `fornyFunfactsRotasjon()` (app.js:449–465): genererer, tar 5 første,
  soft-deleter de 5 med høyest `view_count`, setter inn 5 nye.
  I TILLEGG finnes en AUTOMATISK fornying: `sjekkOgFornyFunfacts`
  (app.js:437–446) kjøres etter hvert AI-overlay (app.js:431) og fornyer
  stille når en setning har ≥ 3 visninger (kun for admin).
- **View-count:** `increment_fact_view(p_fact_id)` (SECURITY DEFINER,
  migrasjon 018_funfacts_view_count) kalles fra `medAIOverlay` sin
  `nesteFakta()` (app.js:387) hver gang en fakta vises i AI-ventebildet.
  `view_count` brukes til sortering «mest sette» i `fornyFunfactsRotasjon`.
- **Admin-fanen:** `renderFaktaTab(container)` (app.js:5145), montert som
  fane 7 «Funfacts» i `renderAdminPanel` → `setTab` case 6 (app.js:3751).
  Temafeltet hører hjemme her. Lagringssted: `schools`-tabellen (ny kolonne)
  — admin har allerede skriverett via `schools_write_admin`
  (019_admin_panel_rls.sql:31), så INGEN RLS-endring trengs.
- **Edge function:** `generate-facts/index.ts` — prompten er hardkodet
  «Lag 40 …» med fast temablanding utledet av skolenavnet (byggPrompt,
  linje 55–78); leser skolenavn selv fra DB (linje 99), ignorerer alt i
  request-body utover autentisering.

### Delplan

**A. DB-migrasjon — ⚠️ MANUELT STEG (Morfar kjører i Supabase SQL Editor):**
- [x] Ny fil `v4/supabase/migrations/021_funfacts_tema.sql`:
      `alter table schools add column if not exists facts_theme text;`
      (nullable fritekst; idempotent). INGEN RLS-endring — eksisterende
      `schools_write_admin` + `schools_read_public` dekker skriving/lesing.

**B. Edge function `generate-facts` — ⚠️ MANUELT STEG (Morfar deployer i
Supabase Dashboard etter kode-endring i repo):**
- [x] Antall styres av `count` i request-body (20 for «Erstatt alle»,
      `20 − antall aktive` for «Fyll opp med nye»), validert i koden
      (heltall 1–20, default 20).
- [x] Funksjonen leser `facts_theme` selv fra `schools` (samme spørring som
      i dag henter `name`) og fletter det inn i prompten som en egen
      «Ekstra ønske fra skolen»-instruksjon når feltet er utfylt. Kun
      tekstens innhold — ingen annen skoleinfo blandes inn automatisk.
      (Skolenavnet brukes som i dag, uendret.)

**C. Frontend `v4/app.js` + cache-bust (ingen manuelle steg):**
- [x] Pool-konstant `FUNFACTS_MAKS = 20`; overskrift «Funfacts (X/20)».
- [x] De to genereringsknappene fjernes; ny knapp «🔄 Forny» åpner en liten
      valg-modal med to valg, begge med bekreftelse og `medAIOverlay` som i dag:
      - «Erstatt alle»: ALLE aktive soft-deletes, 20 nye genereres og settes inn.
      - «Fyll opp med nye»: eksisterende beholdes URØRT; genererer
        `20 − antall aktive` nye. Er poolen allerede full (≥ 20), er valget
        deaktivert med kort forklaring («Poolen er full — slett noen først»).
- [x] `fornyFunfactsRotasjon` skrives om til én hjelpefunksjon med
      modus-parameter (erstatt-alle / fyll-opp) som begge valgene bruker.
- [x] Liste-visningen i `renderFaktaTab`: ny kolonne med `view_count` per rad
      (f.eks. «👁 12»), og sortering synkende på `view_count` (mest sette
      øverst; likt antall → nyeste sist som i dag). Rediger/slett per rad
      beholdes uendret.
- [x] Automatisk stille fornying fjernes: `sjekkOgFornyFunfacts` + kallet i
      `medAIOverlay` sin finally (app.js:431) tas bort — «Forny» blir eneste
      genereringsvei (selve poenget med forenklingen).
- [x] Nytt fritekst-felt «Temastyring» øverst i Funfacts-fanen med egen
      lagre-knapp → `schools.facts_theme` (oppdaterer også `APP.school`).
      Hjelpetekst forklarer at det brukes ved neste «Forny».
- [x] Beholdes uendret: «+ Legg til» (manuell), rediger/slett per rad,
      `view_count`-telling og `increment_fact_view` (trengs for tellerkolonnen
      og sorteringen). Manuelle tillegg kan midlertidig overstige 20 —
      «Erstatt alle» bringer poolen tilbake til 20.
- [x] Bump `?v=YYYYMMDDx` i `v4/index.html` (CSS ved behov + JS).

**D. Verifisering (etter Morfars manuelle steg A + B):**
- [x] Migrasjon 021 kjørt i SQL Editor (Morfar, 25. juli 2026)
- [x] Ny `generate-facts` deployet i Dashboard (Morfar, 25. juli 2026)
- [x] Test i prod: «Erstatt alle» gir 20 nye; «Fyll opp med nye» fyller
      nøyaktig opp til 20 uten å røre eksisterende (og er deaktivert ved full
      pool); tellerkolonnen vises og listen sorteres mest-sett-øverst;
      temafeltet påvirker innholdet; manuell +/rediger/slett virker.
      (Sto begrunnet åpen ved merge — ingen preview-deploy; verifisert i
      produksjon av Morfar 25. juli 2026 etter merge.)
- [x] PLAN.md-sjekkliste + statuslinje oppdatert i samme økt som merge.
