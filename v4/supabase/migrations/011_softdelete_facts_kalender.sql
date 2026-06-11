-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Soft-delete for school_facts og school_calendar
--
-- Del B: funfacts-FIFO trenger created_at (finne de eldste) og
-- deleted_at (soft-delete når maksgrensen nås).
-- Del C: «erstatt skolerute» trenger deleted_at på school_calendar.
-- Eksisterende cron-funksjon purge_old_soft_deletes() utvides slik
-- at radene slettes permanent etter 30 dager.
--
-- KJØRES MANUELT i Supabase Dashboard → SQL Editor, FØR frontend
-- med ?v=20260611f+ tas i bruk (appen filtrerer på deleted_at).
-- ═══════════════════════════════════════════════════════════════

-- school_facts: created_at for FIFO-rekkefølge, deleted_at for soft-delete.
-- Eksisterende rader får created_at = nå; innbyrdes rekkefølge blant dem
-- avgjøres sekundært av id i appen.
alter table school_facts
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

-- school_calendar: deleted_at for soft-delete ved «erstatt skolerute»
alter table school_calendar
  add column if not exists deleted_at timestamptz;

-- Utvid 30-dagers permanent sletting (cron-jobben fra migrasjon 003
-- kaller denne daglig — selve schedulen trenger ingen endring)
create or replace function purge_old_soft_deletes()
returns void language plpgsql security definer as $$
declare
  cutoff timestamptz := now() - interval '30 days';
begin
  delete from sessions          where deleted_at < cutoff;
  delete from multi_day_events  where deleted_at < cutoff;
  delete from classes           where deleted_at < cutoff;
  delete from subjects          where deleted_at < cutoff;
  delete from subject_divisions where deleted_at < cutoff;
  delete from users             where deleted_at < cutoff;
  delete from school_facts      where deleted_at < cutoff;
  delete from school_calendar   where deleted_at < cutoff;
end;$$;
