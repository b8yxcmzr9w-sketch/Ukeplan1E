-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Initial schema
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ── Enums ────────────────────────────────────────────────────────
create type color_theme_enum    as enum ('standard', 'lys', 'mork');
create type calendar_type_enum  as enum ('ferie', 'fridag', 'annet');
create type division_type_enum  as enum ('parti', 'gruppe');
create type user_role_enum      as enum ('laerer', 'kontaktlaerer', 'admin');
create type audit_action_enum   as enum ('insert', 'update', 'delete', 'restore');

-- ── schools ──────────────────────────────────────────────────────
create table schools (
  id                     uuid primary key default uuid_generate_v4(),
  name                   text not null,
  logo_url               text,
  logo_file_path         text,
  school_year_start_week int  not null default 33 check (school_year_start_week between 1 and 53),
  school_year_end_week   int  not null default 25 check (school_year_end_week   between 1 and 53),
  color_theme            color_theme_enum not null default 'standard',
  created_at             timestamptz not null default now()
);

-- ── classes ──────────────────────────────────────────────────────
create table classes (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid not null references schools(id) on delete cascade,
  name       text not null,
  sort_order int  not null default 0,
  deleted_at timestamptz
);
create index on classes(school_id) where deleted_at is null;

-- ── subjects ─────────────────────────────────────────────────────
create table subjects (
  id             uuid primary key default uuid_generate_v4(),
  school_id      uuid not null references schools(id) on delete cascade,
  name           text not null,
  short_code     text not null,
  color_hex      text not null default '#e9ecef',
  has_parti      boolean not null default false,
  has_gruppe     boolean not null default false,
  max_divisions  int  not null default 20 check (max_divisions between 1 and 20),
  deleted_at     timestamptz,
  constraint only_one_division_type check (not (has_parti and has_gruppe))
);
create index on subjects(school_id) where deleted_at is null;

-- ── subject_divisions ────────────────────────────────────────────
create table subject_divisions (
  id            uuid primary key default uuid_generate_v4(),
  subject_id    uuid not null references subjects(id) on delete cascade,
  division_type division_type_enum not null,
  name          text not null,
  sort_order    int  not null default 0,
  deleted_at    timestamptz
);
create index on subject_divisions(subject_id) where deleted_at is null;

-- ── users (mirrors auth.users) ───────────────────────────────────
create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  school_id       uuid not null references schools(id) on delete cascade,
  full_name       text not null,
  role            user_role_enum not null default 'laerer',
  is_admin_active boolean not null default false,
  deleted_at      timestamptz
);
create index on users(school_id) where deleted_at is null;

-- ── user_classes ─────────────────────────────────────────────────
create table user_classes (
  user_id  uuid not null references users(id)   on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  primary key (user_id, class_id)
);

-- ── class_contact_teachers ───────────────────────────────────────
create table class_contact_teachers (
  class_id uuid not null references classes(id) on delete cascade,
  user_id  uuid not null references users(id)   on delete cascade,
  primary key (class_id, user_id)
);

-- ── class_subject_config (preferred days + divisions per class) ──
create table class_subject_config (
  id           uuid primary key default uuid_generate_v4(),
  class_id     uuid not null references classes(id)   on delete cascade,
  subject_id   uuid not null references subjects(id)  on delete cascade,
  preferred_days int[] default '{}',  -- 1=Mon..5=Fri
  unique (class_id, subject_id)
);

-- ── sessions ─────────────────────────────────────────────────────
create table sessions (
  id               uuid primary key default uuid_generate_v4(),
  school_id        uuid not null references schools(id)  on delete cascade,
  class_id         uuid not null references classes(id)  on delete restrict,
  subject_id       uuid not null references subjects(id) on delete restrict,
  division_id      uuid          references subject_divisions(id) on delete set null,
  week_nr          int  not null check (week_nr between 1 and 53),
  day_of_week      int  not null check (day_of_week between 1 and 5),
  teacher_id       uuid not null references users(id) on delete restrict,
  activity         text not null default '',
  meeting_point    text not null default '',
  info             text not null default '',
  created_by       uuid not null references users(id),
  deleted_at       timestamptz,
  deleted_by       uuid          references users(id),
  last_modified_at timestamptz not null default now(),
  last_modified_by uuid          references users(id),
  version          int  not null default 1
);
create index on sessions(school_id, class_id, week_nr) where deleted_at is null;
create index on sessions(teacher_id) where deleted_at is null;

-- ── multi_day_events ─────────────────────────────────────────────
create table multi_day_events (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid not null references schools(id)  on delete cascade,
  class_id   uuid          references classes(id)  on delete cascade,  -- null = alle klasser
  title      text not null,
  description text not null default '',
  start_date date not null,
  end_date   date not null,
  created_by uuid not null references users(id),
  deleted_at timestamptz,
  constraint valid_date_range check (end_date >= start_date)
);
create index on multi_day_events(school_id, start_date) where deleted_at is null;

-- ── school_calendar ──────────────────────────────────────────────
create table school_calendar (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid not null references schools(id) on delete cascade,
  title      text not null,
  start_date date not null,
  end_date   date not null,
  type       calendar_type_enum not null default 'ferie',
  constraint valid_date_range check (end_date >= start_date)
);
create index on school_calendar(school_id, start_date);

-- ── school_facts ─────────────────────────────────────────────────
create table school_facts (
  id        uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  fact_text text not null
);

-- ── pending_transfers (økt-overføring mellom lærere) ─────────────
create table pending_transfers (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references sessions(id) on delete cascade,
  from_user   uuid not null references users(id),
  to_user     uuid not null references users(id),
  created_at  timestamptz not null default now(),
  seen_at     timestamptz
);

-- ── audit_log ────────────────────────────────────────────────────
create table audit_log (
  id          uuid primary key default uuid_generate_v4(),
  table_name  text not null,
  record_id   uuid not null,
  action      audit_action_enum not null,
  changed_by  uuid references users(id),
  changed_at  timestamptz not null default now(),
  old_data    jsonb,
  new_data    jsonb
);
create index on audit_log(record_id);
create index on audit_log(changed_at);

-- ── updated_at trigger helper ────────────────────────────────────
create or replace function set_last_modified()
returns trigger language plpgsql as $$
begin
  new.last_modified_at := now();
  return new;
end;$$;

create trigger trg_sessions_modified
  before update on sessions
  for each row execute function set_last_modified();

-- ── version bump on sessions update ─────────────────────────────
create or replace function bump_session_version()
returns trigger language plpgsql as $$
begin
  if new.version = old.version then
    new.version := old.version + 1;
  end if;
  return new;
end;$$;

create trigger trg_sessions_version
  before update on sessions
  for each row execute function bump_session_version();
