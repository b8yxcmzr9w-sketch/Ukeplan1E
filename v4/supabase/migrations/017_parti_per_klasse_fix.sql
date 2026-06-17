-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Parti per klasse: idempotent remediation
--
-- Bruk denne hvis 017_parti_per_klasse.sql feilet midtveis fordi
-- class_id-kolonnen allerede fantes i databasen.
-- Filen er idempotent: trygg å kjøre selv om noe allerede er på plass.
--
-- Kjøres manuelt: Supabase Dashboard → SQL Editor.
-- ═══════════════════════════════════════════════════════════════


-- ── 1. class_id – allerede kjørt, hoppes over ────────────────────
-- ALTER TABLE subject_divisions ADD COLUMN class_id uuid REFERENCES classes(id);


-- ── 2. CHECK-constraint (drop + recreate for idempotens) ─────────
ALTER TABLE subject_divisions
  DROP CONSTRAINT IF EXISTS chk_parti_har_klasse;

ALTER TABLE subject_divisions
  ADD CONSTRAINT chk_parti_har_klasse CHECK (
    deleted_at IS NOT NULL OR
    (division_type = 'gruppe' AND class_id IS NULL) OR
    (division_type = 'parti'  AND class_id IS NOT NULL)
  );


-- ── 3. NULL-sikker UNIQUE-indeks (drop + recreate) ───────────────
DROP INDEX IF EXISTS uq_division_navn;

CREATE UNIQUE INDEX uq_division_navn
  ON subject_divisions (
    subject_id,
    COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid),
    name
  )
  WHERE deleted_at IS NULL;


-- ── 4. Koblingstabell session_divisions ──────────────────────────
CREATE TABLE IF NOT EXISTS session_divisions (
  session_id  uuid NOT NULL REFERENCES sessions(id)          ON DELETE CASCADE,
  division_id uuid NOT NULL REFERENCES subject_divisions(id),
  PRIMARY KEY (session_id, division_id)
);


-- ── 5. Datamigrering (idempotent) ────────────────────────────────
INSERT INTO session_divisions (session_id, division_id)
SELECT id, division_id
FROM sessions
WHERE division_id IS NOT NULL
ON CONFLICT DO NOTHING;


-- ── 6. Oppdatert RLS på subject_divisions ────────────────────────
DROP POLICY IF EXISTS "subject_divisions_write_kontaktlaerer" ON subject_divisions;

CREATE POLICY "subject_divisions_write_kontaktlaerer"
  ON subject_divisions FOR ALL
  USING (
    auth_role() IN ('kontaktlaerer', 'admin') AND
    class_id IS NOT NULL AND
    (is_contact_teacher_for(class_id) OR is_active_admin()) AND
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = subject_id
        AND s.school_id = auth_school_id()
    )
  );


-- ── 7. RLS på session_divisions ──────────────────────────────────
ALTER TABLE session_divisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sd_read_any"       ON session_divisions;
DROP POLICY IF EXISTS "sd_insert_school"  ON session_divisions;
DROP POLICY IF EXISTS "sd_delete_school"  ON session_divisions;

CREATE POLICY "sd_read_any"
  ON session_divisions FOR SELECT
  USING (true);

CREATE POLICY "sd_insert_school"
  ON session_divisions FOR INSERT
  WITH CHECK (
    auth_school_id() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
        AND s.school_id = auth_school_id()
    )
  );

CREATE POLICY "sd_delete_school"
  ON session_divisions FOR DELETE
  USING (
    auth_school_id() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
        AND s.school_id = auth_school_id()
    )
  );


-- ── 8. Verifisering ──────────────────────────────────────────────
-- Kjør dette etterpå for å bekrefte at alt er på plass:
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'subject_divisions' AND column_name = 'class_id';
--
-- SELECT conname FROM pg_constraint
--   WHERE conname = 'chk_parti_har_klasse';
--
-- SELECT indexname FROM pg_indexes
--   WHERE indexname = 'uq_division_navn';
--
-- SELECT table_name FROM information_schema.tables
--   WHERE table_name = 'session_divisions';
--
-- SELECT policyname FROM pg_policies
--   WHERE tablename IN ('subject_divisions', 'session_divisions')
--   ORDER BY tablename, policyname;
