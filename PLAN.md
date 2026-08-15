# PLAN — Ukeplan1E v4

## STATUSLINJE (oppdateres hver økt, i samme commit som resten av PLAN.md)

- **Siste fullførte P-nummer:** P48
- **Pågående:** ingen
- **Neste ledige P-nummer:** P49 (P45 lagt bort, P46/P47 stubbet 5. august 2026)
- **Dato sist oppdatert:** 15. august 2026
- **Åpne sjekkpunkter som ikke kan lukkes ennå:**
  - P33s langtidssjekk — «Nå»-knappen etter skoleslutt (juli 2027 med 26/27
    aktivt); maskinverifisert, ekte manuell bekreftelse skjer naturlig når
    datoen inntreffer
  - P43s prod-sjekk — kosmetikken er maskinverifisert (18 sjekker) og merget;
    Morfars visuelle bekreftelse i produksjon gjenstår (ingen preview-deploy,
    samme mønster som P41/P42)
  - P44s prod-test — migrasjon 022 kjørt og `ai-parse-sessions` redeployet
    (begge bekreftet 12. august 2026); ekte funksjonstest i produksjon med
    tekst som blander flere klasser (én egen + én fremmed) gjenstår
    (maskinverifisert med 41 sjekker i mellomtiden, samme mønster som
    P41–P43)
  - P48s prod-sjekk — utvid/lukk-raden er maskinverifisert visuelt (isolert
    CSS-harness, kompakt/utvidet desktop/utvidet mobil), men krever ekte
    AI-import (Supabase-innlogging + Gemini-kall) for full funksjonstest i
    produksjon; samme mønster som P41–P44

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

---

## Økt (P44): Trygg import til egne klasser (AI-import av økter)

**Branch:** `claude/p44-utelat-ukjent-klasse-ai-import` · **PR #154 (merget
squash til main 12. august 2026, commit `52ba6bc`)**
**Status:** FULLFØRT OG DEPLOYET 12. august 2026 — migrasjon 022 kjørt,
`ai-parse-sessions` redeployet, begge bekreftet av Morfar. Gjenstår kun ekte
funksjonstest i produksjon med tekst som blander flere klasser (se
statuslinjens «Åpne sjekkpunkter»).

> **Omfangshistorikk 4. august 2026:** startet som ren feilretting («utelat
> rader med ukjent klasse»), ble utvidet til multi-klasse-import, og landet på
> ENDELIG form: import til lærerens EGNE klasser (`user_classes`), med
> RLS-innstramming som håndhever det samme i databasen. Skriving til andre
> klasser er ikke lenger en del av P44 — det håndteres av P45 (forslag til
> kollega).

**Mål:** Én innliming kan fordele økter på lærerens egne klasser. Rader for
klasser læreren ikke er satt opp med importeres ikke, klassen kan overstyres
per rad, listen er gruppert klassevis, og databasen slipper ikke gjennom
skriving til andre klasser.

### Kartlegging (verifisert i koden 4. august 2026)

**Dagens importflyt**
- **Modal:** `visAIPasteModal` (app.js:3200–3628), åpnes fra app.js:1759 med
  `aktivKlasse`. Hele modalen er bygget rundt ÉN klasse (`klasseId`).
- **Steg 4 (flagging):** `validerRad` (app.js:3286) gir RØD ved manglende
  fag/uke/dag; `oppdaterRadStatus` (app.js:3392) gir GUL ved fridag/kollisjon.
- **Steg 5 (insert):** app.js:3553–3623. Insert-løkka hardkoder
  `class_id: klasseId` (app.js:3580) og forkaster AI-ens klasseverdi —
  `byggRad` leser aldri `s.class_id`. Rader for en fremmed klasse havner
  derfor i DAGENS klasse.
- **Gul boks:** app.js:3525–3535 bygger `.advarsel-tekst` (gul, style.css:874)
  av `data.warnings` — fritekst fra Gemini (prompt index.ts:99). Prompten har
  ingen VARSLER-regler; `rensVarsel` (app.js:5221) luker i dag bare `week_nr`.

