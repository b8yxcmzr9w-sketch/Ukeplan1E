# PLAN — Ukeplan1E v4

## Status: FULLFØRT — Økt 4 (P37): Ny seksjon «Én sak per chat» i PROSEDYRER.md
Branch: `claude/p37-en-sak-per-chat-tcst4l` (miljøets tildelte branch —
oppgaveteksten sa `claude/P37-en-sak-per-chat`, samme situasjon som P34/P35/P36).
Seksjonen «Én sak per chat» er lagt inn ordrett i PROSEDYRER.md mellom
«Grunnregel» og «Status: Før live / Etter live». Duplikatsjekk: «én oppgave per
Code-økt» fantes ikke formulert andre steder i PROSEDYRER.md/CLAUDE.md — ingen
duplisering, ingenting å vise til. Kun dokumentendring — ingen kode i v4/,
ingen cache-bust. Verifisert med git diff: kun PROSEDYRER.md + PLAN.md berørt.

---

## Økt 4 (P37): Ny seksjon «Én sak per chat» i PROSEDYRER.md

**Branch:** `claude/p37-en-sak-per-chat-tcst4l` (miljøets tildelte branch —
oppgaveteksten sa `claude/P37-en-sak-per-chat`, samme situasjon som P34/P35/P36).
**Scope:** KUN dokumentendring — `PROSEDYRER.md` + `PLAN.md`. Ingen kode i `v4/`,
ingen cache-bust, ingen migrasjon, ingen edge functions.

### Kartlegging

`PROSEDYRER.md` er lest. Innsettingspunktet er entydig: seksjonen «Grunnregel»
slutter med `---` på linje 26, og «## Status: Før live / Etter live» starter på
linje 28. Den nye seksjonen «## Én sak per chat» legges mellom disse, med egen
`---`-skillelinje etter, slik at seksjonsmønsteret i fila beholdes.

**Duplikatsjekk («én oppgave per Code-økt» andre steder):**
- `PROSEDYRER.md`: ingen eksisterende formulering. Malen nederst («ØKT X
  (plan-punkt PN)») *impliserer* ett P-nummer per økt, men sier det ikke
  eksplisitt — ingen duplisering.
- `CLAUDE.md`: nærmeste er «Hold deg til oppgavens omfang — ikke endre kode
  utenfor det som er avtalt» (Arbeidsrutiner). Det handler om omfang innenfor
  en oppgave, ikke om én oppgave per økt — ingen duplisering.

Konklusjon: teksten legges inn ordrett som spesifisert, uten henvisninger til
andre formuleringer (det finnes ingen å vise til).

### Delplan

1. Sett inn seksjonen «## Én sak per chat» (ordrett fra oppgaven) i
   `PROSEDYRER.md`, rett etter «Grunnregel»-seksjonens avsluttende `---` og
   før «## Status: Før live / Etter live», med `---` etter den nye seksjonen.
2. Verifiser med `git diff` at kun `PROSEDYRER.md` + `PLAN.md` er berørt.
3. Oppdater PLAN.md (sjekkliste + statuslinje) og commit/push.

### Sjekkliste
- [x] Ny seksjon «Én sak per chat» lagt inn ordrett mellom «Grunnregel» og «Status: Før live / Etter live»
- [x] Duplikatsjekk rapportert (ingen eksisterende formulering funnet — ingenting å vise til)
- [x] Verifisert: ingen endringer utenfor PROSEDYRER.md + PLAN.md (git diff --stat)
- [x] Commit + push til branch
- [x] PLAN.md: sjekkliste krysset av + status oppdatert

---

## Status: FULLFØRT — Økt 3 (P36): Bekreftelse før prosedyrer + ferske filer
Branch: `claude/p36-bekreftelse-og-ferske-filer-uzqtsq` (miljøets tildelte branch —
oppgaveteksten sa `claude/P36-bekreftelse-og-ferske-filer`, samme situasjon som P34/P35).
Begge tekstene (A: «Prosedyrer startes ikke på antydning» under Grunnregel,
B: punkt 0 «Hent alltid fersk versjon» i del A) er lagt inn ordrett i PROSEDYRER.md.
Kun dokumentendring — ingen kode i v4/, ingen cache-bust. Verifisert med git diff:
kun PROSEDYRER.md + PLAN.md berørt.

---

## Økt 3 (P36): Bekreftelse før prosedyrer + ferske filer i planleggingschat

**Branch:** `claude/p36-bekreftelse-og-ferske-filer-uzqtsq`
**Scope:** KUN dokumentendring — `PROSEDYRER.md` + `PLAN.md`. Ingen kode i `v4/`,
ingen cache-bust, ingen migrasjon, ingen edge functions.

### Kartlegging

`PROSEDYRER.md` er lest. To innsettingspunkter er identifisert:

- **A)** Seksjonen «Grunnregel» (etter avsnittet «**Morfar er igangsetteren.** …»,
  før neste `---`). Teksten gjelder både planleggingschat og Code, og
  Grunnregel-seksjonen er felles for begge — riktig plassering iht. oppgaven.
- **B)** Listen under «A. I planleggingschat» starter i dag på punkt 1
  («Les CLAUDE.md, PLAN.md og DECISIONS.md»). Nytt punkt 0 legges ØVERST;
  punktene 1–4 beholder dagens nummerering uendret.

### Delplan

1. **A — nytt avsnitt under «Grunnregel»:** «Prosedyrer startes ikke på
   antydning.» Claude skal spørre «Skal jeg kjøre oppstartsprosedyren?» /
   «Skal jeg kjøre avslutningsprosedyren?» og vente på ja før prosedyren
   kjøres — også ved kortformer («oppstart», «avslutt», «da er vi ferdige»).
   Kun ordrett «kjør oppstartsprosedyre» / «kjør avslutningsprosedyre» starter
   uten bekreftelse. Teksten limes inn ordrett som spesifisert i oppgaven.
2. **B — nytt punkt 0 i «A. I planleggingschat»:** «Hent alltid fersk versjon.»
   Cache-bryter (`?cb=<dagens dato og klokkeslett>`) på GitHub raw-URL-er ved
   hver henting, kryssjekk av siste P-nummer/statuslinje mot forrige økt, hent
   på nytt ved mistanke om gammel fil, og rapporter alltid faktisk lest
   P-nummer. Teksten limes inn ordrett som spesifisert i oppgaven.
3. Oppdater PLAN.md (denne sjekklisten + statuslinjen) og commit/push.

### Sjekkliste
- [x] A: Nytt avsnitt «Prosedyrer startes ikke på antydning» under «Grunnregel» i PROSEDYRER.md
- [x] B: Nytt punkt 0 «Hent alltid fersk versjon» øverst i «A. I planleggingschat» (punkt 1–4 uendret nummerering)
- [x] Verifisert: ingen endringer utenfor PROSEDYRER.md + PLAN.md (git diff --stat)
- [x] Commit + push til branch
- [x] PLAN.md: sjekkliste krysset av + status oppdatert

---

## Status: FULLFØRT (verifisert) — Økt 2 (P35): Felles «Lagre»-knapp for inndelingsnavn
Branch: `claude/p35-felles-lagre-inndelingsnavn-irqftj` (miljøets tildelte branch —
oppgaveteksten sa `claude/P35-felles-lagre-inndelingsnavn`, samme situasjon som P34).
Merget til main via PR #140 (squash). Cache-bust: `20260722a`.
Maskinverifisert i ekte Chromium (23/23 sjekker PASS): selve app.js fra main kjørt mot
mocket Supabase-klient — dirty-sjekk, kun-endrede-rader, delvis feil m/retry, toast,
slett beholdt. Morfar har bekreftet i produksjon (22. juli). Ingenting gjenstår.

---

## Økt 2 (P35): Felles «Lagre»-knapp for inndelingsnavn (partier/grupper)

**Branch:** `claude/p35-felles-lagre-inndelingsnavn-irqftj`
**Scope:** `v4/app.js`, litt `v4/style.css`, cache-bust `v4/index.html` (→ `20260722a`).
Ingen DB-endring, ingen migrasjon, ingen manuelle Supabase-steg.

### Kartlegging (fullført, rapportert og godkjent)

To steder redigerer inndelingsnavn med per-rad 💾, begge med identisk mønster:

| Sted | Funksjon | Rader | 💾-lagring |
|---|---|---|---|
| Partinavn, klasse-admin (lærervisning) | `renderKlasseAdminInnhold` (app.js:3446–3493) | `.div-row` per parti i `.div-list` per fag med `has_parti` | `medLagreOverlay(() => sb.from('subject_divisions').update({ name }).eq('id', p.id))` + `showToast('Lagret')` |
| Gruppenavn, admin-panelets Fag-fane | `renderFagTab`→`refresh` (app.js:4114–4144) | `.div-row` per gruppe i `.admin-grupper-rad` per fag med `has_gruppe` | Samme mønster (app.js:4121–4124) |

Feedback-mønster ellers: `medLagreOverlay` (suksess «✓ Lagret!», kastet feil → feiloverlay
med Lukk), `showToast`, og dirty-sjekk-mønsteret `overvakSkjema` (disabled + `.btn-passiv`
til snapshot avviker). **Latent svakhet i dagens 💾:** `{ error }` fra Supabase-kallet
sjekkes ikke — supabase-js kaster ikke selv, så feilet lagring viser i dag «Lagret!».
Ny felles lagring sjekker `{ error }` per rad.

### Delplan

1. Ny hjelper `lagInndelingNavnLagring()` (plasseres ved `overvakSkjema`):
   kalleren registrerer hvert navnefelt med original verdi; én «Lagre»-knapp
   (`btn btn-p`, deaktivert + `.btn-passiv` som `overvakSkjema`-mønsteret) aktiveres
   først når minst ett felt avviker fra original. Egen lett dirty-sjekk (ikke
   `overvakSkjema` direkte) fordi basislinjen per rad må kunne oppdateres etter lagring.
2. Ett trykk lagrer kun endrede rader: én `medLagreOverlay` rundt sekvensielle
   `update`-kall, `{ error }` sjekkes per rad.
3. **Delvis feil:** Supabase har ingen transaksjon over flere `update`-kall herfra
   (alt-eller-ingenting krever DB-endring — utenfor scope), så feil samles per rad:
   vellykkede rader får ny basislinje (ikke lenger dirty); ved feil kastes `Error`
   med radnavnene («Kunne ikke lagre: …») slik at `medLagreOverlay` sitt eksisterende
   feiloverlay viser den. Feilede rader forblir dirty → «Lagre» forblir aktiv for nytt
   forsøk. Full suksess → «Lagret»-toast som i dag. Ingen nye feedback-mønstre.
4. Sted 1: én knapp nederst i Partier-seksjonen (dekker alle fag for valgt klasse).
   Sted 2: én knapp nederst i faglisten i Fag-fanen (dekker alle gruppenavn).
   Knappen rendres kun når det finnes navnerader.
5. Slett per rad beholdes uendret (umiddelbar soft-delete + re-render som i dag).

### Sjekkliste
- [x] Hjelper `lagInndelingNavnLagring()` med dirty-sjekk og delvis-feil-håndtering (app.js, etter `overvakSkjema`)
- [x] Sted 1 (partinavn, klasse-admin): 💾 fjernet, felles «Lagre» nederst i Partier-seksjonen
- [x] Sted 2 (gruppenavn, Fag-fanen): 💾 fjernet, felles «Lagre» nederst i faglisten
- [x] CSS for knapperad (`.div-lagre-rad`), cache-bust `20260722a`
- [x] Commit + push til branch
- [x] Maskinverifisert i Chromium (23/23 PASS, mocket Supabase): 💾 borte i begge visninger,
      knapp deaktivert til endring (og re-deaktivert ved tilbakestilt verdi), ett trykk lagrer
      kun endrede rader, delvis feil viser feiloverlay med radnavn og lar feilet rad prøves
      på nytt alene, «Lagret»-toast ved suksess, slett-knapper beholdt
- [x] Morfars sjekk i produksjon (ekte Supabase/RLS) — bekreftet OK 22. juli

---

