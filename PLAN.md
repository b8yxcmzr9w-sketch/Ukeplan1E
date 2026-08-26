# PLAN — Ukeplan1E v4

## STATUSLINJE (oppdateres hver økt, i samme commit som resten av PLAN.md)

- **Siste fullførte P-nummer:** P65 (synliggjør ekte databasefeil i
  ical-funksjonen — `error` fra sessions-spørringen i
  `supabase/functions/ical/index.ts` returneres nå som «Database error:
  …» (500) i stedet for å forsvinne bak en generisk «No sessions
  found» (404). Kun to linjer endret. Se egen seksjon lenger ned. Kode
  committet og merget til main via PR #176. **Manuelt gjenstår:** Morfar
  må redeploye `ical`-funksjonen i Supabase Dashboard, deretter gjenta
  det opprinnelige testabonnementet og rapportere det ekte feilbudskapet
  tilbake for videre diagnose — se «Åpne sjekkpunkter».)
- **Nest siste fullførte P-nummer:** P64 (rollback-kopien `v4/` slettet —
  betingelsen fra P62 var oppfylt (Morfar har bekreftet at rot-versjonen
  fungerer i produksjon). `git rm -r v4/`, omtalen av `v4/` som
  midlertidig rollback fjernet fra CLAUDE.md. Ingen cache-bust nødvendig
  (v4/ ble aldri servert). Se DECISIONS.md «P64 — v4/-rollback-kopien
  slettet». Manuelt gjenstår: fjerne `/v4/`-redirect-URL-en fra Supabase
  Authentication → URL Configuration — ikke gjort av Code.)
- **Pågående:** ingen
- **Neste ledige P-nummer:** P66
- **Dato sist oppdatert:** 26. august 2026
- **Åpne sjekkpunkter som ikke kan lukkes ennå:**
  - P65 — Morfar må redeploye `ical`-funksjonen manuelt i Supabase
    Dashboard etter merge, deretter gjenta det opprinnelige
    testabonnementet og rapportere det ekte feilbudskapet tilbake for
    videre diagnose (se egen seksjon lenger ned)
  - P63s prod-sjekk — migrasjon `026_funfacts_last_shown.sql` er kjørt av
    Morfar 25. august 2026 og PR #174 er merget; Morfars visuelle
    bekreftelse i ekte produksjon gjenstår: en lagring som tar litt tid
    viser et funfact, gjentatte lagringer viser ikke de samme om igjen,
    og 👁-tellerne i Funfacts-fanen stiger for fakta som faktisk er vist
  - P61s prod-sjekk — parti/gruppe-spørsmålet fjernet fra «Be om
    tilgang»-skjemaet, kun fag-listen står igjen (kode klar, ingen
    migrasjon/redeploy); Morfars visuelle bekreftelse i produksjon etter
    merge gjenstår, samme mønster som P41–P55
  - P55s prod-sjekk — filtrering av myk-slettede brukere i brukerlisten og
    overfør-nedtrekket (kode klar, ingen SQL-endring); Morfars manuelle
    testrunde i produksjon gjenstår (krever innlogget admin-sesjon, ikke
    tilgjengelig fra denne økten): opprett testbruker → slett → bekreft
    hun forsvinner ved refresh → bekreft hun ikke dukker opp i
    «Overfør til»-nedtrekket ved neste sletting
  - P54s prod-sjekk — illustrert hurtigstart-veiledning, åpnes i ny fane,
    og nye brukere sendes dit automatisk etter invitasjon (alle tre deler
    maskinverifisert i isolerte harnesser); Morfars visuelle bekreftelse i
    ekte produksjon gjenstår, samme mønster som P41–P53
  - P53s prod-sjekk — mobil sammendragslinje i AI-import (maskinverifisert,
    12 CSS-sjekker + 4 logikksjekker mot isolert harness); Morfars visuelle
    bekreftelse på ekte telefon i produksjon gjenstår, samme mønster som
    P41–P52 (krever ekte AI-import: Supabase-innlogging + Gemini-kall)
  - P52s prod-sjekk — redusert linjeavstand i «Ny økt» (maskinverifisert,
    5 sjekker); Morfars visuelle bekreftelse i produksjon gjenstår
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

---

## Backlogg (leses herfra — aldri fra hukommelse eller prosjektminne)

> Verifisert mot koden på main 22. juli 2026 (P39). Punkter merket «(P40)» er
> løftet fra fullførte plan-seksjoner 23. juli 2026 uten ny kodeverifisering.
> UX/mobil-ønsker ligger i egen fil: `BACKLOGG-UX-MOBIL.md` (der er punkt 1
> delvis tatt av P6 og punkt 4 lukket som P7; punkt 2 «parti-filter i
> elevfilter» og punkt 3 «faner/Min plan-omstrukturering» står åpne).
> Innholdet dupliseres ikke hit.

### Klar til bygging

- **Oversett rå Postgres-feiltekst i feiloverlayet til lesbar norsk** (P58).
  I dag vises f.eks. `new row for relation "subjects" violates check
  constraint "subjects_max_divisions_check"` direkte til brukeren ved en
  mislykket lagring. Et lite oversettelseslag (kjente constraint-navn →
  norsk forklaring, med generisk fallback for ukjente) ville gjort feil
  som dette forståelige uten å måtte lese Postgres-tekst. Ikke bygget i
  P58 — utenfor scope for den økten (kun DB-taket ble hevet).

- **«Godkjenn» skal (senere) lede rett til kontooppretting, med bekreft/rediger-steg**
  (ønske fra Morfar, presisert 20. august 2026, etter første praktiske bruk
  av P57). I dag må admin lese navn/e-post/rolle fra forespørsels-kortet i
  «Forespørsler»-fanen og skrive dem inn på nytt for hånd i «+ Ny
  bruker»-skjemaet i «Brukere»-fanen — upraktisk på mobil/i farten (Morfar
  klarer seg i mellomtiden fordi samme info også kommer på e-post via
  Formspree; midlertidig forsterket forklaringstekst i fanen lagt til
  samme dag så «Godkjenn» ikke misforstås som «oppretter bruker»).
  **Ønsket fremtidig flyt:** «Godkjenn» åpner «Ny bruker»-skjemaet
  FORHÅNDSUTFYLT med navn/e-post/rolle fra forespørselen — admin kan endre
  feltene fritt (f.eks. justere rolle eller velge klasser) FØR en eksplisitt
  bekreftelse faktisk oppretter kontoen. Selve statusendringen på
  forespørselen (`venter` → `godkjent`) skjer i samme steg som
  kontoopprettelsen, ikke separat som i dag. Fag/parti/gruppe forblir kun
  informasjon — ingen automatisk kobling opprettes, det prinsippet endres
  ikke. **NB:** dette reverserer en eksplisitt beslutning fra selve
  P57-oppgaveteksten («INGEN automatisk kontoopprettelse, INGEN
  forhåndsutfylling») — bevisst, siden Morfar selv har bedt om det etter å
  ha brukt funksjonen i praksis. Design-punkter å avklare før bygging:
  hva skjer med statusen hvis admin åpner skjemaet men avbryter uten å
  lagre (forblir `venter`, ikke `godkjent`)? Skal «Avvis» fortsatt være en
  ren statusendring uten skjema (trolig ja)?
- **Stille tomt resultat i adminpanelet når «admin-modus»-bryteren er av**
  (funnet under P57s produksjonstest, 20. august 2026). Adminpanelets rute
  slipper deg inn basert KUN på det permanente `is_admin`-flagget
  (`harAdminTilgang()`, app.js:1035) — men RLS-policyene som beskytter
  dataene (bl.a. `access_requests_admin_all`, mønsteret `is_active_admin()`
  brukt i de fleste admin-skrive-/lese-policyer) krever i TILLEGG at
  sesjons-bryteren `is_admin_active` faktisk er slått på. Bryteren
  nullstilles bl.a. ved vanlig innlogging (`renderLoginForm`, app.js~583:
  `is_admin_active: false`). Resultatet: en admin kan stå midt inne i et
  adminpanel-fane og få et helt tomt/stille resultat (ingen feilmelding,
  ingen rader) fordi bryteren tilfeldigvis er av — svært forvirrende,
  siden UI-et ikke skiller mellom «tomt fordi det faktisk er tomt» og
  «tomt fordi RLS blokkerer». Gjelder sannsynligvis ALLE admin-faner som
  leser data bak `is_active_admin()`, ikke bare «Forespørsler». Mulige
  retninger å vurdere i egen økt: (a) la router-gaten kreve `isAdminActive`
  konsekvent (ikke bare `harAdminTilgang()`) så man aldri havner i denne
  mellomtilstanden, (b) vis en tydelig varseltekst i adminpanelet når
  `is_admin_active` er false men brukeren likevel er der, eller (c) fjern
  distinksjonen og la `is_admin`/`role=admin` alene styre RLS også (større
  endring, påvirker mange policyer — krever egen vurdering av
  sikkerhetskonsekvenser).
- **`admin-user`s Resend-baserte varsler (passord-/e-post-endring) er
  fortsatt ikke bekreftet fungerende** (funnet under P57s produksjonstest,
  20. august 2026 — se DECISIONS.md for full bakgrunn). `RESEND_API_KEY`/
  `RESEND_FROM` i Supabase Secrets stammer fra en tidligere økt; Morfar har
  aldri brukt Resend selv og har ikke mottatt noen e-post derfra ved test.
  P57s EGET behov for e-postvarsel er løst (byttet til Formspree, se
  DECISIONS.md) — dette gjenværende punktet gjelder KUN de to eldre
  `admin-user`-varslene (passord endret / e-post endret av admin), som
  fortsatt bruker Resend uendret. Avklares/rettes som egen, avgrenset økt
  ved behov (kontosjekk hos Resend, eller bytt disse også til Formspree
  etter samme mønster som P57).
  **NB:** «Glemt passord»-e-posten på innloggingssiden er IKKE et signal her
  — den bruker Supabase sin egen innebygde auth-e-post
  (`sb.auth.resetPasswordForEmail`), en helt annen sendevei enn
  `sendVarsel()`/Resend.
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
  Fag uten ekte motpart (norsk, matte, engelsk, kroppsøving + ev. YFF).
  P60 (migrasjon 025) tømte alle kalenderhendelser (sessions,
  multi_day_events) før live, men RØRTE BEVISST IKKE fagene selv — det er
  oppsett, ikke en hendelse (se Økt 60). Morfar rydder selv i Fag-fanen,
  i dialog med faglærerne, når han finner det riktig — trygt å gjøre nå
  som ingen økter lenger peker på dem.

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

## Økt (P49): Korte tekstfelt (aktivitet/møtested) + kompakt importlayout

**Branch:** `claude/ukeplan-short-text-fields-5ibs7u` (miljøets tildelte
branch — bygget videre på oppdatert `origin/main` etter P48, ingen
konflikt med `claude/p49-vennlig-ai-feilmelding`, som ikke fantes på
remote — P49 var ledig).
**Scope:** KUN `v4/app.js` + `v4/style.css` + cache-bust i `v4/index.html`.
Ingen DB-endring, ingen edge-funksjon.
**Status:** FULLFØRT 18. august 2026 — kode merget til main.

### Kartlegging (verifisert i koden 18. august 2026)

Aktivitet/møtested/info-feltene fylles ut disse fem stedene i `v4/app.js`:
- `visNyOktModal` (linje ~2770–2772)
- `visRedigerOktModal` (linje ~2884–2891)
- `visKopierOktModal` (linje ~3018–3020)
- `visAIPasteModal` → `byggRad` (linje ~3464–3466), utvidet importrad (P48)
- `visBulkKopierModal` og `visBulkEditModal` har ingen egne
  aktivitet/møtested-inputfelt (kopierer eksisterende verdier
  programmatisk, hhv. redigerer kun info) — ingen maxlength nødvendig der.

Ingen av feltene hadde `maxlength` fra før. DB-kolonnene
(`sessions.activity`, `sessions.meeting_point`, `sessions.info`) er `text`
uten lengdegrense — bekreftet i `v4/supabase/migrations/001_initial_schema.sql`,
ingen senere migrasjon endrer dette.

### Delplan

- [x] Delt konstant (`AKTIVITET_MAKS_LENGDE = 30`, `MOTESTED_MAKS_LENGDE = 40`)
      rett før `visNyOktModal`, gjenbrukt på alle fire entry points — unngår
      duplisering av tallene.
- [x] `maxlength` lagt på aktivitet/møtested i `visNyOktModal`,
      `visRedigerOktModal`, `visKopierOktModal` og AI-importradens
      `rad.aktivitetFelt`/`rad.oppmoteFelt`. Info uendret (ingen grense).
      Ingen DB/CHECK-constraint — håndheves kun i grensesnittet, så
      eksisterende lange rader avvises ikke.
- [x] Kompakt utvidet importrad: aktivitet/møtested/info pakket i en felles
      `.okt-import-tekstrad`-wrapper i DOM (kun i `byggRad`). Wrapperen er
      `display:contents` som standard, så kompaktradens grid og kolonner er
      HELT uendret (cellene oppfører seg som om wrapperen ikke fantes).
      I utvidet visning (`.okt-import-rad--utvidet`) blir wrapperen en
      `flex-wrap`-rad: Aktivitet smalest (`flex: 1 1 140px`), Møtested
      medium (`flex: 1.4 1 170px`), Info bredest og vokser mest
      (`flex: 2.2 1 220px`) — alle på samme linje på desktop. `min-width:0`
      på cellene sikrer at flex kan krympe/bryte i stedet for å presse
      raden bredere enn modalen.
- [x] Mobil (≤900px, samme brytningspunkt som resten av importraden):
      `flex-basis:100%` på de tre cellene innenfor `.okt-import-tekstrad`
      gir én kolonne per felt (samme stables-prinsipp som før P49, bare
      uten faste `grid-row`-numre siden wrapperen selv nå eier plasseringen).
      Merknad-cellen flyttet fra linje 5 til linje 3 (kun to etasjer med
      tekstinnhold nå: kontrollene og selve tekstraden).
- [x] Ingen fast høyde — `autosizeTekstfelt`/`scrollHeight`-mønsteret fra
      P48 er uendret; Info kan fortsatt auto-vokse innenfor sin flex-celle.
- [x] Kompaktradens layout og chevron/🗑 på linje 1 i utvidet visning er
      ikke rørt (samme grid-kolonner/-rekkefølge som P48 runde 3).
- [x] Ingen datamodell-endring.
- [x] Maskinverifisert med headless Chromium mot en isolert HTML-harness
      som gjenbruker `v4/style.css` (samme klassenavn/struktur som den
      ekte raden): kompakt visning uendret på desktop og mobil; utvidet
      visning viser aktivitet/møtested/info side om side (smal/medium/bred)
      på desktop, stablet én per linje på mobil (420px bredde); native
      `maxlength`-håndheving bekreftet i nettleser (30/40 tegn kuttet av på
      både `<input>` og `<textarea>`).
- [x] Cache-bust bumpet til `?v=20260818a` for både CSS og JS.
- [ ] Morfars visuelle prod-sjekk: åpne «Ny økt», «Rediger økt» og AI-import
      i produksjon og bekreft at maxlength stopper inntasting ved 30/40
      tegn, og at utvidet importrad er kompakt (side om side) på desktop og
      stablet på mobil — kan ikke maskinverifiseres fullt ut da ekte bruk
      krever Supabase-innlogging; samme mønster som P41–P48s gjenstående
      prod-sjekk.

