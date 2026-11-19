# Innhopp

Les denne filen først i hver økt. Deretter `docs/STATUS.md` og `docs/open-questions.md`.

## Produktet

Innhopp (innhopp.no) fyller vikarbehov i norsk grunnskole automatisk. En lærer eller
assistent melder fravær i mobilappen. Systemet bryter fraværet ned til oppdrag via
timeplanen, finner de best egnede vikarene, sender forespørsler i bølger (push først,
SMS som reserve), og den første som sier ja får oppdraget. Svarer ingen innen fristen,
eskaleres oppdraget til en person på skolen med en rangert kandidatliste og begrunnelse.

Brukere: vikar (mobil), lærer/assistent (mobil), administrator/rektor (web), og vikar
uten app som svarer via kort lenke i SMS uten innlogging.

Hele planen: `docs/plan.md` (heter «Vikarmotor», gammel arbeidstittel; `vkr.no` i
eksemplene betyr `innhopp.no`). Viktigst: kap. 4 MVP, 5 arkitektur, 6 datamodell,
7 matchemotor, 8 varsling, 10 personvern. Design: `docs/design/design-system.md`,
skisser i `docs/design/*.png`, mockups i `docs/design/mockups/*.html` (visuell
referanse, ikke kode som skal oversettes).

## Arbeidsmåte (viktig)

- **Eieren skriver koden selv.** Forklar, foreslå og svar på spørsmål. Endre filer bare
  når du blir eksplisitt bedt om det i økten.
- Plan først, vent på godkjenning før kode. Små steg som kan committes hver for seg.
- Tester først på kjernelogikk: matchemotor, statusmaskin, transaksjoner.
- Eieren kan JavaScript godt og Flutter noe: forklar Flutter- og Firebase-valg grundig.
- Avslutt hvert steg med å oppdatere `docs/STATUS.md` og `docs/open-questions.md`.
- Nye beslutninger skrives som korte notater i `docs/decisions/`.

## Arkitekturregler som aldri brytes

1. Matchemotoren er en ren funksjon i `functions/src/matching/`: ingen Firebase, ingen
   I/O, ingen `Date.now()`. Klokke, kandidater, oppdrag, vekter og konfigurasjon sendes
   inn. Den finnes bare i TypeScript (se decisions/0002).
2. Rangeringen er deterministisk og forklarbar: harde filtre, deretter en poengfunksjon
   med delscorer per komponent. En språkmodell rangerer aldri.
3. Tildelingen er global: alle åpne oppdrag løses samlet (min-kostnad maks-flyt), så
   hver kandidat får høyst én forespørsel per bølge.
4. Status på oppdrag endres bare i Cloud Functions, via én hjelper (`transitionShift`)
   som avviser ulovlige overganger og logger en hendelse. Firestore-reglene nekter
   klienten å skrive status, tilbud, beslutninger, tildelinger og hendelser.
5. Først til mølla avgjøres i en Firestore-transaksjon med tjenerens klokke.
6. All klokkebruk i functions går via én clock-provider, så tiden kan spoles i emulatoren.
7. All SMS går via `SmsGateway`, all push via `PushGateway`. Utenom prod kan SMS bare
   nå numre på en hviteliste.
8. Hver matchekjøring lagres i `decisions` med inndata-hash, algoritmeversjon,
   vektversjon, kandidater med delscorer og utelukkelsesgrunn, og hvem som ble valgt.
9. Vekter, filtre, bølgetabell, stilletid og frister er konfigurasjon per skole, aldri
   hardkodet. Standardverdiene er midlertidige til regelboken er kartlagt.
10. Politiattest er et hardt filter som aldri kan slås av (overstyrer plan 7.2).
11. Utgående meldinger inneholder aldri fraværsgrunn, helseopplysninger, navnet på den
    som er borte eller elevdata.
12. Flerleietaker fra dag én: tenant (kommune) > school > resten.
13. Universell utforming (WCAG): kontrast minst 4.5:1, berøringsmål minst 44x44,
    `Semantics` på ikonknapper, status med både farge og tekst, tåler 200 % tekst.
14. Ingen nye pakker uten at eieren har godkjent dem (se Pakker under).

## Domenet i korte trekk

Samlinger (decisions/0006): tenants, schools, schoolConfigs, staff, substitutes,
timetable, absences, shifts, offers, assignments, availability, decisions, escalations.
Hendelser i `shifts/{id}/events`. Engelske feltnavn, norske verdier. Tidspunkt i UTC,
klokkeslett `"HH:mm"` lokal tid, dato `"YYYY-MM-DD"` (se 0006).

Ordliste: vikar = substitute, oppdrag = shift, forespørsel = offer, fravær = absence,
tildeling = assignment, ansatt = staff, kommune = tenant, politiattest =
policeCertificate, fag = subject, trinn = grade, klasse = className, bølge = wave,
stilletid = quietHours, hastegrad = urgency, eskalering = escalation.

Statusmaskin for shifts:
```
pending -> offering -> claimed -> confirmed -> completed
claimed -> offering (angring innen 60 sek) | cancelled (vikar trekker seg)
offering -> escalated -> manually_assigned | unfilled
pending/offering -> withdrawn (læreren melder seg frisk)
```

