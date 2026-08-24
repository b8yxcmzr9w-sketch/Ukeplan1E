-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Row Level Security
-- ═══════════════════════════════════════════════════════════════

-- ── Helper functions ─────────────────────────────────────────────

-- Returns school_id for the authenticated user (null if not logged in)
create or replace function auth_school_id()
returns uuid language sql stable security definer as $$
  select school_id from users where id = auth.uid() and deleted_at is null;
$$;

-- Returns role for authenticated user
create or replace function auth_role()
returns user_role_enum language sql stable security definer as $$
  select role from users where id = auth.uid() and deleted_at is null;
$$;

-- Returns true if authenticated user is active admin
create or replace function is_active_admin()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select is_admin_active from users where id = auth.uid() and deleted_at is null),
    false
  );
$$;

-- Returns true if authenticated user is kontaktlaerer for a given class
create or replace function is_contact_teacher_for(p_class_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from class_contact_teachers
    where class_id = p_class_id and user_id = auth.uid()
  );
$$;

-- ── Enable RLS on all tables ─────────────────────────────────────
alter table schools               enable row level security;
alter table classes               enable row level security;
alter table subjects              enable row level security;
alter table subject_divisions     enable row level security;
alter table users                 enable row level security;
alter table user_classes          enable row level security;
alter table class_contact_teachers enable row level security;
alter table class_subject_config  enable row level security;
alter table sessions              enable row level security;
alter table multi_day_events      enable row level security;
alter table school_calendar       enable row level security;
alter table school_facts          enable row level security;
alter table pending_transfers     enable row level security;
alter table audit_log             enable row level security;

-- ── schools ──────────────────────────────────────────────────────
-- Anyone can read school info (needed for elev-view without login)
create policy "schools_read_public"
  on schools for select using (true);

create policy "schools_write_admin"
  on schools for all using (id = auth_school_id() and is_active_admin());

-- ── classes ──────────────────────────────────────────────────────
create policy "classes_read_public"
  on classes for select using (school_id = auth_school_id() or auth.uid() is null);

-- Elev (no auth) can read classes – we need a different approach:
-- Use school_id passed via URL; for anonymous, allow all non-deleted classes
drop policy if exists "classes_read_public" on classes;
create policy "classes_read_any"
  on classes for select using (deleted_at is null);

create policy "classes_write_admin"
  on classes for all using (school_id = auth_school_id() and is_active_admin());

-- ── subjects ─────────────────────────────────────────────────────
create policy "subjects_read_any"
  on subjects for select using (deleted_at is null);

create policy "subjects_write_admin"
  on subjects for all using (school_id = auth_school_id() and is_active_admin());

-- ── subject_divisions ────────────────────────────────────────────
create policy "subject_divisions_read_any"
  on subject_divisions for select using (deleted_at is null);

create policy "subject_divisions_write_admin"
  on subject_divisions for all
  using (
    is_active_admin() and
    exists (select 1 from subjects s where s.id = subject_id and s.school_id = auth_school_id())
  );

create policy "subject_divisions_write_kontaktlaerer"
  on subject_divisions for all
  using (
    auth_role() in ('kontaktlaerer') and
    exists (select 1 from subjects s where s.id = subject_id and s.school_id = auth_school_id())
  );

-- ── users ────────────────────────────────────────────────────────
-- Logged-in users can see colleagues in same school
create policy "users_read_own_school"
  on users for select
  using (school_id = auth_school_id() and deleted_at is null);

-- Users can update their own row (for is_admin_active toggle + password-adjacent fields)
create policy "users_update_self"
  on users for update
  using (id = auth.uid());

create policy "users_write_admin"
  on users for all using (school_id = auth_school_id() and is_active_admin());

-- ── user_classes ─────────────────────────────────────────────────
create policy "user_classes_read_own_school"
  on user_classes for select
  using (exists (select 1 from users u where u.id = user_id and u.school_id = auth_school_id()));