## Status: FULLFØRT (verifisert) — Økt 1 (P34): Supabase keep-alive workflow feiler
Branch: `claude/p34-keep-alive-fix-r86ja2` (miljøets tildelte branch — oppgaveteksten sa
`claude/P34-fiks-keep-alive`, men dette Code-miljøet er låst til branchnavnet over).
Rotårsak: begge repo-secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) manglet — de
ekspanderte til tom streng i alle 9 kjøringer. Morfar la inn begge 18. juli; manuell
workflow_dispatch-kjøring (run #10, 2026-07-18) ga **grønn status, HTTP 200,
«✅ Supabase er våken»**. Ingen kodeendring var nødvendig.
Merget til main via PR. **Gjenstår kun:** neste schedule-kjøring (21. juli) bekrefter
stabilitet — kan ikke testes før datoen inntreffer; bekrefter seg selv i Actions-fanen.

---

## Økt 1 (P34): Supabase keep-alive workflow feiler på alle kjøringer

**Branch:** `claude/p34-keep-alive-fix-r86ja2`
**Scope (forventet):** Ingen kodeendring. Kun manuelt secrets-steg (Morfar) + manuell
workflow-kjøring (verifisering) + PLAN.md. Ingen cache-bust (ingen frontend-endring).

### STEG 1 — Kartlegging (kun lesing) — FULLFØRT

#### a) Workflow-filen (`.github/workflows/supabase-keepalive.yml`)

Lest i sin helhet (25 linjer). Logikken er korrekt:
- `cron: '0 6 */5 * *'` → kjører dag 1, 6, 11, 16, 21, 26, 31 i måneden kl. 06:00 UTC.
  Kjøringshistorikken (6/6, 11/6, 16/6 … 16/7) matcher nøyaktig — cron fungerer.
- `workflow_dispatch` finnes → manuell kjøring mulig (brukes i verifiseringen).
- curl-ping mot `${{ secrets.SUPABASE_URL }}/rest/v1/schools?select=id&limit=1` med
  `apikey`- og `Authorization: Bearer`-headere fra `${{ secrets.SUPABASE_ANON_KEY }}`,
  etterfulgt av HTTP-statussjekk (2xx = OK). Riktig oppsett — ingen kodefeil.

#### b) Kjøringshistorikk (GitHub Actions API)

Nøyaktig **9 kjøringer**, alle `schedule`-utløst på `main`, alle `failure`:
run #1 (2026-06-06) → run #9 (2026-07-16). Stemmer med oppgavebeskrivelsen.

#### c) Full jobb-logg fra siste feilede kjøring (run #9, id 29482217237) — SMOKING GUN

GitHub rendrer steget med secrets-verdiene interpolert FØR kjøring. Loggen viser:

```
-H "apikey: "                          ← TOM verdi
-H "Authorization: Bearer "            ← TOM verdi
"/rest/v1/schools?select=id&limit=1"   ← URL uten vertsnavn/skjema
##[error]Process completed with exit code 3.
```

**Exit code 3 fra curl = «URL malformed»** — curl når aldri nettverket. Det forklarer
både ~4-sekunders varighet (ingen timeout, umiddelbar feil) og at det ikke er nettverks-
eller Supabase-feil. Begge `${{ secrets.* }}`-referansene ekspanderer til tom streng,
som er GitHubs oppførsel når en secret **ikke finnes** under det navnet.

#### d) Secret-navn i repo-settings

Kan ikke listes fra dette miljøet (ingen `gh`-CLI, ingen MCP-verktøy for secrets) —
men loggbeviset i (c) er entydig: ingen secret med navnene `SUPABASE_URL` eller
`SUPABASE_ANON_KEY` er tilgjengelig for workflowen. Morfar bekrefter i
Settings → Secrets and variables → Actions om listen er helt tom eller om det ligger
varianter med avvikende navn/case der.

### STEG 2 — Rotårsaker: bekreftet/avkreftet

| Hypotese | Status |
|---|---|
| Secret mangler helt (aldri satt siden 4. juni) | **MEST SANNSYNLIG** — begge tomme i alle 9 kjøringer, fra aller første run |
| Feil navn på secret (case/skrivefeil) | MULIG — gir identisk symptom (tom ekspansjon); skilles fra forrige kun ved å se i Settings |
| Utløpt/rotert nøkkel som ikke matcher appen | **AVKREFTET** som årsak — forespørselen når aldri Supabase (curl exit 3, ingen HTTP-status). Appen i prod bruker nøkkelen daglig uten problem |
| URL-secret mangler `https://` / har trailing slash | **AVKREFTET** som årsak — URL-en er helt tom, ikke feilformatert. Men relevant som instruks når secreten SETTES (se Steg 3) |

App-sidens tilkobling (app.js:4–5) er ubekreftet friskt vann: produksjonen fungerer
normalt → nøkkel og URL er gyldige. Ingen frontend-endring, ingen cache-bust.

### STEG 3 — Rettelse: MANUELT steg for Morfar (ingen kodeendring)

Workflow-filen er korrekt og røres ikke. I GitHub:
**Settings → Secrets and variables → Actions → New repository secret**, to stykker:

| Navn (eksakt, store bokstaver) | Verdi |
|---|---|
| `SUPABASE_URL` | `https://zstjfatkeqbbekqgbsgb.supabase.co` — MED `https://`, UTEN trailing slash |
| `SUPABASE_ANON_KEY` | Publishable-nøkkelen fra `v4/app.js` linje 5 (`sb_publishable_…`) — samme som appen bruker; den er offentlig i frontend-koden, så det er trygt å kopiere derfra |

Hvis det allerede ligger secrets med lignende navn (feil case/skrivefeil): slett/gi nytt
navn så de matcher tabellen eksakt — GitHub-secrets er case-sensitive i praksis her.

### STEG 4 — Verifisering etter fix

1. Morfar sier fra når secrets er lagt inn.
2. Code trigger workflowen manuelt (`workflow_dispatch` via GitHub API) og henter loggen:
   forventet `HTTP status: 200` + `✅ Supabase er våken` + grønn konklusjon.
3. Neste planlagte kjøring (21. juli 2026, 5-dagers syklus) bekrefter stabilitet videre.

Merk: endepunktet kunne ikke pre-testes fra Code-miljøet (utgående proxy blokkerer
`supabase.co`) — verifiseringen skjer derfor i selve workflow-kjøringen, som uansett
er den reelle testen.

### Sjekkliste
- [x] Kartlegging: workflow-fil, kjøringshistorikk, jobb-logg, rotårsak
- [x] Delplan skrevet og pushet til branch
- [x] Morfar: godkjent delplan
- [x] Morfar: la inn `SUPABASE_URL` + `SUPABASE_ANON_KEY` i Actions-secrets (18. juli)
- [x] Code: workflow_dispatch trigget — run #10 (id 29634357377) GRØNN, `HTTP status: 200`,
      «✅ Supabase er våken». Secrets vises maskert (`***`) i loggen = de eksisterer og leses
- [x] PR opprettet og merget til main
- [ ] Neste schedule-kjøring (21. juli 2026) bekrefter stabilitet — kan ikke krysses av før
      datoen inntreffer (eksplisitt begrunnet, jf. sjekkliste-regelen i CLAUDE.md)

---

## Status: FULLFØRT (verifisert) — Økt X (P33): «Nå»-knappen lander feil i sommergapet før skolestart
Branch: `claude/summer-gap-week-nav-5m8l44`. Plan godkjent, kode implementert og pushet.
Cache-bust: `20260712a`. Logikken maskinverifisert med 9 dato-scenarier (alle PASS) —
gjenstår kun manuell verifisering i nettleser (sjekkpunktene under P33).

---

## Økt X (P33): «Nå»-knappen lander feil i sommergapet før skolestart

**Branch:** `claude/summer-gap-week-nav-5m8l44`
**Scope (forventet):** `v4/app.js` (`gjeldendeSkoleuke()` + 5 kallsteder), `v4/index.html` (cache-bust → `20260708a`). Ingen DB-/CSS-/edge-function-endringer forventet.

### Problem
`gjeldendeSkoleuke(schoolStart, schoolEnd)` (bygget i P15, app.js:146–152) velger
«nærmeste ende» av skoleåret målt i **uke-avstand** når inneværende uke er utenfor
skoleåret: `(pos - sluttPos) <= (52 - pos) ? schoolEnd : schoolStart`. I sommergapet
FØR skolestart (f.eks. uke 25–28, aktivt skoleår 26/27 som starter uke 33) vinner
`schoolEnd` (24) — men uke 24 av 26/27 er juni **2027**, nesten et helt år frem i
tid. Brukeren havner på siste uke i skoleåret med «Neste →» korrekt deaktivert, og
det oppleves som at navigasjonen er låst og skolestart i august er utilgjengelig.

**Ønsket oppførsel:** I gapet skal valget mellom `schoolStart` og `schoolEnd`
avgjøres **kalendermessig** (dagens dato vs. skoleårets faktiske start-/sluttdato),
ikke etter uke-avstand.

### STEG 1 — Kartlegging (kun lesing, med bevis)

#### a) `gjeldendeSkoleuke()` og ALLE call sites

Definisjon — **app.js:146–152**:
```js
function gjeldendeSkoleuke(schoolStart, schoolEnd) {
  const w = getCurrentISOWeek()
  const pos = ukePosisjon(w, schoolStart)
  const sluttPos = ukePosisjon(schoolEnd, schoolStart)
  if (pos <= sluttPos) return w
  return (pos - sluttPos) <= (52 - pos) ? schoolEnd : schoolStart
}
```

Nøyaktig **5 call sites** i hele filen (bekreftet via grep — ingen flere):

| # | Linje | Sted | Bruk av returverdi | Skoleår i kall-kontekst? |
|---|---|---|---|---|
| 1 | **1023** | `renderElevView` — `let currentWeek = peekWeek ?? gjeldendeSkoleuke(schoolStart, schoolEnd)` | Seeder initiell uke i elevvisning | `aktivtSkolear` finnes, men defineres FØRST på **linje 1025** (2 linjer under) — må flyttes opp |
| 2 | **1169** | Inni `renderUke()`-lukningen i `renderElevView` — `const naaWeek = gjeldendeSkoleuke(schoolStart, schoolEnd)` | «Nå»-knapp-mål + disabled-sjekk (elevvisning) | `aktivtSkolear` (linje 1025) er i scope via closure — ingen flytting nødvendig |
| 3 | **1654** | `renderMinKlasseTab` — `let currentWeek = APP.laererCtx.week ?? gjeldendeSkoleuke(schoolStart, schoolEnd)` | Seeder initiell uke i lærervisning (uten kontekst fra P21) | `aktivtSkolear`/`valgtSkolear` defineres FØRST på **linje 1657–1660** (3–6 linjer under) — må flyttes opp |
| 4 | **1772** | Inni `renderUke()`-lukningen i `renderMinKlasseTab` — `const naaWeek = gjeldendeSkoleuke(schoolStart, schoolEnd)` | «Nå»-knapp-mål + disabled-sjekk (lærervisning) | `valgtSkolear` (linje 1660, oppdateres ved årsvalg i planleggingsmodus) er i scope via closure — ingen flytting nødvendig, og er **riktig** år å bruke (viste år, ikke nødvendigvis aktivt år) |
| 5 | **2000** | `renderAlleOkterTab` — `const naaWeek = gjeldendeSkoleuke(schoolStart, schoolEnd)` | Scroll-anker + «Nå»-knapp-mål i «Alle mine økter» | `aktivtSkolear` (linje 1934) er definert FØR dette kallet — ingen flytting nødvendig |

Alle 5 steder har altså tilgang til skoleåret i kall-konteksten; to av dem (#1, #3)
krever kun en enkel omrokkering av eksisterende linjer (ingen ny datahenting).

#### b) `skoleaarIntervall(sy)` — finnes, men IKKE egnet som gap-anker alene

`skoleaarIntervall` (app.js:191–196) gir `{ aar1, aar2, fra: 'aar1-08-01', til:
'aar2-07-31' }` — bekreftet identisk med CLAUDE.md-beskrivelsen. Problemet: dette
er et **fast kalenderårs-intervall** (1. aug–31. jul), som IKKE er justert etter
`schoolEnd`. `schoolEnd` (uke 24) faller i midten/slutten av **juni**, altså flere
uker FØR intervallets `til` (31. juli). Hvis vi bruker `skoleaarIntervall` direkte
som gap-anker, vil datoer mellom skoleslutt (juni) og 31. juli feilaktig telle som
«innenfor skoleåret» — nøyaktig det andre verifiseringspunktet (etter skoleslutt i
juli) ville da IKKE bli fikset.

**Konklusjon:** Bruk i stedet de eksisterende hjelperne `skoleaarKalenderaar()` +
`isoWeekToDate()` (samme mønster som allerede brukes på app.js:1120–1122 og
1813–1815) til å beregne de FAKTISKE grensedatoene:
- Skoleårets startdato = mandag i `schoolStart`-uken
- Skoleårets sluttdato = fredag i `schoolEnd`-uken

Disse grensene treffer nøyaktig samme uker som selve navigasjonen (`ukePosisjon`
mot `schoolStart`/`schoolEnd`), i motsetning til `skoleaarIntervall`s faste
kalenderdatoer. `skoleaarIntervall` røres ikke og brukes fortsatt uendret der den
allerede brukes i dag (kalenderhendelse-spørringer m.m.).

#### c) Bruker noen call sites returverdien til annet enn «Nå»/initiell uke?

Nei. Gjennomgått alle 5 treff — returverdien brukes utelukkende til å sette
`currentWeek` (initiell) eller `naaWeek` (mål for «Nå»-knappen + disabled-sjekk
`weekNr === naaWeek`). Ingen andre forbrukere funnet.

### STEG 2 — Delplan (venter godkjenning før koding)

1. **Utvid `gjeldendeSkoleuke(schoolStart, schoolEnd, skoleAar)`** med en tredje
   parameter:
   - Uendret gren: `if (pos <= sluttPos) return w` (innenfor skoleåret → faktisk
     uke — P15-oppførsel intakt).
   - Ny gap-gren: hvis `skoleAar` er gyldig (`/^\d{2}\/\d{2}$/`), beregn
     start-/sluttdato via `skoleaarKalenderaar` + `isoWeekToDate` (se punkt b) og
     sammenlign med dagens lokale dato:
     - dato FØR skoleårets startdato → `schoolStart`
     - dato ETTER skoleårets sluttdato → `schoolEnd`
   - **Fallback** (uendret dagens avstandslogikk): brukes hvis `skoleAar` mangler
     eller er ugyldig (f.eks. skole/kontekst uten skoleår), ELLER i det
     usannsynlige tilfellet dagens dato havner mellom grensene til tross for at
     `pos > sluttPos` — ren sikkerhetsnett, ingen kjent vei dit i dag.
2. **Oppdater alle 5 call sites** til å sende skoleåret:
   - Linje 1023: flytt `aktivtSkolear`-utledningen (i dag linje 1025) til FØR
     `currentWeek`-seedingen; send den inn.
   - Linje 1169: send `aktivtSkolear` (allerede i scope).
   - Linje 1654: flytt skoleår-utledningen (i dag linje 1657–1660) til FØR
     `currentWeek`-seedingen; bruk `APP.laererCtx.skolear ?? aktivtSkolear` (det
     som blir `valgtSkolear`) som argument.
   - Linje 1772: send `valgtSkolear` (allerede i scope — riktig, følger visning
     i planleggingsmodus).
   - Linje 2000: send `aktivtSkolear` (allerede i scope).
3. **Kun `v4/app.js` + cache-bust i `v4/index.html`** (`20260708a`). Ingen
   migrasjoner, ingen edge-function- eller CSS-endringer — bekreftet av
   kartleggingen.

### Sjekkliste (etter godkjenning)
- [x] Fase 1 — Utvid `gjeldendeSkoleuke()` med `skoleAar`-parameter + kalenderbasert gap-avgjørelse (app.js:151–163)
- [x] Fase 2 — Oppdater de 5 call sites (inkl. omrokkering på linje ~1023 og ~1654) — nye linjer: 1036, 1180, 1672, 1784, 2012
- [x] Fase 3 — Cache-bust `20260712a` (`v4/index.html`) — dagens dato brukt, ikke `20260708a` fra planutkastet
- [x] Fase 4 — Commit + push til `claude/summer-gap-week-nav-5m8l44`
- [x] Fase 5 — Manuell verifisering (sjekkpunktene under)

**Maskinverifisert (node, 9 scenarier — alle PASS):** sommergap 2026 med 26/27
aktivt → 33; juli 2027 → 24; innenfor skoleåret (uke 41 og uke 10 over nyttår) →
faktisk uke; fallback uten skoleår → gammel avstandslogikk; grensedagene mandag i
uke 33 og mandag i uke 24 → faktisk uke (innenfor-grenen, uendret).

### Verifiser før merge
- [x] I sommergapet (nå, uke ~28, aktivt skoleår 26/27): «Nå» lander på uke 33 av 26/27, «Neste →» er aktiv videre
- [ ] Etter skoleslutt (f.eks. juli 2027 med 26/27 aktivt): «Nå» lander på uke 24 — maskinverifisert (9 node-scenarier, alle PASS); ekte manuell bekreftelse skjer naturlig når datoen inntreffer (juli 2027)
- [x] Innenfor skoleåret: «Nå» gir faktisk inneværende uke (uendret fra P15)
- [x] «Alle mine økter»-ankeret følger samme logikk (bekreftet ved kodegjennomgang: `renderAlleOkterTab` app.js:2012 bruker samme `gjeldendeSkoleuke(schoolStart, schoolEnd, aktivtSkolear)`)

---

## Økt X (P32): AI-import skriver feil skoleår (kartlegging)

**Branch:** `claude/ai-import-school-year-bug-enyxos`
**Scope:** `v4/app.js` (3 linjer), `v4/index.html` (cache-bust → `20260628a`).

### Sjekkliste
- [x] Kallet linje 1709: `valgtSkolear` sendes med som tredje argument
- [x] Signatur linje 2948: `skoleAar`-parameter lagt til
- [x] Bruk linje 2953: `skoleAar || APP.school?.active_school_year` (fallback beholder retning b)
- [x] Cache-bust bumped: `20260628a`
- [x] PLAN.md oppdatert

### Funn 1 — Rotårsak: FUNNET (app.js:2948 + 1709)

**`visAIPasteModal` tar ikke imot `valgtSkolear` som parameter, og hardkoder aktivt skoleår.**

Tre linjer forteller hele historien:

| Linje | Kode | Problem |
|---|---|---|
| 2948 | `async function visAIPasteModal(defaultKlasse, onSave)` | Ingen `skoleAar`-parameter |
| 1709 | `visAIPasteModal(aktivKlasse, renderUke)` | `valgtSkolear` sendes ikke med |
| 2953 | `const skolear = APP.school?.active_school_year` | Bruker alltid aktivt år (25/26) |
| 3337 | `school_year: skolear` | Lagrer med feil år |

**Sammenlign med «+ Ny økt» som P28 bekreftet er korrekt:**
- Kall (linje 1707): `visNyOktModal(aktivKlasse, currentWeek, renderUke, valgtSkolear)` — `valgtSkolear` sendes med
- Signatur (linje 2341): `async function visNyOktModal(defaultKlasse, defaultWeek, onSave, skoleAar)` — tar imot
- Lagring (linje 2409): `school_year: skoleAar || APP.school?.active_school_year` — bruker valgt år

**Konklusjon:** Fiksen hører utelukkende i **app.js** (to endringer: kallet linje 1709 + signaturen + `const skolear`-linjen linje 2953).

### Funn 2 — Edge function returnerer skoleår? AVKLART

`ai-parse-sessions` returnerer **kun uke+dag** — ingen `school_year` i output. Feltet finnes ikke i JSON-skjemaet i prompten (linje 84–96 i index.ts). Feilen er 100 % ved lagring i app.js; edge-funksjonen er ikke årsaken.

Edge-funksjonen får heller ikke `school_year` som input i request-body (den får kun `text` + `context`). Men siden den ikke returnerer skoleår, er dette irrelevant for rotårsaken — skoleåret settes utelukkende av app.js.

### Funn 3 — Sekundærfunn: Ferie blir til økter (BEKREFTET, separat vurdering)

Prompten i `ai-parse-sessions/index.ts` (linje 75–99) har **ingen instruksjoner om å hoppe over ferie-/fri-rader**. Den ser kun fag/klasse/lærer/divisjoner, ikke skoleruten. Når læreren limer inn tekst med «Vinterferie» eller «Høstferie», gjetter AI-en at det er en undervisningsøkt og setter fag = `null` og aktivitet = «Vinterferie» / «Aktivitet».

**Hvordan `ai-parse-skolerute` løste det:** Den har en annen prompt med eksplisitt type-klassifisering (`ferie|helligdag|planleggingsdag|annet`) og returnerer perioder, ikke enkeltøkter. Mønsteret kan ikke direkte overføres siden `ai-parse-sessions` er en annen oppgave. En mulig fix er å sende eksisterende skolerute i konteksten og be AI-en om å hoppe over uker der det er ferie — men dette er et eget tiltak (P33?), ikke del av skoleår-fiksen.

### Funn 4 — Opprydding (Morfars manuelle steg, INGEN KODE)

Feillagrede rader ble importert med `school_year = '25/26'` selv om de hørte til 26/27-planen. Søkekriterier for å finne dem manuelt i Supabase SQL Editor:

```sql
-- Identifiser kandidater: sessions med activity='Aktivitet' ELLER subject_id=null,
-- lærernavn Geir, i 25/26, på uker som logisk tilhører 26/27-perioden (uke 33+)
SELECT id, class_id, week_nr, day_of_week, activity, school_year, created_by
FROM sessions
WHERE school_year = '25/26'
  AND deleted_at IS NULL
  AND week_nr >= 33
  AND (activity ILIKE '%aktivitet%' OR subject_id IS NULL)
ORDER BY week_nr, day_of_week;
```

Merk: Uten nøyaktig importtidspunkt er det vanskelig å avgrense presist. Morfar bør verifisere radene visuelt før eventuell sletting.

---

## Status: FULLFØRT — Økt X (P31): «+ Legg til rad» i skolerute-forhåndsvisning
Branch: `claude/P31-skolerute-legg-til-rad`. Ingen manuelle steg nødvendig.

---

## Økt X (P31): «+ Legg til rad» i skolerute-forhåndsvisning

**Branch:** `claude/P31-skolerute-legg-til-rad`
**Scope:** `v4/app.js` (`visSkoleruteForhandsvisning`), `v4/style.css`, `v4/index.html` (cache-bust), `PLAN.md`.

### Sjekkliste
- [x] «+ Legg til rad» finnes i skolerute-forhåndsvisningen
- [x] Klikk gir en ny tom, redigerbar rad med alle felt + stryk-🗑️
- [x] Uke-hint på den nye raden oppdateres når dato fylles
- [x] Den nye raden lagres sammen med de andre ved «Lagre»
- [x] Tom tittel/dato på en lagt-til rad fanges av eksisterende validering (ingen egen vei)
- [x] Resten av skolerute-importen uendret (AI, warnings, erstatt/legg-til-modus)

---

## Økt X (P30): Fullt redigerbar økt-import

**Branch:** `claude/P30-redigerbar-okt-import`
**Scope:** `v4/app.js` (primært `visAIPasteModal`), `v4/style.css`, `v4/index.html` (cache-bust), `PLAN.md`. Ingen migrasjoner. Ingen edge-function-endringer.

### Kartlegging og funn

#### Dagens `visAIPasteModal` (app.js:2948–3079)
- Laster kontekst med 4 parallelle queries, kaller `ai-parse-sessions`, viser resultat i en tabell.
- **Feil 1 BEKREFTET** (app.js:2969): Henter fra `divisions` — tabellen finnes ikke. Riktig navn er `subject_divisions`. Gir Supabase-feil og tom divisjons-kontekst til AI.
- **Feil 2 BEKREFTET** (app.js:2968): Filtrerer lærere på `role = 'teacher'` — enum-verdien er `'laerer'`. Gir tom lærerliste til AI og tom lærer-dropdown.
- Forhåndsvisning: kun checkbox per rad (avhuk/forkast) — ingen feltredigering.
- Lagring: inserter valgte rader som sessions, `division_id: null` (ingen `session_divisions`-innsetting). Fridagssjekk blokkerer — rader på fridag hoppes over og telles.
- Kollisjonssjekk: FINNES IKKE i dag.

#### AI-felter returnert av `ai-parse-sessions`
`class_id`, `subject_id`, `division_id`, `week_nr`, `day_of_week`, `activity`, `meeting_point`, `info`, `_confidence`, `_note`

#### Mønster fra `visSkoleruteForhandsvisning` (app.js:4681–4778)
- `rad`-objekt der felt ER input-elementene selv (direkte verdi-lesing ved lagring).
- `rad.fjernet = true` + `rad.el.remove()` for stryk-rad (🗑️).
- Fast bunnfelt (`.skolerute-prev-bunn` / `.modal-bunn`) utenfor scrollelisten — alltid synlig.
- Validering med tidlig retur og `showToast` på feil.
- `medLagreOverlay(async () => {...})` rundt insert.

#### Divisjonshenting (eksisterende session-modaler, app.js:2482–2494)
```js
sb.from('subject_divisions')
  .select('*')
  .eq('subject_id', subjectId)
  .or(`class_id.is.null,class_id.eq.${classId}`)
  .is('deleted_at', null)
  .order('sort_order')
```
Grupper (`class_id IS NULL`) + partier for klassen (`class_id = <klasse>`).

#### Lærerhenting (korrekt mønster fra visRedigerOktModal, app.js:2543)
```js
sb.from('users').select('*').eq('school_id', APP.school.id)
```
(ingen role-filter — viser alle brukere; alternativt role in ['laerer', 'kontaktlaerer', 'admin'])

#### `finnFridag(weekNr, dayOfWeek, schoolYear)` (app.js:922) — gjenbrukbar, async.

#### `session_divisions` — insert-mønster (app.js:2417–2418, 2583–2585):
```js
await sb.from('session_divisions').insert(divIds.map(did => ({ session_id: s.id, division_id: did })))
```

### Delplan

- [x] **Steg 1 — Kartlegging og plan** (denne filen)
- [x] **Steg 2 — Dataoppsett og forhåndsmatching**
  - Rettet `divisions` → `subject_divisions` og `role='teacher'` → ingen role-filter (alle brukere ved skolen)
  - Henter eksisterende sessions for klassen ved modal-åpning (kollisjonssjekk)
  - Forhåndsmatching: gyldig AI-ID → navnematch (fag på name+short_code, lærer på fornavn, div på name) → tomt/default
- [x] **Steg 3 — Redigerbar tabellvisning**
  - Rader med select/input for hvert felt (fag, parti/gruppe, lærer, dag som dropdown; uke som tall; aktivitet/oppmøte/info som fritekst)
  - Fagbytte → oppdater parti-dropdown live; samme navn → gul markering + OK-knapp
  - Stryk-rad (🗑️), «+ Legg til rad»
- [x] **Steg 4 — Flagging og merknader**
  - Rød rad (mangler fag/dag/uke), gul (fridag/kollisjon); rød vinner ved begge
  - Merknadskolonne i klarspråk («Mangler fag», «På fridag: …», «Kollisjon: finnes allerede»)
  - «Importer likevel»-hake på kollisjon-rader
  - Live oppdatering (async) ved feltendringer (uke, dag, fag, divisjon)
- [x] **Steg 5 — Importlogikk**
  - Rød alltid utelatt; kollisjon uten hake utelatt; fridag og «importer likevel» tas med
  - Insert sessions + session_divisions (division_id=null på sessions, kobling i session_divisions)
  - Pakket i `medLagreOverlay`
  - Fjerner importerte rader fra visning, beholder røde/ubekreftede, toast med antall
- [x] **Steg 6 — CSS og cache-bust**
  - Nye stiler: `.okt-import-*` for modal, rader, farger, merknadkolonne, foreslatt-markering
  - Bumped `?v=20260627a` i index.html
- [x] **Steg 7 — Verifisering**
  - Alle sjekkliste-punkter bekreftet ved kodegjennomgang

### Verifiser før merge
- [x] Fag/parti/lærer/dag er dropdowns; uke er tall; aktivitet/oppmøte/info er fritekst — alle redigerbare
- [x] Forhåndsmatching: gyldig AI-ID brukes direkte; navnematch som fallback; usikre felt tomme
- [x] Lærer default = innlogget bruker når ingen treff
- [x] Fagbytte oppdaterer parti-dropdown; samme navn → forhåndsvalgt + gul + OK-knapp; ellers nullstilt
- [x] Rød rad (mangler fag/dag/uke) importeres aldri; merknad forklarer
- [x] Fridag → gul, importeres likevel; kollisjon → gul, krever «importer likevel»
- [x] Kollisjon respekterer nøyaktig parti/gruppe-likhet (P1 vs P2 ≠ kollisjon, via divisjon-ID-sammenligning)
- [x] Import fjerner importerte rader, beholder røde + ubekreftede kollisjoner, toast med antall
- [x] «+ Legg til rad» gir ny redigerbar rad
- [x] Verifisert/rettet: `subject_divisions` (ikke `divisions`) og ingen feil role-filter

### Mulige senere utvidelser (IKKE med nå)
- Uke-spenn per rad (én rad = én uke nå)
- Uke-først i `ai-parse-sessions` edge-function

---

## Status: FULLFØRT — Økt X (P29): Storage-policies for logos-bucketen
Branch: `claude/P29-storage-policy-logos`. Migrasjon 020 kjørt i Supabase SQL Editor. Logo lastet opp og bekreftet i bucketen.

---

## Økt X (P29): Storage-policies for logos-bucketen

**Branch:** `claude/P29-storage-policy-logos`
**Scope:** Én SQL-migrasjon (`020_storage_policy_logos.sql`). Ingen app.js-endring.

### Bakgrunn og rotårsak (bekreftet manuelt i Supabase)
- `logos`-bucketen er PUBLIC men har **0 storage-policies**.
- Bucketen er tom — ingen logo-opplasting har noensinne lyktes.
- Supabase Storage RLS: selv om en bucket er public, krever **skriving** (INSERT/UPDATE)
  eksplisitte policies på `storage.objects`. Uten policies avvises opplasting.
- P28 fikset path-formatet (`<school-id>.<ext>`, feilsjekk, cache-bust) — det var
  symptomet. P29 fikser rotårsaken: manglende policies.

### Migrasjonsplan: `020_storage_policy_logos.sql` (revidert)

**Hjelpefunksjoner — verifisert mot migrasjoner:**

| Funksjon | Definert i | Sjekker | Egnet for opplasting? |
|---|---|---|---|
| `auth_school_id()` | `002_rls.sql` linje 8 | `users.school_id` | Ja — returnerer UUID |
| `is_active_admin()` | `002_rls.sql` linje 20 | `users.is_admin_active` (visningstoggle) | **NEI** — nullstilles ved login |
| `auth_is_admin()` | `018_admin_additiv.sql` linje 30 | `users.is_admin` (permanent kolonne) | **JA** — uavhengig av visningsbryter |

**Konklusjon:** Bruk `auth_is_admin()` alene. `is_active_admin()` ville hindre opplasting
når admin er i lærervisning (toggle = false). Mønsteret `(is_active_admin() OR auth_is_admin())`
brukes i 019 for bakoverkompatibilitet, men for logoopplasting — som er ren admin-funksjon —
holder `auth_is_admin()` alene (enklere, ingen historisk bagasje).

**Klausuler per operasjon (PostgreSQL-krav):**
- INSERT: kun `WITH CHECK` (raden eksisterer ikke ennå)
- UPDATE: `USING` (hvilke rader kan oppdateres) + `WITH CHECK` (ny tilstand godkjent)
- DELETE: kun `USING`
- SELECT: kun `USING`

**Policies som opprettes (alle scoped til `bucket_id = 'logos'`):**

1. **INSERT** — `WITH CHECK` — admin for sin skole, filnavn `<uuid>.<ext>`
2. **UPDATE** — `USING` + `WITH CHECK` — samme betingelse
3. **DELETE** — `USING` — fremtidig opprydding
4. **SELECT** — `USING` — public bucket serverer via CDN uten policy, men legges til
   som forsikring siden lese-404 har vært et faktisk symptom

**Idempotens:** `DROP POLICY IF EXISTS` før hver `CREATE POLICY`.
**Berører ikke:** andre buckets eller eksisterende policies utenfor `logos`.

**Fallback hvis SQL Editor gir rettighetsfeil** («must be owner of table objects» e.l.):
Supabase tillater ikke alltid DDL på `storage.objects` via SQL Editor. Hvis `CREATE POLICY`
feiler, opprett de fire policyene manuelt:
`Dashboard → Storage → logos → Policies → New policy`
Bruk «For full customization» og lim inn betingelsene fra SQL-en over.

### Eksakt SQL — revidert (klar til å lime i Supabase SQL Editor)

```sql
-- 020_storage_policy_logos.sql
-- Storage-policies for logos-bucketen.
-- Forutsetning: bucketen 'logos' finnes og er satt til public.
-- Hjelpefunksjoner:
--   auth_school_id() — 002_rls.sql: users.school_id for innlogget bruker
--   auth_is_admin()  — 018_admin_additiv.sql: users.is_admin (permanent, ikke toggle)

-- ── Idempotens: fjern eksisterende policies ──────────────────────
drop policy if exists "Admin kan laste opp logo"   on storage.objects;
drop policy if exists "Admin kan overskrive logo"  on storage.objects;
drop policy if exists "Admin kan slette logo"      on storage.objects;
drop policy if exists "Public kan lese logo"       on storage.objects;

-- ── INSERT: WITH CHECK (raden finnes ikke ennå) ──────────────────
create policy "Admin kan laste opp logo"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'logos'
  and auth_is_admin()
  and name like (auth_school_id()::text || '.%')
);

-- ── UPDATE: USING + WITH CHECK ───────────────────────────────────
create policy "Admin kan overskrive logo"
on storage.objects for update
to authenticated
using (
  bucket_id = 'logos'
  and auth_is_admin()
  and name like (auth_school_id()::text || '.%')
)
with check (
  bucket_id = 'logos'
  and auth_is_admin()
  and name like (auth_school_id()::text || '.%')
);

-- ── DELETE: USING ────────────────────────────────────────────────
create policy "Admin kan slette logo"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'logos'
  and auth_is_admin()
  and name like (auth_school_id()::text || '.%')
);

-- ── SELECT: USING — forsikring mot lese-404 ──────────────────────
-- Public bucket serverer normalt uten policy via CDN, men eksplisitt
-- SELECT-policy sikrer at authenticated-kall (f.eks. signed URLs) også virker.
create policy "Public kan lese logo"
on storage.objects for select
using (
  bucket_id = 'logos'
);
```

### Manuell verifiseringsoppskrift

1. Kjør `020_storage_policy_logos.sql` i Supabase Dashboard → SQL Editor.
2. Verifiser at 3 nye policies dukker opp under Storage → Policies → `objects`-tabellen
   (søk på «logo»).
3. Logg inn som admin i appen → Admin → Skoleinfo → last opp en ny logo.
4. Forvent: **ingen feilmelding**, og filen dukker opp i Storage → logos-bucketen
   som `<school-uuid>.jpg` (eller tilsvarende ext).
5. Verifiser at `logo_url` i `schools`-tabellen (SQL Editor: `select logo_url from schools`)
   har ett enkelt `logos/`-segment og en `?t=`-cache-bust-parameter.
6. Hard refresh i nettleseren (Cmd+Shift+R / Ctrl+Shift+R) → ny logo vises i headeren.

### Sjekkliste
- [x] Skriv `020_storage_policy_logos.sql`
- [x] Commit + push til branch
- [x] Kjør migrasjonen manuelt i Supabase SQL Editor (brukeren gjør dette)
- [x] Verifisert: logo-opplasting fungerer, favicon vises (bekreftet i tredje nettleser)
- [x] DECISIONS.md oppdatert med storage-policy-lærdom
- [x] Merget til main

---

### Favicon-diagnose (oppfølging)

**Spørsmål:** Settes faviconen fra logoen, og er den korrekt?

#### 1. Settes faviconen fra logoen? JA

`index.html` linje 7: statisk fallback:
```html
<link rel="icon" id="favicon" href="unoicon.png">
```
(`unoicon.png` finnes i `v4/` ✅ — korrekt relativ sti)

`app.js` linje 676–684 i `oppdaterHeader()`:
```js
const favicon = document.getElementById('favicon')
if (logo && APP.school && (APP.school.logo_url || APP.school.logo_file_path)) {
  logo.src = APP.school.logo_file_path
    ? `${SUPABASE_URL}/storage/v1/object/public/logos/${APP.school.logo_file_path}`
    : APP.school.logo_url
  logo.classList.remove('skjult')
  if (favicon) favicon.href = logo.src   // ← favicon = logo-URL
} else {
  if (favicon) favicon.href = 'unoicon.png'
}
```

#### 2. Er kilden korrekt? JA

`favicon.href = logo.src` — bruker IDENTISK URL som header-logoen.
`logo.src` = `APP.school.logo_url` = `…/public/logos/<school-id>.jpg?t=<timestamp>`.
Ingen dobbel `logos/`-prefiks; ingen ny path-beregning.

#### 3. Timing — er det en rekkefølgefeil? NEI

`init()` kaller `oppdaterHeader()` to ganger:
- Linje 5005: FØR skoledata → `APP.school` er null → favicon = `unoicon.png`
- Linje 5024: ETTER `APP.school = schools[0]` → favicon = logo-URL ✅

Faviconen oppdateres korrekt etter at skoledata er lastet.

#### 4. Konklusjon: FINNES OG ER KORREKT — blank favicon skyldes nettlesercache

Koden er riktig. Blank favicon skyldes at nettleseren har cachet **det feilede favicon-kallet** fra den gamle ødelagte URL-en (`logos/logos/<uuid>.jpg` → 404). Favicon-cache er særlig hardnakket i Chrome og Safari — den overlever vanlig reload og ofte også hard refresh.

Én potensiell svakhet: å sette `.href` på et eksisterende `<link>`-element er ikke garantert å trigge favicon-refresh i Safari. Den robuste løsningen er remove-and-reinsert av `<link>`-elementet.

#### Foreslått minimal fiks (venter godkjenning)

Bytt ut linje 682:
```js
// FØR:
if (favicon) favicon.href = logo.src

// ETTER:
if (favicon) {
  favicon.remove()
  const nyttFavicon = document.createElement('link')
  nyttFavicon.rel = 'icon'
  nyttFavicon.id = 'favicon'
  nyttFavicon.href = logo.src
  document.head.appendChild(nyttFavicon)
}
```
Dette fjerner det gamle elementet (med cachet 404-tilstand) og insererer et nytt — tvinger alle nettlesere til å hente favicon på nytt.

**Alternativ hvis fiks ikke ønskes:** Lukk alle faner til domenet og åpne på nytt — dette tømmer vanligvis favicon-cache for det domenet.

---

## Økt X (P28): Planleggingsmodus — type-render og skoleår-filter

**Branch:** `claude/bold-volta-c6bdmz`
**Cache-bust:** `20260625a`
**Scope:** `v4/app.js` (4 linjer: 2 × Feil A, 2 × Feil B), `v4/index.html` (cache-bust). Ingen SQL.

### Bakgrunn
P27 (migrasjon 019 + symptom-fikser) er kjørt og verifisert. Admin kan nå lagre skoleinfo/skolerute/skoleår uten RLS-feil. Etter dette observerte bruker to feil i planleggingsmodus (lærervisning, valgt skoleår 26/27 mens aktivt er 25/26):
1. Sommerferie (uke 33) vises ikke i ukenettet, Juleferie (uke 52) vises korrekt.
2. «Ny økt» i 26/27 uke 34 onsdag advarte om dublett, selv om 26/27 var tomt.

---

### Funn (kartlegging, kun kode — ingen kode skrevet)

#### Punkt 1 — Skolerute i ukenettet (`renderMinKlasseTab`→`renderUke`, `app.js:1730`)

**ROTÅRSAK FUNNET — men IKKE år-beregning.**

Hypotesen om feil kalenderår er avkreftet:
- `app.js:1813`: `const visKalenderaarL = skoleaarKalenderaar(valgtSkolear, ...)` — bruker korrekt `valgtSkolear` (f.eks. '26/27') ✓
- Dato-intervallet (`weekStartL`/`weekEndL`) beregnes fra `valgtSkolear` ✓
- `school_calendar`-spørringen (linje 1817–1819) bruker korrekte datoer ✓

**Ekte rotårsak — type-filter i renderingen:**
- `app.js:1862`: `calEvents.find(e => ... && e.type === 'helligdag')` — kun `helligdag`-rader vises som fridagsfarge + etikett i dagkolonnene.
- `ferie`-rader (Sommerferie, Høstferie, Vinterferie) er i `calEvents` men rendres **ikke** i ukenettet — de faller stille gjennom.
- Juleferie er lagret som type `helligdag` (AI-parsereglene i CLAUDE.md) → treffer filteret → vises ✓
- Sommerferie er lagret som type `ferie` → treffer ikke filteret → vises ikke ✗

Samme gap finnes i elevvisningens `renderUke` (`app.js:1248`): identisk `type === 'helligdag'`-filter.

**Sammenlignet med admin-panelets `renderSkolerute` (`app.js:4475`):**
Admin-panelet filtrerer på dato-intervall (`skoleaarIntervall`) uten type-filter → viser alle typer korrekt. Det er derfor bruker ser alle 26/27-rader i Skolerute-fanen, men ikke Sommerferie i ukenettet.

#### Punkt 2 — Kalenderår-beregning i renderUke

**KORREKT — ingen feil her.** `skoleaarKalenderaar(valgtSkolear, ...)` bruker valgt skoleår. Ukenettet beregner riktige datoer for 26/27.

#### Punkt 3 — `renderFlerdagsBjelkeRad` og `finnFridag`

**KORREKT:**
- `app.js:1908`: `isoWeekToDate(visKalenderaarL, ...)` — bruker år fra `valgtSkolear` ✓
- `visNyOktModal` → `finnFridag(weekNr, dagOfWeek, skoleAar)` (`app.js:2380`): `skoleAar` er `valgtSkolear` sendt fra linje 1707 ✓
- `finnFridag` (`app.js:922–934`): beregner dato fra sendt skoleår ✓

Ingen feil her.

#### Punkt 4 — Fantom-dublett i «Ny økt» (`visNyOktModal`, `app.js:2341`)

**ROTÅRSAK FUNNET.**

To sjekker mangler `school_year`-filter:

| Sjekk | Linje | SQL-filter | Problem |
|---|---|---|---|
| Dup-sjekk (samme fag+dag) | 2359–2366 | `class_id + subject_id + week_nr + day_of_week` | Mangler `.eq('school_year', skoleAar)` |
| Konfliktsjekk (samme lærer+dag) | 2370–2376 | `teacher_id + week_nr + day_of_week` | Mangler `.eq('school_year', skoleAar)` |

Begge spørringer søker på tvers av **alle skoleår**. Når 26/27 er tomt men 25/26 har en økt i uke 34 onsdag, finner konfliktsjekken denne 25/26-økten og viser «Du har allerede en økt denne dagen» — en falsk alarm.

`skoleAar`-parameteren er korrekt sendt inn fra linje 1707: `visNyOktModal(aktivKlasse, currentWeek, renderUke, valgtSkolear)` → linje 2380 `finnFridag(..., skoleAar)` bruker den riktig. Men linjene 2359–2376 bruker den ikke.

#### Punkt 5 — P-C: school_year ved lagring

**BEKREFTET KORREKT — P-C lukkes.**
- `app.js:2405`: `school_year: skoleAar || APP.school?.active_school_year` — `skoleAar` = `valgtSkolear` ✓
- `app.js:1707`: `visNyOktModal(..., valgtSkolear)` sender valgt skoleår inn ✓
- Økt lagret i 26/27 havner i 26/27. Koden er riktig.

---

### Deler punkt 1–4 én rotårsak?

**Nei — to separate feil:**
- **Feil A (Punkt 1):** Type-filter i renderingen: `type === 'helligdag'` ekskluderer `ferie`-hendelser fra ukenettet. Gjelder begge visningene (lærer + elev). Ikke et planleggingsmodus-spesifikt problem — samme gap finnes i 25/26 (men ikke like synlig der, siden Sommerferie er utenfor normale navigasjons-uker).
- **Feil B (Punkt 4):** Manglende `school_year`-filter i to sjekker i `visNyOktModal` → falske kollisjonsvarsler i planleggingsmodus.

Hypotesen «leser aktivt år i stedet for valgt» gjelder kun Feil B (indirekte — leser alle år). For Feil A er år-beregningen riktig; feilen er i hva som rendres.

---

### Forslag til fiks (etter godkjenning)

**Feil A — Fiks i `app.js:1862` (lærer) og `app.js:1248` (elev):**
Utvid `find()`-filteret til å også matche `ferie` og `planleggingsdag`. Mulige alternativer:
- **Alt 1 (anbefalt):** Fjern `e.type === 'helligdag'`-sjekken → vis alle skolerute-typer (unntatt `annet`) som fridagsfarge + etikett. Enklest og konsekvent.
- **Alt 2:** Vis `helligdag` som i dag, men legg til et separat `ferie`-banner (annen CSS-klasse) for `ferie`-rader. Gir visuell distinksjon.

**Feil B — Fiks i `app.js:2359` og `app.js:2370`:**
Legg til `.eq('school_year', skoleAar)` i begge spørringene. Én linje per sjekk.

---

### Faser

- [x] **Fase 1 — Feil A: type-render (app.js:1248 + 1862)** — `ferie` og `planleggingsdag` inkludert i `find()`-filteret i begge visningene
- [x] **Fase 2 — Feil B: skoleår-filter (app.js:2359 + 2370)** — `.eq('school_year', skoleAar)` lagt til i dup- og konfliktsjekk
- [x] **Fase 3 — Cache-bust `20260625a` og PLAN.md**
- [x] **Fase 4 — Commit og push**

---

## Status: FULLFØRT — Økt X (P28): Logo-opplasting gir 404
Branch: `claude/P28-logo-opplasting-404`.
**Neste steg:** Godkjenning av foreslått fiks → implementasjon.

### Symptom
Admin lastet opp `logo.jpg`. Ingen feilmelding. Logo-URL i Skoleinfo:
`https://zstjfatkeqbbekqgbsgb.supabase.co/storage/v1/object/public/logos/logos/f37cb8d2-da76-453a-ba27-d7cd6bbb235f.jpg`
→ `404 not_found` i nettleser. Logofeltet er blankt.

### Etterforskning: kode-feil bekreftet (app.js:3486–3490)

```js
// app.js linje 3486–3490
const ext = file.name.split('.').pop()
const path = `logos/${school.id}.${ext}`                     // ← BUG A
await sb.storage.from('logos').upload(path, file, { upsert: true })  // ← BUG B (usjekket)
const { data: urlData } = sb.storage.from('logos').getPublicUrl(path)
logoUrlInput.value = urlData.publicUrl                        // ← satt uansett om upload feilet
```

#### Hypotese A og B — begge bekreftet i kode

**Hypotese B (path-mismatch) — BEKREFTET:**
`sb.storage.from('logos')` peker på bucket `logos`.
`path = 'logos/${school.id}.${ext}'` er object-path *inni bucketen*.
Supabase-js bygger public URL som:
```
<SUPABASE_URL>/storage/v1/object/public/<bucket>/<path>
= .../public/logos/logos/<uuid>.jpg
```
Det doble `logos/logos/` i URL-en er et direkte avtrykk av denne buggen.
Filen ble lastet opp til bucket `logos`, object-path `logos/<uuid>.jpg` — men
for å nå den krever URL-en `/public/logos/logos/<uuid>.jpg`, ikke `/public/logos/<uuid>.jpg`.

**Hypotese A (stille feil) — BEKREFTET I KODE:**
`.upload(...)` sin returverdi destructureres ikke (`await` uten `const { error }`).
Feil fra Supabase Storage (RLS, manglende bucket-policy, nettverksfeil) passerer
stille. `getPublicUrl` gjør IKKE en HTTP-sjekk — den bygger bare URL-strengen
basert på path. Dermed oppdateres `logoUrlInput.value` alltid, enten filen
kom inn i bucketen eller ikke.

Hva som faktisk skjedde (A eller B) avgjøres av om filen ligger i bucketen:
- Hvis filen LIGGER ved path `logos/<uuid>.jpg` i bucket `logos` → B dominerer
  (feil path i URL, men upload lyktes)
- Hvis filen IKKE finnes → A dominerer (upload feilet stille, URL lagret uansett)

**Anbefalt manuelt sjekk:** Gå til Supabase Dashboard → Storage → bucket `logos`
→ se om det finnes en mappe `logos/` og filen `logos/f37cb8d2-...jpg` der inne.
Svaret avgjør om kun URL-en må fikses, eller om opplastes-logikken aldri fungerte.

#### Tilleggsbugg: URL lagres i feil felt

Skoleinfo-formen lagrer full URL i `schools.logo_url` (linje 3431–3432).
Header-koden (linje 677–680) prioriterer `logo_file_path` over `logo_url`:
```js
logo.src = APP.school.logo_file_path
  ? `${SUPABASE_URL}/storage/v1/object/public/logos/${APP.school.logo_file_path}`
  : APP.school.logo_url
```
`logo_file_path` er IKKE satt av opplastingsflyten. Dermed faller den til
`logo_url` (direktebruk av den ødelagte URL-en). Samme gjelder favicon (linje 682)
og velkomst-logo (linje 995–996). Alle tre blankes om URL-en er 404.

### Foreslått fiks (minimal — kun linjene som er feil)

**Fil:** `v4/app.js` linje 3486–3490

```js
// FØR:
const path = `logos/${school.id}.${ext}`
await sb.storage.from('logos').upload(path, file, { upsert: true })
const { data: urlData } = sb.storage.from('logos').getPublicUrl(path)
logoUrlInput.value = urlData.publicUrl

// ETTER:
const path = `${school.id}.${ext}`
const { error: opplErr } = await sb.storage.from('logos').upload(path, file, { upsert: true })
if (opplErr) { showToast('Logo-opplasting feilet: ' + opplErr.message, 'error'); return }
const { data: urlData } = sb.storage.from('logos').getPublicUrl(path)
logoUrlInput.value = urlData.publicUrl
```

Endringer:
1. `path` mister `logos/`-prefikset → URL blir `.../public/logos/<uuid>.jpg` (korrekt)
2. `opplErr` fanges og vises som toast → stille feil er borte
3. `logoUrlInput` oppdateres kun ved vellykket opplasting

**Ingen endring i DB-skjema, ingen migrasjon, ingen edge-function-deploy.**
Cache-bust: `20260625a`.

### Faser (venter godkjenning)

- [x] **Fase 1 — Fiks path + error-sjekk** (`app.js:3487–3490`)
- [x] **Fase 2 — Cache-bust `20260625a`** (`index.html`)
- [x] **Fase 3 — Commit + push**

---

## Status: FULLFØRT — Økt X (P27): Tre admin-skrivefeil — RLS for adminpanelet
Branch: `claude/focused-mendel-7uyjza`.
Cache-bust: `20260624a`.
Scope: `v4/supabase/migrations/019_admin_panel_rls.sql` (ny, 12 policyer), `v4/app.js` (3 fikser), `v4/index.html` (cache-bust).
**Neste steg:** Migrasjon 019 kjøres manuelt i Supabase SQL Editor.

### Korreksjon (v3 → v4): WITH CHECK på alle FOR ALL-policyer

`FOR ALL`-policyer med kun `USING` default-denyer INSERT i PostgreSQL — `WITH CHECK` er ikke arvet fra `USING`. Migrasjon 019 ble oppdatert til å ha eksplisitt `WITH CHECK (<identisk uttrykk som USING>)` på alle 10 `FOR ALL`-policyer (#1–#10). Policyer #11 (FOR DELETE) og #12 (FOR SELECT) trenger ikke WITH CHECK.

Verifisering mot originaldefinisjonene (002/009/017/018): ingen av de gamle policyene hadde eksplisitt WITH CHECK → ingen regresjon ved drop + recreate. Policyens opprinnelige logikk er uendret bortsett fra den nye `auth_is_admin()`-armen.

---

### Korrigert forståelse

Adminpanelet (`#/admin`) nås via «Innstillinger» i hamburgeren og er **uavhengig av Admin-toggelen**. Toggelen er en P10-rettighetsbryter for ekstra rettigheter i *lærervisningen* (redigere andres timer). En admin som åpner panelet fra hamburgeren uten toggelen er i korrekt og tiltenkt tilstand.

Rotårsak: RLS-skrivepolicyer for adminpanel-tabellene sjekker `is_active_admin()` (= `users.is_admin_active`, toggelflagget). Etter migrasjon 018 er admin et additivt boolsk felt (`users.is_admin`), og enum-verdien `'admin'` i `user_role_enum` brukes ikke lenger. En reell admin har `role = 'laerer'/'kontaktlaerer'` + `is_admin = true`. Riktig funksjon er `auth_is_admin()` (lagt til i 018).

---

### Hva 018 allerede fikset

Migrasjon 018 oppdaterte `auth_is_admin()`-funksjonen og fikset **noen** policyer med mønsteret `is_active_admin() OR auth_is_admin()`:

| Policy | Tabell | Status |
|---|---|---|
| `facts_write_admin` | `school_facts` | ✅ fikset i 018 |
| `sessions_update_kontaktlaerer` | `sessions` | ✅ fikset i 018 |
| `sessions_delete_kontaktlaerer` | `sessions` | ✅ fikset i 018 |
| `subject_divisions_write_kontaktlaerer` | `subject_divisions` | ✅ fikset i 018 |

Merk: `sessions`-policyene beholder `is_active_admin()` som *indre* betingelse `(is_contact_teacher_for(class_id) or is_active_admin())` — dette er korrekt og skal ikke røres (P10-toggle for kollegahjelp).

---

### Fullstendig policy-liste for migrasjon 019

Alle under bruker kun `is_active_admin()` og mangler `auth_is_admin()`-armen. Migrasjonsnummer: **019** (`019_admin_panel_rls.sql`).

| # | Policy-navn | Tabell | Nåværende admin-sjekk | Feil obs? |
|---|---|---|---|---|
| 1 | `schools_write_admin` | `schools` | `is_active_admin()` | ✗ **FEIL 1 + 3** |
| 2 | `classes_write_admin` | `classes` | `is_active_admin()` | (ville feilet ved klasseredigering) |
| 3 | `subjects_write_admin` | `subjects` | `is_active_admin()` | (ville feilet ved fagredigering) |
| 4 | `subject_divisions_write_admin` | `subject_divisions` | `is_active_admin()` | (ville feilet ved divisjonsredigering) |
| 5 | `users_write_admin` | `users` | `is_active_admin()` | (ville feilet ved brukeradmin) |
| 6 | `user_classes_write_admin` | `user_classes` | `is_active_admin()` | (ville feilet ved klassetilknytning) |
| 7 | `cct_write_admin` | `class_contact_teachers` | `is_active_admin()` | (ville feilet ved kontaktlæreroppsett) |
| 8 | `csc_write_kontaktlaerer_or_admin` | `class_subject_config` | `is_active_admin() or is_contact_teacher_for(...)` | (admin-arm ville feilet) |
| 9 | `mde_write_kontaktlaerer_or_admin` | `multi_day_events` | `is_active_admin() or auth_role() = 'kontaktlaerer'` | (admin-arm ville feilet) |
| 10 | `cal_write_admin` | `school_calendar` | `is_active_admin()` | ✗ **FEIL 2** |
| 11 | `transfers_delete_sender_or_admin` | `pending_transfers` | `is_active_admin()` | (admin-slettefunksjon) |
| 12 | `audit_read_admin` | `audit_log` | `is_active_admin()` | (admin-leselogg) |

**Mønster som brukes:** `is_active_admin() OR auth_is_admin()` — identisk med det som allerede er i prod for `school_facts` (migrasjon 018).

Merk `mde_write_kontaktlaerer_or_admin` (#9): `auth_role() = 'kontaktlaerer'`-armen er fortsatt gyldig etter 018 (kontaktlærere har fremdeles `role = 'kontaktlaerer'`). `is_active_admin()` erstattes *ikke* — den legges til med `auth_is_admin()` som ekstra arm.

---

### Symptom-fikser i `app.js` (beholdes uansett)

| Feil | Sted | Endring |
|---|---|---|
| FEIL 1 | `app.js:3434` | `.select().single()` → `.select()` + `data?.[0]` + norsk feilmelding |
| FEIL 3 | `app.js:3617` | Samme |
| FEIL 2 | `app.js:4750` | Fang feil med PostgreSQL-kode `42501`, vis «Admin-tilgang kreves for å lagre skoleruten» |

---

### Faser (etter godkjenning)

- [x] **Fase 1 — SQL-migrasjon `019_admin_panel_rls.sql`** — fil klar, **MANUELT: kjør i Supabase SQL Editor**
- [x] **Fase 2 — Symptom-fix FEIL 1** (`app.js:3434`)
- [x] **Fase 3 — Symptom-fix FEIL 3** (`app.js:3617`)
- [x] **Fase 4 — Symptom-fix FEIL 2** (`app.js:4750`)
- [x] **Fase 5 — Cache-bust `20260624a` og commit/push**

---

## Status: FULLFØRT — Økt X (P28): Planleggingsmodus — type-render og skoleår-filter

---

## Status: FULLFØRT — Økt X (P26): Fiks `increment_fact_view`-krasj i AI-overlay
Branch: `claude/focused-mendel-7uyjza` (venter godkjenning — ingen kode ennå).
**Neste steg:** Godkjenning av valgt alternativ → implementasjon.

---

### Korrigert forståelse (etter tilbakemelding)

Adminpanelet (`#/admin`) nås via «Innstillinger» i hamburgeren og er **uavhengig av Admin-toggelen**. Toggelen i headeren er utelukkende en P10-rettighetsbryter for ekstra rettigheter i *lærervisningen* (redigere andres økter). En admin som åpner adminpanelet fra hamburgeren uten å ha toggelen på er i **korrekt og tiltenkt tilstand**.

Rotårsaken er altså ikke et router-hull, men en **uoverensstemmelse i RLS**: skrive-policyer for adminpanel-tabellene krever `is_active_admin()` (som sjekker `users.is_admin_active`), men det flagget styres av en toggle som aldri er ment å brukes ved adminpanel-arbeid.

---

### Bakgrunn: Presedensen fra migrasjon 006

Migrasjon `006_fix_school_facts_rls.sql` løste **nøyaktig samme problem** for `school_facts` allerede:

```sql
-- Fra 006_fix_school_facts_rls.sql (kjørt, i prod):
create policy "facts_write_admin"
  on school_facts for all
  using (
    school_id = auth_school_id()
    and (
      is_active_admin()
      or (select role from users where id = auth.uid() and deleted_at is null) = 'admin'
    )
  );
```

Logikken: `is_active_admin() OR role = 'admin'`. Dvs. enten har du toggelen på, *eller* du er permanent admin etter rolle. **Dette mønsteret er bevisst valgt og allerede godkjent av prosjektet.** Det er konsekvens av den foreliggende situasjonen at de resterende adminpanel-tabellene mangler det samme.

---

### Berørte RLS-policyer per tabell

Fra `002_rls.sql` og etterfølgende migrasjoner, sortert etter type:

#### Gruppe 1 — Rene adminpanel-tabeller (skriver til DB kun fra adminpanelet)
Disse mangler `or role = 'admin'`-armen og feiler når toggle er av:

| Tabell | Feilende policy | Gjeldende sjekk |
|---|---|---|
| `schools` | `schools_write_admin` | `id = auth_school_id() and is_active_admin()` |
| `classes` | (navnløs for all) | `school_id = auth_school_id() and is_active_admin()` |
| `subjects` | (navnløs for all) | `school_id = auth_school_id() and is_active_admin()` |
| `subject_divisions` | to policyer | `is_active_admin() and …` / `auth_role() = 'kontaktlaerer' and …` |
| `users` (admin) | (navnløs for all) | `school_id = auth_school_id() and is_active_admin()` |
| `user_classes` | (navnløs for all) | `is_active_admin() and …` |
| `class_contact_teachers` | (navnløs for all) | `is_active_admin()` |
| `school_calendar` | (navnløs for all) | `school_id = auth_school_id() and is_active_admin()` |
| `school_facts` | `facts_write_admin` | **ALLEREDE FIKSET i mig. 006** |

`class_subject_config` har `is_active_admin() or is_contact_teacher_for(class_id)` — kontaktlærer-armen er OK, men admin-armen mangler rolle-alternativet.

`multi_day_events` har `is_active_admin() or auth_role() = 'kontaktlaerer'` — admin kan lage MDE fra adminpanelet uten toggle. Bør inkluderes.

`audit_log` og `pending_transfers` bruker også `is_active_admin()`, men disse er interne/systemtabeller uten direkte brukerinteraksjon fra adminpanelet — kan utsettes.

#### Gruppe 2 — Sessions-relaterte policyer (P10-toggle — skal IKKE endres)
`sessions`-tabellens skriveolicyer bruker `is_active_admin()` bevisst for å styre P10-rettigheten (redigere andres timer). Disse røres **ikke**.

---

### Tre alternativers med fordeler/ulemper

---

#### Alternativ A — Konsistent `or auth_role() = 'admin'` på alle adminpanel-tabeller (anbefalt)

Samme mønster som migrasjon 006, rullet ut til alle gjenværende tabeller i én ny migrasjon.

**Ny migrasjon (019_admin_panel_rls.sql):**
- For `schools`, `classes`, `subjects`, `subject_divisions`, `users` (admin-all), `user_classes`, `class_contact_teachers`, `school_calendar`, `class_subject_config`, `multi_day_events`:
  - Drop eksisterende policy
  - Lag ny med `is_active_admin() OR auth_role() = 'admin'` i admin-sjekken
- `school_facts` allerede fikset — skip

**Fordeler:**
- Konsistent: alle adminpanel-tabeller følger samme mønster
- Bruker `auth_role()` som allerede finnes som `SECURITY DEFINER`-funksjon — ingen ny funksjon trengs
- Identisk logikk som det som allerede er godkjent og i prod for `school_facts`
- Toggle forblir uberørt for sessions (P10 intakt)
- Admin med toggle *av* kan nå skrive fra adminpanelet — korrekt oppførsel
- Admin med toggle *på* (f.eks. fordi de jobber med timer) kan fortsatt skrive — bakoverkompatibelt

**Ulemper:**
- En admin i *elev-visning* eller *lærer-visning* (toggle av) kan teknisk sett gjøre rå API-kall som redigerer klasser/fag osv. — men dette er ikke eksponert i UI, og er akseptabelt sidennde allerede har lese-tilgang til alt via Supabase-anon-nøkkel
- Noe større migrasjon (10–12 policy-dropp og -rekreasjoner)

---

#### Alternativ B — Minimale to tabeller (schools + school_calendar)

Fikser kun de to tabellene der feilene er observert (FEIL 1/3 og FEIL 2). Samme OR-mønster som 006, men kun der det trengs akutt.

**Fordeler:**
- Minimal migrasjon (4 linjer SQL)
- Lavest risiko

**Ulemper:**
- Ufullstendig: admin vil feile på `classes`, `subjects`, `subject_divisions`, `users`-oppdateringer (bruker-admin-fanen), `user_classes`, `class_contact_teachers` — alt dette er adminpanel-operasjoner som vil gi samme feil
- Skaper teknisk gjeld: vi vet vi må tilbake og gjøre resten
- Inkonsistens: noen tabeller har OR-mønster, andre ikke

---

#### Alternativ C — Ny dedikert `is_school_admin()`-funksjon, bytt alle policyer

Introduser en ny SQL-funksjon `is_school_admin()` = `role = 'admin'`, og erstatt `is_active_admin()` med den i alle adminpanel-policyer.

```sql
create or replace function is_school_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select role = 'admin' from users where id = auth.uid() and deleted_at is null), false);
$$;
```

**Fordeler:**
- Semantisk renere navnsetting for fremtiden

**Ulemper:**
- Bryter med OR-mønsteret fra 006 (som beholder bakoverkompatibilitet med toggle-on)
- En admin med toggle *på* og gammel kode som stol på `is_active_admin()` for adminpanel-tilgang ville teknisk sett ikke trenge toggle lenger — subtil atferdsendring
- Mer migrasjonskode enn alternativ A uten klart pluss
- `auth_role()` finnes allerede — ingen ny funksjon trengs for A

---

### Anbefaling

**Alternativ A** — konsistent `or auth_role() = 'admin'` på alle adminpanel-tabeller.

Begrunnelse:
1. Identisk logikk som mig. 006 (allerede i prod, allerede godkjent).
2. Bruker `auth_role()` som allerede finnes — ingen ny infrastruktur.
3. Fikser alle tre feilene *og* forebygger tilsvarende feil i resten av adminpanelet.
4. Toggle-semantikken for sessions/P10 berøres ikke.

---

### Symptom-fikser i `app.js` (beholdes uansett valg)

Disse gjøres parallelt med SQL-migrasjonen og gir gode feilmeldinger hvis RLS-blokkering likevel oppstår:

- **FEIL 1** (`app.js:3434`): `.select().single()` → `.select()` + `data?.[0]` med norsk feilmelding
- **FEIL 3** (`app.js:3617`): Samme
- **FEIL 2** (`app.js:4750`): Fang feil med `code === '42501'` og vis «Admin-tilgang kreves for å lagre skoleruten»

---

### Faser (etter godkjenning)

- [ ] **Fase 1 — SQL-migrasjon `019_admin_panel_rls.sql`** (kjøres manuelt i SQL Editor)
- [ ] **Fase 2 — Symptom-fix FEIL 1** (`app.js:3434`)
- [ ] **Fase 3 — Symptom-fix FEIL 3** (`app.js:3617`)
- [ ] **Fase 4 — Symptom-fix FEIL 2** (`app.js:4750`)
- [ ] **Fase 5 — Cache-bust og commit/push**

---

## Status: FULLFØRT — Økt X (P26): Fiks `increment_fact_view`-krasj i AI-overlay
Branch: `claude/P26-fiks-increment-fact-view-catch`.
Cache-bust: `20260623b`.
Scope: `v4/app.js` (én linje), `v4/index.html` (cache-bust). Ingen DB-/edge-/CSS-/migrasjonsendringer.
**Neste steg:** Live-test (AI-import uten krasj), deretter PR (tittel **P26**) → merge.

### Problem
AI-importen («Lim inn økter med AI» og «Lim inn skolerute») krasjer med:
`sb.rpc('increment_fact_view', { p_fact_id: forrige.id }).catch is not a function`
Begge importene deler `medAIOverlay`, og krasjet stopper overlayets flytkontroll.

### STEG 1 — Kartlegging (kun lesing, med bevis)

#### 1. Alle forekomster av `increment_fact_view` i `v4/app.js`
**Kun ÉN forekomst:**
- **Linje 331**, inne i hjelpefunksjonen `nesteFakta()` (lukket inne i `medAIOverlay`).
  Pattern: `sb.rpc('increment_fact_view', { p_fact_id: forrige.id }).catch(() => {})` → **FEIL**.
  `sb.rpc(...)` returnerer en Supabase PromiseLike/query-builder (har `.then()`) men ikke
  et fullt `Promise` (mangler `.catch()`) → `TypeError: .catch is not a function`.
  Ingen andre forekomster med verken feil eller riktig mønster.

#### 2. Krasjet er i `medAIOverlay` sin funfacts-rotasjon — BEKREFTET
`nesteFakta()` kalles (a) ved overlay-oppstart (`visNeste(false)`) og (b) via
`setInterval(..., 10000)` + «→»-knappen. Hvert kall prøver `.catch()` på rpc-returnverdien.
Det eksploderer umiddelbart/etter 10 sek — ikke i selve AI-importlogikken (som ligger i
`asyncFn`-argumentet). Begge importene (`visAIPasteModal` og `visAIPasteSkoleruteModal`)
bruker `medAIOverlay` → begge rammes.

#### 3. RPC-funksjonen `increment_fact_view` i migrasjoner
**FINNES** — `v4/supabase/migrations/018_funfacts_view_count.sql` linje 17:
`CREATE OR REPLACE FUNCTION increment_fact_view(p_fact_id uuid)`.
Migrasjonen finnes men er ikke listet i kjørte migrasjoner i CLAUDE.md — kan hende den
ikke er kjørt i prod-databasen ennå. Det endrer ikke fiksen (stille feil svelges uansett).

#### 4. Andre `.catch`-på-rpc-mønster i app.js
**Ingen andre.** Grep over hele `v4/app.js` for `sb\.rpc\(.*\)\.catch` gir kun linje 331.
Linje 374 (`sjekkOgFornyFunfacts().catch(() => {})`) kaller en vanlig `async function` →
fullt Promise → `.catch()` er gyldig der.

---

### STEG 2 — Fiks (venter godkjenning)

**Minimal endring:** `Promise.resolve(...)` wrapper gjør returverdien til et ekte Promise.
```js
// FEIL (i dag):
sb.rpc('increment_fact_view', { p_fact_id: forrige.id }).catch(() => {})

// RIKTIG:
Promise.resolve(sb.rpc('increment_fact_view', { p_fact_id: forrige.id }))
  .then(() => {}, () => {})
```
Samme semantikk: ikke-blokkerende, svelger feil stille. Ingen endring i hva som telles.

**Faser:**
- [x] **Fase 1 — Fiks linje 331 i `v4/app.js`** (én linje endret).
- [x] **Fase 2 — Cache-bust `20260623b` i `v4/index.html`** (JS-linja).
- [x] **Fase 3 — Commit, push, kryss av, oppsummering.**

### Verifiser
- [ ] «Lim inn økter med AI» kjører uten krasj (live-test)
- [ ] «Lim inn skolerute med AI» gir respons (neste skoleår) (live-test)
- [ ] Funfacts roterer fortsatt i AI-overlayet uten feil (live-test)
- [ ] Ingen ny feil i konsollen (live-test)
- [x] Ingen endring utenfor `v4/app.js` + cache-bust

---

## Status: FULLFØRT (venter verifisering) — Økt X (P25): Mobil header-overflow (flytt redundante toggles til hamburger)
Branch: `claude/friendly-edison-f6tvex` (systemmandatert dev-branch; identisk med
`origin/main`@P24/#122 etter fetch — 0 ahead / 0 behind). Cache-bust: `20260623a`.
Scope: `v4/app.js` (`oppdaterHeader`), `v4/style.css`, `v4/index.html` (markup + cache-bust),
`PLAN.md`, `DECISIONS.md`. Ingen DB-/edge-/migrasjonsendringer.
**Neste steg:** Live-test av Morfar (mobil ~390px + desktop), deretter PR (tittel **P25**) → merge.

### Problem
På smal mobilskjerm (~390px) får ikke header-raden plass til alt på én linje:
`[skoleår] [Skolenavn] [klasse X]` + «Admin» + «Lærervisning/Elevvisning» + hamburger.
Headeren er én flex-rad uten `flex-wrap` (style.css:104–111), så overskytende innhold
klippes mot høyre kant i stedet for å brytes — «Lærervisning» og hamburgeren forsvinner
utenfor kanten.

### STEG 1 — Kartlegging (kun lesing, med bevis)

a) **Header-knappene i dag.**
   - **Markup** (index.html:38–40): «Alltid-synlige toggle-brytere» —
     `#hdr-admin-toggle` («Admin») og `#hdr-laerer-btn` («Lærervisning»), begge
     `class="hdr-btn skjult"`. Deretter `#hdr-hamburger` («☰», index.html:43).
   - **`#hdr-admin-toggle`** styres i `oppdaterHeader` (app.js:732–738): vises når
     `visAdmin = harAdminTilgang()` (app.js:705), tekst «Admin», toggler `.admin-aktiv`
     fra `APP.isAdminActive`, `onclick = toggleAdminModus` (P10: navigerer IKKE),
     `title` = «Bytt til lærervisning/adminvisning». Modus-uavhengig synlig for admin.
   - **`#hdr-laerer-btn`** styres i `oppdaterHeader` (app.js:710–730): ALLTID synlig for
     innlogget bruker (`laererBtn.classList.remove('skjult')`, app.js:711 — P21 symmetrisk).
     Tekst = `erILaerer ? 'Elevvisning' : 'Lærervisning'`. `onclick` (app.js:714–728):
     i lærervisning → sett `APP.elevPeekWeek = APP.laererCtx.week` og naviger til
     `#/klasse/<klasseNavn>` (fallback `#/`); ellers → `#/laerer/<APP.laererCtx.tab||'klasse'>`.
   - **Synlighet (P21):** admin ser begge; vanlig lærer ser kun lærer/elev-toggelen;
     utlogget ser ingen (`else`-grenen app.js:754–755 legger på `.skjult`).

b) **Hamburger-menyen i dag (`#hdr-dropdown`, index.html:44–50) — NØYAKTIG innhold:**
   - `#hdr-dropdown-navn` (brukernavn) — vises innlogget (app.js:742).
   - `#hdr-dd-profil` «Profil» → `#/laerer/innstillinger` (app.js:744–747).
   - `#hdr-dd-innstillinger` «Innstillinger» — KUN admin (`toggle('skjult', !visAdmin)`,
     app.js:748–751) → `#/admin`.
   - `#hdr-dd-logout` «Logg ut» → `logout()` (app.js:752).
   - `#hdr-dd-login` «Logg inn» — kun utlogget → `#/login` (app.js:762).
   - **BEKREFTET:** «Admin» og «Lærervisning» finnes IKKE i hamburgeren i dag (de ligger
     som egne header-knapper, jf. a). Ingen duplikater å gjeninnføre. (Merk: CSS-regelen
     `.hdr-dropdown-btn.admin-aktiv`, style.css:159, er en ubrukt levning — ufarlig.)

c) **Hvordan «alltid synlig» ble satt.** Det finnes INGEN `hdr-pc-only`-klasse igjen
   (grep i hele `v4/` → 0 treff). P9 fjernet den helt; de to header-knappene har nå bare
   `hdr-btn skjult`, og synligheten styres utelukkende av JS (`.skjult`-toggling i
   `oppdaterHeader`). Det finnes ingen CSS-media-query som skjuler dem på mobil i dag —
   derfor overflyten. → Vi gjeninnfører et CSS-skjul betinget på skjermbredde.

d) **Breakpoint-praksis.** Appens primære mobil-breakpoint er **`max-width: 700px`**
   (style.css:724 = tabell→kort; style.css:805 = uke-grid→kolonne + alle mobiltilpasninger).
   `640px` (style.css:568) er kun en lokal skolerute-tilpasning. → Vi gjenbruker **700px**
   (og komplementet `min-width: 701px` for desktop-skjul av hamburger-duplikatene).

e) **`--header-h`-måling.** `settHeaderHoyde()` (app.js:776–781) setter `--header-h` fra
   `header.offsetHeight`, kalles sist i `oppdaterHeader` (app.js:770) og på `resize`
   (app.js:4941). Headeren er én flex-rad uten `flex-wrap` (style.css:108) → høyden er
   stabil (drevet av logo 38px + 10px padding), uavhengig av antall knapper. Å FJERNE de to
   tekstknappene på mobil kan ikke ØKE høyden. `#hdr-dropdown` er `position:absolute`
   (style.css:142–143) → bidrar ikke til `offsetHeight`, så ekstra dropdown-valg endrer
   ikke `--header-h`. Sticky fane-rad (`top` fra `--header-h`) forblir korrekt.

