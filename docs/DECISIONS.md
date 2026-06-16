# Beslutningslogg

Append-only. Nyeste øverst. Hver beslutning forklarer HVA og HVORFOR, slik at
en fremtidig endring ikke uforvarende reverserer noe som var bevisst.

Format per oppføring: dato, beslutning, begrunnelse, ev. konsekvens.

---

## 2026-06 — Dokumentstruktur: README + DECISIONS i tillegg til CLAUDE/PLAN
Innførte `README.md` og `docs/DECISIONS.md`. CLAUDE.md beholdes som
arkitektur/stil/agent-regler; PLAN.md som oppgaveliste. Splitter IKKE CLAUDE.md
i flere filer ennå — den er ikke stor nok til at det lønner seg.
**Hvorfor:** Beslutninger lå tidligere kun i chatlogger og gikk tapt. Chat brukes
til planlegging/diagnose, repoet er hukommelsen. Destillér beslutninger hit.

## (tidligere) — Gemini-modell skal styres via miljøvariabel
Modellnavnet bør flyttes til env-variabelen GEMINI_MODEL i Supabase Secrets
(ikke ennå gjort — står på roadmap).
**Hvorfor:** gemini-1.5-flash ble fullstendig pensjonert av Google (404), og alle
tre edge-funksjonene var stille ødelagt i en lengre periode. Hardkodet modellnavn
krever ny deploy hver gang Google pensjonerer en modell.

## (tidligere) — Retry-logikk i edge-funksjoner
Alle tre AI-funksjonene fikk 3 forsøk ved 429/503.
**Hvorfor:** Gemini returnerer periodisk rate-limit/overbelastning; uten retry
feiler ellers gyldige kall.

## (tidligere) — Skoleår injiseres eksplisitt i AI-prompt + valideres i kode
ai-parse-skolerute fikk skoleåret injisert i prompten, pluss årsvalidering i
koden via isoWeekToDate-helper.
**Hvorfor:** AI gjettet feil skoleår fordi ukedag–dato-mønstre gjentar seg på
6-årssykluser, så modellen mønstermatchet mot eldre treningsdata.

## (tidligere) — ukePosisjon()-helper for uke-sammenligning
Naiv numerisk sammenligning av ukenummer ble erstattet med en helper som
konverterer ukenummer til lineær posisjon i skoleårsekvensen (33–52, så 1–24).
**Hvorfor:** Skoleåret krysser kalenderårsgrensen. Naiv sammenligning brøt ved
begge endene av grensen.

## (tidligere) — arkiv-foer-v2-sletting-branchen er bevart med vilje
Skal IKKE slettes som «stale».
**Hvorfor:** Den er et bevisst arkiv fra før v2-opprydding, ikke en glemt
arbeidsbranch.

## (tidligere) — Forkastet: manuell lagre-modell med pulserende rød knapp
Tas IKKE med videre fra gammelt produksjonssystem.
**Hvorfor:** Det underliggende behovet (tilbakemelding på lagringsstatus) er
reelt og skal løses annerledes, men selve pulse-knapp-mønsteret ønskes ikke.