Statusmaskin for offers (decisions/0007):
```
queued -> sent | withdrawn
sent -> accepted | declined | expired | superseded | withdrawn
accepted -> undone (angret, spørres ikke igjen)
```

Bølgetabell (standard, redigerbar per skole):

| Hastegrad | Tid til start | Bølge | Intervall | Frist |
|---|---|---|---|---|
| Rolig | over 16 t | 3 | 20 min | 60 min |
| Normal | 2 til 16 t | 3 | 10 min | 30 min |
| Akutt | 45 min til 2 t | 6 | 5 min | 15 min |
| Kritisk | under 45 min | alle kvalifiserte | én utsending | 10 min |

Stilletid 21:00 til 06:30: tildeling regnes ut, utsending venter til 06:30.

Standardvekter (sum 1): fagkompetanse 0.25, klassekjennskap 0.20, sannsynlighet for ja
0.15, pålitelighet 0.15, rettferdig fordeling 0.15, preferansetreff 0.07, nærhet 0.03.
Detaljer i plan 7.3 og vedlegg B.

Callables (sannhetskilde: `shared/schema/callables.json`):
```
claimShift({offerId, idempotencyKey})
  -> {ok: true, undoUntil} | {ok: false, reason: "allerede_tatt" | "utloept" | "ikke_din"}
undoClaim({offerId}) -> {ok: boolean}
declineOffer({offerId, reason: "kan_ikke" | "utilgjengelig_hele_dagen"}) -> {ok: true}
withdrawAbsence({absenceId}) -> {ok: true}
```

## Konvensjoner

- Norsk i dokumentasjon og brukergrensesnitt. Kode, variabelnavn og commit-meldinger på
  engelsk. Domeneverdier (fag, trinn, rolle) er norske: `"matematikk"`, `"laerer"`.
- Commit-meldinger: `type: kort beskrivelse` (feat, fix, chore, docs, test, refactor).
- Tester ligger ved siden av koden i TypeScript (`x.ts` + `x.test.ts`), i `test/` i Dart.
- `packages/domain` er ren Dart: ingen Flutter, ingen Firebase.
- Ingen hardkodede farger i widgets: alt fra temaet i `packages/ui`.
- State: Cubit som standard, Bloc bare der hendelsesstrømmen trengs.
  Avhengigheter via `RepositoryProvider`.

## Hvor ting ligger

```
apps/mobile/        Flutter iOS + Android (én app, rollen styrer visningen)
apps/admin_web/     Flutter Web for administrator
packages/domain/    ren Dart: modeller, enums, statusmaskin
packages/data/      Firestore-repositorier, Firebase-oppkobling
packages/ui/        tema (tokens fra design-system.md) og felles widgets
functions/          Cloud Functions, TypeScript
  src/matching/     matchemotoren
  src/domain/       statusmaskin, clock-provider
  src/dispatch/     bølger og utsending
  src/ai/           tom, senere
shared/schema/      JSON-skjema for datamodell og callables (sannhetskilde)
shared/fixtures/    testdata som JSON for både Dart og TypeScript
scripts/seed/       fiktiv skole «Bjørkelia skole»
docs/               plan, design, decisions, STATUS, open-questions
```

## Miljø og kommandoer

Windows, PowerShell, VS Code. Node 24. Firebase Emulator Suite med prosjekt-ID
`demo-innhopp` (tester bruker `demo-innhopp-test`). Ingen `firebase login` trengs.
Region `europe-north1`.

```powershell
flutter pub get                 # i rota, løser hele workspacet
flutter analyze                 # i rota (functions/ er utelatt i analysis_options.yaml)
dart format apps packages       # CI feiler på uformatert kode
cd packages/domain; dart test   # ren Dart
flutter test                    # i de andre pakkene og appene
cd apps/admin_web; flutter run -d chrome
cd apps/mobile; flutter run     # krever startet Android-emulator

cd functions
npm run emulators               # bygger og starter alle emulatorene (demo-innhopp)
npm run build:watch             # egen terminal: emulatoren laster ny kode automatisk
npm test                        # enhetstester, uten emulator
npm run test:emulator           # regeltester mot kjørende emulator (demo-innhopp-test)
npm run typecheck; npm run lint
npm run gen:types               # etter endring i shared/schema, commit src/generated
npm run seed                    # Bjørkelia skole til emulatoren (-- --reset tømmer først)
```

Emulator UI: http://127.0.0.1:4000. CI: `.github/workflows/ci.yml` (Flutter 3.29.3,
Node 24, JDK 21). Oppgraderes Flutter lokalt, må versjonen i CI endres samtidig.

## Pakker

Godkjent, Dart: flutter_bloc, go_router, bloc_test, mocktail, flutter_lints, lints,
test, firebase_core, firebase_auth, cloud_firestore, cloud_functions.
Godkjent, functions: firebase-functions, firebase-admin, typescript (~6.0, fordi
typescript-eslint ikke støtter 7), @types/node, eslint, @eslint/js, typescript-eslint,
vitest, @firebase/rules-unit-testing, firebase, firebase-tools, ajv, ajv-formats,
json-schema-to-typescript.
Dart-modeller skrives for hånd, ingen json_serializable (decisions/0006).
