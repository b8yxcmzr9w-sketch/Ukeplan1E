# Prompt: Bygg Ukeplan v4

## Prosjektbeskrivelse

Bygg en nettbasert ukeplantjeneste for én videregående skole. Elevene kan se ukeplanen for sin klasse via en dedikert URL. Lærere og kontaktlærere administrerer egne og klassens økter. Admin styrer hele oppsettet.

**Teknologistack:**
- **Backend/database:** Supabase (PostgreSQL + Row Level Security + Auth + Edge Functions + Realtime)
- **Frontend:** Statiske filer på GitHub Pages – `index.html`, `app.js`, `style.css` (null build-steg)
- **AI-parsing:** Google Gemini Flash API (nøkkel lagres i Supabase-konfig, brukes av Edge Functions)
- **Kalenderabonnement:** Supabase Edge Function genererer iCal-feed
- **Ingen andre tjenester**

Spør om noe er uklart før du begynner å bygge.

---

## Databaseskjema (PostgreSQL / Supabase)

Lag migrasjoner for alle tabeller. Bruk UUID som primærnøkkel overalt. Alle sletteoperasjoner skal bruke soft-delete med `deleted_at`-kolonne. En cron-jobb (Supabase pg_cron eller Edge Function) sletter permanent etter 30 dager.

```
schools          – id, name, logo_url, logo_file_path, school_year_start_week, school_year_end_week, color_theme(enum: standard|lys|mork), created_at
classes          – id, school_id, name, sort_order, deleted_at
subjects         – id, school_id, name, short_code, color_hex, has_parti, has_gruppe, max_divisions(default 8), deleted_at
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

---

## Roller og tilganger

### Elev (ikke innlogget)
Tilgang via URL: `/?klasse=1E` eller `/#/klasse/1E`

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
- **Klassestruktur:** Definer for hver klasse hvilke dager hvert fag fortrinnsvis undervises (standard dager). Definer antall partier/grupper per fag og navngi dem (inntil 8).
- **Backup:** Last ned komplett backup av klassen som JSON (alle sessions, multi_day_events, school_calendar-rader for klassen, klassestruktur). Last opp backup → vis liste over økter i backup-filen → la kontaktlærer velge hvilke økter som skal importeres → duplikatkontroll → importer valgte.
- Kan ha inntil 2 kontaktlærere per klasse

### Admin (innlogget, `is_admin_active=true`)

**Rollebytte:** Knapp i header: «Gå ut av admin-modus» / «Aktiver admin-modus» – ingen ny innlogging nødvendig. Utenfor admin-modus: vanlig lærer/kontaktlærer-tilgang.

**Skoleinfo:**
- Navn på skolen
- Logo: last opp bildefil (lagres i Supabase Storage) ELLER skriv inn URL
- Definer skoleårets start- og sluttuke (ISO-ukenummer)
- **Fargepalett:** Velg mellom tre forhåndsdefinerte temaer – Standard (nåværende grønn), Lys (lys palett med kontrasterende farger) og Mørk (mørk palett). Valget lagres i `schools.color_theme` og lastes automatisk for alle besøkende på skolen.
- **Skolefakta for overlay:** Legg inn morsomme eller interessante fakta/sitater om skolen som vises tilfeldig i lagre-overlay.

**Fag:**
- Legg til/rediger fagnavn og forkortelse
- Definer: har dette faget parti eller gruppe (ikke begge)? Maks 8 inndelinger.
- Endre fagnavn: vis advarsel «Dette endrer alle eksisterende økter med dette faget». Endre i alle sessions ved bekreftelse.
- Slett fag: bruk soft-delete

**Klasser:**
- Legg til klasser
- Slett klasse: sterk advarsel + soft-delete (30 dager)
- Slå sammen to klasser: velg hvilke fag som tas med. Vis konfliktoversikt (overlappende sessions). Admin løser konflikter manuelt. Bruk søppel-funksjon for det som ikke tas med.

**Brukere:**
- Legg til ny lærer: navn, e-post (Supabase Auth), rolle, tilknyttede klasser
- Rediger lærer: endre navn (advarsel: «Navn endres i alle oppføringer»), rolle, klasser
- Slett lærer: kun fremtidige sessions (fra og med i dag) tildeles annen lærer eller slettes. Historiske sessions beholdes med opprinnelig navn.
- Definer inntil 2 kontaktlærere per klasse
- Definer inntil 2 admins per skole

