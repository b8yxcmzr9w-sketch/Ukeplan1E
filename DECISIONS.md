# DECISIONS — Ukeplan1E v4

Beslutningslogg for designvalg som ikke er åpenbare fra koden alene.

## P29 — Storage-policies for logos-bucketen kreves eksplisitt (26.06.2026)

Supabase Storage sitt «public»-flagg på en bucket gir kun **lesing** (GET) uten
autentisering. Det gir IKKE skrivetilgang. INSERT, UPDATE og DELETE på
`storage.objects` krever egne RLS-policyer på objektnivå selv om bucketen er
public. Uten disse policyene feiler `.upload()` stille (ingen toast, ingen feil i
UI) fordi koden ikke sjekket returverdien — da ble en ødelagt URL lagret i DB.

**Konkret for logos-bucketen:**
- `INSERT` og `UPDATE` er bundet til `auth_is_admin()` — kun aktiv admin kan laste
  opp. Filnavn = `<school-id>.<ext>` (ett objekt per skole, upsert-vennlig).
- `DELETE` er bundet til `auth_is_admin()`.
- `SELECT` er åpen (bucketen er public) — men eksplisitt SELECT-policy er lagt til
  som forsikring i tilfelle bucket-innstillingen endres.

**Fellen ved ny skole:** Hvis en ny skole settes opp og logo-opplasting «bare ikke
virker» (ingen feilmelding, men bildet er blankt), er sannsynlig årsak manglende
storage-policies — kjør `020_storage_policy_logos.sql` i SQL Editor.

## P8 — Klassevelger som fane (19.06.2026)

- **Native `<select>` med `<optgroup>` valgt som dropdown-løsning.**
  Dagens kode bruker allerede native `<select>` (header- og skoleår-velger), og
  `<optgroup>` gir gruppeoverskrifter + visuelt skille mellom «Dine klasser» og
  «Andre klasser» gratis, uten en egen custom-dropdown-komponent.

- **«Dine / Andre klasser»-skillet gjelder ALLE roller, også admin.**
  Admin er alltid også lærer/kontaktlærer og har egne klasser via `user_classes`.
  Det lages derfor ingen egen flat-liste-variant for admin — alle får
  «Dine klasser» (fra `user_classes`, sortert) øverst og «Andre klasser»
  (skolens øvrige klasser) under.

- **Velgeren er alltid en åpningsbar dropdown**, også for lærere med kun én egen
  klasse (de kan ha økter i andre klasser). Den gamle betingelsen om at velgeren
  kun ble bygget når `klasser.length > 1` er fjernet.

- **Klassehentingen er flyttet fra `renderMinKlasseTab` til `renderLaererView`**
  slik at velger-fanen kan bygges uavhengig av hvilken fane som er aktiv.
  `renderMinKlasseTab(container, klasse)` mottar aktiv klasse som parameter.

- **`APP.klasseVelger`-formen endret** fra `{ klasser, aktivKlasse, onChange }`
  til `{ aktivKlasse, setKlasse }`. `setKlasse` brukes til å bytte klasse på
  klasse-fanen uten å miste valgt uke; `aktivKlasse` driver den statiske
  «klasse X»-teksten i headeren.

## P23 — Felles settings-mønster (Profil + admin Skoleinfo) (22.06.2026)

- **Ett gjenkjennbart layout-mønster for innstillings-/profilsider.**
  CSS-klassene `.settings-page` (sentrert smal spalte, max-width 680px),
  `.settings-card` (kort med kant/skygge) og `.settings-close` («X»-lukk) skal
  gjenbrukes av alle innstillings-/profilsider. Profil (`renderInnstillingerTab`)
  og admin-fanen Skoleinfo (`renderSkoleInfoTab`) er referanseimplementasjonen.
  Resten av admin-fanene migreres i en senere økt (P24). Egne klasser ble valgt
  framfor å utvide `.kort`/`.subj-config-box`, som brukes mange andre steder.

