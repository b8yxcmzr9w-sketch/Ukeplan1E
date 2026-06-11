# PLAN — Ukeplan1E v4

## Status: fullført
## Neste steg: ingen åpne oppgaver

## Beslutninger tatt
- (ingen ennå — føres her etter hvert)

## Oppgaver
- (ingen åpne)

## Ferdig (arkiv)
- [x] Sett ny `GEMINI_API_KEY` i Supabase Secrets — satt 11.06.2026.
      AI-funksjonene (`ai-parse-skolerute`, `ai-parse-sessions`,
      `generate-facts`) bør fungere igjen; verifiser gjerne med
      «✨ Generer med AI» i Funfacts-fanen.
- [x] Verifiser om `006_fix_school_facts_rls.sql` er kjørt i prod —
      bekreftet kjørt 11.06.2026 via `pg_policies` i SQL Editor
      (policyen inneholder rollesjekken). CLAUDE.md oppdatert til `KJØRT`.
