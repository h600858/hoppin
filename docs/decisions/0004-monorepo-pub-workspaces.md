---
status: godkjent
dato: 2026-11-17
---

# 0004. Monorepo med Dart pub workspaces

## Kontekst

To Flutter-apper deler modeller, repositorier og tema. Functions i TypeScript deler
skjema og testdata med Dart-koden.

## Beslutning

Ett repo. Dart-delen er et pub workspace: rot-`pubspec.yaml` lister medlemmene, og hvert
medlem har `resolution: workspace`. Functions er et eget npm-prosjekt i `functions/`.
Felles skjema og testdata ligger i `shared/`.

## Konsekvenser

- Én `pubspec.lock` i rota: alle apper og pakker bruker samme versjoner.
- `flutter pub get` i rota løser alt. Krever Dart 3.6 eller nyere.
- Ingen Melos eller andre verktøy for monorepo foreløpig.