---

## Økt (P50): Kompakt utforming — info-grense + «Ny økt» + AI-kompaktvisning (desktop)

**Branch:** `claude/kompakt-utforming-info-grense-vmd2dh` (miljøets tildelte branch).
**Scope:** KUN `v4/app.js` + `v4/style.css` + cache-bust i `v4/index.html`.
Ingen DB-endring, ingen edge-funksjon.

### Kartografi (verifisert i koden 19. august 2026)

**(a) Info-felt — alle steder som fylles ut/redigeres:**
- `visNyOktModal` — app.js:2778: `form.appendChild(lagFormRad('Info', el('textarea', { name: 'info', class: 'felt textarea' })))`
- `visRedigerOktModal` — app.js:2896–2897: `infoTA = el('textarea', { name:'info', class:'felt textarea' }, session.info || '')`
- `visKopierOktModal` — app.js:3026: `el('textarea', { name:'info', class:'felt textarea' }, session.info || '')`
- `visBulkEditModal` «Ny info» — app.js:3098: `infoInput = el('textarea', { class:'felt textarea', placeholder:'Ny info (blank = uendret)' })`
- `visAIPasteModal` → `byggRad` — app.js:3472: `rad.infoFelt = el('textarea', {...}, rows:1)` (ingen maxlength i dag)

**Avvik fra oppgaveteksten:** det finnes IKKE noe `FELTGRENSER`-objekt eller
`settTekstgrense`-hjelpefunksjon i koden. P49s faktiske mønster er to enkle
konstanter rett før `visNyOktModal` (app.js:2596–2597: `AKTIVITET_MAKS_LENGDE = 30`,
`MOTESTED_MAKS_LENGDE = 40`) satt direkte som `maxlength`-attributt på hvert felt —
ingen delt hjelpefunksjon. Punkt 1 under følger derfor DETTE mønsteret: en tredje
konstant `INFO_MAKS_LENGDE = 300` ved siden av de to andre, satt som `maxlength`
samme sted som i dag. Ingen ny «FELTGRENSER»-abstraksjon innføres.

**(b) Feltoppsett i `visNyOktModal` i dag (app.js:2599–2787), ett `lagFormRad`
per linje, i denne rekkefølgen:** Klasse (select) → Felles med (avkryssing,
kun når skolen har flere klasser) → Fag (select) → Parti/gruppe (avkryssingsbokser)
→ Uke (number-input) → Dag (select) → Lærer (select) → Aktivitet (input) →
Møtested (input) → Info (textarea). `lagFormRad` (app.js:5802) bygger en
`div.felt` (block, `margin-bottom:14px`) med `<label>` over et felt som er
`width:100%` — alt stables i én kolonne i dag, ingen sammenstilling på samme
linje noe sted i skjemaet.

**(c) AI-forhåndsvisningens rad- og grupperingskode i `visAIPasteModal`:**
- Rad bygges av `byggRad(s, rader, liste)` (app.js:3397–3618). Kompakt rad =
  12-kolonners CSS-grid (`.okt-import-rad`, style.css:884–893):
  klasse(.9fr) · lærer(1.2fr) · fag(1.6fr) · parti/gruppe(1.2fr) · uke(60px) ·
  dag(80px) · aktivitet/møtested/info (hver 1fr, via `.okt-import-tekstrad`
  som er `display:contents` i kompakt — cellene er reelle grid-items) ·
  merknad(1.4fr) · utvid(32px) · stryk(36px).
- Gruppering finnes fra P44 (`.okt-import-gruppe`, style.css:925–931) MEN er
  i dag KUN étt nivå: `grupper`-Map (app.js:3670) nøklet på `klasseSel.value`
  alene, sortert alfabetisk på klassenavn (`sorterGrupper`, app.js:3692–3699),
  ugyldig-klasse-gruppe alltid sist. `plasserRad` (app.js:3701) flytter raden
  til riktig gruppe UMIDDELBART ved klassebytte (app.js:3515–3521, i dag
  bundet på `klasseSel`s `change`-event).
- Utvidet visning (P48/P49) har egen 8-kolonners grid
  (`.okt-import-rad--utvidet`, style.css:942–977) med EKSPLISITT
  `grid-column`/`grid-row` per celle (klasse/lærer/fag/parti/uke/dag på linje 1,
  tekstrad på linje 2, merknad linje 3) — uavhengig av kompaktgridets
  auto-plassering. `apneUtvidet`/`lukkUtvidet` (app.js:3340–3357) styrer
  `.okt-import-rad--utvidet`-klassen; maks én rad utvidet om gangen.
- **Bekreftet:** `FELTGRENSER`/`settTekstgrense` finnes ikke (se avviket over) —
  men selve gruppe-/rad-koden fra P44/P48/P49 (`.okt-import-gruppe`,
  `byggRad`, utvidet-mekanikken) stemmer med kartleggingen over og kan
  bygges videre på.

### Delplan

**1. Info-grense 300 tegn:**
- [x] Ny konstant `INFO_MAKS_LENGDE = 300` ved siden av de to eksisterende
      (app.js:2597).
- [x] `maxlength: INFO_MAKS_LENGDE` lagt til info-feltet i `visNyOktModal`,
      `visRedigerOktModal`, `visKopierOktModal`, `rad.infoFelt` i
      `visAIPasteModal`, og `infoInput` («Ny info») i `visBulkEditModal`.
- [x] Ingen DB-endring. Eksisterende lange info-rader i databasen røres ikke
      (grensen håndheves kun i UI ved ny inntasting/redigering).

**2. Kompakt «Ny økt» (`visNyOktModal`):**
- [x] Ny feltrekkefølge: Klasse → Felles med (uendret, øverst) → **rad A**
      (Uke · Dag · Lærer) → **rad B** (Fag · Parti/gruppe) → **rad C**
      (Aktivitet · Møtested, smalere) → Info (full bredde, uendret plassering
      sist).
- [x] Ny CSS-klasse `.skjema-rad` (flex, `gap:10px`) som wrapper flere
      `lagFormRad(...)`-resultater på samme linje; hvert barn `flex:1 1 0`.
      På mobil (≤700px) stables parene i full bredde via
      `flex-direction:column`.
- [x] Modifikator `.skjema-rad--smal` for rad C: barna får `flex:0 0 auto`,
      og input-feltene får `max-width:140px` (Aktivitet) / `max-width:190px`
      (Møtested) via nye klasser `.skjema-felt--akt`/`--opp`; nullstilt igjen
      på mobil (full bredde som resten av stablingen). Ingen «maks tegn»-
      etiketter i UI.
- [x] `visRedigerOktModal`/`visKopierOktModal` uendret i denne runden.

**3. AI-import kompaktvisning på desktop (`visAIPasteModal`):**
- [x] Gruppering utvidet fra étt nivå (klasse) til tre: **Uke → Klasse →
      Lærer**. Bladgruppe nøklet på `(uke, klasseId, lærerId)`; sortering:
      uke stigende (manglende uke sist) → klassenavn alfabetisk (ugyldig
      klasse sist) → lærernavn alfabetisk. Rader innen en bladgruppe sortert
      kun på dag.
- [x] Gruppeoverskriften er tre faste `<span>`-kolonner (uke/klasse/lærer,
      `.okt-import-gruppe-uke/-klasse/-laerer`) bygget av `byggTrappeOverskrifter()`
      — uke tømmes når lik forrige gruppes uke; klasse tømmes KUN når BÅDE
      uke og klasse er like forrige gruppe; lærer vises alltid.
      Maskinverifisert med et 4-rads scenario (se Verifisering).
- [x] Kompaktradens grid får `display:none` på klasse-/lærer-/uke-cellene og
      et 9-kolonners `grid-template-columns` KUN i
      `@media (min-width:901px)` og kun for `.okt-import-rad:not(.okt-import-rad--utvidet)`
      — mobil (≤900px) og utvidet visning er upåvirket (høyere spesifisitet
      enn basis-gridet, men matcher aldri `--utvidet`-rader). `.okt-import-hode`
      (kolonneoverskriftene) rammes av samme selektor og mister klasse-/
      lærer-/uke-etikettene på desktop automatisk — ingen egen JS-endring
      trengtes der.
- [x] Regruppering skjer KUN når en utvidet rad LUKKES: `lukkUtvidet()`
      kaller nå `plasserRad(rad)` (med mindre raden nettopp ble strøket) —
      enklere enn planlagt «sjekk om nøkkelen er endret» siden `plasserRad`/
      `gruppeNokkel` allerede er idempotente (samme nøkkel ⇒ ingen synlig
      endring). `klasseSel`s `change`-lytter mistet sitt `plasserRad`-kall
      (flytter ikke lenger umiddelbart), men oppdaterer fortsatt parti/
      gruppe-dropdown og revaliderer med det samme. **Avvik fra sub-planen:**
      ingen nye lyttere ble lagt til på `laererSel`/`ukeFelt` — `ukeFelt`
      hadde allerede en uendret `change`→`oppdaterRadStatus`-lytter, og det
      finnes ingen lærer-spesifikk validering å trigge, så en tom ekstra
      lytter ville vært dødt kode.
- [x] Ved AI-analyse og «+ Legg til rad» plasseres raden i riktig bladgruppe
      med det samme (uendret — `byggRad` kaller `plasserRad` ved opprettelse).
- [x] Ingen endring i validering, kollisjonssjekk, `matchKlasse`/`matchFag`/
      `matchDiv`, insert-logikken eller `oppdaterUkjentKlasseVarsel`.
- [x] Stryk-knappen kaller nå også `byggTrappeOverskrifter()` etter
      `ryddTommeGrupper()` — fjerning av en rad kan endre hvilke nabogrupper
      som deler uke/klasse, og overskriftene må derfor bygges på nytt.

### Verifisering (19. august 2026)

- [x] `node --check v4/app.js` — ingen syntaksfeil.
- [x] Maskinverifisert med headless Chromium (Playwright) mot en isolert
      harness som laster EKTE `v4/style.css` + `v4/app.js` med en stubbet
      Supabase-klient (samme mønster som P44/P48/P49): **38 sjekker, alle OK,
      ingen JS-feil i konsollen.** Dekket:
      - Info-maxlength=300 i alle fem feltene (Ny/Rediger/Kopier/Bulk/AI-rad).
      - «Ny økt»: nøyaktig 3 `.skjema-rad` i riktig rekkefølge og med riktig
        feltinnhold (Uke/Dag/Lærer · Fag/Parti-gruppe · Aktivitet/Møtested),
        Aktivitet smalere enn Møtested og begge < 300px (ikke full bredde),
        Info sist i full bredde; på mobil (480px) stables rad A i kolonne og
        Aktivitet mister sin `max-width`.
      - AI-import: 4 testrader (uke 34/1D×2, uke 34/2A, uke 35/1D) ga riktig
        3 bladgrupper med riktig «trappe»-tekst i alle tre kombinasjoner
        (uke uendret → tom, uke+klasse uendret → begge tomme, uke endret →
        begge vist på nytt). Desktop (1300px): klasse/lærer/uke-celler
        `display:none`, fag fortsatt synlig, grid har 9 kolonner. Utvidet
        rad: alle tre celler synlige igjen. Live lærerbytte i utvidet
        visning flyttet IKKE raden før lukking (fortsatt 3 grupper rett
        etter `change`); ved lukking regrupperte den korrekt til 4 grupper
        med ny alfabetisk sortering (Kari Hansen før Ola Nordmann) og
        korrekt trappe-tømming. Mobil (480px): klasse/lærer/uke fortsatt
        synlige i kompakt AI-rad (uendret, som planlagt).
- [x] Cache-bust bumpet til `?v=20260819a` for både CSS og JS.
- [ ] Morfars visuelle prod-sjekk: «Ny økt» i produksjon (desktop + mobil),
      info-grense ved 300 tegn i alle fire steder + AI-import-raden, og AI-
      import med en tekst som gir flere uker/klasser/lærere (trapp-
      overskriften, kompakt rad uten klasse/lærer/uke-kolonner på desktop,
      uendret på mobil) — kan ikke fullt verifiseres maskinelt siden ekte
      AI-import krever Supabase-innlogging + Gemini-kall; samme mønster som
      P41–P49s gjenstående prod-sjekk.

---

## Økt (P51): Skjul tom «Parti/gruppe»-rad i «Ny økt» (rettelse etter P50-prod-sjekk)

**Branch:** `claude/p51-parti-gruppe-hoyde`.
**Scope:** KUN `v4/app.js` + `v4/style.css` + cache-bust i `v4/index.html`.
Ingen DB-endring, ingen edge-funksjon.

**Bakgrunn:** Morfar testet P50s kompakte «Ny økt» i produksjon (skjermbilde)
og fant at når faget ikke har noen parti/gruppe å velge mellom, sto etiketten
«Parti/gruppe» igjen over en tom boks ved siden av «Fag» — raden så ujevn ut
i høyden fordi flex-radens standard `align-items:stretch` strakk den tomme
raden til å matche Fag-radens høyde, uten synlig innhold i det strukne rommet.

### Delplan
- [x] `visNyOktModal`: «Parti/gruppe»-raden (etikett + boks, bygget av
      `lagFormRad('Parti/gruppe', divContainer)`) hentes nå ut i en egen
      variabel `partiRad`, satt til `display:none` som utgangspunkt.
      `oppdaterDivisionCheckboxes` viser (`display:''`) raden når faget har
      ≥1 parti/gruppe for valgt klasse, og skjuler den (`display:'none'`) når
      det ikke finnes noen — både label og boks forsvinner sammen, ingen
      løs etikett igjen.
- [x] `.skjema-rad` fikk `align-items:flex-start` (var standard `stretch`) —
      generell robusthet mot at et kortere felt kunstig strekkes til å
      matche et høyere nabofelt med tomt rom under, uansett hvilket par av
      felt som havner i samme rad fremover.
- [x] `visRedigerOktModal`/`visKopierOktModal` er IKKE endret (de har ikke
      «Ny økt»s parvise `.skjema-rad`-layout, så samme visuelle problem
      oppstår ikke der).
- [x] Maskinverifisert med headless Chromium mot samme isolerte harness som
      P50 (ekte `style.css`/`app.js`, stubbet Supabase): 7 nye sjekker, alle
      OK, ingen JS-feil — dekker (a) ingen parti/gruppe: raden er
      `display:none`, Fag fyller hele radbredden alene, (b) med parti/gruppe:
      raden vises, riktig antall avkryssingsbokser, `align-items:flex-start`
      bekreftet. Full P50-regresjonssuite (38 sjekker) kjørt på nytt uten
      endringer i utfall.
- [x] Cache-bust bumpet til `?v=20260819b` for både CSS og JS.
- [ ] Morfars visuelle prod-sjekk: åpne «Ny økt» for et fag UTEN parti/gruppe
      (raden skal være helt borte, ikke bare tom) og for et fag MED
      parti/gruppe (raden skal vises normalt, uten unaturlig tomrom).

---

## Økt (P52): Redusert linjeavstand i «Ny økt»

**Branch:** `claude/p52-linjeavstand-ny-okt`.
**Scope:** KUN `v4/app.js` + `v4/style.css` + cache-bust i `v4/index.html`.
Ingen DB-endring, ingen edge-funksjon.