### STEG 2 — Delplan (anbefaling: Tilnærming A)

**Vurdering A vs B — anbefaler A.** Tilnærming A (flytt redundante toggles inn i
hamburgeren på mobil) er ryddigst: hamburgeren ER allerede mobilnavigasjonen, headeren
beholder kun det essensielle (skoleinfo + ☰), og vi rører ikke knappenes adferd. Tilnærming
B (krymp knappene til ikoner / skjul skoleinfo) gir mer rot og risiko mot skoleinfo-blokka.
B beholdes kun som fallback hvis A skulle rote til synlighetslogikken.

**Mekanisme (ingen JS-breakpoint-logikk — rent CSS-styrt vis/skjul, unngår blink):**
De to header-knappene får klassen `hdr-pc-only` (CSS skjuler dem `@media max-width:700px`).
To NYE hamburger-valg (`#hdr-dd-laerer`, `#hdr-dd-admin`) får klassen `hdr-mobile-only`
(CSS skjuler dem `@media min-width:701px`). `oppdaterHeader` setter tekst/tilstand/onclick
+ `.skjult` på BÅDE header-knappene OG de nye dropdown-valgene ut fra samme rolle-logikk
(P21); CSS avgjør hvilket sett som faktisk vises per breakpoint. Media-queriene er gjensidig
utelukkende (≤700 vs ≥701) → nøyaktig ett sett synlig, ingen blink, ingen duplikat.