- **«X»-utgang navigerer ALLTID via fast rute — aldri `history.back()`.**
  Hjelperen `lagSettingsLukk()` lukker til lærervisning på
  `#/laerer/<APP.laererCtx.tab || 'klasse'>`. Dette virker også etter hard refresh
  (uavhengig av nettleserhistorikk). Faller tilbake til `klasse`-fanen hvis ctx
  mangler ELLER peker på `innstillinger` (Profil selv) — så «X» aldri lukker
  tilbake til siden man nettopp forlot.

- **Ingen bekreftelsesdialog ved ulagrede felt.** Bevisst valg: feltene i Profil
  og Skoleinfo krever et eksplisitt lagre-trykk (egen knapp per skjema), så «X»
  forkaster aldri noe brukeren trodde var lagret. En «vil du forkaste?»-dialog
  ville bare være støy.

- **Lærer-fane-raden skjules på Profil** (`setTab` toggler `.skjult` når
  `slug === 'innstillinger'`), fordi Profil har sin egen `.settings-close`.
  Admin-panelets separate fane-rad er urørt — kun innholdet i Skoleinfo-fanen
  fikk den nye strukturen.

## P24 — «X» på panel-nivå i adminpanelet + kort på alle admin-faner (22.06.2026)

- **«X» hører hjemme på panel-nivå i et fane-panel, ikke inni én fane.** P23 ga
  Skoleinfo en egen `.settings-close` inni fanen. Det ble feil fordi adminpanelet
  har flere faner: «X» dukket bare opp på Skoleinfo. Løsning: én `.fane-lukk`-«X»
  ytterst i adminpanelets fane-rad, synlig på ALLE faner, som lukker hele panelet
  til lærervisning (samme rute som Profil-X-en via `lagSettingsLukk`).
  Kontrast: Profil er en frittstående side (fane-raden skjules), så der er en
  in-page «X» (`.settings-close`) riktig — den er eneste utgang.

- **Alle admin-faner deler samme kort-ramme.** P23 ga kun Skoleinfo kort-layout;
  de andre fanene var «flate». For å unngå spriket rendres nå alle admin-faner i
  samme sentrerte `.settings-page--admin` med kort-ramme. De øvrige fanene
  (Skoleår/Fag/Klasser/Brukere/Skolerute/Funfacts) rendres UENDRET inn i ett
  felles `.settings-card` via `setTab` — ingen intern endring av fanene, lav
  regresjonsrisiko. Skoleinfo beholder sine egne flere kort.

- **Admin-spalten er litt bredere enn Profil** (`max-width:920px` vs `680px`)
  fordi admin-faner har tyngre innhold (lister, tabeller, brukeradministrasjon).
  Kort-stilen og «X»-en er felles; bredden tilpasses konteksten.

## P25 — Mobil header-overflow: redundante toggles flyttes til hamburgeren (23.06.2026)

- **På mobil (≤700px) flyttes «Admin» + «Lærervisning/Elevvisning» ut av header-raden
  og inn i hamburgeren.** Headeren er én flex-rad uten `flex-wrap`, så på smal skjerm
  (~390px) ble «Lærervisning» og hamburgeren klippet utenfor høyre kant. Hamburgeren er
  allerede mobilnavigasjonen, så de to redundante tekstknappene hører hjemme der på mobil.
  Desktop er uendret (knappene blir i header-raden). Valgt framfor å krympe knappene til
  ikoner / skjule skoleinfo (mer rot, høyere regresjonsrisiko).

- **Vis/skjul mellom header og hamburger er RENT CSS-styrt, ikke JS-breakpoint.**
  Header-knappene får `.hdr-pc-only` (skjult `@media max-width:700px`); hamburger-speilene
  `#hdr-dd-laerer`/`#hdr-dd-admin` får `.hdr-mobile-only` (skjult `@media min-width:701px`).
  Media-queriene er gjensidig utelukkende → nøyaktig ett sett synlig, ingen blink/duplikat,
  ingen `resize`-lytter for selve byttet. JS (`oppdaterHeader`) styrer fortsatt rolle/
  innlogging via `.skjult` på BÅDE settene; CSS avgjør bare hvilket sett breakpoint-en viser.

