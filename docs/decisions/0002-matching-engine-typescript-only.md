---
status: godkjent
dato: 2026-11-17
---

# 0002. Matchemotoren finnes bare i TypeScript

## Kontekst

Plan 12.4 foreslår motoren i både Dart (forhåndsvisning i admin) og TypeScript
(kjøring i Cloud Functions), med delte testdata. Det gir to implementasjoner som må
holdes like.

## Beslutning

Motoren finnes bare i `functions/src/matching/`, som en ren funksjon uten Firebase,
I/O eller `Date.now()`. Forhåndsvisning i admin kaller en Cloud Function. Denne
beslutningen overstyrer plan 12.4.

## Konsekvenser

- Én sannhet for rangering. Ingen risiko for at forhåndsvisning og kjøring er uenige.
- Forhåndsvisning blir litt tregere (et nettverkskall).
- Testdata i `shared/fixtures/` brukes fortsatt av begge språk, men til modeller og
  skjema, ikke til to motorer.
