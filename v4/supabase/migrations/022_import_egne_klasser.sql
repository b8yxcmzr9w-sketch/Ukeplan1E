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
-- HISTORIKK (5. august 2026): denne policyen ble først vurdert med et
-- ekstra vilkår `teacher_id = auth.uid()` (kun opprette økter på seg
-- selv). Den varianten er LAGT BORT — bekreftet av Morfar: læreren
-- skal fortsatt kunne føre en økt på en kollega med bevisst,
-- manuelt valg (importens lærer-nedtrekk står som standard på
-- innlogget lærer, men er overstyrbart — se PLAN.md Økt (P44) steg E).
-- Policyen over (med migrasjon 008s kollega-sjekk beholdt) er derfor
-- ENDELIG for P44. Eventuell videre innstramming (P46) gjelder kun
-- REDIGERING av andres økter, ikke opprettelse.
-- ───────────────────────────────────────────────────────────────