- [x] **Fase 1 — Markup** (`v4/index.html`). `hdr-pc-only` lagt på `#hdr-admin-toggle` og
  `#hdr-laerer-btn`. To nye knapper i `#hdr-dropdown` rett etter `#hdr-dropdown-navn`:
  `#hdr-dd-laerer` og `#hdr-dd-admin`, begge `class="hdr-dropdown-btn hdr-mobile-only skjult"`.
  Cache-bust `?v=20260623a` (CSS + JS).

- [x] **Fase 2 — `oppdaterHeader`-logikk** (`v4/app.js`). Lærer-toggelens adferd trukket ut i
  felles `byttLaererElev`-kjerne (P21 elev-peek/retur) som BÅDE `#hdr-laerer-btn` OG
  `#hdr-dd-laerer` kaller identisk. `#hdr-dd-laerer` får samme tekst/title, alltid synlig for
  innlogget bruker. `#hdr-dd-admin` får tekst «Admin», `.toggle('admin-aktiv', …)` og samme
  `toggleAdminModus` (P10: navigerer ikke), vist kun når `visAdmin`. Utlogget-grenen legger
  `.skjult` på begge. Header-knappenes egen logikk uendret.

- [x] **Fase 3 — CSS** (`v4/style.css`). `@media (max-width:700px){ .hdr-pc-only{display:none!important} }`
  og `@media (min-width:701px){ .hdr-mobile-only{display:none!important} }`. Ingen
  `display`-regel utenfor media-queriene (JS-`.skjult` styrer rolle/innlogging som før).
  `header` er allerede `display:none` ved print → ingen print-endring.

- [x] **Fase 4 — Verifisert `--header-h` (resonnement).** Headeren er én flex-rad uten
  `flex-wrap`; høyden drives av logo (38px) eller hamburger (~32px, som blir værende på mobil)
  — aldri av de skjulte `.hdr-pc-only`-knappene. Dropdownen er `position:absolute` → ekstra
  valg påvirker ikke `offsetHeight`. `settHeaderHoyde` re-måler etter hver `oppdaterHeader` og
  på `resize`, så 700px-grensen måles riktig. → `--header-h` uendret, sticky fane-rad intakt.

- [x] **Fase 5 — Avslutning.** PLAN.md krysset av + «Neste steg» oppdatert. DECISIONS.md (P25)
  + CLAUDE.md (header-mønster) dokumentert. Commit per fase. Norsk oppsummering til slutt.

### Flagg / risiko
- **Branch-navn:** oppgaven foreslo `claude/P25-mobil-header-overflow`, men systemets «Git
  Development Branch Requirements» mandaterer `claude/friendly-edison-f6tvex` — jeg blir på
  den (ingen push til annen branch uten eksplisitt tillatelse), jf. P21-presedens.
- Strengt scope: KUN header-overflow. Rører IKKE admin-toggelens adferd (P10: navigerer ikke),
  Profil/Innstillings-mønsteret (P23/P24) eller elev-peek (P21). Flagges om noe frister utenfor.
- Hvis CSS-vis/skjul gir blink/duplikat i en tilstand: stopp og rapporter (forventet ufarlig —
  media-queriene er gjensidig utelukkende).
- Hvis selve skolenavnet alene fortsatt er for bredt på svært smal skjerm (etter at de to
  knappene er fjernet): noteres som egen oppfølging (la `.hdr-id-blokk` krympe/ellipse) — ikke
  del av denne økten med mindre verifisering viser at hamburgeren fortsatt klippes.

### Verifiser (kode-verifisert der mulig; visuell live-test gjenstår for Morfar)
- [ ] Mobil (~390px): ingenting klippes i headeren; hamburger fullt synlig og trykkbar (live)
- [ ] Mobil: «Admin» og «Lærervisning/Elevvisning» finnes i hamburger-menyen med riktig
  tekst/tilstand og virker (admin-toggle veksler modus; lærer/elev navigerer + elev-peek) (live)
- [x] Desktop: header-knappene uendret; ingen duplikate valg i hamburgeren
  (`.hdr-mobile-only` skjult `≥701px`; header-knappenes JS-logikk urørt)
- [x] Synlighet intakt (P21): admin ser begge; vanlig lærer kun lærer/elev; utlogget ingen
  (samme `visAdmin`/innlogget-rollelogikk speiles til hamburger-valgene)
- [x] Sticky fane-rad sitter fortsatt rett (riktig `--header-h`) — jf. Fase 4
- [x] Hard refresh henger ikke på «Laster…» (init/`renderLaererView`/`renderAdminPanel` urørt)

---

## Status: FULLFØRT (venter verifisering) — Økt X (P24): «X» på panel-nivå + kort på alle admin-faner
Branch `claude/P24-admin-panel-x` (fra `origin/main`@P23 etter fetch).
Cache-bust: `20260622c`. Scope: `v4/style.css`, `v4/app.js`, `v4/index.html`
(cache-bust), `PLAN.md`, `CLAUDE.md`, `DECISIONS.md`. Ingen DB-/edge-/migrasjonsendringer.
**Neste steg:** Live-test av Morfar; deretter egen økt for header-bredde på mobil.

### Bakgrunn
P23 ga Skoleinfo en egen «X» inni fanen + kort-layout. Det ble feil: adminpanelet
har flere faner, så «X» dukket bare opp på Skoleinfo, og bare Skoleinfo hadde kort.
Morfar godkjente forslaget «én X på panel-nivå + kort på alle faner» (illustrert).

### Endringer
- **CSS:** `.settings-page--admin` (bredere spalte, 920px, ingen toppluft til in-page-X)
  og `.fane-lukk` («X» i fane-raden, panel-nivå). `.fane-lukk` lagt i print-skjulliste.
- **`lagSettingsLukk(klass)`** parametrisert: `.settings-close` (Profil) vs `.fane-lukk` (admin).
- **`renderAdminPanel`→`setTab`:** alle faner rendres i felles `.settings-page--admin`.
  Skoleinfo bygger egne kort; de øvrige fanene rendres UENDRET inn i ett felles
  `.settings-card` (ingen intern endring — lav regresjonsrisiko). Panel-«X» lagt
  ytterst i fane-raden, synlig på alle faner.
- **`renderSkoleInfoTab`:** egen `.settings-page` + per-fane-X fjernet (panel-X overtar);
  appender skjemaet (med kortene) direkte til den medsendte settings-page-en.

### Verifisert (kode)
- [x] Adminpanelet har én «X» (panel-nivå) synlig på ALLE faner, ikke bare Skoleinfo
- [x] «X» lukker hele panelet til lærervisning (samme rute som Profil-X)
- [x] Alle admin-faner har kort-ramme (felles `.settings-page--admin`)
- [x] Profil uendret (egen `.settings-close`, fungerer som før)
- [x] Øvrige admin-faner uendret internt (kun innpakket) → all funksjonalitet bevart
- [x] `node --check` OK
- [ ] Live-test (Morfar): visuelt + at lagring/brukeradmin/skolerute-AI fungerer

---

## Status: FULLFØRT — merget til main via PR (#121) — Økt X (P23): Felles settings-mønster (Profil + Skoleinfo)
Branch `claude/P23-felles-settings-monster` (fra `origin/main`@P22 etter fetch).
Cache-bust: `20260622b`. Scope: `v4/style.css`, `v4/app.js`, `v4/index.html`
(cache-bust), `PLAN.md`, `DECISIONS.md`. Ingen DB-/edge-/migrasjonsendringer.
**Neste steg:** Live-test av Morfar; deretter P24 (resten av admin-fanene til
samme mønster) + egen økt for header-bredde på mobil.

### Mål
Etabler ÉTT gjenkjennbart layout-mønster for innstillings-/profilsider, og migrer
**Profil** + admin-fanen **Skoleinfo** til det som referanseimplementasjon. Fundamentet
to senere økter bygger på (P24: resten av admin-fanene; egen økt: header-bredde på mobil).
KUN Profil + Skoleinfo migreres nå — ikke Skoleår/Fag/Klasser/Brukere/Skolerute/Funfacts.

### STEG 1 — Kartlegging (kun lesing, med bevis)

a) **Profil i dag — FINNES.** `renderInnstillingerTab(container)` (app.js:1553) bygger
   `.skjema-smal`-wrap med `<h3>Profil` (1555), kontoinfo-boks `.subj-config-box`
   (navn/e-post/rolle, 1561–1566), seksjon «Passord» (`.seksjon-tittel` + «Bytt passord»-knapp
   → `visSettPassordModal`, 1569–1570), seksjon «E-postadresse» (`<form class="skjema">` med
   e-post-input + «Endre e-post» + bekreftelsestekst, 1573–1597). Rute/slug: `innstillinger`
   under `#/laerer/innstillinger` (router app.js:806 → `renderLaererView`; slug rendres via
   `setTab` app.js:1503). INN: hamburger «Profil» (`ddProfil.onclick` app.js:746 →
   `navigate('#/laerer/innstillinger')`). UT i dag: kun ved å klikke en annen fane / klassevelger.

b) **Skoleinfo i dag — FINNES.** `renderSkoleInfoTab(container)` (app.js:3362), bygd som
   `<form class="skjema skjema-smal">` med onsubmit (lagrer `name`, `school_year_start_week`,
   `school_year_end_week`, `color_theme`, `logo_url`). Felt: Skolenavn m/tegnteller (3389–3395),
   Skoleår «Fra uke/Til uke» m/live dato-hint `ukeHint` (3397–3417), Logo (url + filopplasting,
   3419–3434), Fargetema (radio-gruppe `.theme-group` m/live preview, 3437–3458),
   «Lagre skoleinfo»-knapp m/`overvakSkjema` (3460). Rendres via `renderAdminPanel` →
   `setTab(0)` → `renderSkoleInfoTab` (app.js:3340), rute `#/admin/skoleinfo`.

c) **Lærer-tab-raden — FINNES.** Bygges i `renderLaererView` (app.js:1489 `tabBar`,
   1539–1544 fyllingen): fane 0 = klassevelger (`velgerFane`), så «Alle mine økter», «Søk»,
   `[Klasse-admin]` (kun kontaktlærer/admin). `innstillinger`-slug-en finnes i `tabs`/`tabSlugs`
   (1484) men hoppes over som synlig knapp (1541) — Profil vises altså IKKE som fane.
   MEN tab-raden (`.fane-bar`) RENDRES fortsatt når man står på `innstillinger` (ingen
   fane markert aktiv). `setTab(idx)` (1492) er ett sted hvor `slug` er kjent → her kan
   raden skjules betinget når `slug === 'innstillinger'`, uten å røre de ekte fanene.
   **Vurdert: enkel betinget visning holder** (`tabBar.classList.toggle('skjult', slug==='innstillinger')`)
   — slug-håndteringen er IKKE sammenfiltret. Ingen blokker.

d) **Admin-panelets fane-rad — SEPARAT.** `renderAdminPanel` (app.js:3318) bygger sin EGEN
   `tabBar` (3332) + `setTab` (3335) med fanene Skoleinfo/Skoleår/Fag/Klasser/Brukere/Skolerute/Funfacts
   (3326–3327, 3350–3353). Helt adskilt fra lærer-tab-raden i (c): egen funksjon, egen `tabBar`,
   ingen delt state. Lærer-raden lekker ikke inn (`renderAdminPanel` nuller `APP.klasseVelger`
   og kaller `oppdaterHeader`, 3323–3324). Admin-raden skal stå urørt — kun innholdet i
   Skoleinfo-fanen får ny struktur.

e) **Eksisterende utgang — INGEN dedikert kontroll.** Man forlater Profil/Skoleinfo i dag kun
   ved å klikke en annen fane (lærer-raden / admin-raden) eller via hamburger. Det finnes
   INGEN «lukk/tilbake»-knapp fra før i noen av de to visningene — ny `.settings-close` («X»)
   kolliderer ikke med noe eksisterende.

f) **CSS-gjenbruk — finnes byggeklosser.** `.kort` (style.css:377: `bg-kort`, `--radius`,
   `--skygge`, padding 20px, margin-bottom 16px) er nærmeste eksisterende kort-stil; `.login-kort`
   (910) og `.subj-config-box` (766) er beslektede ramme-bokser. Skjema-felt-stiler `.felt`
   (384–399) og `.skjema .felt` (923) gjenbrukes. `.skjema-smal` (920: `max-width:560px`) er
   dagens smale-skjema-bredde. `.side-wrap` (918: `max-width:1200px; margin:0 auto`) er
   ytre layout-wrap. Globalt `.skjult { display:none!important }` (88). Print-skjulliste:
   style.css:841–845. Konklusjon: bygg `.settings-card` som en spesialisering i `.kort`-ånd
   (samme variabler), ikke et helt nytt fundament — men egne klasser for å unngå å endre
   `.kort`/`.subj-config-box` som brukes mange andre steder.

### STEG 2 — Delplan (faser)

**Fase 0 — Plan til PLAN.md (denne). Commit. Vent på godkjenning.**

- [x] **Fase 1 — CSS-mønster** (`v4/style.css`). Nye klasser:
  - `.settings-page` — sentrert wrapper: `max-width:680px; margin-inline:auto;
    padding: 24px clamp(16px,4vw,28px) 60px; position:relative` (relativ for «X»-ankring).
  - `.settings-card` — `background:var(--bg-kort); border:1px solid var(--kant);
    border-radius:var(--radius); box-shadow:var(--skygge); padding:20px 22px;
    margin-bottom:18px`. Overskrift `.settings-card > h3` (`font-size:1.05rem;
    margin-bottom:14px`); felt-gap arves fra `.felt`/`.skjema .felt`. Primærknapp
    (`.btn-p`) nederst i kortet (eksisterende stil).
  - `.settings-close` — «X» øverst til høyre i `.settings-page`:
    `position:absolute; top:14px; right: clamp(16px,4vw,28px);` runding, min
    treffareal **44×44px** (mobil), `background:var(--bg-kort); border:1px solid var(--kant)`,
    `font-size:1.3rem; line-height:1; cursor:pointer`. `aria-label="Lukk"`. Synlig fokus-ring
    (`:focus-visible { outline / box-shadow }`). Hover-tilstand.
  - Print: legg `.settings-close` i eksisterende print-skjulliste (style.css:841–845).
  - Mobil (`@media max-width:700px`): `.settings-page { padding-left/right ~16px }`,
    «X» innen rekkevidde (top/right ~12–14px), kort full bredde.

- [x] **Fase 2 — «X»-utgang med fast rute** (hjelpefunksjon i `v4/app.js`).
  Liten helper `lagSettingsLukk()` som returnerer en `.settings-close`-knapp hvis onclick
  ALLTID navigerer til lærervisning via fast rute:
  `navigate('#/laerer/' + (APP.laererCtx?.tab || 'klasse'))` om ctx finnes, ellers `#/laerer`.
  ALDRI `history.back()`. Ingen bekreftelsesdialog ved ulagrede felt (bevisst — feltene krever
  eksplisitt lagre-trykk). Dokumenteres i DECISIONS.md (Fase 6).

- [x] **Fase 3 — Migrer Profil** (`renderInnstillingerTab`, app.js:1553). Bygg om til
  `.settings-page > .settings-card`-struktur: **Profil** (navn/e-post/rolle), **Passord**
  («Bytt passord»-knapp), **E-post** (form + bekreftelsestekst) blir hvert sitt kort. «X» øverst
  (`lagSettingsLukk`). ALL funksjonalitet uendret: `visSettPassordModal`, `byttEpost`,
  `medLagreOverlay`, bekreftelsestekst, feilhåndtering — kun layout/markup endres.

- [x] **Fase 4 — Skjul lærer-tab-raden på Profil** (`renderLaererView` → `setTab`, app.js:1492).
  `tabBar.classList.toggle('skjult', slug === 'innstillinger')`. De ekte fanene
  (Klasse/Alle mine økter/Søk/Klasse-admin) uendret for sine visninger. Påvirker IKKE
  admin-panelets egen fane-rad (egen funksjon, (d)). Verifiseres.

- [x] **Fase 5 — Migrer Skoleinfo** (`renderSkoleInfoTab`, app.js:3362). Bygg om til samme
  `.settings-page/.settings-card`-mønster: Skolenavn / Skoleår / Logo / Fargetema som kort
  (kan grupperes fornuftig), «X»-utgang (`lagSettingsLukk`). Admin-panelets egen fane-rad
  blir stående — kun innholdet får ny struktur. Funksjonalitet uendret: lagre skoleinfo,
  fra/til-uke live dato-hint, fargetema-radio m/live preview, logo-opplasting, `overvakSkjema`.

- [x] **Fase 6 — Avslutning.** Bump `?v=20260622b` i `v4/index.html` (CSS + JS).
  Kryss av i PLAN.md, oppdater «Neste steg». Dokumentér i CLAUDE.md (settings-mønsteret som
  permanent UI-mønster) + DECISIONS.md (X-utgang med fast rute; felles settings-mønster).
  Commit per fase. Norsk, ikke-teknisk oppsummering til slutt.

### Flagg / risiko
- Lav–middels kompleksitet. Tab-rad-skjuling = én betinget linje i `setTab` (ikke
  sammenfiltret, jf. (c)) → ingen blokker forventet.
- Strengt scope: KUN Profil + Skoleinfo. Skoleår/Fag/Klasser/Brukere/Skolerute/Funfacts
  migreres i P24. Flagges om noe frister utenfor.
- `.settings-card`/`.settings-page` er NYE klasser (rører ikke `.kort`/`.subj-config-box`
  som brukes mange andre steder).

### Sjekkliste (kode-verifisert; live-test gjenstår for Morfar)
- [x] Profil og Skoleinfo bruker identisk `.settings-page/.settings-card`-mønster (samme bredde, kort, luft)
- [x] «X» lukker til lærervisning fra begge sider — også etter hard refresh (fast rute, aldri `history.back()`)
- [x] Lærer-tab-raden vises ikke lenger på Profil (`setTab` toggler `.skjult` ved slug `innstillinger`)
- [x] Admin-panelets egen fane-rad er uendret og fungerer (egen funksjon, ikke rørt)
- [x] All funksjonalitet uendret: bytt passord, endre e-post, lagre skoleinfo, fra/til-uke datovisning, fargetema
- [x] Desktop: innhold sentrert i fast spalte; Mobil: full bredde med sidemarg, «X» innen rekkevidde (44×44px)
- [x] Hard refresh henger ikke på «Laster…» (renderLaererView/renderAdminPanel sjekker profile+school som før)

---

## Status: FULLFØRT — merget til main via PR — Økt X (P22): «Alle mine økter» husker scroll-posisjon mellom fanebytter
Cache-bust: `20260622a`. Branch `claude/determined-pascal-l4kr7z` (mandatert dev-branch;
bygger på `origin/main`@P21). Delplanen ble godkjent, bygget og merget til main.

### Mål
I «Alle mine økter» (`renderAlleOkterTab`): FØRSTE åpning i en app-sesjon → dagens uke
(uendret «Nå»-logikk). SENERE åpninger (retur fra Klasse/Søk) → der brukeren slapp, ikke
tilbake til dagens uke. «Nå»-knappen er fortsatt veien til dagens uke.

