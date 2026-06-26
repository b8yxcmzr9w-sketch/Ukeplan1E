-- 020_storage_policy_logos.sql
-- Storage-policies for logos-bucketen.
-- Forutsetning: bucketen 'logos' finnes og er satt til public.
-- Hjelpefunksjoner:
--   auth_school_id() — 002_rls.sql: users.school_id for innlogget bruker
--   auth_is_admin()  — 018_admin_additiv.sql: users.is_admin (permanent, ikke toggle)
--
-- MERK: Hvis CREATE POLICY feiler med «must be owner of table objects»
-- eller lignende rettighetsfeil i SQL Editor, bruk fallback:
--   Supabase Dashboard → Storage → logos-bucketen → Policies → New policy
-- Opprett de fire policyene manuelt med samme betingelser som under.

-- ── Idempotens: fjern eksisterende policies ──────────────────────
drop policy if exists "Admin kan laste opp logo"   on storage.objects;
drop policy if exists "Admin kan overskrive logo"  on storage.objects;
drop policy if exists "Admin kan slette logo"      on storage.objects;
drop policy if exists "Public kan lese logo"       on storage.objects;

-- ── INSERT: WITH CHECK (raden finnes ikke ennå) ──────────────────
create policy "Admin kan laste opp logo"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'logos'
  and auth_is_admin()
  and name like (auth_school_id()::text || '.%')
);

-- ── UPDATE: USING + WITH CHECK ───────────────────────────────────
create policy "Admin kan overskrive logo"
on storage.objects for update
to authenticated
using (
  bucket_id = 'logos'
  and auth_is_admin()
  and name like (auth_school_id()::text || '.%')
)
with check (
  bucket_id = 'logos'
  and auth_is_admin()
  and name like (auth_school_id()::text || '.%')
);

-- ── DELETE: USING ────────────────────────────────────────────────
create policy "Admin kan slette logo"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'logos'
  and auth_is_admin()
  and name like (auth_school_id()::text || '.%')
);

-- ── SELECT: USING — forsikring mot lese-404 ──────────────────────
-- Public bucket serverer normalt uten policy via CDN, men eksplisitt
-- SELECT-policy sikrer at authenticated-kall også virker.
create policy "Public kan lese logo"
on storage.objects for select
using (
  bucket_id = 'logos'
);
