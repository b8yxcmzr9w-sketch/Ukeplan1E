# Ukeplan

Norsk ukeplantjeneste for skoler. Lærere planlegger undervisningsøkter per
klasse og uke; elever og foresatte ser sin klasses plan uten innlogging.
Multi-tenant — hver skole har sine egne data, adskilt fra andre.

**Grunnprinsipp:** Ukenummer er den primære tidsenheten gjennom hele systemet.
Kalenderdatoer er avledet hjelpeinformasjon. Skoleåret går fra uke 33 til uke 24
(august–juni).

## Produksjon
- Aktiv tjeneste under utvikling: https://ukeplan1e.ganddal.net/v4/
- Gammel løsning (FRYST, i daglig bruk): https://ukeplan1e.ganddal.net/

## Teknisk
- **Frontend:** Vanilla JS, én fil (`v4/app.js`), `v4/style.css`, `v4/index.html`
- **Backend:** Supabase (PostgreSQL med RLS, Auth, Realtime, Edge Functions)
- **AI:** Gemini via Supabase Edge Functions (funfacts, tekstimport av økter
  og skolerute)
- **Hosting:** GitHub Pages

## Deploy
- **Frontend:** push til main → GitHub Pages. Husk å bumpe `?v=YYYYMMDDx` i
  `v4/index.html` ved JS/CSS-endringer (Safari cacher hardt).
- **SQL-migrasjoner:** kjøres manuelt i Supabase Dashboard → SQL Editor.
- **Edge Functions:** deployes manuelt i Supabase Dashboard → Edge Functions →
  Code-fanen.

## Dokumentasjon
- `CLAUDE.md` — arkitektur, kodekonvensjoner og arbeidsregler (leses av Claude Code)
- `PLAN.md` — oppgaveliste og neste steg
- `docs/DECISIONS.md` — logg over viktige beslutninger og hvorfor de ble tatt
- `docs/FUNKSJONELL-BESKRIVELSE.md` — hva tjenesten skal gjøre (når ferdigstilt)
