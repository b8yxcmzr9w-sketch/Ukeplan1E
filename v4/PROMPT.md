# Prompt: Bygg Ukeplan v4

## Prosjektbeskrivelse

Tjenesten heter **Ukeplan1e** (uttales «ukeplanene» – én tjeneste for mange ukeplaner, med liten e). Brukes av **Øksnevad vgs**.

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
school_calendar  – id, school_id, title, start_date, end_date, type(enum: ferie|helligdag|planleggingsdag|annet)
audit_log        – id, table_name, record_id, action, changed_by, changed_at, old_data(jsonb), new_data(jsonb)
school_facts     – id, school_id, fact_text (morsomme/interessante fakta om skolen for lagre-overlay)
pending_transfers– varsler om overføringer mellom lærere
```

**Viktig om kolonnenavn:**
- `users`-tabellen bruker `full_name` (ikke `name`)
- `subject_divisions`-tabellen bruker `division_type` (ikke `type`)
- Supabase PostgREST: ved embedding via FK, bruk `users!teacher_id(full_name)` for å unngå tvetydighet (sessions har 4 FK-er til users)
- Feil kolonnenavn gir 400 for hele spørringen → tom side uten feilmelding

**Row Level Security:**
- Elever (uautorisert): SELECT på sessions, multi_day_events, school_calendar, subjects, subject_divisions, classes, schools for sin skole
- Lærer: SELECT alt for sin skole; INSERT/UPDATE/DELETE egne sessions; kan ikke endre andres
- Kontaktlærer: som lærer + INSERT/UPDATE/DELETE alle sessions i egne klasser
- Admin (når `is_admin_active=true`): full tilgang til alt for sin skole
- Ingen kryssdata mellom skoler
- RLS-policyer skal bruke inline EXISTS-subspørringer (ikke security definer-funksjoner)

---

## Roller og tilganger

### Elev (ikke innlogget)
Tilgang via direkte URL: `/#/klasse/1D` (admin kopierer lenken fra Klasser-fanen og sender til elevene)

**Velkomstside (ingen klasse i URL):** Viser skolens logo, navn, en kort innbydende tekst og alle klasser som store klikkbare knapper. Hvis ingen klasser er opprettet ennå: «Lærerne er i gang med å sette opp ukeplanen – kom tilbake snart!»

- **Ukevisning:** 5 dager stablet vertikalt på mobil, 5-kolonner på desktop. Minst 3 synlige økter per dag (scroll inni dagkolonnen ved flere).
- **Navigasjon:**
  - Pil frem/tilbake per uke (← Forrige uke / Neste uke →)
  - Ukenummer kun i input-feltet (ingen «Uke X»-label ved siden av)
  - **«Nå»-knapp:** hopper til gjeldende uke. Passiv (disabled) når du allerede er på den. Logikk: fredag etter kl. 18 og lørdag/søndag viser *neste* uke som «Nå».
  - Kun uker innen skoleårets definerte start/slutt
- **Dag-tittel:** Viser dagsnavn (MANDAG etc.) + dato uten årstall (`dd.mm`) i et diskret, lysere span (`.dag-dato`)
- **Skolenavn og klasse i header:** Vises informativt i header. `APP.currentKlasse` settes i `renderElevView`, nullstilles i lærer-/admin-visning.
- **Skolerute:** Ferieperioder, helligdager og planleggingsdager vises som banner over ukeplanen.
- **Flerdagshendelser:** Vises øverst i uken de gjelder.
- **Sortering:** Alfabetisk etter fagnavn innen hver dag.
- **Filter:** Velg parti ELLER gruppe – kun ett aktivt filter av gangen.
- **Utskrift:** Liggende A4. `#utskrift-hode` fylles med «Skolenavn – Klasse – Uke N».
- **iCal-abonnement:** Kalendernavn: «Skolenavn – Klasse» (PRODID: `//Ukeplan1e//NO`).

### Lærer (innlogget)

- Klassevis ukeoversikt + tverrklassevisning av egne økter
- Fritekst-søk i alle felt
- «🔗 Del elevlenke»: QR-kode + kopier-knapp
- Kan kun redigere/slette egne økter; kan kopiere andres
- AI-innliming, bulkredigering, soft-delete (30 dager)
- **«Nå»-knapp** i navigering (som elevvisning)
- Passordbytte og e-postbytte i Innstillinger-fanen

**Sanntid:** Supabase Realtime for aktiv klasse/uke. Optimistic locking med `version`-felt.

### Kontaktlærer (innlogget)

Alt som lærer, pluss: redigere alle økter for egne klasser, flerdagshendelser, klassestruktur, backup (JSON ned/opp).

### Admin (innlogget, `is_admin_active=true`)

