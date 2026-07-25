Se PROSEDYRER.md for oppstarts- og avslutningsrutiner.

# Ukeplan1E – Prosjektbeskrivelse for Claude

Se FUNKSJONELL-BESKRIVELSE.md for hva tjenesten skal gjøre funksjonelt.

## Hva er dette?
Ukeplan v4 er en norsk ukeplantjeneste, skolenøytral og åpen for flere skoler
(hver skole adskilt). Første skole i bruk: Øksnevad videregående skole (Rogaland).
Lærere planlegger undervisningsøkter per klasse/uke. Elever ser sin klasses plan.
Admins administrerer skolen, fag, klasser, brukere og skoleruten.

Dagens løsning i bruk: ukeplan1e.ganddal.net (fryst). Ny løsning under utvikling: /v4/.

## Arbeidsrutiner (VIKTIG)
- PRODUKSJON I AKTIV BRUK — fryst: rotfilene `index.html`, `CNAME`,
  `appsscript.gs`, `logo.png` samt mappene `info/` (bruksanvisning, lenket
  fra produksjonsmenyen) og `dev/` (testmiljø for dagens løsning) er fredet
  og skal ALDRI endres. Eneste redigerbare områder: `v4/`, `CLAUDE.md`
  og `PLAN.md`.
- Ved større oppgaver: skriv plan til `PLAN.md` (med avkrysningsbokser)
  før koding starter, og vent på godkjenning.
- Etter hvert fullført delsteg: kryss av i `PLAN.md` og oppdater «Neste steg».
- Ved JS/CSS-endringer: bump alltid `?v=YYYYMMDDx` i `v4/index.html`.
- Commit etter hver fullførte deloppgave, med beskrivende melding.
- Hold deg til oppgavens omfang — ikke endre kode utenfor det som er avtalt.
- **Sjekkliste-lukking er del av økten, ikke oppfølging** — PLAN.md sin
  sjekkliste og statuslinje skal krysses av / oppdateres til «verifisert»
  FØR økten regnes som avsluttet, i samme commit/økt som koden merges til
  main. En PR skal aldri merges med sjekklistepunkter hengende uavkrysset
  uten at det er eksplisitt begrunnet (f.eks. et punkt som ikke kan testes
  før en fremtidig dato). Dette hindrer at dokumentasjonen sier noe annet
  enn hva som faktisk er verifisert i produksjon.

## Fast prosedyre for hver Code-økt
- **Kjør `git fetch` FØR du sammenligner mot eller brancher fra origin/main.**
  Arbeidsmiljøet starter ofte med utdatert remote-tracking; konklusjoner om hva
  origin/main inneholder må tas etter fetch, aldri før. (Dette har skapt falske
  «feil repo»/«divergens»-alarmer flere ganger.)
- **Neste plan-nummer leses fra PLAN.md** — aldri anta eller hardkod. Code finner
  selv neste ledige PN ved oppstart.
- **Avslutt hver økt med en kort oppsummering** (norsk, ikke-teknisk) som Morfar kan
  lime tilbake til planleggingschatten. Oppsummeringen skal alltid inneholde: hva ble
  gjort, hvilket PN-nummer og branch som ble brukt, og hva som eventuelt gjenstår.

## Teknisk stack
- **Frontend**: Vanilla JS (ingen rammeverk), én fil: `v4/app.js` (~4000 linjer)
- **CSS**: `v4/style.css`
- **HTML**: `v4/index.html` (cache-busting via `?v=YYYYMMDDx` — bump ved hver endring)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Edge Functions**: Deno/TypeScript i `v4/supabase/functions/`
- **AI**: Gemini 2.5 Flash via REST API (nøkkel: `GEMINI_API_KEY` i Supabase Secrets).
  Kallmønsteret (retry ved 503/429, thought-filtrering, feilhåndtering) er portet fra
  `kallGemini_` i appsscript.gs og ligger som identisk `kallGemini`-hjelpefunksjon i
  alle tre AI-edge-functions (én fil per funksjon pga. manuell deploy i Dashboard).