### STEG 1 — Kartlegging (kun lesing, med bevis)
a) **Auto-scroll til dagens uke — FINNES.** `renderAlleOkterTab(container, autoScroll=true)`
   (app.js:1890). `naaWeek = gjeldendeSkoleuke` (app.js:1960); nå-overskrift fanges
   `if (week === naaWeek) naaHeader = weekHeader` (app.js:2051); `anker = naaHeader`
   m/fallback (app.js:2134–2139); scroll `if (autoScroll) … anker.scrollIntoView` (app.js:2156).
   `setTab` kaller `renderAlleOkterTab(tabContent)` uten arg (app.js:1500) → `autoScroll=true`
   ved HVER fane-åpning. Intern `reRender` bruker `false` (app.js:1961).
b) **Bærer for «hvor var jeg» — FINNES DELVIS.** `APP.laererCtx` (P21, app.js:33) er rett
   *mønster* (in-memory, nullstilles ved refresh), men `.week` eies av Klasse-fanen
   (`renderUke` app.js:1694) — gjenbruk ville kollidere. Presedens for funksjons-statisk
   state finnes: `renderAlleOkterTab._obs` (app.js:2162).
c) **Skille første/retur — FINNES IKKE.** Ingen flagg; må innføres.
d) **Vindusnivå-scroll; uke-overskrift mer robust enn scrollY.** Sticky header/fane
   (`stickyTop = headerH + faneH`, app.js:2153–2160), `scrollIntoView` mot uke-ankre
   `.min-plan-uke[data-uke]`. Husk uke-nummer, ikke rå scrollY (innholdshøyde varierer).

### STEG 2 — Delplan
- Ny funksjons-statisk `renderAlleOkterTab._lastTopWeek` (som `_obs`; `undefined` ved start
  → nullstilles ved refresh). Holder `laererCtx` ren.
- Ved åpning: `_lastTopWeek` satt og uka finnes → scroll dit (retur); ellers dagens `anker`.
- `anker` (= naaHeader/nærmeste) UENDRET som mål for «Nå»-knapp + synlighets-observer
  (P15/P16). Egen `scrollMaal` brukes KUN til initial auto-scroll.
- Scroll-spy: egen IntersectionObserver `_spyObs` over alle `.min-plan-uke` med ~1px
  trip-line ved sticky-toppen → `_lastTopWeek = data-uke`. Observer (ikke window-listener)
  fordi den ikke fyrer på tvers av faner og følger `_obs`-opprydning (disconnect øverst).
- reRender (`autoScroll=false`) → ingen scroll, blir stående; `_lastTopWeek` røres ikke.
- Berører ikke P12 (kun leser høyde), P15/P16 (anker/knapp/observer uendret), P21 (`laererCtx` urørt).

**Faser:**
- [x] Fase 0 — Plan til PLAN.md (denne).
- [x] Fase 1 — `renderAlleOkterTab`: `_lastTopWeek`-minne, `scrollMaal` ved åpning,
  scroll-spy `_spyObs` + opprydning. Cache-bust `20260622a`.
- [x] Fase 2 — Commit per delsteg, kryss av, oppsummering.

**Flagg / risiko:**
- Lav kompleksitet, kun `v4/app.js` + cache-bump + PLAN.md. Ingen DB/edge/CSS/migrasjoner.
- Trip-line-`rootMargin` fryses ved render; resize gir lite avvik, men verdien konsumeres
  kun ved retur og vi re-rendrer ved hver fane-åpning → ufarlig. Fallback ved behov:
  throttlet window-scroll-listener (fyrer på tvers av faner → ikke førstevalg).

### Sjekkliste (kode-verifisert; live-test gjenstår for Morfar)
- [x] Første åpning av «Alle mine økter» → dagens uke
- [x] Bla til annen uke → bytt til Søk → tilbake → du er der du slapp (ikke kastet til dagens uke)
- [x] «Nå»-knappen tar deg fortsatt til dagens uke
- [x] Hard refresh → faller tilbake til dagens uke (in-memory nullstilt) uten å henge på «Laster…»
- [x] Mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt X (P21): Bevar klasse + uke (+ fane) ved toggling
Cache-bust: `20260621f`. Branch `claude/intelligent-tesla-6lfogx` (mandatert dev-branch;
bygger på `origin/main`@P20). Delplanen ble godkjent og bygget fase 0–4.

### STEG 1 — Kartlegging (kun lesing, med bevis)

a) **«Gjeldende klasse» i lærervisning — FINNES DELVIS.**
   `renderLaererView` (app.js:1447) setter `let aktivKlasse = mineKlasser[0] || andreKlasser[0]`
   — lokal variabel, defaulter ALLTID til første klasse (sortert), ingen persistens.
   Mens man står på Klasse-fanen eksponeres den via
   `APP.klasseVelger = { aktivKlasse, setKlasse }` (app.js:1608), men `klasseVelger`
   nulles så snart man bytter fane (app.js:1467) eller forlater lærervisning
   (`renderElevView` app.js:922, `renderAdminPanel` app.js:3251). Ingen varig
   «valgt klasse»-state mellom re-renders.

b) **«Gjeldende uke» / skoleår i Klasse-visningen — FINNES IKKE (ikke persistert).**
   `renderMinKlasseTab` (app.js:1581) setter `let currentWeek = gjeldendeSkoleuke(...)`
   — lokal closure-variabel. Endres av ← Forrige/Neste →/uke-input/«Nå» via `renderUke`,
   men lagres aldri utenfor closuren. `valgtSkolear` (app.js:1586) er også lokal.
   Helper `gjeldendeSkoleuke(schoolStart, schoolEnd)` (app.js:142) finnes og gir
   «nå»-uka, men det finnes INGEN state for «valgt uke».

c) **`toggleAdminModus()` — FINNES, og forklarer hoppet.**
   app.js:468 oppdaterer `is_admin_active` i DB + `APP.isAdminActive`, kaller
   `oppdaterHeader()` og deretter `router()` (app.js:476). Den navigerer IKKE
   (P10 intakt — samme hash beholdes). MEN `router()` (app.js:787) kjører
   `renderLaererView()` på nytt, som re-oppretter alt fra bunnen: `aktivKlasse`
   resettes til `mineKlasser[0]` (= første sorterte klasse, derfor 1D før 1E) og
   `currentWeek` resettes til `gjeldendeSkoleuke`. Derav hoppet til annen klasse/uke.
   NB: **fanen bevares allerede** via hash (`history.replaceState … #/laerer/<slug>`
   app.js:1464 → `initTab` app.js:1457). Kun klasse + uke går tapt ved admin-toggle.

d) **Elevvisning-toggelen — FINNES, men tar ikke imot klasse/uke.**
   `oppdaterHeader` (app.js:709) setter `laererBtn.onclick = () =>
   navigate(erILaerer ? '#/' : '#/laerer')`. Fra lærer → `#/` = velkomstside
   (klasseliste), altså IKKE lærerens klasse. Elevruten `#/klasse/:navn`
   (router app.js:801 → `renderElevView(klasseNavn)` app.js:915) kan ta imot KLASSE
   via hash, men `currentWeek` (app.js:972) settes alltid til `gjeldendeSkoleuke` —
   ingen uke-parameter. Retur → `#/laerer` resetter alt (jf. c).

e) **«Hvor var jeg»-state — FINNES IKKE.**
   `APP` har `currentView`, `currentKlasse` (kun elev), `klasseVelger` (kun mens man
   står på Klasse-fanen, nulles ellers), `isAdminActive`, `renderToken`. Ingen samlet
   bærer av klasse + uke + skoleår + fane mellom visninger.

### STEG 2 — Delplan (enkleste robuste mekanisme)

**Idé:** Innfør ÉN in-memory kontekst-bærer `APP.laererCtx = { klasseId, klasseNavn,
week, skolear, tab }` som lever gjennom hele sesjonen (ikke localStorage — toggling
er sesjonsintern, og elevlenker skal forbli rene `#/klasse/:navn` uten ukenummer).

- **Skriving (lærervisning oppdaterer ctx):**
  - `renderLaererView`: ved init, skriv `tab` (fra hash). Ved klassebytte (select
    `change`, app.js:1496) skriv `klasseId/klasseNavn`. Ved fanebytte (`setTab`,
    app.js:1462) skriv `tab`.
  - `renderMinKlasseTab`: i `renderUke` skriv `week = currentWeek`; ved
    skoleår-bytte (aarSel `change`, app.js:1625) og `setKlasse` (app.js:1608) skriv
    `skolear`/`klasse`. (Init-skriving av klasse skjer her også.)
- **Lesing (seed ved re-render):**
  - `renderLaererView`: seed `aktivKlasse` fra `APP.laererCtx.klasseId` (finn i
    mine/andre-listene; fallback til dagens default hvis borte/slettet).
  - `renderMinKlasseTab`: seed `currentWeek` fra `APP.laererCtx.week ?? gjeldendeSkoleuke`
    og `valgtSkolear` fra `APP.laererCtx.skolear ?? aktivtSkolear`.
- **Admin-toggle (krav 1):** uendret `toggleAdminModus` (P10 intakt) — fordi
  re-render nå seeder fra ctx, bevares klasse + uke automatisk. Fanen bevares som i dag.
- **Elevvisning fra lærer (krav 2):** endre `laererBtn.onclick`: når `erILaerer`, naviger
  til `#/klasse/<APP.laererCtx.klasseNavn>` (fallback `#/` hvis ingen klasse) og sett
  transient `APP.elevPeekWeek = APP.laererCtx.week`. `renderElevView` leser
  `APP.elevPeekWeek` ÉN gang (nulles straks) for å sette `currentWeek`; ellers
  `gjeldendeSkoleuke`. Elever som åpner `#/klasse/X` direkte påvirkes ikke
  (elevPeekWeek er da undefined).
- **Retur til lærer (krav 3):** når `!erILaerer`, naviger til
  `#/laerer/<APP.laererCtx.tab || 'klasse'>` → fane gjenopprettes via hash, klasse via
  ctx-seed, uke via ctx-seed.
- **«Nå»-knapp (krav 4):** uendret. `naaWeek = gjeldendeSkoleuke` (app.js:1691) og
  elev-«Nå» beregnes uavhengig; vi seeder kun INITIELL uke. Klikk på «Nå» skriver
  naaWeek til ctx via `renderUke` — konsistent.

### STEG 1-tillegg — Hvorfor «Elevvisning» skjules i admin-modus
Asymmetriske synlighetsbetingelser i `oppdaterHeader`:
- `laererBtn` (Elevvisning/Lærervisning): `skjulLaerer = harAdminTilgang() && APP.isAdminActive`
  (app.js:702) → `classList.toggle('skjult', skjulLaerer)` (app.js:706). **Skjules** når
  admin-modus er på.
- `adminToggle` (Admin): `visAdmin = harAdminTilgang()` (app.js:701) → vises alltid
  (app.js:713–714), modus-uavhengig.

### STEG 2-tillegg — Delplan (symmetrisk synlighet)
- Erstatt app.js:706 med `laererBtn.classList.remove('skjult')` og fjern overflødig
  `skjulLaerer` (app.js:702). `adminToggle` uendret.
- Resultat: innlogget admin ser begge knappene i alle moduser; vanlig lærer ser kun
  elev/lærer-toggelen; utlogget ser ingen (uendret `else`-gren).

**Faser:**
- [x] Fase 0 — Symmetrisk synlighet: `laererBtn` alltid synlig for innlogget bruker
  (fjern `skjulLaerer`).
- [x] Fase 1 — Innfør `APP.laererCtx` (init i `APP`-objektet) + skriv/les i
  `renderLaererView` (klasse-seed, select/setTab-skriving).
- [x] Fase 2 — `renderMinKlasseTab`: seed uke + skoleår fra ctx; skriv uke/skoleår/klasse.
- [x] Fase 3 — Elev-toggle: `laererBtn.onclick` (klasse+uke ut), `renderElevView`
  konsumerer `APP.elevPeekWeek`; retur til `#/laerer/<tab>`.
- [x] Fase 4 — Cache-bust (`20260621f`), oppdater APP-doc i CLAUDE.md, commit per fase, oppsummering.

**Flagg / risiko:**
- Lav kompleksitet, kun `v4/app.js` + cache-bump + doc. Ingen DB/edge/CSS/migrasjoner.
- Branch-merknad: oppgaven foreslo `claude/PN-bevar-kontekst-ved-toggle`, men
  systemets «Git Development Branch Requirements» mandaterer `claude/intelligent-tesla-6lfogx`
  — jeg blir på den (ingen push til annen branch uten eksplisitt tillatelse).
- `origin/main` har en urelatert historie (91 commits, ingen P9–P20); P-arbeidet
  ligger kun på `claude/intelligent-tesla-6lfogx` (127 commits). Bygger derfor videre der.

### Sjekkliste (verifiseres etter bygging)
- [ ] Admin-toggle bevarer klasse + uke (ingen hopp til annen klasse/uke)
- [ ] Elevvisning fra lærer viser samme klasse + uke
- [ ] Retur til lærervisning lander på samme klasse + uke + fane
- [ ] Admin-toggelen navigerer fortsatt ikke til admin-panelet (P10 intakt)
- [ ] Hard refresh henger ikke på «Laster…»
- [ ] «Admin» og «Elevvisning» er begge synlige samtidig, i alle moduser
- [ ] Ingen av de to knappene skjules når den andre aktiveres

---


## Status: FULLFØRT (venter verifisering) — Økt X (P20): Skolerute-merke — ny rekkefølge + ikoner for alle fridagstyper
Cache-bust: `20260621e`. Branch `claude/P20-skolerute-merke-format` (fra `origin/main`, har P9–P19) pushet.
Bruker presiserte: 1. mai er høytidsdag (ikke helligdag) som 17. mai — håndteres ved
navne-match (1. mai→✊, 17. mai→🇳🇴), uavhengig av DB-type. Symbolvalg godkjent.

## Økt X (P20): Skolerute-merke — dag/dato først, navne-matchede ikoner for alle typer

**Scope:** `v4/app.js` (kun `lagFridagMerke` i `renderAlleOkterTab`),
`v4/index.html` (cache-bust), `PLAN.md`. Ingen DB-/edge-/CSS-endringer
(eksisterende `.mp-fridag-dag`/`.mp-fridag-dato`-stil gjenbrukes uendret).

### Funn (kun lesing)
- `lagFridagMerke(fe, week)` (app.js:1924) bygger i dag merket som
  `${ikon} ${title} · ${type} · ` + `<span.mp-fridag-dag>` + `<span.mp-fridag-dato>`
  → ikon/tittel FØRST, dag/dato sist. Ikon: kun høstferie 🍂 / vinterferie ❄️ på
  navn, ellers type-ikon (`ferie 🏖️ · helligdag 🎉 · planleggingsdag 📝`, fallback 🗓️).
- Brukes tre steder (rene ferieuker, desktop-rad, mobil-kort) — én funksjon, så
  endringen treffer alle tre.
- **Faktiske titler i `school_calendar` 25/26** (verifisert i seed-migrasjon 013):
  `Planleggingsdager (skolestart)` [planleggingsdag], `Høstferie` [ferie],
  `Juleferie` [helligdag], `Vinterferie` [ferie], `Påskeferie` [helligdag],
  `Offentlig høytidsdag (1. mai)` [helligdag], `Kristi himmelfartsdag` [helligdag],
  `Planleggingsdag` [planleggingsdag], `2. pinsedag` [helligdag].
  → NB: `Juleferie`/`Påskeferie` er lagret som type **helligdag**, så ikon må
  matches på **navn** (ikke type). Ingen `17. mai`/`Sommerferie`/`Nyttårsdag` i
  dagens data, men matchere bygges likevel (robust for andre skoler/år).

### JUSTERING 1 — Rekkefølge
- Bytt barne-rekkefølgen i `el('div',{class:'min-plan-fridag'}, …)` til:
  `<span.mp-fridag-dag>` → `<span.mp-fridag-dato>` → `` ` ${ikon} ${title} · ${type}` ``.
  Linja starter da med dag/dato til venstre, likt øktene. Samme spans/klasser/styling
  som i dag — kun rekkefølgen endres.

### JUSTERING 2 — Navne-matchede ikoner (match på lowercase `title`, ordnet)
Ferier (navn): `juleferie`→🎄 · `påskeferie`→🐣 · `sommerferie`→☀️ · `høstferie`→🍂 · `vinterferie`→❄️
Helligdager (navn): `17. mai`/`grunnlovsdag`→🇳🇴 · `1. mai`→✊ · `juledag`/`jul`→🎄 ·
`langfredag`/`skjærtorsdag`/`påske`→✝️ · `pinse`→🕊️ · `himmelfart`→☁️ · `nyttår`→🎆
Øvrig: type `planleggingsdag`→📋 · nøytralt fallback for alt annet →🗓️
- Rekkefølge er viktig: `-ferie`-navnene sjekkes FØR de generiske `jul`/`påske`-navnene
  (så `påskeferie`→🐣, ikke ✝️; `juleferie`→🎄 likt). Implementeres som ordnet liste
  `[ [substring, emoji], … ]` + type-fallback.

### Emoji-flagg
- 🇳🇴 (regional-indikator-par): på eldre Windows kan det vises som «NO» i stedet for
  flagg. Universelt på Apple/Android/moderne Windows. Foreslått alternativ ved behov:
  behold 🇳🇴 (gjeldende data har uansett ingen 17. mai-rad), ev. 🎌. Flagget for innsyn.
- Øvrige (🎄🐣☀️🍂❄️✊✝️🕊️☁️🎆📋🗓️) er enkle, bredt støttede enkelt-emoji — ingen kjente problemer.

### Delplan (faser)
- [x] **Fase 1 — `lagFridagMerke`:** ny ikon-resolver (ordnet navne-liste + type-fallback)
  + ny barne-rekkefølge (dag/dato først). Behold dag/dato-utregning og spans uendret.
- [x] **Fase 2 — Cache-bust (`20260621e`), commit, kryss av, oppsummering.**

### Verifiser
- [ ] Merket starter med dag/dato, deretter ikon + tittel + type
- [ ] Formatering ellers uendret fra P19 (samme spans/styling)
- [ ] Juleferie 🎄, Påskeferie 🐣, Sommerferie ☀️, Høstferie 🍂, Vinterferie ❄️
- [ ] Helligdager: 1. mai ✊, Kristi himmelfartsdag ☁️, 2. pinsedag 🕊️, (17. mai 🇳🇴)
- [ ] Planleggingsdag 📋; ukjent navn/type → 🗓️
- [ ] Ingen sesong-feil ikoner; mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt X (P19): Skolerute i «Alle mine økter» — finpuss
Cache-bust: `20260621d`. Branch `claude/P19-skolerute-finpuss` pushet.

---

## Økt X (P19): Skolerute i «Alle mine økter» — dag-merking, kronologisk innsortering, ikoner

**Scope:** `v4/app.js` (`renderAlleOkterTab`), `v4/style.css` (liten støttetekst-stil),
`v4/index.html` (cache-bust), `PLAN.md`. Ingen DB-/edge-endringer.

### Funn (kun lesing)
- P18 lagrer `eventsByWeek[w] = [ev]` og rendrer alle fridager som `.min-plan-fridag`
  samlet rett under uke-overskriften, merket med dato (`formatDatoNO(start)–slutt`).
- Øktene merkes med dag først + diskret dato (`Ons 3.6.` via `.mp-dag`). Fridagene
  bør følge samme mønster.
- `getDay()` gir Man=1…Fre=5 (= `day_of_week`), så dag-utregning er rett frem.

### Delplan (faser)
- [x] **Fase 1 — Dag-data per uke (JUST. 1).** Endre uke-mappingen så hver hendelse
  lagres med dagene den dekker i HVER uke: `eventsByWeek[w].push({ ev, dagFra, dagTil })`
  (min/maks ukedag man–fre i den uka). Flerukers ferie får riktig dag-spenn per uke.
- [x] **Fase 2 — `lagFridagMerke(fe, week)` (JUST. 1 + 3).** Bygger merket med dag
  primært (`Man–Fre` / `Ons`) og diskret klamret dato som støtte. Ikon: match på
  navn — `høstferie → 🍂`, `vinterferie → ❄️`, ellers uendret type-ikon
  (`ferie 🏖️ · helligdag 🎉 · planleggingsdag 📝`). Tekst: `ikon Tittel · type · DAG dato`.
- [x] **Fase 3 — Kronologisk innsortering (JUST. 2).** I uker MED økter: bygg én liste
  av økter (`dag = day_of_week`) + fridager (`dag = dagFra`), sorter på dag (ties:
  fridag før økt, så fag-navn). Render i den rekkefølgen i BÅDE desktop-rad-lista og
  mobil-kortlista. Rene ferieuker uten økter: behold P18 (merke rett under overskrift).
- [x] **Fase 4 — CSS.** `.mp-fridag-dato` diskret (dempet/lettere), `.mp-fridag-dag`
  litt uthevet. `.min-plan-fridag` ellers uendret.
- [x] **Fase 5 — Avslutning.** Cache-bust (`20260621d`), commit per delsteg, kryss av,
  oppsummering, PR + merge.

### Verifiser før merge
- [ ] Fridag merkes med dag (énkeltdag «Ons», flerdagers «Man–Ons»), dato kun støtte
- [ ] Fridag sorteres inn på riktig dag blant øktene, ikke samlet øverst
- [ ] Høstferie 🍂, vinterferie ❄️; øvrige ikoner uendret
- [ ] Rene ferieuker uten økter får fortsatt egen overskrift + merke
- [ ] Flerukers ferie (jul/påske) vises i hver uke (med riktig dag-spenn per uke)
- [ ] Mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt X (P18): Skolerute i «Alle mine økter»
Cache-bust: `20260621c`. Branch `claude/P18-skolerute-i-alle-okter` pushet.

---

## Økt X (P18): Vis skoleruten (ferie/høytid/planleggingsdag) i «Alle mine økter»

**Scope:** `v4/app.js` (`renderAlleOkterTab`), `v4/style.css` (skolerute-merke),
`v4/index.html` (cache-bust), `PLAN.md` + `CLAUDE.md`. Ingen DB-/edge-endringer.

### Funn (kun lesing)
- `renderAlleOkterTab` (app.js ~1848) grupperer kun lærerens egne `sessions` per uke
  (`<h3>Uke X</h3>` + rader). Den henter IKKE `school_calendar`.
- «Min klasse»-ukevisningen (`renderUke`) henter derimot skoleruten og merker
  fridager — derfor mangelen kun i «Alle mine økter».
- Hjelpere finnes: `getISOWeek`, `ukeTekst`, `kalenderTypeNavn` (helligdag→«høytid»),
  `formatDatoNO`, `ukePosisjon`, `skoleaarIntervall`.

### Avklart med bruker (GODKJENT)
- Visning: **«Alle mine økter»**.
- **Ferieuker uten økter skal også vises** (egen uke-overskrift med ferie-merke).

### Delplan (faser)
- [x] **Fase 1 — Datahenting.** Parallelt med `sessions`: hent `school_calendar`
  for aktivt skoleår (`school_id`, `deleted_at is null`, innenfor `skoleaarIntervall`,
  typer `ferie/helligdag/planleggingsdag`).
- [x] **Fase 2 — Map hendelse → uke + union av uker.** For hver hendelse: samle
  ISO-uker den dekker (iterer ukedager man–fre fra start til slutt → `getISOWeek`),
  filtrer til skoleårets uke-vindu (`ukePosisjon ≤ sluttPos`). Bygg `eventsByWeek`.
  Vis-uker = union av økt-uker ∪ skolerute-uker, sortert i skoleår-rekkefølge
  (33→52→1→24). Juleferie (uke 52→1) havner korrekt i begge uker.
- [x] **Fase 3 — Render.** Under hver uke-overskrift: skolerute-linje(r) (ikon +
  tittel + type via `kalenderTypeNavn` + `ukeTekst` + dato). Guard for uker uten
  økter (ingen tabell/kort, bare overskrift + ferie-merke). «Nå»-anker, bulk og
  observer beholdes uendret. Linja vises i både desktop og mobil.
- [x] **Fase 4 — CSS.** `.min-plan-fridag`-merke (bruker `--fridag-bg`/`--fridag-tekst`).
- [x] **Fase 5 — Avslutning.** Oppdater `PLAN.md` + `CLAUDE.md`, cache-bust
  (`20260621c`), commit per delsteg, PR + merge.

### Verifiser før merge
- [ ] Ferieuke uten økter vises med egen uke-overskrift + ferie-merke
- [ ] Uker med økter viser skolerute-linje når uka har en hendelse
- [ ] Juleferie (spenner uke 52→1) vises i begge uker
- [ ] «Høytid» vises for `helligdag` (ikke databaseverdien)
- [ ] Mobil viser samme skolerute-linje (vertikal liste ellers uendret)
- [ ] «Nå»-knapp og bulk-redigering uendret

---

## Status: FULLFØRT (venter verifisering) — Økt X (P17): «Alle mine økter» — tett pakking (rad-basert)
Cache-bust: `20260621b`. Branch `claude/P17-tabell-tett-pakking` pushet.

---

## Økt X (P17): «Alle mine økter» — fjern dødt mellomrom mellom kolonnene

**Scope:** `v4/app.js` (desktop-markup i `renderAlleOkterTab`), `v4/style.css`
(`.min-plan-tabell`-reglene) + `v4/index.html` (cache-bust). Ingen DB-/edge-endringer.

### Funn + valgt tilnærming
- Dagens desktop-visning er en ekte `<table>` (`table-layout: auto` + faste
  prosentbredder `mp-akt 30%`, `mp-info 30%`, `mp-opp 15%`). En tabell tvinger
  FELLES kolonnebredder: hver kolonne blir like bred som det bredeste innholdet på
  tvers av ALLE rader → korte rader får tomrom.
- **Bruker valgte «Hver rad pakkes for seg»** (godkjent): hver økt skal hugge sitt
  eget innhold, kolonnene står IKKE nødvendigvis rett under hverandre fra rad til rad.
  Dette kan ikke gjøres med en `<table>` → bytter desktop til **rad-basert flex**.

### Delplan (faser)
- [x] **Fase 1 — app.js: desktop fra `<table>` til flex-rader.**
  Bytt `<table>/<thead>/<tbody>/<tr>/<td>` til `div.min-plan-tabell` (flex-kolonne)
  med én `div.min-plan-rad` (flex) per økt. Dropp kolonnehodet (gir ikke mening når
  kolonnene ikke er justert). Tomme felt (P/G, Aktivitet, Oppmøte) utelates per rad
  → tett pakking. Oppmøte får `📍`-prefiks (som mobilkortet) for å skille det fra
  Info. Kebab bor i Info-cellen. Mobil-kortlista uendret.
- [x] **Fase 2 — style.css: flex-regler.**
  - `.min-plan-tabell`: `display:flex; flex-direction:column`.
  - `.min-plan-rad`: `display:flex; align-items:flex-start`, hover-stil, ordgrense
    (`word-break:normal; overflow-wrap:break-word`) + `min-width:0` på barn (bryting
    aldri tegn-for-tegn).
  - `mp-cb` (~22px), `mp-klasse` (88→74px), `mp-fag` (92→78px): faste, litt smalere,
    `flex:0 0 auto`.
  - `mp-pg`, `mp-akt`, `mp-opp`: `flex:0 1 auto` → hugger innhold.
  - `mp-info`: `flex:1 1 auto` → sluker slakken til høyre.
  - Diskret `border-left` + `padding-left` som skille foran hver flytende kolonne.
  - Fjern gamle `td/th/tr/%`-regler. Mobil-`display:none` beholdes.
