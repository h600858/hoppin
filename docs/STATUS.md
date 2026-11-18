# Status

Sist oppdatert: 2026-11-17

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

## Neste steg

**Steg 2: Datamodell.** JSON Schema i `shared/schema/`, Dart-modeller i
`packages/domain`, TypeScript-typer i functions, statusmaskin for shifts i begge
språk, felles testdata i `shared/fixtures/`, og seed for Bjørkelia skole.

## Kjente problemer

- Flutter 3.29.3 / Dart 3.7.2 lokalt og i CI. `flutter upgrade` er ikke gjort. Når den
  gjøres: oppdater `sdk` i alle pubspec-filene og `flutter-version` i CI.
- Appene viser bare en midlertidig tilkoblingsskjerm. Tittelen er fortsatt «Hoppin».
- Node 24 er preview i Cloud Functions (se decisions/0003 og open-questions 9).
- Ingen deploy-oppsett ennå. Kommer i steg 12.
- `npm install` på Windows kan skrive en ufullstendig `functions/package-lock.json`
  (valgfrie plattformpakker mangler). Da feiler `npm ci` i CI med «Missing: ... from
  lock file». Løsning: fyll inn låsefilen på Linux med
  `npm install --package-lock-only` og commit den.
