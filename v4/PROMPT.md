# Prompt: Bygg Ukeplan v4

## Prosjektbeskrivelse

Bygg en nettbasert ukeplantjeneste for én videregående skole. Elevene kan se ukeplanen for sin klasse via en dedikert URL. Lærere og kontaktlærere administrerer egne og klassens økter. Admin styrer hele oppsettet.

**Teknologistack:**
- **Backend/database:** Supabase (PostgreSQL + Row Level Security + Auth + Edge Functions + Realtime)
- **Frontend:** Statiske filer på GitHub Pages – `index.html`, `app.js`, `style.css` (null build-steg)
- **AI-parsing:** Google Gemini Flash API (nøkkel lagres i Supabase-konfig, brukes av Edge Functions)
- **Kalenderabonnement:** Supabase Edge Function genererer iCal-feed
- **Ingen andre tjenester**

---

## Databaseskjema (PostgreSQL / Supabase)

Lag migrasjoner for alle tabeller. Bruk UUID som primærnøkkel overalt. Alle sletteoperasjoner skal bruke soft-delete med `deleted_at`-kolonne. En cron-jobb (Supabase pg_cron eller Edge Function) sletter permanent etter 30 dager.

```
schools          – id, name, logo_url, logo_file_path, school_year_start_week, school_year_end_week, color_theme(enum: standard|lys|mork), created_at
classes          – id, school_id, name, sort_order, deleted_at
subjects         – id, school_id, name, short_code, color_hex, has_parti, has_gruppe, max_divisions(default 8, max 20), deleted_at
subject_divisions– id, subject_id, division_type(enum: parti|gruppe), name, sort_order, deleted_at
users            – id (auth.uid), school_id, full_name, role(enum: laerer|kontaktlaerer|admin), is_admin_active(bool), deleted_at
user_classes     – user_id, class_id (hvilke klasser læreren er tilknyttet)
sessions         – id, school_id, class_id, subject_id, division_id(nullable), week_nr, day_of_week(1-5), teacher_id, activity, meeting_point, info, created_by, deleted_at, deleted_by, last_modified_at, last_modified_by, version(int for optimistic locking)
multi_day_events – id, school_id, class_id(nullable – null=alle klasser), title, description, start_date, end_date, created_by, deleted_at
school_calendar  – id, school_id, title, start_date, end_date, type(enum: ferie|fridag|annet)
audit_log        – id, table_name, record_id, action, changed_by, changed_at, old_data(jsonb), new_data(jsonb)
school_facts     – id, school_id, fact_text (morsomme/interessante fakta om skolen for lagre-overlay)
```

**Row Level Security:**
- Elever (uautorisert): SELECT på sessions, multi_day_events, school_calendar, subjects, subject_divisions, classes, schools for sin skole
- Lærer: SELECT alt for sin skole; INSERT/UPDATE/DELETE egne sessions; kan ikke endre andres
- Kontaktlærer: som lærer + INSERT/UPDATE/DELETE alle sessions i egne klasser
- Admin (når `is_admin_active=true`): full tilgang til alt for sin skole
- Ingen kryssdata mellom skoler
- RLS-policyer skal bruke inline EXISTS-subspørringer (ikke security definer-funksjoner) for å sikre korrekt evaluering

---

## Roller og tilganger

### Elev (ikke innlogget)
Tilgang via direkte URL: `/#/klasse/1E` (admin kopierer lenken fra Klasser-fanen og sender til elevene)

**Velkomstside (ingen klasse i URL):** Viser skolens logo, navn, en kort innbydende tekst og alle klasser som store klikkbare knapper. Hvis ingen klasser er opprettet ennå: «Lærerne er i gang med å sette opp ukeplanen – kom tilbake snart!»