- Toggle-knapp i header for rollebytte
- Åpner admin-panelet direkte ved oppstart hvis skolen ikke er satt opp
- **Skoleinfo:** Navn (maks 30 tegn), logo (fil eller URL → favicon), skoleårets start/sluttuke, fargetema
- **Fag:** Legg til/rediger, farge (12 farger), parti/gruppe-inndelinger, soft-delete
- **Klasser:** Legg til, slett (soft-delete), slå sammen, «Kopier elevlenke»
- **Brukere:** Legg til via `create-user` (invitasjons-e-post), rediger, slett. Kontoadministrasjon via `admin-user`: `get_email`, `change_email`, `set_password`, `send_reset`. Passord-seksjon i modal er sammenleggbar (▶/▼ toggle).
- **Skolerute:** Typer: `ferie|helligdag|planleggingsdag|annet`. AI-import via `ai-parse-skolerute` (Gemini Flash, krever CORS).
- **Funfacts:** Pausetekster i lagre-overlay. «✨ Generer med AI» via `generate-facts`.

---

## UX-krav

### Init-rekkefølge (viktig for Safari)
1. `sb.auth.getSession()` (lokal, ingen nettverkskall)
2. Sett `APP.user`, kall `oppdaterHeader()`, kall `await router()` → siden vises
3. I bakgrunnen: hent profil via `fetchProfile()`, hent skoledata
4. Kall `oppdaterHeader()` på nytt etter bakgrunnsdata

`document.addEventListener` for hamburger-dropdown legges **kun i `init()`** (ikke i `oppdaterHeader()` som kalles mange ganger).

### Race condition
`APP.renderToken` forhindrer stale async-renders:
```js
async function renderElevView(klasseNavn) {
  const myToken = ++APP.renderToken
  // ... async ...
  if (myToken !== APP.renderToken) return
}
```

### Lagre-overlay
`medLagreOverlay(asyncFn)`:
- Spinner vises umiddelbart
- Etter **3 sekunder** vises tilfeldig sitat (FUNNY_TEXTS eller school_facts). Sitatelementet har `visibility:hidden` frem til timeren utløper.
- `clearTimeout` ved suksess/feil
- Suksess: ✓ + «Lagret!» i 1,2 sek

### Lagre-knapper (passive)
`overvakSkjema(form, lagreKnapp)`: snapshot av alle felt ved oppstart, aktiverer knappen ved avvik. Brukes i alle 6 skjema-modaler.

### Dato- og ukevisning
- `formatDatoNO(dateStr)`: returnerer `dd.mm` uten årstall
- Dag-tittel: dagsnavn + `.dag-dato`-span (lav opacity, normal vekt)
- Nav-bar: ukenummer kun i input-feltet

### Nå-knapp logikk
```js
function getCurrentISOWeek() {
  const now = new Date()
  if (now.getDay() === 5 && now.getHours() >= 18) return getISOWeek(new Date(now.getTime() + 7*86400000))
  if (now.getDay() === 6 || now.getDay() === 0) return getISOWeek(new Date(now.getTime() + 7*86400000))
  return getISOWeek(now)
}
```

### Scrolling (mobil)
- `html, body { overflow-x: hidden; max-width: 100%; }` – ingen horisontal scrolling
- `.side-wrap { overflow-wrap: break-word; word-break: break-word; }` – lange ord brytes
- Mobil ukevisning: `.uke-grid { display:flex; flex-direction:column; }` – dager stables vertikalt

### Tooltips
Alle `<button>`-elementer har `title`-attributt med norsk hjelpetekst (hover). Eksempler:
- `← Forrige uke` → «Gå til forrige uke»
- `Nå` → «Gå til gjeldende uke»
- `✏️` → «Rediger»
- `🗑️` → «Slett»
- `📋` → «Kopier økt»
- `↗️` → «Overfør til annen klasse»
- `☰` → «Åpne meny»
- Fane-knapper → «Gå til [fanenavn]»
- Logg ut → «Logg ut av Ukeplan1e»

### Utskrift og iCal
- `#utskrift-hode` fylles med «Skolenavn – Klasse – Uke N» i `renderUke()`, vises kun ved print
- iCal-kalendernavn: `${school.name} – ${klasse}` (PRODID: `//Ukeplan1e//NO`)

### Layout og spacing
- Nav-bar: `padding: 4px 20px 0` (lite toppmargin)
- Side-wrap: `padding: 28px clamp(20px, 5vw, 80px) 60px; max-width: 1200px; margin: 0 auto`
- Elev-visning: ingen tom `side-wrap` wrapper – `week-container` appendes direkte til `main`

---

## Edge Functions (Supabase)