- **Speil, ikke kopi (identisk adferd).** Lærer/elev-toggelens navigasjon (P21 elev-peek/
  retur) er trukket ut i én felles `byttLaererElev`-kjerne i `oppdaterHeader` som både
  header-knappen og hamburger-valget kaller. Hamburger-«Admin» kaller samme `toggleAdminModus`
  (P10: navigerer ikke) og speiler aktiv-stil/tekst. Tekst/tilstand settes ett sted, så
  menyvalgene følger header-knappene automatisk. P21-synligheten gjenbrukes (samme
  `visAdmin`/innlogget-logikk), ikke gjenoppfunnet.

- **`--header-h` upåvirket.** Header-høyden drives av logo (38px) / hamburger (~32px, blir
  værende på mobil), aldri av de skjulte knappene; dropdownen er `position:absolute`. Den
  sticky faneraden står dermed rett som før.

## P35 — Felles «Lagre»-knapp for inndelingsnavn (22.07.2026)

- **Én felles «Lagre»-knapp per liste erstatter per-rad 💾** for parti- og
  gruppenavn (klasse-admin + Fag-fanen). Knappen er dirty-styrt (deaktivert +
  `.btn-passiv` til minst ett felt avviker fra opprinnelig verdi) og lagrer kun
  endrede rader. Slett per rad er bevisst beholdt umiddelbar (uendret).

- **Delvis feil håndteres per rad, ikke alt-eller-ingenting.** Supabase har
  ingen transaksjon over flere `update`-kall fra frontend, så atomisk lagring
  ville krevd DB-endring (RPC). I stedet samles feil per rad: vellykkede rader
  får ny basislinje, feilede vises i `medLagreOverlay` sitt eksisterende
  feiloverlay («Kunne ikke lagre: <navn>») og forblir dirty, slik at «Lagre»
  kan trykkes på nytt for kun de feilede. Ingen nye feedback-mønstre innført.

- **`{ error }` sjekkes nå per rad.** Den gamle 💾-lagringen destrukturerte
  ikke returverdien fra supabase-js (som ikke kaster selv), så feilet lagring
  viste «Lagret!». Ikke gjeninnfør mønsteret `medLagreOverlay(() => sb.from(...)
  .update(...))` uten feilsjekk.

- **Egen lett dirty-sjekk (`lagInndelingNavnLagring`), ikke `overvakSkjema`.**
  `overvakSkjema` har én frossen snapshot-basislinje for hele skjemaet;
  P35 trenger basislinje PER RAD som oppdateres etter vellykket lagring
  (delvis feil-scenarioet). Samme visuelle mønster (disabled + `.btn-passiv`),
  annen mekanikk.

## P10 — Admin-toggelen er en rettighetsbryter, ikke navigasjon (20.06.2026)

- «Admin»-toggelen i headeren (`toggleAdminModus`) veksler KUN
  admin-rettigheter av/på i visningen brukeren står i: den oppdaterer
  `is_admin_active` og re-rendrer gjeldende hash via `router()` — den
  navigerer ALDRI. Adminpanelet (`#/admin`) nås utelukkende via
  «Innstillinger» i hamburgeren. Senere økter refererer dette som
  «P10 intakt» — ikke gjeninnfør navigasjon i toggelen.

## 018 — Admin som additivt flagg (19.06.2026)

- `role = 'admin'` som admin-markør var ødelagt: brukerredigerings-skjemaene
  overskrev `role` til `laerer`/`kontaktlaerer`, og admin-menyen forsvant ved
  neste login. Derfor tre adskilte begreper:
  - `users.is_admin` (boolsk, permanent) = admin-tilgang. En bruker er
    `laerer` ELLER `kontaktlaerer` som basisrolle, og kan i tillegg være admin.
  - `users.is_admin_active` = visningstoggle («ser på adminvisning nå»),
    nullstilles ved login. Brukes av P10-toggelen.
  - Enum-verdien `'admin'` i `user_role_enum` beholdes (kan ikke trygt
    fjernes fra en enum i bruk) men brukes ikke for nye/redigerte brukere.
- Maks 3 admin per skole, håndhevet av trigger (`enforce_max_admins` teller
  `is_admin = true`).

## P27 — RLS for adminpanelet + WITH CHECK-fellen (24.06.2026)

