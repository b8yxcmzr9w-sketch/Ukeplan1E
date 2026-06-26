# UTREDNING — Skoleår-knytting av fag, klasser og grupper

> **Status: UTREDNING — IKKE BYGG.**
> Dette notatet beskriver et problem og en avklart modell for endringshåndtering
> av fag/klasser/grupper/partier på tvers av og innenfor skoleår. Det er ikke en
> byggeplan. Ingen kode, migrasjon eller edge-function skal røres på grunnlag av
> dette før modellen er godkjent og brutt ned i plan-punkter (PN) i PLAN.md.
>
> Skrevet juni 2026.

## Problemet

`subjects`, `classes` og `subject_divisions` henger i dag på `school_id`, ikke på
et skoleår. Øktene (`sessions`) peker på dem via FK (`subject_id`, `class_id`, og
`session_divisions.division_id`). Konsekvens: endrer admin et fag eller en gruppe,
slår det gjennom **retroaktivt for alle økter som peker på raden** — også
fjorårets ferdige plan.

Krav fra eier: **endringer skal aldri røre fjorårets økter.** En gammel ukeplan
(f.eks. 24/25) skal vise fagene og gruppene slik de var *det året*.

Fagene endrer seg en del fra år til år; gruppene mer. Ikke kritisk å løse nå,
men verdt å gjøre riktig.

## Bærebjelken: skoleår-anker (snapshot)

Fag, klasser og grupper/partier må få en **skoleår-dimensjon**, slik at hvert
skoleår har sitt eget oppsett. Endringer i år N rører aldri år N−1.

Dette er ikke forhandlbart gitt kravet «fjoråret fredet» — det er selve
mekanismen som gjør fredingen mulig. Alle valgene under opererer **innenfor** det
aktive året; fjoråret er alltid urørt uansett hva admin gjør.

## Endringstyper og hva som skal skje

### 1. Navneendring
Gjelder fag, gruppe, parti, klasse. Bare etiketten endres — identiteten er den
samme.

Admin velger tidsgrense:
- **alle øktene** (hele året får nytt navn)
- **fra nå** (grensen er i dag/inneværende uke)
- **fra dato** (admin velger grensen)

Økter før grensen beholder gammelt navn; økter fra grensen får nytt. **Ingen
rydding nødvendig** — ingen økt blir koblingsløs.

### 2. Legge til
Ny gruppe, parti, fag eller klasse. **Bare gjør det** — ingen dialog, ingen
eksisterende økt berøres. Nye økter kan bruke det med en gang.

### 3. Avslutte
Et fag/gruppe/parti/klasse skal ikke tilbys mer.

Admin velger tidsgrense (samme tre som navneendring): **alle / fra nå / fra dato**.
Grensen avgjør hvilke økter som rammes: alt **etter grensen** må ryddes.

Øktene etter grensen må enten:
- **overføres** til et annet fag/gruppe/parti/klasse, eller
- **slettes**.

Passer ingen av delene → **operasjonen avbrytes** (admin går heller en annen vei,
f.eks. navneendring). Det finnes ikke et «endre»-alternativ her — det dekkes
allerede av de andre endringstypene.

Etter avslutning er alternativet **utilgjengelig for nye økter etter grensen**.

### 4. Inndelingstype-bytte (parti → gruppe e.l.)
Ingen egen mekanikk. Løses med eksisterende byggeklosser: opprett **nytt fag** med
ønsket inndeling → **overfør** øktene → **slett** det gamle faget.

## Forskjellen i ett bilde

Tidsmodellen er **enhetlig**: navneendring og avslutning bruker samme tre valg
(alle / fra nå / fra dato). Det som skiller dem er konsekvensen:

| | Tidsvalg | Hva skjer med øktene |
|---|---|---|
| Navneendring | alle / fra nå / fra dato | Ingenting ryddes — kun etikett skifter ved grensen |
| Avslutning | alle / fra nå / fra dato | Øktene etter grensen må overføres eller slettes, ellers avbryt |

## Valideringsregel ved opprettelse av nye økter

Et alternativ som har en planlagt avslutning «fra dato X» skal fortsatt være
**valgbart** (det lever til X) — men en ny økt med oppstart **etter X** kan ikke
kobles til det. Ellers fødes økten koblingsløs.

Regel: *et alternativ er valgbart for en økt bare hvis det er aktivt på øktas egen
uke/dato.* Et alternativ som avsluttes uke 2 kan velges for en økt i uke 50, men
ikke for en økt i uke 3.

Regelen gjelder **alle tre inngangene**:
- manuell opprettelse (ny økt-modal),
- **bulk-kopi** (kopiering til annen uke),
- **AI-import**.

### AI-import spesifikt
AI-en kjenner ikke avslutningsgrensene og skal ikke gjøre det. Den tolker tekst
til økter som før. **Valideringen skjer i kode etter tolkningen**, og avvik
**markeres i forhåndsvisningen** før brukeren godtar — samme mønster som de
eksisterende `warnings` i skolerute-importen (AI tolker → kode validerer →
forhåndsvisning viser avvik → bruker bekrefter). Ingen ny arkitektur.

## Oppsummert modell

- **Snapshot per skoleår** — fjoråret alltid fredet (bærebjelke).
- **Navneendring** — alle / fra nå / fra dato. Ingen rydding.
- **Legge til** — bare gjør det.
- **Avslutte** — alle / fra nå / fra dato. Øktene etter grensen overføres eller
  slettes, ellers avbryt. Deretter utilgjengelig for nye økter etter grensen.
- **Inndelingstype-bytte** — nytt fag + overfør + slett gammelt. Ingen egen mekanikk.
- **Validering** — nye/kopierte/AI-importerte økter kan kun kobles til
  alternativer som er aktive på øktas egen uke; AI-avvik markeres i
  forhåndsvisningen.

## Åpne punkter (avklares før bygging)

1. **«Fra dato/uke» som enhet.** Grensen uttrykkes antagelig i **ukenummer**
   (uke er primær tidsenhet), ikke kalenderdato. Bekreft.
2. **Overfør-målet.** Når admin velger «overfør», peker systemet ut mottaker?
   Hva om det ikke finnes en passende mottaker (f.eks. avslutter eneste gruppe i
   et fag)? Faller man da tilbake på «slett eller avbryt»?
3. **Snapshot-mekanikk.** Hvordan opprettes neste års oppsett konkret — kopieres
   forrige år automatisk ved årsskifte, eller settes det opp manuelt? (Mulig
   kobling til «planleggingsmodus for skolen», parallell til ukeplanen.)
4. **Teknisk konsekvens av «fra grense».** «Fra uke X» kan ikke være en ren
   rad-oppdatering (den ville truffet alle øktene på raden samtidig). Krever enten
   ny rad fra grensen eller tidsstemplet kobling på økt-nivå. Designes når
   modellen er godkjent.
5. **Migrasjonsvei.** Eksisterende data (24/25, 25/26 allerede importert) må få
   skoleår-anker uten å bryte dagens økter. Egen plan.
