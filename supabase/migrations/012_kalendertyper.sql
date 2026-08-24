-- ═══════════════════════════════════════════════════════════════
-- Kalendertyper: oppdater calendar_type_enum til verdiene appen bruker
--
-- Live-databasen har fortsatt 001-verdiene (ferie|fridag|annet), mens
-- app.js og ai-parse-skolerute bruker ferie|helligdag|planleggingsdag|
-- annet. Enumen gjenskapes (rename → create → konverter kolonne →
-- drop) i stedet for ALTER TYPE ... ADD VALUE, fordi en ny enum-verdi
-- ikke kan tas i bruk i samme transaksjon som den legges til — og
-- SQL Editor kjører hele skriptet i én transaksjon.
--
-- Eksisterende rader med 'fridag' konverteres til 'helligdag'
-- (samme blokkeringsoppførsel, vises som «høytid» i UI).
-- Trygg å kjøre flere ganger.
-- ═══════════════════════════════════════════════════════════════

do $$
begin
  -- Hopp over hvis enumen allerede har de riktige verdiene
  if exists (select 1 from pg_enum e
             join pg_type t on t.oid = e.enumtypid
             where t.typname = 'calendar_type_enum'
               and e.enumlabel = 'planleggingsdag') then
    raise notice 'calendar_type_enum er allerede oppdatert — ingen endring.';
    return;
  end if;

  alter type calendar_type_enum rename to calendar_type_enum_old;

  create type calendar_type_enum as enum
    ('ferie', 'helligdag', 'planleggingsdag', 'annet');

  alter table school_calendar
    alter column type drop default,
    alter column type type calendar_type_enum
      using (case when type::text = 'fridag' then 'helligdag'
                  else type::text end)::calendar_type_enum,
    alter column type set default 'ferie';

  drop type calendar_type_enum_old;

  raise notice 'calendar_type_enum oppdatert: ferie | helligdag | planleggingsdag | annet.';
end $$;
