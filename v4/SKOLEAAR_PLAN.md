# Skoleår – plan og status

Funksjon for å støtte flere skoleår i Ukeplan v4. Format: `'YY/YY'` (f.eks. `'25/26'`
for skoleåret 2025–2026). Lagres som `active_school_year` på skolen og `school_year`
på hver økt / flerdagsarrangement.

## Brukerens designvalg (besluttet)

- **Behold data** + merk med skoleår + eksport-backup (JSON / Excel-CSV / PDF).
- **Lærere**: kan lese + **kopiere** tidligere år (redigerbar kopi), men IKKE
  redigere / slette / overføre økter fra gamle år.
- **Bulk-kopi**: Nivå A (valgte økter → mål-uke) + påminnelse om "Lim inn med AI"
  for mange økter.
- **Fast 17. mai** som skille for "neste år"-vinduet.
- **Ingen automatisk sletting** av gamle data.
- **Ingen nedtrekksmeny** for å bytte aktivt år i admin – i stedet en
  **"Nytt skoleår"-knapp** med redigerbart felt (skriv "26" → autofyller "26/27").

## Status

- ✅ **Fase 1** – Datamodell + migrering
  `v4/supabase/migrations/004_school_year.sql` (KJØRT i Supabase SQL Editor).
  Legger til `schools.active_school_year`, `sessions.school_year`,
  `multi_day_events.school_year`, SQL-funksjon `skoleaar_kalenderaar()`, indekser,
  og backfiller eksisterende data til `'25/26'`.
- ✅ **Fase 2** – Admin-fane "Skoleår" (`renderSkoleaarTab`) + "Nytt skoleår"-knapp
  med auto-utfyllende felt. Alle nye økt-inserts stempler `school_year`.
- ✅ **Fase 3** – Tilgang & filtrering:
  - Elevvisning: henter kun aktivt skoleår.
  - Lærervisning (Min klasse): skoleår-velger når >1 år finnes; tidligere år er
    skrivebeskyttet (kun les + kopi), gult banner, "+ Ny økt" skjult, bulk-bokser skjult.
  - Alle økter-fane: filtrerer på aktivt år.
  - Søk-fane: standard aktivt år + nedtrekksfilter for å søke i tidligere år
    (treff i gamle år er skrivebeskyttet, kun kopi).
- ✅ **Fase 4** – Redigerbar kopi + bulk-kopi Nivå A:
  - `visKopierOktModal`: full redigerbar, forhåndsutfylt kopi-modal (fag, parti,
    uke, dag, lærer, aktivitet, møtested, info). Stempler alltid aktivt år.
  - `visBulkKopierModal`: "Kopier valgte" i bulk-baren → mål-uke (dag beholdes),
    valgfritt behold opprinnelig lærer. AI-påminnelse vises ved ≥6 økter.

- ✅ **Fase 5** – Neste-år-vindu (fast 17. mai):
  - `nesteSkolear(sy)` og `erNesteAarVinduApent()` som globale hjelpefunksjoner.
  - Fra 17. mai vises neste skoleår i skoleår-velgeren i lærervisning med merkelapp
    "(planlegg)". Vinduet er **skrivbart** — lærere kan legge inn og redigere økter
    for neste år mens inneværende år fortsatt er aktivt.
  - `visNyOktModal` tar valgfritt `skoleAar`-argument slik at nye økter stemples riktig.
  - Blått banner vises når planleggingsvinduet er aktivt.
  - Admin-fanen "Skoleår" viser om vinduet er åpent eller når det åpner (17. mai).

- ✅ **Fase 6** – iCal + datovisning:
  - `skoleaarKalenderaar()` i app.js brukes nå i elevvisning for korrekte datoer
    over nyttår (uke 10 i skoleår 25/26 → 2026, ikke 2025).
  - iCal Edge Function: filtrerer på `active_school_year`, bruker
    `kalenderaarForUke()` (speiler SQL-funksjonen) for riktig kalenderår per økt.
  - `visICalModal`: URL-mismatch fikset — sender nå `school_id` + `klasse`-navn
    (eller `laerer`-navn) som funksjonen faktisk forventer.

## Gjenstår

- **Fase 7** – Neste-år-vindu (fast 17. mai som skille).
- **Fase 6** – iCal + datovisning: utled kalenderår fra `school_year` + `week_nr`
  (bruk samme logikk som SQL-funksjonen `skoleaar_kalenderaar`).
- **Fase 7** – Eksport (JSON / Excel-CSV / PDF) + "Start nytt skoleår"-flyt i admin.

## Viktige invarianter / fallgruver

- **Init-rekkefølge**: session MÅ være kjent FØR første `router()`-kall (router
  omdirigerer `#/laerer` → `#/login` når `APP.user` er null, kan ikke angres).
  Se kommentar i `init()` i `app.js`. Test refresh i nettleser, ikke bare `node --check`.
- **CDN-vakt**: `window.supabase` sjekkes på toppnivå + `startApp()` try/catch +
  `defer` på scripts, for å hindre evig "Laster…".
- **Cache-busting**: bump `?v=YYYYMMDDx` i `index.html` ved hver endring (Safari
  cacher hardt – hard refresh / privat vindu bekrefter cache vs. kode).

## Utviklingsbranch

`claude/sharp-goldberg-UGKlC`
