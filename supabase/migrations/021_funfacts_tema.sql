-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Migrasjon 021: temastyring for funfacts (P41)
--
-- Fritekst-felt på schools som admin fyller ut i Funfacts-fanen.
-- generate-facts leser feltet selv fra DB og fletter det inn i
-- prompten som ekstra instruksjon. Kun fritekst — ingen automatisk
-- innblanding av annen skoleinfo.
--
-- INGEN RLS-endring: schools_write_admin (migrasjon 019) dekker
-- skriving, schools_read_public dekker lesing.
--
-- Kjøres MANUELT i Supabase Dashboard → SQL Editor.
-- Idempotent: trygt å kjøre flere ganger.
-- ═══════════════════════════════════════════════════════════════

alter table schools
  add column if not exists facts_theme text;
