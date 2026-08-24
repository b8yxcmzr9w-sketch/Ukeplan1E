-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Sporbarhet på økter
-- Sørger for at «opprettet av» og «sist endret av» alltid fylles ut,
-- uavhengig av hva klienten sender.
-- Kjøres manuelt i Supabase Dashboard → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Standardverdier ved opprettelse ───────────────────────────
-- Frontend setter disse eksplisitt, men standardverdiene gjør at
-- en insert aldri feiler på not null selv om klienten glemmer dem.
alter table sessions alter column created_by set default auth.uid();
alter table sessions alter column school_id  set default auth_school_id();

-- ── 2. Sist endret av – settes alltid av databasen ───────────────
-- Utvider eksisterende trigger-funksjon (trg_sessions_modified) til
-- også å stemple hvem som endret, og låser created_by mot endring.
create or replace function set_last_modified()
returns trigger language plpgsql as $$
begin
  new.last_modified_at := now();
  new.last_modified_by := coalesce(auth.uid(), new.last_modified_by);
  new.created_by       := old.created_by;  -- opprettet av kan aldri endres
  return new;
end;$$;

-- ── 3. Tett historiske hull ──────────────────────────────────────
-- Eldre økter uten last_modified_by: anta at den som opprettet økten
-- også var den som sist endret den.
update sessions
   set last_modified_by = created_by
 where last_modified_by is null;
