# PLAN — Ukeplan1E v4

## Status: godkjent 11.06.2026 — under arbeid
## Neste steg: oppgave 6 (økt for flere klasser)

## Beslutninger tatt
- (ingen ennå — føres her etter hvert)

## Oppgaver
Basert på gjennomgangen av sjekklisten i FUNKSJONELL-BESKRIVELSE.md
(juni 2026). Foreslått rekkefølge — IKKE påbegynt, venter på godkjenning:

- [x] 1. Sporbarhet på økter: sørg for at «opprettet av» faktisk lagres
      når en økt opprettes, og at «sist endret av» lagres ved hver
      endring. Vis begge i redigeringsvinduet. (Databasefeltene finnes
      allerede, men fylles ikke ut fra appen.)
      → Gjort 11.06.2026: alle insert-steder setter nå `school_id` og
      `created_by`, alle update-steder setter `last_modified_by`, og
      redigeringsvinduet viser «Opprettet av … · Sist endret av …».
      KREVER MANUELL KJØRING: `007_sporbarhet.sql` i SQL Editor
      (trigger som stempler sist endret av + standardverdier).
- [x] 2. Skolenøytral funfacts-generering: fjern hardkodet
      Øksnevad/Jæren/Rogaland fra AI-instruksjonen i `generate-facts`,
      og bruk skolens navn/sted fra databasen i stedet.
      → Gjort 11.06.2026: prompten bygges nå fra skolenavnet til
      innlogget brukers skole; AI-en utleder sted/temaer selv.
      KREVER MANUELL DEPLOY: `generate-facts` i Supabase Dashboard.
- [x] 3. Blokkering av økter på fridager: sjekk skoleruten når en økt
      opprettes, kopieres (enkelt og bulk) eller importeres med AI, og
      stopp lagring på fridager med en forklarende melding.
      → Gjort 11.06.2026: ny hjelpefunksjon `finnFridag()` sjekker
      skoleruten (ferie/helligdag/planleggingsdag — «annet» blokkerer
      ikke) i ny økt, rediger, kopier, bulk-kopi og AI-import. Bulk og
      AI hopper over fridagstreff og forklarer hvilke.
- [x] 4. Kollegahjelp med advarsel: la en lærer redigere en annens økt,
      men vis en tydelig advarsel først. Krever både endring i
      grensesnittet og oppmykning av databasereglene (RLS), og bygger på
      sporbarheten fra oppgave 1 (så man ser hvem som endret).
      → Gjort 11.06.2026: redigeringsknappen vises nå på alle økter i
      «Min klasse»; andres økter gir bekreftelsesdialog først
      (`bekreftKollegahjelp`). Sletting er fortsatt begrenset til egne
      økter / kontaktlærer / admin.
      KREVER MANUELL KJØRING: `008_kollegahjelp.sql` i SQL Editor
      (oppdaterings- og opprettelsespolicy for sessions).
- [x] 5. Håndhev rollegrensene i databasen: maks 3 kontaktlærere per
      klasse og maks 2 admin per skole sjekkes i dag bare i nettleseren —
      legg samme grense inn i databasen så den ikke kan omgås.
      → Gjort 11.06.2026: triggere på `users` og `user_classes`.
      Bonusfunn rettet i samme migrasjon: `is_contact_teacher_for()`
      slo opp i `class_contact_teachers` som appen aldri skriver til —
      kontaktlærer-rettighetene i RLS har derfor aldri virket. Den
      bruker nå `user_classes` + `users.role`.
      KREVER MANUELL KJØRING: `009_rollegrenser.sql` i SQL Editor.
- [ ] 6. Økt for flere klasser (fellesundervisning): utvid datamodellen
      slik at én økt kan gjelde flere klasser. Største endringen —
      påvirker visning, redigering, kopiering, AI-import og iCal.
- [ ] 7. AVKLARING FØRST: Elevtilgang — skal forsiden slutte å liste alle
      klasser åpent, slik at elever kun når sin klasse via direktelenke?
      (Se «Åpne punkter» i FUNKSJONELL-BESKRIVELSE.md.) Bygges etter
      avklaring.
- [ ] 8. AVKLARING FØRST: Konflikthåndtering — bestem hva brukeren skal
      oppleve når noen andre har endret økten i mellomtiden (f.eks.
      «Økten er endret av [navn]»). Dagens konfliktvarsel finnes, men
      opplevelsen er ikke avklart.

## Ferdig (arkiv)
- [x] Sett ny `GEMINI_API_KEY` i Supabase Secrets — satt 11.06.2026.
      AI-funksjonene (`ai-parse-skolerute`, `ai-parse-sessions`,
      `generate-facts`) bør fungere igjen; verifiser gjerne med
      «✨ Generer med AI» i Funfacts-fanen.
- [x] Verifiser om `006_fix_school_facts_rls.sql` er kjørt i prod —
      bekreftet kjørt 11.06.2026 via `pg_policies` i SQL Editor
      (policyen inneholder rollesjekken). CLAUDE.md oppdatert til `KJØRT`.
