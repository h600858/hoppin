# Status

Sist oppdatert: 2026-11-17

## Gjort

- **Steg 1.1:** Dart pub workspace i rota med `apps/mobile` (Android, iOS),
  `apps/admin_web` (web), `packages/domain` (ren Dart), `packages/data` og
  `packages/ui`. Én felles `pubspec.lock` i rota. `.gitattributes` med LF.
  Plan og design kopiert inn i `docs/`.
- **Steg 1.2:** CLAUDE.md, denne filen, `open-questions.md` og beslutningsnotat
  0001 til 0005.

## Neste steg

1. **1.3 Functions:** TypeScript, ESLint, Vitest, region europe-north1, clock-provider
   og én `hello`-callable med test som viser mønsteret.
2. **1.4 Firebase-oppsett:** `firebase.json`, `.firebaserc` for `demo-innhopp`, og
   `firestore.rules` som nekter alt, med regeltest mot `demo-innhopp-test`.
3. **1.5 Oppkobling:** begge appene kobler seg til emulatorene i debug og viser svaret
   fra `hello`.
4. **1.6 Tomme mapper og CI:** README i mapper som fylles senere, og GitHub Actions
   (Flutter analyze og test, functions lint og test, regeltest).

## Kjente problemer

- Flutter/Dart er fra våren 2025 (`sdk: ^3.7.2`). Kjør `flutter upgrade` før
  Firebase-pakkene legges inn, og oppdater `sdk` i alle pubspec-filene.
- Appene er fortsatt tellerappen fra `flutter create`.
- Repoet har ingen GitHub-remote ennå.