- **Ukevisning:** 5 dager × **minst** 3 synlige økter per dag (scroll inni dagkolonnen ved flere) i responsivt rutenett. Fungerer på laptop og mobil.
- **Navigasjon:** Pil frem/tilbake per uke. Direktehopp til ukenummer. Kun uker innen skoleårets definerte start/slutt.
- **Skolerute:** Vises i ukeplanen – ferieperioder og fridager vises som banner over ukeplanen.
- **Flerdagshendelser:** Vises øverst i uken de gjelder.
- **Sortering:** Økter sorteres alfabetisk etter fagnavn innen hver dag.
- **Filter:** Velg parti ELLER gruppe (avhengig av hva som er definert for klassen) – kun ett aktivt filter av gangen. Alle valg fra nedtrekkslister, ingen fritekst.
- **Utskrift:** Liggende A4 med overskrift: skolenavn, klasse, uke [nr]. Optimalisert med `@media print`.
- **iCal-abonnement:** Generer abonnements-URL basert på valgt klasse + evt. filter. Edge Function returnerer iCal-feed. Instruksjoner for Google Kalender, Apple Kalender og Outlook vises.

### Lærer (innlogget)

**Visning:**
- Klassevis ukeoversikt (velg klasse fra liste over tilknyttede klasser)
- Egen tverrklassevisning: alle egne økter på tvers av klasser, samme ukenavigasjon
- Fritekst-søk i alle felt (fag, aktivitet, oppmøtested, info, lærer)

**Redigering:**
- Kan kun redigere, kopiere eller slette egne økter
- Kan se andres økter i klassen, men kun kopiere – ikke redigere
- Kopier økt: oppretter ny økt med samme innhold, tilknyttet innlogget lærer
- **Overfør økt til annen lærer:** Lærer kan overføre en av sine egne økter til en annen lærer. Den mottakende læreren varsles (varsel i app ved neste innlogging). Overføringen loggføres i audit_log.
- Kan legge inn egne økter i hvilken som helst klasse (ikke bare tilknyttede)
- **Ny økt (enkeltvis):** Alle felt velges fra nedtrekkslister/datovelger – ingen fritekst unntatt aktivitet, oppmøtested og info
- **Ny økt (AI-innliming):** Lim inn tekst → Edge Function sender til Gemini Flash med strukturert prompt → returnerer liste med parsede økter → vis forhåndsvisning med duplikatkontroll (sammenlign mot eksisterende i samme uke/dag/fag/klasse) → advar om konflikter (samme lærer, samme uke/dag) → lærer godkjenner og lagrer
- **Bulkredigering:** Velg flere egne økter med avkrysningsbokser → endre felles felt (dag, uke, info) for alle valgte
- **Soft-delete:** Slettede økter mellomlagres 30 dager, kan gjenopprettes
- **Utskrift:** Skriv ut aktiv visning (klasse eller tverrklasse)
- **iCal-abonnement:** Abonner på egne økter (alle klasser)
- **Passordbytte:** Tilgjengelig i innstillinger

**Sanntid / samtidige brukere:**
Bruk Supabase Realtime for å lytte på endringer i `sessions`-tabellen for aktiv klasse/uke. Ved konflikt (to lærere redigerer samme økt): bruk optimistic locking (`version`-felt). Vis varsel: «Denne økten ble endret av [navn] mens du redigerte. Dine endringer ble ikke lagret – se oppdatert versjon.»

### Kontaktlærer (innlogget)

Alt som lærer, pluss:
- Kan redigere alle økter for egne klasser uavhengig av hvem som opprettet dem
- **Flerdagshendelser:** Opprett/rediger/slett hendelser for egen klasse eller andre klasser. Advar ved overlapping med eksisterende enkeltøkter.
- **Klassestruktur:** Definer for hver klasse hvilke dager hvert fag fortrinnsvis undervises (standard dager). Definer antall partier/grupper per fag og navngi dem (inntil 20).
- **Backup:** Last ned komplett backup av klassen som JSON (alle sessions, multi_day_events, school_calendar-rader for klassen, klassestruktur). Last opp backup → vis liste over økter i backup-filen → la kontaktlærer velge hvilke økter som skal importeres → duplikatkontroll → importer valgte.
- Kan ha inntil 2 kontaktlærere per klasse

### Admin (innlogget, `is_admin_active=true`)

**Rollebytte:** Én toggle-knapp alltid synlig i header for admin-brukere (ingen separat «Admin»-knapp). Tekst tilpasses kontekst:
- I lærerpanelet: «Aktiver admin-modus»
- I admin-panelet: «← Til lærerpanel» eller «← Til kontaktlærerpanel» avhengig av brukerens rolle
- Ingen ny innlogging nødvendig

