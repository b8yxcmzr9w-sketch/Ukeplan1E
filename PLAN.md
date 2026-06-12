# PLAN — Ukeplan1E v4

## Status: ALLE FIRE DELER FULLFØRT 11.06.2026
## Neste steg (manuelt i Supabase Dashboard):
##   1. Re-deploy edge-funksjonen ai-parse-skolerute
##      (Edge Functions → ai-parse-skolerute → lim inn ny kode → Deploy)
##   2. Verifiser at GEMINI_API_KEY er satt før testing

Forrige runde (Del A/B/C: AI-overlay, funfacts-FIFO, skolerute-import)
er fullført — arkivert nederst.

Denne planen: **uke-først og årsforankring i `ai-parse-skolerute`**.
Konkret feil som utløste oppgaven: en skolerute for 26/27 uten årstall
i teksten ble tolket som 2020/21 fordi modellen gjettet år fra gamle
publiserte skoleruter. Prinsipp fremover: uke er primær tidsenhet,
datoer beregnes — årstall skal aldri gjettes av AI-modellen.

---

## Kartlegging (gjort før planen)

- `ai-parse-skolerute/index.ts` tar ALLEREDE imot `school_year`
  ('YY/YY') i request-body, validerer formatet, og prompten nevner
  årsintervallet (aug år1 – jul år2). app.js sender allerede
  `school_year` i kallet (renderSkolerute, ~linje 3641).
- MEN: hvis modellen likevel gjetter feil år, avvises i dag HELE
  importen med «Dette ser ut som skoleruten for XX/YY …» — det var
  nettopp dette som traff 26/27-ruta. Ingen korrigering skjer i kode.
- Modellen blir ikke bedt om ukenummer, og ingen uke-til-dato-beregning
  finnes i funksjonen.
- Frontend viser allerede `warnings` fra funksjonen øverst i den
  redigerbare forhåndsvisningen (`visSkoleruteForhandsvisning`) før
  noe lagres — ny advarselskanal trengs ikke.
- Forbilde for år-logikk: `skoleaarKalenderaar(schoolYear, weekNr,
  startWeek)` i app.js (uke ≥ startuke → høstår, ellers vårår).

## Valg: skoleår via request-body (som i dag) — IKKE DB-oppslag

Begrunnelse:
- Mekanismen finnes og virker allerede; DB-oppslag ville krevd
  auth-håndtering + supabase-klient i en funksjon som i dag er
  helt stateless (kun Gemini-kall).
- app.js viser brukeren «Skoleruten du limer inn tolkes for skoleåret
  XX/YY» fra samme verdi som sendes — bruker og AI ser garantert
  samme skoleår.
- Formatvalidering (`YY/YY`) i funksjonen beholdes som vern mot
  manglende/ugyldig verdi.

---

## DEL 1: Skoleåret eksplisitt og uke-først i prompten

- [x] 1.1 Utvid `byggPrompt` med semester-kontekst og forbud mot
      gjetting, omtrent: «Skoleruta gjelder skoleåret ${sy}.
      Høstsemesteret (uke 33–52) er i ${aar1}, vårsemesteret
      (uke 1–24) er i ${aar2}. Hvis teksten mangler årstall, skal du
      bruke disse årene. Du skal ALDRI gjette andre årstall.»
- [x] 1.2 Be modellen returnere `week_nr` (heltall, ellers null) per
      event når teksten oppgir ukenummer (f.eks. «høstferie uke 41»)
      og perioden er innenfor én uke. Flerukers perioder (juleferie):
      `week_nr: null`, kun datoer.
- [x] 1.3 Commit Del 1.

- [x] 1.4 Etterjustering (godkjent muntlig 12.06.2026): milepæler
      tolkes retningsbestemt i prompten — «første skoledag etter
      [ferie]» betyr at dagene/uka FØR var ferien (ukesferier:
      man–fre + week_nr), «siste skoledag før [ferie]» betyr at
      ferien starter dagen ETTER (alene: uka etter, man–fre +
      week_nr); finnes begge, spenner ferien mellom dem.

## DEL 2: Valider og korriger i kode (etter AI-svar, før retur)

- [x] 2.1 Hjelpefunksjon `isoWeekToDate(year, week, weekday)` i
      edge-funksjonen (ISO 8601; weekday 1 = mandag), + motsatt vei
      `isoWeekOf(dateStr)` for konsistenssjekken.
- [x] 2.2 **Uke-først:** har eventet gyldig `week_nr` (1–53), beregnes
      kalenderår i kode: `week_nr >= 33` → høstår, ellers vårår
      (samme prinsipp som `skoleaarKalenderaar`). Datoer beregnes fra
      uka og ERSTATTER modellens:
      - Ligger modellens datoer (etter årskorrigering, 2.3) i samme
        ISO-uke, beholdes ukedagsspennet derfra (dekker f.eks.
        «planleggingsdag onsdag uke 41»).
      - Ellers settes mandag–fredag i uka, med advarsel om at dato og
        ukenummer i teksten ikke stemte overens.
- [x] 2.3 **Årskorrigering (uten week_nr):** riktig dag/måned, feil år
      → korriger året i kode: måned aug–des → høstår, jan–jul → vårår
      (måned er ukenummer-ekvivalenten for rene datoer). Korrigering
      gir advarsel: «Årstall korrigert fra YYYY til YYYY for
      '[tittel]' — kontroller at riktig skolerute er limt inn.»
      Dagens harde avvisning («Dette ser ut som skoleruten for
      XX/YY …») UTGÅR — erstattet av korrigering + advarsel, siden
      brukeren uansett kontrollerer alt i forhåndsvisningen.
