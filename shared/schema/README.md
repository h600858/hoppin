# Skjema (sannhetskilde)

JSON Schema 2020-12 for hver Firestore-samling, pluss `common.schema.json` med felles
byggeklosser (ID, tid, trinn, fag, statuser). Se decisions/0006.

| Fil | Type | Samling |
|---|---|---|
| `school.schema.json` | School | schools |
| `schoolConfig.schema.json` | SchoolConfig | schoolConfigs |
| `staff.schema.json` | Staff | staff |
| `substitute.schema.json` | Substitute | substitutes |
| `timetableEntry.schema.json` | TimetableEntry | timetable |
| `absence.schema.json` | Absence | absences |
| `shift.schema.json` | Shift | shifts |
| `offer.schema.json` | Offer | offers |

Etter en endring: kjør `npm run gen:types` i `functions/` og commit de genererte
filene. CI feiler hvis de ikke er oppdatert. Hver modell har gyldige og ugyldige
eksempler i `shared/fixtures/models/`.

Regler når du skriver skjema:
- Ingen nøkler ved siden av `$ref` (ikke `description` heller). Da lager generatoren
  duplikattyper som `DocumentId1`. Forklaringer legges på felt med `anyOf`, eller i
  skjemaets `description`.
- Felt som kan være tomme skrives som `anyOf` med `{ "type": "null" }`, og er likevel
  påkrevd.
- `title` på et underobjekt gir en navngitt TypeScript-type (for eksempel `WaveRule`).
- `additionalProperties: false` overalt.
- Regler på tvers av felt (slutt etter start, vekter som summerer til 1) kan ikke
  uttrykkes her og sjekkes i kode.