**Skjema og tilgang**
- `user_classes` = tildelt/underviser (bekreftet). `class_contact_teachers`
  finnes i skjemaet, men appen skriver aldri til den (jf. migrasjon 009);
  INSERT-vernet bygger derfor på `user_classes`.
- **RLS i dag er skoleomfattende:** `sessions_insert_laerer` (migrasjon 008)
  sjekker kun `school_id`, `created_by = auth.uid()` og at `teacher_id` hører
  til skolen — ingen klassebegrensning. Det er dette steg E strammer.
- **Parti/gruppe er per klasse** (migrasjon 017). Modalen laster i dag kun
  divisjoner for aktiv klasse (app.js:3213–3215) → må lastes for alle egne
  klasser og filtreres på RADENS klasse.
- **Kollisjonssjekken** laster bare aktiv klasses økter (app.js:3217–3221) →
  må gjøres per klasse.
- **Fridagssjekken er allerede skoleomfattende:** `finnFridag` (app.js:972–985)
  slår opp i `school_calendar`, som ikke har `class_id`. Ingen endring.
- **Tabellen** er et 10-kolonners CSS-grid (style.css:886) + mobilregler
  (style.css:909–916). Ny klasse-kolonne må inn begge steder → CSS endres, så
  BÅDE css- og js-versjon må cache-bustes.
- **Utenfor scope:** separate økter per klasse, ikke fellesøkter
  (`shared_group_id`, migrasjon 010).

**Funn som påvirker steg E (se «Avvik» nederst)**
- Fire innsettingssteder setter `teacher_id` fra et nedtrekk, ikke til seg
  selv: «Ny økt» (app.js:2657), «Kopier økt» (app.js:2820), redigermodalens
  kopi (app.js:2941), bulk-kopi med «behold lærer» (app.js:3174) — og
  AI-importen selv (app.js:3585), der `matchLaerer` forhåndsvelger en KOLLEGA
  når fornavnet i teksten matcher. Migrasjon 008 la eksplisitt til rette for
  dette («økt kan registreres på en kollega»).

### Delplan

**A. Edge function `ai-parse-sessions` (krever manuell redeploy):**
- [x] Nytt felt per økt i prompten: `"class_name"` = klassenavnet NØYAKTIG slik
      det står i teksten, eller null når teksten ikke nevner klasse.
- [x] `classes`-konteksten (app.js:3516) sendes med lærerens tildelte klasser,
      ikke bare aktiv klasse. Frontend er likevel fasit for matchingen.
- [x] Ny VARSLER-seksjon etter mønsteret fra `ai-parse-skolerute`: klarspråk,
      aldri feltnavn (`class_id`, `week_nr`), aldri JSON/null, og aldri
      påstander om hva som blir importert (frontend eier den beskjeden).

**B. Klassematching per rad — mot `user_classes`:**
- [x] Modalen laster lærerens tildelte klasser (`user_classes`, ikke-slettede,
      sortert på navn).
- [x] Matcheregel (normalisert: trim + små bokstaver + fjernede mellomrom):
      - `class_name` matcher egen klasse → radens `class_id` settes.
      - `class_name` finnes, men ikke i `user_classes` → rad RØD, utelatt,
        merknad «Ukjent/annen klasse (X) – importeres ikke».
      - `class_name` = null → aktiv klasse (som i dag).
- [x] Kant-tilfelle: er AKTIV klasse ikke blant lærerens egne (klassevelgeren
      viser også «Andre klasser»), blir fallback-radene røde med samme
      merknad — de kan reddes ved å velge en egen klasse i nedtrekket.
- [x] `validerRad` gir `roed = true` uten gyldig klasse → eksisterende
      utelatingsfilter i Steg 5 fanger raden automatisk.
- [x] BAKOVERKOMPATIBELT: uten `class_name` i svaret havner alt i aktiv klasse
      — nøyaktig som i dag.

