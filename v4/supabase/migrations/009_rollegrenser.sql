-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Rollegrenser håndhevet i databasen
-- Maks 2 admin per skole og maks 3 kontaktlærere per klasse har til
-- nå bare vært sjekket i nettleseren. Her legges samme grenser inn
-- som triggere, så de ikke kan omgås.
-- I tillegg rettes is_contact_teacher_for(): den slo opp i
-- class_contact_teachers, en tabell appen aldri skriver til.
-- Kontaktlærer-tilknytning lagres reelt i user_classes + users.role.
-- Kjøres manuelt i Supabase Dashboard → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Riktig kilde for kontaktlærer-sjekken i RLS ───────────────
create or replace function is_contact_teacher_for(p_class_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from user_classes uc
    join users u on u.id = uc.user_id
    where uc.class_id = p_class_id
      and uc.user_id = auth.uid()
      and u.role = 'kontaktlaerer'
      and u.deleted_at is null
  );
$$;

-- ── 2. Maks 2 admin per skole ────────────────────────────────────
create or replace function enforce_max_admins()
returns trigger language plpgsql security definer as $$
begin
  if new.role = 'admin' and new.deleted_at is null then
    if (select count(*) from users
         where school_id = new.school_id
           and role = 'admin'
           and deleted_at is null
           and id <> new.id) >= 2 then
      raise exception 'Maks 2 administratorer er tillatt per skole';
    end if;
  end if;
  return new;
end;$$;

drop trigger if exists trg_users_max_admins on users;
create trigger trg_users_max_admins
  before insert or update of role, deleted_at, school_id on users
  for each row execute function enforce_max_admins();

-- ── 3. Maks 3 kontaktlærere per klasse ───────────────────────────
create or replace function antall_kontaktlaerere(p_class_id uuid, p_ekskluder_user uuid)
returns int language sql stable security definer as $$
  select count(*)::int
  from user_classes uc
  join users u on u.id = uc.user_id
  where uc.class_id = p_class_id
    and u.role = 'kontaktlaerer'
    and u.deleted_at is null
    and u.id is distinct from p_ekskluder_user;
$$;

-- Når en kontaktlærer knyttes til en klasse
create or replace function enforce_max_kontaktlaerere_link()
returns trigger language plpgsql security definer as $$
begin
  if exists (select 1 from users u
              where u.id = new.user_id
                and u.role = 'kontaktlaerer'
                and u.deleted_at is null)
     and antall_kontaktlaerere(new.class_id, new.user_id) >= 3 then
    raise exception 'Klassen har allerede 3 kontaktlærere';
  end if;
  return new;
end;$$;

drop trigger if exists trg_uc_max_kontaktlaerere on user_classes;
create trigger trg_uc_max_kontaktlaerere
  before insert or update on user_classes
  for each row execute function enforce_max_kontaktlaerere_link();

-- Når en eksisterende bruker blir kontaktlærer (eller gjenopprettes)
create or replace function enforce_max_kontaktlaerere_user()
returns trigger language plpgsql security definer as $$
declare
  v_class uuid;
begin
  if new.role = 'kontaktlaerer' and new.deleted_at is null then
    for v_class in select uc.class_id from user_classes uc where uc.user_id = new.id loop
      if antall_kontaktlaerere(v_class, new.id) >= 3 then
        raise exception 'En av klassene til brukeren har allerede 3 kontaktlærere';
      end if;
    end loop;
  end if;
  return new;
end;$$;

drop trigger if exists trg_users_max_kontaktlaerere on users;
create trigger trg_users_max_kontaktlaerere
  before insert or update of role, deleted_at on users
  for each row execute function enforce_max_kontaktlaerere_user();
