# DECISIONS — Ukeplan1E v4

Beslutningslogg for designvalg som ikke er åpenbare fra koden alene.

## P8 — Klassevelger som fane (19.06.2026)

- **Native `<select>` med `<optgroup>` valgt som dropdown-løsning.**
  Dagens kode bruker allerede native `<select>` (header- og skoleår-velger), og
  `<optgroup>` gir gruppeoverskrifter + visuelt skille mellom «Dine klasser» og
  «Andre klasser» gratis, uten en egen custom-dropdown-komponent.

- **«Dine / Andre klasser»-skillet gjelder ALLE roller, også admin.**
  Admin er alltid også lærer/kontaktlærer og har egne klasser via `user_classes`.
  Det lages derfor ingen egen flat-liste-variant for admin — alle får
  «Dine klasser» (fra `user_classes`, sortert) øverst og «Andre klasser»
  (skolens øvrige klasser) under.

- **Velgeren er alltid en åpningsbar dropdown**, også for lærere med kun én egen
  klasse (de kan ha økter i andre klasser). Den gamle betingelsen om at velgeren
  kun ble bygget når `klasser.length > 1` er fjernet.

- **Klassehentingen er flyttet fra `renderMinKlasseTab` til `renderLaererView`**
  slik at velger-fanen kan bygges uavhengig av hvilken fane som er aktiv.
  `renderMinKlasseTab(container, klasse)` mottar aktiv klasse som parameter.

- **`APP.klasseVelger`-formen endret** fra `{ klasser, aktivKlasse, onChange }`
  til `{ aktivKlasse, setKlasse }`. `setKlasse` brukes til å bytte klasse på
  klasse-fanen uten å miste valgt uke; `aktivKlasse` driver den statiske
  «klasse X»-teksten i headeren.

## P23 — Felles settings-mønster (Profil + admin Skoleinfo) (22.06.2026)

- **Ett gjenkjennbart layout-mønster for innstillings-/profilsider.**
  CSS-klassene `.settings-page` (sentrert smal spalte, max-width 680px),
  `.settings-card` (kort med kant/skygge) og `.settings-close` («X»-lukk) skal
  gjenbrukes av alle innstillings-/profilsider. Profil (`renderInnstillingerTab`)
  og admin-fanen Skoleinfo (`renderSkoleInfoTab`) er referanseimplementasjonen.
  Resten av admin-fanene migreres i en senere økt (P24). Egne klasser ble valgt
  framfor å utvide `.kort`/`.subj-config-box`, som brukes mange andre steder.

- **«X»-utgang navigerer ALLTID via fast rute — aldri `history.back()`.**
  Hjelperen `lagSettingsLukk()` lukker til lærervisning på
  `#/laerer/<APP.laererCtx.tab || 'klasse'>`. Dette virker også etter hard refresh
  (uavhengig av nettleserhistorikk). Faller tilbake til `klasse`-fanen hvis ctx
  mangler ELLER peker på `innstillinger` (Profil selv) — så «X» aldri lukker
  tilbake til siden man nettopp forlot.

- **Ingen bekreftelsesdialog ved ulagrede felt.** Bevisst valg: feltene i Profil
  og Skoleinfo krever et eksplisitt lagre-trykk (egen knapp per skjema), så «X»
  forkaster aldri noe brukeren trodde var lagret. En «vil du forkaste?»-dialog
  ville bare være støy.

- **Lærer-fane-raden skjules på Profil** (`setTab` toggler `.skjult` når
  `slug === 'innstillinger'`), fordi Profil har sin egen `.settings-close`.
  Admin-panelets separate fane-rad er urørt — kun innholdet i Skoleinfo-fanen
  fikk den nye strukturen.