**C. Redigerbar klasse per rad:**
- [x] Ny kolonne «Klasse» med nedtrekk som viser KUN lærerens egne klasser.
      Ingen skriving til andre klasser i P44.
- [x] Rød rad kan reddes ved å velge en egen klasse.
- [x] Klassebytte re-validerer raden: parti/gruppe bygges på nytt for den nye
      klassen (ugyldig valg nullstilles) og kollisjonssjekken kjøres på nytt.
- [x] CSS: grid-template (style.css:886) + mobilregler (909–916) utvides.

**D. Klassevis gruppering:**
- [x] Rader grupperes under klasseoverskrift, sortert på klassenavn; innen
      gruppen sortert på uke og dag.
- [x] Ugyldige rader nederst i egen gruppe «Uten gyldig klasse – importeres
      ikke».
- [x] Klassebytte flytter raden til riktig gruppe umiddelbart; «+ Legg til
      rad» legger raden i aktiv klasses gruppe.

**E. Ingen GJETTING av lærer — men manuelt lærervalg beholdes (alternativ 2,
justert 5. august 2026 — se «Endring 5. august» nedenfor):**
- [x] Lærer-kolonnen BEHOLDT i forhåndsvisningen, ved siden av Klasse-kolonnen
      (grid 10 → 11 kolonner igjen). `users`-spørringen i modalen beholdt.
- [x] Nedtrekket fylles fra skolens lærere og settes til `APP.profile.id` som
      standard på HVER rad, uansett hva AI-en måtte ha foreslått — en hel
      årsplan limt inn havner dermed automatisk på deg.
- [x] Manuell overstyring per rad er tillatt: læreren kan bevisst velge en
      kollega i nedtrekket.
- [x] Insert bruker `rad.laererSel.value` (fallback `APP.profile.id`), ikke
      hardkodet `APP.profile.id`.
- [x] `matchLaerer` (tidligere app.js:3284, fornavn-matching) er IKKE
      gjeninnført — nedtrekket forhåndsvelges aldri fra tekst, kun fra
      innlogget bruker.
- [x] `teachers` er FORTSATT fjernet fra AI-konteksten i kallet (app.js) OG
      fra prompten i `ai-parse-sessions` (samme redeploy som steg A) — det er
      den delen av forrige runde som besto uendret. Modellen ser aldri
      lærernavn og skal aldri gjette lærer fra teksten.

*Endring 5. august 2026:* steg E ble først bygget som «alternativ 1» (fjern
lærer-kolonnen helt, økta føres alltid på deg, ingen overstyring). Morfar bad
om å bytte til «alternativ 2» samme dag, FØR merge — kolonnen og nedtrekket er
derfor gjeninnført med standardverdi = deg selv. Det trygge fra runde 1 —
ingen `teachers` i AI-konteksten/prompten, ingen fornavn-gjetting — er
uendret. Se «Valg tatt for steg E» nedenfor for full begrunnelse.

**F. DB-migrasjon 022 — stram `sessions_insert_laerer` (manuell kjøring):**
- [x] Ny fil `022_import_egne_klasser.sql`, idempotent
      (`drop policy if exists`), kjøres manuelt i SQL Editor.
- [x] Ny arm basert på `user_classes` (IKKE `is_contact_teacher_for` — det
      ville låst ute faglærere som er tildelt klassen uten å være
      kontaktlærer), med `or is_active_admin()`.
- [x] Policyen ENDELIG bekreftet 5. august 2026: `teacher_id = auth.uid()`
      LEGGES BORT permanent (se «Valg tatt for steg E»). Migrasjon 022 slik
      den er skrevet — klassevern + migrasjon 008s kollega-sjekk beholdt —
      er den som skal kjøres, uten alternativ.

**G. Gul boks + varselvask:**
- [x] Deterministisk advarsel foran ev. AI-varsler:
      «⚠️ N rad(er) gjelder en annen klasse (1B, 2A) og importeres ikke.»
      Oppdateres når rader reddes eller strykes.
- [x] `rensVarsel` luker ut setninger som nevner feltnavn (`class_id` m.fl.,
      i tillegg til `week_nr`).
