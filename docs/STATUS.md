# Status

Sist oppdatert: 2026-11-24

## Gjort

**Steg 1: Grunnmur og kontekst** er ferdig.

- **1.1 Workspace:** Dart pub workspace med `apps/mobile` (Android, iOS),
  `apps/admin_web` (web), `packages/domain` (ren Dart), `packages/data` og
  `packages/ui`. Én `pubspec.lock` i rota. `.gitattributes` med LF.
- **1.2 Kontekst:** CLAUDE.md, STATUS, open-questions, beslutningsnotat 0001 til 0005.
- **1.3 Functions:** TypeScript 6 (strict), ESLint 10 med regler som håndhever regel 1
  og 6, Vitest. Clock-provider i `src/domain/clock.ts`. `hello`-callable med ren
  handler og tynn `onCall` i `index.ts`, region europe-north1.
- **1.4 Firebase:** `firebase.json` og `.firebaserc` (`demo-innhopp`), emulatorer for
  Auth, Firestore, Functions og Hosting. `firestore.rules` nekter alt, med regeltester
  mot `demo-innhopp-test`. Vitest-prosjektene `unit` og `emulator`.
- **1.5 Oppkobling:** `InnhoppBackend` i `packages/data` kobler til emulatorene
  (10.0.2.2 på Android, 127.0.0.1 ellers). `HelloService` i domain, Firebase-
  implementasjon i data, `ConnectionCheckView` i ui. Begge appene viser svaret fra
  `hello`. Widget-tester med falsk service.
- **1.6 CI og mapper:** GitHub Actions med tre jobber (Flutter, functions, regler).
  README i mapper som fylles senere. Repo: github.com/h600858/hoppin.

**Steg 2: Datamodell** er ferdig på TypeScript-siden.

- **2.1:** decisions/0006 (feltnavn, tid, struktur) og 0007 (statusmaskin for tilbud).
- **2.2:** statusmaskiner for oppdrag og tilbud i TypeScript og Dart, testet mot
  `shared/fixtures/state-machines/`.
- **2.3 og 2.5:** JSON Schema for alle 14 samlinger og `callables.json`.
  TypeScript-typer genereres med `npm run gen:types`, og `validate` og
  `validateCallable` sjekker data mot skjemaene med ajv.
- **2.4 og 2.5:** Dart-modeller for alle 14 samlinger i `packages/domain`, med
  `FieldReader` som sjekker de samme reglene som skjemaene. **Ikke verifisert
  ennå:** Dart-delen er skrevet uten tilgang til Dart og ligger ukommittet. Kjør
  `dart format`, `dart test` og `flutter analyze` før commit.
- **2.6:** seed for Bjørkelia skole (`npm run seed`), data i
  `shared/fixtures/bjorkelia/`, validert og sjekket for sammenheng i testene.

**Steg 3: Matchemotoren** er ferdig (decisions/0008), i `functions/src/matching/`:

- **3.1:** typer, sjekk av konfigurasjonen, lokal tid med sommertid, hastegrad.
  Nytt skjema `substituteStats`, og `formalCompetence` og
  `maxOpenOffersPerSubstitute` i `schoolConfigs.filters`.
- **3.2:** ni harde filtre i fast rekkefølge, med `open_offer` som nytt filter.
- **3.3:** poengfunksjonen med sju ledd og bonus for nye vikarer.
- **3.4:** egen min-kostnad maks-flyt, testet mot brute force.
- **3.5:** `match()` med forrang for akutte oppdrag og deterministiske
  uavgjort-regler, `canonicalInput()` for input-hashen. Beviset: seks klasser mot
  tjue kandidater, høyere totalscore enn grådig og ingen dobbelt spurt.
- **3.6:** korte norske begrunnelser til vikaren og til skolen, uten fritekst fra
  input (regel 11).

## Neste steg

**Steg 4:** `runMatching`, `claimShift`, `undoClaim`, `declineOffer` og
Firestore-reglene. Inkluderer `transitionShift`, lagring i `decisions` med SHA-256
av `canonicalInput()`, og validering av callable-input med `validateCallable`.

## Kjente problemer

- Flutter 3.29.3 / Dart 3.7.2 lokalt og i CI. `flutter upgrade` er ikke gjort. Når den
  gjøres: oppdater `sdk` i alle pubspec-filene og `flutter-version` i CI.
- Appene viser bare en midlertidig tilkoblingsskjerm. Tittelen er fortsatt «Hoppin».
- Nærhet i poengfunksjonen bruker 20 minutter reisetid for alle til vi har data.
- Vitest varsler om ESM-syntaks i `vitest.config.ts` i en CommonJS-pakke. Det er
  bare en advarsel, men kan ryddes ved å gi filen navnet `vitest.config.mts`.
- Node 24 er preview i Cloud Functions (se decisions/0003 og open-questions 9).
- Ingen deploy-oppsett ennå. Kommer i steg 12.
- `npm install` på Windows kan skrive en ufullstendig `functions/package-lock.json`
  (valgfrie plattformpakker mangler). Da feiler `npm ci` i CI med «Missing: ... from
  lock file». Løsning: fyll inn låsefilen på Linux med
  `npm install --package-lock-only` og commit den.