- **Adminpanelet er uavhengig av admin-toggelen.** En admin som åpner
  panelet uten toggelen på er i korrekt tilstand. Skrive-policyene for
  adminpanel-tabellene bruker derfor mønsteret
  `is_active_admin() OR auth_is_admin()` (migrasjon 019, samme mønster som
  006/018) — ikke `is_active_admin()` alene.
- **`sessions`-policyene beholder bevisst `is_active_admin()`** som indre
  betingelse: toggelen ER rettighetsbryteren for kollegahjelp i
  lærervisningen (P10). Disse skal ikke «fikses» til `auth_is_admin()`.
- **PostgreSQL-felle:** `FOR ALL`-policyer med kun `USING` default-denyer
  INSERT — `WITH CHECK` arves IKKE fra `USING`. Skriv alltid eksplisitt
  `WITH CHECK` (identisk uttrykk) på `FOR ALL`-policyer.

## P33 — «Nå» i sommergapet avgjøres kalendermessig (12.07.2026)

- `gjeldendeSkoleuke(schoolStart, schoolEnd, skoleAar)`: når inneværende uke
  er utenfor skoleåret, velges start- eller sluttuke ut fra dagens dato mot
  skoleårets FAKTISKE grensedatoer (mandag i startuken / fredag i sluttuken,
  via `skoleaarKalenderaar` + `isoWeekToDate`) — ikke etter uke-avstand.
  Avstandslogikken (P15) sendte brukeren i sommergapet til uke 24 av det NYE
  skoleåret, nesten et år frem i tid, og navigasjonen opplevdes låst.
- **`skoleaarIntervall` er IKKE egnet som gap-anker:** den dekker fast
  1. aug–31. jul, mens skoleslutt (uke 24) er i juni. Med den ville juli
  feilaktig telle som «innenfor skoleåret». Uendret der den brukes i dag
  (kalenderhendelse-spørringer).

## P12 — `overflow-x: clip`, aldri `hidden`, på html/body/main (20.06.2026)

- `overflow-x: hidden` gjør elementet til en scroll-container (`overflow-y`
  beregnes til `auto`) → `position: sticky` fester seg til feil container og
  IntersectionObserver mot viewport slutter å virke, mens selve scrollingen
  fortsatt skjer på vinduet. Bruk `overflow-x: clip` (klipper uten å lage
  scroll-container). Subtil felle som lett gjeninnføres ved CSS-opprydding.

## Tidligere runder — stående valg (juni 2026, flyttet fra PLAN.md ved P40)

- **Edge functions returnerer håndterte feil som `200 + { error }`.**
  supabase-js skjuler response-body ved non-2xx, så en feilmelding sendt med
  4xx/5xx når aldri brukeren. Gjelder alle edge functions kalt fra browser.
- **Elevtilgang: åpen klasseliste** (bevisst valg — elever logger ikke inn).
- **Konflikthåndtering: enkel melding med navn/tidspunkt** — ingen
  endringsvisning, fletting eller kopiering (bevisst forenkling; ikke
  foreslå på nytt uten ny begrunnelse).

## Import 014–016 — ingen lærerbrukere opprettet (12.06.2026)

- Alle importerte 25/26-økter fra prod eies av Morfars egen konto
  (fallback-eier); lærernavnet er bevart i info-feltet som «[Lærer: X]».
  Lærermapping skjer på fornavn mot `users.full_name`; migrasjonene er
  re-kjørbare — opprettes lærerbrukere senere, mapper en ny kjøring
  eierskapet riktig. Forklarer hvorfor prod-data ser ut som de gjør.

## P42 — Kompakt «Alle mine økter»: bevisste valg (27.07.2026)

- **Detaljer-modus ER dagens layout, uendret.** Kompakt er ny standardvisning
  på desktop; toggelen bytter til den gamle rad-layouten som egen modus i
  stedet for å endre den (lav regresjonsrisiko). Ikke «rydd opp» ved å slå
  dem sammen.
