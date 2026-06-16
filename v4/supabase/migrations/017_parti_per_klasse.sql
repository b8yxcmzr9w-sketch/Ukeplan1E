-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Parti per klasse og koblingstabell session_divisions
--
-- NAVNGIVNING: Filen heter 017 fordi 012 allerede er tatt av
-- 012_kalendertyper.sql (kjørt). 013–016 er også kjørt.
--
-- Hva denne migrasjonen gjør:
--   1. class_id (nullable) på subject_divisions
--   2. CHECK-constraint: gruppe = class_id IS NULL, parti = class_id IS NOT NULL
--   3. NULL-sikker UNIQUE-indeks via sentinel-UUID
--   4. Ny koblingstabell session_divisions (én økt → mange partier/grupper)
--   5. Datamigrering: sessions.division_id → session_divisions
--   6. Oppdatert RLS på subject_divisions (kontaktlærer begrenset til egne partier)
--   7. RLS på session_divisions (speiler sessions-tilganger)
--
-- sessions.division_id beholdes uendret – utfases i fremtidig migrasjon.
-- Kjøres manuelt: Supabase Dashboard → SQL Editor.
--
-- ADVARSEL: Dersom det allerede finnes rader med division_type = 'parti'
-- i subject_divisions, vil CHECK-constrainten i steg 2 feile (de mangler
-- class_id). Soft-delete dem eller sett class_id manuelt FØR migrasjonen
-- kjøres i et slikt tilfelle.
-- ═══════════════════════════════════════════════════════════════


-- ── 1. Legg til class_id på subject_divisions ────────────────────
-- NULL   → gruppe (delt på tvers av klasser, admin eier)
-- NOT NULL → parti (tilhører én konkret klasse, kontaktlærer/admin eier)

ALTER TABLE subject_divisions
  ADD COLUMN class_id uuid REFERENCES classes(id);


-- ── 2. CHECK-constraint: håndhev modellen ────────────────────────
-- Gruppe må alltid mangle klasse; parti må alltid ha klasse.
-- subjects.only_one_division_type garanterer at et fag aldri kan ha
-- både has_parti og has_gruppe, så vi trenger ikke håndtere "begge".

ALTER TABLE subject_divisions
  ADD CONSTRAINT chk_parti_har_klasse CHECK (
    (division_type = 'gruppe' AND class_id IS NULL) OR
    (division_type = 'parti'  AND class_id IS NOT NULL)
  );


-- ── 3. NULL-sikker UNIQUE-indeks (sentinel-UUID) ─────────────────
-- Standard UNIQUE-indekser ignorerer NULL – to grupper med samme navn i
-- samme fag ville ikke blitt oppdaget. Løsning: erstatt NULL med en fast
-- sentinel-UUID i indeksen så COALESCE gir én representasjon per «ingen klasse».

CREATE UNIQUE INDEX uq_division_navn
  ON subject_divisions (
    subject_id,
    COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid),
    name
  )
  WHERE deleted_at IS NULL;


-- ── 4. Koblingstabell: session_divisions ─────────────────────────
-- Én økt kan gjelde flere partier/grupper. Sammensatt PK hindrer dobbeltkobling.
-- ON DELETE CASCADE: når en økt slettes (hard), fjernes koblingene automatisk.
-- division_id har bevisst ingen ON DELETE CASCADE – en divisjon som slettes
-- med aktive session-koblinger skal gi feil, ikke stille rydde.

CREATE TABLE session_divisions (
  session_id  uuid NOT NULL REFERENCES sessions(id)          ON DELETE CASCADE,
  division_id uuid NOT NULL REFERENCES subject_divisions(id),
  PRIMARY KEY (session_id, division_id)
);


-- ── 5. Datamigrering ─────────────────────────────────────────────
-- Kopier eksisterende enkeltkobling (sessions.division_id) inn i den nye
-- tabellen. ON CONFLICT DO NOTHING gjør INSERT-en trygt idempotent.
-- sessions.division_id røres ikke her – utfases i fremtidig migrasjon.

INSERT INTO session_divisions (session_id, division_id)
SELECT id, division_id
FROM sessions
WHERE division_id IS NOT NULL
ON CONFLICT DO NOTHING;


-- ── 6. Oppdatert RLS på subject_divisions ────────────────────────
-- Eksisterende policyer (002_rls.sql):
--   subject_divisions_read_any        → beholdes uendret (SELECT, deleted_at IS NULL)
--   subject_divisions_write_admin     → beholdes uendret (ALL, is_active_admin() + skole-sjekk)
--   subject_divisions_write_kontaktlaerer → for bred; erstattes nedenfor.
--
-- Den gamle policyen ga kontaktlærere skrivetilgang til ALLE divisjoner i
-- skolens fag. Med class_id innskrenkes dette til partier i egne klasser.

DROP POLICY IF EXISTS "subject_divisions_write_kontaktlaerer" ON subject_divisions;

-- Ny policy: samme form som sessions_update_kontaktlaerer (migrasjon 002/008).
-- auth_role()-sjekken filtrerer ut vanlige lærere; is_active_admin() dekker
-- admin-rollen som alternativ til is_contact_teacher_for() (admin har allerede
-- sin egen bredere policy, men formen er identisk med sessions-mønsteret).

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
-- Koblingstabell uten egne school_id / deleted_at – tilgang avgjøres ved
-- å JOIN-e mot sessions.
--
-- Valg for INSERT og DELETE: speiler sessions_update_school (kollegahjelp,
-- migrasjon 008) – alle innloggede ved samme skole kan endre koblingsrader
-- for en økt ved sin skole. Dette er konsistent med at enhver skole-bruker
-- allerede kan oppdatere selve økt-raden. Selve sessions-slettingen er
-- strengere (egne / kontaktlærer / admin), men koblingsrader uten selvstendig
-- semantisk verdi behandles som en del av økt-dataene og følger redigerings-
-- terskelen (lavere), ikke sletteterskelen.

ALTER TABLE session_divisions ENABLE ROW LEVEL SECURITY;

-- SELECT: offentlig (elever ser hvilke divisjoner en økt gjelder)
CREATE POLICY "sd_read_any"
  ON session_divisions FOR SELECT
  USING (true);

-- INSERT: enhver innlogget bruker ved samme skole (kollegahjelp-prinsipp)
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

-- DELETE: samme terskel som INSERT (kollegahjelp)
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
