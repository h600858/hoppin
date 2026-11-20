# Matchemotoren

Ren funksjon: harde filtre, poengfunksjon med delscorer og global tildeling
(min-kostnad maks-flyt). Ingen Firebase, ingen I/O, ingen `Date.now()`. Klokke,
kandidater, oppdrag, vekter og konfigurasjon sendes inn (regel 1 til 3). ESLint
stopper Firebase-imports og `node:*` i denne mappen. Se decisions/0008.

| Fil | Innhold | Steg |
|---|---|---|
| `types.ts` | `MatchingInput`, `MatchingResult`, `ALGORITHM_VERSION` | 3.1 |
| `config.ts` | sjekk av vekter og bølgetabell | 3.1 |
| `local_time.ts` | lokal dato, ukedag og klokkeslett fra UTC, ISO-uke | 3.1 |
| `urgency.ts` | hastegrad fra tid til start | 3.1 |
| `filters.ts` | de harde filtrene i fast rekkefølge | 3.2 |
| `score.ts` | poengfunksjonen | 3.3 |
| `flow.ts` | min-kostnad maks-flyt | 3.4 |
| `match.ts` | alt koblet sammen | 3.5 |
| `reasons.ts` | korte norske begrunnelser | 3.6 |

Testbyggere (`substitute()`, `shift()`, `candidate()` ...) ligger i
`src/testing/matching_builders.ts`. Hver lager et gyldig objekt som passerer alle
filtre, så en test bare skriver det den endrer.

Spesifikasjon: `docs/plan.md` kap. 7 og vedlegg B.
