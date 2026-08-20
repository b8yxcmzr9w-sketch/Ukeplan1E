# Ukeplan – Funksjonell beskrivelse

Dette dokumentet beskriver hva tjenesten **skal** gjøre. Der dagens kode
avviker fra dette, er det koden som skal endres — ikke dokumentet.

Sist oppdatert: juni 2026.

## Hva tjenesten er

Ukeplan er en norsk ukeplantjeneste, åpen for bruk i alle skoler det måtte
passe for — ikke knyttet til én bestemt skole. Hver skole administrerer sine
egne data, adskilt fra andre skoler. Lærere planlegger undervisningsøkter per
klasse og uke. Elever og foresatte ser klassens plan.

Produksjon: https://ukeplan1e.ganddal.net/v4/

## Roller

| Rolle | Antall | Hva de kan |
|---|---|---|
| Elev/foresatt | ubegrenset | Se klasseplaner uten innlogging (forsiden lister alle klasser — bevisst valg, se «Avklarte beslutninger»). Ingen redigering. |
| Lærer | ubegrenset | Opprette og redigere egne økter. Kan hjelpe til med andres økter, men får da en tydelig advarsel før endring. |
| Kontaktlærer | maks 3 per klasse | Alt en lærer kan, pluss: redigere alle økter for sin klasse. |
| Admin | maks 2 per skole | Redigere alt. Administrerer skoleinfo, skoleår, fag, klasser, brukere, skolerute og funfacts. |

**Sporbarhet:** Hver økt skal være merket med hvem som opprettet den og hvem
som sist redigerte den.

## Elev-/foresattvisning

- Åpen, uten innlogging. Elever og foresatte kommer til klassens plan via
  direktelenke (delt av lærer som QR-kode eller kopiert lenke), eller ved å
  velge klassen fra listen på forsiden.
- Forsiden lister alle klasser åpent. Dette er et bevisst valg (avklart
  11.06.2026): planene er ikke sensitive, og åpen liste er enklest for
  elever og foresatte.
- Kan abonnere på planen i egen kalender via iCal.
- Skolerutens fridager vises i planen.
- Et rullende banner viser funfacts.

## Lærerens arbeidsflyt

- Lærer uten konto kan be om tilgang direkte fra innloggingssiden (uinnlogget
  skjema: navn, skole-e-post, ønsket rolle, fag/parti/gruppe som informasjon,
  fritekst til admin). Skolens admin(er) varsles på e-post; kontoen opprettes
  fortsatt manuelt av admin etter godkjenning (P57).
- Ukeoversikt for egen klasse («Min klasse»). Lærere med flere klasser bytter
  klasse med en velger i headeren.
- Oppretter, redigerer, kopierer og sletter økter. Kan kopiere én eller flere
  økter samtidig til en annen uke (bulk-kopi).
- Kan lime inn tekst og få AI til å tolke den til økter automatisk.
- Deler elevlenke (QR + kopier) og iCal-abonnement.
- Ved forsøk på å endre en annen lærers økt: tydelig advarsel først, men
  endringen er tillatt (kollegahjelp).

## Admin

- Administrerer skoleinfo (navn, logo, fargetema), skoleår, fag, klasser,
  brukere, skoleruten og funfacts.
- Skoleruten kan limes inn som tekst og tolkes av AI. Kun admin kan
  redigere skoleruten.
- Oppretter brukere (lærere/kontaktlærere).
- Ser ventende tilgangsforespørsler fra uinnloggede lærere og kan
  godkjenne/avvise dem. Dette endrer kun status — admin oppretter selve
  kontoen manuelt som før, etter å ha lest forespørselen (P57).
- Kan eksportere et helt skoleår som JSON, CSV eller PDF.

## Hvordan dataene henger sammen

```
Skole (flere skoler kan bruke tjenesten, adskilt fra hverandre)
 └── Skoleår (ett aktivt skoleår om gangen; uke 33 → uke 24)
      └── Klasse
           └── Uke
                └── Økt (fag, tid, innhold, opprettet av, sist endret av)
```

- En økt gjelder vanligvis én klasse, men skal i spesielle tilfeller
  kunne gjelde flere klasser (fellesundervisning).
- Skoleruten (ferier/fridager) blokkerer opprettelse av økter på
  fridager, og fridagene vises i planen for alle.

## Regler og prinsipper

- **Samtidig redigering:** To brukere skal ikke kunne overskrive hverandres
  endringer uten å vite det. Versjonskontroll ved lagring hindrer stille
  overskriving, og ved konflikt får brukeren beskjed om hvem som endret
  økten og når («Økten er endret av [navn] — last inn på nytt før du
  lagrer»), slik at ingen endringer går tapt i stillhet.
- **Sanntid:** Endringer dukker opp automatisk hos andre uten å laste siden
  på nytt.
