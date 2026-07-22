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
   (`?cb=<dagens dato og klokkeslett>`) ved hver henting. Kryss deretter av mot
   virkeligheten: sammenlign siste P-nummer og statuslinjen i PLAN.md med det du
   husker fra forrige økt — avviker de ikke i det hele tatt etter en økt du vet
   har vært kjørt, er filen sannsynligvis gammel. Hent på nytt før du
   oppsummerer. Rapporter alltid hvilket P-nummer du faktisk leste, ikke hva du
   husker.
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
   - `PLAN.md`: kryss av fullført punkt / oppdater status.
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
