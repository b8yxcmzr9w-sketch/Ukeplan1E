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
fungerer annerledes. Sjekkliste for Claude Code:

Verifisert mot koden juni 2026:

- [x] Rollen Kontaktlærer (maks 3 per klasse) med utvidede rettigheter
      — FINNES: rolle i databasen, rettigheter via RLS-policies, maks
      3-sjekk i admin-grensesnittet. Forbehold: grensen håndheves kun i
      nettleseren, ikke i databasen.
- [x] Grense på maks 2 admin per skole
      — FINNES: sjekk i admin-grensesnittet ved opprettelse og endring av
      brukere. Samme forbehold: håndheves ikke i databasen.
- [ ] Advarsel når en lærer redigerer en annens økt
      — FINNES IKKE: i dag er det motsatt — vanlige lærere er helt
      blokkert fra å redigere andres økter (både i grensesnittet og i
      databasen). «Tillatt med advarsel» må bygges.
- [ ] Merking av økter med opprettet av / sist endret av
      — FINNES DELVIS: databasen har feltene, men «sist endret av» fylles
      aldri ut, «opprettet av» sendes ikke fra appen, og ingenting av
      dette vises til brukeren.
- [ ] Økt som gjelder flere klasser samtidig
      — FINNES IKKE: en økt er knyttet til nøyaktig én klasse.
      (Flerdagshendelser kan gjelde alle klasser, men det er ikke økter.)
- [ ] Blokkering av økter på fridager (ikke bare visning)
      — FINNES IKKE: fridager vises i planen, men ingenting hindrer
      opprettelse av økter på fridager.
- [ ] Elevvisning begrenset til egen klasse (i dag listes alle klasser
      på forsiden)
      — FINNES IKKE: forsiden lister alle klasser åpent, og hvem som
      helst kan se alle klassers planer. → Avhenger av åpent punkt.
- [ ] Tekst/oppsett som antar Øksnevad spesifikt — skal være skolenøytralt
      — FINNES DELVIS: selve appen er nøytral (skolenavn hentes fra
      databasen), men AI-funksjonen for funfacts har Øksnevad, Jæren og
      Rogaland hardkodet i instruksjonen til AI-en.
