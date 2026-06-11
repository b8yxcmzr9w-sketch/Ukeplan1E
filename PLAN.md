# PLAN — Ukeplan1E v4

## Status: venter på godkjenning
## Neste steg: godkjenn (eller juster) oppgavelisten under «Funksjonelle avvik» før bygging starter

## Beslutninger tatt
- (ingen ennå — føres her etter hvert)

## Oppgaver

### Funksjonelle avvik (fra FUNKSJONELL-BESKRIVELSE.md, verifisert 11.06.2026)
Foreslått rekkefølge — enkleste først, og slik at hvert steg bygger på det forrige.
IKKE påbegynt — venter på godkjenning.

- [ ] 1. Skolenøytral funfacts-generering: fjern hardkodet Øksnevad/Jæren/
      Rogaland fra `generate-facts`-prompten; bruk skolenavn (og ev. sted)
      fra databasen i stedet. Vurder samtidig nøytral tittel i `index.html`.
- [ ] 2. Sporbarhet på økter: sett `last_modified_by` ved lagring (trigger
      i ny migrasjon), og vis «Opprettet av / sist endret av» i
      rediger-modalen.
- [ ] 3. Kollegahjelp med advarsel: ny migrasjon som lar lærere oppdatere
      andres økter i egen skole (RLS), pluss tydelig advarsel i UI før
      man redigerer/sletter en annens økt. (Avhenger av punkt 2 for å
      kunne vise hvem som eier økten.)
- [ ] 4. Fridager i lærervisningen + blokkering: vis skolerutens fridager
      også i «Min klasse», og stopp/advar ved opprettelse, kopiering og
      bulk-kopiering av økter på fridager.
- [ ] 5. Økt som gjelder flere klasser (fellesundervisning): datamodell-
      endring (f.eks. koblingstabell sessions↔classes), oppdatert RLS,
      visning i alle berørte klassers planer, og støtte i ny økt-modalen.
      Størst oppgave — tas til slutt.
- [ ] 6. Elevtilgang til egen klasse: AVKLARING FØRST (se «Åpne punkter» i
      FUNKSJONELL-BESKRIVELSE.md) — skal forsiden slutte å liste alle
      klasser, eller er direktelenker godt nok? Bygges etter beslutning.
- [ ] (valgfritt) Håndhev maks 3 kontaktlærere per klasse og maks 2 admin
      per skole også i databasen (i dag kun sjekk i nettleseren).

## Ferdig (arkiv)
- [x] Sett ny `GEMINI_API_KEY` i Supabase Secrets — satt 11.06.2026.
      AI-funksjonene (`ai-parse-skolerute`, `ai-parse-sessions`,
      `generate-facts`) bør fungere igjen; verifiser gjerne med
      «✨ Generer med AI» i Funfacts-fanen.
- [x] Verifiser om `006_fix_school_facts_rls.sql` er kjørt i prod —
      bekreftet kjørt 11.06.2026 via `pg_policies` i SQL Editor
      (policyen inneholder rollesjekken). CLAUDE.md oppdatert til `KJØRT`.