- [x] Toasten «Ingen rader klare til import…» (app.js:3566) får dekkende
      ordlyd når det som står igjen mangler gyldig klasse.

**H. Cache-bust + verifisering:**
- [x] Bump `?v=20260805c` i `v4/index.html` for BÅDE css og js.
- [x] Maskinverifisering (headless Chromium mot ekte app.js + stubbet
      Supabase): 41 sjekker, alle OK, ingen JS-feil. Dekker matching mot egne
      klasser, rødflagg + merknad for fremmed klasse, klasse-nedtrekk uten
      «Andre klasser», gul boks med godkjent ordlyd, renset AI-varsel,
      gruppering og uke-sortering, kollisjon mot RADENS klasse (ikke aktiv),
      parti/gruppe filtrert og gjenoppbygd ved klassebytte, redning av rød
      rad, insert med riktig `class_id` per rad, kvittering med fordeling per
      klasse, svar UTEN `class_name` (bakoverkompatibelt) og aktiv klasse som
      ikke er lærerens egen. Steg E (alternativ 2, 5. august): lærer-nedtrekk
      finnes i tabellen, står på deg selv som standard på hver rad, manuell
      overstyring til en kollega fungerer og insert bruker riktig
      `teacher_id` for både overstyrt og ikke-overstyrt rad, og lærerlista
      sendes fortsatt ikke til AI-en.
- [x] Morfar kjørte migrasjon 022 i SQL Editor (bekreftet 12. august 2026).
- [x] Morfar redeployet `ai-parse-sessions` i Supabase Dashboard (bekreftet
      12. august 2026).
- [x] PLAN.md-sjekkliste + statuslinje oppdatert i samme økt som merge.

### Valg tatt for steg E (endelig, godkjent 5. august 2026: alternativ 2)

**Hva skjer med lærer-kolonnen i importen?** Begge alternativene gir samme
resultat i databasen (`teacher_id` = deg selv) NÅR læreren ikke rører feltet.

- ~~Alternativ 1: fjern kolonnen helt.~~ Bygget først, men FORLATT samme dag —
  se «Endring 5. august» under steg E over.
- **VALGT — Alternativ 2: behold nedtrekket, standard = deg selv, overstyrbart.**
  En hel årsplan limt inn havner automatisk på deg (standardverdien), men
  læreren kan bevisst velge en kollega på enkeltrader — samme fleksibilitet
  som «Ny økt»/kopi har i dag, bare uten AI-gjetting.

Uansett alternativ sto `teachers`-lista alltid fast utenfor AI-konteksten og
prompten (app.js-kallet + `ai-parse-sessions`) — det var aldri en del av
valget, kun kolonnens skjebne i UI-et var det.

### Avgjørelser (godkjent av Morfar 4.–5. august 2026)

1. **Import til lærerens egne klasser** (`user_classes`). Rader for andre
   klasser importeres ikke i P44 — kollega-forslag (P45) er lagt bort, se
   Økt (P45) nedenfor.
2. **Ordlyd i gul boks:** «⚠️ N rad(er) gjelder en annen klasse (1B, 2A) og
   importeres ikke.» Radmerknad: «Ukjent/annen klasse (X) – importeres ikke».
3. **Nummerering:** P44, branch `claude/p44-utelat-ukjent-klasse-ai-import`.
4. **Klasse-nedtrekket:** kun lærerens tildelte klasser (`user_classes`).
   (Tidligere avgjørelse om «Dine klasser» + «Andre klasser» er dermed
   erstattet — «Andre klasser» skal ikke kunne velges i importen.)
5. **INSERT-vernet bygger på `user_classes`**, ikke `class_contact_teachers`
   eller `is_contact_teacher_for`.
6. **Lærervalg i importen (steg E, 5. august):** manuelt nedtrekk med standard
   = deg selv, ALDRI gjetning fra tekst/fornavn (alternativ 2 — se over).
   `teacher_id = auth.uid()`-varianten av migrasjon 022 er lagt bort permanent
   (se «Avvik fra oppgaveteksten» nedenfor — nå historikk, ikke et åpent valg).

