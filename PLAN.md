# PLAN — Ukeplan1E v4

## Status: ikke påbegynt
## Neste steg: sett ny GEMINI_API_KEY i Supabase Secrets

## Beslutninger tatt
- (ingen ennå — føres her etter hvert)

## Oppgaver
- [ ] Sett ny `GEMINI_API_KEY` i Supabase Secrets (hent fra
      aistudio.google.com/apikey, nytt format starter med `AQ.`).
      Kreves for at `ai-parse-skolerute`, `ai-parse-sessions` og
      `generate-facts` skal virke. **Manuell oppgave i Supabase
      Dashboard — ikke en kodeoppgave.**
- [ ] Verifiser om `006_fix_school_facts_rls.sql` er kjørt i prod
      (Supabase Dashboard → SQL Editor). Hvis ikke: kjør den, og
      oppdater kommentaren i CLAUDE.md fra `KJØRT?` til `KJØRT`.

## Ferdig (arkiv)
- (flyttes hit når oppgaver er fullført)
