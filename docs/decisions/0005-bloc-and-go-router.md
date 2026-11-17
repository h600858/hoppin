---
status: godkjent
dato: 2026-11-17
---

# 0005. Bloc, go_router, mocktail og Vitest

## Kontekst

Trenger tilstandshåndtering, ruting og testverktøy. Få, godt vedlikeholdte pakker som
eieren kjenner fra før.

## Beslutning

- Tilstand: **flutter_bloc**. Cubit som standard, Bloc bare der hendelsesstrømmen
  trengs. Avhengigheter via `RepositoryProvider`, ingen get_it.
- Ruting: **go_router**. Vedlikeholdes av Flutter-teamet, gir ekte URL-er i admin-web,
  og `redirect` styrer brukeren etter rolle i mobilappen.
- Dart-tester: **flutter_test**, **bloc_test** og **mocktail** (ingen kodegenerering).
  Repositorier testes mot emulatoren, ikke med en falsk Firestore-pakke.
- Functions-tester: **Vitest**.

## Konsekvenser

- Riverpod er vurdert og valgt bort fordi det er nytt for eieren og ofte bruker
  kodegenerering.
- Serialisering avgjøres i steg 2.
