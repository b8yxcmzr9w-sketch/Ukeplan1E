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