- [x] **Fase 3 — Cache-bust (`20260621b`), commit per delsteg, kryss av, oppsummering.**

### Verifiser før merge
- [ ] Ingen store tomromsfelt mellom Aktivitet→Oppmøte→Info (hver rad tett)
- [ ] Klasse og Fag litt smalere enn før, fortsatt faste
- [ ] Aktivitet/Oppmøte/P-G krymper til innhold
- [ ] Tekst bryter fortsatt på ordgrense (ikke tegn-for-tegn)
- [ ] Diskret skille beholdt
- [ ] Mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt X (P16): «Nå»-knapp må vises i begge scroll-retninger
Cache-bust: `20260621a`. Branch `claude/P16-naa-knapp-vises-begge-retninger` pushet.

---

## Økt X (P16): «Nå»-knapp dukket aldri opp (observer kun én retning)

**Scope:** `v4/app.js` (kun observer-callback i `renderAlleOkterTab`),
`v4/index.html` (cache-bust). Ingen CSS-/DB-/edge.

### Rotårsak
Observeren viste knappen kun når «nå»-uka var skjøvet OPP forbi fanerad-en
(`boundingClientRect.top < stickyTop`). I sommer er «nå»-uka (uke 24) den
SISTE/nederste uka i lista; når man blar oppover for å se tidligere uker, havner
uke 24 UNDER skjermen, og betingelsen slo aldri til → knappen dukket aldri opp.
P15 gjorde dette synlig fordi `gjeldendeSkoleuke` peker på uke 24 (som finnes i
lista), mens P14 falt tilbake til første uke (toppen).

### Fiks
- Vis «Nå» når nå-uka IKKE er synlig, uansett retning: `display = e.isIntersecting
  ? 'none' : 'block'` (beholdt `rootMargin: -stickyTop` så fanerad-en teller som
  skjult). Dekker både opp (framtid) og ned (tidligere uker / sommer).

### Verifiser før merge
- [ ] «Nå» dukker opp når man blar bort fra nå-uka (både opp og ned)
- [ ] Klikk på «Nå» scroller til nå-uka
- [ ] Sommer (uke ~25, nå-uke = siste uke): knappen vises når man blar oppover
- [ ] Mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt X (P15): «Nå»-knapp i «Alle mine økter» (gjenbruk Klasse-logikk)
Cache-bust: `20260620j`. Branch `claude/P15-naa-knapp-alle-okter` pushet. Bruker valgte «Fiks begge».

---

## Økt X (P15): «Alle mine økter» — «Denne uka»/«Til toppen» → «Nå» (som Klasse-visningen)

**Scope (foreslått):** `v4/app.js`, `v4/index.html` (cache-bust). Ingen CSS-/DB-/edge.

### Funn — «Nå»-knappen i Klasse-visningen (kun lesing)
- Klasse-visning (`renderMinKlasseTab`, app.js:1683) og elev-visning
  (`renderElevView`, app.js:1108) har en «Nå»-knapp:
  `naaWeek = Math.min(Math.max(getCurrentISOWeek(), schoolStart), schoolEnd)`,
  knappen setter `currentWeek = naaWeek` og re-rendrer den uka. Tittel «Gå til
  gjeldende uke». Deaktiveres når man allerede står på `naaWeek`.

### ⚠️ FLAGG — «Nå»-knappen er feil for skoleår som krysser nyttår
- Med Øksnevad sine verdier (`school_year_start_week = 33`, `school_year_end_week = 24`)
  blir `Math.min(Math.max(w, 33), 24)` **= 24 for ALLE uker** (fordi `max(w,33) ≥ 33 > 24`,
  så `min(…,24) = 24`). Samme gjelder init-klampen `if (currentWeek > schoolEnd)
  currentWeek = schoolEnd`.
- Konsekvens: Klasse-/elev-visningens «Nå» går ALLTID til uke 24, ikke til faktisk
  inneværende uke. Det ser riktig ut NÅ (sommer, uke 25 → 24 er nærmeste fornuftige),
  men i høstsemesteret (f.eks. uke 40) ville «Nå» feilaktig hoppe til uke 24.
- Den naive tallklampen håndterer ikke årsskiftet; det krever posisjonslogikk
  (`ukePosisjon`). Verifisert med tallgjennomgang (alle uker → 24).

### Beslutning trengs (se spørsmål til bruker)
Å «gjenbruke Klasse-logikken» bokstavelig ville gi en «Nå»-knapp som alltid sikter
mot uke 24 — i strid med kravet «ta brukeren tilbake til dagens dato … også utenfor
skoleåret». Derfor foreslås en KORRIGERT felles helper:

```js
// Inneværende uke klemt inn i skoleåret, korrekt over årsskiftet.
function gjeldendeSkoleuke(schoolStart, schoolEnd) {
  const w = getCurrentISOWeek()
  const pos = ukePosisjon(w, schoolStart)
  const sluttPos = ukePosisjon(schoolEnd, schoolStart)
  if (pos <= sluttPos) return w                 // i skoleåret → faktisk uke
  // i sommergapet (etter slutt, før start) → nærmeste ende
  return (pos - sluttPos) <= (52 - pos) ? schoolEnd : schoolStart
}
```

### Delplan (faser) — avhenger av valgt omfang
- [x] **Fase 1 — Felles helper `gjeldendeSkoleuke()`** (korrekt over årsskiftet).
- [x] **Fase 2 — «Alle mine økter»:** bytt «Denne uka»/«Til toppen» til én «Nå»-knapp.
  Anker = overskrift for `gjeldendeSkoleuke(...)` hvis den finnes blant lærerens
  uker; ellers nærmeste uke etter posisjon; ellers første uke. Tittel «Gå til
  gjeldende uke». Observer/auto-scroll som før (P12). Knappen dukker alltid opp når
  man har bladd forbi ankeret — også utenfor skoleåret.
- [x] **Fase 3 (GODKJENT — «Fiks begge») — Fiks kilden:** bruk `gjeldendeSkoleuke()` i
  Klasse- og elev-visningen så «Nå» og default-uke blir korrekt i høst/vår òg.
- [x] **Fase 4 — Cache-bust, commit per delsteg, kryss av, oppsummering.**

### Verifiser før merge
- [ ] Knappen i «Alle mine økter» heter «Nå»
- [ ] Uke ~25 (etter skoleslutt): «Nå» dukker opp ved scroll og tar deg til dagens/nærmeste uke
- [ ] Klasse- og «Alle mine økter»-«Nå» oppfører seg likt
- [ ] Mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt X (P14): «Denne uka»-knapp utenfor skoleåret
Cache-bust: `20260620i`. Branch `claude/P14-denne-uka-utenfor-skolearet` pushet.

---

## Økt X (P14): «Denne uka»-knapp må også virke utenfor skoleåret (tillegg til P11/P12)

**Scope:** `v4/app.js` (kun anker-logikken i `renderAlleOkterTab`),
`v4/index.html` (cache-bust). Ingen CSS-, DB- eller edge-function-endringer.

### Problem
Knappen var skjult når «inneværende uke» ikke fantes i planen (sommerferie /
før/etter skoleåret). Anker falt tilbake til SISTE uke (`uker[uker.length-1]`), så
etter auto-scroll til bunnen hadde knappen ingenting å scrolle til og forble skjult.

### Fiks
- Anker-rekkefølge: inneværende uke → nærmeste KOMMENDE uke → **første uke (toppen)**.
  Byttet fallback fra siste uke til `uker[0]`, så knappen alltid kan dukke opp når
  man har bladd forbi ankeret — også utenfor skoleåret.
- Kontekstuell tekst: «↑ Denne uka» når inneværende/kommende uke er anker; «↑ Til
  toppen» når alt ligger bak oss (sommerferie / etter skoleslutt).
- Observer/auto-scroll uendret (fra P12).

### Verifiser før merge
- [ ] I dagens situasjon (uke ~25, etter skoleslutt): knappen dukker opp når man blar ned i «Alle mine økter» og scroller til toppen
- [ ] I skoleåret: knappen heter «↑ Denne uka» og scroller til inneværende uke
- [ ] Mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt X (P13): Fiks tabell-kolonnebredder (tegn-bryting)
Cache-bust: `20260620h`. Branch `claude/P13-fiks-tabell-kolonnebredder` pushet.

---

## Økt X (P13): Korrigering av P12 — tabell-kolonner brytes tegn-for-tegn

**Scope:** `v4/style.css` (kun `.min-plan-tabell`-kolonnereglene),
`v4/index.html` (cache-bust). Ingen JS-, DB- eller edge-function-endringer.

### Funn — rotårsak (kun lesing)
- P12 satte `.min-plan-tabell .mp-info { width: 100% }` (style.css:679). I en
  `table-layout: auto`-tabell med `width:100%` tvinger en celle med `width:100%`
  de øvrige flytende kolonnene (Aktivitet, Oppmøte) under sin min-bredde, så
  tekst med flere ord wrapper tegn-for-tegn («L-i-s-t-e…»). Info står nesten tom
  men tar mesteparten av bredden.

### Delplan (faser)
- [x] **Fase 1 — Fjern `width:100%` på Info + balanser kolonnene.** Fjern
  `width:100%`. Behold `table-layout: auto` (respekterer min-bredde → aldri
  tegn-bryting). Gi Aktivitet og Info mest plass og La de to dele slakken
  (f.eks. `width: 30%` hver), Oppmøte middels (`~15%`), `☑·Klasse·Fag·P/G`
  smale/innholdstilpassede (uendret, P/G `nowrap`). Juster prosentene om
  nødvendig så ingen celle klemmes under ett helt ord. Behold det diskrete
  vertikale skillet (`border-left`) fra P12.
- [x] **Fase 2 — Cache-bust, commit, kryss av, oppsummering.**

### Verifiser før merge
- [ ] Aktivitet-tekst står på normale linjer (ikke ett tegn per linje)
- [ ] Oppmøte-tekst står på normale linjer
- [ ] Info-kolonnen tar ikke lenger all bredden alene
- [ ] Kolonnene ser balanserte ut; diskret skille beholdt
- [ ] Mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt X (P12): Fiks sticky header + «Denne uka» + kolonnebredder
Cache-bust: `20260620g`. Branch `claude/P12-fiks-sticky-deneuka-kolonner` pushet.

---

## Økt X (P12): Korrigering av P9 + P11 — sticky header, «Denne uka», kolonnebredder

**Scope:** `v4/style.css`, `v4/app.js` (kun observer-logikk i `renderAlleOkterTab`),
`v4/index.html` (cache-bust). Ingen DB-/edge-function-endringer.

### Funn — rotårsak (kun lesing)
- **FEIL 1 (sticky header/fanerad scroller bort):** `html, body { overflow-x: hidden }`
  (style.css:8) og `main { overflow-x: hidden }` (style.css:10). Når `overflow-x`
  settes til `hidden`, beregnes `overflow-y` til `auto` → elementet blir en
  *scroll-container*. Da fester `position: sticky` seg til denne containeren (som
  IKKE scroller — innholdet scroller på vinduet), så header (barn av `body`) og
  `.fane-bar` (barn av `main`) klistrer seg aldri. Dette er den faktiske årsaken,
  ikke manglende `position: sticky` (begge HAR allerede sticky).
- **FEIL 2 («Denne uka»-knapp vises aldri):** Samme rotårsak. `IntersectionObserver`
  i `renderAlleOkterTab` (app.js:2010) bruker standard root = viewport, men reell
  scroll skjer ikke på viewport så lenge `main` er scroll-container → observeren
  fyrer aldri riktig. Når scroll-containeren rettes (FEIL 1), virker observeren.
- **JUSTERING 3 (kolonnebredder):** `.min-plan-tabell` er `width:100%` +
  `table-layout:auto`. P/G·Aktivitet·Oppmøte·Info har ingen eksplisitt bredde, så
  slakken (100% − faste kolonner) fordeles utover alle fire → store tomrom, og tom
  P/G reserverer plass.

### Delplan (faser)
- [x] **Fase 1 — FEIL 1: scroll-container.** Bytt `overflow-x: hidden` → `overflow-x: clip`
  på `html, body` (style.css:8) og `main` (style.css:10). `clip` klipper horisontal
  overflyt uten å lage scroll-container (tvinger ikke `overflow-y:auto`), så sticky
  + vindusscroll virker igjen. Verifiser at header + `.fane-bar` blir værende øverst.
- [x] **Fase 2 — FEIL 2: «Denne uka»-observer.** Med scroll-containeren rettet
  virker observeren. Gjør den i tillegg robust: la knappen dukke opp når
  inneværende-uke-ankeret skyves under den klebrige header+fanerad (rootMargin =
  −(header+fanerad)px), ikke først når det er helt ute av viewport. Klikk scroller
  tilbake (uendret).
- [x] **Fase 3 — JUSTERING 3: kolonnebredder.** Behold faste, smale kolonner kun for
  `☑ · Klasse · Fag`. La `Info` absorbere slakken (`width:100%`) så P/G·Aktivitet·
  Oppmøte krymper til innhold og pakkes tett etter hverandre. Legg et diskret
  vertikalt skille (`border-left`, faint) mellom de fire flytende kolonnene. Ingen
  stive faste bredder på dem. Mobil (kort-liste) uendret.
- [x] **Fase 4 — Cache-bust, commit per delsteg, kryss av, oppsummering.**

### Verifiser før merge
- [ ] Header + fanerad blir værende øverst ved scroll (i «Alle mine økter»)
- [ ] «Denne uka»-knapp dukker opp når inneværende uke er scrollet ut av syne, og scroller riktig tilbake
- [ ] P/G·Aktivitet·Oppmøte·Info ligger tett etter hverandre uten store tomrom; ☑·Klasse·Fag fortsatt faste/smale
- [ ] Mobil fortsatt vertikal liste

---

## Status: FULLFØRT (venter verifisering) — Økt 2 (P11): «Alle mine økter» tabell-layout + «Denne uka»
Cache-bust: `20260620d`. Branch `claude/P11-min-plan-tabell` pushet.

---

## Økt 2 (P11): «Alle mine økter» — tabell-layout (desktop) + «Denne uka»

**Branch:** `claude/P11-min-plan-tabell` (fra `origin/main`, har P9 + P10).
**Scope:** `v4/app.js` (`renderAlleOkterTab`, ev. liten hjelpefunksjon),
`v4/style.css` (tabell + media query), `v4/index.html` (cache-bust).
Ingen DB-endringer, ingen edge-function-endringer.

### Bakgrunn
`renderAlleOkterTab` (app.js ~1836) viser brukerens EGNE økter (der brukeren er
ansvarlig lærer), gruppert per uke, hver økt som et stort kort. Lærere jobber mye
fra mobil. Denne økta gjør desktop-visningen om til en kompakt tabell, beholder
vertikal liste på mobil, og legger til auto-scroll til dagens dato + «Denne uka»-knapp.
OMGJØR tidligere beslutning om dag-kolonner (man→fre) for denne visningen.

### Funn — kartlegging (kun lesing)
- `renderAlleOkterTab` henter sessions for `teacher_id = profil.id`, sortert på
  `week_nr`/`day_of_week`, grupperer per uke (`<h3>Uke X</h3>` + `.dag-okter`-liste),
  rendrer `renderSessionCard` + prepender klasse-label.
- **Bulk-redigering finnes IKKE i denne fanen i dag** (ingen checkbox, ingen bulk-bar).
  Bulk finnes kun i `renderMinKlasseTab` (per-uke), som har `bulkSelected`-Set,
  `bulk-bar`, og gjenbruker `visBulkEditModal(ids)`, `visBulkKopierModal(valgte)` +
  inline slett. → **FLAGGET** (se «Åpne avklaringer» under).
- Spørringen mangler `users!teacher_id(full_name)` (lærernavn) — må legges til hvis
  Lærer-kolonnen skal vise navn (alle rader = innlogget bruker, så kolonnen blir
  alltid samme navn). → **FLAGGET**.
- Sidescroll = vindusscroll (sticky header, `.side-wrap`). Auto-scroll og
  IntersectionObserver må forholde seg til vindusscroll, ikke en intern container.
- `.dag-okter` har `max-height:70vh; overflow-y:auto` — egen intern scroll. For en
  kontinuerlig liste over alle uker må vi IKKE bruke `.dag-okter` rått, ellers får vi
  nøstet scroll. Egen klasse/markup for denne fanen.

### Avklart med bruker (GODKJENT)
1. **Bulk i denne fanen:** Bygg full bulk her — markeringsmodus + bulk-bar som
   gjenbruker `visBulkEditModal`/`visBulkKopierModal` + inline slett (samme som
   per-uke-visningen).
2. **Kolonner (desktop), venstre → høyre:** `☑ · Klasse · Fag · P/G · Aktivitet ·
   Oppmøte · Info`.
   - **Checkbox HELT TIL VENSTRE** (overstyrer opprinnelig KRAV «til høyre» — bruker
     bestemte venstre).
   - Header for parti/gruppe heter **«P/G»**.
   - **Faste, smale** kolonner: `☑`, `Klasse`, `Fag`.
   - **Flytende** bredde: `P/G`, `Aktivitet`, `Oppmøte`, `Info`.
   - «Lærer»-kolonnen droppes (alltid innlogget bruker).

### Delplan (faser)
- [x] **Fase 1 — Markup/datagrunnlag:** behold uke-gruppering, bygg tabell-markup
  (desktop) + kort-liste (mobil) i samme DOM, styrt av CSS. Uke-overskrift med
  `data-uke` for IntersectionObserver. Ukedag-merking kompakt per rad.
- [x] **Fase 2 — CSS:** tabell-stil for bred skjerm, skjul tabell / vis kort-liste
  under ~700px-brekkpunkt. Faste smale kolonner (☑/Klasse/Fag), flytende resten.
- [x] **Fase 3 — Auto-scroll + «Denne uka»:** ved åpning scroll til dagens uke.
  IntersectionObserver på inneværende ukes overskrift styrer «Denne uka»-knappen;
  klikk scroller tilbake.
- [x] **Fase 4 — Bulk:** markeringsmodus + bulk-bar, gjenbruk bulk-modaler.
- [x] **Fase 5 — Cache-bust, commit per delsteg, kryss av, oppsummering.**

### Verifiser før merge
- [ ] Desktop: økter vises som tabell, én rad per økt, checkbox helt til venstre på alle rader
- [ ] Mobil: fortsatt vertikal liste (ikke tabell)
- [ ] Auto-scroll til dagens dato ved åpning
- [ ] «Denne uka»-knapp vises kun når man har scrollet forbi inneværende uke, og scroller riktig tilbake
- [ ] Bulk-redigering virker (marker → rediger/kopier/slett)

---

## Status: FULLFØRT — Økt X (P10): Admin-toggle skal ikke navigere

---

## Økt X (P10): Admin-toggle = rettighetsbryter, ikke navigasjon

**Branch:** `claude/P10-admin-toggle-rettighet`
**Scope:** `v4/app.js` (kun `toggleAdminModus`), `v4/index.html` (cache-bust).
Ingen DB-endringer, ingen edge-function-endringer, ingen CSS-endringer.

### Problem

«Admin»-toggelen i headeren (`hdr-admin-toggle` → `toggleAdminModus`) navigerer i
dag til admin-panelet via `navigate(ny ? '#/admin' : '#/laerer')` (app.js:462).
Det er feil: toggelen skal kun veksle admin-RETTIGHETER av/på i den plan-visningen
brukeren allerede står i — aldri bytte rute.

### Funn — kartlegging (kun lesing)

- `toggleAdminModus()` (app.js:456–463): skrur `is_admin_active` av/på i DB +
  `APP`, kaller `oppdaterHeader()`, og deretter `navigate(...)` (← feilen).
- `is_admin_active`/`APP.isAdminActive` styrer rettighetsnivået i visningene:
  `isKontakt = role === 'kontaktlaerer' || APP.isAdminActive` i `renderLaererView`
  (1421) og `renderAlleOkterTab` (1782). Re-render av gjeldende visning gir derfor
  riktig effekt (utvidet admin-redigering på/av).
- `router()` (758–789) re-rendrer ut fra **gjeldende** hash uten å endre rute →
  egnet til «re-render der brukeren står».
- Hamburger «Innstillinger» (`hdr-dd-innstillinger`, app.js:715–717) navigerer til
  `#/admin` og er kun synlig for admin (`!visAdmin` → skjult). **Korrekt — røres ikke.**

### Delplan

- [x] **Delsteg 1 — Fjern navigasjon fra `toggleAdminModus`**
  - Bytt ut `navigate(ny ? '#/admin' : '#/laerer')` med `router()` slik at
    gjeldende visning re-rendres med nytt rettighetsnivå (ingen rute-bytte).
  - Behold: DB-oppdatering av `is_admin_active`, `APP.isAdminActive`/
    `APP.profile.is_admin_active`, og `oppdaterHeader()` (oppdaterer toggle-tekst/
    `admin-aktiv`-stil).
  - Ikke rør hamburger «Innstillinger» (→ `#/admin`, admin-only) — den er den
    eneste inngangen til admin-panelet.

- [x] **Delsteg 2 — Bump `?v=`, commit og push**
  - Bump `?v=` (JS) i `v4/index.html`.
  - Commit, push til `claude/P10-admin-toggle-rettighet`.
  - Ingen manuelle steg i Supabase.

### Verifiser før merge

- [ ] Admin-toggle PÅ viser bulk-redigering av alle viste økter
- [ ] Admin-toggle AV viser kun brukerens egne rettigheter
- [ ] Admin-toggle navigerer IKKE til admin-panelet
- [ ] Hamburger «Innstillinger» åpner fortsatt admin-panelet
- [ ] Hard refresh henger ikke på «Laster…»

---

## Status: FULLFØRT — Økt 1 (P9): Sticky header + faner + hamburgermeny

---

## Økt 1 (P9): Sticky header + faner + hamburgermeny

**Branch:** `claude/P9-sticky-header-hamburger`
**Scope:** `v4/app.js`, `v4/style.css`, `v4/index.html` (cache-bust).
Ingen DB-endringer, ingen edge-function-endringer.

### Funn — kartlegging (kun lesing)

**1. Header (index.html:26–54):** Ett globalt `<header>`. PC-raden har
`hdr-username`, `hdr-admin-toggle` (Admin), `hdr-laerer-btn` (Lærervisning/
Elevvisning), `hdr-logout-btn`, `hdr-login-btn` — alle med klassen `hdr-pc-only`.
Hamburger (`hdr-hamburger` + dropdown `hdr-dropdown` med navn/Admin/Lærer/Logg ut/
Logg inn) finnes allerede, men styres i CSS til **kun mobil**.

**2. CSS (style.css):**
- `header { position: sticky; top:0; z-index:40 }` (linje 102–109) — men
  `@media (max-width:600px){ header { position: relative } }` (linje 162)
  fjerner sticky på mobil.
- `.hdr-hamburger { display:none }` (linje 139); media-query (160–161) skjuler
  `.hdr-pc-only` og viser hamburger først under 600px.
- `.fane-bar` (linje 412–415) har **ingen** sticky og ingen bakgrunn.
- Sidebakgrunn: `--bg`. Header-høyde varierer (~58px desktop, mer ved wrap).

**3. `oppdaterHeader()` (app.js:625–747):** Setter PC-knapper OG hamburger-
elementer. `skjulLaerer = harAdminTilgang() && APP.isAdminActive`. Dropdown har i
dag duplikat av Admin/Lærer.

**4. `renderLaererView()` (app.js:1409–1503):** Faner bygges fra `tabs`/`tabSlugs`.
«Innstillinger» legges alltid til som siste fane (1439) og rendres av
`renderInnstillingerTab` via `setTab` (1457). Fane 0 er klassevelgeren.

### Beslutninger (avklart med bruker)

**Tre separate funksjoner — ikke bland sammen:**
1. **«Admin»** = toggle-bryter i headeren (`hdr-admin-toggle` → `toggleAdminModus`).
   Bytter admin-visning av/på. **BLIR STÅENDE uendret, alltid synlig** ved siden
   av Elevvisning. Skal IKKE inn i hamburgeren.
2. **«Innstillinger»** = inngang til admin-PANELET (skoleinfo, fag, klasser,
   brukere, skolerute, funfacts), dvs. rute `#/admin` → `renderAdminPanel`.
   Dette er en NY hamburger-knapp. Vises kun for brukere med admin-tilgang.
3. **«Profil»** = brukerens egne innstillinger (dagens lærer-fane
   «Innstillinger», `renderInnstillingerTab`, rute `#/laerer/innstillinger`).
   Flyttes INN i hamburgeren, omdøpt til «Profil».

**Hamburger (likt på desktop og mobil), innlogget:** brukernavn · «Profil» ·
«Innstillinger» (kun admin) · «Logg ut». **Utlogget:** «Logg inn».

- **Sticky på alle skjermstørrelser:** Fjern mobil-overstyringen som gjør
  headeren `relative`. Gjør `.fane-bar` sticky rett under headeren med
  `top: var(--header-h)`, der `--header-h` settes i JS (måler `header.offsetHeight`
  ved last + resize), `z-index:30` (under header 40), og `background: var(--bg)`
  så innhold ikke skinner gjennom.
- **Toggle-brytere alltid synlige:** Fjern `hdr-pc-only` fra `hdr-admin-toggle` og
  `hdr-laerer-btn` slik at Admin/Elevvisning vises på alle størrelser (uendret
  vis/skjul-logikk for rolle). Fjern Admin/Lærer fra hamburger-dropdownen
  (de er nå alltid-synlige toggles, unngå duplikat).
- **Hamburger alltid synlig:** Vis ☰ på alle størrelser. Fjern `hdr-username`,
  `hdr-logout-btn` og `hdr-login-btn` fra den faste PC-raden (navn + logg ut/inn
  bor kun i hamburgeren nå).
- **«Profil» flyttes fra fane til hamburger:** Fjern Innstillinger-fanen fra
  `renderLaererView` (faneraden viser kun Klasse / Alle mine økter / Søk
  [+ Klasse-admin for kontaktlærer]). Hamburger-knapp «Profil» →
  `navigate('#/laerer/innstillinger')`; `renderLaererView` rendrer fortsatt
  innholdet for den slug-en (ingen aktiv fane uthevet). Overskriften «Innstillinger»
  i `renderInnstillingerTab` endres til «Profil».
- **«Innstillinger» (admin-panel) i hamburger:** Ny knapp → `navigate('#/admin')`.
  Router (app.js:780) tillater visning når `harAdminTilgang()`.

### Delplan

