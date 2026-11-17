---
status: godkjent
dato: 2026-11-17
---

# 0001. Flutter Web for administrator

## Kontekst

Administrator (typisk rektor) trenger en webapp: dagens oversikt, eskaleringer, manuell
tildeling, vikarregister, regler og vekter. Mobilappen skrives i Flutter.

## Beslutning

Admin bygges i Flutter Web (`apps/admin_web`), med samme tema, komponenter, modeller og
repositorier som mobilappen via `packages/`.

## Konsekvenser

- Én kodebase og ett språk for alle klienter. Endringer i modeller treffer begge apper.
- Flutter Web har tung første innlasting. Akseptabelt for admin på PC, men ikke for
  svarsiden fra SMS (se open-questions 6).
- Tabeller og tastaturnavigasjon må testes ekstra for universell utforming.