**Bakgrunn:** Morfar syntes avstanden mellom radene i «Ny økt» (Klasse /
Felles med / Uke-Dag-Lærer / Fag-Parti-gruppe / Aktivitet-Møtested / Info)
var for stor.

### Delplan
- [x] `visNyOktModal`s form fikk en ekstra klasse `skjema--kompakt` (i
      tillegg til `skjema`) — KUN denne modalen, jf. P50/P51s bevisste valg
      om å la Rediger/Kopier stå uendret.
- [x] Ny CSS-regel `form.skjema--kompakt .felt { margin-bottom: 8px }`
      (ned fra 14px). Element+klasse-kombinasjonen gir høyere spesifisitet
      enn den eksisterende `.skjema .felt`-regelen lenger ned i filen, så
      den vinner uavhengig av kildekode-rekkefølge.
- [x] Maskinverifisert med headless Chromium mot samme isolerte harness som
      P50/P51: 5 sjekker (Ny økt har `skjema--kompakt`-klassen og 8px
      margin-bottom; Rediger økt har verken klassen eller endret margin —
      fortsatt 14px), alle OK, ingen JS-feil. Full P50- (38) og
      P51-regresjonssuite (7) kjørt på nytt uten endring i utfall.
- [x] Cache-bust bumpet til `?v=20260819c` for både CSS og JS.
- [ ] Morfars visuelle prod-sjekk: åpne «Ny økt» og bekreft at radene sitter
      tettere, uten at det blir trangt/vanskelig å lese.

## Økt (P53): Mobil AI-import — sammendragslinje («Omgang 2»)

**Branch:** `claude/P53-mobil-ai-import-sammendrag`.
**Scope:** KUN `v4/app.js` + `v4/style.css` + cache-bust i `v4/index.html`.
Ingen DB-endring, ingen edge-funksjon.

**Bakgrunn:** P48–P50 løste kompakt/utvidet redigering av AI-importraden,
men på telefon (≤900px, komponentens egen mobilgrense — se P50s kommentar
i style.css) er de kompakte redigeringsfeltene (klasse/lærer/fag/parti/
uke/dag/aktivitet/møtested) fortsatt for mange til å få plass uten
vannrett trange felt. Løsning («Alternativ B», avklart med Morfar): vis en
ren tekst-sammendragslinje i kompakt visning på mobil i stedet for
redigerbare felt; trykk utvider til eksisterende P48/P49-visning der all
redigering skjer.

### Delplan
- [x] `byggRad` i `v4/app.js`: legg til `rad.mobilSammendrag` — et nytt DOM-
      element med to tekstlinjer (`rad.mobilLinje1` = «Dag · Fag»,
      `rad.mobilLinje2` = «Aktivitet · Møtested»), lagt til i `rad.el` som
      egen celle. Manglende dag/fag → «–»; tomme aktivitet+møtested → «–».
      Gjenbruker eksisterende `dagNavn()` og valgt fagnavn fra `rad.fagSel`.
- [x] Ny hjelpefunksjon `oppdaterMobilSammendrag(rad)` (eller inline i
      `oppdaterRadStatus`) som setter tekstinnholdet på de to linjene ut fra
      gjeldende feltverdier.
- [x] Kall `oppdaterMobilSammendrag` i to punkter:
      1. Til slutt i `oppdaterRadStatus()` (dekker uke/dag/fag/klasse-endring
         og initiell rendering — kjøres allerede ved feltendringer).
      2. I `lukkUtvidet()` (dekker aktivitet/møtested-endringer som skjedde
         mens raden var utvidet, siden disse feltene ikke trigger
         `oppdaterRadStatus` live).
- [x] Rad-status-fargen (rød/gul via `.okt-import-rad--roed`/`--gul` på
      `rad.el`) er allerede på rad-nivå og påvirkes ikke — sammendragslinja
      arver bakgrunnsfargen uendret.
- [x] CSS i `v4/style.css`, scoped til samme `@media (max-width: 900px)`
      som komponentens eksisterende mobilblokk (linje ~1023–1050 — dette ER
      appens mobilbrekk for denne komponenten, jf. P50s kommentar):
      - `.okt-import-mobil-sammendrag` er `display: none` som standard
        (utenfor mediesporet), vises kun i mediesporet, KUN når raden IKKE
        har `.okt-import-rad--utvidet`.
      - I samme medie-scope: skjul de kompakte redigeringscellene (klasse/
        lærer/fag/parti/uke/dag/aktivitet/møtested/merknad) når raden IKKE
        er utvidet — status-fargen på selve raden (rød/gul) dekker
        merknadsbehovet på sammendragsnivå, jf. oppgavebeskrivelsen.
      - `.okt-import-rad--utvidet` og dens undersnitt i samme mediesport
        (linje 1036–1049) røres IKKE — utvidet visning på mobil er allerede
        riktig og skal se ut som i dag.
      - Desktop (`@media (min-width: 901px)`, P50) og
        `.okt-import-rad--utvidet` generelt røres IKKE.
- [x] Klikk-vakten (`rad.el.addEventListener('click', ...)`) ignorerer i dag
      `input, select, textarea, button, a` — sammendragslinja er ren tekst
      (`div`/`span`), så den treffes automatisk av `apneUtvidet` uten
      endring i selve klikk-vakten. Verifiseres i test.
- [x] Maskinverifisering: isolert CSS/DOM-harness (samme mønster som
      P48–P52) som sjekker at sammendraget vises/skjules korrekt ved
      resize, at kompaktfeltene er skjult under 900px, at utvidet visning
      er uendret, og at innholdet oppdateres etter feltendring +
      lukk-utvid-runde.
- [x] Cache-bust bumpes i `v4/index.html`.
- [x] STATUSLINJE i PLAN.md oppdateres; P48–P51 fjernes fra «åpne
      sjekkpunkter» (Morfar har visuelt bekreftet dem i produksjon).
- [ ] Morfars visuelle prod-sjekk på ekte telefon gjenstår (kan ikke
      maskinverifiseres fullt ut — ekte AI-import krever Supabase-innlogging
      + Gemini-kall, samme mønster som P41–P52).

---

## Økt (P54): Hurtigstart-veiledning for lærere

**Branch:** `claude/laerer-hurtigstart-guide-bb1rm1` (miljøets tildelte
branch — oppgaveteksten foreslo ikke noe eget navn). **PR #163 squash-merget
til main 19. august 2026, commit `f2c6898`** (Morfars eksplisitte «merge»
mottatt).
**Scope:** KUN `v4/app.js`, `v4/style.css`, `v4/index.html` (nytt
menypunkt-markup + cache-bust). Ingen DB-migrasjon, ingen edge functions.
**Status:** FULLFØRT OG MASKINVERIFISERT 19. august 2026 — alle steg A–E
bygget (meny/rute/lukk-rørledning + ekte innhold med SVG-illustrasjoner fra
`hurtigstart-uten-bilder.html`). PR #163 squash-merget til main 19. august
2026. Morfars visuelle prod-sjekk gjenstår (begrunnet åpent, ingen
preview-deploy i repoet, samme mønster som P41–P53).

**Tillegg (samme dag):** Morfar ønsket at Hurtigstart åpnes i ny fane i
stedet for å navigere bort fra siden læreren sto på, slik at veiledningen
kan holdes oppe ved siden av mens hen jobber. `oppdaterHeader()`s
`ddHurtigstart.onclick` (app.js) endret fra `navigate('#/laerer/hurtigstart')`
til `window.open(`${location.pathname}#/laerer/hurtigstart`, '_blank',
'noopener')` — ny fane laster appen på nytt, gjenbruker den persisterte
Supabase-sesjonen og ruter rett til hurtigstart-siden (samme mekanisme som
dyplenke-testen fra hovedleveransen alt dekket). «X»-lukk i den nye fanen
er uendret (går til klasse-fanen i DEN fanen, eller brukeren lukker fanen
direkte). Branch `claude/p54-hurtigstart-ny-fane`, cache-bust
`?v=20260819g`. Maskinverifisert: 6 sjekker (window.open kalt riktig med
`_blank`/`noopener` og riktig URL, hovedfanen navigerer IKKE bort,
dropdown lukkes), alle OK. **PR #164 squash-merget til main 19. august
2026** (Morfars eksplisitte «merge» mottatt).

**Tillegg 2 (samme dag): lenke fra invitasjon.** Morfar spurte om
invitasjoner til nye brukere kan inneholde en lenke til hurtigstarten.
Løsningen valgt (i stedet for å endre Supabase sin e-postmal i Dashboard,
som krever at brukeren allerede er innlogget for at lenken skal virke): nye
brukere sendes automatisk til `#/laerer/hurtigstart` første gang de
fullfører invitasjonen (setter passord), i stedet for rett til klasse-fanen.
Endret KUN i invitasjons-grenen av `SIGNED_IN`-håndteringen i app.js
(`onFerdig: () => navigate('#/laerer/hurtigstart')`) — password recovery-
grenen (`PASSWORD_RECOVERY`-eventet, eksisterende brukere som glemmer
passord) er UENDRET og går fortsatt til `#/laerer` (klasse-fanen), siden de
allerede kjenner appen. Branch `claude/p54-invitasjon-hurtigstart`,
cache-bust `?v=20260819h`. Maskinverifisert (isolert harness som simulerer
Supabase sitt `SIGNED_IN`-event med `type=invite` i hash, fyller ut og
sender «velg passord»-skjemaet): 3 sjekker, alle OK — modalen vises, ny
bruker sendes til `#/laerer/hurtigstart` (ikke klasse-fanen), og
hurtigstart-siden faktisk rendres. **PR #165 squash-merget til main
19. august 2026** (Morfars eksplisitte «merge» mottatt).

### Mål

Et nytt menyvalg i header-hamburgeren (☰), synlig KUN for innloggede
brukere (lærer/kontaktlærer/admin), som åpner en illustrert
hurtigstart-/kom i gang-veiledning. Kilde: `hurtigstart-uten-bilder.html`
(brødtekst + inline SVG-illustrasjoner), som Morfar leverer separat.
Ikke synlig i elevvisning (anonym tilgang via klasselenke har uansett
ingen innlogget bruker).

### Kartlegging (verifisert i koden 19. august 2026)

- **Header-dropdownen** (`#hdr-dropdown`, `index.html:45–53`) er ÉN delt
  markup-blokk for hele appen (elev-, lærer- og adminvisning) — knappene
  vises/skjules i `oppdaterHeader()` (app.js:742–848) ut fra
  `APP.user && APP.profile`. «Profil» (`ddProfil`, app.js:819–822) er
  ALLEREDE synlig for alle innloggede roller (ikke bare admin) og
  navigerer til `#/laerer/innstillinger`. «Innstillinger» (`ddInnstillinger`)
  er admin-only. Hurtigstart skal følge samme synlighetsregel som Profil
  (alle innloggede roller) — det gir «ikke i elevvisning» helt gratis,
  siden elevvisningens klasselenke er anonym og dermed aldri har
  `APP.user`. Blir en lærer/admin i header «kikke» på elevvisningen
  (P21-elevpeek), er de fortsatt innlogget — hamburgermenyen (delt
  komponent) viser da fortsatt Hurtigstart. Det tolkes som riktig og i
  tråd med oppgaveteksten («kun for innloggede brukere»), ikke et avvik.
- **«Profil»-siden er malen å følge:** `renderInnstillingerTab`
  (app.js:1633–1688) bruker det etablerte settings-mønsteret fra
  CLAUDE.md (`.settings-page` sentrert kolonne + `.settings-card` per
  seksjon + `lagSettingsLukk()` for «X»-lukk). Fanen er en «skjult» fane i
  `renderLaererView`: `tabSlugs` inneholder `'innstillinger'`, men
  `tabs.forEach`-løkka (app.js:1619–1624) hopper eksplisitt over den
  (`if (tabSlugs[i] === 'innstillinger') return`) — den er kun nåbar via
  hash (`#/laerer/innstillinger`) eller hamburgeren, og `setTab`
  (app.js:1568–1584) skjuler `.fane-bar` når slugen er `innstillinger`
  (linje 1576). Hurtigstart bygges som en identisk «skjult fane» —
  samme rørledning, ny slug.
- **Illustrasjonene** trenger trolig mer bredde enn den smale
  `.settings-page` (680px). `.settings-page--admin`-varianten (920px,
  brukt av adminpanelets faner, jf. CLAUDE.md «Settings-mønster») passer
  bedre til SVG-innhold — foreslås brukt her fremfor standardvarianten.

### Åpent punkt — LØST 19. august 2026

`hurtigstart-uten-bilder.html` ble limt inn av Morfar i oppfølgingsøkten.
Innholdet er overført til `renderHurtigstartTab` (steg C) — se delplanen
under for detaljer om hva som ble tatt rett fra kilden og hva som ble
gjort dynamisk av hensyn til appens skolenøytrale arkitektur.

### Delplan

**A. Menypunkt i hamburgeren (`index.html` + `app.js`):**
- [ ] Ny knapp i dropdown-markupet (`index.html`, mellom `hdr-dd-profil`
      og `hdr-dd-innstillinger`): `<button ... id="hdr-dd-hurtigstart"
      class="hdr-dropdown-btn skjult">❓ Hurtigstart</button>` (tekst/emoji
      justeres ved behov — «❓ Hurtigstart» foreslått som forslag fra
      oppgaveteksten).
- [x] `oppdaterHeader()` (app.js): hent elementet, vis/skjul og koble
      onclick i SAMME blokk som `ddProfil` (linje 819–822) — synlig for
      alle innloggede roller, skjult i utlogget-grenen (linje 828–840,
      sammen med `ddProfil`/`ddInnstillinger`). Klikk lukker dropdownen
      og navigerer til `#/laerer/hurtigstart`.

**B. Ny «skjult fane»/route i lærervisningen (`app.js`):**
- [x] `renderLaererView`: `tabs.push('Hurtigstart');
      tabSlugs.push('hurtigstart')` etter `'innstillinger'`-linjen, med
      samme hopp-over i `tabs.forEach`-løkka — usynlig i den synlige
      fane-raden, nåbar via hash/hamburger.
- [x] `setTab`: ny gren `else if (slug === 'hurtigstart')
      renderHurtigstartTab(tabContent)`; `.fane-bar`-skjuling utvidet til
      å gjelde begge frittstående-sidene
      (`slug === 'innstillinger' || slug === 'hurtigstart'`).
- [x] Ny funksjon `renderHurtigstartTab(container)`: `.settings-page--admin`
      (bredere, pga. illustrasjoner) + `lagSettingsLukk()` øverst.
      FUNN UNDER BYGGING: `lagSettingsLukk()`s «X»-lukk hadde en
      fallback-feil som kun unntok slugen `'innstillinger'` — uten fiks
      ville «X» på Hurtigstart-siden navigert til `#/laerer/hurtigstart`
      (seg selv, uendelig løkke) i stedet for tilbake til klasse-fanen.
      Rettet til å unnta BEGGE frittstående slugene (`'innstillinger'` OG
      `'hurtigstart'`) — påvirker ikke Profil-sidens oppførsel, kun
      utvider unntaket. Verifisert i maskinsjekken under.