- **«Vis kun ved første forekomst»** (Morfars regel): ukenummer kun på ukas
  første rad, dato kun på dagens første økt, klasse kun ved klassebytte innen
  dagen. Tomme celler beholder fast bredde — **tomrom er informasjon**, derfor
  faste flex-bredder og aldri auto-fit grid. Sorteringen i kompaktmodus er
  dag → fridag først → klasse → fag (klasse-gruppering innen dagen gjør
  regelen meningsfull); Detaljer beholder dag → fridag → fag som før.
- **📍 oppmøte utelates i kompaktmodus** (bevisst, Morfars svar 2) — hintet
  etter tittelen er P/G-parti + `info`-feltet. Detaljer viser alt.
- **Mobil-kortlisten er bevisst uendret** — kompakt-på-mobil er eget
  backloggpunkt (`BACKLOGG-UX-MOBIL.md` punkt 5). Modusvelgeren er skjult
  ≤700px. Ikke foreslå kompakt-på-mobil som del av annen opprydding.
- **h3-uke-overskriftene beholdes i DOM i kompaktmodus** (skjules kun via CSS
  på desktop): de er scroll-/spy-ankre for mobil og Detaljer, mens ukas
  første rad (`.mp-anker[data-uke]`) er anker i kompakt desktop. Fjernes
  h3-ene «fordi de er skjult», knekker «Nå»-knappen og P22-retur på mobil.

## P43 — Kosmetiske fikser: to bevisste valg (27.07.2026)

- **Info-teksten vises nøyaktig som lagret — ingen normalisering.**
  Dobbeltparentesen «((…))» i kompaktmodus ble løst ved å FJERNE
  parentes-innpakkingen i `lagKompaktRad`, ikke ved å strippe ytre parenteser
  fra lærerens tekst (Morfars justering ved godkjenning; kartleggingens
  opprinnelige forslag `utenYtreParentes()` utgikk). Prinsippet: appen viser
  det læreren skrev, og skiller info visuelt med dempet valør + « · » i
  stedet for skilletegn den selv legger på. Ikke gjeninnfør innpakking eller
  stripping — og ikke «rydd opp» parenteser i `sessions.info` i databasen;
  lagringen er bevisst inkonsekvent fordi den er lærerens egen tekst.
- **`planleggingsdag` → «undervisningsfri» er ren visningstekst.**
  Løst i `kalenderTypeNavn`, samme mønster som `helligdag` → «høytid».
  DB-enumen (`ferie|helligdag|planleggingsdag|annet`, migrasjon 012),
  skolerute-radene og `ai-parse-skolerute` er UENDRET — edge-funksjonen skal
  fortsatt produsere DB-verdien `planleggingsdag`. Admin-badgen og begge
  type-dropdownene arver etiketten automatisk fordi de allerede kaller
  `kalenderTypeNavn`. Ingen migrasjon skal skrives for dette.

## P44 — Trygg AI-import: klassevern, ikke lærervern (12.08.2026)

- **Import begrenses til `user_classes`, ikke til aktiv klasse.** AI-import
  (`visAIPasteModal`) matcher hver rads klassenavn mot lærerens TILDELTE
  klasser (`user_classes`), ikke bare klassen man står i. Rader for klasser
  utenfor denne lista blir røde og utelates («Ukjent/annen klasse (X) –
  importeres ikke»), redigerbart per rad. Håndhevet i databasen av migrasjon
  022 (`sessions_insert_laerer`) — samme grense i UI og RLS.
- **`is_contact_teacher_for()` ble bevisst IKKE brukt** i migrasjon 022 — den
  krever rollen kontaktlærer og ville låst ute faglærere som er tildelt
  klassen uten å være kontaktlærer. `user_classes` er den riktige grensen for
  «kan skrive i denne klassen».
- **Lærervalg i importen: manuelt nedtrekk, standard = deg selv, ALDRI
  gjetning fra tekst** (alternativ 2, valgt etter en kort A/B-runde samme
  dag — alternativ 1, fjerne kolonnen helt, ble forkastet). En hel limt
  årsplan havner automatisk på deg; bevisst overstyring til en kollega er
  fortsatt mulig, som i «Ny økt»/kopi. Det som IKKE kom tilbake:
  fornavn-matching (`matchLaerer`) og `teachers`-lista i AI-konteksten/
  prompten — AI-en skal aldri se eller gjette lærernavn.
