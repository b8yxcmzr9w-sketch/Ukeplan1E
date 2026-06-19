-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Admin som additivt flagg (is_admin)
-- ---------------------------------------------------------------
-- Tidligere ble admin modellert som en egen, gjensidig utelukkende
-- rolle (role='admin'). Det gjorde at en admin ikke kunne være
-- kontaktlærer samtidig, og at admin-status forsvant hver gang
-- brukeren ble redigert (skjemaene skrev role='laerer'/'kontaktlaerer').
--
-- Ny modell: role ∈ {laerer, kontaktlaerer} er basisrollen, og et
-- eget boolsk felt users.is_admin gir admin-tilgang i tillegg.
-- Maks 3 admin per skole (endret fra 2). is_admin_active beholdes
-- uendret som visningsbryter («ser på adminpanelet nå»).
--
-- Enum-verdien 'admin' beholdes i user_role_enum (kan ikke trygt
-- fjernes) men brukes ikke lenger for nye/redigerte brukere.
--
-- Kjøres manuelt i Supabase Dashboard → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Nytt felt ────────────────────────────────────────────────
alter table users add column if not exists is_admin boolean not null default false;

-- ── 2. Datamigrering: eksisterende admins → basisrolle + is_admin ─
-- Eksisterende role='admin'-brukere får basisrolle 'laerer' og
-- is_admin=true. Juster manuelt om noen av dem også skal være
-- kontaktlærer for en klasse.
update users set is_admin = true, role = 'laerer' where role = 'admin';

-- ── 3. Helper: er innlogget bruker admin? ───────────────────────
create or replace function auth_is_admin()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select is_admin from users where id = auth.uid() and deleted_at is null),
    false
  );
$$;

-- ── 4. Maks 3 admin per skole (erstatter role-basert sjekk) ─────
create or replace function enforce_max_admins()
returns trigger language plpgsql security definer as $$
begin
  if new.is_admin and new.deleted_at is null then
    if (select count(*) from users
         where school_id = new.school_id
           and is_admin = true
           and deleted_at is null
           and id <> new.id) >= 3 then
      raise exception 'Maks 3 administratorer er tillatt per skole';
    end if;
  end if;
  return new;
end;$$;

drop trigger if exists trg_users_max_admins on users;
create trigger trg_users_max_admins
  before insert or update of is_admin, deleted_at, school_id on users
  for each row execute function enforce_max_admins();

-- ── 5. RLS: bytt role='admin' → auth_is_admin() ─────────────────

-- school_facts (migrasjon 006)
drop policy if exists "facts_write_admin" on school_facts;
create policy "facts_write_admin"
  on school_facts for all
  using (
    school_id = auth_school_id()
    and (is_active_admin() or auth_is_admin())
  );

-- sessions (migrasjon 002)
drop policy if exists "sessions_update_kontaktlaerer" on sessions;
create policy "sessions_update_kontaktlaerer"
  on sessions for update
  using (
    (auth_role() = 'kontaktlaerer' or auth_is_admin()) and
    school_id = auth_school_id() and
    (is_contact_teacher_for(class_id) or is_active_admin())
  );

drop policy if exists "sessions_delete_kontaktlaerer" on sessions;
create policy "sessions_delete_kontaktlaerer"
  on sessions for delete
  using (
    (auth_role() = 'kontaktlaerer' or auth_is_admin()) and
    school_id = auth_school_id() and
    (is_contact_teacher_for(class_id) or is_active_admin())
  );

-- subject_divisions (migrasjon 017)
drop policy if exists "subject_divisions_write_kontaktlaerer" on subject_divisions;
create policy "subject_divisions_write_kontaktlaerer"
  on subject_divisions for all
  using (
    (auth_role() = 'kontaktlaerer' or auth_is_admin()) and
    class_id is not null and
    (is_contact_teacher_for(class_id) or is_active_admin()) and
    exists (
      select 1 from subjects s
      where s.id = subject_id
        and s.school_id = auth_school_id()
    )
  );