**C. Innhold (`app.js`) — LEVERT OG BYGGET 19. august 2026:**
- [x] Brødtekst + inline SVG-er fra `hurtigstart-uten-bilder.html`
      overført til `renderHurtigstartTab`: intro-kort (badge + tittel +
      ingress + kalender-SVG), fem nummererte steg-kort (hver med egen
      SVG), to `.advarsel-tekst`-varsler (gjenbruker eksisterende
      gul-boks-stil i stedet for en ny klasse), og ett rollekort med alle
      fire rollene («Lærer», «Elev», «Admin», «Skoleåret») + callout-boks
      SAMLET I ÉTT `.settings-card` (unngår boks-i-boks — samme lærdom
      som CLAUDE.mds kjente Skoleår-fane-punkt). SVG-markup limes inn via
      en liten `frag(html)`-hjelper (innerHTML på en frittstående
      wrapper) — trygt siden alt innhold er Morfars eget forfattede
      innhold, ikke bruker- eller databasedata.
- [x] To bevisste tilpasninger til appens skolenøytrale arkitektur
      (CLAUDE.md: «skolenøytral og åpen for flere skoler»), ellers
      innholdet uendret fra kilden: (1) footerens skolenavn hentes fra
      `APP.school?.name` i stedet for hardkodet «Øksnevad videregående
      skole»; (2) «Skoleåret»-rollens ukespenn hentes fra
      `APP.school?.school_year_start_week`/`school_year_end_week` i
      stedet for hardkodet «33»/«24» (begge med samme fallback-verdier
      som kilden hvis feltene mangler). Admin-kontakten
      (geir.edland@skole.rogfk.no) og «Geir Edland»-nevnelsen i
      Admin-rollen er beholdt uendret — reelt innhold for eneste skole i
      drift i dag, ingen billig dynamisk erstatning tilgjengelig.
- [x] Ingen nye rammeverk/biblioteker. Ingen endring av eksisterende
      `.settings-card`/`.settings-page`-stiler — kun nye tilleggsklasser
      (steg D).

**D. Minimal styling (`style.css`) — BYGGET:**
- [x] Nye `.hs-*`-klasser (intro/badge/steg/pill/roller/callout/footer)
      lagt til rett under settings-mønsteret (linje ~1249), ALLE bygget
      på eksisterende temavariabler (`--primær`, `--bg-kort`, `--kant`,
      `--tekst-svak` osv.) — ingen nye hardkodede farger, så innholdet
      følger automatisk skolens fargetema (standard/lys/mørk). Egen
      `@media (max-width: 560px)`-regel (samme brekkpunkt som kilden) for
      å stable steg-illustrasjonen under teksten og rollegridet til én
      kolonne på smal skjerm. Ingen endring av eksisterende stiler.

**E. Cache-bust + verifisering — FULLFØRT:**
- [x] Bump `app.js?v=20260819f` OG `style.css?v=20260819f` i
      `v4/index.html` (begge endret i denne runden).
- [x] Maskinverifisert (headless Chromium, stubbet Supabase — isolert
      harness, samme mønster som P41–P53): 22 sjekker, alle OK, ingen
      JS-feil (kun en godartet 404 for en ressurs som bevisst ikke er
      del av det isolerte test-harnesset). Dekker rørledningen fra forrige
      runde (meny/rute/lukk, inkl. at «X» IKKE lukker til seg selv) PLUSS
      innholdet: intro-kort, badge, SVG, ingress, fem steg-kort med riktig
      tittel/nummerering/SVG hver, pill-elementer, to varselbokser med
      mailto-lenke, fire rollekort, callout-boks, og de to dynamiske
      verdiene (skolenavn og skoleår-uker hentet fra `APP.school`, IKKE
      hardkodet «Øksnevad» i output når stub-skolen heter noe annet).
      Visuell kontroll med skjermbilder på desktop (1100px) og mobil
      (400px) — layout, temafarger og tekstbryting stemmer med
      kort-mønsteret ellers i appen.
- [ ] Morfars visuelle prod-sjekk (ingen preview-deploy i repoet, samme
      begrunnelse som P41–P53): innhold/illustrasjoner ser riktige ut i
      ekte nettleser, stemmer med kildefilen, og menyplasseringen føles
      naturlig. BEGRUNNET ÅPENT ved merge — kan først gjøres i produksjon.
- [x] PLAN.md-sjekkliste + statuslinje oppdatert i samme økt som PR-en.

## Økt 55 (P55): Slettede brukere blir liggende i adminpanelets brukerliste

### Kartlegging (verifisert i koden 19. august 2026)
- Antatt årsak BEKREFTET: myk sletting virker som den skal —
  `visSlettBrukerModal` (linje 5478 og 5486) skriver
  `deleted_at: new Date().toISOString()` på brukeren i begge grener
  (med/uten fremtidige økter). Ingen feil i selve slettelogikken.
- Bug bekreftet nøyaktig som beskrevet i oppgaven:
  - `renderBrukereTab` (linje 5159): `sb.from('users').select('*,
    user_classes(classes(*))').eq('school_id', APP.school.id)` —
    MANGLER `.is('deleted_at', null)`. Admin-RLS gir admin lov til å se
    myk-slettede rader → de dukker opp igjen ved refresh.
  - `visSlettBrukerModal` (linje 5456): kollega-nedtrekket «Overfør
    fremtidige økter til …» — `sb.from('users').select('*').eq('school_id',
    APP.school.id).neq('id', user.id)` — MANGLER
    `.is('deleted_at', null)`. En allerede slettet bruker kan dermed
    velges som mottaker for overførte økter.
- Full gjennomgang av alle `from('users')`-spørringer i `v4/app.js`
  (11 treff totalt): to linjer over er de eneste to som mangler filteret
  OG er i uttrykkelig scope for denne oppgaven. I tillegg funnet (IKKE i
  scope, rapporteres uten retting jf. avgrensningen):
  - Linje 2773 (`visNyOktModal`), 2982 (`visRedigerOktModal`), 3105
    (`visKopierOktModal`), 3232 (`visOverforModal`) — alle henter
    lærer-nedtrekk med `.eq('school_id', ...)` uten
    `.is('deleted_at', null)`. Samme underliggende mangel som P55, men i
    fire andre modaler (økt-lærervalg, ikke brukeradministrasjon). Utenfor
    dagens avgrensning («ikke endre andre faner i adminpanelet» / kun de
    to spørringene oppgaven peker på) — flagges til egen fremtidig
    plan-post, rettes ikke nå.
  - Linje 3405, 5195, 5290 har allerede korrekt `.is('deleted_at', null)`
    — ingen endring nødvendig der.
  - Linje 483 (egen profil ved innlogging), 527/583 (`is_admin_active`
    på egen bruker) — enkeltoppslag på innlogget brukers egen id, ikke
    lister; ikke relevante for denne bugen.

### Delplan
- [x] Legg `.is('deleted_at', null)` på brukerspørringen i
      `renderBrukereTab` (linje 5159).
- [x] Legg `.is('deleted_at', null)` på kollega-spørringen i
      `visSlettBrukerModal` (linje 5456).
- [x] Ingen SQL-endring. Ingen endring av `visSlettBrukerModal`s
      slettelogikk (linje 5468–5489) — den skriver allerede `deleted_at`
      korrekt.
- [x] Bump `app.js?v=20260819i` i `v4/index.html`.
- [x] Commit med beskrivende melding, push til
      `claude/P55-slettede-brukere-vises-i-adminliste`.
- [ ] Manuell testrunde for Morfar (BEGRUNNET ÅPENT — krever ekte
      innlogget admin-sesjon i produksjon/staging, ikke tilgjengelig i
      denne økten):
      1. Opprett en testbruker i adminpanelets brukerfane.
      2. Slett testbrukeren (🗑️) — bekreft ingen feilmelding.
      3. Last siden på nytt (refresh) — bekreft at testbrukeren IKKE
         lenger vises i brukerlisten.
      4. Opprett/slett en ny testbruker som HAR fremtidige økter, slik
         at «Overfør fremtidige økter til …»-nedtrekket vises — bekreft
         at den først slettede testbrukeren fra steg 2–3 IKKE dukker opp
         som valgbar mottaker i det nedtrekket.
- [x] PLAN.md-sjekkliste + statuslinje oppdatert i samme økt som PR-en.

**Status:** PR #166 squash-merget til main 19. august 2026. Kun Morfars
manuelle produksjonstest gjenstår (kan ikke utføres fra denne økten —
krever innlogget admin-sesjon).

## Økt (P56): Uke-navigator — Enter-tast registreres ikke

**Branch:** `claude/ukenavigator-enter-key-pjep16`.
**Scope:** KUN `v4/app.js` + cache-bust i `v4/index.html`. Ingen DB-endring,
ingen edge-funksjon.

**Bakgrunn:** Begge `uke-nr-input`-feltene (elevvisning ~1217, lærervisning
~1979) hadde kun `onchange` og lå i `<div class="nav-bar">`, ikke i et
`<form>`. Tooltip lovet «Skriv inn ukenummer og trykk Enter», men ingenting
fanget Enter-tasten — feltet navigerte kun ved å miste fokus (klikk et annet
sted eller Tab).

### Delplan
- [x] Lagt til `onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur() } }`
      på BEGGE `uke-nr-input`-feltene, rett ved siden av `onchange`.
      `blur()` trigger den eksisterende `onchange`-navigasjonen — ingen
      duplisert logikk. `min`/`max`/`value` og all annen logikk uendret.
- [x] Verifisert `el()`-hjelperen (app.js ~226) håndterer enhver `on*`-nøkkel
      generisk via `addEventListener(k.slice(2), v)` — `onkeydown` fungerer
      dermed identisk med `onchange`/`onclick`, ingen spesialhåndtering
      nødvendig.
- [x] Logisk gjennomgang av grensene: elevvisningens felt bruker
      `ukePosisjon(v, schoolStart)` mot `ukePosisjon(schoolEnd, schoolStart)`
      (min 1/max 52 på input-elementet, reell grense i `onchange`);
      lærervisningens felt bruker `v >= schoolStart && v <= schoolEnd`
      (min/max på input-elementet = reell grense). Begge uendret av denne
      fiksen — Enter kaller samme `onchange`, som allerede respekterer
      grensene.
- [x] Bump `app.js?v=20260819j` i `v4/index.html`.
- [x] `git diff --stat` mot origin/main bekrefter kun `v4/app.js`,
      `v4/index.html` og `PLAN.md` er endret.
- [x] Backlogg-punktet flyttet ut av «Klar til bygging» og statuslinjen
      oppdatert i samme commit.
- [x] Morfars manuelle prod-sjekk: bekreftet i Chrome mot
      `ukeplan1e.ganddal.net/v4/` 19. august 2026 — Enter i ukefeltet
      navigerer korrekt (Safari droppet av testen selv, pga. treg
      cache-oppdatering ved sidelasting — ikke relatert til denne fiksen).

**Status:** PR #167 squash-merget til main 19. august 2026. Morfars
produksjonstest bekreftet samme dag. P56 er ferdig.

## Økt (P57): Uinnlogget tilgangsforespørsel ved innlogging

**Branch:** `claude/p57-be-om-tilgang-0gisd5` (miljøets tildelte branch —
oppgaveteksten sa `claude/P57-be-om-tilgang`, samme situasjon som P34–P56).
**Scope:** ny SQL-migrasjon, ny edge function, `v4/app.js` + `v4/style.css`
+ cache-bust i `v4/index.html`. Ingen endring av eksisterende tabeller
utover én ny hjelpefunksjon; ingen endring av `create-user`/`admin-user`.

### Kartlegging (verifisert i koden 20. august 2026)

- **Innloggingssiden:** `renderLoginForm` (app.js:552–629) — enkelt kort med
  e-post/passord + «Glemt passord?». Ingen skolevelger noe sted i appen;
  `init()` henter skolen anonymt med `sb.from('schools').select('*').limit(1)`
  (app.js:6111/6122) — bekrefter «kun én skole per instans»-antakelsen.
- **Offentlig lesbare tabeller allerede i dag (RLS, 002_rls.sql):**
  `schools_read_public` (linje 55, `using (true)`), `subjects_read_any`
  (linje 75, kun `deleted_at is null`), `subject_divisions_read_any`
  (linje 82, samme). Skjemaet kan altså hente skole/fag/parti-lister LIVE
  med anon-nøkkelen uten noen RLS-endring.
- **`users`-tabellen er IKKE offentlig lesbar** (`users_read_own_school`,
  linje 101, krever `auth_school_id()` = innlogget). Admins fornavn kan
  derfor ikke hentes med et rått `select` fra klienten uinnlogget — trenger
  en egen, smal lesevei (se punkt A).
- **`sendVarsel()`-mønsteret** (admin-user/index.ts:11–25): Resend via
  `RESEND_API_KEY` + `RESEND_FROM`, «best effort» (returnerer `false` uten
  å kaste hvis ikke konfigurert). Gjenbrukes ordrett i den nye funksjonen.
  Miljøvariabler i Supabase Edge Functions er prosjektbrede — samme
  `RESEND_API_KEY`/`RESEND_FROM` som `admin-user` allerede bruker skal
  derfor være tilgjengelig for en ny funksjon uten eget oppsett (Morfar bør
  likevel bekrefte ved test, se del F).
- **Admin-flagg:** additivt `is_admin` (migrasjon 018_admin_additiv) +
  legacy `role = 'admin'`. Vanlig mønster andre steder i RLS:
  `is_active_admin() OR role = 'admin'` — brukes tilsvarende i den nye
  lesefunksjonen for å fange begge.
- **Adminpanelets fane-mønster:** `renderAdminPanel` (app.js:4424–4480) —
  faste arrays `tabs`/`tabSlugs` + `switch` i `setTab`. Ny fane «Forespørsler»
  legges inn som fane 5 (etter «Brukere», før «Skolerute»), samme
  `.settings-card`-innpakking som de andre ikke-Skoleinfo-fanene (P24).
- **Kontaktlærer-forklaringen** finnes ikke som egen tekstblokk i dag —
  bygges av det RLS/UI faktisk gir kontaktlærer utover vanlig lærer:
  redigere/slette andre læreres økter i klassen (kollegahjelp+, migrasjon 008
  §/009), sette opp fag/parti for klassen i «Klasse-admin»-fanen
  (`renderKlasseAdminTab`, app.js:4149), maks 3 kontaktlærere per klasse
  (migrasjon 009). Kort forklaringstekst i skjemaet bygges av dette — ingen
  eksisterende tekst å gjenbruke ordrett.
- **Neste migrasjonsnummer:** 023 (siste er `022_import_egne_klasser.sql`).

### Mål

1. Lærer uten konto kan sende en tilgangsforespørsel fra innloggingssiden,
   uten å logge inn.
2. Forespørselen lagres i en ny tabell, med status `venter` til admin tar
   stilling.
3. Skolens admin(er) varsles på e-post ved innsending.
4. Admin får en ny fane i adminpanelet som viser ventende forespørsler, med
   Godkjenn/Avvis som KUN endrer status — ingen automatisk kontoopprettelse.
5. Fag/parti-valget i skjemaet er ren informasjon til admin — ingen kobling
   opprettes i databasen (kontoen finnes ikke ennå).

### Delplan