1. **`/ical`** – iCal-feed. Bruker `users!teacher_id(full_name)` og `subject_divisions(name, division_type)`.
2. **`/ai-parse-sessions`** – Gemini Flash → parsede økt-objekter.
3. **`/ai-parse-skolerute`** – Gemini Flash → kalender-hendelser (`ferie|helligdag|planleggingsdag|annet`).
4. **`/cleanup`** – Sletter soft-deleted records eldre enn 30 dager.
5. **`/create-user`** – Oppretter auth-bruker (service_role), sender invitasjons-e-post.
6. **`/generate-facts`** – Genererer ~40 lokaltilpassede funfacts via Gemini Flash.
7. **`/admin-user`** – `get_email`, `set_password`, `send_reset`, `change_email`. Fallback name: `'Ukeplan1e'`.

**Alle edge functions kalt fra browser MÅ ha CORS-headers:**
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

Secrets: `GEMINI_API_KEY` (påkrevd), `RESEND_API_KEY` + `RESEND_FROM` (valgfrie, for varsel-e-poster).

---

## CSS-arkitektur

### Temavariabler
Tre temaer: `standard` (grønn `#2d6a4f`), `lys` (blå `#0077b6`), `mork`. Lastes fra `schools.color_theme`.

### Reset og overflow
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { max-width: 100%; overflow-x: hidden; }
body { font-family: ...; min-height: 100vh; display: flex; flex-direction: column; }
main { flex: 1; overflow-x: hidden; }
```

### Viktige klasser
- `.skjult { display: none !important; }` – universell skjulingsklasse
- `.dag-dato { font-size:.75rem; font-weight:400; opacity:.6; text-transform:none; }` – diskret dato
- `.hdr-home-link { display:flex; align-items:center; gap:8px; text-decoration:none; color:inherit; }`
- `.hdr-hamburger { display:none; }` / `@media (max-width:600px) { .hdr-hamburger { display:inline-flex !important; } .hdr-pc-only { display:none !important; } }`
- `.nav-bar { padding: 4px 20px 0; }` – liten toppmargin
- `.uke-grid` desktop: `display:grid; grid-template-columns:repeat(5,1fr);` / mobil: `display:flex; flex-direction:column;`
- `.dag-okter { max-height:70vh; overflow-y:auto; }` – scrollbar i dagkolonne

### Ingen duplikater
Én definisjon per selektor. Fjernede duplikater: `.uke-nr-input`, `.feil-tekst`, `.felt`, `.dato-grp input`.

### Cache-busting
`style.css?v=YYYYMMDD` og `app.js?v=YYYYMMDD` – oppdateres ved hver deploy.

---

## Filstruktur

```
/v4/
├── index.html                         – Appskall (tittel: Ukeplan1e)
├── app.js                             – All applogikk, Supabase-klient, views
├── uno-footer.js                      – Footer med Uno-logo og © årstall
├── style.css                          – Styling, fargetemaer, @media print og mobile
├── unoicon.png                        – Standard favicon (hundeikon)
├── PROMPT.md                          – Dette dokumentet
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls.sql
│   │   └── 003_cleanup_cron.sql
│   ├── functions/
│   │   ├── ical/index.ts
│   │   ├── ai-parse-sessions/index.ts
│   │   ├── ai-parse-skolerute/index.ts  (krever CORS-headers)
│   │   ├── cleanup/index.ts
│   │   ├── create-user/index.ts
│   │   ├── generate-facts/index.ts
│   │   └── admin-user/index.ts
│   └── templates/
│       ├── invite.html
│       └── recovery.html
└── README.md
```

---

## Favicon
- Standard: `unoicon.png` (lokal fil). **Ikke** `uno.ganddal.net/favicon.ico` – returnerer 403.
- Med logo: favicon settes til logo-URL
- Fallback i `oppdaterHeader()`: `favicon.href = APP.school?.logo ? logo.src : 'unoicon.png'`

---

## Footer
Diskret footer med Uno-logo (lenke til `https://uno.ganddal.net`) og © årstall. Via `uno-footer.js` rett før `</body>`. Skjules ved print. Sticky via flex-layout.

---

## Viktige hensyn

- **Safari/mobil:** `init()` ikke-blokkerende – `router()` kalles umiddelbart etter lokal `getSession()`.
- **Kolonnenavn:** `users.full_name`, `subject_divisions.division_type`, `users!teacher_id(full_name)`.
- **CORS:** Alle edge functions kalt fra browser MÅ ha OPTIONS-handler og CORS-headers.
- **Driftssikkerhet:** GitHub Actions keep-alive pinger Supabase hver 5. dag.
- **Soft-delete:** 30 dager for sessions, klasser, fag, brukere.
- **Ingen fritekst i strukturerte felt.**

---

Bygg i denne rekkefølgen: 1) Databaseskjema og migrasjoner, 2) RLS-regler, 3) Edge Functions, 4) Frontend-skall med routing og fargetemaer, 5) Elev-visning, 6) Lærer-visning, 7) Kontaktlærer-tillegg, 8) Admin-panel.