## Filstruktur

```
BACKLOGG-UX-MOBIL.md              # UX/mobil-backlogg (egen fil; Backlogg-seksjonen i PLAN.md peker hit)
v4/
  app.js                          # All frontend-logikk
  style.css
  index.html
  uno-footer.js                   # Uno-logo + © årstall i footeren (selvstendig, lastes fra index.html; fra PR #88, før P-nummereringen)
  unoicon.png                     # Favicon (index.html + fallback i app.js når skolen mangler logo)
  supabase/
    migrations/                   # SQL-migrasjoner (kjøres manuelt i Supabase SQL Editor)
      001_initial_schema.sql
      002_rls.sql
      003_cleanup_cron.sql
      004_school_year.sql         # Skoleår-støtte (KJØRT)
      005_test_sessions.sql       # Testdata (KJØRT)
      006_fix_school_facts_rls.sql # school_facts RLS-fix (KJØRT)
      007_sporbarhet.sql          # created_by/last_modified_by (KJØRT)
      008_kollegahjelp.sql        # Lærer kan endre andres økter (KJØRT)
      009_rollegrenser.sql        # Maks 2 admin / 3 kontaktlærere + RLS-fix (KJØRT)
      010_fellesokter.sql         # shared_group_id for fellesundervisning (KJØRT)
      011_softdelete_facts_kalender.sql # created_at/deleted_at på school_facts, deleted_at på school_calendar, purge-utvidelse (KJØRT)
      012_kalendertyper.sql       # calendar_type_enum → ferie|helligdag|planleggingsdag|annet ('fridag'-rader blir 'helligdag')
      013_testdata_2526.sql       # Testdata: komplett skoleår 25/26 (skolerute, fag m/parti+gruppe, økter uke 33–24) — idempotent, krever 012
      014_import_npt_2526.sql     # Ekte NPT-plan 25/26 fra prod (erstatter syntetiske NPT-økter; lærermapping på fornavn)
      015_import_nna_2526.sql     # Ekte NNA-plan 25/26 fra prod (samme mønster som 014)
      016_import_fag_2526.sql     # Ekte fellesfag-plan 25/26 fra prod (Plan_Fag; kun Naturfag, mapper fag-kolonne mot subjects)
      017_parti_per_klasse.sql    # Parti per klasse: session_divisions-koblingstabell + subject_divisions per klasse (KJØRT)
      018_admin_additiv.sql       # Admin som additivt flagg: is_admin-kolonne, auth_is_admin()-helper, RLS-oppdatering (KJØRT)
      018_funfacts_view_count.sql # view_count for funfacts-rotasjon + increment_fact_view()-funksjon (KJØRT)
      019_admin_panel_rls.sql     # RLS-fix: adminpanel-skriving tillatt med auth_is_admin() uten toggle (KJØRT)
      020_storage_policy_logos.sql # Storage-policies for logos-bucketen: INSERT/UPDATE/DELETE (admin) + SELECT (public) (KJØRT)
      021_funfacts_tema.sql       # facts_theme-kolonne på schools: fritekst temastyring for funfacts (P41)
    functions/
      ical/                       # iCal-abonnement for klasser/lærere
      generate-facts/             # Generer funfacts med Gemini
      ai-parse-sessions/          # Importer økter fra tekst med AI
      ai-parse-skolerute/         # Importer skolerute fra tekst med AI
      create-user/                # Opprett bruker (admin)
      admin-user/                 # Admin-brukeroperasjoner
      cleanup/                    # Periodisk rydding
```

## Router (hash-basert)

```
#/                    → elevvisning (velg klasse fra liste)
#/klasse/:navn        → elevvisning for spesifikk klasse
#/login               → innlogging
#/laerer              → lærervisning (tabs: klasse, alle, søk, klasse-admin, innstillinger)
#/laerer/:tab         → direkte til tab
#/admin               → adminpanel (tabs: skoleinfo, skolear, fag, klasser, brukere, skolerute, funfacts)
#/admin/:tab          → direkte til tab
```