**A. DB-migrasjon `023_tilgangsforesporsler.sql` — ⚠️ MANUELT STEG (Morfar
kjører i Supabase SQL Editor):**
- [x] Ny tabell `access_requests`: `id uuid pk default gen_random_uuid()`,
      `school_id uuid references schools(id)`, `full_name text not null`,
      `email text not null`, `requested_role text not null check
      (requested_role in ('laerer','kontaktlaerer'))`,
      `subjects_text text[]` (fagnavn, snapshot — IKKE FK mot `subjects`),
      `divisions_text text[]` (parti/gruppe-navn, snapshot — IKKE FK),
      `message text`, `status text not null default 'venter' check (status
      in ('venter','godkjent','avvist'))`, `created_at timestamptz not null
      default now()`, `decided_at timestamptz`, `decided_by uuid references
      users(id)`.
- [x] `CHECK`-constraint på e-post-domenet direkte i tabellen:
      `email ~* '@skole\.rogfk\.no$'` — databasen håndhever domenet uansett
      hva som kaller INSERT (dobbel sikring sammen med edge function-sjekken
      i del B).
- [x] RLS aktivert. INGEN insert-policy for anon/authenticated — innsending
      går KUN via edge function med service-role-nøkkel (del B), akkurat som
      `create-user`/`admin-user` i dag. Select/update kun for admin ved egen
      skole: `access_requests_admin_all` — `using (school_id =
      auth_school_id() and (is_active_admin() or role... )` — konkret:
      `is_active_admin()` (dekker begge admin-varianter siden `is_admin`
      styrer `is_admin_active`-toggelen).
- [x] Ny SECURITY DEFINER-funksjon `public_admin_fornavn()` (samme fil):
      returnerer `text[]` med fornavn (`split_part(full_name, ' ', 1)`) for
      alle `is_admin = true OR role = 'admin'`-brukere uten `deleted_at`,
      sortert. `grant execute … to anon, authenticated`. Eneste uinnloggede
      lesevei inn i `users`-tabellen — ingen andre felt eksponeres.

**B. Ny edge function `request-access` (uinnlogget, manuell deploy i
Supabase Dashboard):**
- [x] CORS + OPTIONS-handler som de andre funksjonene. Ingen
      Authorization-sjekk (uinnlogget per design) — bruker service-role-
      klient direkte for både lesing (finne skolen) og innsetting.
- [x] Validerer server-side (autoritativ, kan ikke stoles på klienten):
      `full_name` ikke-tomt, `email` ikke-tomt OG matcher
      `/@skole\.rogfk\.no$/i`, `requested_role` er `laerer` eller
      `kontaktlaerer`. Returnerer 400 med klar norsk feiltekst ved brudd.
- [x] Henter skolen (`schools.select('id').limit(1)` — samme
      «kun én skole»-mønster som `init()`), setter `school_id` på raden.
- [x] Setter inn i `access_requests` med `status: 'venter'`.
- [x] Henter alle admin-brukere ved skolen (`is_admin = true OR role =
      'admin'`, `deleted_at is null`), slår opp e-post per admin via
      `adminClient.auth.admin.getUserById` (samme kall som `admin-user`
      bruker for `gammelEpost`), og sender ett `sendVarsel(...)`-kall per
      admin — emne «Ny tilgangsforespørsel i Ukeplan», HTML med navn,
      e-post, ønsket rolle (+ kontaktlærer-forklart om det er valgt), fag,
      parti/gruppe og meldingen. Best-effort som i `admin-user` — svikt i
      e-post feiler ikke innsendingen.
- [x] Returnerer `{ ok: true }` ved suksess uansett om e-postvarsling
      lyktes (samme `notified`-mønster som `admin-user`).

**C. Frontend — skjema på innloggingssiden (`v4/app.js` + `style.css`):**
- [x] Ny lenke/knapp «Be om tilgang» under «Glemt passord?» i
      `renderLoginForm`, åpner `visBeOmTilgangModal()`.
- [x] Modalen henter LIVE ved åpning (anon-klient, ingen innlogging kreves):
      skole-id (`schools.select('id').limit(1)`), fag
      (`subjects.select('id,name').is('deleted_at', null).order('name')`),
      parti/gruppe (`subject_divisions` join `subjects` for navn — vises
      gruppert under fagnavn, f.eks. «Norsk — Parti A»), og admins fornavn
      via `sb.rpc('public_admin_fornavn')` (vist i modalens ingress: «Din
      forespørsel går til {navn}» — komma-separert ved flere).
- [x] Felt: Navn (tekst, påkrevd), E-post (påkrevd, klientvalidering
      `endsWith('@skole.rogfk.no')` case-insensitive med tydelig feiltekst
      FØR innsending — samme domenekrav som server), Ønsket rolle (radio
      lærer/kontaktlærer — velges kontaktlærer, vises kort forklaringstekst
      fra kartleggingen), Fag (avkrysningsbokser, flervalg), Parti/gruppe
      (avkrysningsbokser, flervalg, gruppert under fag), Melding til admin
      (fritekst, valgfri).
- [x] Innsending kaller `sb.functions.invoke('request-access', { body:
      {...} })` — INGEN skriving til `subjects`/`subject_divisions`/
      `user_classes` noe sted; kun tekst sendes videre.
- [x] Suksess: toast «Forespørselen er sendt til {admin}» + lukk modal.
      Feil (f.eks. galt domene fanget av serveren likevel, eller
      nettverksfeil): feilmelding i modalen, ingen lukking.
- [x] Minimal CSS for avkrysningslisten (gjenbruker `.felt`/`.skjema`/
      `.modal`-klassene der det går; kun ny CSS for evt.
      fag/parti-gruppering).

**D. Adminpanel — ny fane «Forespørsler» (`v4/app.js`):**
- [x] `tabs`/`tabSlugs` i `renderAdminPanel` utvides med «Forespørsler» /
      `foresporsler` (fane-indeks 5, etter Brukere); `switch` i `setTab`
      justeres tilsvarende (Skolerute/Funfacts sine case-tall skyves).
- [x] `renderForesporslerTab(container)`: henter `access_requests` for
      `APP.school.id` med `status = 'venter'`, sortert eldst først. Viser
      hver som et kort: navn, e-post, ønsket rolle, fag-liste, parti/
      gruppe-liste, melding, innsendt-dato — pluss «Godkjenn»/«Avvis»-knapper.
- [x] Godkjenn/Avvis: `medLagreOverlay` → `update({ status, decided_at:
      now, decided_by: APP.profile.id })` KUN på den ene raden — ingen
      kontooppretting, ingen forhåndsutfylling av «Opprett bruker»-skjemaet
      noe sted. Etter lagring: fjern kortet fra listen + toast.
- [x] Tom liste: «Ingen ventende forespørsler» (samme mønster som andre
      tomme-tilstander i appen).

**E. Cache-bust + verifisering:**
- [x] Bump `?v=20260820a` i `v4/index.html` (CSS + JS).
- [x] Maskinverifisering (headless Chromium, stubbet Supabase): modal åpnes
      fra innloggingssiden; fag/parti/admin-fornavn lastes live fra stub;
      klient-domenevalidering blokkerer galt domene med feiltekst; gyldig
      innsending kaller `request-access` med riktig body og INGEN skriving
      til `subjects`/`subject_divisions`/`user_classes`; adminfanen viser
      ventende forespørsler; Godkjenn/Avvis oppdaterer KUN status og fjerner
      kortet; tom-liste-tilstand.
- [x] `git diff --stat` mot `origin/main` bekrefter kun de planlagte filene
      er endret (migrasjon, ny edge function, `app.js`, `style.css`,
      `index.html`, `PLAN.md`).
- [x] `FUNKSJONELL-BESKRIVELSE.md`: legg til kort omtale av den nye
      tilgangsforespørsel-flyten (uinnlogget skjema → admin godkjenner
      manuelt).
- [x] PLAN.md-sjekkliste + statuslinje oppdatert i samme økt som PR-en.

**F. Manuelle steg for Morfar (etter merge):**
- [ ] Kjør `023_tilgangsforesporsler.sql` i Supabase SQL Editor.
- [ ] Deploy `request-access` i Edge Functions-dashbordet (ny funksjon —
      opprett den der først).
- [ ] Bekreft at `RESEND_API_KEY`/`RESEND_FROM` faktisk når den nye
      funksjonen (send én reell testforespørsel og se om admin-e-posten
      kommer frem) — hvis ikke, kopier hemmelighetene inn på den nye
      funksjonens Secrets-fane manuelt.
- [ ] Visuell/funksjonell test i produksjon: send en forespørsel uinnlogget,
      bekreft e-postvarsel til admin, bekreft raden dukker opp i
      adminpanelets nye fane, test både Godkjenn og Avvis.

### Valg tatt (ingen innsigelser ved «kjør» — bygget som foreslått)

- Tabell-/funksjonsnavn (`access_requests`, `request-access`,
  `public_admin_fornavn`) og fane-plassering («Forespørsler» etter Brukere,
  fane-indeks 5) er som foreslått.
- Fag/parti lagres som tekst-snapshot (`text[]`), ikke FK-er — i tråd med
  «ren informasjon, ingen kobling». Forespørselen følger derfor IKKE
  automatisk med hvis et fag omdøpes/slettes senere — kun et øyeblikksbilde
  fra innsendingstidspunktet.
- Ingen spam-/rate-beskyttelse bygget (ikke bedt om) — kun domenesjekk
  (klient + DB CHECK-constraint + edge function, tre lag). Kan vurderes som
  eget punkt senere hvis det blir et problem i praksis.
- Godkjente/avviste forespørsler blir liggende i tabellen (ingen sletting/
  arkivering bygget) — kun `venter`-status vises i adminfanen. Rydding kan
  evt. legges til `cleanup`-funksjonen i en senere økt hvis ønskelig.

### Status

**Kode ferdig og maskinverifisert** 20. august 2026 — headless Chromium mot
ekte `app.js`/`style.css` med stubbet Supabase (server + edge functions),
22 sjekker, alle OK: «Be om tilgang»-modalen åpnes fra innloggingssiden med
live-hentet admin-fornavn/fag/parti-liste, kontaktlærer-forklaringen
toggles korrekt, klient-domenevalidering blokkerer feil domene FØR noe
sendes til serveren, gyldig innsending kaller `request-access` med riktig
payload og skriver INGEN steder til `subjects`/`subject_divisions`/
`user_classes`, adminfanen «Forespørsler» viser ventende forespørsel og
Godkjenn oppdaterer KUN `access_requests.status` uten å opprette noen bruker.
`node --check` OK på `app.js`. `git diff --stat` mot `origin/main` bekrefter
kun planlagte filer + ny migrasjon/edge function.

**PR #168 squash-merget til main 20. august 2026** etter Morfars uttrykkelige
«merge» (jf. live-status i PROSEDYRER.md).

**Del F — Morfars manuelle steg, gjennomført og verifisert i produksjon
20. august 2026:**
- [x] Migrasjon 023 kjørt i SQL Editor.
- [x] `request-access` deployet (etter to omveier: først feil
      Supabase-generert slug `clever-processor` — slettet og gjenopprettet
      med riktig navn `request-access`; deretter viste det seg at Code-fanen
      inneholdt Supabase sin standard eksempelkode («Hello world») i stedet
      for vår kode — copy/paste hadde ikke tatt. Rettet ved å lime inn
      kildefilen på nytt og redeploye).
- [x] Ekte funksjonstest i produksjon: forespørsel sendt uinnlogget →
      `request-access` svarer `{"ok": true, ...}` → raden lagres korrekt i
      `access_requests` (bekreftet i Table Editor) → dukker opp i
      adminfanen «Forespørsler» med riktig navn/e-post/rolle/fag/parti/
      melding. Underveis oppdaget og rettet: feilmeldingen i «Be om
      tilgang»-modalen var kun synlig øverst og ble usett ved nedscrollet
      skjema — duplisert til også å vises over «Send forespørsel»-knappen
      (`?v=20260820b`, egen commit direkte til main).
- [x] E-postvarsel til admin — BEKREFTET FUNGERENDE 20. august 2026, via
      Formspree (byttet fra Resend, se DECISIONS.md): e-post mottatt med
      alle riktige felter (navn, e-post, rolle, fag, parti/gruppe, melding).
      `admin-user`s EGNE, separate Resend-varsler (passord-/e-post-endring)
      er fortsatt uverifiserte — egen backloggsak, ikke en del av P57.
- [x] Adminfanen «Forespørsler» — BEKREFTET FUNGERENDE i produksjon: alle
      ventende testforespørsler ble synlige etter at Morfar slo på
      admin-modus-bryteren («Admin»-knappen i header). Underveis avdekket
      og dokumentert som eget backloggpunkt: adminpanelets rute krever kun
      det permanente `is_admin`-flagget, mens RLS bak dataene også krever
      den separate `is_admin_active`-sesjonsbryteren — et stille,
      forvirrende tomt resultat når de er ute av synk (ikke en P57-feil i
      seg selv, men avdekket her).
- [~] Godkjenn/Avvis: koden er maskinverifisert (PR #168, oppdaterer kun
      `access_requests.status`); ikke eksplisitt klikket av Morfar i denne
      runden, men lav risiko — verifiseres uformelt neste gang en reell
      forespørsel behandles.

**P57 er FERDIG — hele funksjonskjeden bekreftet i produksjon 20. august
2026.**

**Konklusjon: P57s kjernefunksjon (uinnlogget forespørsel → lagret → synlig
i adminpanelet) er bygget, merget og bekreftet fungerende i produksjon.**
E-postvarselet er et tillegg som avhenger av en ekstern tjeneste ingen har
verifisert er riktig satt opp — eget backlogg-punkt, ikke en P57-feil.

## Økt 58 (P58): Fag med flere enn 8 inndelinger kan ikke lagres

**Branch:** `claude/P58-maks-inndelinger`
**Feil:** I adminpanelet → Fag → «Rediger fag» kan `max_divisions` settes
til 9–20 i skjemaet (`app.js` tillater 1–20), men databasens CHECK-
constraint på `subjects.max_divisions` (fra `001_initial_schema.sql`)
tillater kun 1–8. Lagring feiler med rå Postgres-feiltekst
(`subjects_max_divisions_check`), og ingen inndelingsnavn lagres.
**Årsak (bekreftet, ikke re-kartlagt):** `app.js` er allerede korrekt
(1–20 begge steder: skjema-input og `oppdaterDivNavn`-klampen). Kun
databasens CHECK-constraint (satt av migrasjon 001, kjørt for lenge
siden — kan ikke endres i den filen uten at filen lyver om hva
produksjonsbasen faktisk inneholder) står fast på 1–8.
**Kontroll før start:** Bekreftet at `origin/main` (etter `git fetch`,
commit `1147532` «Change max_divisions default value and constraint»)
har `001_initial_schema.sql` linje 47 uendret tilbake til
`default 8 check (max_divisions between 1 and 8)`, og at arbeidstreet
er rent (`git status` → «nothing to commit»). Ingen re-redigering av 001.

**Sjekkliste:**
- [x] Ny fil `v4/supabase/migrations/024_maks_inndelinger.sql` —
      idempotent DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT
      `subjects_max_divisions_check` med `max_divisions between 1 and 20`.
      Kommentarblokk i 021-stil: bakgrunn (skjemaet tillater 1–20, DB
      tillot kun 1–8), at DB-taket nå matcher appens 1–20, og at CHECK
      kun ser egen rad (kan derfor ikke gjøres dynamisk per skole — ville
      krevd trigger, bevisst ikke gjort her).