- **`teacher_id = auth.uid()`-varianten av migrasjon 022 er lagt bort for
  godt**, ikke bare utsatt. Den ville stoppet «Ny økt» på vegne av en
  kollega (bevisst mulighet siden migrasjon 008) og bulk-kopi med «behold
  lærer». Historikknotat står i selve SQL-filen — ikke gjeninnfør den uten
  en ny, eksplisitt beslutning.
- **P45 («Foreslå økt til kollega», innboks + godkjenning) er lagt bort**,
  ikke bygget. Begrunnelse: kollega-innlegging brukes sjelden, og risikoen
  for at noe havner i feil lærers plan veide tyngre enn nytten. Siden P44
  fortsatt tillater bevisst lærervalg i importen, gjenstår et lite
  varselbehov — se P47 (stub, ikke bygget).

## P53 — Mobil AI-import: sammendragslinje bruker komponentens EGEN
mobilgrense, ikke det globale 700px-brekket (19.08.2026)

- **Mobilbrekket for AI-importradens sammendragslinje er `@media
  (max-width: 900px)`** — samme mediespor som allerede styrer
  `.okt-import-rad` sin kompakt-/utvidet-stabling siden P44/P50 (se
  kommentaren «Mobil (≤900px) er UTENFOR scope» i `style.css`). Dette er
  BEVISST forskjellig fra det globale mobilbrekket (`@media (max-width:
  700px)`, brukt f.eks. i header-hamburgeren fra P25). Komponenten har sin
  egen etablerte mobilgrense fordi kompaktraden har mange smale felt som
  trenger stableplass tidligere enn resten av appen. **Ikke** «rett opp»
  denne forskjellen til 700px eller flytt sammendragslinja til et nytt
  breakpoint uten en egen, eksplisitt beslutning — de to grensene styrer
  bevisst ulike komponenter.

## P57 — E-postvarsel byttet fra Resend til Formspree (20.08.2026)

- **Bakgrunn:** `request-access`s admin-varsel brukte i første omgang
  `sendVarsel()`/Resend-mønsteret fra `admin-user` (samme
  `RESEND_API_KEY`/`RESEND_FROM` i Supabase Secrets). Under produksjonstest
  20. august 2026 viste det seg at Morfar aldri har brukt Resend, ikke
  kjenner igjen tjenesten, og ikke har mottatt noen e-post derfra —
  nøkkelen stammer fra en tidligere økt og er aldri verifisert av en
  faktisk bruker.
- **Valgt løsning:** `request-access` bruker nå **Formspree**
  (`https://formspree.io/f/mqpznaen`) i stedet for Resend. Formspree er en
  tjeneste Morfar allerede eier og har bekreftet fungerer (brukt på
  `uno.ganddal.net/ukeplan1e.html`s kontaktskjema, endepunkt
  `f/xzdwvpga`). Et NYTT, eget Formspree-skjema ble opprettet
  (`f/mqpznaen`) med mottaker satt til `geir.edland@skole.rogfk.no` i
  Formspree-kontoen selv — for å holde skole-forespørsler adskilt fra
  salgshenvendelser til Uno i samme innboks-tråd. Ingen hemmelig nøkkel
  trengs i Supabase Secrets for dette — endepunktet er hardkodet i
  `request-access/index.ts` (ikke sensitivt, samme mønster som det
  offentlige HTML-skjemaet på salgssiden).
- **Bevisst forenkling:** admin-bruker-oppslaget (`is_admin`/`role=admin`
  + `auth.admin.getUserById` for å finne e-postadresse) ble fjernet helt fra
  `request-access` — mottaker-e-post styres nå i Formspree-kontoen, ikke i
  kode. Reduserer kompleksitet og fjerner en avhengighet til
  `SUPABASE_SERVICE_ROLE_KEY`s admin-API for akkurat denne biten (selve
  DB-innsettingen bruker fortsatt service-role, uendret).
