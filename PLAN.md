# PLAN — Ukeplan1E v4

## Status: pågår
## Neste steg: sett ny GEMINI_API_KEY i Supabase Secrets

## Beslutninger tatt
- (ingen ennå — føres her etter hvert)

## Oppgaver
- [ ] Sett ny `GEMINI_API_KEY` i Supabase Secrets (hent fra
      aistudio.google.com/apikey, nytt format starter med `AQ.`).
      Kreves for at `ai-parse-skolerute`, `ai-parse-sessions` og
      `generate-facts` skal virke. **Manuell oppgave i Supabase
      Dashboard — ikke en kodeoppgave.**
## Ferdig (arkiv)
- [x] Verifiser om `006_fix_school_facts_rls.sql` er kjørt i prod —
      bekreftet kjørt 11.06.2026 via `pg_policies` i SQL Editor
      (policyen inneholder rollesjekken). CLAUDE.md oppdatert til `KJØRT`.