- [x] DEFAULT uendret (fortsatt 8) — ikke satt til 20, siden det ville gitt
      20 tomme «Gruppe N:»-navnefelt for hvert nytt fag.
- [x] Ingen endring i `v4/app.js` (allerede riktig 1–20) eller andre
      frontend-filer — bekreftet med `git diff --stat origin/main` (tom
      diff på app.js/style.css/index.html) og `node --check v4/app.js`
      (OK). Ingen cache-bust nødvendig (ingen JS/CSS-endring).
- [x] `CLAUDE.md`: `subjects`-skjemalinja oppdatert med
      `max_divisions (1–20, migrasjon 024)`, og migrasjonslisten i
      filstruktur-seksjonen oppdatert til å inkludere 022, 023 og 024
      (listen stoppet på 021 fra før — henger etter faktisk innhold).
- [x] `DECISIONS.md`: notat om rollefordelingen database vs. app — databasen
      er en vernebøyle (fast, romslig 1–20-tak), appen holder den praktiske
      grensen. Ikke foreslå trigger-basert dynamisk tak igjen uten ny
      begrunnelse.
- [x] `PLAN.md` sjekkliste + statuslinje oppdatert i samme økt.
- [x] Backloggpunkt for oversettelse av rå Postgres-feiltekst lagt til i
      «Klar til bygging».

**Utenfor scope:** selve oversettelsen av rå Postgres-feilmeldinger til
lesbar norsk i feiloverlayet — kun foreslått som backloggpunkt, ikke bygget.

**Status:** Kode ferdig 20. august 2026. Ingen kjørbar app-endring i denne
økten (kun ny migrasjonsfil + dokumentasjon), så ingen headless/UI-verifisering
er relevant — sjekket med `node --check` og `git diff --stat` mot
`origin/main` at ingen andre filer enn de planlagte er rørt.

**PR #169 squash-merget til main 20. august 2026.**

**Manuelt steg til Morfar — GJENNOMFØRT OG VERIFISERT i produksjon
20. august 2026:** migrasjon `024_maks_inndelinger.sql` kjørt i Supabase
SQL Editor. Kontrollspørring:
`select pg_get_constraintdef(oid) from pg_constraint where conname = 'subjects_max_divisions_check';`
ga bekreftet forventet svar: `CHECK (((max_divisions >= 1) AND (max_divisions <= 20)))`.

**P58 er FERDIG — ingen gjenstående punkter.**

---

## Økt 59 (P59): Prosedyrer oppdatert til «live» — merge stopper alltid ved godkjenning

**Branch:** `claude/P59-prosedyrer-etter-live`
**Bakgrunn:** PROSEDYRER.md har fortsatt en «Før 1. august 2026 / etter
1. august 2026»-todeling av merge-steget, med direkte squash-merge som
gyldig variant «før live». Datoen er passert og løsningen er i ferd med
å gå live med ekte brukere — todelingen skal fjernes, ikke bare
oppdateres, slik at den ikke kan misforstås eller brukes feil senere.

**Sub-plan:**

**A. PROSEDYRER.md — «Status: Før live / Etter live»**
- [x] Seksjonen skrevet om til «Status: Live» — slår fast at løsningen NÅ
      er live (ekte brukere), uten dato-betinget språk.
- [x] Avslutningsprosedyrens punkt 6 («Merge») mistet sin to-variants
      struktur. Kun én variant igjen: Code stopper ALLTID ved «PR klar til
      merge» og venter på Morfars uttrykkelige «merge». «Før live:
      squash-merge til main»-varianten er fjernet helt (ikke kommentert ut).

**B. PROSEDYRER.md — ny seksjon «Slik tester Morfar før merge»**
- [x] Plassert rett etter avslutningsprosedyren (mellom punkt 7 og «Mal:
      ferdig Code-prompt»).
- [x] Tre nivåer, i rekkefølge:
      1. PR-ens «Files changed»-fane.
      2. Direkte fillenke i branchen:
         `https://github.com/b8yxcmzr9w-sketch/Ukeplan1E/blob/<branch>/<fil>`
      3. Kjørbar app fra branchen via
         `https://raw.githack.com/b8yxcmzr9w-sketch/Ukeplan1E/<branch>/v4/index.html`
         — markert som ENNÅ IKKE BEKREFTET, må prøves én gang mot main
         først. Tydelig ADVARSEL: `SUPABASE_URL`/`SUPABASE_ANON_KEY` er
         hardkodet i `app.js`, så previewen snakker med SAMME database
         som produksjon — lagring/endring/sletting treffer ekte data.
         Notert at passord-reset og invitasjonslenker ikke fullføres i
         previewen (peker tilbake til produksjonsadressen).
- [x] Fast sjekkliste til slutt: test på PC og telefon, gå gjennom
      øktens PLAN.md-punkter, hard refresh (Cmd+Shift+R), kontroller at
      elevvisning, «Min klasse», «Alle mine økter», «Ny økt» og
      adminpanelet fortsatt virker.

**C. PROSEDYRER.md — avslutningsprosedyrens punkt 7 («Norsk sluttoppsummering»)**
- [x] Utvidet slik at oppsummeringen ALLTID inkluderer branch-navnet OG
      den ferdige raw.githack-preview-lenken (satt sammen fra branchen,
      ikke noe Morfar må bygge selv).

**D. CLAUDE.md — «Arbeidsrutiner»**
- [x] Alle 8 filer lest (CLAUDE.md, PLAN.md, DECISIONS.md, PROSEDYRER.md,
      FUNKSJONELL-BESKRIVELSE.md, BACKLOGG-UX-MOBIL.md,
      UTREDNING-skolear-oppsett.md, README.md), og linje per fil skrevet
      om hva den faktisk inneholder og når den skal oppdateres — basert på
      reelt innhold.
