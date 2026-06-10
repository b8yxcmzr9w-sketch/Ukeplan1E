# Ukeplan1E – Prosjektbeskrivelse for Claude

## Hva er dette?
Ukeplan v4 er en norsk ukeplantjeneste for Øksnevad videregående skole (Rogaland).
Lærere planlegger undervisningsøkter per klasse/uke. Elever ser sin klasses plan.
Admins administrerer skolen, fag, klasser, brukere og skoleruten.

Produksjon: https://ukeplan1e.ganddal.net/v4/

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

## SQL-migrasjoner
Kjøres manuelt i Supabase Dashboard → SQL Editor. Aldri via CLI fra denne kodebasen.

## Utviklingsbranch
Aktiv branch: `claude/bugfix-liste-UGKlC`
Merge til `main` via PR på GitHub: `b8yxcmzr9w-sketch/Ukeplan1E`

## Kjente pågående issues
- `GEMINI_API_KEY` i Supabase Secrets er usikker — ny nøkkel fra aistudio.google.com/apikey
  må settes for at `ai-parse-skolerute`, `ai-parse-sessions` og `generate-facts` skal virke
- `006_fix_school_facts_rls.sql` — sjekk om denne er kjørt i prod

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
