# Prosedyrer for Ukeplan1E

> Faste rutiner for hvordan Morfar og Claude samarbeider – i planleggingschat
> og i Claude Code. Referer til dem ved å skrive «kjør oppstartsprosedyre» eller
> «kjør avslutningsprosedyre» (eller «da avslutter vi»).
>
> Kilden er denne fila. CLAUDE.md peker hit, så Claude Code kjenner rutinene
> automatisk hver økt.

---

## Grunnregel

**Morfar er igangsetteren.** Claude venter på uttrykkelig klarsignal før noe
lages eller endres – også utkast og dokumenter, ikke bare kode. Foreslå og
spør; ikke sett i gang selv.

**Prosedyrer startes ikke på antydning.** Før oppstarts- eller
avslutningsprosedyren kjøres, skal Claude spørre «Skal jeg kjøre
oppstartsprosedyren?» / «Skal jeg kjøre avslutningsprosedyren?» og vente på ja.
Dette gjelder også når Morfar skriver noe som ligner («oppstart», «avslutt», «da
er vi ferdige») — kortformer er et signal om hensikt, ikke et klarsignal. Kun
ordrett «kjør oppstartsprosedyre» / «kjør avslutningsprosedyre» kan startes uten
bekreftelse.

---

## Én sak per chat

**Claude Code:** én oppgave (ett P-nummer) per økt. Kontekst fra forrige
oppgave får Code til å blande filer og utvide omfanget.

**Planleggingschat:** én sak per chat. En sak varer fra kartlegging og
planlegging, via ferdig Code-prompt, til sluttoppsummeringen er limt tilbake.
Da er chatten ferdig — neste sak starter i ny chat.

Grunnen er at gammel kontekst blir utdatert underveis: filer endres i repoet
mens chatten står stille, og Claude husker den gamle versjonen. Prosjektminnet
følger med til den nye chatten, så det store bildet går ikke tapt.

**Etter en sluttoppsummering skal Claude derfor ikke foreslå å sette i gang
neste punkt i samme chat.** Å peke på hva som står for tur (oppstartsprosedyren
punkt 3) er riktig; å begynne planleggingen av det er det ikke. Riktig
avslutning er: kvitter for oppsummeringen, nevn neste punkt i backloggen, og la
Morfar starte ny chat.

---

## Status: Før live / Etter live

**Nå (før 1. august 2026):** Siden er ikke i aktiv bruk. Merge til `main`
kan gjøres direkte som en del av avslutningsprosedyren.

**Etter 1. august 2026 (live, ekte brukere):** Merge = publisering. Da skal
avslutningsprosedyren STOPPE ved «PR klar» og vente på Morfars uttrykkelige
«merge». Stram inn merge-steget når vi nærmer oss live.

---

## Oppstartsprosedyre

Formål: komme raskt «på sporet» etter tid borte, uansett om det gjelder en ny
feil, en oppgradering, eller bare å fortsette der vi slapp.

### A. I planleggingschat («kjør oppstartsprosedyre»)

0. **Hent alltid fersk versjon.** Filene leses fra GitHub raw, som kan levere
   hurtiglagret innhold. Legg derfor på en cache-bryter i URL-en
   (`?cb=<dagens dato og klokkeslett>`) ved hver henting. Les deretter
   STATUSLINJE-blokken øverst i PLAN.md og rapporter alltid det P-nummeret du
   faktisk leste der — aldri det du husker fra forrige økt. Backloggen leses
   fra Backlogg-seksjonen i PLAN.md (og `BACKLOGG-UX-MOBIL.md`, som den peker
   til) — aldri fra hukommelse eller prosjektminne.
1. Les `CLAUDE.md`, `PLAN.md` og `DECISIONS.md`.
2. Gi Morfar en kort norsk oppsummering, uten teknisk sjargong:
   - Hvor står vi (siste fullførte P-nummer)?
   - Hva er neste ubehandlede punkt i backloggen?
   - Hvilke åpne spørsmål venter på svar fra Morfar?
3. Avslutt alltid med spørsmålet: **«Hva vil du ta tak i nå?»**
   - Har Morfar noe nytt (feil/oppgradering) → beskriv det → foreslå P-nummer
     og kartlegging/plan.
   - Vil han bare fortsette → pek på neste punkt i backloggen.
4. Når oppgaven er klar: lag en **ferdig Code-prompt** Morfar kan kopiere rett
   inn i Claude Code (se mal nederst). Den skal inneholde ØKT-etiketten,
   P-nummeret og oppstartsstegene for Code inline.

### B. I Claude Code (limes inn øverst i økt-prompten)

1. **Repo-sikkerhetssjekk:** finnes `CLAUDE.md` og `PLAN.md`? Hvis ikke –
   STOPP, dette er feil repo. Ikke bygg fra bunnen.
2. `git fetch` (fjern-refs er ofte utdaterte ved øktstart).
3. Bekreft ren `main` og at du står på riktig utgangspunkt før du brancher.
4. Les `CLAUDE.md` + `PLAN.md`.
5. Rapporter kort status og vent på oppgaven / godkjenning av plan.
6. Ikke skriv implementasjonskode før planen er godkjent («kjør»).

---

## Avslutningsprosedyre («da avslutter vi» / «kjør avslutningsprosedyre»)

Kjøres i Claude Code når arbeidet på en økt er ferdig. Fast rekkefølge:

1. **Oppdater .md-filene** som er berørt:
   - `PLAN.md`: kryss av fullført punkt / oppdater status. STATUSLINJE-blokken
     og Backlogg-seksjonen øverst skal ALLTID oppdateres i SAMME commit som
     resten av PLAN.md — ellers råtner de og gir feil statusbilde neste økt.
   - `DECISIONS.md`: legg til beslutning med begrunnelse hvis en ble tatt
     (spesielt bevisste forenklinger – hindrer at de foreslås på nytt).
   - `FUNKSJONELL-BESKRIVELSE.md`: oppdater avkrysning hvis et avvik ble lukket.
2. **Bump cache-bust** i `v4/index.html`.
3. **Commit** – én commit per P-punkt, tydelig melding.
4. **Push** branch `claude/PN-kort-beskrivelse`.
5. **Opprett PR.**
6. **Merge:**
   - Før live: squash-merge til `main`.
   - Etter live: STOPP her. Rapporter «PR klar til merge» og vent på Morfars ok.
7. **Norsk sluttoppsummering** (uten teknisk sjargong) tilbake til
   planleggingschat:
   - **Gjort:** hva ble gjort
   - **P-nummer:** hvilket punkt
   - **Branch:** navnet
   - **Gjenstår:** eventuelle rester
   - **Manuelle steg til Morfar:** SQL-migrasjon i Supabase, redeploy av edge
     functions, visuell verifisering i nettleser – nevn kun de som gjelder.

---

## Mal: ferdig Code-prompt (fylles ut i chat, kopieres til Code)

```
>>> ØKT X (plan-punkt PN) <

Følg oppstartsprosedyren i PROSEDYRER.md (del B). Kort gjengitt:
1. Repo-sikkerhetssjekk: finnes CLAUDE.md og PLAN.md? Hvis ikke – STOPP.
2. git fetch. Bekreft ren main.
3. Les CLAUDE.md + PLAN.md.
4. Rapporter status, vent på godkjenning før implementasjonskode.

Oppgave (PN): <beskrivelse av feil/oppgradering>

Skriv sub-plan under overskriften «Økt X (PN)» i PLAN.md og vent på «kjør».
Branch: claude/PN-kort-beskrivelse.
```