### Avvik fra oppgaveteksten — LAGT BORT 5. august 2026 (historikk)

Den opprinnelige oppgaveteksten for steg E foreslo `teacher_id = auth.uid()` i
INSERT-policyen (kun opprette økter på seg selv). Det ble aldri kjørt, og er nå
endelig lagt bort — ikke en åpen beslutning lenger. Bakgrunnen for hvorfor den
først ble utsatt: kjørt som skrevet ville den ha stoppet «Ny økt» på vegne av
en kollega (migrasjon 008), bulk-kopi med «behold lærer», og — før steg E ble
bygget — AI-importens daværende fornavn-gjetting. Migrasjon 022 er skrevet med
kun klassevernet (P44s faktiske mål), og BEHOLDER migrasjon 008s kollega-sjekk.
Den strenge varianten er fjernet fra migrasjonsfilen (var tidligere en
utkommentert blokk der); et historikknotat står i selve SQL-filen. **P46
handler etter dette KUN om innstramming av REDIGERING av andres økter** —
opprettelse er avgjort.

---

## Økt (P45): «Foreslå økt til kollega» — LAGT BORT 5. august 2026

**Status:** LAGT BORT uten å ha blitt startet. Seksjonen beholdes for
historikken; ingen kode ble skrevet.

**Begrunnelse:** kollega-innlegging brukes sjelden i praksis, og risikoen for
at noe havner i feil lærers plan veier tyngre enn nytten. P46 strammer inn slik
at en lærer kun skriver i egne klasser — da forsvinner behovet forslags-
mekanismen skulle dekke. Med AI-importen er det uansett lite arbeid for hver
lærer å legge inn sine egne økter.

**Mål:** økter som gjelder en annen klasse sendes som forslag til en lærer som
er tildelt den klassen; mottakeren godtar eller avviser. In-system, ikke
e-post.

**Skisse fra oppgaveteksten (ikke kodeverifisert ennå):**
- Utvid `pending_transfers` — eller nytt bord, f.eks.
  `pending_session_proposals` — til å bære UINNSATTE forslag: `class_id`,
  `subject_id`, `division_id`, `week_nr`, `day_of_week`, `activity`,
  `meeting_point`, `info`, `from_user`, `to_user`, `status`, `seen_at`.
- Innboks-UI: mottaker ser innkommende forslag, godtar → økta opprettes i
  mottakerens klasse under mottakerens eierskap (RLS-rent), eller avviser.
- Kobles til importen senere: røde «annen klasse»-rader kan sendes som forslag
  i stedet for bare å utelates.
- E-postvarsel er valgfritt tillegg, ikke del av P45s kjerne.

**Avhengighet:** P44s RLS-innstramming (migrasjon 022) er forutsetningen —
den er grunnen til at «annen klasse» må gå veien om et forslag.

---

## Økt (P46): Innstramming — redigering av andres økter — IKKE STARTET

**Omfang justert 5. august 2026:** den strenge `teacher_id = auth.uid()`-
varianten av migrasjon 022 er LAGT BORT permanent i P44 (se Økt (P44), «Avvik
fra oppgaveteksten» — nå historikk, ikke lenger et åpent valg for P46).
Opprettelse av økter på en kollega er avgjort: fortsatt lov, med bevisst
manuelt lærervalg og uten AI-gjetting.

P46 handler etter dette KUN om ev. innstramming av REDIGERING av andres
økter — kollegahjelp-regelen fra migrasjon 008 («alle innloggede ved samme
skole kan oppdatere sessions», med advarselsdialog i UI) er urørt av P44 og
står fortsatt åpen for vurdering. «↗️ Overfør»-knappen (umiddelbar overføring,
ingen godkjenning — se kartografien under Økt (P45)) hører også hjemme her
hvis den skal revurderes. Detaljeres i egen økt.

---

## Økt (P47): Lett varsel — «økt lagt i din arbeidstid» — IKKE STARTET

