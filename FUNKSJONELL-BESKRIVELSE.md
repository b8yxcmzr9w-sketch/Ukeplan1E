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
| Elev/foresatt | ubegrenset | Se planen for sin klasse (ikke andre klasser). Ingen redigering. |
| Lærer | ubegrenset | Opprette og redigere egne økter. Kan hjelpe til med andres økter, men får da en tydelig advarsel før endring. |
| Kontaktlærer | maks 3 per klasse | Alt en lærer kan, pluss: redigere alle økter for sin klasse. |
| Admin | maks 2 per skole | Redigere alt. Administrerer skoleinfo, skoleår, fag, klasser, brukere, skolerute og funfacts. |

**Sporbarhet:** Hver økt skal være merket med hvem som opprettet den og hvem
som sist redigerte den.

## Elev-/foresattvisning

- Åpen, uten innlogging. Elever og foresatte kommer til klassens plan via
  direktelenke (delt av lærer som QR-kode eller kopiert lenke).
- De skal primært ha tilgang til sin egen klasses plan, ikke bla fritt i
  andre klassers planer.
- Kan abonnere på planen i egen kalender via iCal.
- Skolerutens fridager vises i planen.
- Et rullende banner viser funfacts.

## Lærerens arbeidsflyt

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
  endringer uten å vite det. Dagens mekanisme (versjonskontroll ved lagring)
  hindrer stille overskriving, men brukeropplevelsen ved konflikt er ikke
  avklart. → Se «Åpne punkter».
- **Sanntid:** Endringer dukker opp automatisk hos andre uten å laste siden
  på nytt.
- **Skoleskille:** Brukere ser og endrer kun data for sin egen skole.
- **Utskrift:** Ukeplanen kan skrives ut med eget utskriftshode.

## Åpne punkter (må diskuteres/avklares)

- **Konflikthåndtering:** Hva skal brukeren oppleve hvis noen andre har
  endret økten i mellomtiden? Forslag til diskusjon: vis melding «Økten er
  endret av [navn] — last inn på nytt før du lagrer», slik at ingen endringer
  går tapt i stillhet.
- **Elevtilgang i praksis:** Uten innlogging kan tilgangen til «kun sin
  klasse» bare håndheves via direktelenker (den som har lenken, ser planen).
  Er det godt nok, eller skal forsiden slutte å liste alle klasser åpent?

## Avvik mellom ønsket og dagens kode (må verifiseres)

Disse punktene i beskrivelsen finnes muligens ikke i koden ennå, eller
fungerer annerledes. Sjekkliste for Claude Code — verifisert mot koden
11.06.2026 (avkrysset = finnes og fungerer som beskrevet):

- [x] Rollen Kontaktlærer (maks 3 per klasse) med utvidede rettigheter
  — **FINNES.** Rolle i `001_initial_schema.sql` (user_role_enum),
  utvidede rettigheter i `002_rls.sql` (sessions_update_kontaktlaerer
  m.fl.), maks 3-sjekk i `app.js` (visNyBrukerModal /
  visRedigerBrukerModal). Merk: maks-grensen sjekkes kun i nettleseren,
  ikke i databasen.
- [x] Grense på maks 2 admin per skole
  — **FINNES.** Sjekk i `app.js` (visNyBrukerModal /
  visRedigerBrukerModal). Samme forbehold: kun klientside, ikke
  håndhevet i databasen.
- [ ] Advarsel når en lærer redigerer en annens økt
  — **FINNES IKKE.** I dag er det motsatt av ønsket: vanlig lærer får
  ikke redigere andres økter i det hele tatt (rediger-knappen skjules i
  renderMinKlasseTab, og `002_rls.sql` sessions_update_own blokkerer på
  databasenivå). Krever både RLS-endring og advarsel i UI.
- [ ] Merking av økter med opprettet av / sist endret av
  — **FINNES DELVIS.** Databasen har kolonnene `created_by`,
  `last_modified_at` og `last_modified_by` (001_initial_schema.sql), og
  en trigger setter `last_modified_at`. Men `last_modified_by` settes
  aldri, og ingen av delene vises i grensesnittet.
- [ ] Økt som gjelder flere klasser samtidig
  — **FINNES IKKE.** `sessions.class_id` peker på én klasse.
  (`multi_day_events` kan gjelde alle klasser, men det er hendelser,
  ikke undervisningsøkter.)
- [ ] Blokkering av økter på fridager (ikke bare visning)
  — **FINNES IKKE.** Fridager vises kun i elevvisningen
  (renderElevView); lærervisningen viser dem ikke, og visNyOktModal /
  kopiering har ingen fridag-sjekk (kun duplikat- og kollisjonssjekk).
- [ ] Elevvisning begrenset til egen klasse (i dag listes alle klasser
  på forsiden)
  — **FINNES IKKE.** Forsiden lister alle klasser åpent (renderElevView,
  velkomstsiden), og RLS tillater lesing av alle klasser/økter uten
  innlogging (sessions_read_any). Henger sammen med «Åpne punkter» —
  må avklares før bygging.
- [ ] Tekst/oppsett som antar Øksnevad spesifikt — skal være skolenøytralt
  — **FINNES DELVIS** (delvis nøytralt). Appen henter skolenavn, logo og
  tema fra databasen, men `generate-facts`-funksjonen har Øksnevad,
  Jæren og Rogaland hardkodet i AI-prompten, og tittelen «Ukeplan1e» /
  README er knyttet til én skole.
