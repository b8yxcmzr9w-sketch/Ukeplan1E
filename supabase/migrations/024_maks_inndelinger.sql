-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Migrasjon 024: utvid maks antall inndelinger til 20 (P58)
--
-- Bakgrunn: app.js sitt skjema for «Rediger fag» (renderFagSkjema) har
-- lenge tillatt 1–20 inndelinger, men databasens CHECK-constraint fra
-- migrasjon 001 tillot kun 1–8. Lagring av fag med 9+ inndelinger feilet
-- derfor med rå Postgres-feiltekst («violates check constraint
-- subjects_max_divisions_check»), og ingen inndelingsnavn ble lagret.
--
-- Denne migrasjonen henter DB-taket opp til å matche appens 1–20, slik
-- at grensen er reell (app og DB enige) i stedet for at appen lover noe
-- databasen nekter.
--
-- CHECK-constraints ser kun egen rad — taket kan derfor IKKE gjøres
-- dynamisk per skole/fag uten en egen trigger. Bevisst ikke gjort her;
-- et fast, romslig tak (databasen som vernebøyle) er tilstrekkelig,
-- mens den praktiske/pedagogiske grensen håndheves i appen.
--
-- DEFAULT er UENDRET (fortsatt 8) — kun taket økes. Med default 20 ville
-- hvert nytt fag fått 20 tomme «Gruppe N:»-navnefelt i skjemaet, siden
-- oppdaterDivNavn tegner ett navnefelt per inndeling.
--
-- Kjøres MANUELT i Supabase Dashboard → SQL Editor.
-- Idempotent: trygt å kjøre flere ganger.
-- ═══════════════════════════════════════════════════════════════

alter table subjects
  drop constraint if exists subjects_max_divisions_check;

alter table subjects
  add constraint subjects_max_divisions_check
  check (max_divisions between 1 and 20);