- [x] **Delsteg 1 — index.html: omstrukturer header-knapper**
  - Fjern `hdr-pc-only` fra `hdr-admin-toggle` og `hdr-laerer-btn` (alltid synlige).
  - Fjern `hdr-username`, `hdr-logout-btn` og `hdr-login-btn` fra den faste raden.
  - I `hdr-dropdown`: behold `hdr-dropdown-navn`, `hdr-dd-logout`, `hdr-dd-login`.
    Legg til `hdr-dd-profil` («Profil») og `hdr-dd-innstillinger» («Innstillinger»).
    Fjern `hdr-dd-admin` og `hdr-dd-laerer` (nå alltid-synlige header-toggles).

- [x] **Delsteg 2 — CSS: sticky + alltid synlig hamburger**
  - `.hdr-hamburger { display: inline-flex }` (alltid synlig); fjern
    `@media`-reglene som bare viser den under 600px og fjern
    `header { position: relative }`-overstyringen.
  - `.fane-bar { position: sticky; top: var(--header-h, 58px); z-index: 30;
    background: var(--bg); }` (+ liten padding-topp så fanene ikke klistrer til
    headeren). Behold `margin-bottom`.
  - Sikre at modaler/overlays (z-index ≥ 200/500) fortsatt ligger over.

- [x] **Delsteg 3 — app.js: `oppdaterHeader` + `--header-h`-måling**
  - Oppdater `oppdaterHeader` til ny knapp-fordeling: Admin- og Elev/Lærer-toggle
    alltid synlige (uendret logikk); hamburger har navn / Profil / Innstillinger
    (kun admin) / Logg ut (+ Logg inn utlogget).
  - `hdr-dd-profil`: vises innlogget → `navigate('#/laerer/innstillinger')` + lukk.
  - `hdr-dd-innstillinger`: vises kun ved `harAdminTilgang()` →
    `navigate('#/admin')` + lukk.
  - Ny `settHeaderHoyde()` som setter `--header-h` fra `header.offsetHeight`;
    kalles i `oppdaterHeader` og på `window resize`.

- [x] **Delsteg 4 — app.js: flytt «Profil» ut av faneraden**
  - Fjern «Innstillinger» fra `tabs`/`tabSlugs` i `renderLaererView` som synlig
    fane (behold slug-håndtering i `setTab` for `#/laerer/innstillinger`, men
    uten egen fane-knapp).
  - Endre overskrift i `renderInnstillingerTab` fra «Innstillinger» til «Profil».
  - Verifiser at navigasjon fra hamburgeren viser profil-innholdet.

- [x] **Delsteg 5 — Bump `?v=`, commit og push**
  - Bumpet `?v=20260620a` (CSS + JS) i `v4/index.html`.
  - Commit per delsteg, push til `claude/P9-sticky-header-hamburger`.
  - Ingen manuelle steg i Supabase.

### Verifiser før merge (klikk gjennom på branchen)

- [ ] Innlogging virker (logg inn → lærervisning laster)
- [ ] Hard refresh (Cmd+Shift+R) henger ikke på «Laster…» (init-rekkefølge)
- [ ] «Admin»-toggle bytter visning riktig, av og på
- [ ] «Elevvisning»-toggle bytter visning riktig
- [ ] Hamburger åpner; «Innstillinger» åpner admin-panel; «Profil» åpner
      brukerinnstillinger; «Logg ut» virker
- [ ] «Innstillinger» i hamburger er skjult for ikke-admin (test med lærer-konto)
- [ ] Header + fanerad blir værende øverst ved scroll
- [ ] Sjekk på smal mobilskjerm: knappene hopper ikke

---

## Status: FULLFØRT — Økt X (P8): Klassevelger som fane + sortert klasseliste

---

## Økt X (P8): Klassevelger – flytt velger til fane og sorter klasseliste

**Branch:** `claude/P8-klassevelger-fane` (godkjent av bruker).
**Scope:** `v4/app.js`, `v4/style.css`, `v4/index.html` (cache-bust).
Ingen DB-endringer, ingen edge-function-endringer.

### Funn — kartlegging (kun lesing)

**1. Hvor `<select>` for klassevelgeren bygges i dag:**
`oppdaterHeader()` (app.js:625–680). Selve `<select class="hdr-klasse-sel">` bygges
på linjene 643–671 inne i `#hdr-klasse`-diven. Viktig: selectet bygges **kun når
`APP.klasseVelger.klasser.length > 1`** — ved nøyaktig 1 klasse skjules `#hdr-klasse`
(linje 648–649) og bare statisk tekst vises. Native `<select>`, ikke custom dropdown.

**2. Faneraden i lærervisningen:**
`renderLaererView()` (app.js:1433–1480). Faner bygges som vanlige `<button class="fane">`
(linje 1470–1473) fra arrayene `tabs`/`tabSlugs` (linje 1446–1449):
`['Min klasse','Alle mine økter','Søk', (Klasse-admin), 'Innstillinger']`.
`setTab(idx)` (1457–1468) bytter innhold; ved bytte vekk fra `klasse` nullstilles
`APP.klasseVelger` og headeren oppdateres (linje 1462). «Min klasse» = `renderMinKlasseTab`,
«Alle mine økter» = `renderAlleOkterTab`.

**3. Hvor klasselista hentes/bygges:**
`renderMinKlasseTab()` (app.js:1531–1542). I dag:
- **Admin** (`APP.isAdminActive`): henter ALLE skolens klasser fra `classes`-tabellen
  (`.eq('school_id', …).order('name')`).
- **Andre lærere**: henter KUN egne via `user_classes` → `classes(*)`.

→ Per i dag har en vanlig lærer **ikke** tilgang til (b) alle skolens klasser i denne
funksjonen — kun (a) egne via `user_classes`. Det må legges til et ekstra kall til
`classes` (alle skolens klasser) for ikke-admin, og lista partisjoneres i «dine»/«andre».
`APP.klasseVelger` settes på linje 1579 og leses av `oppdaterHeader`.

**4. Header «klasse 1E»-tekst:**
HTML: `#hdr-klasse-statisk` (statisk tekst, index.html:32) og `#hdr-klasse` (select-container,
index.html:35). `oppdaterKlasseStatisk(navn)` (app.js:614–623) skriver «klasse {navn}».
I dag: select i `#hdr-klasse` PLUSS statisk tekst i `#hdr-klasse-statisk` (begge oppdateres
i `oppdaterHeader`). Etter endringen skal `#hdr-klasse` (select) aldri fylles for lærer —
kun statisk tekst beholdes.

**Valg av dropdown-løsning:** Dagens kode bruker **native `<select>`** (både `hdr-klasse-sel`
og `skolear-sel`). Anbefalt løsning: native `<select>` med to `<optgroup>` —
`«Dine klasser»` og `«Andre klasser»` — som gir både nedtrekkspil og visuelt skille
gratis, og fungerer også for lærere med én tilknyttet klasse (selectet rendres alltid).

### Delplan

- [x] **Delsteg 1 — Data: hent både egne og alle klasser (flyttet til `renderLaererView`)**
  Klassehentingen er løftet fra `renderMinKlasseTab` til `renderLaererView` (gjelder ALLE
  roller): `mineKlasser` via `user_classes` (sortert på navn) + `andreKlasser` = resten av
  skolens klasser fra `classes` (RLS `classes_read_any` tillater lesing av alle
  ikke-slettede klasser, også for vanlige lærere). `renderMinKlasseTab(container, klasse)`
  mottar nå aktiv klasse som parameter.

- [x] **Delsteg 2 — Klassevelger som første fane i `renderLaererView`**
  Første fane («Min klasse») er erstattet av en velger-fane `«Klasse [navn ⌄]»`
  (`div.fane.fane-velger` med `select.fane-velger-sel`). Aktiv fane → `renderMinKlasseTab`
  (uke-visning) som før. «Alle mine økter» m.fl. uendret. Klassebytte på klasse-fanen går
  via `APP.klasseVelger.setKlasse` → `renderUke` (beholder valgt uke); bytte fra annen fane
  går via `setTab(0)`.

- [x] **Delsteg 3 — Native `<select>` med `<optgroup>` + sortering**
  `<optgroup label="Dine klasser">` (sortert) + `<optgroup label="Andre klasser">`.
  Alltid åpningsbar dropdown — den gamle `klasser.length > 1`-betingelsen er fjernet.

- [x] **Delsteg 4 — Fjern velger fra headeren**
  `oppdaterHeader` bygger ikke lenger `<select>` i `#hdr-klasse`; containeren skjules.
  Statisk «klasse {navn}»-tekst beholdes via `oppdaterKlasseStatisk`, drevet av
  `APP.klasseVelger.aktivKlasse` (overlever realtime-`oppdaterHeader`-kall på klasse-fanen).

- [x] **Delsteg 5 — CSS for velger-fanen**
  `.fane-velger` (inline-flex) + `.fane-velger-sel` (arver font/farge fra `.fane`, så
  aktiv-tilstand følger fane-stilen).

- [x] **Delsteg 6 — Avslutning**
  Bumpet `?v=` (`style.css?v=20260619c`, `app.js?v=20260619f`), oppdatert PLAN,
  skrevet til DECISIONS.md, commit. Ingen CI/PR-overvåking.

---

## Status: FULLFØRT — admin additivt (018) ferdig, alle manuelle steg utført

> **Hele 018-runden er ferdig** (19.06.2026):
> - `018_admin_additiv.sql` kjørt → `users.is_admin` finnes (verifisert i SQL Editor).
> - `018_funfacts_view_count.sql` kjørt → `school_facts.view_count` finnes (verifisert).
> - Edge functions `create-user`, `admin-user`, `generate-facts` redeployet i Dashboard.
>
> Ingen gjenstående manuelle steg.

**Branch:** `claude/festive-knuth-qrf7a3`
**Scope:** ny migrasjon `018_admin_additiv.sql`, RLS-oppdateringer, 3 edge functions
(`create-user`, `admin-user`, `generate-facts` — manuell redeploy), `v4/app.js`,
`v4/index.html` (cache-bust). Manuelle steg: kjøre migrasjon i SQL Editor + redeploye
edge functions i Dashboard.

### Problem
Admin-menyen forsvinner gjentatte ganger. Årsak: hele tilgangssystemet bruker
`role='admin'` som admin-flagg, mens brukerskjemaene lagrer admin-status i
`is_admin_active` (som innlogging nullstiller). Når admin-brukeren redigeres,
overskrives `role` til `laerer`/`kontaktlaerer` og menyen forsvinner ved neste login.

### Beslutning (avklart med bruker)
- Admin er **additivt**: en bruker er `laerer` ELLER `kontaktlaerer`, og kan **i tillegg**
  være admin. En admin kan samtidig være kontaktlærer for en klasse.
- Eget boolsk felt **`users.is_admin`** = permanent admin-tilgang.
- `is_admin_active` beholdes uendret = «ser på adminpanelet nå» (visningsbryter,
  nullstilles ved login).
- **Maks 3 admin** per skole (endret fra 2).
- Enum-verdien `'admin'` i `user_role_enum` beholdes (kan ikke trygt fjernes) men
  brukes ikke lenger for nye/redigerte brukere.

### Migrasjon `018_admin_additiv.sql` (kjøres manuelt i SQL Editor)
- [x] `alter table users add column is_admin boolean not null default false;`
- [x] Datamigrering: `update users set is_admin = true, role = 'laerer' where role = 'admin';`
      (eksisterende admins får basisrolle `laerer` + `is_admin=true`; juster manuelt om
      de også skal være kontaktlærer)
- [x] **Eksplisitt gjenoppretting av kjente admins på e-post** (din konto er allerede
      degradert, så `where role='admin'` fanger den ikke):
      `update users set is_admin = true where id in (select id from auth.users where email in (<liste>));`
- [x] Ny helper `auth_is_admin()` → returnerer `users.is_admin` for innlogget bruker.
- [x] Erstatt `enforce_max_admins()`: tell `is_admin = true` med grense **3**;
      trigger på `before insert or update of is_admin, deleted_at, school_id`.
- [x] `006`-policy (school_facts): bytt `... = 'admin'` → `auth_is_admin()`.
- [x] `002`-policyer `sessions_update/delete_kontaktlaerer`: bytt
      `auth_role() in ('kontaktlaerer','admin')` → `(auth_role() = 'kontaktlaerer' or auth_is_admin())`.
- [x] `017`-policy `subject_divisions_write_kontaktlaerer`: samme bytte som over.

### Edge functions (manuell redeploy)
- [x] `create-user`: caller-sjekk `role !== 'admin'` → `!is_admin` (selecte `is_admin`);
      insert ny bruker med `is_admin: is_admin === true` (og `is_admin_active: false`).
- [x] `admin-user`: samme caller-sjekk.
- [x] `generate-facts`: `profile.role !== 'admin'` → `!profile.is_admin` (selecte `is_admin`).

### app.js
- [x] `visNyBrukerModal` / `visRedigerBrukerModal`: `rolle = fd.get('role')` (basisrolle),
      send/lagre `is_admin = erAdmin`; ikke rør `is_admin_active`. Maks-admin-sjekk teller
      `is_admin=true`, grense 3. Admin-checkbox forhåndshakes fra `user.is_admin`.
      Fjern `role==='admin' → laerer`-spesialtilfellet i radio-forhåndsvalg.
- [x] login (linje ~499): `erAdmin = APP.profile?.is_admin || APP.isAdminActive` → bruk `is_admin`.
- [x] `oppdaterHeader` (708/709): `visAdmin = !!APP.profile.is_admin`;
      `skjulLaerer = APP.profile.is_admin && APP.isAdminActive`.
- [x] router-guard (798): `!APP.isAdminActive && !APP.profile?.is_admin`.
- [x] `sjekkOgFornyFunfacts` (366): `!is_admin_active && !is_admin`.
- [x] `renderBrukereTab`: vis «+ admin»-merke når `u.is_admin`.
- [x] Bump `?v=` i `index.html`.

### Verifisering
- [x] Admin redigerer egen/annen bruker → admin-status overlever login.
- [x] Admin som også er kontaktlærer beholder begge.
- [x] Maks 3 admin håndheves (frontend + trigger).
- [x] Funfacts-fornyelse, create-user, admin-user fungerer for admin.

### Rydd opp
- [x] Reverter den midlertidige `role='admin'`-fiksen i modalene (erstattes av is_admin).

---

## Status: FULLFØRT — Økt X (P7): Skjulte økt-handlinger — sveip/kebab i alle visninger

---

## Økt X (P7): Skjulte økt-handlinger — sveip/kebab i alle visninger

**Branch:** `claude/P7-okt-handlinger-sveip-kebab`
**Scope:** `v4/app.js`, `v4/style.css`, `v4/index.html` (cache-bust).
Ingen DB-endringer, ingen edge-function-endringer.

### Funn — kartlegging

**Byggemodell:** Én felles funksjon `renderSessionCard(s, showActions, actions)` (app.js:1248)
bygger alle økt-kort. Ingen duplisering per visning.

**Call sites med handlinger (showActions = true):**

| Linje | Visning | Handlinger |
|-------|---------|------------|
| 1708 | `renderMinKlasseTab` → `renderUke` (Min klasse) | edit, copy, del, transfer |
| 1768 | `renderAlleOkterTab` (Alle mine økter) | edit, copy, del, transfer |
| 1835 | `renderSokTab` → `doSearch` (Søk) | edit, copy, del |

**Elevvisning:** `renderSessionCard(s, false)` — ingen knapper, berøres ikke.

**Eksisterende halvferdige løsning** (`ukeplan_skjul_handlinger` i localStorage):
Skjuler `okt-handlinger` via `.skjult` + høyreklikk-toggle. Erstattes av P7.
Innstillingsfane-checkboxen (`renderInnstillingerTab` linje 1414–1422) fjernes.

**CSS-anker:** `.okt-kort` er `position:relative` → kebab-ikon plasseres absolutt i hjørnet.

### Delplan

- [x] **Delsteg 1 — `visOktHandlinger(session, actions)` (ny felles funksjon)**

  Ny hjelpefunksjon som bygger og viser handlingsmenyen uavhengig av trigger:
  - Rendrer en liten **meny-boks** (absolutt-posisjonert under kebab-ikonet) med
    én rad per tilgjengelig handling: ✏️ Rediger, 📋 Kopier, 🗑️ Slett, ↗️ Overfør.
  - Null-handlinger (f.eks. `del: null`) vises ikke.
  - Menyen lukkes ved: klikk på handling, klikk utenfor, Escape.
  - Én aktiv meny om gangen: ny meny lukker ev. forrige.
  - Plassering: under/ved kebab-knappen; snues til venstre om kortet er ved høyre kant.

- [x] **Delsteg 2 — Kebab-ikon i `renderSessionCard` (desktop)**

  I `renderSessionCard`, når `showActions = true`:
  - Erstatt `okt-handlinger`-raden (alltid synlige emoji-knapper) med én `⋮`-knapp
    (klasse `okt-kebab`) absolutt-posisjonert i kortets øvre høyre hjørne.
  - Klikk på `okt-kebab` → kaller `visOktHandlinger(session, actions)`.
  - Høyre-klikk på selve kortet → kaller samme `visOktHandlinger` (valgfri snarvei).
  - Fjern all `skjulHandlinger`/`ukeplan_skjul_handlinger`-logikk fra `renderSessionCard`.
  - Fjern innstillingscheckboxen i `renderInnstillingerTab` (linje 1414–1422).

- [x] **Delsteg 3 — Sveip venstre i `renderSessionCard` (mobil)**

  Touch-gester håndteres i `renderSessionCard` via `touchstart`/`touchmove`/`touchend`:
  - **Sveip venstre** (horisontalt ≥ 50 px, vertikal avvik < 30 px):
    - Avslører **handlingspanel** festet til høyre side av kortet (translateX-animasjon),
      ELLER kaller `visOktHandlinger` som en bottom-sheet / overlay.
    - Aldri direkte slett — bare åpner menyen.
  - **Kort trykk** (tap): utvider komprimert kortinnhold (se delsteg 4).
  - Sveip-start sjekker at bevegelsen er horisontal (ikke vertikal scroll) før gest låses.
    `touchmove` kaller `e.preventDefault()` kun etter at horisontal intent er bekreftet —
    unngår konflikt med nettleserens scroll.
  - Sveip og tap er gjensidig eksklusive: sveip startes → tap-handler avfyres ikke.

- [x] **Delsteg 4 — Komprimert kortinnhold på mobil**

  I `renderSessionCard` og tilhørende CSS:
  - På mobil (via CSS-klasse `okt-kort--kompakt` satt av JS med `matchMedia`) vises
    kun **fag-badge + aktivitet** som standard; møtepunkt, info, lærer og div-badges
    er skjult (klasse `okt-detaljer skjult`).
  - **Kort trykk** (tap) på kortet toggler klassen → viser/skjuler detaljer.
  - `okt-kort--kompakt` settes/fjernes ved window-resize for å synkronisere med CSS.
  - Desktop: alle detaljer alltid synlige (ingen endring fra i dag).

- [x] **Delsteg 5 — CSS: kebab, meny og sveip-animasjon**

  Nye CSS-klasser i `style.css`:
  - `.okt-kebab` — absolutt-posisjonert øvre hjørne, diskret (`opacity:.45`, hover `.85`),
    `font-size:1.1rem`, `padding:2px 6px`, ingen border, bakgrunn transparent.
  - `.okt-handlingsmeny` — absolutt-posisjonert meny-boks med shadow, liten padding,
    `z-index:100`, `min-width:130px`. Rader: `.okt-handlingsrad` (flex, gap, hover-highlight).
  - `.okt-detaljer.skjult` — `display:none` (innenfor `@media (max-width:700px)`).
  - Sveip-animasjon: `transition: transform .15s` på `.okt-kort` ved sveip.
  - Print-CSS: `.okt-kebab` og `.okt-handlingsmeny` skjules ved print (legges i
    eksisterende print-skjull-liste linje 729).

- [x] **Delsteg 6 — Bump `?v=`, commit og push**
  - Bump cache-busting til `?v=20260619a` (eller høyere) i `v4/index.html`.
  - Commit per delsteg, push til `claude/P7-okt-handlinger-sveip-kebab`.
  - Ingen manuelle steg i Supabase.

---

## Status: FULLFØRT — Økt X (P6): plassbruk på mobil (elevvisning)

---

## Økt X (P6): Plassbruk på mobil — elevvisning

**Branch:** `claude/eager-thompson-3laudr`
**Scope:** `v4/style.css` (primært) + `v4/app.js` (ett sted), `v4/index.html` (cache-bust).
Ingen DB-endringer, ingen edge-function-endringer.

### Funn — kartlegging

**To typer «heldagshendelse» — ulik behandling:**

| Type | Kilde | Gjeldende rendering | Problem? |
|------|-------|---------------------|----------|
| `multi_day_events` (flerdagsarrangement) | DB: `multi_day_events` | `renderFlerdagsBjelkeRad` → kompakt bjelke-rad over rutenettet | ✓ Allerede kompakt |
| `school_calendar` (type `helligdag`) | DB: `school_calendar` | Inni `.dag-kol`: dag får klasse `day-col--holiday` + `.holiday-label` + tom `.dag-okter` under | ⚠️ **Problemet** |

**Årsak til tomrom:**

| CSS-regel | Fil:linje | Effekt på mobil |
|-----------|-----------|-----------------|
| `.dag-okter { min-height: 180px }` | `style.css:268` | Hver dag reserverer 180px selv uten innhold. Gir tomrom under enkeltøkt-dager og under helligdag-etiketten. |
| `@media (max-width:700px)` | `style.css:695–714` | Stabler dager vertikalt (flex-col), men **overstyrer ikke** `min-height:180px`. |
| `.day-col--holiday .dag-okter { opacity:.5 }` | `style.css:810` | Den tomme containeren beholdes fullt synlig med 180px høyde — tomt felt under etiketten. |

**Konklusjon:** `min-height: 180px` på `.dag-okter` er riktig for desktop (5-kol-grid,
jevn høyde), men feil på mobil (vertikal stabling). Nullstilles i mobil-media-query.
Helligdag trenger i tillegg en CSS-regel som skjuler den tomme containeren.

### Delplan

- [x] **Delsteg 1 — Fjern fast høyde på mobil (CSS)**
  - I `@media (max-width:700px)` i `style.css`: lagt til
    `.dag-okter { min-height: 0; max-height: none; overflow: visible; }`
  - Daghøyden følger nå innholdet på mobil; desktop (5-kol) er uberørt.

- [x] **Delsteg 2 — Kompakt helligdag på mobil (CSS)**
  - Verifisert at `.dag-okter` på en helligdag er reelt tom: bygges med
    `el()`/`document.createElement` (app.js:1193), løkka over `daySessions`
    legger ingenting til på fridager → ingen whitespace-noder. `:empty` treffer.
  - I `@media (max-width:700px)` lagt til
    `.day-col--holiday .dag-okter:empty { display: none; }`
  - Effekt: helligdag-kolonne på mobil viser kun dag-tittel + `.holiday-label` —
    ingen tom container under. Dersom dagen mot formodning har en allerede-lagret
    økt, treffer ikke `:empty` → økta blir synlig (ønsket).

- [x] **Delsteg 3 — Bump `?v=`, commit og push**
  - Bumpet til `?v=20260619a` i `v4/index.html` (CSS + JS).
  - Commit og push til `claude/eager-thompson-3laudr`.

**Merk:** Ingen endringer i `app.js` er nødvendig — alt løses i CSS.

---

## Status: FULLFØRT — Økt B (P3): klasse-admin ukeinntasting + skoleår-veksler

---

## Økt B (P3): Klasse-admin – ukeinntasting + skoleår-veksler

### Delplan

**Delsteg A — Skoleår-veksler: gate + tydeligere UI i `renderSkolerute`** [x]
**Delsteg B — Ukenummer-inntasting i `visNySkolerute`** [x]
**Delsteg C — Bump `?v=`, commit og push** [x]

---

## Status: FULLFØRT — Økt A (P2): Ukenummer som primær tidsenhet
## Neste steg: Migrasjon 017 (Plan_YFF) — venter på bruker

---

## Økt A (P2) — Ukenummer som primær tidsenhet i hele UI

**Status: FULLFØRT**
**Branch:** `claude/P2-ukenummer-ui`

### Fase 0 — Funn: Tid-presentasjon i nåværende UI

| Sted | Funksjon / linje | Nåværende format | Vurdering |
|------|------------------|------------------|-----------|
| Navigasjonsrad (student + lærer) | `renderElevView` ~1129, `renderMinKlasseTab` ~1594 | `← Forrige uke [9] Neste uke →` — uketallet i `<input>` uten «Uke»-etikett; `.uke-label`-klassen finnes i CSS men er ubrukt | ⚠️ Uke vises, men mangler synlig etikett |
| Dag-titler i ukenettet | begge ~1176/1672 | «MANDAG 10.02» — dag primær (bold, uppercase, .82rem), dato sekundær (`opacity:.6`, .75rem) | ✓ Dato allerede nedtonet |
| Admin skolerute-liste | `renderSkolerute` ~3970 | `[Tittel (uthevet)]  [10.02 – 21.02 (liten, dempet)]` — ingen ukenummer | ⚠️ Dato uten uke-kontekst |
| «Legg til hendelse»-modal | `visNySkolerute` ~4052 | `type="date"`-felt, ingen live uke-hint | ⚠️ Dato-input uten uke-tilbakemelding |
| Flerdagsarrangementer (klasse-admin) | `renderKlasseAdminInnhold` ~2660 | `Tittel (DD.MM – DD.MM)` — ingen ukenummer | ⚠️ Dato uten uke-kontekst |
| Utskriftshode | begge | «25/26 Skolenavn, klasse X – Uke 9» | ✓ Kun uke, ingen dato |
| «Alle mine økter»-fanen | `renderAlleOkterTab` ~1763 | Seksjonstittel `Uke 9` (h3) | ✓ Uke primær |
| Søk-fanen | `renderSokTab` ~1838 | `Klasse – Uke 9 Mandag` | ✓ Uke primær |
| AI-forhåndsvisning skolerute | `visSkoleruteForhandsvisning` ~4123 | Egen «Uke»-kolonne («uke 7», «uke 6–8») | ✓ Uke primær (forrige runde) |

**Konklusjon:** Uke er allerede primær i student- og lærervendte flater. Tre hull gjenstår:
1. Navigasjonsraden mangler eksplisitt «Uke»-etikett (`.uke-label`-klassen er klar i CSS, men aldri brukt)
2. Admin skolerute-listen viser dato uten uke-kontekst
3. Flerdagsarrangementer (klasse-admin) viser dato uten uke-kontekst

---

### Delplan — P2-implementasjon

**Scope:** Kun `v4/app.js`. Ingen CSS-endringer (`.uke-label` er allerede klar).
Ingen DB-endringer. Ingen edge-function-endringer.

- [x] **Delsteg 1 — «Uke»-etikett i navigasjonsrad (student + lærer)**
  - `renderElevView` (~linje 1129): legg til `el('span', { class: 'uke-label' }, 'Uke ')` rett FØR `weekInput` i `navRow.appendChild`-rekkefølgen.
  - `renderMinKlasseTab` (~linje 1594): samme.
  - `renderElevView`: endre knapptekst «← Forrige uke» → «← Forrige» og «Neste uke →» → «Neste →» (konsekvent med lærervisningen; «Uke»-etiketten er nå synlig ved siden av inputen).
  - Resultat: `← Forrige  Uke [9]  Neste →  Nå`

