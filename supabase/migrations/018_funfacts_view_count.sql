-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Migrasjon 018: view_count for funfacts-rotasjon
--
-- Legger til teller for visningsantall per funfact og en
-- SECURITY DEFINER-funksjon slik at alle innloggede brukere
-- (inkl. lærere) kan øke telleren – uten å omgå RLS ellers.
--
-- Kjøres MANUELT i Supabase Dashboard → SQL Editor.
-- Idempotent: trygt å kjøre flere ganger.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE school_facts
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Hjelpefunksjon: øk view_count med 1 for én setning.
-- SECURITY DEFINER: kjøres som schema-eier (omgår RLS for denne ene operasjonen).
CREATE OR REPLACE FUNCTION increment_fact_view(p_fact_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE school_facts SET view_count = view_count + 1 WHERE id = p_fact_id;
$$;

GRANT EXECUTE ON FUNCTION increment_fact_view(uuid) TO authenticated;