## APP-objekt (global state)

```js
APP = {
  user: null,              // Supabase auth user
  profile: null,           // { id, full_name, role, is_admin_active, school_id, ... }
  school: null,            // { id, name, active_school_year, color_theme, logo_file_path, ... }
  facts: [],               // Funfacts for scrollende banner
  currentView: null,       // 'elev' | 'laerer' | 'admin'
  currentKlasse: null,     // Klassenavn (string) i elevvisning
  realtimeChannel: null,
  renderToken: 0,
  isAdminActive: false,
  klasseVelger: null,      // { klasser, aktivKlasse, onChange } – satt av renderMinKlasseTab
  laererCtx: {...},        // P21: bevarer { klasseId, klasseNavn, week, skolear, tab } gjennom
                           // admin-/elevvisning-toggle. Lærervisningen skriver, re-render seeder.
  elevPeekWeek: null,      // P21: transient uke for lærer-peek av elevvisning (leses én gang)
}
```

### Bevaring av kontekst ved toggling (P21)
`APP.laererCtx` holder hvor læreren var (klasse + uke + skoleår + fane) gjennom hele
sesjonen. `renderLaererView` seeder `aktivKlasse` fra `laererCtx.klasseId`,
`renderMinKlasseTab` seeder uke/skoleår — og begge skriver tilbake ved endring.
Admin-toggle (`toggleAdminModus` → `router()`) bevarer dermed klasse + uke automatisk
(P10 intakt: ingen navigasjon). Elevvisning-toggelen åpner `#/klasse/<klasse>` og setter
transient `APP.elevPeekWeek` (renderElevView leser den ÉN gang og nuller den, så
elev-lenker `#/klasse/X` forblir rene/på «nå»-uka). Admin- og Elevvisning-knappene er
alltid synlige samtidig for innlogget admin (symmetrisk synlighet i `oppdaterHeader`).

## Viktige invarianter / fallgruver

### Init-rekkefølge (KRITISK)
`router()` kalles FØR profil og skole er lastet. `renderLaererView` og `renderAdminPanel`
sjekker `if (!APP.profile || !APP.school) { vis "Laster…"; return }` — re-render skjer
automatisk når data er lastet. Endre ALDRI rekkefølgen i `init()` uten å teste refresh.

### Cache-busting
Bump `?v=YYYYMMDDx` i `index.html` (både CSS og JS) ved HVER endring som skal til prod.
Safari cacher hardt. Bruk hard refresh (Cmd+Shift+R) for å verifisere.

### CDN-vakt
`window.supabase` sjekkes på toppnivå. `defer` på alle script-tagger i index.html.

### Rendertoken-mønster
Brukes i `renderElevView` og `renderMinKlasseTab` (via `ukeRenderToken`) for å unngå
race conditions ved dobbeltkall til async render-funksjoner.

### Uke er primær tidsenhet — UI-prinsipp (P2)
All tidsreferanse i brukergrensesnittet bruker ukenummer som primærenhet.
Dato er alltid sekundær hjelpeinfo. Mønstre som skal følges konsekvent:
- **Navigasjonsrad:** `span.uke-label` («Uke ») + `input.uke-nr-input`
  (tall). Knapper: «← Forrige» / «Neste →» — ikke «Forrige uke».
- **Dag-kolonner:** `.dag-dato` er `display:block` med `opacity:.55` og
  `font-size:.72rem` — på egen linje under dagnavnet, aldri innebygd.
- **Perioder** (skolerute-liste, MDE-lister): `ukeTekst(fra, til)` foran
  dato. Format: «uke 7 · 10.02–21.02».
- **Fridags-toaster:** uke nevnes eksplisitt i meldingen.
  Format: «Vinterferie (uke 7, 10.02–14.02)».
