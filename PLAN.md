# PLAN — Ukeplan1E v4

## STATUSLINJE (oppdateres hver økt, i samme commit som resten av PLAN.md)

- **Siste fullførte P-nummer:** P40
- **Neste ledige P-nummer:** P41
- **Dato sist oppdatert:** 23. juli 2026
- **Åpne sjekkpunkter som ikke kan lukkes ennå:** P33s langtidssjekk —
  «Nå»-knappen etter skoleslutt (juli 2027 med 26/27 aktivt); maskinverifisert,
  ekte manuell bekreftelse skjer naturlig når datoen inntreffer

---

## Backlogg (leses herfra — aldri fra hukommelse eller prosjektminne)

> Verifisert mot koden på main 22. juli 2026 (P39). Punkter merket «(P40)» er
> løftet fra fullførte plan-seksjoner 23. juli 2026 uten ny kodeverifisering.
> UX/mobil-ønsker ligger i egen fil: `BACKLOGG-UX-MOBIL.md` (der er punkt 1
> delvis tatt av P6 og punkt 4 lukket som P7; punkt 2 «parti-filter i
> elevfilter» og punkt 3 «faner/Min plan-omstrukturering» står åpne).
> Innholdet dupliseres ikke hit.

### Klar til bygging

- **Ferie-filtrering i AI-økt-import** (sekundærfunn under P32). Prompten i
  `ai-parse-sessions` har ingen ferie-instruks og mottar ikke skoleruten — AI
  lager økter av «Vinterferie»-tekst. Delvis avbøtet av P30-forhåndsvisningen
  (fridag-rader flagges gule, rader uten fag blir røde og importeres aldri),
  men kjernen står.
- **Uke-først i `ai-parse-sessions`** (P40; fra uke-først-runden og P30).
  Edge-funksjonen bruker ennå ikke uke-først-mønsteret fra
  `ai-parse-skolerute` (skoleår i prompt, datoberegning i kode). Henger
  naturlig sammen med ferie-filtreringspunktet over (samme prompt/funksjon).
  Mulig samtidig utvidelse fra P30: uke-spenn per rad i importen (én rad =
  én uke i dag).
- **Uke-navigator: Enter-tast registreres ikke.** Begge uke-feltene har kun
  `onchange` og står ikke i et skjema (app.js ~1209 elev, ~1819 lærer);
  tooltip sier likevel «trykk Enter».
- **Default-uke lander feil ved åpning av ikke-aktivt skoleår.** Årsvelgeren
  bytter år uten å beregne uke på nytt (app.js ~1759); uke-seedingen bruker
  lagret uke uansett år. Bytte fra 25/26 uke 30 til 26/27 → står på uke 30.
- **Kopiere økter mellom skoleår + skoleår-skille i «Alle mine økter».**
  Kopiering går alltid inn i aktivt skoleår, ingen målårsvelger (app.js ~2712,
  ~2938); «Alle mine økter» er låst til aktivt år (app.js ~2000).
- **Fargekoding per klasse** — egen planleggingsrunde før bygging. Farge
  finnes i dag kun på fag (`subjects.color_hex`) og fargetema; ingen
  klassefarge i skjema eller app.js.
- **Admin bulk-utvalg på tvers av alle læreres økter** (P40; fra gammel
  backlogg) — egen planleggingsrunde før bygging. Lærer kan i dag bare
  bulk-velge egne økter; vurder om admin skal kunne bulk-velge ALLE økter i
  en klasse/uke for opprydding på vegne av skolen. Må avklares: tydelig
  bekreftelse (sterkere enn kollegahjelp-dialogen?), angre-muligheter, og
  RLS-policy som lar admin endre alle økter i egen skole.

### Venter på svar fra Morfar

- **Funfacts-forenkling** — ÅPENT SPØRSMÅL til Morfar: (a) fritekst eller
  auto-kontekst i emnefeltet, (b) erstatt-mest-viste eller tøm-alt ved
  fornying. Ingenting bygget: `generate-facts` har hardkodet temablanding,
  fornying via `fornyFunfactsRotasjon` + `view_count` (migrasjon 018).
- **Skoleår-dimensjon for fag/klasser/subject_divisions** — status
  «utredning, ikke bygg», 5 åpne punkter, se UTREDNING-skolear-oppsett.md
  (seksjonen «Åpne punkter (avklares før bygging)»).
- **Opprydding etter P32-feilimporten — er dette ryddet?** (P40). AI-importen
  lagret 26/27-økter med `school_year = '25/26'` i prod før P32-fiksen.
  Manuelt Morfar-steg i Supabase SQL Editor; verifiser radene visuelt før
  eventuell sletting:

  ```sql
  SELECT id, class_id, week_nr, day_of_week, activity, school_year
  FROM sessions
  WHERE school_year = '25/26' AND deleted_at IS NULL AND week_nr >= 33
    AND (activity ILIKE '%aktivitet%' OR subject_id IS NULL)
  ORDER BY week_nr, day_of_week;
  ```

### Lav prioritet / ikke aktiv

- **Cosmetic: boks-i-boks i Skoleår-fanen** (lav prioritet). P24 legger fanen
  i felles `.settings-card`, og `renderSkoleaarTab` bygger i tillegg egen
  `.subj-config-box` inni → boks i boks.
- **Preview-deployments Cloudflare/Netlify** (backlogg, ikke aktiv). Ingen
  deploy-konfig i repoet i dag.
- **Syntetiske testfag i prod-databasen** (P40; fra importrunden 014–016).
  Fag uten ekte motpart (norsk, matte, engelsk, kroppsøving + ev. YFF) med
  syntetiske økter fra migrasjon 013 beholdes «inntil videre» — vurder
  opprydding før live.

---

## Økt 7 (P40): Rydde planfiler — minimere .md-størrelse

**Branch:** `claude/rydde-planfiler-01u0jz` (miljøets tildelte branch —
oppgaveteksten sa `claude/PN-rydde-planfiler`, samme situasjon som P34–P39).
**Scope:** KUN `PLAN.md` + `DECISIONS.md`. Ingen kode i `v4/`, ingen
cache-bust, ingen migrasjon, ingen edge functions.

PLAN.md var ~197 KB og inneholdt hele prosahistorikken fra P7 og oppover.
Git + PR-ene ER historikken — alle fullførte plan-seksjoner er slettet (ingen
PLAN-ARKIV.md). Uavsluttede tråder er løftet til backloggen over; begrunnelser
som ikke sto i DECISIONS.md er flyttet dit.

### Sjekkliste

- [x] Fase 1: hele PLAN.md lest (100 %), A/B/C-rapport godkjent av Morfar
      («kjør» mottatt: A6/A7/B8 kast, A2 som åpent spørsmål, A1 ikke duplisert)
- [x] Tråder løftet til backlogg: uke-først i ai-parse-sessions (+uke-spenn),
      admin bulk-utvalg, P32-opprydding (åpent spørsmål m/SQL), syntetiske
      testfag
- [x] 7 begrunnelser lagt inn i DECISIONS.md (P10, 018, P27, P33, P12,
      stående valg fra tidligere runder, import 014–016)
- [x] Alle fullførte plan-seksjoner (P2–P39) slettet fra PLAN.md
- [x] Verifisert: kun PLAN.md + DECISIONS.md berørt (git diff --stat)
- [x] Commit + push + PR
