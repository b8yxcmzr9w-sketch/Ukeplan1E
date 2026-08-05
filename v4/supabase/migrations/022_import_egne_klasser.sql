-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – P44: skriving kun til egne klasser
-- Strammer INSERT på sessions: en lærer kan bare opprette økter i
-- klasser hen er satt opp med (user_classes). Admin med aktiv
-- adminmodus er unntatt.
--
-- Hvorfor user_classes og ikke is_contact_teacher_for():
--   is_contact_teacher_for() krever rollen kontaktlaerer og ville
--   låst ute faglærere som ER tildelt klassen uten å være
--   kontaktlærer. user_classes = tildelt/underviser, som er den
--   grensen P44 skal håndheve. class_contact_teachers brukes ikke —
--   appen skriver aldri til den (jf. migrasjon 009).
--
-- Kjøres manuelt i Supabase Dashboard → SQL Editor. Idempotent.
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "sessions_insert_laerer" on sessions;

create policy "sessions_insert_laerer"
  on sessions for insert
  with check (
    school_id = auth_school_id()
    and created_by = auth.uid()
    -- Fra migrasjon 008: økten kan registreres på en kollega ved samme skole
    and exists (
      select 1 from users t
      where t.id = teacher_id
        and t.school_id = auth_school_id()
        and t.deleted_at is null
    )
    -- P44: men KLASSEN må være en læreren er satt opp med
    and (
      exists (
        select 1 from user_classes uc
        where uc.user_id = auth.uid()
          and uc.class_id = sessions.class_id
      )
      or is_active_admin()
    )
  );

-- ───────────────────────────────────────────────────────────────
-- MERK – strengere variant (IKKE aktiv, se PLAN.md «Avvik fra
-- oppgaveteksten» under Økt (P44)):
--
-- Oppgaveteksten foreslo i tillegg `teacher_id = auth.uid()`, altså
-- at man bare kan opprette økter på seg selv. Kjøres den varianten,
-- slutter tre ting som virker i dag å fungere:
--   1. «Ny økt» der læreren planlegger på vegne av en kollega
--      (migrasjon 008 la eksplisitt til rette for dette).
--   2. Bulk-kopi med «behold lærer» av en kollegas økt.
--   3. AI-importen selv: lærer-nedtrekket forhåndsvelger en kollega
--      når fornavnet i teksten kjennes igjen — den raden ville da bli
--      avvist av RLS.
-- Skal kollegaplanlegging fjernes som en bevisst innstramming, kjør
-- denne i stedet for policyen over:
--
-- drop policy if exists "sessions_insert_laerer" on sessions;
-- create policy "sessions_insert_laerer"
--   on sessions for insert
--   with check (
--     school_id = auth_school_id()
--     and teacher_id = auth.uid()
--     and created_by = auth.uid()
--     and (
--       exists (
--         select 1 from user_classes uc
--         where uc.user_id = auth.uid()
--           and uc.class_id = sessions.class_id
--       )
--       or is_active_admin()
--     )
--   );
-- ───────────────────────────────────────────────────────────────