- **Dato-input-modaler** (skolerute + MDE): live `→ uke X`-hint under
  dato-feltene, oppdateres ved `onchange`.
- **Unntak:** `last_modified_at` i sporbarhet — kalenderdato er riktig
  her (redigeringstidspunkt er ikke en skoleuke).

### Uke er primær tidsenhet — AI gjetter aldri årstall
Lærere og elever forholder seg til ukenummer/ukedag; datoer beregnes fra
uke + skoleår. Mønster for alle AI-edge-functions (bygget i
`ai-parse-skolerute`, skal følges ved fremtidige AI-funksjoner):
- Aktivt skoleår sendes i request-body fra app.js og inn i prompten
  (semesterkontekst: uke 33–52 = høstår, uke 1–24 = vårår), med
  eksplisitt forbud mot å gjette andre årstall.
- Har modellen oppgitt ukenummer, beregnes datoene i KODE fra ISO-uke +
  riktig kalenderår (`isoWeekToDate`/`isoWeekOf`/`korrigerAar` i
  edge-funksjonen); uten ukenummer korrigeres feil årstall ut fra
  måneden (aug–des → høstår, jan–jul → vårår).
- Alle korrigeringer og uoverensstemmelser returneres som `warnings`
  (vises i forhåndsvisningen) — aldri stille feil, aldri hard avvisning.
- Varsler skrives i klarspråk for vanlige brukere: kun hva som ble
  observert i teksten — aldri feltnavn (`week_nr` o.l.), JSON, null
  eller referanser til prompt-reglene (egen VARSLER-seksjon i prompten
  med riktig/galt-eksempel). Frontend renser i tillegg setninger som
  nevner `week_nr` via `rensVarsel` som sikkerhetsnett.
- Prompten klassifiserer juleferie og påskeferie som type `helligdag`
  (vises som «høytid» i UI), ikke `ferie`.

### Settings-mønster for innstillings-/profilsider (P23 + P24)
Alle innstillings-/profilsider bruker ett felles, sentrert layout-mønster:
- **`.settings-page`** — sentrert smal spalte (`max-width:680px`,
  `margin-inline:auto`), `position:relative` for «X»-ankring. Full bredde med
  sidemarg på mobil. Variant **`.settings-page--admin`** (`max-width:920px`,
  ingen toppluft reservert til in-page-X) brukes av adminpanelets faner.
- **`.settings-card`** — kort med kant/skygge; én seksjon per kort, `<h3>` som
  korttittel. Egne klasser (rører IKKE `.kort`/`.subj-config-box`, som brukes
  mange andre steder).
- **«X»-lukk** bygges av hjelperen `lagSettingsLukk(klass)`, som ALLTID navigerer
  til lærervisning via fast rute (`#/laerer/<APP.laererCtx.tab || 'klasse'>`) —
  aldri `history.back()`, virker også etter hard refresh. Faller tilbake til
  `klasse` hvis ctx peker på `innstillinger` (Profil selv). Ingen
  bekreftelsesdialog ved ulagrede felt (bevisst — feltene krever eksplisitt
  lagre-trykk). To varianter:
  - **`.settings-close`** (default) — «X» øverst til høyre INNI siden (44×44px),
    for frittstående settings-sider som Profil (der fane-raden skjules).
  - **`.fane-lukk`** (P24) — «X» på PANEL-nivå, ytterst i en fane-rad, for
    fane-paneler som adminpanelet. Synlig på alle faner, lukker hele panelet.
    En in-page-«X» på kun én fane ble feil (jf. DECISIONS P24).
- **Lærer-fane-raden skjules på Profil**: `setTab` i `renderLaererView` toggler
  `.skjult` på `.fane-bar` når `slug === 'innstillinger'`. Admin-panelets EGEN
  fane-rad (`renderAdminPanel`) har i stedet `.fane-lukk`-«X»-en.