**Oppstart etter innlogging for admin:**
- Hvis skolen ikke er satt opp (ingen klasser ELLER ingen fag): åpne admin-panelet direkte
- Ellers: åpne lærer-/kontaktlærerpanelet (admin-modus deaktivert)

**Skoleinfo:**
- Navn på skolen (maks 30 tegn med live tegnteller)
- Logo: last opp bildefil (lagres i Supabase Storage) ELLER skriv inn URL. Logo brukes også som favicon.
- Skoleårets start- og sluttuke vises på samme linje med to kompakte tallfelt + datohint under hvert felt (viser mandatodato for valgt ukenummer)
- **Fargepalett:** Velg mellom tre forhåndsdefinerte temaer – Standard (nåværende grønn), Lys (lys palett med kontrasterende farger) og Mørk (mørk palett). Valget lagres i `schools.color_theme` og lastes automatisk for alle besøkende på skolen.

**Fag:**
- Legg til/rediger fagnavn og forkortelse. Kortkode genereres automatisk fra fagnavn (kan overstyres).
- Velg farge fra forhåndsdefinert palett med 12 farger. Neste ledige farge velges automatisk.
- Definer: har dette faget parti eller gruppe (ikke begge)? Maks 20 inndelinger (støtter tverrfaglige uker).
- Endre fagnavn: vis advarsel «Dette endrer alle eksisterende økter med dette faget». Endre i alle sessions ved bekreftelse.
- Slett fag: bruk soft-delete

**Klasser:**
- Legg til klasser
- Slett klasse: sterk advarsel + soft-delete (30 dager)
- Slå sammen to klasser: velg hvilke fag som tas med. Vis konfliktoversikt (overlappende sessions). Admin løser konflikter manuelt. Bruk søppel-funksjon for det som ikke tas med.
- «Kopier elevlenke»-knapp per klasse: kopierer direkte URL (`#/klasse/[navn]`) til utklippstavlen slik at admin kan sende lenken til elevene

**Brukere:**
- Legg til ny bruker: e-post, navn, rolle (radioknapper: Lærer / Kontaktlærer) + sjekkboks «Administrator». Brukeren opprettes automatisk via Edge Function `create-user` og mottar en invitasjons-e-post.
- Rediger bruker: endre navn (advarsel: «Navn endres i alle oppføringer»), rolle (radioknapper), admin-status (sjekkboks), klasser
- Slett bruker: kun fremtidige sessions (fra og med i dag) tildeles annen lærer eller slettes. Historiske sessions beholdes med opprinnelig navn.
- Maks 3 kontaktlærere per klasse – håndheves ved lagring
- Maks 2 administratorer per skole – håndheves ved lagring
- En administrator må alltid også ha rollen Lærer eller Kontaktlærer

**Skolerute:**
- Eksisterende hendelser vises som `admin-rad`-lister (tittel, datoperiode, type-badge, slett-knapp) – ingen tabell
- Legg til-skjema bruker `lagFormRad` med label over hvert felt (likt Skoleinfo), Fra/Til på samme linje med `uke-rad`/`uke-grp`-mønsteret (mobilvennlig flex-wrap)
- AI-import: knapp skjult som standard. Når ingen hendelser er lagt inn vises en oppfordring om å bruke AI. Lim inn tekst → Gemini Flash parser → forhåndsvis → lagre

**Funfacts:**
- Fane tidligere kalt «Fakta», nå «Funfacts»
- Pausetekster som vises tilfeldig i lagre-overlaydet for å holde humøret oppe
- Admin kan legge til/redigere/slette enkeltvis
- Knapp «✨ Generer med AI» kaller Edge Function `generate-facts` som bruker Gemini til å generere ~40 lokaltilpassede funfacts om Jæren, Øksnevad, naturbruk, vikinger, husdyr m.m.

---

## UX-krav

**Innlogging:**
- Skjema sentrert midt på siden i et kort
- Feil passord/e-post: rød feilmelding direkte i skjemaet (ikke toast)
- Ved vellykket innlogging: kort toast «Velkommen, [navn]!»
- «Glemt passord?»-lenke sender tilbakestillingslenke til e-post (fyll inn e-post først)

