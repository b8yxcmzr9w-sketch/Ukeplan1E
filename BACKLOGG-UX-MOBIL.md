# Backlogg — UX og mobilforbedringer

> Notert juni 2026 etter gjennomgang av skjermbilder fra mobil.
> Dette er ønsker/forbedringer, ikke ferdig spesifisert. Skal brytes ned
> til egne Claude Code-økter (én økt per punkt) senere.

## 1. Plassbruk på mobil (elevvisning)

- **Heldagshendelser tar for stor plass.** På mobil fyller en heldagshendelse
  (f.eks. «2. pinsedag») hele dagens høyde med tomt felt under. Skal komprimeres
  til en kompakt rad/banner.
- **Dager med kun én økt har for mye tomrom.** Høyden per dag skal tilpasses
  innholdet — ikke fast høyde. Fjern unødvendig tomrom.

## 2. Elevfilter — parti/gruppe (utvider eksisterende elevfilter)

- Filteret fungerer i dag, men **mangler filtrering på parti**.
- Eleven skal kunne velge **kun ett parti eller én gruppe per fag** (ikke
  flere samtidig innen samme fag).
- Knytter an til eksisterende elevfilter-spesifikasjon (INSTRUKS-ELEVFILTER.md,
  BESLUTNING-FILTER-UI.md) og til admin parti/gruppe-navngiving.

## 3. Faner i lærervisning — omstrukturering

> Oppdatert juni 2026 etter drøfting med Claude Code.
> Tidligere idé «fjern Min klasse-fanen» er erstattet av filterverdi-løsningen
> under — bedre fordi det gir én renderfunksjon å vedlikeholde.

### Klassevelger som filter (kombinerer «Min klasse» + «Min plan»)
- Klassevelgeren i headeren blir et **filter**, ikke en egen visning.
- **«Alle klasser» (default)** → «Min plan»: hele din plan på tvers av klasser,
  scrollende liste med ukedag-merking.
- **Spesifikk klasse valgt** → samme visning, filtrert til den klassen
  (det «Min klasse» gjorde før).
- «Min klasse» forsvinner som *fane*, men beholdes som *funksjon* (en
  filterverdi). Filteret er rent additivt: alltid «mine økter», evt. snevret
  til én klasse.
- Konsekvens: ingen to-fane-struktur, ingen risikabel re-render-omskriving,
  én renderfunksjon.

### «Alle mine økter» → «Min plan»
- Døpes om til **«Min plan»**.
- **Scroll-oppførsel som i dag** (kontinuerlig liste med uke-overskrifter).
- **Default: scroller automatisk til dagens dato** ved åpning.
- **«I dag»-knapp** som **kun vises når brukeren har scrollet forbi
  inneværende uke**. Implementeres med **`IntersectionObserver`** på
  inneværende uke-overskrift (mer robust enn å lese scrollposisjon).
  Knappen scroller tilbake til dagens dato.
- Øktene skal **merkes med ukedag**, kompakt.

### Kompakt layout på bred skjerm — ekte dag-kolonner (BESLUTTET av Morfar)
- **Layout: ekte ukedag-kolonner** (mandag→fredag, venstre→høyre) per uke.
  Økter på samme dag stables **under hverandre** i sin dagkolonne; neste dag
  til høyre.
- **Tomrom er informasjon.** En tom dag beholdes som tom kolonne — det
  forteller læreren at dagen er ledig. Skal IKKE pakkes bort.
- **Kort-innhold her: kun fag + aktivitet.** Trykk på kortet → full info
  (rom, info, lærer osv.).
- Mål: rask oversikt over hele uka på én gang.
- **Merk:** Dette OMGJØR Code sitt forslag om auto-fit-grid
  (`minmax(280px,1fr)`). Code forkastet dag-kolonner pga. tomme dager —
  men nettopp tomme dager er ønsket informasjon her. Dag-kolonner skal bygges.
- Mobil beholder vertikal liste.

### Klassefiltrert modus — scrollende (BESLUTTET av Morfar)
- Også i klassefiltrert modus: **scrollende** over alle uker — samme oppførsel
  som «Min plan» ellers. (Code reiste dette som åpent spørsmål; avklart:
  scrollende har alltid vært ønsket. Ingen ukebasert variant.)

## 4. Økt-kort — skjulte handlinger (gjelder ALLE visninger) ✅ FULLFØRT (P7)

> **Status: FULLFØRT** som plan-punkt P7 (juni 2026, branch
> `claude/P7-okt-handlinger-sveip-kebab`). Se PLAN.md → «Økt X (P7)».
> Oppdatert juni 2026 etter drøfting med Claude Code.
> **Forkastet:** long-press (lett å utløse ved uhell under scroll, treg, ingen
> affordance) og hover på desktop («tivolistemning» — urolige kort).
> Re-foreslås ikke.

- Redigeringsknappene (blyant, kopier, slett, flytt) skal **ikke være
  alltid synlige**. De erstattes av en bevisst, aktiv handling.
- **Mobil:** **sveip venstre** på kortet avslører handlingene. Sveip skal
  **kun avsløre knapper**, aldri utføre slett direkte (tryggere mot uhell).
- **Desktop/laptop:** diskret **kebab-ikon (⋮)** i kortets hjørne → klikk
  åpner liten handlingsmeny. **Høyre-klikk** kan legges til som valgfri
  snarvei i tillegg.
- **Felles kode:** sveip (mobil) og kebab/høyre-klikk (desktop) åpner samme
  meny. Én felles `visOktHandlinger(session)` rendrer handlingslisten
  uavhengig av hvordan den ble åpnet — logikken ett sted.
- **Gjelder alle visninger** der økt-kort har knapper (elevvisning der
  relevant, klassefiltrert visning, «Min plan», søk osv.).

### Mobil — to gester, skill info og handling
- **Kort trykk** → utvider kortet (rom, info, lærer). «Vis meg mer».
- **Sveip venstre** → avslører handlinger. «La meg gjøre noe».
- **Komprimert kort-innhold på mobil:** vis kun **Klasse, Fag og Aktivitet**;
  kort trykk utvider resten.

## 5. Kompaktmodus på mobil i «Alle mine økter» (fra P42)

> Notert juli 2026 under P42 (kompakt lærervisning). Besluttet av Morfar:
> mobil-kortlisten ble bevisst holdt UENDRET i P42 — kompaktmodusen med faste
> kolonner gjelder kun desktop (≥701px), og modusvelgeren er skjult på mobil.

- Vurder en mobil-tilpasset kompaktvisning av «Alle mine økter» (én linje per
  økt er neppe realistisk på smal skjerm — trolig en tettere kortvariant).
- Gjenbruk prinsippene fra P42: uke som primær tidsenhet, «vis kun ved første
  forekomst» for uke/dato, tomrom er informasjon.

## Foreslått rekkefølge (til diskusjon)

1. Plassbruk på mobil (punkt 1) — rask gevinst, ren CSS/layout.
2. Økt-kort komprimering + sveip/kebab-handlinger (punkt 4) — påvirker
   både elev og lærer.
3. Faner-omstrukturering (punkt 3) — større endring i lærervisning.
4. Parti-filter i elevfilter (punkt 2) — avhenger av admin-navngiving.