- [x] **Avvik fra oppgaveteksten oppdaget og rettet:** README.md er IKKE
      tom slik oppgaven antok — den inneholder en generisk to-linjers
      GitHub-standardstub («# praksisplan» / «Praksisplan ukeplan») uten
      reelt innhold om Ukeplan1E. Notert som fakta i CLAUDE.md (ikke
      «tom», men «ubrukt stub»); filen er IKKE rørt/slettet.
- [x] Erstattet linjen «Eneste redigerbare områder: `v4/`, `CLAUDE.md` og
      `PLAN.md`» (CLAUDE.md linje 19) med full liste over alle 8
      .md-filer + ett-linjes formål/oppdateringspunkt hver. Fredet-lista
      (`index.html`, `CNAME`, `appsscript.gs`, `logo.png`, `info/`,
      `dev/`) er uendret.

**E. PLAN.md — statuslinje (presisert av Morfar, egen del)**
- [x] STATUSLINJE øverst i PLAN.md oppdatert i samme commit: siste
      fullførte P-nummer (P59), neste ledige (P60) og dato
      (23. august 2026).

**Scope:** kun `PROSEDYRER.md`, `CLAUDE.md` og `PLAN.md` (statuslinje).
Ingen kode i `v4/`, ingen migrasjon, ingen cache-bust, ingen edge
functions, ingen nye filer.

**Merk:** P59 er den siste økten som merges under den gamle
direkte-merge-regelen (siden regelen som fjernes ennå gjaldt da denne
økten startet). Fra og med P60 gjelder den nye regelen som nå er skrevet
inn i PROSEDYRER.md: Code stopper alltid ved «PR klar til merge».

**Status:** Kode og dokumentasjon ferdig. `node --check` er ikke relevant
(ingen JS rørt); bekreftet med `git diff --stat` at kun `PROSEDYRER.md`,
`CLAUDE.md` og `PLAN.md` er endret. P59 er FERDIG.

---

## Økt 60 (P60): Opprydding av kalenderdata før live

**Branch:** `claude/calendar-cleanup-live-tgh5jw` (miljøets tildelte
branch — oppgaveteksten foreslo `claude/P60-opprydding-for-live`, men
miljøet hadde allerede opprettet denne, og den følges i stedet).
**Status:** FERDIG OG VERIFISERT 24. august 2026. PR #171 squash-merget
til main. Migrasjonen er kjørt av Morfar i Supabase SQL Editor (alle tre
deler) og bekreftet: «alt er kjørt og det ser godt ut». P60 er FERDIG.

### Bakgrunn

Databasen inneholder testinnhold som ikke skal følge med inn i live drift:
syntetiske økter fra migrasjon 013, importerte 25/26-planer fra migrasjon
014–016, og økter Morfar selv har lagt inn under testing av 26/27.
**Prinsippet:** innholdet i kalenderen tømmes, rammen rundt står.

- **Slettes** (hard delete, alle skoler, alle skoleår): `sessions`,
  `multi_day_events`. `session_divisions` og `pending_transfers` rydder
  seg selv via `on delete cascade` fra `sessions` — ingen egne
  slette-setninger.
- **Består urørt:** `school_calendar` (skoleruta), `classes`, `subjects`,
  `subject_divisions` (oppsett/struktur, ikke hendelser — inkl. de nye
  YFF-gruppene Morfar nettopp la inn), `users`, `user_classes`,
  `schools`, `school_facts`, `access_requests`, `audit_log` (loggen
  beholder rader som viser til slettede økter, med vilje).
- **Utenfor scope:** de syntetiske testfagene (Norsk, Matematikk,
  Engelsk, Kroppsøving) ryddes IKKE av P60 — det er oppsett, ikke en
  hendelse. Morfar rydder selv i Fag-fanen når alle økter er borte
  (se «Ikke lukket av P60» nederst).

### Fire avklaringer med Morfar (24. august 2026) — alle besvart «ja», med tillegg

1. **Sikkerhetskopi i databasen** — ja. `sessions_backup_for_live` og
   `multi_day_events_backup_for_live` opprettes som rene kopier, med RLS
   PÅ og ingen policyer (kun service-role/SQL Editor kan lese dem — de
   skal ikke være eksponert via det offentlige API-et som resten av
   `public`-skjemaet).
2. **Del 2 utkommentert** — ja, HELE blokken (inkl. backup-opprettelsen).
   Backup-opprettelsen ligger som FØRSTE steg INNE i den utkommenterte
   transaksjonen — ikke som et eget steg utenfor — slik at det er umulig
   å kjøre slettingen uten samtidig å ha tatt kopi.
3. **Del 1 teller flere tabeller** — ja. I tillegg til `sessions`/
   `multi_day_events` (fordelt på skoleår) telles også `school_calendar`,
   `classes`, `subjects` og `subject_divisions` (fordelt på skole), slik
   at del 3 har noe å sammenligne «uendret» mot.
4. **DECISIONS.md-oppføring** — ja, om skillet «kalenderhendelse»
   (slettbart) vs. «oppsett» (består). I tillegg: PLAN.md skal notere at
   backup-tabellene droppes når Morfar har bekreftet at oppryddingen er
   riktig, med de to DROP-setningene ferdig skrevet (se eget avsnitt
   nederst i denne sub-planen).

### Sjekkliste

- [x] Ny fil `v4/supabase/migrations/025_opprydding_for_live.sql` skrevet
      etter utkastet under («Utkast til migrasjonsfilen»).
- [x] ⚠️-blokk øverst i fila: ENGANGSKJØRING før live, DELETE-setningene
      er uten WHERE og treffer ALLE skoler og ALLE skoleår, fila skal
      ALDRI kjøres på nytt etter at ekte brukere har lagt inn data. IKKE
      beskrevet som idempotent eller «trygt å kjøre flere ganger» noe
      sted i fila (bevisst — leses som en invitasjon til gjenkjøring).
- [x] Del 1 (tellespørringer) kjørbar alene, ingen transaksjon, dekker
      alle seks tabellene (sessions + multi_day_events fordelt på
      skoleår; school_calendar + classes + subjects + subject_divisions
      fordelt på skole).
- [x] Del 2 (slettingen) HELT utkommentert som ÉN `/* ... */`-blokk (endret
      fra `-- ` per linje etter Morfars presisering 24.08.2026 — aktiveres
      ved å slette de to linjene `/*` og `*/`, ikke tretti enkeltlinjer).
      Backup-opprettelse + RLS-på-uten-policyer som første steg inne i
      `BEGIN…COMMIT`, deretter de to `DELETE`-setningene.
- [x] Del 3 (kontroll) kjørbar alene: `sessions`/`multi_day_events`
      forventes 0, de fire oppsett-tabellene forventes samme tall som i
      del 1.
- [x] `DECISIONS.md`: ny oppføring «P60 — kalenderhendelse vs. oppsett»
      lagt til (se innhold under).
- [x] `PLAN.md`: denne sjekklisten krysset av, STATUSLINJE oppdatert
      (siste fullførte → P60), og backlogg-punktet «Syntetiske testfag i
      prod-databasen» merket eksplisitt IKKE lukket av P60.
- [x] Ingen endring i `v4/app.js`, `v4/style.css` eller `v4/index.html`.
      Ingen cache-bust (ingen frontend-endring). Ingen edge functions.

### Utkast til migrasjonsfilen (for gjennomlesning før «kjør»)

```sql
-- ═══════════════════════════════════════════════════════════════
-- ⚠️  ENGANGSKJØRING FØR LIVE — LES FØR DU KJØRER NOE SOM HELST
-- ═══════════════════════════════════════════════════════════════
-- Denne fila tømmer sessions og multi_day_events FULLSTENDIG — alle
-- skoler, alle skoleår, ingen WHERE-betingelse. Den er laget for å
-- kjøres ÉN gang, rett før løsningen går live med ekte brukere.
--
-- Kjør ALDRI denne fila på nytt etter at ekte brukere har lagt inn
-- data — del 2 sletter da ekte undervisningsplaner uten mulighet
-- til å angre utover backup-tabellene fila selv oppretter.
--
-- Ta backup FØR del 2 kjøres (se del 2 — backup-opprettelsen ligger
-- inne i den utkommenterte transaksjonen som første steg).
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- DEL 1 — TELLESPØRRINGER (kjøres FØRST og ALENE)
-- Rene SELECT-er, ingen endring. Noter tallene før du går videre
-- til del 2 — del 3 sammenligner mot disse.
-- ═══════════════════════════════════════════════════════════════

-- Skal SLETTES i del 2:
select school_year, count(*) as antall
  from sessions
 group by school_year
 order by school_year;

select count(*) as sessions_totalt from sessions;

select school_year, count(*) as antall
  from multi_day_events
 group by school_year
 order by school_year;

select count(*) as multi_day_events_totalt from multi_day_events;

-- Skal BESTÅ uendret (sammenlignes i del 3):
select school_id, count(*) as antall from school_calendar group by school_id;
select count(*) as school_calendar_totalt from school_calendar;

select school_id, count(*) as antall from classes group by school_id;
select count(*) as classes_totalt from classes;

select school_id, count(*) as antall from subjects group by school_id;
select count(*) as subjects_totalt from subjects;

select sub.school_id, count(*) as antall
  from subject_divisions sd
  join subjects sub on sub.id = sd.subject_id
 group by sub.school_id;

select count(*) as subject_divisions_totalt from subject_divisions;


-- ═══════════════════════════════════════════════════════════════
-- DEL 2 — SLETTING (⚠️ se advarselen øverst i fila)
--
-- Hele blokken under er kommentert ut som ÉN /* ... */-blokk (endret
-- fra `-- ` per linje etter Morfars ønske 24.08.2026 — aktiveres ved å
-- slette KUN de to linjene "/*" og "*/", ikke tretti enkeltlinjer).
-- Gjør dette BEVISST, kun når du faktisk skal kjøre slettingen.
-- ═══════════════════════════════════════════════════════════════

/*
BEGIN;

-- Sikkerhetskopi FØRST, inne i samme transaksjon som slettingen.
-- Radene kan settes tilbake med "insert into sessions select * from
-- sessions_backup_for_live" (og tilsvarende for multi_day_events)
-- siden classes/subjects/users står urørt.
create table if not exists sessions_backup_for_live as
  select * from sessions;
create table if not exists multi_day_events_backup_for_live as
  select * from multi_day_events;

-- RLS på, uten policyer: tabellene havner i public-skjemaet som
-- Supabase eksponerer via API-et, og skal ikke være lesbare utenfra.
-- Uten policyer er de kun tilgjengelige for service-role og SQL Editor.
alter table sessions_backup_for_live enable row level security;
alter table multi_day_events_backup_for_live enable row level security;

-- session_divisions og pending_transfers rydder seg selv via
-- "on delete cascade" fra sessions — ingen egne slette-setninger.
delete from sessions;
delete from multi_day_events;

COMMIT;
*/


-- ═══════════════════════════════════════════════════════════════
-- DEL 3 — KONTROLL (kjøres ETTER del 2)
-- ═══════════════════════════════════════════════════════════════

-- Forventet: 0 rader begge steder
select count(*) as sessions_gjenvaerende from sessions;
select count(*) as multi_day_events_gjenvaerende from multi_day_events;

-- Forventet: SAMME tall som i del 1
select school_id, count(*) as antall from school_calendar group by school_id;
select count(*) as school_calendar_totalt from school_calendar;

select school_id, count(*) as antall from classes group by school_id;
select count(*) as classes_totalt from classes;

select school_id, count(*) as antall from subjects group by school_id;
select count(*) as subjects_totalt from subjects;

select sub.school_id, count(*) as antall
  from subject_divisions sd
  join subjects sub on sub.id = sd.subject_id
 group by sub.school_id;

select count(*) as subject_divisions_totalt from subject_divisions;
```

### Opprydding av backup-tabellene (senere, IKKE nå)

Når Morfar har bekreftet at oppryddingen er riktig (etter noen dager/uker
i live drift, ikke samme dag), kan backup-tabellene droppes. Klar til å
kopiere rett inn i SQL Editor når den tid kommer:

```sql
drop table if exists sessions_backup_for_live;
drop table if exists multi_day_events_backup_for_live;
```

### DECISIONS.md — planlagt oppføring

```
## P60 — Kalenderhendelse vs. oppsett (24.08.2026)

Før live-lansering ble databasen tømt for testinnhold (migrasjon 025).
Skillet som styrte HVA som ble slettet og HVA som besto, er en bevisst
grense som ikke skal forhandles på nytt uten en ny, konkret begrunnelse:

- **Kalenderhendelse (slettbart):** `sessions`, `multi_day_events`. Dette
  er hendelser lærere/admin legger inn løpende — testdata, syntetiske
  eller ekte, har ingen verdi etter at live-drift starter med ekte
  brukerdata.
- **Oppsett (består):** `school_calendar`, `classes`, `subjects`,
  `subject_divisions`, `users`, `user_classes`, `schools`, `school_facts`,
  `access_requests`, `audit_log`. Dette er strukturen hendelser peker på
  — klassenavn, fagnavn, partier/grupper, skolerute, brukere. Slettes
  IKKE selv om alle hendelser slettes, og skal ikke ryddes automatisk av
  fremtidige oppryddingsmigrasjoner uten en egen, eksplisitt vurdering.

De syntetiske testfagene (Norsk, Matematikk, Engelsk, Kroppsøving) faller
under «oppsett» og ble derfor IKKE slettet av P60, selv om de stammer fra
testdata — det er trygt for Morfar å rydde dem selv i Fag-fanen når alle
økter er borte, i dialog med faglærerne.
```

### Ikke lukket av P60

Backlogg-punktet «Syntetiske testfag i prod-databasen» lukkes IKKE av
denne økten — se «Utenfor scope» over.

### Manuelt steg til Morfar (etter merge)

1. Kjør Del 1 i Supabase SQL Editor, noter tallene.
2. Ta stilling til om han vil kjøre Del 2 nå — fjern kommentartegnene
   bevisst, kjør blokken.
3. Kjør Del 3, sammenlign mot tallene fra Del 1.
4. (Senere, ikke samme dag) Drop backup-tabellene med de to
   `DROP TABLE`-setningene over, når han er trygg på at oppryddingen er
   riktig.

---

## Økt 61 (P61): Fjern «Parti/gruppe» fra «Be om tilgang»-skjemaet

**Branch:** miljøets tildelte branch `claude/remove-divisions-access-form-won4xl`
(oppgaveteksten sa `claude/P61-fjern-parti-i-tilgangsskjema`, samme situasjon
som P34–P44).
**Scope:** KUN `v4/app.js` (funksjonen `visBeOmTilgangModal`, fra ca. linje
641) + cache-bust i `v4/index.html` + én oppføring i DECISIONS.md. Ingen
migrasjon, ingen edge function-endring, ingen endring av adminpanelets
forespørsels-kort eller parti/gruppe andre steder i appen.

### Bakgrunn
P57 bygget skjemaet med to avkryssingslister: fag OG parti/gruppe.
Parti-listen viser hver inndeling ved skolen på formen «Fag — Type: Navn
(Klasse)» — for detaljert og for lang for en søker som ennå ikke har konto.
Fag-listen skal beholdes uendret.

### Delplan

- [x] Fjern skjemaraden «Parti/gruppe»: `divContainer` +
      `lagFormRad('Parti/gruppe', divContainer)` (app.js ~677–678)
- [x] Fjern `divisionsText`-innsamlingen i submit-handleren (app.js ~710) og
      `divisions_text`-feltet fra kallet til
      `sb.functions.invoke('request-access', …)` (app.js ~719)
- [x] Fjern spørringen mot `subject_divisions` i `Promise.all`-blokken
      (app.js ~741–745) — skjemaet henter da kun skole, fag og admins
      fornavn
- [x] Fjern løkken som bygger avkryssingsboksene for parti/gruppe + teksten
      «Ingen parti/gruppe registrert.» (app.js ~760–770)
- [x] Rett opp kommentarene i og over funksjonen (app.js ~637–640 og ~738,
      pluss P57-scrolling-kommentaren app.js ~680) så de ikke lenger lover
      et parti/gruppe-valg i skjemaet
- [x] Bump `?v=20260824a` i `v4/index.html` (kun JS — CSS uendret)
- [x] DECISIONS.md: ny oppføring («P61 — Tilgangsskjemaet spør ikke lenger
      om parti/gruppe») om at `access_requests.divisions_text`-kolonnen
      (migrasjon 023, `not null default '{}'`) beholdes uendret — nye rader
      får tom liste, eldre forespørsler beholder innholdet sitt
- [x] Lesekontroll (ingen kodeendring): bekreftet at adminpanelets
      forespørsels-kort (app.js ~5659) fortsatt viser «Parti/gruppe»-linjen
      kun `if (f.divisions_text?.length)`, slik at eldre rader ikke mister
      informasjon og nye rader ikke viser en tom linje
- [x] Commit + push

**Bevisst IKKE endret:** databasen (ingen migrasjon), edge-funksjonen
`request-access` (ingen redeploy — den leser feltet defensivt med
`Array.isArray(...) ? ... : []`), adminpanelets forespørsels-kort, og
parti/gruppe andre steder i appen (økt-skjemaene, elevfilteret,
klasse-admin — `selected_divisions` finnes flere andre steder i app.js og
skal stå urørt).

---

## Økt 62 (P62): Flytt v4-appen til rota

**Branch:** miljøets tildelte branch `claude/move-app-v4-to-root-untc86`
(oppgaveteksten sa `claude/P62-flytt-app-til-rot`, samme situasjon som
P34–P44 og P61).
**Scope:** filflytting (arkivering av frossen løsning + løft av v4/ til rot),
dokumentoppdatering av stier, cache-bust. Ingen funksjonell kodeendring i
appen selv utover det som kreves for at ting fortsatt virker etter flytting.
Frysregelen er eksplisitt opphevet for denne økten (Morfar har godkjent),
og skrives om i CLAUDE.md som del av økten.

### Funn før koding — avvik fra oppgaveteksten

Oppgaveteksten antar at «bruksanvisning»-lenken (❓ Bruksanvisning) i den
gamle løsningen peker **relativt** til `info/`, og derfor fortsetter å
virke når begge havner under `gammel/`. Ved gjennomgang av koden viser det
seg lenken faktisk er **absolutt**, og det finnes en tredje selvlenke til
med samme problem. Rettet av Morfar til **rot-relative** stier (ikke
mappe-relative — `dev/index.html` havner på `gammel/dev/index.html`, så en
vanlig relativ `info/`-lenke derfra ville truffet `gammel/dev/info/`, som
ikke finnes):

1. `index.html` linje 519: `href="https://ukeplan1e.ganddal.net/info/"` →
   `href="/gammel/info/"`
2. `dev/index.html` linje 519: samme lenke, samme retting →
   `href="/gammel/info/"`
3. `info/index.html` linje 314: `href="https://ukeplan1e.ganddal.net"`
   (uten sti, i en «gå til ukeplan1e.ganddal.net»-instruks som beskriver
   DEN GAMLE løsningen) → `href="/gammel/"`, ellers sender bruksanvisningen
   leseren til den NYE appen på rota, midt i en instruks om den gamle.

Sjekket og IKKE endret: `info/index.html` linje 278 (`ukeplan1e.ganddal.net`
i ren tekst, ingen `href`) — fortsatt korrekt domenenavn, ingen lenke å
rette. `appsscript.gs` og `README.md` (nå arkivens) har ingen treff på
domenet i det hele tatt.

Disse tre er de ENESTE innholdsendringene i de ellers uendrede, arkiverte
filene — dokumenteres som en uttrykkelig, avgrenset dispensasjon fra
frysregelen i DECISIONS.md (begrunnelse: absolutte selvlenker overlever
ikke en flytting). Går videre med dette med mindre Morfar sier noe annet
ved «kjør».

**Rettelse ved «kjør»:** Morfar presiserte samtidig at `v4/`-mappa IKKE skal
slettes ennå («ikke slett /v4 før jeg bekrefter at flyttingen er
vellykket»). Del B er derfor endret fra `git mv` (flytting) til å KOPIERE
`v4/`-innholdet til rota — `v4/` blir liggende helt uendret som
rollback-kopi, ubrukt og urørt, til en egen, senere økt sletter den etter
Morfars bekreftelse. Dette gjør at «rene R-flyttinger»-kravet i del E ikke
kan holde bokstavelig for `index.html`/`README.md` (de finnes fortsatt på
gammel sti òg — i `v4/` — så git kan ikke rename-detektere dem); innholdet
er likevel korrekt: ny app-kode ligger på rota, frossen løsning i
`gammel/`, uendret duplikat i `v4/`.

### Delplan

**A. Arkiver dagens fryste løsning → `gammel/`**
- [x] Opprett `gammel/` og `git mv index.html appsscript.gs logo.png info/
      dev/ README.md gammel/` (innhold uendret, bortsett fra de tre
      selvlenkene over) — rene R i `git status`
- [x] Rett de tre selvlenkene til rot-relative stier (se «Funn før koding»):
      `gammel/index.html` linje 519, `gammel/dev/index.html` linje 519 →
      `href="/gammel/info/"`; `gammel/info/index.html` linje 314 →
      `href="/gammel/"`
- [x] `CNAME` og `.github/` blir liggende urørt på rota

**B. Flytt appen til rota — ENDRET til kopiering, se «Rettelse ved «kjør»»**
- [x] `cp v4/index.html v4/app.js v4/style.css v4/uno-footer.js
      v4/unoicon.png v4/README.md .` + `cp -r v4/supabase .` (KOPI, ikke
      `git mv` — `v4/` skal IKKE tømmes/slettes ennå)
- [x] `v4/` bekreftet uendret og urørt (ingen treff i `git status` for
      `v4/`-stien) — beholdes til Morfar bekrefter og sletter i egen økt
- [x] Root-`README.md` (dagens generiske to-linjers stub) erstattet av
      v4/README.md sitt innhold — kopien flyttet OVER (kun rotinnholdet
      overskrevet; stubben lever videre uendret i `gammel/README.md`)
- [x] Verifisert at appen kun bruker relative stier og
      `location.origin + location.pathname` for elevlenke/QR/redirect
      (`app.js` linje 503, 616, 958, 2858, 5223, 5353, 5503, 5526 — ingen
      hardkodet `/v4` i app.js/ts/css)
- [x] Søkt gjennom hele repoet etter strengen `/v4` — kun treff i
      PLAN.md/DECISIONS.md-historikk (bevisst) og de tre CLAUDE.md-stedene
      som omtaler `v4/`-rollback-kopien (bevisst, se D)

**C. Cache-bust**
- [x] Bumpet `?v=` for CSS og JS i ny rot-`index.html` til `20260824b`
      (`v4/index.html` urørt, fortsatt gammel versjon — det er en frossen
      kopi, ikke i bruk)

**D. Dokumentasjon**
- [x] `CLAUDE.md`: alle `v4/`-stier → rot-stier, mappetre, GitHub-lenker,
      «Ny løsning under utvikling: /v4/»-linja, frys-avsnittet skrevet om
      (fryst = `gammel/`, redigerbart = rot + .md-filer). Ny, egen post om
      `v4/` som midlertidig rollback-kopi (ikke i bruk, ikke kilde, slettes
      i egen økt)
- [x] `PROSEDYRER.md`: raw.githack-lenken → `<branch>/index.html`
- [x] `FUNKSJONELL-BESKRIVELSE.md`: produksjonsadresse →
      `https://ukeplan1e.ganddal.net/`
- [x] Root-`README.md`: gjenværende `v4/`-stier i selve veiledningsteksten
      (Pages-steg, `app.js`-sti, Site URL-eksempel, strukturtre) rettet til
      rot — dette er nå den LEVENDE README-en, ikke historikk. `v4/README.md`
      selv er IKKE rørt (del av den urørte rollback-kopien)
- [x] `PLAN.md`: STATUSLINJE oppdatert (P62 siste fullført, P63 neste ledige)
- [x] `DECISIONS.md`: ny oppføring «P62 — Appen flyttet til rota», inkl.
      egen, uttrykkelig dispensasjon fra frysregelen for de tre
      selvlenke-rettingene i `gammel/` OG for at `v4/` bevisst IKKE slettes
      ennå (se «Funn før koding» / «Rettelse ved «kjør»»)
- [x] Historiske PLAN.md/DECISIONS.md-seksjoner (Økt 1–61) IKKE endret —
      beholder `v4/`-stier som historisk korrekt

**E. Verifisering før PR**
- [x] `git status`: rene R for `gammel/`-arkiveringen (del A). For del B
      vises `index.html`/`README.md` som «modified» + «new file» i stedet
      for R — forventet og korrekt når samme sti får nytt innhold mens det
      gamle innholdet også finnes videre et annet sted (`gammel/` og `v4/`);
      INGEN reelt slettede filer noe sted
- [x] Ingen treff på `/v4` i kode (js/html/css/ts) noe sted i repoet —
      bekreftet med grep over hele treet (inkl. `gammel/` og `v4/`)
- [x] Rot-`index.html` laster `app.js`, `style.css`, `unoicon.png` relativt
- [x] Alle tre rettede selvlenker (pkt. 1–3 over) verifisert i innhold, ikke
      bare i planen
- [x] Full gjennomgang av `ukeplan1e\.ganddal\.net` i alle kodefiler i hele
      repoet: eneste treff er `gammel/info/index.html` linje 278 (ren tekst,
      ingen lenke) og linje 314 (rettet lenke, peker på `/gammel/`) — ingen
      gjenværende absolutt lenke peker utenfor `gammel/`

### Manuelle steg til Morfar (tas med i sluttoppsummeringen)
- Supabase → Authentication → URL Configuration: Site URL + Redirect URLs
  fra `/v4/` til rot (`https://ukeplan1e.ganddal.net/`)
- Hard refresh + kontroller at rota laster og at
  `https://ukeplan1e.ganddal.net/gammel/` fortsatt viser 25/26-planene
- Del nye elevlenker/QR-koder på nytt (gamle med `/v4/` i URL-en dør)

---

## Økt (P63): Funfacts-rotasjon

Kartlegging (25.08.2026, mot main @ 5f6e9be) bekreftet mot koden ved
øktstart 25.08.2026 — alle fem funn stemmer (linjenumre uendret siden
kartleggingen). Se oppgaveteksten for full funnliste; gjentas ikke her.

Retning endret to ganger etter Morfars gjennomlesing 25.08.2026:
1. Strammet inn: droppet bekreftVisning()-splitten (ett RPC-kall holder),
   droppet asynkron fakta-gjenoppbygging i et allerede-åpent AI-overlay.
2. Droppet frontend-køen (kø/stokking/localStorage) HELT til fordel for
   databasedrevet rotasjon: `increment_fact_view` stempler nå også
   `last_shown_at`, og «neste fakta» er ganske enkelt raden med eldst
   tidsstempel i `APP.facts` — ingen tilstand å vedlikeholde i
   nettleseren i det hele tatt. Se begrunnelse i del A og i
   DECISIONS.md-punktet i del E.

**Migrasjonsnummer korrigert:** oppgaveteksten ba om `023_...`, men det
tallet er allerede brukt (`023_tilgangsforesporsler.sql`). Høyeste
eksisterende er `025_opprydding_for_live.sql`, så denne migrasjonen blir
`026_funfacts_last_shown.sql`.

### Mål
Databasen er sannhetskilde for rotasjonsrekkefølge (`last_shown_at`,
NULL = aldri vist = først). Begge overlay-typer plukker «eldst vist»-
faktaet fra `APP.facts` via samme funksjon, med lastetekst-først i
lagre-overlayet og korrekt visningstelling begge steder.

### A. DB-migrasjon — MANUELT STEG (Morfar kjører i Supabase SQL Editor)
- [x] Ny fil `supabase/migrations/026_funfacts_last_shown.sql`,
      idempotent, samme mønster som 018:
      - `ALTER TABLE school_facts ADD COLUMN IF NOT EXISTS
        last_shown_at timestamptz;` (nullable — NULL = «aldri vist»,
        nye fakta vises først)
      - `CREATE OR REPLACE FUNCTION increment_fact_view(p_fact_id uuid)`:
        én `UPDATE` som setter BÅDE `view_count = view_count + 1` OG
        `last_shown_at = now()` i samme setning. Behold `SECURITY
        DEFINER`, `SET search_path = public` og
        `GRANT EXECUTE ... TO authenticated` nøyaktig som i 018 — ingen
        RLS-endring, kun `CREATE OR REPLACE` av eksisterende funksjon
- [x] Denne økten leverer koden klar, men migrasjonen kjøres IKKE av
      Claude — samme mønster som alle tidligere migrasjoner (se
      «SQL-migrasjoner» i CLAUDE.md). Tas med som eget manuelt steg i
      sluttoppsummeringen, FØR frontend-endringene har noen effekt (uten
      kolonnen stemples ikke `last_shown_at`, og rotasjonen degraderer
      stille til «alltid samme rekkefølge blant NULL-rader» — se
      tom-database-tilfellet i verifiseringen)

### B. Frontend — `nesteFakta()` (erstatter dagens `nesteFakta()` inni
`medAIOverlay`, løftes til modulnivå nær `FUNNY_TEXTS`)
- [x] Velg fra `APP.facts` raden med eldst `last_shown_at`, der `null`
      regnes som eldst (aldri vist). Ved flere med `null` (eller likt
      tidsstempel): velg tilfeldig blant dem, så startrekkefølgen ikke
      blir helt forutsigbar
