---
status: godkjent
dato: 2026-11-17
---

# 0003. Emulator først, og Node 24

## Kontekst

Utviklingen skal ikke kreve et ekte Firebase-prosjekt eller `firebase login`, og
tester skal ikke tømme dataene i den emulatoren man utvikler mot.

## Beslutning

- All utvikling skjer mot Firebase Emulator Suite med prosjekt-ID `demo-innhopp`.
  ID-er som starter med `demo-` gjør at emulatorene aldri prøver å nå ekte
  Google-tjenester.
- Tester bruker `demo-innhopp-test`, så de har sine egne data.
- Appene bruker håndlagde `FirebaseOptions` for demo-prosjektet. Bytte til ekte
  prosjekt (steg 12) skjer med `flutterfire configure` og `--dart-define=INNHOPP_ENV=prod`.
- Node 24 lokalt og i functions (`"engines": { "node": "24" }`). Krever
  firebase-tools 15 eller nyere. Dette avviker fra opprinnelig plan (Node 22), som
  avvikles i Cloud Functions 30. april 2027.

## Konsekvenser

- Ingen kostnad og ingen risiko for ekte data under utvikling.
- Node 24 var forhåndsversjon (preview) i Cloud Functions da dette ble skrevet. Må
  sjekkes før produksjon (open-questions 9).
- Firestore-emulatoren krever Java (JDK 21).
