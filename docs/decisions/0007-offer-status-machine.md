---
status: godkjent
dato: 2026-11-18
---

# 0007. Statusmaskin for tilbud

## Kontekst

Planen nevner flere statuser for tilbud (offers), men ingen statusmaskin
(open-questions 8). Statusen styrer hvem som kan spørres igjen og hva som logges.

## Beslutning

```
queued -> sent | withdrawn
sent -> accepted | declined | expired | superseded | withdrawn
accepted -> undone
```

- `queued`: laget, men venter på utsending (for eksempel stilletid).
- `sent`: sendt til vikaren.
- `accepted`: vikaren sa ja og fikk oppdraget.
- `declined`: vikaren sa nei.
- `expired`: fristen gikk ut uten svar.
- `superseded`: en annen tok oppdraget først.
- `withdrawn`: oppdraget ble trukket eller eskalert før vikaren svarte.
- `undone`: vikaren angret innen 60 sekunder. Endelig: vikaren spørres ikke igjen om
  samme oppdrag.

Tilbud endres bare i Cloud Functions, som oppdrag (regel 4).

## Konsekvenser

- Filteret «allerede spurt på dette oppdraget» gjelder alle statuser, også `undone`.
- `accepted` blir stående selv om oppdraget senere avlyses. Historikken bevares.
