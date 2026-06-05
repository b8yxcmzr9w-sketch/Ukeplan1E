# Ukeplan v4

Ukeplantjeneste for én skole. Elever, lærere, kontaktlærere og admin.

**Stack:** Supabase (PostgreSQL + Auth + Edge Functions + Realtime) · GitHub Pages

---

## Oppsett steg for steg

### 1. Opprett Supabase-prosjekt
1. Gå til [supabase.com](https://supabase.com) og opprett et nytt prosjekt
2. Noter ned **Project URL** og **anon public key** (Settings → API)

### 2. Kjør migrasjoner
I Supabase-dashboardet → SQL Editor, kjør filene i rekkefølge:
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_cleanup_cron.sql
```
> **OBS:** `003_cleanup_cron.sql` krever at `pg_cron`-utvidelsen er aktivert.  
> Gjør dette under: Database → Extensions → pg_cron → Enable

### 3. Aktiver Storage
I Supabase-dashboardet → Storage → New bucket:
- Navn: `logos`
- Public: **ja** (logoer er offentlige)

### 4. Sett Gemini API-nøkkel som secret
```bash
# Krev Supabase CLI installert
supabase secrets set GEMINI_API_KEY=din_nøkkel_her --project-ref DIN_PROJECT_REF
```
Alternativt: Supabase Dashboard → Edge Functions → Secrets → Add new secret

### 5. Deploy Edge Functions
```bash
supabase functions deploy ical               --project-ref DIN_PROJECT_REF
supabase functions deploy ai-parse-sessions  --project-ref DIN_PROJECT_REF
supabase functions deploy ai-parse-skolerute --project-ref DIN_PROJECT_REF
supabase functions deploy generate-facts     --project-ref DIN_PROJECT_REF
supabase functions deploy cleanup            --project-ref DIN_PROJECT_REF
```

### 6. Oppdater app.js
Åpne `v4/app.js` og endre de to øverste linjene:
```js
const SUPABASE_URL = 'https://DIN_REF.supabase.co'
const SUPABASE_ANON_KEY = 'din_anon_key_her'
```

### 7. Publiser på GitHub Pages
1. Push koden til GitHub-repoet ditt
2. Settings → Pages → Source: Deploy from branch → velg `main` / `v4`-mappen  
   (eller flytt innholdet i `v4/` til rot)
3. Nettsiden er tilgjengelig på `https://BRUKERNAVN.github.io/REPO/`

### 8. Konfigurer invitasjons-URL i Supabase
Når admin inviterer nye brukere sendes en e-post med en lenke. Lenken må peke til riktig nettadresse.

1. Gå til Supabase Dashboard → **Authentication → URL Configuration**
2. Sett **Site URL** til nettadressen der appen kjører, f.eks.:
   ```
   https://ukeplan1e.ganddal.net/v4
   ```
3. Legg til samme adresse under **Redirect URLs**

> Hvis adressen endres (nytt domene, ny mappe), må dette oppdateres her.

### 8b. Tilpass e-postmaler (anbefalt)
Standard Supabase-maler er på engelsk og lite informative. Bytt dem ut med de norske:

1. Gå til Supabase Dashboard → **Authentication → Emails**
2. Velg **«Invite user»** → lim inn innholdet fra `supabase/templates/invite.html`
3. Velg **«Reset password»** → lim inn innholdet fra `supabase/templates/recovery.html`

Invitasjonsmalen bruker metadata (navn, skole, rolle) som sendes av `create-user`-funksjonen,
og vises via `{{ .Data.full_name }}`, `{{ .Data.school_name }}` og `{{ .Data.rolle }}`.

### 9. Opprett første admin-bruker
1. Supabase Dashboard → Authentication → Users → Add user
   - Fyll inn e-post og passord
2. Kjør i SQL Editor:
```sql
insert into schools (name) values ('Din skole') returning id;
-- Noter skolens id, f.eks. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

insert into users (id, school_id, full_name, role, is_admin_active)
values (
  'auth_user_id_fra_steg_1',
  'school_id_fra_over',
  'Ditt navn',
  'admin',
  true
);
```
3. Logg inn på nettsiden og fullfør oppsett i Admin-panelet

---

## Elev-URL
Del denne lenken med elevene (erstatt `1E` med klassenavnet):
```
https://DIN_SIDE.github.io/#/klasse/1E
```
Lærere og admin kan også kopiere lenken eller vise QR-kode direkte i appen
(Min klasse → «Del elevlenke», eller Admin → Klasser → «Kopier elevlenke»).

---

## Struktur
```
v4/
├── index.html              Appskall
├── app.js                  All applogikk
├── style.css               Styling (3 temaer, print, mobil)
├── PROMPT.md               Fullstendig kravspesifikasjon
├── README.md               Dette dokumentet
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   ├── 002_rls.sql
    │   └── 003_cleanup_cron.sql
    ├── templates/
    │   ├── invite.html          Invitasjons-e-post (norsk)
    │   └── recovery.html        Tilbakestill passord-e-post (norsk)
    └── functions/
        ├── ical/index.ts
        ├── ai-parse-sessions/index.ts
        ├── ai-parse-skolerute/index.ts
        ├── generate-facts/index.ts
        ├── create-user/index.ts
        └── cleanup/index.ts
```

---

## Roller
| Rolle | Tilgang |
|---|---|
| Elev (ingen login) | Leser ukeplanen for sin klasse |
| Lærer | Administrerer egne økter |
| Kontaktlærer | Som lærer + alle klasse-økter + flerdagshendelser + backup |
| Admin | Full tilgang + skoleadministrasjon |

---

## Fargetemaer
Admin velger tema under Skoleinfo: **Standard** (grønn) · **Lys** (blå) · **Mørk**