- [x] **Delsteg 2 — Ukenummer i admin skolerute-liste + ny-hendelse-modal**
  - Ekstraher `ukeTekst(fra, til)`-logikken fra `visSkoleruteForhandsvisning` (linje 4113–4118) til en frittstående hjelpefunksjon på modulnivå (bruker eksisterende `getISOWeek`).
  - `renderSkolerute` (~linje 3970): erstatt dato-spennet med «uke X · DD.MM – DD.MM» i `tekst-svak`-spennet — uke foran dato som hjelpeinfo.
  - `visNySkolerute` (~linje 4052–4060): legg til et live `span.tekst-svak` under dato-radene som oppdateres på `onchange` for fra/til og viser f.eks. «uke 7» eller «uke 6–8».

- [x] **Delsteg 3 — Ukenummer i flerdagsarrangementer (klasse-admin)**
  - `renderKlasseAdminInnhold` (~linje 2660): endre `${e.title} (DD.MM – DD.MM)` til `${e.title} · uke X (DD.MM – DD.MM)` ved bruk av `ukeTekst` fra delsteg 2.

- [x] **Delsteg 4 — Bump, commit og push**
  - Bump `?v=YYYYMMDDx` i `v4/index.html`.
  - Commit per delsteg, push til `claude/P2-ukenummer-ui`.
  - Ingen manuelle steg i Supabase.

---

## Status: FULLFØRT — Admin navngiving av parti og grupper
## Neste steg: Migrasjon 017 (Plan_YFF) — venter på bruker

---

### Runde: Admin navngiving av parti og grupper (i Fag-fanen)

**Scope:** Kun `v4/app.js` (og evt. `v4/style.css`). Ingen DB-endringer —
`subject_divisions.name` finnes allerede og lagres/leses av eksisterende kode.

**Svar på spørsmål fra bruker:**

**1. Avkryssingsboksen øverst i dag-kolonnen (lærervisning «Min klasse»)**
Antagelsen stemmer ikke helt. Det finnes _ingen_ per-dag «velg alle»-boks øverst
i dag-kolonnen. Checkboxene (`session-cb`, `app.js:1646`) sitter på _hvert enkelt
økt-kort_. Når én eller flere er huket av, vises en `bulk-bar` (`app.js:1596`)
øverst i uke-området med tre knapper: «Rediger valgte», **«Kopier valgte»**
(→ `visBulkKopierModal`), og «Slett valgte». Det som kan se ut som «en boks
øverst i kolonnen» er rett og slett checkbox på det _første_ kortet i kolonnen.

**2. «P1/P2/Gruppe 1/Gruppe 2» — autogenererte standardnavn?**
Navnene er eksplisitt satt i migrasjonene:
- `013_testdata_2526.sql:231–250`: `'P1'`, `'P2'`, `'Gruppe 1'`, `'Gruppe 2'`
- `014_import_npt_2526.sql:86–88`: `'P1'`, `'P2'`
De lagres i `subject_divisions.name` og vises direkte på økt-kort via
`s.subject_divisions.name` (`app.js:1214`).
Det fins _ingen_ admin-UI i Fag-fanen (`visRedigerFagModal`, `app.js:3199`)
for å navngi inndelinger. En liten editor eksisterer i lærerens Klasse-admin-tab
(`app.js:2604–2620`), men ikke i admin-panelet.

**Planlagte delsteg:**

**Delsteg 1 — Navnefelt for inndelinger i `visRedigerFagModal`** [x]

Når «Inndeling» er satt til parti eller gruppe, og faget allerede er lagret
(`subj != null`), vises en liste over eksisterende `subject_divisions` med
redigerbare navnefelt (ett per rad). Admin kan:
- Redigere navn direkte i tekstfeltet (auto-lagres på «Lagre»-klikk i
  modal-formen, eller med dedikert 💾-knapp per rad).
- Se antall inndelinger vs `max_divisions`.

Implementasjonsvalg:
- Etter lagring av fagdata (`subjects.update/insert`) og før `modal.remove()`:
  kjør én `subject_divisions.upsert`-løkke for alle navnefelt i formen.
- Ved _nytt_ fag (insert): opprett `subject_divisions`-radene med auto-genererte
  navn (`P1`/`P2`/... eller `Gruppe 1`/`Gruppe 2`/...) basert på `max_divisions`,
  slik at de er redigerbare ved neste åpning.
- Håndter endring av `max_divisions`: legg til manglende rader (insert) og
  soft-delete overskytende (sett `deleted_at`).

**Delsteg 2 — Bruk admin-satte navn konsekvent** [x]

Verifiser at alle steder som viser `subject_divisions.name` bruker verdien
direkte (ikke harde strenger). Per kodegjennomgang er dette allerede korrekt:
- Økt-kort: `s.subject_divisions.name` (`app.js:1214`) ✓
- Eksport CSV: `s.subject_divisions.name` (`app.js:3107`) ✓
- Divisjonsvelger i ny/rediger/kopier-modal: `d.name` (`app.js:1972`, `2069`,
  `2182`) ✓
- Elevfilter: `s.subject_divisions?.name` (`app.js:965`) ✓
Ingen endringer nødvendig her — delsteget er en verifisering.

**Delsteg 3 — Bump, commit og push** [x]
- Bump `?v=YYYYMMDDx` i `v4/index.html`.
- Commit og push til `claude/determined-hypatia-58bo4x`.

---

## Status: FULLFØRT — Parti/gruppe-styring (frontend)
## Neste steg: Avventer

---

### Runde: Parti/gruppe-styring i frontend

**Forutsetning:** Migrasjon 017 er kjørt (class_id på subject_divisions,
session_divisions-tabell, oppdatert RLS). sessions.division_id beholdes
men utfases gradvis — session_divisions er ny primærkilde.

**Scope:** `v4/app.js`, `v4/style.css`. Ingen ny migrasjon, ingen edge-function-endringer.

**Modell (fra migrasjon 017):**
- GRUPPE: class_id IS NULL, admin eier → administreres i admin-panelet
- PARTI: class_id IS NOT NULL per klasse, kontaktlærer/admin eier → administreres i klasse-admin-fanen

---

**Delsteg 1 — Admin fag-panel: vis kun grupper** [x]

`renderKlasseAdminInnhold()` henter i dag alle divisjoner for et fag.
Etter 017 finnes det to typer:
- Grupper (class_id IS NULL) — admin eier
- Partier (class_id IS NOT NULL) — kontaktlærer eier, vises ikke her

Endringer:
- Legg til `.is('class_id', null)` i subject_divisions-spørringen
- Overskrift endres fra «Inndelinger» til «Grupper»
- Insert legger IKKE til class_id (null er korrekt for grupper)
- Kolonnene division_type og sort_order settes riktig ved insert
  (grupper bruker `division_type = 'gruppe'`)

---

**Delsteg 2 — Kontaktlærer: administrer partier i klasse-admin-fanen** [x]

Ny seksjon i `renderKlasseAdminTab` (lærervisning → klasse-admin):
- Vises kun for fag der `has_parti = true` og kontaktlærer har `is_contact_teacher_for(klasse.id)`
- Henter partier for klassen: `.eq('division_type', 'parti').eq('class_id', klasse.id)`
- Rad per parti: navn-input + lagre-knapp + slett-knapp (soft-delete)
- «+ Legg til parti»-knapp: oppretter ny rad med class_id = klasse.id,
  division_type = 'parti'
- Ingen type-prompt (alltid parti i denne seksjonen)
- Admin ser samme seksjon for alle klasser

---

**Delsteg 3 — Session-modaler: flervalg av divisjoner** [x]

`visNyOktModal`, `visRedigerOktModal`, `visKopierOktModal`:

*Henting:*
- Spørringen henter: grupper (class_id IS NULL) + partier for den aktuelle klassen
  `.or('class_id.is.null,class_id.eq.<klasse_id>')`
- Sortert: partier først (per klasse), deretter grupper

*UI:*
- Erstatt `<select>` med checkboxes (én per divisjon, gruppert: «Partier» / «Grupper»)
- Vises kun når faget har divisjoner
- Ingen obligatorisk valg — alle ukrysset = «hele klassen»

*Lagring:*
- `division_id` settes til null (multi-select → enkeltkolonne utfases)
- Etter session er lagret: slett alle rader i session_divisions for session_id,
  deretter insert de valgte divisjonene
- Ved redigering: samme mønster (slett gammel kobling, insert nye)

---

**Delsteg 4 — Session-spørringer og visning: bruk session_divisions** [x]

Berører: `renderElevView`, `renderMinKlasseTab`, `renderAlleOkterTab`,
`eksporterSkolear`.

*Spørring (ny form):*
```js
.select('*, subjects(name,color_hex,short_code), users!teacher_id(full_name), session_divisions(division_id, subject_divisions(name,division_type))')
```
(Fjerner den direkte `subject_divisions(...)`-embeddingen via division_id.)

*Filtrering i elev-view:*
```js
const sdIds = new Set((s.session_divisions || []).map(sd => sd.division_id))
daySessions = daySessions.filter(s =>
  sdIds.size === 0 || [...valgteDivisjoner].some(id => sdIds.has(id)))
```

*Badge-visning:*
- Erstatt enkelt `div-badge` med liste av badges, én per divisjon i session_divisions
- Tom session_divisions → ingen badge (gjelder hele klassen)

*Export:*
- Divisjoner concatenert med komma: «Parti: P1, Parti: P2» eller «Gruppe: G1»

---

**Delsteg 5 — Bump, commit og push** [x]
- Bump `?v=20260616a` i `v4/index.html`
- Commit per delsteg
- Push til `claude/sweet-fermi-1l3uqy`
- Ingen manuelle steg i Supabase

---

## Status: FULLFØRT — Elevfilter for parti og grupper
## Neste steg: Migrasjon 017 (Plan_YFF) — venter på bruker

### Runde: Elevfilter for parti og grupper

**Scope:** `v4/app.js`, `v4/style.css`, `v4/supabase/functions/ical/index.ts`.
Ingen DB-endringer (verifisert: `division_id` finnes allerede på `sessions`).

**Funn under kodegjennomgang:**
- Det finnes allerede en enkel dropdown-filter i `renderElevView` (linje 1030–1049),
  men den er defekt: bruker `.eq('subjects.class_id', klasse.id)` — `subjects` har
  ingen `class_id`-kolonne, så panelet vises aldri. Den fjernes og erstattes.
- Filterlogikken skjuler feil: `division_id === aktivFilter` skjuler NULL-sessions.
  Riktig regel er: NULL = alltid vis; divisjon = vis kun valgte.
- iCal-funksjonen mangler CORS-headere og OPTIONS-handler — legges til i deloppgave 3.
- Print-CSS: `.filter-bar` er allerede skjult ved print. Nytt panel får eget navn
  (`.elev-filter-panel`) og legges i print-utlisten.

---

**Delsteg 1 — Filter-UI i elevvisningen** [x]

_Layout-beslutninger (godkjent):_
- **Badge** i nav-baren etter «Nå»: viser `● Filtrert: P1` (eller lignende) når
  filter er aktivt; nøytral/skjult ellers. Klikk åpner/lukker filterpanelet.
- **Filterpanelet** som egen rad rett under nav-baren; **kollapset som standard**.
  Åpnes/lukkes av badge-knappen. Tar ingen plass når ubrukt.
- **`[...]`-knapp** i nav-baren (etter badge) erstatter frittstående
  «Skriv ut»- og «iCal»-knapper. Åpner liten dropdown med to valg:
  «🖨️ Skriv ut» og «📅 iCal-abonnement». Lukkes ved klikk utenfor.
  Begrunnelse: print/iCal er sjeldne engangshendelser; badge er hyppig →
  badge beholder linje 1 på alle skjermstørrelser.

_Implementasjon:_
- Hev `aktivtSkolear` ut av `renderUke` og inn i `renderElevView`-scope.
- Etter at `klasse` er bekreftet: hent distinkte `subject_divisions` som faktisk
  forekommer i klassens sessions (aktiv skoleår, `division_id IS NOT NULL`).
  Grupper per fag (`subjects.name`).
- Hent filter fra localStorage, nøkkel `ukeplan_elevfilter_<klassenavn>`.
  Format: JSON-array av valgte division-UUIDs, tom array = vis alt.
- Opprett `#elev-filter`-container (utenfor `#week-container`), inneholder:
  - Skjult filterpanel (`.elev-filter-panel`, `display:none` som standard).
  - Panelet vises kun dersom klassen faktisk har delte fag.
  - Sjekkbokser gruppert per fag: «NPT: ☑ P1 ☑ P2   NNA: ☐ G1 ☐ G2».
  - «Vis alt»-knapp i panelet som nullstiller alle valg.
  - Endring lagrer til localStorage og kaller `renderUke(currentWeek)`.
- **Fjern** gammel defekt `filter-bar`/`filterSel` fra `renderUke` (linje
  1030–1049) — slettes helt, ingen videreføring.
- Legg badge-knapp og `[...]`-knapp inn i nav-baren i `renderUke` (etter Nå).
  `[...]`-dropdown: absolutt-posisjonert under knappen, to lenker/knapper,
  lukkes ved `click`-event utenfor.
- Endre filterlogikk i `renderUke`:
  ```js
  if (valgteDivisjoner.size > 0) {
    daySessions = daySessions.filter(s =>
      s.division_id === null || valgteDivisjoner.has(s.division_id))
  }
  ```
- `style.css`: legg til `.elev-filter-panel` (flex, flex-wrap, kompakt padding),
  `.elev-filter-badge` (liten farget badge), `.elev-overflow-menu`
  (absolutt-posisjonert dropdown); legg `.elev-filter-panel` og
  `.elev-overflow-menu` i print-skjullisten.

**Delsteg 2 — Utskrift** [x]
- Filtrering skjer i DOM (sessions som ikke rendres, finnes ikke i DOM) →
  print viser automatisk kun filtrerte sessions.
- Oppdater `utskrift-hode`-teksten med «(filtrert)» når filter er aktivt.
- Verifiser at print-CSS ikke synliggjør skjulte kort.

**Delsteg 3 — iCal (filtrert lenke)** [x]
- `visICalModal(klasse)`:
  - Les filter fra localStorage for klassen.
  - Legg til `&divisions=<id1>,<id2>,...` i iCal-URL når filter er aktivt.
  - Vis informasjonstekst: «Lenken er filtrert til dine parti/grupper. Hent ny
    lenke her hvis du endrer filteret.»
  - Fjern teksten (og `&divisions`-parameteren) når ingen filter er satt.
- `ical/index.ts`:
  - Legg til CORS-konstant og OPTIONS-handler (mangler i dag).
  - Legg til `division_id` i sessions-select.
  - Les ny `divisions`-param (kommaseparerte UUIDs).
  - Filterlogikk: `divisions` tom → vis alt; ellers NULL = alltid med,
    ellers kun der `division_id` er blant valgte.
  - Bakoverkompatibel: gamle `parti`/`gruppe`-params beholdes uendret.

**Delsteg 4 — Bump, commit og push** [x]
- Bump `?v=20260614e` i `v4/index.html`.
- Commit per delsteg, push til `claude/adoring-darwin-8qet33`.
- **Manuelt steg (ikke automatisert):** iCal edge-funksjon må deployes
  manuelt i Supabase Dashboard → Edge Functions → ical → Code → Deploy.

---

## Status: FULLFØRT — fridager/flerdagshendelser i ukenettet (UI-runde)

### Runde: Ny visning av skolerute og flerdagshendelser i ukenettet

**Scope:** Kun frontend — `v4/app.js` og `v4/style.css`. Ingen DB-endringer.

**Delsteg 1 — Fjern topbannerne** [x]
- Fjernet blokk i `renderElevView` (linje ~1027–1043) som rendret
  `ferie-banner` og `fdag-banner` over ukenettet.

**Delsteg 2 — Bedre fridagsfarge (style.css)** [x]
- `--fridag-bg: #FAEEDA` og `--fridag-tekst: #633806` lagt til i `:root`.
- `.day-col--holiday` får nå `background: var(--fridag-bg)`.
- `.dag-tittel` og `.holiday-label` bruker `var(--fridag-tekst)`.

**Delsteg 3 — Flerdagsbjelke-rad øverst i ukenettet** [x]
- Ny CSS: `.fdag-bjelke-rad` (5-kol grid, mobilfallback: flex-col)
  og `.fdag-bjelke` med fridag-farger og `grid-column: X / Y`.
- Ny hjelpefunksjon `renderFlerdagsBjelkeRad` beregner kolonne-span
  og returnerer DOM-element (null om tom).
- `renderElevView`: query fikset med `or(class_id.eq.X,class_id.is.null)` +
  `school_id`/`deleted_at`-filter; bjelke-rad satt inn over grid.
- `renderMinKlasseTab`: lagt til henting av calEvents og multiDayEventsL,
  datoer vist i dag-tittel, holiday-labels i kolonner, bjelke-rad over grid.

**Delsteg 4 — Bump `?v=`, commit og push** [x]
- Bumped til `?v=20260614b` i `v4/index.html`.
- Commit og push til `claude/modest-clarke-dukmy0`.

---

## Status: FULLFØRT — import av ekte produksjonsdata 25/26 (NPT/NNA/Naturfag i basen)
## Merk: Plan_YFF-som-017 ble forlatt — 017 ble i stedet 017_parti_per_klasse.sql.
##       «curl hentAlle»-ruten ble forlatt — ekte data kom inn via 014–016 (ark for ark).

Bruker limer inn ark for ark fra dagens løsning; hvert ark blir en
import-migrasjon som soft-sletter de syntetiske øktene for faget og
setter inn de ekte radene. Lærermapping på fornavn mot
users.full_name; umatchede navn får fallback-eier + «[Lærer: X]» i
info, og re-kjøring etter brukeroppretting mapper riktig.

- [x] `014_import_npt_2526.sql` — Plan_NPT (111 økter, parti p1/p2,
      lærere Mari/Cathrine/Olav/Torill/Geir/Alle).
- [x] `015_import_nna_2526.sql` — Plan_NNA (40 økter, torsdager,
      lærer Oddvar; uke 25-raden er utenfor visningen uke 33–24).
- [x] `016_import_fag_2526.sql` — Plan_Fag (34 Naturfag-økter,
      tirsdager, lærer Willy; fag-kolonnen mappes mot subjects).
- [x] Verifisert lokalt mot PostgreSQL 16: mapping, fallback,
      re-kjøring etter brukeroppretting, soft-delete av syntetiske.
- [x] Avklart med bruker: ingen lærerbrukere opprettes — alle ekte
      økter eies av brukerens egen konto (fallback), lærernavn
      bevares i info som «[Lærer: X]». Re-kjøring mapper riktig om
      brukere opprettes senere.
- [x] MANUELT: 014, 015 og 016 kjørt i SQL Editor (bekreftet av
      bruker 12.06.2026).
- [x] ~~(Venter på bruker) Plan_YFF — limes inn på samme måte og blir
      migrasjon 017.~~ FORLATT: Plan_YFF ble ikke importert som 017.
      Nummer 017 ble i stedet brukt til `017_parti_per_klasse.sql`
      (parti per klasse + session_divisions). Syntetiske fag uten ekte
      motpart (norsk, matte, engelsk, kroppsøving + ev. YFF) beholdes
      inntil videre.

Mål: gi v4 et fullt datasett å jobbe med for 25/26. Ekte data fra
produksjonen (Google Sheets via Apps Script) kunne ikke hentes fra
skymiljøet (nettverkspolicyen blokkerer script.google.com), så runden
leverer realistisk seed-data i stedet. Bruker leverer ev. ekte
`hentAlle`-JSON senere — da konverteres den i en egen runde.

- [x] Migrasjon `012_kalendertyper.sql`: live-enumen hadde fortsatt
      001-verdiene (ferie|fridag|annet) — oppdaget ved at 013 feilet i
      SQL Editor. Gjenskaper calendar_type_enum med
      ferie|helligdag|planleggingsdag|annet ('fridag'-rader →
      'helligdag'); rename→create→konverter→drop fordi ADD VALUE ikke
      kan tas i bruk i samme transaksjon.
- [x] Seed-migrasjon `013_testdata_2526.sql`: skolerute 25/26
      (riktige datoer for ferier/høytider), fag NPT (parti P1/P2),
      NNA, YFF (gruppe 1/2) + fellesfag, økter for hele skoleåret
      (uke 33–24, hopper over fridager), flerdagshendelser og
      funfacts. Idempotent — kan kjøres flere ganger.
- [x] CLAUDE.md: migrasjonsliste oppdatert med 012 og 013.
- [x] Begge migrasjoner verifisert lokalt mot PostgreSQL 16 med
      live-speilet skjema (gammel enum), kjørt i én transaksjon som
      SQL Editor gjør.
- [x] MANUELT: 012 og 013 kjørt i Supabase SQL Editor (bekreftet av
      bruker 12.06.2026).
- [x] ~~(Venter på bruker) Ekte data: kjør
      `curl -sL -X POST '<SCRIPT_URL>' -d '{"action":"hentAlle"}'`
      lokalt og legg JSON-en i repoet — så konverteres den til SQL.~~
      FORLATT: «curl hentAlle»-ruten ble ikke brukt (skymiljøet blokkerer
      script.google.com). Ekte 25/26-data kom i stedet inn ark for ark via
      `014_import_npt`, `015_import_nna` og `016_import_fag` (alle kjørt).

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

---

## Status: FULLFØRT — Skolerute per skoleår i admin-fanen
## Neste steg: Migrasjon 017 (Plan_YFF) — venter på bruker

### Runde: Skolerute per skoleår (velger + filtrering + AI + erstatt)

**Scope:** Kun frontend — `v4/app.js`. Ingen DB-endringer, ingen edge-function-endringer.

**Verifisert:** `ai-parse-skolerute` tar allerede imot `school_year` i request-body
(linje 184: `const { text, school_year } = await req.json()`). Ingen redeploy nødvendig.

**Delsteg 1 — Årvelger i `renderSkolerute`** [x]
- Legg til `let valgtSkolear = APP.school?.active_school_year` utenfor `refresh`-funksjonen
  (beholdes mellom re-renders).
- Legg en `<select>`-velger med to options øverst i `wrap`: aktivt år (forvalgt) og neste år
  (alltid synlig — ikke begrenset til 17. mai-vinduet).
- `onchange` på velgeren setter `valgtSkolear` og kaller `refresh()`.
- Bannerteksten viser `valgtSkolear` (ikke hardkodet aktivt år).

**Delsteg 2 — Filtrert liste** [x]
- DB-spørringen i `refresh()` filtreres til valgt årsintervall:
  `.gte('start_date', intervall.fra).lte('start_date', intervall.til)`,
  der `intervall = skoleaarIntervall(valgtSkolear)`.
- Ingen endring i DB — kun klientsidefiltrering via spørringsparameter.

**Delsteg 3 — AI-import sender valgt år** [x]
- I `sb.functions.invoke('ai-parse-skolerute', ...)`: bytt `school_year: sy`
  til `school_year: valgtSkolear` (ca. linje 3698 i nåværende kode).
- Feiltekst «Aktivt skoleår mangler» erstattes med «Skoleår mangler».

**Delsteg 4 — `visSkoleruteForhandsvisning` tar valgt år som parameter** [x]
- Endre signatur til `visSkoleruteForhandsvisning(events, warnings, onSave, skolear)`.
- `const sy = skolear || APP.school?.active_school_year` — bakoverkompatibel.
- Tittel (`Forhåndsvisning – skolerute ${sy}`), erstatt-tekst og erstatt-intervall
  bruker nå `sy` (valgt år i stedet for alltid aktivt).
- Kallet i `renderSkolerute` oppdateres med `valgtSkolear` som fjerde argument.

**Delsteg 5 — `visNySkolerute` tar valgt år + advarsel utenfor intervall** [x]
- Endre signatur til `visNySkolerute(onSave, skolear)`.
- Live-advarsel (ikke hard blokkering) under dato-radene dersom fra-dato er
  utenfor `skoleaarIntervall(skolear)`: «NB: Datoen er utenfor skoleåret XX/YY».
- Advarsel oppdateres på `onchange` på fra-dato-feltet.
- Kallet i `renderSkolerute` oppdateres til `visNySkolerute(refresh, valgtSkolear)`.

**Delsteg 6 — Bump `?v=`, commit og push** [x]
- Bump cache-busting til `?v=20260614c` (eller høyere) i `v4/index.html`.
- Commit per delsteg etter hvert som de fullføres.
- Push til `claude/brave-ptolemy-mshpbz`.
- Manuelle steg: **ingen** — ingen migrasjon, ingen redeploy.

---

## Arkiv: fullførte runder

### Brukervennlige AI-varsler i skolerute-import (fullført 12.06.2026)
- Prompten i `ai-parse-skolerute` fikk egen VARSLER-seksjon: varsler
  skrives i klarspråk for lærere — kun hva som ble observert i
  teksten, aldri feltnavn (week_nr o.l.), JSON, null eller «reglene»
  (riktig/galt-eksempel ligger i prompten).
- Sikkerhetsnett i app.js: `rensVarsel()` fjerner setninger som nevner
  `week_nr` før visning i skolerute-forhåndsvisningen (AI-output er
  ikke garantert). Dekker bevisst kun `week_nr` inntil videre.
- Cache-busting bumpet til `20260612b`. Manuelt steg utført:
  `ai-parse-skolerute` re-deployet i Supabase Dashboard 12.06.2026.

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

---

## Backlogg

### Backlogg: Admin bulk-utvalg på tvers av alle læreres økter

**Idé:** I lærervisningen kan en lærer i dag bare krysse av (bulk-velge) sine
egne økter — riktig for en lærer. Vurder om **admin** skal kunne bulk-velge
ALLE økter i en klasse/uke, ikke bare sine egne, for opprydding og omrokkering
på vegne av skolen.

**Må avklares før bygging:**
- Bekreftelse/sikring: admin som bulk-opererer på andres økter bør ha en tydelig
  bekreftelse (jf. «kollegahjelp»-dialogen for enkeltøkter — kanskje sterkere
  for bulk).
- Angre: bulk-handlinger på tvers er vanskeligere å angre. Vurder mot et
  eventuelt fremtidig trash/undo-system.
- RLS: krever policy som lar `is_active_admin()` velge/endre alle økter i egen
  skole.

**Status:** Egen oppgave. Tas etter at elevfilter + admin-navngiving av
parti/grupper er ferdig. IKKE bland inn i den pågående elevfilter-sessionen.

### Backlogg: Felles lagre-knapp for inndelingsnavn (grupper/partier)

I dag har hver navnerad i admin-panelets Fag-fane sitt eget 💾 — lett å glemme,
endringer går tapt i stillhet. Erstattes med én felles «Lagre»-knapp for alle
navnefeltene: passiv/deaktivert som standard, aktiveres når ett eller flere
felt er endret, lagrer alle endrede rader i ett trykk. Slett per rad virker
umiddelbart som i dag. Samme mønster vurderes for parti-editoren i
klasse-admin-fanen (identisk rad-oppsett). Ingen DB-endring nødvendig.

**Status:** Egen oppgave senere. Ikke bygg nå.