- **Adminpanelet (P24):** `renderAdminPanel`→`setTab` legger alle faner i en
  `.settings-page--admin`. Skoleinfo bygger sine egne kort; de øvrige fanene
  rendres UENDRET inn i ett felles `.settings-card` (ingen intern endring av
  fane-funksjonene — lav regresjonsrisiko).
- Referanseimplementasjon: `renderInnstillingerTab` (Profil, `.settings-close`)
  og `renderAdminPanel` (admin, `.fane-lukk` + felles kort). Følg dette mønsteret
  ved nye innstillings-/profilsider.

### RLS-funksjoner i SQL
- `auth_school_id()` — returnerer school_id for innlogget bruker
- `is_active_admin()` — sjekker `is_admin_active = true`
- `is_contact_teacher_for(class_id)` — fra migrasjon 009: slår opp i
  `user_classes` + `users.role` (IKKE `class_contact_teachers`, som
  appen aldri skriver til)
- Policies bruker ofte: `is_active_admin() OR role = 'admin'`
- Fra migrasjon 008: alle innloggede ved samme skole kan oppdatere
  sessions (kollegahjelp — UI viser advarsel); sletting er fortsatt
  begrenset til egne økter / kontaktlærer / admin

## Databaseskjema (referanse)
UUID som primærnøkkel overalt. Soft-delete via `deleted_at`; cron sletter permanent
etter 30 dager.

```
schools          – id, name, logo_url, logo_file_path, school_year_start_week, school_year_end_week, color_theme(standard|lys|mork), active_school_year, facts_theme (fritekst temastyring for funfacts, migrasjon 021)
classes          – id, school_id, name, sort_order, deleted_at
subjects         – id, school_id, name, short_code, color_hex, has_parti, has_gruppe, max_divisions, deleted_at
subject_divisions– id, subject_id, division_type(parti|gruppe), name, sort_order, deleted_at
users            – id (auth.uid), school_id, full_name, role(laerer|kontaktlaerer|admin), is_admin_active, deleted_at
user_classes     – user_id, class_id
sessions         – id, school_id, class_id, subject_id, division_id, week_nr, day_of_week(1-5), teacher_id, activity, meeting_point, info, school_year, version, created_by, last_modified_at, last_modified_by, shared_group_id (fellesundervisning, migrasjon 010), deleted_at, ...
multi_day_events – id, school_id, class_id(null=alle), title, description, start_date, end_date, school_year, deleted_at
school_calendar  – id, school_id, title, start_date, end_date, type(ferie|helligdag|planleggingsdag|annet), deleted_at (migrasjon 011). NB: `helligdag` vises for bruker som «høytid» (kun visningstekst via kalenderTypeNavn — DB-verdien er alltid `helligdag`)
school_facts     – id, school_id, fact_text, view_count (migrasjon 018_funfacts_view_count), created_at, deleted_at (created_at/deleted_at fra migrasjon 011). Pool maks 20 aktive (FUNFACTS_MAKS, P41); eneste genereringsvei er «Forny» i adminfanen (Erstatt alle / Fyll opp med nye via fornyFunfacts + edge function generate-facts med count 1–20)
audit_log, pending_transfers
```

### Kolonnenavn-feller (PostgREST)
- `users`-tabellen bruker `full_name` (ikke `name`)
- `subject_divisions` bruker `division_type` (ikke `type`)
- Ved embedding via FK: bruk `users!teacher_id(full_name)` — sessions har 4 FK-er til users
- Feil kolonnenavn gir 400 for hele spørringen → tom side uten feilmelding

## Skoleår-format
`'YY/YY'` f.eks. `'25/26'` for 2025–2026. Lagres på `schools.active_school_year`,
`sessions.school_year`, `multi_day_events.school_year`.

Hjelpefunksjoner:
- `nesteSkolear(sy)` → neste skoleår
- `erNesteAarVinduApent()` → true fra 17. mai
- `skoleaarKalenderaar(schoolYear, weekNr, startWeek)` → riktig kalenderår over nyttår

