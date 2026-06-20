# PLAN — Ukeplan1E v4

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