**Lagre-knapper:**
Alle lagre-knapper er passive (deaktivert) inntil brukeren har gjort en endring i skjemaet. Bruker `overvakSkjema(form, lagreKnapp)` som tar snapshot av alle felt ved oppstart og aktiverer knappen ved avvik.

**Lagre-overlay:**
Alle lagre-operasjoner bruker et morsomt overlay-mønster:
1. Klikk «Lagre» → overlay vises med spinner og én av følgende (tilfeldig):
   - En kort morsom tekst (f.eks. «Sender tanker til skyene…», «Overtaler databasen…», «Stokker bits…»)
   - Et tilfeldig skolefakta/-sitat hentet fra `school_facts`-tabellen (hvis admin har lagt inn noen)
2. Ved suksess: sjekk-ikon + «Lagret!» i 1,5 sek
3. Ved feil: rød feilmelding med mulighet for retry
Overlay hindrer dobbeltklikk og utilsiktede hendelser.

**Modaler:**
Alle modaler (vinduer) er sentrert midt på skjermen med mørk bakgrunn. Bakdrop-element bruker klassen `modal-bg`, innholdsboks bruker `modal`.

**Felt i skjema:**
Alle forhåndsdefinerte verdier (fag, klasse, dag, uke, parti/gruppe, lærer) velges fra nedtrekkslister. Ingen fritekst for strukturerte felt.

**Layout:**
- Innhold på alle sider er innrykket med fleksible marger: `padding: 28px clamp(20px, 5vw, 80px) 60px`
- Skjemaer (f.eks. Skoleinfo) begrenses til maks 560px bredde på bred skjerm
- Alle visninger (elev, lærer, kontaktlærer, admin) bruker `side-wrap` som wrapper-klasse for konsistente marger

**CSS-klasser for ikke-admin-visninger:**
- `.laerer-top { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:4px 0 12px; }` – topprad i lærerpanel
- `.session-wrapper { display:flex; align-items:flex-start; gap:6px; }` / `.session-cb { margin-top:6px; cursor:pointer; flex-shrink:0; }` – økt med avkrysningsboks
- `.session-card__meeting`, `.session-card__info`, `.session-card__teacher { font-size:.78rem; color:var(--tekst-svak); margin-top:2px; }` – korttekst for økt
- `.session-card__class { display:block; font-size:.75rem; font-weight:700; color:var(--primær); margin-bottom:4px; }` – klasse-merke på økt
- `.search-results { display:flex; flex-direction:column; gap:10px; margin-top:12px; }` – søkeresultat-liste
- `.mde-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--kant); }` – rad i multi-day-event-liste
- `.subj-config-box { background:var(--bg-kort); border:1px solid var(--kant); border-radius:var(--radius); padding:12px 14px; margin-bottom:10px; }` – fagkonfigurasjonsboks
- `.days-row { display:flex; gap:14px; margin:8px 0 4px; flex-wrap:wrap; align-items:center; }` – dagvalg-rad
- `.div-list / .div-row` – inndelingsliste (partier/grupper) i fagkonfig
- `.input-sm { width:180px !important; }` – smal input
- `.backup-list { max-height:300px; overflow-y:auto; border:1px solid var(--kant); ... }` – backup-filvisning
- `.ai-preview`, `.preview-table`, `.conf--high/medium/low` – AI-forhåndsvisning med konfidensfarger

**Responsivt design:**
- **Laptop:** 5-kolonners ukevisning, minst 3 synlige økter per dag (dagkolonnen har fast minimumshøyde og scroller ved overflow)
- **Mobil:** én kolonne per dag (horisontal scroll mellom dager), kondensert kortvisning

**Fargetemaer:**
Definer tre komplette CSS-temaer med CSS custom properties (variabler). Tema lastes ved oppstart basert på `schools.color_theme`:
- `standard` – nåværende grønn palett (`--primær: #2d6a4f` osv.)
- `lys` – lys, luftig palett med en annen primærfarge (f.eks. blå eller teal)
- `mork` – mørk palett egnet for lavlysbruk

**Favicon:**
- Standard favicon: Uno-ikonet (`https://uno.ganddal.net/favicon.ico`) – kun hunden, uten tekst
- Når skolen har lastet opp logo: favicon oppdateres automatisk til skolelogoen i samme sesjon

---

## Edge Functions (Supabase)