## Skolestart/slutt per skoleår
Uke 33–24 (august–juni). `schoolStart = 33`, `schoolEnd = 24`.

## Edge Functions – deployering
Alle funksjoner deployes manuelt via Supabase Dashboard:
Edge Functions → velg funksjon → Code-fanen → lim inn kode → Deploy.

Direkte lenker til kildekode på GitHub (kopier herfra ved deploy):
- [ical/index.ts](https://github.com/b8yxcmzr9w-sketch/Ukeplan1E/blob/main/v4/supabase/functions/ical/index.ts)
- [generate-facts/index.ts](https://github.com/b8yxcmzr9w-sketch/Ukeplan1E/blob/main/v4/supabase/functions/generate-facts/index.ts)
- [ai-parse-sessions/index.ts](https://github.com/b8yxcmzr9w-sketch/Ukeplan1E/blob/main/v4/supabase/functions/ai-parse-sessions/index.ts)
- [ai-parse-skolerute/index.ts](https://github.com/b8yxcmzr9w-sketch/Ukeplan1E/blob/main/v4/supabase/functions/ai-parse-skolerute/index.ts)
- [create-user/index.ts](https://github.com/b8yxcmzr9w-sketch/Ukeplan1E/blob/main/v4/supabase/functions/create-user/index.ts)
- [admin-user/index.ts](https://github.com/b8yxcmzr9w-sketch/Ukeplan1E/blob/main/v4/supabase/functions/admin-user/index.ts)
- [cleanup/index.ts](https://github.com/b8yxcmzr9w-sketch/Ukeplan1E/blob/main/v4/supabase/functions/cleanup/index.ts)

Merk: bruk `/blob/main/`-lenker (direkte til fil), ikke `/tree/`-lenker (mappelisting).

Miljøvariabler settes under: Edge Functions → velg funksjon → Secrets-fanen.
- `GEMINI_API_KEY` — Google AI Studio API-nøkkel (nytt format: starter med `AQ.`)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — automatisk injisert

Alle Edge Functions som kalles fra browser MÅ ha CORS-headers og OPTIONS-handler:
```ts
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  // ...
  return new Response(JSON.stringify(result), { headers: { ...CORS, 'Content-Type': 'application/json' } })
})
```

## SQL-migrasjoner
Kjøres manuelt i Supabase Dashboard → SQL Editor. Aldri via CLI fra denne kodebasen.

## Utviklingsbranch
Hver session jobber på sin egen claude/*-branch.
Merge til main via PR på GitHub: b8yxcmzr9w-sketch/Ukeplan1E.
Merget branch kan slettes etterpå — historikken bevares i main.

## Nøkkelfunksjoner i app.js
| Funksjon | Beskrivelse |
|---|---|
| `router()` | Hash-basert ruting |
| `renderElevView(klasseNavn)` | Elevvisning |
| `renderLaererView()` | Lærervisning med tabs |
| `renderAdminPanel()` | Adminpanel med tabs. P24: alle faner i felles `.settings-page--admin` med kort-ramme + panel-nivå «X» (`.fane-lukk`) i fane-raden |
| `renderMinKlasseTab(container)` | Ukeoversikt for lærer |
| `renderAlleOkterTab(container)` | Lærerens egne økter, gruppert per uke (desktop: rad-basert tett pakking, mobil: kort-liste). Viser også skoleruten (ferie/høytid/planleggingsdag) per uke — inkl. rene ferieuker uten økter. P22: husker øverste uke mellom fanebytter (in-memory `_lastTopWeek` via scroll-spy-observer `_spyObs`) — første åpning i sesjonen → dagens uke, retur fra annen fane → der du slapp; «Nå»-knappen (anker) uendret. |
| `visNyOktModal(...)` | Ny økt-modal |
| `visRedigerOktModal(session, onSave)` | Rediger økt |
| `visKopierOktModal(session, onSave)` | Kopier økt (redigerbar) |
| `visBulkKopierModal(valgte, onSave)` | Bulk-kopi til annen uke |
| `visAIPasteModal(klasse, onSave)` | Importer økter med AI |
| `visElevLenkeModal(klasse)` | Del elevlenke (QR + kopier) |
| `visICalModal(klasse)` | iCal-abonnement modal |
| `oppdaterHeader()` | Oppdater header (skolenavn, skoleår, klasse) |
| `oppdaterKlasseStatisk(navn)` | Oppdater klasse-tekst i header |
| `lagreOkt(id, data, version)` | Optimistisk versjonskontroll |
| `slettOkt(id, onSave)` | Slett økt |
| `eksporterSkolear(school, skolear, format)` | Eksport JSON/CSV/PDF |
| `finnFridag(weekNr, dayOfWeek, schoolYear)` | Skolerute-oppslag; blokkerer økter på fridager |
| `kalenderTypeNavn(t)` | Visningstekst for school_calendar.type (`helligdag` → «høytid») |
| `bekreftKollegahjelp(s)` | Advarsel før redigering av annens økt |
| `merkFellesOkter(sessions)` | Setter `_fellesMed` (klassenavn) på fellesøkter |
| `visSkoleruteForhandsvisning(events, warnings, onSave)` | Redigerbar forhåndsvisning av AI-tolket skolerute før lagring |
| `ukeTekst(fra, til)` | Ukeperiode som tekst: «uke 7» eller «uke 6–8» — bruk alltid foran dato i UI |
| `rensVarsel(tekst)` | Sikkerhetsnett: fjerner setninger med `week_nr` fra AI-varsler |
| `skoleaarIntervall(sy)` | Datointervallet et skoleår dekker (1. aug år1 – 31. jul år2) |
| `showToast(msg, type)` | Toast-melding |
| `medLagreOverlay(fn)` | Vis lagre-overlay under async operasjon |
| `medAIOverlay(tittel, fn)` | «AI jobber»-overlay med roterende funfacts under AI-kall |
| `lagSettingsLukk(klass)` | «X»-lukk for settings-sider; navigerer alltid til lærervisning via fast rute. `.settings-close` (Profil) eller `.fane-lukk` (admin panel-nivå, P24) |
| `el(tag, attrs, ...children)` | DOM-hjelpefunksjon |

## Header-struktur
Viser: `[skoleår] [Skolenavn] [klasse X]` — skoleår og klasse er mindre tekst,
skolenavn dominerer. Klassevelger (select) for lærer med flere klasser ligger
utenfor `<a>`-taggen (for å unngå navigasjon ved klikk).

### Header-toggles: PC i raden, hamburger på mobil (P25)
Headeren er én flex-rad uten `flex-wrap`. «Admin» (`#hdr-admin-toggle`) og
«Lærervisning/Elevvisning» (`#hdr-laerer-btn`) ligger i raden på PC, men ville klippes
på smal mobil. Derfor: de to header-knappene har `.hdr-pc-only` (CSS skjuler `≤700px`),
og hamburgeren (`#hdr-dropdown`) speiler dem på mobil via `#hdr-dd-laerer`/`#hdr-dd-admin`
med `.hdr-mobile-only` (CSS skjuler `≥701px`). Media-queriene er gjensidig utelukkende →
nøyaktig ett sett synlig, ingen blink/duplikat, ingen JS-breakpoint. `oppdaterHeader`
setter tekst/tilstand/`.skjult` på BÅDE settene ut fra samme rolle-/innloggingslogikk
(P21-synlighet); lærer/elev-navigasjonen deles via felles `byttLaererElev`-kjerne, og
hamburger-«Admin» kaller samme `toggleAdminModus` (P10). `--header-h` er upåvirket
(høyde drives av logo/hamburger, dropdown er `position:absolute`).

## Utskrift
`utskrift-hode`-div vises kun ved print. Format:
`25/26 Øksnevad vgs, klasse 1D – Uke X`
