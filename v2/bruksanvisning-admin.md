# Tillegg – Skoleadmin

> Dette er et tillegg til **Bruksanvisning – Lærer** og **Tillegg – Kontaktlærer**. Alt som gjelder lærere og kontaktlærere gjelder også skoleadmin.

---

## Ekstra faner

Som skoleadmin har du tilgang til alle faner under **Admin**:

| Fane | Innhold |
|---|---|
| Brukere | Opprett, rediger og slett brukere |
| Innstillinger | Skoleinfo, fag, klasser, lenker, avansert |
| Skolerute | Legg inn ferie og fridager |

---

## Brukere

### Ny bruker
1. Klikk **+ Ny bruker**
2. Fyll inn navn, passord, klasser og fag
3. Velg **Rolle**:
   - **Lærer** – normal tilgang
   - **Kontaktlærer** – kan se brukeroversikten
   - **Skoleadmin** – full tilgang
4. Klikk **Lagre**

> Tips: La passordfeltet stå tomt for å beholde eksisterende passord ved redigering.

### Rediger / slett bruker
Klikk **Rediger** eller **Slett** ved siden av brukerens navn i listen.

---

## Innstillinger

### Skoleinfo
Sett skolenavn, adresse, standardklasse og logo-URL. Klikk **Lagre** i seksjonen.

### Fag og standard dager
Legg til fag og angi hvilke dager de normalt undervises (brukes som forslag i Ny økt og parsing).

### YFF-grupper / NPT-partier
Legg til gruppenavn som lærere kan velge fra i Ny økt og Min profil.

### Klasser
Legg til klassenavn (f.eks. `Gård`, `Natur`, `Teknikk`). Klikk **Lagre**.

### Klasselenker
Oversikt over alle klasser med QR-kode og URL. Klikk **Skriv ut alle** for å skrive ut et ark med alle klassekort til oppsett av Teams eller deling med elever.

### Laste-sitater
Klikk **✨ Oppdater sitater** for å generere nye laste-sitater med AI.

### Avansert (nytt skoleår)

> **OBS:** Last alltid ned backup før du sletter noe.

| Knapp | Funksjon |
|---|---|
| ⬇️ Last ned backup | Laster ned alle økter og skoleruten som JSON-fil |
| 🗑️ Slett alle økter | Tømmer Plan-arket (krever dobbel bekreftelse) |
| 🗑️ Slett skolerute | Tømmer Skolerute-arket |

---

## Skolerute

### Legg inn manuelt
Bruk tabellen til å legge inn ferieperioder og fridager rad for rad.

### AI-parsing
Lim inn skoleruten som tekst (f.eks. fra skolens nettside) og klikk **Analyser**. Kontroller radene og klikk **Lagre**.

---

## Deploy av appsscript

Hver gang backend-koden (`appsscript.gs`) oppdateres, må den deployes på nytt:

1. Åpne [script.google.com](https://script.google.com) og velg prosjektet
2. Klikk **Distribuer → Administrer distribusjoner**
3. Velg den aktive distribusjonen og klikk **✏️ Rediger**
4. Velg **Ny versjon** og klikk **Distribuer**

Uten dette steget vil endringer i backend ikke tre i kraft.
