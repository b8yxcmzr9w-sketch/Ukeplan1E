# PLAN — Ukeplan1E v4

## Status: VENTER PÅ GODKJENNING — Økt B (P3): klasse-admin ukeinntasting + skoleår-veksler
## Neste steg etter godkjenning: se delplan nedenfor

---

## Økt B (P3): Klasse-admin – ukeinntasting + skoleår-veksler

### Kartlegging — dagens tilstand

**`renderSkolerute` (linje 3926–4024):**
- Har allerede en `<select>` (skoleår-dropdown) øverst med aktivt år + neste år.
- Problem: neste-skoleår-alternativet vises **alltid** — ikke gated av
  `erNesteAarVinduApent()`. Dvs. selv midt i november kan man klikke seg over til
  neste år og legge inn hendelser der (kanskje ikke etter hensikten).
- Visuell markering: liten label «Skoleår:» + `<select>`. Under denne er en
  `skolear-banner` med perioden (f.eks. «Skoleår 25/26 (uke 33 2025 – uke 24 2026)»).
  Indikasjonen finnes, men er ikke veldig tydelig (særlig om man er midt i det
  aktive året og ikke tenker over det).

**`visNySkolerute(onSave, skolear)` (linje 4026–4087):**
- Modal med: Tittel, Fra dato (`<input type="date">`), Til dato (`<input type="date">`),
  Type-dropdown (ferie/høytid/planleggingsdag/annet).
- **Ingen ukenummer-input** — admin må taste inn råe datoer, ikke ukenummer.
- En live-advarsel vises hvis datoen er utenfor det valgte skoleårets intervall.
- Lagrer direkte i `school_calendar` med `start_date`/`end_date` fra date-pickerne.

**Tilgjengelige hjelpefunksjoner:**
- `isoWeekToDate(year, week, dayOfWeek)` (linje 110) — uke + år + ukedag → `Date`
- `skoleaarKalenderaar(schoolYear, weekNr, startWeek)` (linje 166) — riktig kalenderår
- `erNesteAarVinduApent()` (linje 157) — `true` fra 17. mai
- `nesteSkolear(sy)` (linje 149) — neste skoleår-streng
- `skoleaarIntervall(sy)` (linje 175) — datointervall for skoleår
- `getISOWeek(date)` (linje 102) — dato → ISO-ukenummer
- `ukeTekst(fra, til)` (linje 4113, inne i `visSkoleruteForhandsvisning`) — dato → «uke X»

---

### Delplan

**Delsteg A — Skoleår-veksler: gate + tydeligere UI i `renderSkolerute`** [ ]

Scope: `renderSkolerute` i `app.js` (~linje 3934–3957).

- Gate neste-skoleår-alternativet bak `erNesteAarVinduApent()`:
  - Hvis vinduet IKKE er åpent: vis bare aktivt år som ren tekst/badge (ingen
    dropdown nødvendig — bare ett alternativ).
  - Hvis vinduet ER åpent: vis en tydelig veksler (toggle-knapper eller select)
    mellom «Aktivt år» og «Neste år (planleggingsmodus)».
- Gjør redigert skoleår mer synlig:
  - Aktivt år: normal `skolear-banner` (som i dag).
  - Neste år valgt: et tydelig «Planleggingsmodus»-varselsbanner (annen farge,
    f.eks. `--info-bg`) slik at admin ikke kan ta feil.
- Ingen endringer i DB-spørringen — `skoleaarIntervall(valgtSkolear)` gir korrekt filter.

**Delsteg B — Ukenummer-inntasting i `visNySkolerute`** [ ]

Scope: `visNySkolerute` i `app.js` (~linje 4026–4087) + minimal CSS.

- Erstatt date-pickerene med uke-inndatafelter som primær input:
  - «Fra uke» (tall, 1–53) + «Fra dag» (select: man/tir/ons/tor/fre, default mandag)
  - «Til uke» (tall, 1–53) + «Til dag» (select: man/tir/ons/tor/fre, default fredag)
  - Default: «Til uke» kopierer «Fra uke» ved endring (for enkeltukehendelser)
- Beregn `start_date`/`end_date` i kode ved submit (ikke live preview — se under):
  ```js
  const aar = skoleaarKalenderaar(skolear, fraNr, startWeek)
  const startDate = isoWeekToDate(aar, fraNr, fraDay).toISOString().slice(0, 10)
  // For tilDato: husk at uke over nyttår kan ha annet kalenderår
  const aarTil = skoleaarKalenderaar(skolear, tilNr, startWeek)
  const endDate = isoWeekToDate(aarTil, tilNr, tilDay).toISOString().slice(0, 10)
  ```
- Vis beregnede datoer som hjelpetekst under feltene (read-only, oppdateres live
  ved `oninput` på uke-feltene, så admin ser hva som vil lagres).
- Behold advarsel om dato utenfor skoleåret (nå trigget av beregnet dato).
- DB-skjema endres ikke — lagrer fortsatt `start_date`/`end_date`.

**Delsteg C — Bump `?v=`, commit og push** [ ]
- Bump til `?v=20260617b` i `v4/index.html` (CSS-endringer i A + JS-endringer i A+B).
- Commit per delsteg med beskrivende melding.
- Push til `claude/P3-admin-skolear-uke`.
- Ingen migrasjoner. Ingen edge-function-endringer. Ingen manuelle steg i Supabase.

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

## Status: VENTER — import av ekte produksjonsdata 25/26 (NPT/NNA/Naturfag i basen)
## Neste steg (etter UI-runden): Plan_YFF limes inn → migrasjon 017

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
- [ ] (Venter på bruker) Plan_YFF — limes inn på samme måte og blir
      migrasjon 017. Syntetiske fag uten ekte motpart (norsk, matte,
      engelsk, kroppsøving + ev. YFF) beholdes inntil videre.

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
- [ ] (Venter på bruker) Ekte data: kjør
      `curl -sL -X POST '<SCRIPT_URL>' -d '{"action":"hentAlle"}'`
      lokalt og legg JSON-en i repoet — så konverteres den til SQL.

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
