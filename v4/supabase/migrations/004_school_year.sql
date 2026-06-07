-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Skoleår (Fase 1: datamodell + migrering)
-- Legger til skoleår-merking på skole, økter og flerdagsarrangement.
-- Format: 'YY/YY', f.eks. '25/26' for skoleåret 2025–2026.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Aktivt skoleår på skolen ──────────────────────────────────
-- Det skoleåret elevene ser, og som nye økter stemples med som standard.
alter table schools
  add column if not exists active_school_year text;

-- ── 2. Skoleår på økter og flerdagsarrangement ──────────────────
alter table sessions
  add column if not exists school_year text;

alter table multi_day_events
  add column if not exists school_year text;

-- ── 3. Hjelpefunksjon: kalenderår fra skoleår + ukenummer ───────
-- Et skoleår spenner over to kalenderår. Uker f.o.m. oppstartsuka
-- (school_year_start_week, typ. 33) hører til første kalenderår,
-- resten til andre. Eksempel: '25/26', uke 40 → 2025; uke 10 → 2026.
create or replace function skoleaar_kalenderaar(
  p_school_year text,
  p_week_nr     int,
  p_start_week  int
) returns int language plpgsql immutable as $$
declare
  foerste_aar int;
  andre_aar   int;
begin
  if p_school_year is null or p_school_year !~ '^\d{2}/\d{2}$' then
    return extract(year from now())::int;
  end if;
  foerste_aar := 2000 + split_part(p_school_year, '/', 1)::int;
  andre_aar   := 2000 + split_part(p_school_year, '/', 2)::int;
  if p_week_nr >= p_start_week then
    return foerste_aar;
  else
    return andre_aar;
  end if;
end;$$;

-- ── 4. Migrering av eksisterende data ───────────────────────────
-- Sett aktivt skoleår til '25/26' for skoler som mangler det,
-- og stemple alle eksisterende økter/arrangement med skolens aktive år.
update schools
   set active_school_year = '25/26'
 where active_school_year is null;

update sessions s
   set school_year = sc.active_school_year
  from schools sc
 where s.school_id = sc.id
   and s.school_year is null;

update multi_day_events m
   set school_year = sc.active_school_year
  from schools sc
 where m.school_id = sc.id
   and m.school_year is null;

-- ── 5. Indekser for skoleår-filtrering ──────────────────────────
create index if not exists idx_sessions_school_year
  on sessions(school_id, school_year, week_nr) where deleted_at is null;

create index if not exists idx_mde_school_year
  on multi_day_events(school_id, school_year) where deleted_at is null;