- [x] 2.4 **Konsistenssjekk:** etter korrigering sjekkes at
      start_date ≤ end_date og at korrigerte datoer faktisk ligger i
      skoleårsintervallet (1. aug høstår – 31. jul vårår; ugyldige
      dag/måned-kombinasjoner kan fortsatt falle utenfor → da droppes
      raden med advarsel, som i dag). Avvik mellom oppgitt ukedag og
      beregnet dato (2.2) gir advarsel — aldri stille feil.
      CORS-headers og OPTIONS-handler beholdes uendret.
- [x] 2.5 Commit Del 2.

## DEL 3: Frontend — INGEN endring nødvendig

- app.js sender allerede `school_year` i body (ingen nye felter
  trengs), og advarsler vises allerede i forhåndsvisningen før
  lagring. Ingen JS/CSS-endring → ingen `?v=`-bump.
- [x] 3.1 Verifiser ved gjennomlesing at responsformatet
      (`{ events, warnings }`) er uendret sett fra app.js.

## DEL 4: Dokumentasjon

- [x] 4.1 FUNKSJONELL-BESKRIVELSE.md, under «Regler og prinsipper»:
      nytt punkt **«Uke er primær tidsenhet»** (tekst fra oppgaven:
      ukenummer/ukedag er det lærere og elever forholder seg til,
      datoer beregnes fra uke + skoleår, skoleåret sendes alltid som
      kontekst ved AI-tolkning, årstall gjettes aldri av modellen).
- [x] 4.2 Samme fil, sjekklisten «Avvik mellom ønsket og dagens kode»:
      to nye punkter (sender skoleår i prompt + validerer intervall;
      uke-først der teksten oppgir ukenummer) — krysses av når Del 1–2
      er ferdig.
- [x] 4.3 Commit Del 4, oppdater denne planens status/«Neste steg».

## Manuelle steg i Supabase Dashboard (etter koding)

1. **Edge Functions → ai-parse-skolerute:** lim inn ny kode → Deploy
   (eneste funksjon som endres).
2. `GEMINI_API_KEY` må være satt (Secrets-fanen) for å teste.

## Testcase (skolerute 26/27, uten årstall i teksten)

Lim inn tekst med: første skoledag man 17. aug, høstferie uke 41,
vinterferie uke 7, påske uke 12 (påskedag 28. mars 2027). Forventet:
- Høstferie = man 5.10.2026 – fre 9.10.2026 (uke 41, høstår 2026)
- Vinterferie = man 15.2.2027 – fre 19.2.2027 (uke 7, vårår 2027)
- Påskeferie i uke 12/2027; helligdagene rundt påskedag 28.3.2027
  (skjærtorsdag 25.3, langfredag 26.3, 2. påskedag 29.3) i 2027
- «Første skoledag» blir IKKE egen rad (milepæl-filter, som før)
- Ingen datoer i 2020/21 — uansett hva modellen gjetter

## Avgrensninger

- Fredede rotfiler, `info/` og `dev/` røres ikke.
- `generate-facts` og `ai-parse-sessions` røres ikke (uke-først for
  økt-import kan tas i egen runde).
- Ingen endring i databaseskjema — ingen ny migrasjon.

---

## Beslutninger tatt (tidligere runder — gjelder fortsatt)
- Fellesundervisning er løst som «koblede kopier»: én rad per klasse
  med felles `shared_group_id`. Kortene viser «👥 Felles med …».
- Fridagsblokkering gjelder typene ferie/helligdag/planleggingsdag.
  Typen «annet» blokkerer ikke.
- Elevtilgang: forsiden beholder den åpne klasselisten.
- Konflikthåndtering: navngitt varsel — «Økten er endret av [navn]
  ([tidspunkt]) — last inn på nytt før du lagrer».
- Skolerute-import: håndterte feil returneres som 200 + `{ error }`
  slik at meldingen når brukeren (supabase-js skjuler body ved
  non-2xx). AI får kun bruke typene ferie/helligdag/planleggingsdag;
  milepæler filtreres i prompt + sikkerhetsnett.

## Arkiv: fullførte runder

### Del A/B/C (fullført 11.06.2026)
AI-overlay med funfacts (`medAIOverlay`), funfacts-FIFO med maks 100
og soft-delete av eldste (migrasjon 011), og forbedret skolerute-
import med skoleår-forankring, redigerbar forhåndsvisning og
erstatt/legg til-valg. Manuelle steg den gangen: migrasjon 011 i SQL
Editor + re-deploy av `ai-parse-skolerute`.

### Oppgave 1–8 (fullført 11.06.2026)
Alle åtte oppgavene fra gjennomgangen av FUNKSJONELL-BESKRIVELSE.md er
fullført og merget til main: sporbarhet (migrasjon 007), skolenøytrale
funfacts, fridagsblokkering (`finnFridag`), kollegahjelp (migrasjon
008), rollegrenser i databasen (migrasjon 009), fellesundervisning
(migrasjon 010), elevtilgang (avklart, ingen endring) og
konflikthåndtering med navngitt varsel. Migrasjon 004–010 er kjørt;
`GEMINI_API_KEY` er satt og `006_fix_school_facts_rls.sql` bekreftet
kjørt i prod.
