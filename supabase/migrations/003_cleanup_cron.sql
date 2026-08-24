-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Soft-delete cleanup (30-day permanent purge)
-- ═══════════════════════════════════════════════════════════════

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
end;$$;

-- Schedule daily cleanup at 03:00 UTC using pg_cron
-- (pg_cron must be enabled in Supabase Dashboard → Database → Extensions)
select cron.schedule(
  'purge-soft-deletes',
  '0 3 * * *',
  'select purge_old_soft_deletes()'
);