- [x] Sett `last_shown_at` LOKALT på det valgte objektet med en gang
      (`new Date().toISOString()`), øk lokal `view_count`, og gjør
      dagens ikke-blokkerende `sb.rpc('increment_fact_view', ...)` med
      feil svelget stille — ett kall, samme mønster som dagens
      `nesteFakta()` (app.js:390–394)
- [x] Returnerer fakta-teksten, eller `''` hvis `APP.facts` er tom
- [x] Ingen kø, ingen stokking, ingen `_faktaForrige`, ingen
      `localStorage`, ingen Fisher–Yates — alt dette utgår i sin helhet.
      Sperren mot gjentakelse to ganger på rad trengs ikke lenger: det
      nettopp viste faktaet har ferskest tidsstempel og havner sist av
      seg selv ved neste kall

### C. Lagre-overlayet (`medLagreOverlay`, app.js:320–355)
- [x] Vis en tilfeldig `FUNNY_TEXTS`-streng med `visibility:visible` med
      en gang overlayet åpnes (ikke skjult, ikke vent)
- [x] `setTimeout(..., 1500)` (ned fra 3000): bytt teksten til
      `nesteFakta()`s tekst HVIS den ga noe (dette kallet teller
      visningen med det samme, se del B); ellers la lastetekst-en stå
- [x] `[...FUNNY_TEXTS, ...APP.facts]`-lotteriet fjernes helt
- [x] `clearTimeout` ved tidlig ferdig lagring uendret (kort lagring →
      `nesteFakta()` kalles aldri → ingen telling)

### D. AI-overlayet (`medAIOverlay`, app.js:361–435)
- [x] Lokale `koe`/`forrige`/stokkelogikken (app.js:375–388) fjernes;
      `visNeste`/`startIntervall`/«→»-knappen kaller den delte
      `nesteFakta()` i stedet. Utseende, 300ms fade, 10s-intervall og
      «→»-knapp uendret
- [x] Tom pool ved åpning: overlayet oppfører seg som i dag — ingen
      fakta-seksjon bygges, ingen asynkron henting inni et allerede-åpent
      overlay

### E. Fersk `APP.facts` — én felles hentefunksjon
- [x] Ny `hentFunfacts()`: `sb.from('school_facts').select('*').eq(...)
      .is('deleted_at', null)` (`select('*')` dekker `last_shown_at`
      automatisk, ingen ekstra kolonne å nevne eksplisitt) UTEN
      sortering-bieffekt på `APP.facts` (sorter kun i visningslaget der
      det trengs — se under). Setter `APP.facts` og returnerer listen
- [x] `init()` (app.js:6313–6319) kaller `hentFunfacts()` i stedet for
      egen spørring
- [x] `fornyFunfacts()` (app.js:444–461) kaller `hentFunfacts()` etter
      vellykket forny (både «alle» og «fyll»-modus), så `APP.facts` er
      ferske umiddelbart — nye fakta har `last_shown_at = null` og vises
      dermed først, uten noen opprydding å gjøre (ingen kø å rense)
- [x] `renderFaktaTab`s `refresh()` (app.js:6046–6054): kall
      `hentFunfacts()` for å sette `APP.facts`, men behold den
      admin-spesifikke `view_count`-sorteringen KUN i en lokal variabel
      for selve listevisningen (`facts.slice().sort(...)` eller
      tilsvarende) — `APP.facts` beholder rekkefølgen fra
      `hentFunfacts()`
- [x] Oppdater hjelpeteksten i `renderFaktaTab` (app.js:6059–6061): fjern
      «Vises som pausetekst … for å holde humøret oppe» + juster
      øye-forklaringen til noe presist (fakta vises i BEGGE overlays,
      telleren viser faktiske visninger fra begge)

### F. Cache-bust, dokumentasjon og avslutning
- [x] Bump `?v=YYYYMMDDx` i rot-`index.html`
- [x] `DECISIONS.md`: ny post som begrunner to ting:
      1. hvorfor rotasjonstilstanden ligger i databasen (`last_shown_at`)
         og ikke i nettleseren — felles for hele skolen (alle lærere ser
         samme rotasjon), overlever ny maskin/nettleser/tømt lokal
         lagring, og det er ingen kø-kode å vedlikeholde eller feilsøke
      2. hvorfor det ble en ny kolonne (`last_shown_at`) framfor gjenbruk
         av `view_count` — nye fakta måtte da fått et falskt/gjettet
         starttall for å konkurrere om «minst sett», og telleren skal
         fortsatt vise EKTE visningsantall (ikke forstyrres av
         rotasjonslogikken)
- [x] `CLAUDE.md` under «APP-objekt (global state)»: rett kommentaren
      `facts: [], // Funfacts for scrollende banner` — det finnes ingen
      scrollende banner i koden. Ny tekst skal beskrive at fakta vises i
      lagre-overlayet og AI-overlayet
- [x] `CLAUDE.md`s migrasjonsliste: legg til
      `026_funfacts_last_shown.sql`-raden (status: kode klar, IKKE kjørt
      før Morfar gjør det manuelt)
- [x] STATUSLINJE i PLAN.md oppdatert i samme commit

### Verifisering (isolert harness, samme mønster som P52–P55)
- [x] 20 fakta, alle med `last_shown_at = null`: 20 simulerte uttak gir
      alle 20 fakta nøyaktig én gang, ingen gjentakelse
- [x] 40 simulerte uttak (to fulle sykluser): andre runde dekker alle 20
      på nytt, og aldri samme fakta to ganger på rad (siste av forrige
      runde har alltid eldre tidsstempel enn de 19 andre ved rundeskifte
      — bekreftes direkte, ikke bare antatt)
- [x] Blandet starttilstand (noen `null`, noen med eldre tidsstempel):
      alle `null`-radene velges før noen med satt tidsstempel
- [x] Ett fakta med kunstig FERSKT tidsstempel velges aldri så lenge det
      finnes fakta med eldre (inkl. `null`) tidsstempel i poolen
- [x] Tom pool (`APP.facts = []`): `nesteFakta()` gir `''`, ingen kast,
      lastetekst som før i lagre-overlayet, AI-overlayets fakta-seksjon
      uteblir som i dag, ingen RPC-kall
- [x] Etter at `renderFaktaTab`s `refresh()` har kjørt: `APP.facts`
      beholder rekkefølgen fra `hentFunfacts()` (ikke `view_count`-sortert)

### Manuelle steg til Morfar (tas med i sluttoppsummeringen)
- FØRST: kjør `026_funfacts_last_shown.sql` i Supabase SQL Editor (se
  del A) — rotasjonen virker ikke uten den
- Gjør en lagring som tar litt tid og se at et funfact dukker opp; gjenta
  noen ganger og bekreft at det ikke er de samme som går igjen; kontroller
  at 👁-tellerne i Funfacts-fanen stiger for fakta som faktisk har vært vist

---

## P64 — Slett v4-rollback-kopien (26.08.2026)

Betingelsen fra P62 var oppfylt: Morfar har bekreftet at rot-versjonen
fungerer i produksjon. `v4/`-mappa, som kun var beholdt som
rollback-sikkerhet, er derfor fjernet.

- [x] `git rm -r v4/` — hele mappa slettet, `gammel/`, `CNAME` og
      `.github/` urørt
- [x] CLAUDE.md: fjernet avsnittet under «Arbeidsrutiner» som beskrev
      `v4/` som midlertidig rollback-kopi, og `v4/`-linja i
      filstruktur-oversikten
- [x] Ingen cache-bust nødvendig (v4/ ble aldri servert)
- [x] Backlogg-punktet «Slett rollback-kopien /v4/» flyttet fra «Klar til
      bygging» til denne P64-seksjonen, markert fullført
- [x] STATUSLINJE oppdatert i samme commit (Siste fullførte → P64, Neste
      ledige → P65)
- [x] DECISIONS.md: «P64 — v4/-rollback-kopien slettet»

### Manuelt steg til Morfar (tas med i sluttoppsummeringen)
- Fjern `/v4/`-redirect-URL-en fra Supabase Dashboard → Authentication →
  URL Configuration (lagt til side om side med rot-adressen i P62) — kun
  rot-adressen skal stå igjen. Ikke gjort av Code.

## Økt (P65): Synliggjør ekte databasefeil i ical-funksjonen

Kalenderabonnement (webcal/ical) ga «No sessions found» ved test mot en
skole/klasse som opplagt har planlagte økter. Årsaken: i
`supabase/functions/ical/index.ts` ble kun `data` destrukturert fra
sessions-spørringen — `error` ble ignorert helt. En Supabase-spørring
uten treff returnerer en TOM LISTE `[]` (truthy i JS), ikke `null`, så
`!sessions` kan kun bli sann når spørringen feilet av en helt annen grunn
(f.eks. manglende `school_year_start_week`/`end_week`, eller et
join-forhold som ikke matcher i databasen) — og den ekte feilteksten
forsvant sporløst bak den generiske 404-meldingen.

Denne økten gjør KUN dette: synliggjør den ekte databasefeilen. Ingen
gjetning på eller fiksing av selve årsaken — det tas i en egen økt når
vi vet hva feilen faktisk er.

### Endring
`supabase/functions/ical/index.ts`, linje ~73–75:
```ts
const { data: sessions, error: sessionsError } = await query

if (sessionsError) {
  return new Response(`Database error: ${sessionsError.message}`, { status: 500, headers: CORS })
}
if (!sessions) return new Response('No sessions found', { status: 404, headers: CORS })
```
Ingen andre linjer i filen er rørt (verken school-spørringen,
klasse/lærer-oppslagene eller iCal-bygge-logikken).

### Sjekkliste
- [x] Endring gjort kun i de to linjene beskrevet over
- [x] Commit og push til `claude/ical-database-error-visibility-c98v68`
- [x] PLAN.md oppdatert (denne seksjonen + STATUSLINJE)
- [ ] Morfar må redeploye `ical`-funksjonen manuelt i Supabase Dashboard
      etter merge (som vanlig for edge-funksjoner — koden i repoet er
      IKKE automatisk i produksjon før dette gjøres)
- [ ] Etter redeploy: gjenta det opprinnelige testabonnementet mot
      skolen/klassen som feilet, og rapporter det ekte feilbudskapet
      («Database error: …») tilbake for videre diagnose i en ny økt

### Åpne sjekkpunkter
- Redeploy av `ical`-funksjonen i Supabase Dashboard gjenstår (manuelt
  steg, kan ikke gjøres herfra) — feilen er IKKE synlig i produksjon før
  dette er gjort.
- Selve den underliggende databasefeilen er fortsatt ukjent — denne
  økten avdekker den ikke, kun synliggjør den. Neste økt tar fatt i
  diagnosen når det ekte feilbudskapet er rapportert.
