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