- **IKKE i scope:** `admin-user`s to Resend-baserte varsler (passord
  endret / e-post endret av admin) er UENDRET og bruker fortsatt Resend —
  de er ikke rettet eller verifisert i denne økten. Se PLAN.md-backloggen
  for det gjenstående punktet. Ikke anta at «P57 byttet til Formspree»
  betyr at Resend-problemet er løst generelt i appen.

## P58 — Databasen som vernebøyle, appen som praktisk grense (20.08.2026)

`subjects.max_divisions` hadde en DB-CHECK-constraint (1–8) som var strengere
enn appens skjema (1–20) — fag med 9+ inndelinger kunne ikke lagres, med rå
Postgres-feiltekst i overlayet. Migrasjon 024 hever DB-taket til 1–20 slik at
det matcher appen.

**Rollefordeling, bevisst valgt:**
- **Databasen** setter et fast, romslig ytre tak (1–20) — en vernebøyle mot
  helt urimelige verdier (f.eks. negative tall eller tusenvis), ikke en
  pedagogisk grense.
- **Appen** (`renderFagSkjema` + `oppdaterDivNavn` i `app.js`) håndhever den
  praktiske grensen brukeren faktisk møter, og kan endres uten migrasjon.

CHECK-constraints ser kun egen rad og kan derfor ikke variere per
skole/fag uten en egen trigger. Dette er bevisst IKKE bygget — et fast tak
er tilstrekkelig for formålet (vernebøyle, ikke forretningsregel). Ikke
foreslå trigger-basert dynamisk tak på nytt uten en ny, konkret
begrunnelse (f.eks. at en skole faktisk trenger et tak per fag).

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

**Sikkerhetskopi:** migrasjonens Del 2 oppretter `sessions_backup_for_live`
og `multi_day_events_backup_for_live` som rene kopier, med RLS PÅ og
INGEN policyer — bevisst valg fordi tabellene havner i `public`-skjemaet
som Supabase eksponerer via API-et, og ikke skal være lesbare utenfra.
Uten policyer er de kun tilgjengelige for service-role og SQL Editor.
Backup-tabellene er midlertidige og droppes når Morfar har bekreftet at
oppryddingen er riktig (se PLAN.md, Økt 60).

## P61 — Tilgangsskjemaet spør ikke lenger om parti/gruppe (24.08.2026)

«Be om tilgang»-skjemaet (P57) spurte opprinnelig om både fag OG
parti/gruppe. Parti-listen viser hver inndeling ved skolen på formen
«Fag — Type: Navn (Klasse)» — for detaljert og for lang en liste for en
søker som ennå ikke har konto. Parti/gruppe-raden er derfor fjernet fra
selve skjemaet (`visBeOmTilgangModal`, `v4/app.js`): ingen avkrysningsliste,
ingen spørring mot `subject_divisions`, og feltet `divisions_text` sendes
ikke lenger med i kallet til edge-funksjonen `request-access`. Fag-listen
er UENDRET.

**Bevisst beholdt uendret:**
- **Databasen:** `access_requests.divisions_text` (migrasjon 023) har
  `not null default '{}'` og beholdes som kolonne — ingen migrasjon i
  denne økten. Nye rader får en tom liste (default), eldre forespørsler
  beholder innholdet sitt.
- **Edge-funksjonen `request-access`:** leser feltet defensivt
  (`Array.isArray(body.divisions_text) ? … : []`) og tåler at det mangler
  fra frontend — ingen redeploy trengs.
- **Adminpanelets forespørsels-kort** (app.js, «Forespørsler»-fanen):
  viser «Parti/gruppe: …»-linjen kun `if (f.divisions_text?.length)` —
  linjen forsvinner derfor av seg selv for nye forespørsler uten at
  gamle forespørsler mister informasjon. Ingen kodeendring nødvendig der.

Ikke foreslå å gjeninnføre parti/gruppe-valget i tilgangsskjemaet uten en
ny, konkret begrunnelse — beslutningen er bevisst, ikke en forglemmelse.

## P62 — Appen flyttet til rota (24.08.2026)

