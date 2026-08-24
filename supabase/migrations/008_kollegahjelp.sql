-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Kollegahjelp
-- En lærer skal kunne endre en annens økt (frontend viser tydelig
-- advarsel først). Sletting er fortsatt begrenset til egne økter,
-- kontaktlærer (egen klasse) og admin.
-- Kjøres manuelt i Supabase Dashboard → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Oppdatering: alle innloggede ved samme skole ──────────────
-- Erstatter «kun egne økter». with check arver using-uttrykket, så
-- økten kan ikke flyttes til en annen skole.
drop policy if exists "sessions_update_own" on sessions;
create policy "sessions_update_school"
  on sessions for update
  using (
    auth_school_id() is not null and
    school_id = auth_school_id() and
    deleted_at is null
  );

-- ── 2. Opprettelse: økt kan registreres på en kollega ────────────
-- Lærervelgeren i «Ny økt» lar deg planlegge på vegne av andre.
-- created_by er alltid den innloggede (sporbarhet), og læreren må
-- høre til samme skole.
drop policy if exists "sessions_insert_laerer" on sessions;
create policy "sessions_insert_laerer"
  on sessions for insert
  with check (
    school_id = auth_school_id() and
    created_by = auth.uid() and
    exists (
      select 1 from users t
      where t.id = teacher_id
        and t.school_id = auth_school_id()
        and t.deleted_at is null
    )
  );
