---
status: godkjent
dato: 2026-11-18
---

# 0006. Konvensjoner for datamodellen

## Kontekst

Samme datamodell finnes som JSON Schema, TypeScript-typer og Dart-modeller. Uten faste
regler for navn, tid og struktur glir de fra hverandre, og tidsfeil rundt sommertid er
blant de vanskeligste feilene å finne.

## Beslutning

**Navn**
- Feltnavn er engelske i camelCase: `name`, `policeCertificateExpiresOn`, `subject`.
- Domeneverdier er norske, små bokstaver, ASCII og understrek: `"laerer"`,
  `"assistent"`, `"sfo"`, `"matematikk"`, `"kunst_og_handverk"`.
- Statuser er engelske (`pending`, `offering` ...). Årsakskoder i callables følger
  kontrakten og er norske (`"allerede_tatt"`, `"kan_ikke"`).
- Ordliste norsk til engelsk står i CLAUDE.md.

**Tid**
- *Tidspunkt* (når noe skjer): Firestore `Timestamp`, alltid UTC. I JSON og skjema:
  ISO 8601 med `Z`, `"format": "date-time"`. Eksempel: `"2026-11-19T07:30:00.000Z"`.
- *Klokkeslett* i timeplan og preferanser: `"HH:mm"` i skolens lokale tid. Skolen har
  `timeZone: "Europe/Oslo"`. Klokkeslett gjøres om til tidspunkt bare i functions.
- *Dato* uten klokkeslett (politiattest, gyldighet): `"YYYY-MM-DD"`, `"format": "date"`.
- *Ukedag*: heltall 1 til 7, mandag er 1 (ISO 8601).
- Trinn er heltall 1 til 10. Klasse er tekst som `"5B"`.

**Struktur**
- Toppnivåsamlinger: `tenants`, `schools`, `schoolConfigs`, `staff`, `substitutes`,
  `timetable`, `absences`, `shifts`, `offers`, `assignments`, `availability`,
  `decisions`, `escalations`. Hendelser i `shifts/{shiftId}/events`.
- Alle dokumenter har `tenantId`. Dokumenter som hører til én skole har `schoolId`.
  Vikarer har `schoolIds` (liste), fordi de kan jobbe på flere skoler.
- Konfigurasjon (vekter, filtre, bølgetabell, stilletid, frister) ligger i
  `schoolConfigs/{schoolId}` med heltallet `version`. Hver versjon kopieres til
  `schoolConfigs/{schoolId}/versions/{version}`, så `decisions` kan peke på den.
- Dokument-ID er Firestore sin auto-ID og lagres ikke inne i dokumentet. Modellene
  har `id` ved siden av dataene. Referanser til andre dokumenter heter `<navn>Id`.

**Skjema og kode**
- Ett skjema per samling: `shared/schema/<samling>.schema.json`, JSON Schema 2020-12,
  `additionalProperties: false`.
- TypeScript-typer genereres fra skjemaene (`npm run gen:types`) og committes.
- Dart-modeller skrives for hånd med `fromMap` og `toMap`, og testes mot de samme
  eksemplene i `shared/fixtures/`.
- Domain kjenner ikke Firestore. `packages/data` og functions gjør `Timestamp` om til
  `DateTime` og `Date` før data leses inn i modellene.

## Konsekvenser

- Ett sted å se hvordan data ser ut (skjemaet), og testene feiler hvis Dart eller
  TypeScript avviker.
- Litt konverteringskode i datalaget for tid. Det er prisen for et domene uten Firebase.
- Norske verdier i engelske felt kan se rart ut, men verdiene er det skolen kjenner igjen.
