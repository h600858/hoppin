# Seed

Skriver den fiktive skolen «Bjørkelia skole» i «Fjellvik kommune» til
Firestore-emulatoren (`demo-innhopp`). Kjøres fra `functions/`:

```powershell
npm run seed                 # skriv seed-dataene
npm run seed -- --reset      # tøm emulatoren først
npm run seed -- --dry-run    # bare valider, skriv ingenting
```

- Dataene ligger i `shared/fixtures/bjorkelia/`, én fil per samling, som
  `[{ "id": ..., "data": ... }]`. Testene i functions bruker de samme filene.
- Alt valideres mot `shared/schema/` før noe skrives. Ett ugyldig dokument stopper
  hele seedingen.
- Scriptet nekter å kjøre mot prosjekt-ID-er som ikke starter med `demo-`.
- Tidspunkt (ISO med `Z`) skrives som Firestore `Timestamp`.
- Scriptet låner `firebase-admin` og validatoren fra `functions/`, så det trenger
  ingen egen `package.json`.

Innhold: 16 ansatte (rektor og inspektør som admin, sju kontaktlærere for 1A til
7A, to faglærere, tre assistenter, to på SFO), 215 timeplanoppføringer for en uke,
og 25 vikarer. Blant vikarene finnes bevisst en med utløpt politiattest, en uten
politiattest, to på pause, en som har sluttet og en med klassesperre, så
matchemotoren har noe å teste filtrene mot. Alle navn er oppdiktet, telefonnumrene
starter med +47 0 og finnes ikke, og e-post bruker example.com.
