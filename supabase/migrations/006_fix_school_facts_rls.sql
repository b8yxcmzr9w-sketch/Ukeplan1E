-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Fix: school_facts RLS
-- Tillater admin-bruker (role='admin') å skrive funfacts selv om
-- is_admin_active=false (f.eks. når de er logget inn som lærer).
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "facts_write_admin" on school_facts;

create policy "facts_write_admin"
  on school_facts for all
  using (
    school_id = auth_school_id()
    and (
      is_active_admin()
      or (select role from users where id = auth.uid() and deleted_at is null) = 'admin'
    )
  );
