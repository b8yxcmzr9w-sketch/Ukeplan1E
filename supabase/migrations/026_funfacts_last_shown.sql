-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Migrasjon 026: last_shown_at for funfacts-rotasjon
--
-- Legger til tidsstempel for sist vist per funfact, slik at frontend
-- kan rotere ved å alltid vise faktaet med eldst last_shown_at
-- (NULL = aldri vist = vises først) – uten kø-tilstand i nettleseren.
-- increment_fact_view stempler nå BÅDE view_count og last_shown_at i
-- samme UPDATE (P63).
--
-- Kjøres MANUELT i Supabase Dashboard → SQL Editor.
-- Idempotent: trygt å kjøre flere ganger.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE school_facts
  ADD COLUMN IF NOT EXISTS last_shown_at timestamptz;

-- Hjelpefunksjon: øk view_count og stemple last_shown_at for én setning.
-- SECURITY DEFINER: kjøres som schema-eier (omgår RLS for denne ene operasjonen).
CREATE OR REPLACE FUNCTION increment_fact_view(p_fact_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE school_facts
  SET view_count = view_count + 1, last_shown_at = now()
  WHERE id = p_fact_id;
$$;

GRANT EXECUTE ON FUNCTION increment_fact_view(uuid) TO authenticated;
