# PLAN — Ukeplan1E v4

## STATUSLINJE (oppdateres hver økt, i samme commit som resten av PLAN.md)

- **Siste fullførte P-nummer:** P43
- **Pågående:** ingen
- **Neste ledige P-nummer:** P44
- **Dato sist oppdatert:** 27. juli 2026
- **Åpne sjekkpunkter som ikke kan lukkes ennå:**
  - P33s langtidssjekk — «Nå»-knappen etter skoleslutt (juli 2027 med 26/27
    aktivt); maskinverifisert, ekte manuell bekreftelse skjer naturlig når
    datoen inntreffer
  - P43s prod-sjekk — kosmetikken er maskinverifisert (18 sjekker) og merget;
    Morfars visuelle bekreftelse i produksjon gjenstår (ingen preview-deploy,
    samme mønster som P41/P42)

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

---

## Økt (P42): Kompakt «Alle mine økter»-lærervisning

**Branch:** `claude/pn-kompakt-laerervisning-05evwh` (miljøets tildelte branch —
oppgaveteksten sa `claude/P42-kompakt-laerervisning`, samme situasjon som P34–P41).
**Scope:** KUN `v4/app.js`, `v4/style.css` og cache-bust i `v4/index.html`.
Ingen DB-migrasjon, ingen edge functions.
**Status:** FULLFØRT OG VERIFISERT 27. juli 2026 — delplan godkjent av Morfar,
kode merget til main (squash, PR #150), maskinverifisert med headless
Chromium-røyktest (desktop 24 sjekker + mobil 7 sjekker, alle OK), og
verifisert i produksjon av Morfar etter merge samme dag.

**Morfars svar på de åpne spørsmålene (27. juli 2026):**
1. Prototypen godkjent som den er, med justeringene under.
2. Kapittelhint = `info`-feltet, dempet inline etter tittelen (ikke ny
   funksjon — den grå teksten visningen alt viser). 📍 oppmøte utelates i
   kompaktmodus.
3. Liten dempet klasse-etikett mellom dato og fagkode-pill.
4. Mobil-kortlisten uendret i denne økten; kompakt-på-mobil lagt som punkt 5 i
   `BACKLOGG-UX-MOBIL.md`.

**Ekstra regel (Morfar):** «vis kun ved første forekomst» gjelder uke, dato OG
klasse — ukenummer på ukas første rad, dato på dagens første økt, klasse ved
klassebytte innen dagen. Tomme celler beholder fast bredde (tomrom er
informasjon). Implementert med klasse-gruppering innen dagen i sorteringen
(dag → fridag først → klasse → fag) så mønsteret blir meningsfullt.

### Kartlegging (FASE 1, verifisert 25. juli 2026)

- **Render-funksjon:** `renderAlleOkterTab(container, autoScroll)`
  (app.js:1976–2280), montert fra `setTab` i `renderLaererView`
  (app.js:1577). Henter lærerens økter (aktivt skoleår) + skoleruten,
  grupperer per uke og sorterer i skoleår-rekkefølge via `ukePosisjon`.
- **Ukeoverskrifter i dag:** én `h3.min-plan-uke[data-uke=N]` per uke
  («Uke N», app.js:2136). Overskriftene er ANKRE for tre mekanismer:
  «Nå»-knappens scroll-mål (app.js:2221–2260), P22-scroll-spy
  `_lastTopWeek` (app.js:2263–2278) og `scroll-margin-top` (style.css:664).
- **Økt-rader i dag:** desktop = `div.min-plan-rad` (flex, app.js:2182–2198)
  med kolonner ☑ / klasse+dag+dato / fagkode-pill, deretter innholds-huggende
  P/G / aktivitet / oppmøte / info + kebab (style.css:683–723; radhøyde
  drives av `padding: 7px 4px`). Mobil (≤700px) = kort-liste med
  `renderSessionCard` (app.js:2203–2214).
- **Feltkilder:** fagkode = `subjects.short_code` (fallback `name`) +
  `subjects.color_hex` (app.js:2188–2189); dato beregnes fra uke + skoleår
  via `skoleaarKalenderaar` + `isoWeekToDate` + `formatDatoNO`
  (app.js:2172–2174); «tittel» = `sessions.activity` (app.js:2191);
  eget kapittel-felt FINNES IKKE i skjemaet — kandidaten til kapittelhint
  er `sessions.info` (app.js:2193) eller kapittel skrevet inn i
  aktivitetsteksten. Avklares (åpent spørsmål 2).
- **Ferie/fri i dag:** `lagFridagMerke` (app.js:2073–2087) → blokk-rad
  `div.min-plan-fridag` sortert inn på dagsposisjon; rene ferieuker får
  merket rett under ukeoverskriften (app.js:2144–2147).
- **Sticky i dag:** `.fane-bar` er allerede sticky (style.css:419–424);
  klassevelgeren (fane 0) ligger i den. Bulk-baren (app.js:2111) og en
  eventuell modusvelger er IKKE sticky i dag.

### Mål (fra oppgaven)

Kompakt listevisning med faste kolonner per rad — tomrom er informasjon,
IKKE auto-fit grid:

1. **Uke-kolonne** (primær tidsenhet): ukenummer kun på ukas FØRSTE rad,
   tom celle (fast bredde) på resten av ukas rader.
2. **Ukedag + dato**-kolonne, deretter **fagkode-pill**, deretter
   **tittel** på én linje med **kapittelhint inline i dempet farge**.
3. Tittel avkortes til én linje med ellipse. «mer…» vises inline til
   høyre KUN når teksten faktisk overflyter (målt `scrollWidth >
   clientWidth`, re-måles ved resize); klikk folder ut/inn.
4. Hover viser full tekst via `title`-attributt — kun på enheter med
   ekte hover (`@media (hover: hover)`-vakt i JS/CSS).
5. Halvert radhøyde i forhold til dagens rader.
6. Ferie/fri som TYNN markør-rad med ukenummer i samme uke-kolonne —
   ingen egen overskriftsrad.
7. «Kompakt»/«Detaljer»-toggle: Detaljer fjerner avkortingen.
8. Sticky klasse-/modusvelger.

### Delplan

**A. Kompakt rad-layout (app.js + style.css):**
- [x] Uke-KOLONNE i kompaktmodus: fast smal første kolonne med ukenummer kun
      på ukas første rad (økt eller fridag), tom ellers. h3-overskriftene
      beholdes i DOM (mobil-ankre) men skjules på desktop via CSS;
      `data-uke` + `.mp-anker` ligger på ukas første rad, så «Nå»-knapp,
      P22-scroll-spy og `scroll-margin-top` har ankre i begge moduser.
- [x] Faste kolonner (flex med faste bredder, IKKE auto-fit grid):
      ☑ · uke · dag+dato · klasse (dempet) · fagkode-pill · tittel
      (+kapittelhint = `info` dempet inline i parentes; P/G-parti tas med i
      hintet) · kebab ytterst til høyre. Tomme celler beholder bredden.
      «Første forekomst»-regelen for uke/dato/klasse (se over).
- [x] Halvert radhøyde: målt 22px kompakt mot 43px detaljer (headless).
      Én tekstlinje, `white-space: nowrap` + `text-overflow: ellipsis`.
- [x] Fridager: tynn markør-rad (`.mpk-fridag`) i samme kolonne-oppsett med
      ikon + tittel + type + datospenn dempet. Rene ferieuker = én slik rad
      (mobilen beholder P18-merket via `.mp-kun-mobil`).
- [x] Klasse-etikett mellom dato og fagkode-pill (Morfars svar 3).

**B. «mer…»-utfoldning + hover-title (app.js):**
- [x] `maalOverflyt()` måler `scrollWidth > clientWidth` per tittelfelt etter
      layout; «mer…» vises kun da, inline til høyre. Klikk toggler utfoldet
      (`.utvidet` fjerner nowrap → full tekst, knapp → «mindre»). Debounced
      `resize`-lytter re-måler, ryddes ved re-render som `_obs`/`_spyObs`
      (+ sentinel som fjerner lytteren når en annen fane tar containeren).
      Kryssing av 700px-brekkpunktet re-rendrer fanen (ankervalg avhenger
      av det; posisjon bevares via `_lastTopWeek`).
- [x] `title`-attributt med full tekst kun under `matchMedia('(hover: hover)')`.

**C. Kompakt/Detaljer-toggle + sticky (app.js + style.css):**
- [x] Toggle «Kompakt | Detaljer» øverst i fanen. Kompakt = standard;
      Detaljer = dagens rad-layout UENDRET (inkl. 📍 oppmøte, uten
      avkorting som i dag). Valget huskes funksjons-statisk
      (`renderAlleOkterTab._modus`, samme prinsipp som `_lastTopWeek`).
- [x] Togglen er sticky rett under den stickye `.fane-bar` (px-topp måles i
      JS); klassevelgeren ligger i faneraden fra før → «sticky klasse-/
      modusvelger» uten å røre fane-raden. Skjult på mobil.
- [x] Bulk-valg (☑ + bulk-bar), kebab-meny og høyreklikk beholdes i
      begge moduser (felles `lagCheckbox`-synk som før).
- [x] Mobil (≤700px): kort-listen uendret (verifisert headless; kompakt-på-
      mobil → `BACKLOGG-UX-MOBIL.md` punkt 5).
- [x] Bump `?v=20260727a` i `v4/index.html` (CSS + JS).

**D. Verifisering:**
- [x] Maskinverifisert (headless Chromium med stubbet Supabase, desktop
      1200px + mobil 480px): uke/dato/klasse kun ved første forekomst med
      bevart tomrom; fridager som tynne markører med riktig ukenummer;
      «mer…» kun ved faktisk overflyt + folder ut/inn; title-attributt;
      modusbytte begge veier; mobil-kortliste uendret; ingen JS-feil.
- [x] Morfars sjekk i produksjon etter merge: «Nå»-knapp + auto-scroll +
      P22-retur («der du slapp») i begge moduser, «mer…» ved vindus-resize,
      og generelt utseende mot prototypen. (Verifisert i produksjon av
      Morfar 27. juli 2026 — «godkjent!».)
- [x] PLAN.md-sjekkliste + statuslinje oppdatert i samme økt.

---

## Økt (P43): Dobbel parentes i kompaktmodus + «planleggingsdag» → «undervisningsfri»

**Branch:** `claude/pn-doble-parentes-planleggingsdag-0bh4ly` (miljøets tildelte
branch — oppgaveteksten sa `claude/PN-kort-beskrivelse`, samme situasjon som
P34–P42).
**Scope:** KUN `v4/app.js` + cache-bust i `v4/index.html` (+ CLAUDE.md-notat).
Ingen DB-migrasjon, ingen edge functions, ingen manuelle Supabase-steg.
**Status:** FULLFØRT 27. juli 2026 — kode merget til main (squash, PR #152),
maskinverifisert med headless Chromium (18 sjekker, alle OK). Kun Morfars
visuelle prod-sjekk gjenstår (begrunnet åpent punkt, se sjekklisten).

**Morfars justering ved godkjenning (27. juli 2026):** Endring 1 løses IKKE
med parentes-stripping — parentes-innpakkingen i kompaktraden fjernes helt,
og info vises nøyaktig som lagret, visuelt skilt med dempet valør (som i
Detaljer) + «·»-skille. Detaljer-modus forblir uendret (rå visning). Ingen
tittel-dedup i fridag-merkene — kun visningstekst «undervisningsfri».

### Kartlegging (FASE 1, verifisert 27. juli 2026)

**Funn 1 — dobbel parentes i kompaktmodus:**
- **Kompakt:** `lagKompaktRad` (app.js:2101–2141) bygger
  `hint = [partitekst, s.info].join(' · ')` (app.js:2107) og pakker HELE
  hintet i parentes: `(${hint})` (app.js:2113, samme i hover-tooltip
  app.js:2116). Info lagret som «(Klær til naturbruk, kap. 2)» blir dermed
  «((Klær til naturbruk, kap. 2))».
- **Detaljer:** desktop-raden viser `s.info` RÅTT uten innpakking
  (app.js:2362, `.mp-info`). Mobil-kortlisten bruker `renderSessionCard`
  (delt med elevvisningen, app.js:1406/1447) — også rå visning.
- **Datanivå:** koden legger ALDRI til parentes ved lagring (økt-modalene
  sender tekstfeltet rått, AI-importen likeså). Importmigrasjonene 014–016
  har ingen info-verdier med omsluttende parentes (015:86 har f.eks.
  `'Klær til naturbruk, kap. 2'` uten). Konklusjon: parentesene er skrevet
  inn manuelt av lærer i enkelte prod-rader → lagringen er INKONSEKVENT
  (noen med, noen uten). Robust fiks må derfor normalisere ved VISNING —
  ingen SQL-opprydding nødvendig.

**Funn 2 — «Planleggingsdag · planleggingsdag»:**
- Kategoriteksten i fridag-merket kommer fra `kalenderTypeNavn(t)`
  (app.js:172–174) som i dag KUN mapper `helligdag` → «høytid»; alle andre
  typer returneres rått. Merket rendrer «tittel · kategori» i
  `lagFridagMerke` (Detaljer, app.js:2094) og `lagKompaktFridagRad`
  (kompakt, app.js:2160). Rader med tittel «Planleggingsdag» + type
  `planleggingsdag` gir dermed dobbelvisningen.
- **Datanivå:** `school_calendar.type` er enum
  `ferie|helligdag|planleggingsdag|annet` (migrasjon 012). Dette er et RENT
  RENDRINGSPROBLEM — samme mønster som helligdag→«høytid» (kun visningstekst,
  DB-verdien beholdes). Ingen migrasjon, ingen endring av eksisterende rader.
- **Andre steder `planleggingsdag` brukes (alle på DB-verdien, uendret):**
  spørringsfiltre app.js:980 (`finnFridag`), 1294/1909 (fridag-sjekk i
  elev-/klassevisning), 1998 («Alle mine økter»); ikon-fallback app.js:2077;
  admin-skolerutefanen: badge app.js:5036 + type-dropdowns app.js:5190/5251
  (begge bruker alt `kalenderTypeNavn` som etikett → får ny tekst gratis);
  `ai-parse-skolerute` (GYLDIGE_TYPER + prompt, index.ts:60/131/140 — DB-verdi,
  trenger INGEN endring); migrasjonene 012/013 (historiske, røres ikke).
- Elevvisningens fridag-etikett (app.js:1297) viser kun TITTEL, aldri
  kategori — upåvirket.

### Delplan

**A. Info uten parentes-innpakking i kompaktmodus (app.js):**
- [x] `lagKompaktRad`: parentes-innpakkingen `(${hint})` (app.js:2113/2116,
      også hover-tooltip) fjernet helt — info vises NØYAKTIG som lagret
      (parentes kun hvis læreren selv har skrevet den). Visuelt skille:
      eksisterende dempet valør `.mpk-hint` (grå, .82rem — samme valør som
      Detaljer-modusens `.mp-info`) + « · »-skille mellom aktivitet og hint
      (samme skille som alt brukes mellom P/G og info). Ingen CSS-endring
      nødvendig.
- [x] Detaljer-raden (app.js:2362) UENDRET — viser allerede info rått.
- [x] UTENFOR scope (uendret): mobil-kortlisten/`renderSessionCard` deles
      med elevvisningen og beholder rå info-visning som i dag.

**B. «planleggingsdag» vises som «undervisningsfri» (app.js):**
- [x] `kalenderTypeNavn` (app.js:172): mapping `planleggingsdag` →
      «undervisningsfri» (DB-verdien beholdes, samme mønster som
      helligdag→«høytid»). Fridag-merkene i begge moduser, admin-badge,
      begge type-dropdowns og AI-forhåndsvisningen får ny etikett automatisk
      — dropdowns lagrer fortsatt `planleggingsdag`.
- [x] CLAUDE.md-notatene om `kalenderTypeNavn` oppdatert (funksjonstabellen
      + school_calendar-beskrivelsen).

**C. Cache-bust + verifisering:**
- [x] Bump `?v=20260727b` i `v4/index.html` (kun JS — CSS uendret).
- [x] Maskinverifisert (headless Chromium, stubbet Supabase, 18 sjekker OK):
      info lagret MED parentes → enkel «(…)» i kompakt OG Detaljer (aldri
      «((…))»); info lagret UTEN parentes → uten parentes i begge; «·»-skille
      + dempet hint i kompakt; tom info → ingen hint; fridagsmerke viser
      «Planleggingsdag · undervisningsfri» i begge moduser (ingen
      «· planleggingsdag» igjen); «Høstferie · ferie» uendret;
      kalenderTypeNavn-mappingene direkte-testet; ingen JS-feil.
- [ ] Morfars sjekk i prod etter merge (NNA-økta uke 36 med «Klær til
      naturbruk, kap. 2» + en planleggingsdag i skoleruten).
      BEGRUNNET ÅPENT ved merge: ingen preview-deploy i repoet, så visuell
      bekreftelse kan først skje i produksjon etter merge (samme situasjon
      som P41/P42). Kosmetikken er maskinverifisert i mellomtiden.
- [x] PLAN.md-sjekkliste + statuslinje oppdatert i samme økt som merge.
- [x] PR #152 opprettet og squash-merget til main (ingen PR-CI i repoet —
      eneste workflow er den planlagte Supabase-keepaliven; `mergeable_state`
      var `clean`). Cache-bust `app.js?v=20260727b` bekreftet i merget main.