**Mer relevant etter P44s steg E (alternativ 2):** siden lærere fortsatt kan
bevisst legge en økt på en kollega via importens nedtrekk (eller «Ny
økt»/kopi), er varselbehovet reelt — når du bevisst legger en økt på en
kollega, er det den kollegaen som bør varsles. Enkelt varsel til læreren når
noen legger en økt som berører hens arbeidstid. Detaljeres i egen økt.

---

## Økt (P48): Utvid importrad ved klikk (lett redigering i AI-forhåndsvisning)

**Branch:** `claude/p48-utvid-importrad-q1uuto` (miljøets tildelte branch).
**Scope:** KUN `v4/app.js` + `v4/style.css` + cache-bust i `v4/index.html`.
Ingen edge-funksjon, ingen DB.
**Status:** FULLFØRT 15. august 2026 — kode merget til main.

### Kartlegging (verifisert i koden 15. august 2026)

`visAIPasteModal` → `byggRad(s, rader, liste)` (app.js) bygger hver
importrad. Alle felt lagres direkte på `rad`-objektet (`klasseSel`,
`laererSel`, `fagSel`, `divSel`, `ukeFelt`, `dagSel`, `aktivitetFelt`,
`oppmoteFelt`, `infoFelt`) og handlerne (live-validering `oppdaterRadStatus`,
klassebytte → `byggDivPaaNytt` + `plasserRad`, kollisjonssjekk) er bundet
direkte på disse DOM-elementene. En utvidet visning kan dermed gjenbruke de
samme elementene ved å endre CSS-klasse på `rad.el` og la CSS legge om
layout — ingen duplisert logikk nødvendig. CSS-grid for raden lå i
`.okt-import-rad` (`v4/style.css`), 11 kolonner, med egen mobil-stabling
`@media (max-width:900px)`.

### Delplan

**Runde 1 (klikk-for-å-utvide, ett-felt-per-linje):** implementert, men
Morfar vurderte utvidet visning som for tung — hvert felt stablet på egen
linje fylte skjermen unødvendig siden de fleste tekstfeltene er korte.

**Runde 2 (godkjent design — to etasjer i samme rad-blokk):**
- [x] Aktivitet/møtested/info er `<textarea>` (samme `.value`-lesing i
      validering/import, ingen logikkendring) — kompakt: én linje via CSS,
      utvidet: auto-voksende tekstområde (høyden settes i JS,
      `autosizeTekstfelt`, ut fra `scrollHeight` — ikke fast, ikke
      fullskjerm).
- [x] Utvidet rad = to etasjer i samme rad-blokk: etasje 1 er
      klasse/lærer/fag/parti/uke/dag på én linje med NØYAKTIG samme
      kontroller/størrelse som kompakt visning (ingen forstørring, ingen
      etiketter — droppet fra runde 1); etasje 2 er aktivitet/møtested/info
      i full bredde under, hver sin auto-voksende boks. `medLabel`-hjelperen
      brukes kun for disse tre (liten etikett, siden radkonteksten kan være
      langt fra kolonneoverskriften når lista er scrollet).
- [x] Synlig utvid-/lukk-knapp (⌄→⌃) i egen liten celle ved siden av
      stryk-knappen — primær affordanse for å åpne/lukke raden.
- [x] «Lukk»-knapp inni det utvidede panelet gjør samme handling.
- [x] Klikk hvor som helst på raden (utenom felt/nedtrekk/knapper, sjekket
      via `e.target.closest('input, select, textarea, button, a')`) er en
      bonusvei til samme utvid-/lukk-handling.
- [x] Maks én rad utvidet om gangen (`utvidetRad`-tilstand i modal-scope;
      `apneUtvidet`/`lukkUtvidet` lukker forrige før ny åpnes).
- [x] Opprydding av `utvidetRad`-tilstanden ved stryk, import og re-analyse
      (radene fjernes fra DOM/liste i disse tilfellene) — inkl. nullstilling
      av tekstfeltenes inline høyde ved lukking.