create policy "user_classes_write_admin"
  on user_classes for all
  using (is_active_admin() and
    exists (select 1 from users u where u.id = user_id and u.school_id = auth_school_id()));

-- ── class_contact_teachers ───────────────────────────────────────
create policy "cct_read_own_school"
  on class_contact_teachers for select
  using (exists (select 1 from users u where u.id = user_id and u.school_id = auth_school_id()));

create policy "cct_write_admin"
  on class_contact_teachers for all using (is_active_admin());

-- ── class_subject_config ─────────────────────────────────────────
create policy "csc_read_authenticated"
  on class_subject_config for select
  using (exists (select 1 from classes c where c.id = class_id and c.school_id = auth_school_id()));

create policy "csc_write_kontaktlaerer_or_admin"
  on class_subject_config for all
  using (
    (is_active_admin() or is_contact_teacher_for(class_id)) and
    exists (select 1 from classes c where c.id = class_id and c.school_id = auth_school_id())
  );

-- ── sessions ─────────────────────────────────────────────────────
-- Public (elev) can read non-deleted sessions for any class
create policy "sessions_read_any"
  on sessions for select using (deleted_at is null);

-- Lærere can insert sessions for their own school (any class)
create policy "sessions_insert_laerer"
  on sessions for insert
  with check (
    school_id = auth_school_id() and
    teacher_id = auth.uid() and
    created_by = auth.uid()
  );

-- Lærere can update/delete only their own sessions
create policy "sessions_update_own"
  on sessions for update
  using (teacher_id = auth.uid() and school_id = auth_school_id() and deleted_at is null);

create policy "sessions_delete_own"
  on sessions for delete
  using (teacher_id = auth.uid() and school_id = auth_school_id());

-- Kontaktlærer can update/delete all sessions in their classes
create policy "sessions_update_kontaktlaerer"
  on sessions for update
  using (
    auth_role() in ('kontaktlaerer', 'admin') and
    school_id = auth_school_id() and
    (is_contact_teacher_for(class_id) or is_active_admin())
  );

create policy "sessions_delete_kontaktlaerer"
  on sessions for delete
  using (
    auth_role() in ('kontaktlaerer', 'admin') and
    school_id = auth_school_id() and
    (is_contact_teacher_for(class_id) or is_active_admin())
  );

-- ── multi_day_events ─────────────────────────────────────────────
create policy "mde_read_any"
  on multi_day_events for select using (deleted_at is null);

create policy "mde_write_kontaktlaerer_or_admin"
  on multi_day_events for all
  using (
    school_id = auth_school_id() and
    (is_active_admin() or auth_role() = 'kontaktlaerer')
  );

-- ── school_calendar ──────────────────────────────────────────────
create policy "cal_read_any"
  on school_calendar for select using (true);

create policy "cal_write_admin"
  on school_calendar for all using (school_id = auth_school_id() and is_active_admin());

-- ── school_facts ─────────────────────────────────────────────────
create policy "facts_read_any"
  on school_facts for select using (true);

create policy "facts_write_admin"
  on school_facts for all using (school_id = auth_school_id() and is_active_admin());

-- ── pending_transfers ────────────────────────────────────────────
create policy "transfers_read_involved"
  on pending_transfers for select
  using (from_user = auth.uid() or to_user = auth.uid());

create policy "transfers_insert_sender"
  on pending_transfers for insert
  with check (from_user = auth.uid());

create policy "transfers_update_receiver"
  on pending_transfers for update
  using (to_user = auth.uid());

create policy "transfers_delete_sender_or_admin"
  on pending_transfers for delete
  using (from_user = auth.uid() or is_active_admin());

-- ── audit_log ────────────────────────────────────────────────────
create policy "audit_read_admin"
  on audit_log for select using (is_active_admin());

-- Audit inserts are done via security-definer functions only
create policy "audit_insert_service"
  on audit_log for insert with check (true);