- **Skoleskille:** Brukere ser og endrer kun data for sin egen skole.
- **Utskrift:** Ukeplanen kan skrives ut med eget utskriftshode.
- **Uke er primær tidsenhet.** Lærere og elever forholder seg til
  ukenummer og ukedag («uke 9, onsdag»), ikke datoer. Dette gjelder
  overalt i grensesnittet:
  - Navigasjonsraden viser «Uke 9» prominente — datointervallet for uka
    er ikke synlig i navigasjonen.
  - Dagnavnet i ukenettet (MANDAG, TIRSDAG …) er primær; datoen (10.02)
    vises nedtonet på en sekundær linje under.
  - Perioder i skoleruten og arrangementer angis alltid med uke først:
    «uke 7 · 10.02–21.02».
  - Fridags-feilmeldinger nevner uke eksplisitt:
    «Vinterferie (uke 7, 10.02–14.02)».
  - Datovelgere i admin-modaler viser et live uke-hint når dato fylles ut.
  - Datoer beregnes fra uke + skoleår, aldri omvendt. Ved AI-tolkning av
    skolerute og økter: skoleåret sendes alltid med som kontekst, og
    årstall gjettes aldri av modellen.

## Avklarte beslutninger (juni 2026)

1. **Konflikthåndtering:** Ved versjonskonflikt vises en melding med
   hvem som endret økten og når: «Økten er endret av [navn] — last inn
   på nytt før du lagrer.» Ingen endringer overskrives i stillhet.
   Bevisst forenkling: ingen visning av den andres endringer, ingen
   fletting og ingen kopier-funksjon — konflikter er sjeldne, og
   brukeren skriver heller inn på nytt.
2. **Elevtilgang:** Direktelenke er godt nok. Forsiden beholder
   klasselisten — åpen visning er et bevisst valg.

## Avvik mellom ønsket og dagens kode (må verifiseres)

Disse punktene i beskrivelsen finnes muligens ikke i koden ennå, eller
fungerer annerledes. Sjekkliste for Claude Code:

Verifisert mot koden juni 2026; punktene under er deretter bygget
11.06.2026 (se PLAN.md). Migrasjon 007–010 er kjørt i SQL Editor
11.06.2026. Gjenstår: re-deploy av `generate-facts` (verifiser med
«✨ Generer med AI» i Funfacts-fanen).

- [x] Rollen Kontaktlærer (maks 3 per klasse) med utvidede rettigheter
      — FINNES: rolle, RLS-policies og maks 3-sjekk. Grensen håndheves
      nå også i databasen (migrasjon 009), og en feil som gjorde at
      kontaktlærer-rettighetene i RLS aldri virket, er rettet samme sted.
- [x] Grense på maks 2 admin per skole
      — FINNES: sjekk i admin-grensesnittet, og fra migrasjon 009 også
      håndhevet i databasen.
- [x] Advarsel når en lærer redigerer en annens økt
      — BYGGET: alle lærere kan nå redigere andres økter, men får en
      tydelig bekreftelsesdialog først (kollegahjelp). Migrasjon 008 kjørt.
- [x] Merking av økter med opprettet av / sist endret av
      — BYGGET: appen lagrer begge ved opprettelse/endring, og
      redigeringsvinduet viser «Opprettet av … · Sist endret av …».
      Migrasjon 007 kjørt.
- [x] Økt som gjelder flere klasser samtidig
      — BYGGET: «Ny økt» kan krysses av for flere klasser; det lagres
      én rad per klasse koblet med felles gruppe-id, og kortene viser
      «👥 Felles med …». Migrasjon 010 kjørt.
- [x] Blokkering av økter på fridager (ikke bare visning)
      — BYGGET: skoleruten (ferie/helligdag/planleggingsdag) blokkerer
      nå lagring i ny økt, rediger, kopier, bulk-kopi og AI-import.
- [x] Elevvisning begrenset til egen klasse (i dag listes alle klasser
      på forsiden)
      — AVKLART 11.06.2026: forsiden beholder den åpne klasselisten
      (bevisst valg, se «Avklarte beslutninger»). Punktet utgår — ingen
      kodeendring.
- [x] Tekst/oppsett som antar Øksnevad spesifikt — skal være skolenøytralt
      — BYGGET: funfacts-AI-en bruker nå skolens navn fra databasen i
      stedet for hardkodet Øksnevad/Jæren/Rogaland. Krever re-deploy av
      `generate-facts`.
- [x] `ai-parse-skolerute` sender med aktivt skoleår i prompten og
      validerer at alle datoer ligger innenfor skoleåret
      — BYGGET 11.06.2026: prompten forankres i skoleåret (høst-/vårår
      eksplisitt, forbud mot å gjette årstall), og feil årstall
      korrigeres i kode med advarsel i forhåndsvisningen. Krever
      re-deploy av `ai-parse-skolerute`.
- [x] Skolerute lagres/tolkes uke-først der teksten oppgir ukenummer
      — BYGGET 11.06.2026: modellen returnerer ukenummer som eget felt,
      og datoene beregnes i kode fra ISO-uke + riktig kalenderår
      (`isoWeekToDate`). Avvik mellom dato og ukenummer gir advarsel.