**Skolerute:**
- Legg inn manuelt (tabellform: tittel, startdato, sluttdato, type)
- AI-import: lim inn tekst → Gemini Flash parser → forhåndsvis → lagre

---

## UX-krav

**Lagre-overlay:**
Alle lagre-operasjoner bruker et morsomt overlay-mønster:
1. Klikk «Lagre» → overlay vises med spinner og én av følgende (tilfeldig):
   - En kort morsom tekst (f.eks. «Sender tanker til skyene…», «Overtaler databasen…», «Stokker bits…»)
   - Et tilfeldig skolefakta/-sitat hentet fra `school_facts`-tabellen (hvis admin har lagt inn noen)
2. Ved suksess: sjekk-ikon + «Lagret!» i 1,5 sek
3. Ved feil: rød feilmelding med mulighet for retry
Overlay hindrer dobbeltklikk og utilsiktede hendelser.

**Felt i skjema:**
Alle forhåndsdefinerte verdier (fag, klasse, dag, uke, parti/gruppe, lærer) velges fra nedtrekkslister. Ingen fritekst for strukturerte felt.

**Responsivt design:**
- **Laptop:** 5-kolonners ukevisning, minst 3 synlige økter per dag (dagkolonnen har fast minimumshøyde og scroller ved overflow)
- **Mobil:** én kolonne per dag (horisontal scroll mellom dager), kondensert kortvisning

**Fargetemaer:**
Definer tre komplette CSS-temaer med CSS custom properties (variabler). Tema lastes ved oppstart basert på `schools.color_theme`:
- `standard` – nåværende grønn palett (`--primær: #2d6a4f` osv.)
- `lys` – lys, luftig palett med en annen primærfarge (f.eks. blå eller teal)
- `mork` – mørk palett egnet for lavlysbruk

---

## Edge Functions (Supabase)

1. **`/ical`** – Generer iCal-feed. Params: `klasse`, `laerer`, `parti`, `gruppe`. Henter data fra DB og returnerer `text/calendar`.
2. **`/ai-parse-sessions`** – Mottar tekst + klasse/kontekst. Sender til Gemini Flash med strukturert system-prompt. Returnerer array av parsede økt-objekter.
3. **`/ai-parse-skolerute`** – Mottar tekst. Sender til Gemini Flash. Returnerer array av kalender-hendelser.
4. **`/cleanup`** – Kjøres periodisk (pg_cron eller scheduled function): sletter soft-deleted records eldre enn 30 dager permanent.

Gemini API-nøkkel lagres som Supabase secret (`GEMINI_API_KEY`).

---

## Filstruktur

```
/
├── index.html          – Appskall, navigasjon, routing
├── app.js              – All applogikk, Supabase-klient, views
├── style.css           – Styling inkl. fargetemaer, @media print og mobile
├── supabase/
│   ├── migrations/     – SQL-migrasjoner i rekkefølge
│   └── functions/      – Edge Functions (ical, ai-parse-sessions, ai-parse-skolerute, cleanup)
└── README.md           – Oppsettsinstruksjoner
```

---

## Oppsettsinstruksjoner (README)

Inkluder steg-for-steg:
1. Opprett Supabase-prosjekt
2. Kjør migrasjoner
3. Sett secrets (`GEMINI_API_KEY`)
4. Deploy Edge Functions
5. Oppdater Supabase URL + anon key i `app.js`
6. Push til GitHub, aktiver GitHub Pages på `main`-branch
7. Opprett første admin-bruker via Supabase Auth-konsoll
8. Logg inn og fullfør oppsett i admin-panelet

---

## Viktige hensyn

- **Sikkerhet:** RLS på alle tabeller. Ingen sensitiv data, men beskytt mot manipulering. Elever skal aldri kunne skrive til databasen. Lærere kun egne records.
- **Driftssikkerhet:** Bruk Supabase innebygde backup. Edge Functions er stateless og idempotente.
- **Samtidige redigeringer:** Optimistic locking + Realtime-varsler.
- **Soft-delete overalt:** 30-dagers søppelbøtte for sessions, klasser, fag, brukere.
- **Ingen fritekst i strukturerte felt.**

---

Bygg i denne rekkefølgen: 1) Databaseskjema og migrasjoner, 2) RLS-regler, 3) Edge Functions, 4) Frontend-skall med routing og fargetemaer, 5) Elev-visning, 6) Lærer-visning, 7) Kontaktlærer-tillegg, 8) Admin-panel.