1. **`/ical`** – Generer iCal-feed. Params: `klasse`, `laerer`, `parti`, `gruppe`. Henter data fra DB og returnerer `text/calendar`.
2. **`/ai-parse-sessions`** – Mottar tekst + klasse/kontekst. Sender til Gemini Flash med strukturert system-prompt. Returnerer array av parsede økt-objekter.
3. **`/ai-parse-skolerute`** – Mottar tekst. Sender til Gemini Flash. Returnerer array av kalender-hendelser.
4. **`/cleanup`** – Kjøres periodisk (pg_cron eller scheduled function): sletter soft-deleted records eldre enn 30 dager permanent.
5. **`/create-user`** – Oppretter ny auth-bruker via Supabase Admin API (service_role) og sender invitasjons-e-post. Krever aktiv admin-sesjon. Oppretter også rad i `users`-tabellen og kobler til klasser.
6. **`/generate-facts`** – Genererer ~40 lokaltilpassede funfacts via Gemini Flash. Krever aktiv admin-sesjon. Returnerer array av faktatekster med lokal tilknytning til Jæren, Øksnevad, naturbruk, vikinger, husdyr m.m.

Gemini API-nøkkel lagres som Supabase secret (`GEMINI_API_KEY`).

---

## Footer

Alle sider skal ha en diskret footer med:
- Uno-logo (lenke til `https://uno.ganddal.net`) med lav opasitet, slik som i v2
- © årstall basert på `document.lastModified` (årstallet dokumentet sist ble redigert/deployet)
- Implementeres via `uno-footer.js` som legges inn rett før `</body>` på alle HTML-sider
- Skal **ikke** vises ved utskrift (`@media print`)
- Footer er alltid synlig nederst i vinduet (sticky footer via `body { display:flex; flex-direction:column }` + `main { flex:1 }`)

---

## Filstruktur

```
/
├── index.html          – Appskall, navigasjon, routing (tittel: Ukeplan1E)
├── app.js              – All applogikk, Supabase-klient, views
├── uno-footer.js       – Footer med Uno-logo og © årstall sist redigert
├── style.css           – Styling inkl. fargetemaer, @media print og mobile
├── supabase/
│   ├── migrations/     – SQL-migrasjoner i rekkefølge
│   └── functions/      – Edge Functions (ical, ai-parse-sessions, ai-parse-skolerute, cleanup, create-user, generate-facts)
└── README.md           – Oppsettsinstruksjoner
```

---

## Oppsettsinstruksjoner (README)

Inkluder steg-for-steg:
1. Opprett Supabase-prosjekt
2. Kjør migrasjoner
3. Sett secrets (`GEMINI_API_KEY`)
4. Deploy Edge Functions: `supabase functions deploy --project-ref <ref>` (kjøres fra `v4/`-mappen)
5. Oppdater Supabase URL + anon key i `app.js`
6. Push til GitHub, aktiver GitHub Pages på `main`-branch
7. Opprett første admin-bruker via Supabase Auth-konsoll + INSERT i `users`-tabellen
8. Logg inn og fullfør oppsett i admin-panelet
9. Legg til GitHub Secrets `SUPABASE_URL` og `SUPABASE_ANON_KEY` for keep-alive workflow

---

## Viktige hensyn

- **Sikkerhet:** RLS på alle tabeller. Ingen sensitiv data, men beskytt mot manipulering. Elever skal aldri kunne skrive til databasen. Lærere kun egne records.
- **Driftssikkerhet:** Bruk Supabase innebygde backup. Edge Functions er stateless og idempotente.
- **Supabase pause-problem:** GitHub Actions keep-alive workflow pinger Supabase REST API hver 5. dag for å hindre at prosjektet pauses i ferier.
- **Samtidige redigeringer:** Optimistic locking + Realtime-varsler.
- **Soft-delete overalt:** 30-dagers søppelbøtte for sessions, klasser, fag, brukere.
- **Ingen fritekst i strukturerte felt.**

---

Bygg i denne rekkefølgen: 1) Databaseskjema og migrasjoner, 2) RLS-regler, 3) Edge Functions, 4) Frontend-skall med routing og fargetemaer, 5) Elev-visning, 6) Lærer-visning, 7) Kontaktlærer-tillegg, 8) Admin-panel.
