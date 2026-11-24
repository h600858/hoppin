# Testdata

JSON som brukes av både Dart- og TypeScript-testene. All data er fiktiv.

- `state-machines/`: lovlige overganger for oppdrag og tilbud.
- `models/<modell>.json`: gyldige og ugyldige eksempler per samling, med `why` som
  forklarer hvorfor et eksempel er ugyldig.
- `callables/callables.json`: gyldige og ugyldige eksempler for hver forespørsel og
  respons i `shared/schema/callables.json`.
- `bjorkelia/`: seed-dataene for Bjørkelia skole, én fil per samling (se
  `scripts/seed/`).
- Matchetilfellene i steg 3 bygges i kode med byggerne i
  `functions/src/testing/matching_builders.ts`, og bruker Bjørkelia-dataene herfra.