- [x] Utvidet rad blir værende i sin klassegruppe (ingen `plasserRad`-kall
      ved utvid/lukk, kun klassebytte flytter raden som før).
- [x] CSS: `.okt-import-rad--utvidet` med eksplisitt grid-plassering (linje-
      for-linje, ikke auto-flow — unngår tvetydig auto-placement når celler
      har ulikt kolonnespenn) for begge etasjer; ≤900px (mobil, der raden
      allerede stables) bruker samme to-etasjers prinsipp, men etasje 1
      stables i to kolonner slik kompaktfeltene allerede gjør.
- [x] Resize-sikring: vindusendring mens en rad er åpen kunne gjøre
      tekstboksens høyde utdatert (avkuttet tekst ved smalere bredde) —
      lagt til debounced `resize`-lytter med samme selv-opprydningsmønster
      som `renderAlleOkterTab` (`onResize` + `isConnected`-sjekk).
- [x] Ingen endring i validering/kollisjon/klassebytte-gruppering/import.
- [x] Maskinverifisert med headless Chromium mot en isolert HTML-harness som
      gjenbruker `v4/style.css` (samme klassenavn/struktur som den ekte
      raden): kompakt visning uendret; utvidet — kort tekst gir lav boks,
      lang tekst gir flerlinjers auto-vokst boks, begge på desktop; mobil
      stabler etasje 1 i to kolonner med tekstfelt under; vindusendring
      mens raden er åpen re-beregner høyden korrekt (ingen avkutting).
- [x] Cache-bust bumpet til `?v=20260815b` for både CSS og JS.

**Runde 3 (justeringer etter ekte test i produksjon, 15. august 2026):**
- [x] Fjernet resize-håndtaket på tekstfeltene i KOMPAKT visning. Rotårsak:
      `.okt-import-felt--tekst { resize: none }` (én klasse) tapte for
      skjemaets basisregel `textarea.felt { resize: vertical }` (tag+klasse
      — høyere spesifisitet) selv om den sto lenger nede i filen. Fikset med
      `!important` på `resize: none`.
- [x] Utvidet visning: ⌃-chevronen og stryk-knappen (🗑) flyttet til LINJE 1,
      i nøyaktig samme rutenett-posisjon (kolonne 7/8) som ⌄/🗑 har i
      kompakt visning. Grid utvidet fra 6 til 8 kolonner på linje 1
      (`.9fr 1.2fr 1.6fr 1.2fr 60px 80px 32px 36px`); aktivitet/møtested/
      info/merknad flyttet ned én linje hver (linje 2–5).
- [x] «Lukk»-knappen inni panelet fjernet helt (JS: `rad.lukkKnapp` og all
      bruk av den; CSS: `.okt-import-lukk-knapp`-regler) — chevronen er nå
      eneste åpne/lukke-kontroll, alltid på samme sted man åpnet.
- [x] Mobil-mediesporet oppdatert tilsvarende: utvid-/stryk-cellene tas nå
      med i resetten til `grid-column:auto` (var kun de seks kompaktfeltene
      før), merknad forenklet til alltid full bredde i utvidet mobil.
- [x] Maskinverifisert på nytt: `getComputedStyle(...).resize` bekreftet
      `'none'` i kompakt visning (var `'vertical'` før fiksen); skjermbilder
      av utvidet desktop (chevron+stryk øverst til høyre på linje 1, ingen
      Lukk-knapp) og utvidet mobil (samme, med to-kolonners stabling).
- [x] Branch restartet fra oppdatert `origin/main` (PR #156 var allerede
      squash-merget) og bygget videre derfra, jf. rutinen for merget PR.
- [x] Cache-bust bumpet til `?v=20260815c` for både CSS og JS.
- [ ] Morfars visuelle prod-sjekk (ekte AI-import med flere rader, prøv
      utvid/lukk på både desktop og mobil i nettleser) — kan ikke
      maskinverifiseres da AI-import krever ekte Supabase-innlogging og
      Gemini-kall; samme mønster som P41–P44s gjenstående prod-sjekk.
