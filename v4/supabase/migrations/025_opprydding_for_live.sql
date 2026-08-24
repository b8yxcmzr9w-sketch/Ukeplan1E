-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Migrasjon 025: opprydding av kalenderdata før live (P60)
--
-- Bakgrunn: databasen inneholder testinnhold som ikke skal følge med inn
-- i live drift — syntetiske økter fra migrasjon 013, importerte
-- 25/26-planer fra migrasjon 014–016, og økter Morfar selv har lagt inn
-- under testing av 26/27.
--
-- PRINSIPPET som styrer denne fila: innholdet i kalenderen tømmes,
-- rammen rundt står. sessions og multi_day_events er HENDELSER lærere
-- og admin har lagt inn løpende, og slettes i sin helhet. school_calendar,
-- classes, subjects og subject_divisions er OPPSETT/STRUKTUR, ikke
-- hendelser, og røres IKKE av denne fila (se DECISIONS.md «P60 —
-- Kalenderhendelse vs. oppsett»).
--
-- ⚠️  ENGANGSKJØRING FØR LIVE — LES FØR DU KJØRER NOE SOM HELST  ⚠️
--
-- Del 2 sletter ALLE rader i sessions og multi_day_events — alle skoler,
-- alle skoleår, ingen WHERE-betingelse. Denne fila er laget for å kjøres
-- ÉN gang, rett før løsningen går live med ekte brukere.
--
-- Kjør ALDRI denne fila på nytt etter at ekte brukere har lagt inn data
-- — del 2 vil da slette ekte undervisningsplaner, med kun
-- backup-tabellene fila selv oppretter som vei tilbake.
--
-- Kjøres MANUELT i Supabase Dashboard → SQL Editor, i tre steg:
--   1. Kjør del 1 alene, noter tallene.
--   2. Fjern kommentartegnene rundt del 2 (se instruks der) og kjør den.
--   3. Kjør del 3, sammenlign mot tallene fra del 1.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- DEL 1 — TELLESPØRRINGER (kjøres FØRST og ALENE)
-- Rene SELECT-er, ingen endring. Noter tallene før du går videre
-- til del 2 — del 3 sammenligner mot disse.
-- ═══════════════════════════════════════════════════════════════

-- Skal SLETTES i del 2:
select school_year, count(*) as antall
  from sessions
 group by school_year
 order by school_year;

select count(*) as sessions_totalt from sessions;

select school_year, count(*) as antall
  from multi_day_events
 group by school_year
 order by school_year;

select count(*) as multi_day_events_totalt from multi_day_events;

-- Skal BESTÅ uendret (sammenlignes i del 3):
select school_id, count(*) as antall from school_calendar group by school_id;
select count(*) as school_calendar_totalt from school_calendar;

select school_id, count(*) as antall from classes group by school_id;
select count(*) as classes_totalt from classes;

select school_id, count(*) as antall from subjects group by school_id;
select count(*) as subjects_totalt from subjects;

select sub.school_id, count(*) as antall
  from subject_divisions sd
  join subjects sub on sub.id = sd.subject_id
 group by sub.school_id;

select count(*) as subject_divisions_totalt from subject_divisions;


-- ═══════════════════════════════════════════════════════════════
-- DEL 2 — SLETTING (⚠️ se advarselen øverst i fila)
--
-- Hele blokken under er kommentert ut som ÉN /* ... */-blokk. For å
-- aktivere den: slett de to linjene "/*" og "*/" (linjen rett under
-- denne instruksen, og linjen med bare "*/" nederst i blokken) — resten
-- av SQL-en trenger ingen endring. Gjør dette BEVISST, kun når du
-- faktisk skal kjøre slettingen.
-- ═══════════════════════════════════════════════════════════════

/*
BEGIN;

-- Sikkerhetskopi FØRST, inne i samme transaksjon som slettingen.
-- Radene kan settes tilbake med "insert into sessions select * from
-- sessions_backup_for_live" (og tilsvarende for multi_day_events)
-- siden classes/subjects/users står urørt.
create table if not exists sessions_backup_for_live as
  select * from sessions;
create table if not exists multi_day_events_backup_for_live as
  select * from multi_day_events;

-- RLS på, uten policyer: tabellene havner i public-skjemaet som
-- Supabase eksponerer via API-et, og skal ikke være lesbare utenfra.
-- Uten policyer er de kun tilgjengelige for service-role og SQL Editor.
alter table sessions_backup_for_live enable row level security;
alter table multi_day_events_backup_for_live enable row level security;

-- session_divisions og pending_transfers rydder seg selv via
-- "on delete cascade" fra sessions — ingen egne slette-setninger.
delete from sessions;
delete from multi_day_events;

COMMIT;
*/


-- ═══════════════════════════════════════════════════════════════
-- DEL 3 — KONTROLL (kjøres ETTER del 2)
-- ═══════════════════════════════════════════════════════════════

-- Forventet: 0 rader begge steder
select count(*) as sessions_gjenvaerende from sessions;
select count(*) as multi_day_events_gjenvaerende from multi_day_events;

-- Forventet: SAMME tall som i del 1
select school_id, count(*) as antall from school_calendar group by school_id;
select count(*) as school_calendar_totalt from school_calendar;

select school_id, count(*) as antall from classes group by school_id;
select count(*) as classes_totalt from classes;

select school_id, count(*) as antall from subjects group by school_id;
select count(*) as subjects_totalt from subjects;

select sub.school_id, count(*) as antall
  from subject_divisions sd
  join subjects sub on sub.id = sd.subject_id
 group by sub.school_id;

select count(*) as subject_divisions_totalt from subject_divisions;


-- ═══════════════════════════════════════════════════════════════
-- OPPRYDDING AV BACKUP-TABELLENE (SENERE — ikke del av denne kjøringen)
--
-- Når Morfar har bekreftet at oppryddingen er riktig (etter noen
-- dager/uker i live drift, ikke samme dag), kan backup-tabellene
-- droppes:
--
--   drop table if exists sessions_backup_for_live;
--   drop table if exists multi_day_events_backup_for_live;
-- ═══════════════════════════════════════════════════════════════
