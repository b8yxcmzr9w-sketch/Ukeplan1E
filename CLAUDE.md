# Ukeplan1E – Prosjektbeskrivelse for Claude

## Hva er dette?
Ukeplan v4 er en norsk ukeplantjeneste for Øksnevad videregående skole (Rogaland).
Lærere planlegger undervisningsøkter per klasse/uke. Elever ser sin klasses plan.
Admins administrerer skolen, fag, klasser, brukere og skoleruten.

Dagens løsning i bruk: ukeplan1e.ganddal.net (fryst). Ny løsning under utvikling: /v4/.

## Arbeidsrutiner (VIKTIG)
- PRODUKSJON I AKTIV BRUK — fryst: rotfilene `index.html`, `CNAME`,
  `appsscript.gs`, `logo.png` er dagens løsning som brukes daglig og skal
  ALDRI endres. Eneste redigerbare områder: `v4/`, `CLAUDE.md` og `PLAN.md`.
- Ved større oppgaver: skriv plan til `PLAN.md` (med avkrysningsbokser)
  før koding starter, og vent på godkjenning.
- Etter hvert fullført delsteg: kryss av i `PLAN.md` og oppdater «Neste steg».
- Ved JS/CSS-endringer: bump alltid `?v=YYYYMMDDx` i `v4/index.html`.
- Commit etter hver fullførte deloppgave, med beskrivende melding.
- Hold deg til oppgavens omfang — ikke endre kode utenfor det som er avtalt.

## Teknisk stack
- **Frontend**: Vanilla JS (ingen rammeverk), én fil: `v4/app.js` (~3700 linjer)
- **CSS**: `v4/style.css`
- **HTML**: `v4/index.html` (cache-busting via `?v=YYYYMMDDx` — bump ved hver endring)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Edge Functions**: Deno/TypeScript i `v4/supabase/functions/`
- **AI**: Gemini 1.5 Flash via REST API (nøkkel: `GEMINI_API_KEY` i Supabase Secrets)

## Filstruktur

```
v4/
  app.js                          # All frontend-logikk
  style.css
  index.html
  supabase/
    migrations/                   # SQL-migrasjoner (kjøres manuelt i Supabase SQL Editor)
      001_initial_schema.sql
      002_rls.sql
      003_cleanup_cron.sql
      004_school_year.sql         # Skoleår-støtte (KJØRT)
      005_test_sessions.sql       # Testdata (KJØRT)
      006_fix_school_facts_rls.sql # school_facts RLS-fix (KJØRT?)
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
}
```

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

### RLS-funksjoner i SQL
- `auth_school_id()` — returnerer school_id for innlogget bruker
- `is_active_admin()` — sjekker `is_admin_active = true`
- Policies bruker ofte: `is_active_admin() OR role = 'admin'`

## Databaseskjema (referanse)
UUID som primærnøkkel overalt. Soft-delete via `deleted_at`; cron sletter permanent
etter 30 dager.

```
schools          – id, name, logo_url, logo_file_path, school_year_start_week, school_year_end_week, color_theme(standard|lys|mork), active_school_year
classes          – id, school_id, name, sort_order, deleted_at
subjects         – id, school_id, name, short_code, color_hex, has_parti, has_gruppe, max_divisions, deleted_at
subject_divisions– id, subject_id, division_type(parti|gruppe), name, sort_order, deleted_at
users            – id (auth.uid), school_id, full_name, role(laerer|kontaktlaerer|admin), is_admin_active, deleted_at
user_classes     – user_id, class_id
sessions         – id, school_id, class_id, subject_id, division_id, week_nr, day_of_week(1-5), teacher_id, activity, meeting_point, info, school_year, version, deleted_at, ...
multi_day_events – id, school_id, class_id(null=alle), title, description, start_date, end_date, school_year, deleted_at
school_calendar  – id, school_id, title, start_date, end_date, type(ferie|helligdag|planleggingsdag|annet)
audit_log, school_facts, pending_transfers
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
Aktiv branch: `claude/bugfix-liste-UGKlC`
Merge til `main` via PR på GitHub: `b8yxcmzr9w-sketch/Ukeplan1E`

## Nøkkelfunksjoner i app.js
| Funksjon | Beskrivelse |
|---|---|
| `router()` | Hash-basert ruting |
| `renderElevView(klasseNavn)` | Elevvisning |
| `renderLaererView()` | Lærervisning med tabs |
| `renderAdminPanel()` | Adminpanel med tabs |
| `renderMinKlasseTab(container)` | Ukeoversikt for lærer |
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
| `showToast(msg, type)` | Toast-melding |
| `medLagreOverlay(fn)` | Vis lagre-overlay under async operasjon |
| `el(tag, attrs, ...children)` | DOM-hjelpefunksjon |

## Header-struktur
Viser: `[skoleår] [Skolenavn] [klasse X]` — skoleår og klasse er mindre tekst,
skolenavn dominerer. Klassevelger (select) for lærer med flere klasser ligger
utenfor `<a>`-taggen (for å unngå navigasjon ved klikk).

## Utskrift
`utskrift-hode`-div vises kun ved print. Format:
`25/26 Øksnevad vgs, klasse 1D – Uke X`
