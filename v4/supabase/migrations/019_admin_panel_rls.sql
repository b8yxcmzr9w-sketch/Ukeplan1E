-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – RLS-fix: adminpanel-skriving uten toggle
-- ---------------------------------------------------------------
-- Etter migrasjon 018 er admin et additivt boolsk felt (is_admin).
-- enum-verdien 'admin' i user_role_enum brukes ikke lenger for nye
-- brukere. Admins har role='laerer'/'kontaktlaerer' + is_admin=true.
--
-- Problemet: adminpanel-tabellenes skrivepolicyer sjekker kun
-- is_active_admin() (= users.is_admin_active, «togglen»). En admin
-- som åpner panelet uten å ha skrudd på togglen fikk RLS-feil.
--
-- Løsning: Legg til auth_is_admin() (sjekker users.is_admin) som
-- alternativ arm — mønster «is_active_admin() OR auth_is_admin()».
-- Identisk med det som allerede er gjort for school_facts og sessions
-- i migrasjon 018.
--
-- Alle FOR ALL-policyer (#1–#10) får eksplisitt WITH CHECK lik
-- USING-uttrykket. #11 (FOR DELETE) og #12 (FOR SELECT) trenger ikke.
--
-- Ingen av originalpolicyene (002/017/018) hadde eksplisitt WITH CHECK
-- — drop + recreate er derfor regresjonfri på dette punktet.
--
-- 12 policyer oppdateres. school_facts, sessions og
-- subject_divisions_write_kontaktlaerer ble fikset i 018 — skip.
--
-- Kjøres manuelt i Supabase Dashboard → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. schools ──────────────────────────────────────────────────
drop policy if exists "schools_write_admin" on schools;
create policy "schools_write_admin"
  on schools for all
  using     (id = auth_school_id() and (is_active_admin() or auth_is_admin()))
  with check(id = auth_school_id() and (is_active_admin() or auth_is_admin()));

-- ── 2. classes ──────────────────────────────────────────────────
drop policy if exists "classes_write_admin" on classes;
create policy "classes_write_admin"
  on classes for all
  using     (school_id = auth_school_id() and (is_active_admin() or auth_is_admin()))
  with check(school_id = auth_school_id() and (is_active_admin() or auth_is_admin()));

-- ── 3. subjects ─────────────────────────────────────────────────
drop policy if exists "subjects_write_admin" on subjects;
create policy "subjects_write_admin"
  on subjects for all
  using     (school_id = auth_school_id() and (is_active_admin() or auth_is_admin()))
  with check(school_id = auth_school_id() and (is_active_admin() or auth_is_admin()));

-- ── 4. subject_divisions (admin-policy) ─────────────────────────
-- subject_divisions_write_kontaktlaerer ble fikset i mig. 018 — skip.
drop policy if exists "subject_divisions_write_admin" on subject_divisions;
create policy "subject_divisions_write_admin"
  on subject_divisions for all
  using (
    (is_active_admin() or auth_is_admin()) and
    exists (select 1 from subjects s where s.id = subject_id and s.school_id = auth_school_id())
  )
  with check (
    (is_active_admin() or auth_is_admin()) and
    exists (select 1 from subjects s where s.id = subject_id and s.school_id = auth_school_id())
  );

-- ── 5. users (admin-all) ────────────────────────────────────────
drop policy if exists "users_write_admin" on users;
create policy "users_write_admin"
  on users for all
  using     (school_id = auth_school_id() and (is_active_admin() or auth_is_admin()))
  with check(school_id = auth_school_id() and (is_active_admin() or auth_is_admin()));

-- ── 6. user_classes ─────────────────────────────────────────────
drop policy if exists "user_classes_write_admin" on user_classes;
create policy "user_classes_write_admin"
  on user_classes for all
  using (
    (is_active_admin() or auth_is_admin()) and
    exists (select 1 from users u where u.id = user_id and u.school_id = auth_school_id())
  )
  with check (
    (is_active_admin() or auth_is_admin()) and
    exists (select 1 from users u where u.id = user_id and u.school_id = auth_school_id())
  );

-- ── 7. class_contact_teachers ───────────────────────────────────
drop policy if exists "cct_write_admin" on class_contact_teachers;
create policy "cct_write_admin"
  on class_contact_teachers for all
  using     (is_active_admin() or auth_is_admin())
  with check(is_active_admin() or auth_is_admin());

-- ── 8. class_subject_config ─────────────────────────────────────
-- Uendret logikk bortsett fra ny admin-arm.
-- Original (002): (is_active_admin() or is_contact_teacher_for(class_id)) and exists (...)
drop policy if exists "csc_write_kontaktlaerer_or_admin" on class_subject_config;
create policy "csc_write_kontaktlaerer_or_admin"
  on class_subject_config for all
  using (
    (is_active_admin() or auth_is_admin() or is_contact_teacher_for(class_id)) and
    exists (select 1 from classes c where c.id = class_id and c.school_id = auth_school_id())
  )
  with check (
    (is_active_admin() or auth_is_admin() or is_contact_teacher_for(class_id)) and
    exists (select 1 from classes c where c.id = class_id and c.school_id = auth_school_id())
  );

-- ── 9. multi_day_events ─────────────────────────────────────────
-- Uendret logikk bortsett fra ny admin-arm.
-- Original (002): school_id = auth_school_id() and (is_active_admin() or auth_role() = 'kontaktlaerer')
-- auth_role() = 'kontaktlaerer' er fortsatt gyldig etter 018 (basisrolle uendret).
drop policy if exists "mde_write_kontaktlaerer_or_admin" on multi_day_events;
create policy "mde_write_kontaktlaerer_or_admin"
  on multi_day_events for all
  using (
    school_id = auth_school_id() and
    (is_active_admin() or auth_is_admin() or auth_role() = 'kontaktlaerer')
  )
  with check (
    school_id = auth_school_id() and
    (is_active_admin() or auth_is_admin() or auth_role() = 'kontaktlaerer')
  );

-- ── 10. school_calendar ─────────────────────────────────────────
drop policy if exists "cal_write_admin" on school_calendar;
create policy "cal_write_admin"
  on school_calendar for all
  using     (school_id = auth_school_id() and (is_active_admin() or auth_is_admin()))
  with check(school_id = auth_school_id() and (is_active_admin() or auth_is_admin()));

-- ── 11. pending_transfers (FOR DELETE — ingen WITH CHECK) ────────
drop policy if exists "transfers_delete_sender_or_admin" on pending_transfers;
create policy "transfers_delete_sender_or_admin"
  on pending_transfers for delete
  using (from_user = auth.uid() or is_active_admin() or auth_is_admin());

-- ── 12. audit_log (FOR SELECT — ingen WITH CHECK) ───────────────
drop policy if exists "audit_read_admin" on audit_log;
create policy "audit_read_admin"
  on audit_log for select
  using (is_active_admin() or auth_is_admin());