Tjenesten kjørte til nå på `https://ukeplan1e.ganddal.net/v4/` (den
«midlertidige» undermappa fra utviklingsfasen), mens rota fortsatt viste
den forrige, frosne produksjonsløsningen. Adressen skal være ren:
appen kjører nå direkte på `https://ukeplan1e.ganddal.net/` uten
undermappe. `/v4/` som URL fjernes helt — gamle QR-koder og
invitasjonslenker som pekte dit slutter å virke. Dette er et BEVISST valg
(ikke en forglemmelse): en ren rotadresse er verdt at gamle lenker dør,
fremfor å bygge videresending/stub-logikk for et forbigående
overgangsproblem.

Den forrige produksjonsløsningen er arkivert til `gammel/` (flyttet med
`git mv` — `index.html`, `appsscript.gs`, `logo.png`, `info/`, `dev/`,
`README.md`), fordi 25/26-planene fortsatt kun finnes der (ikke migrert
til den nye databasen). `gammel/` er nå det fredede arkivet — samme
frysregel som før gjaldt rotfilene, gjelder nå denne mappa.

**Dispensasjon fra frysregelen (avgrenset til tre linjer):** de arkiverte
filene skulle i utgangspunktet flyttes med UENDRET innhold. Ved
gjennomgang viste det seg at «❓ Bruksanvisning»-lenken i verktøymenyen
(`index.html`/`dev/index.html`, samme linje i begge) var hardkodet
**absolutt** til `https://ukeplan1e.ganddal.net/info/` — ikke relativ, som
først antatt. En uendret absolutt selvlenke til rota ville gitt 404 etter
flyttingen, siden rota nå viser den NYE appen og `/info/` bare finnes på
`/gammel/info/`. Tilsvarende hadde `info/index.html` en instruks («Gå til
ukeplan1e.ganddal.net…») som etter flyttingen ville sendt leseren til den
nye appen, midt i en tekst som beskriver den gamle. Alle tre rettet til
**rot-relative** stier (`/gammel/info/` og `/gammel/`) — ikke
mappe-relative, fordi `dev/index.html` havner ett nivå dypere
(`gammel/dev/index.html`), der en vanlig relativ `info/`-lenke ville
truffet feil sti. Dette er de ENESTE innholdsendringene i de ellers
uendrede, arkiverte filene, gjort fordi frysregelens formål («arkivet skal
virke som det gjorde») ellers ikke ville holdt — en lenke som gir 404 er
ikke det samme som en fungerende, uendret side. Ikke foreslå å rulle disse
tre tilbake til de opprinnelige absolutte URL-ene.

**`v4/`-mappa er BEVISST IKKE slettet i denne økten**, på tvers av den
opprinnelige oppgaveteksten (som sa at v4/ skulle løftes til rota med
`git mv` og være «helt borte etterpå»). Morfar presiserte ved «kjør»:
«ikke slett /v4 før jeg bekrefter at flyttingen er vellykket». Appens
innhold ble derfor KOPIERT (ikke flyttet) fra `v4/` til rota — `v4/` står
igjen som et fullstendig, uendret duplikat av appen slik den var rett før
flyttingen, som rollback-sikkerhet. Den skal IKKE redigeres eller brukes
som kilde for noe (rota er kanonisk fra nå av) og er ikke lenger nevnt som
«under utvikling» noe sted. Slettes i egen, senere økt når Morfar har
bekreftet at rot-versjonen fungerer i produksjon — ikke automatisk, ikke
uten uttrykkelig beskjed.

**Manuelt oppfølgingspunkt (Supabase):** Site URL/Redirect URLs i
Authentication → URL Configuration skal i denne overgangsfasen ha BÅDE
rot-adressen (lagt til i P62) OG den gamle `/v4/`-adressen (ikke fjernet
ennå) — så lenge `v4/`-kopien fortsatt eksisterer og kan brukes til å
teste at flyttingen faktisk virker. Fjerning av `/v4/`-adressen hører
sammen med selve slettingen av `v4/`-mappa (se backloggen, «Slett
rollback-kopien /v4/»), ikke til denne økten.

Cache-bust i ny rot-`index.html` satt til `?v=20260824b`. `v4/index.html`
sin egen cache-bust er IKKE rørt (den er en frossen kopi, ikke i bruk).
