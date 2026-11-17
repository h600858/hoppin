> **Merk:** Produktnavnet er nå **Innhopp** (innhopp.no). «Vikarmotor» i dette dokumentet er gammel arbeidstittel. Domenet `vkr.no` i eksempler og skisser erstattes med innhopp.no.

**VIKARMOTOR**

Automatisk tildeling av vikarer i grunnskolen

Teknisk arkitektur, kostnadsmodell og gjennomføringsplan

*Fra idé til pilot på ti til tjue timer i uken*

Utarbeidet for Eirik Aasen

Versjon 1.0 · 21. september 2026

**Innhold**

> 1\. Sammendrag og anbefaling
>
> 2\. Problemet, og hva systemet faktisk må løse
>
> 3\. Kartlegging før du koder
>
> 4\. Hva MVP-en skal være, og hva den ikke skal være
>
> 5\. Systemarkitektur
>
> 6\. Datamodell
>
> 7\. Matchemotoren
>
> 8\. Varslingslaget: hvordan meldingene faktisk går ut
>
> 9\. AI-laget: hva agenten faktisk gjør
>
> 10\. Personvern, jus og innkjøpskrav
>
> 11\. Kostnader
>
> 12\. Utviklingsmiljø og arbeidsflyt
>
> 13\. Gjennomføringsplan uke for uke
>
> 14\. Pilot og salg mot offentlig sektor
>
> 15\. Risikoer og hvordan du møter dem
>
> 16\. De neste sju dagene
>
> Vedlegg A: Intervjuguide til mor
>
> Vedlegg B: Poengfunksjonen i pseudokode
>
> Vedlegg C: Kilder

**1. Sammendrag og anbefaling**

Dette dokumentet beskriver hvordan du bygger et system som automatisk fyller vikarbehov i grunnskolen: fra en lærer melder fravær, til et oppdrag er bekreftet av en vikar eller eskalert til et menneske med en ferdig prioritert liste.

**1.1 De fem viktigste konklusjonene**

1.  **Ikke la en språkmodell rangere kandidatene.** Rangeringen skal være en deterministisk poengfunksjon du kan teste, forklare og reprodusere. AI brukes til det den er god på: tolke fritekst, skrive meldinger, oppsummere for mennesket og foreslå justeringer av vektene. Dette er både et kvalitetsvalg og et juridisk valg, siden systemet fordeler arbeid til enkeltpersoner.

2.  **Problemet med «samme fem lærere» er et tildelingsproblem, ikke et sorteringsproblem.** Rangerer du hver ledige stilling for seg, får du naturlig nok samme topp fem overalt. Løsningen er å samle alle åpne oppdrag i en batch og løse dem samlet med en tildelingsalgoritme, slik at forespørslene blir disjunkte. Dette er den tekniske kjernen i produktet, og den beskrives i kapittel 7.

3.  **Push først, SMS som fallback.** Push via Firebase Cloud Messaging er gratis. SMS koster rundt 0,50 til 0,90 kroner per melding. Med push som primærkanal og SMS etter 90 til 120 sekunder uten åpning faller meldingskostnaden med 50 til 70 prosent uten at responstiden svekkes målbart.

4.  **Driftskostnaden er ubetydelig. Tiden din er kostnaden.** Marginal driftskostnad per skole ligger på 900 til 1 600 kroner i året, hvorav nesten alt er SMS. Den aller første skolen koster rundt 6 500 kroner fordi de faste abonnementene ikke er fordelt på noen ennå. AI-kostnaden er i størrelsesorden 10 til 30 kroner per skole per år. Du kan derfor kjøre en gratis pilot i ett år uten at det svir.

5.  **Innslagspunktet for offentlige anskaffelser ble hevet til 500 000 kroner 1. juli 2026.** En kommune kan kjøpe direkte under dette beløpet uten konkurranse. Det gir deg stort handlingsrom for pilot og første salg, og det bør styre prisingen din de første to årene.

**1.2 Anbefalt teknologivalg**

| **Lag**                   | **Valg**                                                        | **Begrunnelse**                                                                                                                                                     |
|---------------------------|-----------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Mobilapp (vikar og lærer) | Flutter                                                         | Du kan det allerede. Én kodebase for iOS og Android. Push og dyplenker er godt støttet.                                                                             |
| Webapp (administrasjon)   | Flutter Web eller Next.js                                       | Flutter Web hvis du vil dele domenelogikk og komme raskt i gang. Next.js hvis administrasjonsflaten blir tung på tabeller og rapporter, som den sannsynligvis blir. |
| Backend                   | Firebase: Firestore, Auth, Cloud Functions, FCM                 | Du kjenner stacken. Transaksjoner i Firestore løser først til mølla rent. Cloud Scheduler gir tidsstyrte bølger.                                                    |
| Region                    | europe-north1 (Finland) eller europe-west4                      | Data innenfor EU og EØS. Nærmeste region gir lavest forsinkelse mot Norge.                                                                                          |
| Meldinger                 | FCM push som primær, Sveve eller LINK Mobility som SMS-fallback | Norsk leverandør gir norsk avsendernavn, norsk støtte og enklere databehandleravtale.                                                                               |
| AI-lag                    | Claude Haiku via API, kalt fra Cloud Functions                  | Billigst per kall, raskt nok for sanntid, og API-nøkkelen ligger aldri i klienten.                                                                                  |
| Utviklingsmiljø           | Cursor som daglig IDE, Claude Code i terminalen ved siden av    | Begrunnet i kapittel 12.                                                                                                                                            |

**1.3 Tidslinje i grove trekk**

Planen forutsetter 10 til 20 timer i uken ved siden av jobb. Kapittel 13 bryter dette ned uke for uke.

| **Fase**                 | **Varighet**  | **Resultat**                                                                                               |
|--------------------------|---------------|------------------------------------------------------------------------------------------------------------|
| Fase 0: Kartlegging      | Uke 1 til 2   | Du forstår dagens prosess i detalj, har tall på tidsbruk, og har en skriftlig regelbok fra skolen.         |
| Fase 1: Kjerne uten AI   | Uke 3 til 8   | Fravær inn, regelbasert matching, push og SMS ut, først til mølla, eskalering. Kjørbart fra ende til ende. |
| Fase 2: Skyggedrift      | Uke 9 til 12  | Systemet kjører parallelt med dagens prosess på mors skole uten å sende noe. Du måler treffsikkerhet.      |
| Fase 3: Pilot i drift    | Uke 13 til 20 | Én skole bruker systemet på ekte. Du måler tid spart og fylningsgrad.                                      |
| Fase 4: Læring og AI-lag | Uke 21 til 30 | Vektjustering basert på faktiske data, AI-assistert konfigurasjon, full admin-flate.                       |
| Fase 5: Skalering        | Fra måned 8   | Flerskole, flerkommune, databehandleravtale, salg til skole to til ti.                                     |

**2. Problemet, og hva systemet faktisk må løse**

**2.1 Prosessen slik den er i dag**

Slik du beskriver den, og slik den ser ut på de fleste norske grunnskoler:

1.  En ansatt melder fravær kvelden før, eller mellom klokken 06 og 08 samme morgen.

2.  En person (rektor, inspektør, avdelingsleder eller merkantil) mottar meldingen.

3.  Denne personen vurderer hvilke timer som faktisk må dekkes, hvilke som kan slås sammen, og hvilken kompetanse som trengs.

4.  Vedkommende ringer vikarer i en rekkefølge som stort sett ligger i hodet, ikke i et system.

5.  Ringerunden fortsetter til noen sier ja, eller til tiden er ute og skolen løser det internt med delte klasser, sammenslåing eller ledige ressurser.

6.  Resultatet skrives inn i timeplanen eller en liste, og informasjon går ut til de berørte.

Det som koster mest er ikke selve beslutningen. Det er **avbruddene, ringerunden og tidspresset** mellom 06:30 og 08:15, ofte samtidig med at personen skal gjøre ti andre ting.

**2.2 Hva som må være sant for at systemet skal være verdt noe**

Et system som bare flytter ringerunden inn i en app er verdiløst. Systemet må vinne på minst tre av disse fire punktene:

- **Tidsbruk.** Personen som i dag bruker 30 til 90 minutter en typisk morgen skal ned til under 10 minutter, og på de fleste dager til null.

- **Fylningsgrad.** Andelen fravær som faktisk blir dekket av vikar skal opp, ikke ned. Dette er den viktigste målingen, fordi alternativet til vikar er delte klasser.

- **Treffsikkerhet.** Vikaren som kommer skal passe bedre til klassen og faget enn den som tilfeldigvis svarte telefonen. Her kan du slå mennesket over tid, fordi systemet husker alt.

- **Rettferdighet.** Oppdragene skal fordeles jevnere blant vikarene. Det er en fordel for vikarene (mer forutsigbar inntekt) og for skolen (flere vikarer som kjenner huset).

> **Første oppgave:** Før du skriver en linje kode må du ha tall på punkt 1 og 2 fra mors skole slik det er i dag. Uten et utgangspunkt kan du aldri dokumentere at systemet virker, og uten dokumentasjon kan du ikke selge det. Vedlegg A er en ferdig intervjuguide.

**2.3 Målbare suksesskriterier for MVP**

| **Mål**                             | **Måling**                                                       | **Terskel for at piloten er en suksess**                            |
|-------------------------------------|------------------------------------------------------------------|---------------------------------------------------------------------|
| Tid brukt på vikarinnkalling        | Minutter per skoledag, loggført manuelt før og etter             | Ned minst 70 prosent                                                |
| Andel oppdrag dekket automatisk     | Oppdrag bekreftet uten menneskelig inngripen, delt på totalt     | Over 60 prosent i pilot, mål 80 prosent                             |
| Tid fra melding til bekreftet vikar | Median i minutter                                                | Under 25 minutter for kveldsmeldinger, under 20 for morgenmeldinger |
| Fylningsgrad                        | Dekte oppdrag delt på totale oppdrag                             | Minst like høyt som før, helst høyere                               |
| Fordeling                           | Andel oppdrag som går til de fem mest brukte vikarene            | Ned fra dagens nivå                                                 |
| Falske utsendelser                  | Forespørsler sendt på oppdrag som ikke eksisterte eller var feil | Under 2 prosent                                                     |

**2.4 Konkurransebildet**

Det finnes allerede aktører i dette markedet i Norge. Du må kjenne dem, men de er ikke en grunn til å la være.

| **Aktør**               | **Hva de gjør**                                                                                                             | **Hva du kan gjøre bedre**                                                                                                      |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Lærervikaren.no         | Vikarhåndtering med kalender, pluss over 2 200 ferdige undervisningsopplegg og quiz. Abonnement med 30 dagers prøveperiode. | De løser innholdet i vikartimen. Du løser selve innkallingen. Ulike problemer, og deres tyngdepunkt ligger på læringsressurser. |
| Vikarsystemet.no        | Vikaradministrasjon med egen app for vikarer.                                                                               | Undersøk om de har reell automatisk matching eller bare en digital liste. De fleste slike systemer er registre, ikke motorer.   |
| Visma Flyt Skole og IST | Store skoleadministrative systemer med fraværsmodul, men uten intelligent vikarmatching.                                    | De er trege, dyre og selger til kommuner i store anskaffelser. Du kan være det lille tillegget som kobler seg på.               |
| Regneark og telefon     | Dagens løsning på de fleste skoler.                                                                                         | Dette er den reelle konkurrenten. Lav terskel å slå på kvalitet, høy terskel å slå på tillit.                                   |

> **Strategisk råd:** Ikke bygg et skoleadministrativt system. Bygg en motor som gjør én ting ekstremt godt, og som kan hente timeplan- og persondata fra det skolen allerede har. Integrasjon mot Visma Flyt Skole eller Feide blir da et salgsargument, ikke en konkurrent.

**3. Kartlegging før du koder**

Dette er de to ukene som avgjør om prosjektet blir noe. Du har en fordel nesten ingen andre i dette markedet har: direkte tilgang til en rektor som kan svare på alt. Bruk det systematisk, ikke som løpende småprat.

**3.1 Tre møter med mor**

| **Møte**                   | **Varighet** | **Mål**                                                                                                                                                                                                            |
|----------------------------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Møte 1: Prosesskartlegging | 90 minutter  | Få hele dagens flyt beskrevet steg for steg, inkludert alle unntakene. Ta opptak hvis hun tillater det. Tegn flyten mens hun snakker og få den bekreftet.                                                          |
| Møte 2: Regelboken         | 60 minutter  | Hvilke regler styrer hvem som kan ta hvilket oppdrag? Kompetansekrav, politiattest, klasser med særskilte behov, vikarer skolen helst ikke bruker, maksgrenser per uke. Dette blir de harde filtrene i kapittel 7. |
| Møte 3: Prioriteringene    | 60 minutter  | Gi henne ti fiktive situasjoner med tre kandidater hver, og be henne velge og begrunne. Dette er hvordan du kalibrerer vektene i poengfunksjonen. Skriv ned begrunnelsene ordrett.                                 |

> **Viktigst av alt:** Be om å få se rådataene: vikarlisten slik den ligger i dag, timeplanen, og helst fraværslogg for et helt skoleår. Anonymiser navnene selv med en gang. Uten historiske data kan du hverken teste algoritmen eller vise fram en gevinst.

**3.2 Data du trenger fra skolen**

| **Datasett**                     | **Hvorfor**                                   | **Format du kan leve med**                                                  |
|----------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------|
| Vikarliste med kompetanse        | Grunnlag for matching                         | Regneark. Navn, telefon, utdanning, fag, trinn, erfaring, politiattest-dato |
| Timeplan per klasse              | Vite hvilke timer et fravær faktisk rammer    | Eksport fra timeplansystemet, eventuelt CSV                                 |
| Fraværshistorikk 12 måneder      | Simulering, volumtall og realistiske testdata | Regneark med dato, rolle, klasse, om det ble dekket, av hvem                |
| Oversikt over hvem som ble brukt | Måle skjevfordeling i dag                     | Kan ofte utledes fra timelister eller lønnsgrunnlag                         |
| Skolens interne regler           | Harde filtre                                  | Fritekst, du strukturerer det selv                                          |

**3.3 To ting du bør avklare tidlig**

- **Hvem eier beslutningen om å ta i bruk systemet?** På de fleste skoler er ikke rektor alene om dette. Kommunen har ofte en skolefaglig ansvarlig, en IT-avdeling og et personvernombud som må si ja. Kartlegg denne kjeden nå, ikke når du står med et ferdig produkt.

- **Er vikarene ansatte eller innleid fra byrå?** Hvis skolen bruker vikarbyrå, endres hele flyten: du sender forespørsel til byrået, ikke til personen. Dette bør være utenfor MVP, men du må vite hvor stor andel det gjelder.

**4. Hva MVP-en skal være, og hva den ikke skal være**

Den vanligste måten å drepe et sideprosjekt på er å bygge for bredt. Her er en hard avgrensning du bør holde deg til.

**4.1 Med i MVP**

- Lærer eller assistent melder fravær fra mobilappen, med dato, tidsrom og en valgfri fritekstkommentar.

- Administrator kan også opprette et behov manuelt, for eksempel ved kurs, permisjon eller en ubesatt stilling.

- Systemet bryter fraværet ned til ett eller flere oppdrag basert på timeplanen.

- Deterministisk matchemotor som filtrerer, scorer og fordeler kandidater på tvers av alle åpne oppdrag.

- Utsending i bølger: push først, SMS etter en kort forsinkelse hvis ingen åpning.

- Først til mølla, med transaksjonssikker låsing slik at to vikarer aldri får samme oppdrag.

- Automatisk eskalering til en navngitt person når fristen går ut, med en rangert liste og en kort begrunnelse per kandidat.

- Vikarapp: se forespørsler, takke ja eller nei med ett trykk, se egne kommende oppdrag, sette seg utilgjengelig i et tidsrom.

- Webapp for administrator: oversikt over dagen, manuell overstyring når som helst, redigere vikarregister, justere vekter og frister.

- Full revisjonslogg over alle beslutninger, med scoren og begrunnelsen lagret.

**4.2 Bevisst utenfor MVP**

| **Funksjon**                                   | **Hvorfor vente**                                                               | **Når**                           |
|------------------------------------------------|---------------------------------------------------------------------------------|-----------------------------------|
| Lønnsgrunnlag og timeregistrering              | Tett kobling mot kommunens lønnssystem. Stor kompleksitet, lav læring tidlig.   | Etter to til tre betalende skoler |
| Automatisk synk mot Visma Flyt Skole eller IST | Krever avtale og API-tilgang du ikke får som ukjent aktør.                      | Når du har referanser             |
| Feide-innlogging                               | Fin å ha, men krever søknad og godkjenning.                                     | Før første kommunesalg            |
| Undervisningsopplegg for vikaren               | Der konkurrerer du direkte med Lærervikaren. Ikke gå i den skyttergraven først. | Kanskje aldri                     |
| Vikarbyrå-integrasjon                          | Annen forretningsmodell og andre brukere.                                       | Fase 2 av produktet               |
| Avansert statistikk og rapportuttak            | Selges godt, men brukes lite tidlig.                                            | Når kommunen spør, og det gjør de |

**4.3 Den ene regelen for avgrensning**

> **Regel:** Hvis en funksjon ikke bidrar direkte til at oppdraget blir fylt raskere, bedre eller med mindre menneskelig innsats, skal den ikke inn i MVP. Skriv regelen på en lapp og heng den over skjermen.

**5. Systemarkitektur**

**5.1 Overordnet bilde**

Systemet består av fire klienter, ett datalag og en hendelsesdrevet kjerne av bakgrunnsfunksjoner. Kjernen er det eneste som tar beslutninger. Klientene leser og skriver data, men beregner aldri hvem som skal få et oppdrag.

> MOBILAPP (Flutter) WEBAPP (admin)
>
> +------------------+ +------------------+
>
> \| Lærer: meld \| \| Dagens oversikt \|
>
> \| fravær \| \| Overstyring \|
>
> \| Vikar: ja / nei \| \| Vikarregister \|
>
> \| Mine oppdrag \| \| Regler og vekter \|
>
> +--------+---------+ +--------+---------+
>
> \| \|
>
> +--------------+----------------+
>
> v
>
> +-----------------------------+
>
> \| Firebase Auth + Firestore \|
>
> \| (europe-north1) \|
>
> +--------------+--------------+
>
> \| onWrite-triggere
>
> v
>
> +------------------------------------------------+
>
> \| KJERNEN (Cloud Functions) \|
>
> \| \|
>
> \| 1. Behovsbygger fravær -\> oppdrag \|
>
> \| 2. Matchemotor filtre + score + tildeling \|
>
> \| 3. Bølgeplanlegger hvem, når, hvilken kanal \|
>
> \| 4. Utsender FCM push -\> SMS-fallback \|
>
> \| 5. Svarmottaker transaksjon, først til \|
>
> \| mølla, låsing \|
>
> \| 6. Eskalering frist ute -\> menneske \|
>
> \| 7. Læring nattlig, oppdaterer vekter \|
>
> +-------+--------------------------+-------------+
>
> \| \|
>
> v v
>
> +---------------+ +----------------------+
>
> \| SMS-gateway \| \| Claude API (Haiku) \|
>
> \| Sveve / LINK \| \| tolking, tekst, \|
>
> \| \| \| oppsummering \|
>
> +---------------+ +----------------------+
>
> ^
>
> Cloud Scheduler: bølgetikk hvert minutt,
>
> morgenbatch 06:45, nattlig læringsjobb 02:00

**5.2 Hendelsesflyten, steg for steg**

1.  **Fravær registreres.** Et dokument skrives til \`absences\`. En Firestore-trigger vekker behovsbyggeren.

2.  **Behovsbygger.** Slår opp timeplanen for den ansatte i det aktuelle tidsrommet og produserer ett eller flere \`shifts\`, med fag, trinn, klasse, rolle og tidspunkt. Fritekstkommentaren sendes til AI-laget for strukturering, se kapittel 9. Oppdragene legges i status \`pending\`.

3.  **Batchvindu.** Oppdraget planlegges ikke umiddelbart. Det legges i et batchvindu på 60 til 120 sekunder (kortere ved akutt hastverk) slik at flere samtidige fraværsmeldinger behandles sammen. Dette er forutsetningen for at kapittel 7.4 skal virke.

4.  **Matchemotor.** Henter alle oppdrag i batchvinduet pluss alle oppdrag som venter på neste bølge, kjører harde filtre, beregner score, og løser tildelingen globalt.

5.  **Bølgeplanlegger.** Lager \`offers\` med utløpstid, disjunkt fordelt på tvers av oppdragene, og markerer hvilken kanal som skal brukes først.

6.  **Utsender.** Sender push umiddelbart. Registrerer om push ble levert og åpnet. Etter 90 til 120 sekunder uten åpning sendes SMS til samme mottaker.

7.  **Svar.** Vikaren trykker i appen eller på dyplenken i SMS-en. En Cloud Function kjører en Firestore-transaksjon som setter oppdraget til \`claimed\` hvis og bare hvis det fortsatt er \`offering\`. Alle andre åpne tilbud på samme oppdrag settes til \`superseded\`, og de får en kort melding om at oppdraget er tatt.

8.  **Ingen svar.** Bølgetikken (Cloud Scheduler hvert minutt) finner utløpte tilbud, legger kandidatene tilbake i puljen og utløser en ny matchekjøring for neste bølge.

9.  **Frist ute.** Når oppdragets SLA er brutt, settes status \`escalated\`, ansvarlig person varsles, og systemet legger ved en rangert liste med begrunnelse per kandidat, samt forslag til alternative løsninger (slå sammen grupper, bruke ledig intern ressurs).

10. **Etterpå.** Utfallet logges: hvem som svarte, hvor raskt, hvem som takket nei, om vikaren møtte, og hvilken tilbakemelding skolen gir. Dette er treningsdataene for kapittel 7.7.

**5.3 Hvorfor Firebase er riktig her, og hvor det knirker**

| **Egenskap**          | **Vurdering**                                                                                                                                                                                                                                                |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Transaksjoner         | Firestore-transaksjoner gir deg først til mølla helt rent, uten at du må bygge et låsesystem selv. Dette alene rettferdiggjør valget.                                                                                                                        |
| Sanntid               | Klientene kan lytte på oppdragsstatus og oppdatere uten polling. Administrator ser dagen oppdatere seg live.                                                                                                                                                 |
| Push                  | FCM er innebygd, gratis, og fungerer likt fra Flutter på begge plattformer.                                                                                                                                                                                  |
| Tidsstyring           | Cloud Scheduler pluss Cloud Tasks gir presise bølger. Cloud Tasks er bedre enn Scheduler for utsatt utsending per tilbud, fordi du kan planlegge én oppgave per utløpstidspunkt.                                                                             |
| Spørringer            | Firestore er svakt på sammensatte spørringer. Matchemotoren bør derfor lese vikarregisteret for skolen inn i minnet i funksjonen (typisk 20 til 80 personer) og gjøre all filtrering der. Det er raskere og enklere enn å prøve å uttrykke det i spørringer. |
| Kaldstart             | En Cloud Function som ikke har kjørt på en stund bruker ett til tre sekunder på å starte. Sett \`minInstances: 1\` på matchefunksjonen i skoletiden. Koster noen få kroner i måneden og fjerner problemet.                                                   |
| Datalokasjon          | Velg region ved oppretting av prosjektet. Dette kan ikke endres etterpå. Velg europe-north1 eller europe-west4.                                                                                                                                              |
| Låsing til leverandør | Reell, men håndterbar. Hold all domenelogikk i rene Dart- eller TypeScript-moduler uten Firebase-avhengighet, slik at motoren kan flyttes.                                                                                                                   |

> **Arkitekturprinsipp:** Matchemotoren skal være en ren funksjon: gitt en liste med oppdrag, en liste med kandidater og et sett vekter, returner en tildeling. Ingen databasekall, ingen nettverk, ingen klokke. Da kan du kjøre tolv måneder med historiske data gjennom den på sekunder, og det er slik du beviser at den virker.

**6. Datamodell**

Modellen er flerleietaker fra dag én: alt henger under en \`tenant\` (kommune eller skoleeier) og en \`school\`. Det koster nesten ingenting nå, og sparer deg for en smertefull migrering når skole nummer to kommer.

**6.1 Samlinger i Firestore**

| **Samling**          | **Nøkkelfelter**                                                                                                  | **Kommentar**                                    |
|----------------------|-------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| tenants/{tenantId}   | navn, orgnr, kontakt, avtalestatus                                                                                | Kommune eller privat skoleeier                   |
| schools/{schoolId}   | tenantId, navn, trinn, tidssone, eskaleringskontakter, åpningstider                                               | Rot for alt annet                                |
| staff/{staffId}      | schoolId, navn, rolle, ansattnummer, klasser, fag, aktiv                                                          | Fast ansatte som kan melde fravær                |
| substitutes/{subId}  | schoolId eller tenantId, navn, telefon, epost, fcmToken, kompetanse, sertifiseringer, preferanser, status         | Kjernen i registeret. Se 6.2                     |
| timetable/{entryId}  | schoolId, staffId, klasse, fag, ukedag, startTid, sluttTid, rom, gyldigFra, gyldigTil                             | Kan importeres fra CSV i MVP                     |
| absences/{absenceId} | schoolId, staffId, fra, til, type, fritekst, meldtTid, meldtAv                                                    | Selve fraværsmeldingen                           |
| shifts/{shiftId}     | absenceId, schoolId, dato, start, slutt, rolle, klasse, fag, trinn, krav, status, prioritet, slaFrist, tildeltTil | Ett oppdrag som skal fylles                      |
| offers/{offerId}     | shiftId, subId, bølge, score, begrunnelse, kanal, sendtTid, utløpsTid, svarTid, svar, leveringsstatus             | Én forespørsel til én person                     |
| assignments/{id}     | shiftId, subId, bekreftetTid, møtteOpp, tilbakemelding                                                            | Bekreftet og gjennomført oppdrag                 |
| availability/{id}    | subId, fra, til, type (tilgjengelig / utilgjengelig / opptatt)                                                    | Vikarens egen markering pluss avledet opptatthet |
| weights/{schoolId}   | vektsett, versjon, endretAv, endretTid                                                                            | Konfigurasjon av poengfunksjonen                 |
| decisions/{id}       | shiftId, kjøringId, kandidatliste med score, valgte, algoritmeversjon, vektversjon                                | Revisjonslogg. Juridisk påkrevd, se kapittel 10  |
| escalations/{id}     | shiftId, tilBruker, sendtTid, forslagsliste, løstTid, løstHvordan                                                 | Når mennesket må inn                             |

**6.2 Vikarprofilen i detalj**

Dette er dokumentet som bestemmer kvaliteten på matchingen. Bruk tid her.

> substitutes/{subId} = {
>
> tenantId, schoolIds: \[ ... \], // kan jobbe på flere skoler
>
> navn, telefon, epost,
>
> fcmTokens: \[ ... \],
>
> status: "aktiv" \| "pause" \| "sluttet",
>
> kvalifikasjon: {
>
> laererutdanning: bool,
>
> fagbrev: \[ ... \], // f.eks. barne- og ungdomsarbeider
>
> undervisningsfag: \[ // med kompetansenivå
>
> { fag: "matematikk", trinn: \[5,6,7\], nivaa: 3 }, ...
>
> \],
>
> politiattestDato: date, // hardt filter, se 10.4
>
> politiattestUtloep: date,
>
> },
>
> roller: \["laerer", "assistent", "SFO"\],
>
> preferanser: {
>
> ukedager: \[1,2,4\], // vil helst jobbe disse dagene
>
> tidligstStart: "08:00",
>
> senestSlutt: "15:30",
>
> maksDagerPerUke: 3,
>
> foretrukneTrinn: \[1,2,3,4\],
>
> varselKanal: "push" \| "sms" \| "begge",
>
> stilletidFra: "21:00", stilletidTil: "06:30",
>
> },
>
> historikk: { // beregnet nattlig, ikke skrevet manuelt
>
> oppdragTotalt, oppdragSiste30d, oppdragSiste90d,
>
> responsRate, aksepteringsRate, medianSvartidMin,
>
> oppmoetesRate, avlysteSentRate,
>
> klasseKjennskap: { "5B": { antall: 12, sist: date }, ... },
>
> skolensVurdering: 0..5, // snitt av tilbakemeldinger
>
> sistForespurt: timestamp,
>
> },
>
> sperrer: { // harde, satt av skolen
>
> klasser: \["7A"\], // skal ikke brukes her
>
> begrunnelseIntern: "...", // ikke synlig for vikaren
>
> }
>
> }
>
> **Personvernmerknad:** Feltet «sperrer» og «skolensVurdering» er personopplysninger om arbeidstakere og kan oppleves som en skjult vurdering. Behandle dem deretter: de skal være synlige for den registrerte ved innsyn, de skal ha en saklig begrunnelse, og de skal aldri være den eneste grunnen til at noen aldri får oppdrag. Kapittel 10 går nærmere inn på dette.

**6.3 Livssyklus for et oppdrag**

> pending --\> offering --\> claimed --\> confirmed --\> completed
>
> \| \| \|
>
> \| \| +--\> cancelled (vikar trekker seg)
>
> \| \|
>
> \| +--\> escalated --\> manually_assigned
>
> \| \|
>
> \| +--\> unfilled (løst internt)
>
> \|
>
> +--\> withdrawn (læreren melder seg frisk igjen)

Statusovergangene skal skje i Cloud Functions, aldri direkte fra klienten. Sikkerhetsreglene i Firestore skal nekte klienten å skrive til \`status\`-feltet i det hele tatt.

**7. Matchemotoren**

Dette kapittelet er selve produktet. Alt annet er infrastruktur rundt det.

**7.1 Hvorfor rangeringen skal være deterministisk**

Det fristende er å sende hele kandidatlisten til en språkmodell og be den velge. Ikke gjør det. Fire grunner:

- **Testbarhet.** En deterministisk funksjon kan du kjøre mot tolv måneder historikk og måle treffsikkerhet før du sender én eneste SMS. En språkmodell gir deg ulikt svar på samme input.

- **Forklarbarhet.** Når rektor spør hvorfor Kari ble spurt og ikke Per, må du kunne svare med tall. «Kari fikk 78 poeng fordi hun har matematikk på mellomtrinnet og har hatt 5B tolv ganger, Per fikk 61 fordi han mangler faget.» Det bygger tillit på en måte ingen modellbegrunnelse gjør.

- **Juss.** Systemet fordeler betalt arbeid til enkeltpersoner. Både personvernforordningen og den kommende KI-forordningen stiller krav til åpenhet og etterprøvbarhet i slike systemer. Se kapittel 10.

- **Kostnad og hastighet.** Et poengregnestykke over 60 kandidater tar under ett millisekund. Et modellkall tar ett til tre sekunder og koster penger hver gang.

> **Rollefordeling:** Regler bestemmer hvem som kan. Poeng bestemmer hvem som bør. Tildelingsalgoritmen bestemmer hvem som blir spurt. AI oversetter mellom mennesker og systemet, men tar aldri beslutningen.

**7.2 Harde filtre**

Filtrene kjøres først og fjerner kandidater helt. En kandidat som faller på et hardt filter skal aldri kunne komme inn igjen via høy score. Alle filtre skal kunne slås av og på per skole.

| **Filter**                        | **Regel**                                                               | **Merknad**                                                           |
|-----------------------------------|-------------------------------------------------------------------------|-----------------------------------------------------------------------|
| Gyldig politiattest               | politiattestUtløp må være etter oppdragsdato                            | Absolutt. Skal aldri kunne overstyres i systemet                      |
| Aktiv status                      | status må være «aktiv»                                                  | Vikarer i pause eller som har sluttet er ute                          |
| Rolle                             | oppdragets rolle må finnes i kandidatens roller                         | En ren SFO-assistent skal ikke få lærerforespørsler                   |
| Tidskollisjon                     | ingen overlapp med bekreftet oppdrag eller egenmarkert utilgjengelighet | Inkluderer reisetid mellom skoler hvis kandidaten jobber flere steder |
| Skolesperre                       | klassen må ikke stå i kandidatens sperreliste                           | Skal ha begrunnelse og dato                                           |
| Arbeidstidsgrenser                | maks arbeidsdager per uke, hviletid mellom økter                        | Følger arbeidsmiljøloven og kandidatens egen grense                   |
| Kompetansekrav for faget          | kun når skolen har satt faget som «krever formell kompetanse»           | Se 10.4 om hva loven faktisk krever for korte vikariater              |
| Allerede spurt på dette oppdraget | ingen gjentatte forespørsler i senere bølger                            | Unngår at folk føler seg mast på                                      |

**7.3 Poengfunksjonen**

Hvert komponentledd gir 0 til 1, og vektene summerer til 1. Totalscoren ganges med 100 for lesbarhet. Vektene lagres per skole og kan endres i webappen.

| **Komponent**         | **Standard vekt** | **Hva den måler**                                                                                                                                                           |
|-----------------------|-------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Fagkompetanse         | 0,25              | Treff mellom oppdragets fag og trinn og kandidatens undervisningsfag. Gradert: eksakt fag og trinn gir 1,0, riktig fag men feil trinn 0,6, beslektet fag 0,4, ingenting 0,1 |
| Kjennskap til klassen | 0,20              | Antall tidligere oppdrag i samme klasse, dempet med tiden. Metter ved omtrent ti oppdrag. Dette er ofte den viktigste faktoren for kvaliteten på timen                      |
| Sannsynlighet for ja  | 0,15              | Historisk aksepteringsrate, justert for ukedag og tidspunkt. Høy verdi gir raskere fylling                                                                                  |
| Pålitelighet          | 0,15              | Oppmøterate, andel sene avlysninger, skolens tilbakemeldinger                                                                                                               |
| Rettferdig fordeling  | 0,15              | Inverst forhold til antall oppdrag siste 30 dager, veid mot kandidatens ønskede volum. Se 7.4                                                                               |
| Preferansetreff       | 0,07              | Ukedag, tidspunkt og trinn kandidaten selv har oppgitt at de foretrekker                                                                                                    |
| Nærhet                | 0,03              | Reisetid til skolen. Lav vekt fordi de fleste vikarer bor i nærmiljøet, men viktig i store kommuner                                                                         |

Et par detaljer som betyr mye i praksis:

- **Metning, ikke lineære ledd.** Bruk \`1 - exp(-n/k)\` for erfaringsledd. Forskjellen mellom null og tre oppdrag i en klasse er stor. Forskjellen mellom tjue og tjuetre er null.

- **Tidsforvitring.** Vekt historikk med en halveringstid på omtrent 120 dager. En vikar som hadde 5B ukentlig i fjor, men ikke i år, skal ikke rangeres som om hun var der i går.

- **Kaldstart.** Nye vikarer har ingen historikk. Gi dem en nøytral prior (0,5 på historiske ledd) pluss et lite utforskningstillegg de første ti oppdragene, ellers blir de aldri spurt og du får aldri data om dem.

- **Kostnadsbevissthet, men forsiktig.** Der faget ikke krever formell kompetanse, kan en ufaglært assistent være både riktig og billigere. Legg det inn som et eget, avslåtbart ledd, og gjør det synlig i grensesnittet at det er skrudd på. Skjult kostnadsoptimalisering mot arbeidstakere er et tillitsproblem.

**7.4 Den globale tildelingen**

Dette er svaret på problemet du identifiserte: at seks klasser ikke skal ende opp med å mase på de samme fem vikarene.

**Feil tilnærming (grådig per oppdrag):** For hvert oppdrag, ta de tre høyest scorede kandidatene og send forespørsel. Resultat: kandidat A, B og C får seks forespørsler hver, mens kandidat J til T får null. Vikarene blir irriterte, fyllingsgraden blir dårligere, og fordelingen blir skjevere enn den manuelle prosessen du skulle forbedre.

**Riktig tilnærming (global tildeling):** Behandle alle åpne oppdrag i samme kjøring som ett tildelingsproblem.

1.  Bygg en kostnadsmatrise der rad er kandidat, kolonne er oppdrag, og kostnad er \`100 minus score\`. Uegnede par (harde filtre) får uendelig kostnad.

2.  La hvert oppdrag ha \`k\` plasser (typisk 3 i bølge 1). Duplisér kolonnene, eller bruk min-kostnad maks-flyt der oppdragsnoden har kapasitet \`k\`.

3.  La hver kandidat ha kapasitet 1 i denne bølgen. Det er denne begrensningen som gjør forespørslene disjunkte.

4.  Løs med den ungarske algoritmen for kvadratiske tilfeller, eller min-kostnad maks-flyt for det generelle tilfellet. Med under hundre kandidater og under tjue oppdrag går dette på millisekunder.

5.  Resultatet er en plan der ingen kandidat får mer enn én forespørsel i bølgen, og hvert oppdrag får sine beste tilgjengelige kandidater gitt at de andre oppdragene også skal fylles.

> **Praktisk tips:** Det finnes ferdige implementasjoner. I TypeScript: pakken «munkres-js» for ungarsk algoritme, eller «graphology» og en egen min-kostnad-flyt. Du trenger ikke skrive dette selv, men du bør forstå det godt nok til å forklare det.

I tillegg til tildelingen håndhever du en **maksgrense for samtidige forespørsler per kandidat**, typisk 2. Hvis en vikar allerede har et åpent tilbud som ikke er besvart, skal hun normalt ikke få et nytt i neste bølge. Unntaket er akutte oppdrag under to timer til start, der du heller sender bredere.

**Rettferdighetsleddet i praksis**

Rettferdighet er ikke likefordeling. En vikar som ønsker én dag i uken skal ikke få like mange forespørsler som en som ønsker fire. Regn derfor ut en forventet andel for hver kandidat basert på deres oppgitte ønskede volum, og la rettferdighetsleddet måle avvik fra den forventede andelen, ikke fra gjennomsnittet.

> forventetAndel_i = ønsketDagerPerUke_i / Σ ønsketDagerPerUke
>
> faktiskAndel_i = oppdragSiste30d_i / Σ oppdragSiste30d
>
> rettferdighet_i = clamp(0, 1, 0.5 + (forventetAndel_i - faktiskAndel_i) \* F)
>
> // F er en skaleringsfaktor, start på 5

**7.5 Bølger, frister og hastegrader**

Reglene du beskrev (én time hvis meldt dagen før, tretti minutter hvis meldt samme morgen) generaliseres best til en tabell styrt av hvor lang tid det er til oppdraget starter. Alle verdier skal være redigerbare i webappen.

| **Hastegrad** | **Tid til start**  | **Bølgestørrelse** | **Intervall** | **Total frist før eskalering** |
|---------------|--------------------|--------------------|---------------|--------------------------------|
| Rolig         | Over 16 timer      | 3 kandidater       | 20 minutter   | 60 minutter                    |
| Normal        | 2 til 16 timer     | 3 kandidater       | 10 minutter   | 30 minutter                    |
| Akutt         | 45 min til 2 timer | 6 kandidater       | 5 minutter    | 15 minutter                    |
| Kritisk       | Under 45 minutter  | Alle kvalifiserte  | Én utsending  | 10 minutter                    |

**Stilletid**

Ingen meldinger mellom 21:00 og 06:30, med mindre vikaren selv har åpnet for det. Et fravær meldt klokken 22:30 planlegges, men første utsending skjer 06:30. Dette er ikke bare høflighet: det er forskjellen mellom et system vikarene aksepterer og et de slår av varslene på. Sett kvitteringen i lærerappen tydelig: «Meldt. Første forespørsel går ut 06:30.»

**Eskalerende bredde**

Hver bølge øker bredden og senker terskelen. Bølge 1 tar de best egnede. Bølge 2 slipper inn kandidater med svakere fagtreff. Bølge 3 slipper inn kandidater fra nabokrets eller andre skoler i kommunen, hvis skolen har åpnet for deling. Gjør denne åpningen til en innstilling, fordi deling av vikarpool på tvers av skoler er et av de sterkeste salgsargumentene mot en hel kommune.

**7.6 Først til mølla uten kollisjoner**

To vikarer trykker «ja» på samme oppdrag innenfor samme sekund. Dette må håndteres i databasen, ikke i appen.

> export const claimShift = onCall(async (req) =\> {
>
> const { offerId } = req.data;
>
> const uid = req.auth.uid;
>
> return db.runTransaction(async (tx) =\> {
>
> const offerRef = db.doc(\`offers/\${offerId}\`);
>
> const offer = await tx.get(offerRef);
>
> if (!offer.exists) throw err("not-found");
>
> if (offer.data().subId !== uid) throw err("permission-denied");
>
> if (offer.data().expiresAt \< now()) return { ok: false, reason: "utloept" };
>
> const shiftRef = db.doc(\`shifts/\${offer.data().shiftId}\`);
>
> const shift = await tx.get(shiftRef);
>
> // Dette er linjen som gjør først til mølla korrekt:
>
> if (shift.data().status !== "offering") {
>
> tx.update(offerRef, { svar: "for_sent", svarTid: now() });
>
> return { ok: false, reason: "allerede_tatt" };
>
> }
>
> tx.update(shiftRef, {
>
> status: "claimed", tildeltTil: uid, tildeltTid: now()
>
> });
>
> tx.update(offerRef, { svar: "ja", svarTid: now() });
>
> return { ok: true };
>
> });
>
> });

Etter at transaksjonen er ferdig, kjører en oppfølgingsfunksjon som setter alle andre åpne tilbud på oppdraget til \`superseded\` og sender dem en kort, vennlig melding: «Oppdraget er dessverre tatt. Takk for at du vurderte det.» Denne meldingen er viktig for opplevelsen og bør alltid gå på push, aldri SMS, siden den ikke haster.

- **Idempotens.** Dyplenken i SMS-en kan trykkes flere ganger, og SMS-webhooks kan leveres dobbelt. Hvert svar må ha en unik nøkkel, og gjentatte kall med samme nøkkel skal gi samme svar uten sideeffekt.

- **Klokkeskjevhet.** Bruk alltid tjenerens tidsstempel for utløp, aldri klientens.

- **Angrefrist.** Gi vikaren 60 sekunder til å angre etter at hun har takket ja, før oppdraget låses og de andre varsles. Dette fjerner feiltrykk, som er vanligere enn du tror på en telefon klokken 06:40.

**7.7 Eskalering til menneske**

Når fristen går ut skal mennesket ikke få beskjeden «ingen svarte». Det er nettopp den situasjonen systemet skulle fjerne. Eskaleringen skal være en ferdig beslutningspakke.

Varselet (push til administrator, pluss SMS hvis ikke åpnet innen to minutter) leder til en skjerm som viser:

- Hvilket oppdrag det gjelder, i klartekst: «7B, matematikk og naturfag, 08:30 til 11:15, torsdag 24. september.»

- Hvem som er spurt, når, og hva de svarte. Inkludert de som ikke svarte i det hele tatt.

- Topp fem gjenstående kandidater, rangert, hver med én setning begrunnelse og et «ring»-ikon som starter anropet.

- Alternative løsninger systemet har funnet: en intern ansatt som har ledig time i det aktuelle tidsrommet, muligheten for å slå sammen to grupper, eller om en annen skole i kommunen har ledig vikar (hvis deling er slått på).

- Ett trykk for å sende en ny, bredere bølge manuelt.

- Ett trykk for å markere oppdraget som løst internt, med kategori, slik at det telles riktig i statistikken.

> **Detalj som avgjør adopsjon:** Begrunnelsene skal være på norsk, korte og konkrete. «Har hatt 7B ni ganger i vår, men svarer sjelden før klokken 08» er nyttig. «Score 0,72» er ikke. Dette er den ene plassen i systemet der du bør bruke en språkmodell til å formulere, med tallene som input.

**7.8 Hvordan systemet blir bedre over tid**

Du sa dette skulle kunne forbedres i bruk. Her er tre nivåer, og du bør ta dem i rekkefølge.

**Nivå 1: Statistikk som mates tilbake (fra dag én)**

En nattlig jobb regner ut responsrate, aksepteringsrate, median svartid per ukedag og klokkeslett, oppmøterate og klassekjennskap for hver vikar. Dette er ikke maskinlæring, det er telling, men det er her mesteparten av forbedringen ligger. Etter tre måneder vet systemet at Kari nesten alltid svarer ja på tirsdager og aldri på fredager, og rangerer deretter.

**Nivå 2: Kalibrering mot faktiske utfall (fra måned 4)**

Nå har du nok data til å spørre: hvilke vektsett ville gitt best resultat på det som faktisk skjedde? Kjør en enkel søkeprosess (rutenettsøk eller tilfeldig søk over vektrommet) mot historikken, med en målfunksjon som kombinerer fyllingsgrad, antall forespørsler per fylt oppdrag og fordelingsjevnhet. Presenter de beste vektsettene som forslag i webappen, med en «prøv i skyggedrift i to uker»-knapp. Aldri automatisk endring av vekter i produksjon.

**Nivå 3: Prediksjon (fra måned 9, hvis det er verdt det)**

Med tolv måneder data kan du trene en enkel modell som predikerer sannsynligheten for at en gitt kandidat sier ja til et gitt oppdrag, ut fra ukedag, tidspunkt, fag, klasse, varsel og kandidatens egenskaper. En logistisk regresjon eller en gradient-boostet tremodell holder i massevis, og begge er forklarbare. Bruk prediksjonen til å erstatte «sannsynlighet for ja»-leddet i poengfunksjonen. Resten av funksjonen står urørt.

> **Ikke gjør dette:** Ikke bygg et system som kontinuerlig og automatisk endrer sine egne vekter i produksjon. Det gir deg et produkt du ikke kan feilsøke, ikke kan forklare til rektor, og ikke kan dokumentere overfor et personvernombud. Alle vektendringer skal være versjonerte, datostemplede og godkjent av et menneske.

**8. Varslingslaget: hvordan meldingene faktisk går ut**

**8.1 Kanalstrategien**

SMS er den eneste kanalen du kan stole på når det gjelder, men den koster penger og er en dårlig brukeropplevelse for svar. Push er gratis og gir deg en rik opplevelse, men når ikke alle. Løsningen er en trapp.

| **Steg** | **Tid**                           | **Handling**                                                      | **Kostnad**      |
|----------|-----------------------------------|-------------------------------------------------------------------|------------------|
| 1        | t = 0                             | Push via FCM med handlingsknapper «Ja, jeg tar den» og «Kan ikke» | 0 kr             |
| 2        | t = 90 til 120 sek                | Hvis pushen ikke er levert eller ikke åpnet: SMS med dyplenke     | 0,50 til 0,90 kr |
| 3        | Ved akutt eller kritisk hastegrad | Push og SMS samtidig, ingen forsinkelse                           | 0,50 til 0,90 kr |
| 4        | Vikar uten app installert         | Kun SMS med dyplenke til en enkel nettside                        | 0,50 til 0,90 kr |
| 5        | Oppdrag tatt av andre             | Kun push, aldri SMS                                               | 0 kr             |

> **Kostnadseffekten:** Med omtrent 60 prosent av vikarene på app og god pushåpning i morgentimene, faller SMS-volumet med 50 til 70 prosent. På én skole er det noen hundre kroner i året. På hundre skoler er det 40 000 til 60 000 kroner i året, og da er det en margin.

**8.2 SMS-leverandører**

Prisene under er hentet fra leverandørenes egne prissider i september 2026. Alt er eks. mva.

| **Leverandør**     | **Pris per SMS**                                           | **Fast kostnad**                                                                              | **Vurdering**                                                                                                                                                                      |
|--------------------|------------------------------------------------------------|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Sveve              | 0,90 kr ved 500 stk, 0,60 kr ved 5 000, 0,46 kr ved 50 000 | 139 kr/mnd grunnpakke, +150 kr/mnd for API (500 kr oppstart), +300 kr/mnd for dedikert nummer | **Anbefalt start.** Norsk, enkelt API, priser som passer volumet ditt, lett å få databehandleravtale på norsk                                                                      |
| LINK Mobility      | Forhandles, typisk 0,25 til 0,45 kr på volum               | Avtalebasert                                                                                  | Norsk, stor, brukes av mange kommuner. Best når du passerer omtrent 50 000 meldinger i året. Kommunale innkjøpere kjenner navnet, noe som er verdt litt                            |
| Twilio             | USD 0,0697 per melding, omtrent 0,75 kr                    | Ingen månedsavgift. Alfanumerisk avsender gratis, mottaksnummer fra USD 1,15/mnd              | Best dokumentasjon og verktøy. Dyrere per melding til Norge, og databehandleravtale med amerikansk leverandør gir deg en samtale med kommunens personvernombud du helst vil slippe |
| GatewayAPI, 46elks | 0,30 til 0,50 kr                                           | Lav eller ingen                                                                               | Danske og svenske alternativer med gode API-er og EU-drift. Verdt å prise inn når volumet vokser                                                                                   |

**Konkret anbefaling:** Start på Sveve med grunnpakke og API-tillegg, altså 289 kroner i måneden pluss meldinger. Bytt til LINK Mobility når du passerer omtrent fem skoler. Bygg utsenderen bak et grensesnitt med to metoder (\`send\` og \`parseDeliveryReport\`) slik at bytte av leverandør er en ettermiddags arbeid, ikke en refaktorering.

**8.3 Svarkanal: dyplenke framfor SMS-svar**

Du har to valg for hvordan vikaren svarer på en SMS.

| **Løsning**                      | **Fordeler**                                                                                                                                                         | **Ulemper**                                                                                                                                             |
|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| SMS-svar med kodeord («JA 4471») | Fungerer uten data og uten app. Kjent for eldre brukere                                                                                                              | Krever dedikert nummer eller kodeord: 300 kr/mnd ekstra. Koster inngående melding. Feilskriving er vanlig. Ingen bekreftelse på hvem som faktisk svarte |
| **Dyplenke med engangstoken**    | Ingen ekstra abonnement. Åpner appen hvis installert, ellers en enkel nettside. Ett trykk. Du vet sikkert hvem som svarte. Kan vise hele oppdraget før hun bekrefter | Krever mobildata eller wifi. Lenken må være kort, ellers øker SMS-en til to segmenter                                                                   |

Velg dyplenke. Hold token kort (åtte tegn holder når det er engangs og utløper), bruk et kort domene, og sørg for at hele meldingen får plass i 160 tegn. Legg SMS-svar til senere hvis en skole krever det.

**Eksempel på melding**

> Avsender: VIKAR
>
> Vikar ons 24.9 kl 08:30-11:15, 7B matte/naturfag,
>
> Bjørkelia skole. Svar: vkr.no/s/K7m2pQx4
>
> (139 tegn, ett segment)

Legg merke til hva meldingen ikke inneholder: ingen navn på den syke læreren, ingen begrunnelse for fraværet, ingen elevinformasjon. Det er både personvern og god praksis.

**8.4 Leveringsrapporter og feilhåndtering**

- Lagre leveringsstatus per melding. En vikar med gjentatte leveringsfeil skal flagges i registeret, ikke bare fortsette å få meldinger som forsvinner.

- Sett opp en webhook fra SMS-leverandøren og loggfør alt. Når rektor sier «jeg tror aldri hun fikk den meldingen», skal du kunne svare på sekundet.

- Ha en kill switch: en innstilling per skole som stopper all utsending umiddelbart. Du kommer til å trenge den, sannsynligvis i uke to av piloten.

- Sett et tak på antall meldinger per skole per døgn, med varsel til deg selv ved overskridelse. Dette er forsikringen mot en løkke som sender 4 000 SMS på en natt.

> **Test-tvang:** I utviklings- og testmiljøet skal SMS-utsenderen aldri kunne nå et ekte nummer. Bruk en hviteliste med dine egne og mors nummer, og la alt annet gå til en logg. Denne regelen har reddet mange prosjekter fra en svært pinlig morgen.

**9. AI-laget: hva agenten faktisk gjør**

Du beskrev systemet som drevet av AI-agenter. Det er riktig ambisjon, men det er verdt å være presis om hvor modellene gir verdi og hvor de bare gir usikkerhet.

**9.1 Fire oppgaver der modellen er riktig verktøy**

| **Oppgave**                                    | **Input**                                                                                                   | **Output**                                                                                                                   | **Når den kjøres**                                       |
|------------------------------------------------|-------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| **Tolke fritekst fra fraværsmeldingen**        | «Er syk i morgen, men kan ta siste time hvis det trengs. 5B har prøve i matte, den må gjennomføres.»        | Strukturert: delvis fravær, unntak for siste time, merknad om at oppdraget krever gjennomføring av prøve, fagkrav matematikk | Ved hver fraværsmelding med fritekst                     |
| **Skrive forespørselen**                       | Oppdragsdata, kandidatens profil, skolens tone                                                              | En kort, presis melding tilpasset kanalen, på riktig språk og med riktig detaljnivå                                          | Ved hver utsending, med aggressiv mellomlagring av maler |
| **Oppsummere for eskaleringen**                | Hele beslutningsloggen: hvem som ble spurt, score, svar, tid                                                | Fem setninger på norsk som forklarer situasjonen og anbefaler neste steg                                                     | Ved hver eskalering                                      |
| **Oversette skolens regler til konfigurasjon** | Rektor skriver: «Vi vil ikke sende vikarforespørsler til noen som har jobbet fire dager allerede denne uka» | Et forslag til regelendring, vist som en diff mot gjeldende konfigurasjon, som mennesket må godkjenne                        | I webappen, på forespørsel                               |

**9.2 Tre oppgaver der modellen ikke skal brukes**

- **Rangere kandidater.** Begrunnet i 7.1.

- **Avgjøre om et hardt filter er oppfylt.** Politiattest, arbeidstid og tidskollisjon er regneoppgaver med ett riktig svar. En modell som er 99 prosent treffsikker på dette er 100 ganger for dårlig.

- **Sende noe uten menneskelig gjennomgang første gang.** Alle maler skal godkjennes av deg og rektor før de går i produksjon. Etter det kan modellen fylle inn variabler i godkjente maler fritt.

**9.3 Konfigurasjonsflaten i webappen**

Du beskrev at administratoren skal kunne justere variabler og «justere AI-en». Konkretisert blir det fire skjermer:

1.  **Vekter.** Syv glidere, én per komponent i poengfunksjonen, som alltid normaliseres til 1. Under gliderne: en live forhåndsvisning som viser hvordan de siste tjue faktiske oppdragene ville blitt rangert med de nye vektene sammenlignet med de gamle. Dette er den viktigste skjermen i hele webappen, fordi den gjør algoritmen begripelig.

2.  **Regler og filtre.** Av og på per filter, med terskelverdier. Endringer krever en begrunnelse i fritekst, som lagres i revisjonsloggen.

3.  **Frister og bølger.** Tabellen fra 7.5, redigerbar. Med en advarsel hvis noen setter en frist som gjør eskalering praktisk umulig.

4.  **Kontekst til modellen.** Et fritekstfelt der skolen skriver hva som er spesielt hos dem: «Vi har to klasser med mange elever som trenger forutsigbarhet, der er kjennskap viktigere enn fagkompetanse.» Dette limes inn i systempromptene for tolke- og oppsummeringsoppgavene, ikke i rangeringen. Feltet skal ha en maksgrense og en forhåndsvisning av hvordan det påvirker en konkret melding.

> **Designvalg som bygger tillit:** La administratoren se selve prompten som sendes, og selve svaret som kommer tilbake, i en «teknisk visning» bak et lite ikon. De færreste vil klikke, men at det er mulig fjerner mistenksomheten mot svart boks. Dette er også et konkret svar på åpenhetskravene i kapittel 10.

**9.4 Modellvalg og kostnad**

Prisene er fra Anthropics prisside i september 2026, i USD per million tokens.

| **Modell**          | **Inn**           | **Ut**            | **Bruk**                                                                                                       |
|---------------------|-------------------|-------------------|----------------------------------------------------------------------------------------------------------------|
| Claude Haiku 4.5    | 1                 | 5                 | **Standardvalg.** Tolking av fritekst, meldingsgenerering, oppsummering. Rask nok til å ligge i sanntidsflyten |
| Claude Sonnet 5     | 2                 | 10                | Regeloversetting i webappen og andre oppgaver der kvalitet slår hastighet. Ikke i sanntidsflyten               |
| Batch-kjøring       | 50 prosent rabatt | 50 prosent rabatt | Den nattlige analysejobben. Ingen hast, halv pris                                                              |
| Promptmellomlagring | 0,1x ved treff    |                   | Systemprompten med skolens regler er identisk mellom kall. Mellomlagre den, og inn-kostnaden nær forsvinner    |

Et regnestykke: en fraværsmelding med fritekst gir omtrent 1 500 tokens inn og 300 ut. Med Haiku og mellomlagring koster det i underkant av 0,003 dollar. Tre kall per oppdrag og 300 oppdrag i året gir 2,70 dollar per skole per år, altså under 30 kroner. AI-kostnaden er ikke en post i budsjettet ditt.

> **Sikkerhet:** API-nøkkelen skal aldri ligge i Flutter-appen. Alle modellkall går gjennom Cloud Functions, med nøkkelen i Secret Manager. En nøkkel i en mobilapp kan hentes ut av hvem som helst med et dekompileringsverktøy, og regningen sendes til deg.

**10. Personvern, jus og innkjøpskrav**

Dette kapittelet er ikke juridisk rådgivning, og du bør ha en runde med en advokat eller kommunens personvernombud før første betalende kunde. Men det er ting her som påvirker arkitekturen, og de må inn nå, ikke senere.

**10.1 Rollene**

- **Skoleeier (kommunen) er behandlingsansvarlig.** Det er de som bestemmer formålet med behandlingen.

- **Du er databehandler.** Du behandler personopplysninger på kommunens vegne.

- **Dette krever en databehandleravtale** etter personvernforordningen artikkel 28, før én eneste ekte personopplysning legges inn i systemet. Ikke etter piloten. Før.

- **Underleverandører må listes opp og godkjennes:** Google (Firebase), SMS-leverandøren din, og Anthropic hvis du kaller modell-API-et. Hver av dem trenger sin egen avtale i kjeden.

> **Praktisk:** KS har standard databehandleravtaler for kommunal sektor. Bruk dem som utgangspunkt heller enn å skrive din egen. Kommunen kjenner dem igjen, og det korter ned prosessen betydelig.

**10.2 Automatiserte avgjørelser, artikkel 22**

Personvernforordningen artikkel 22 gir en rett til ikke å være gjenstand for en avgjørelse som utelukkende er basert på automatisert behandling, og som har rettsvirkning eller tilsvarende betydelig innvirkning.

Spørsmålet er om det å fordele betalte vikaroppdrag faller innenfor. Det er ikke avklart i norsk praksis, men inntekt for en tilkallingsvikar er ikke en bagatell, og du bør designe som om artikkel 22 gjelder. Det er i praksis gratis, fordi designet du allerede har valgt gjør jobben:

- **Systemet tar ingen beslutning om noen.** Det sender en invitasjon. Vikaren velger selv om hun vil takke ja. Det er vikarens eget valg som skaper oppdraget, ikke systemets.

- **Mennesket er alltid i sløyfen ved avvik.** Når fristen går ut, tar en person over.

- **Administratoren kan overstyre hele veien.** Det skal være ett trykk å tildele manuelt, når som helst.

- **Alle avgjørelser er loggført med begrunnelse.** Samlingen \`decisions\` i kapittel 6 er nettopp dette.

- **Den registrerte har innsyn.** Bygg inn en «mine data»-skjerm i vikarappen som viser profilen, historikken og hvorfor hun ikke ble spurt på de siste oppdragene. Dette er en innsynsrett du likevel må oppfylle, og det er langt billigere å bygge den én gang enn å svare manuelt.

**10.3 KI-forordningen**

EUs KI-forordning klassifiserer AI-systemer brukt til rekruttering, utvelgelse og **fordeling av arbeidsoppgaver** som høyrisiko (vedlegg III, punkt 4). Et system som fordeler vikaroppdrag ligger nær denne definisjonen.

| **Forhold**                           | **Status per september 2026**                                                                                                                                                                  |
|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Frist for høyrisikokrav (vedlegg III) | Utsatt til **2. desember 2027** gjennom forordning (EU) 2026/1744, den såkalte digitale omnibusen. Opprinnelig frist var 2. august 2026                                                        |
| Åpenhetskrav                          | Gjelder allerede fra 2. august 2026                                                                                                                                                            |
| Status i Norge                        | Forordningen er ennå ikke norsk rett. Den må først inn i EØS-avtalen og gjennomføres i en norsk KI-lov, som er forsinket. Men behandlingen er allerede regulert gjennom personopplysningsloven |
| Hva det betyr for deg                 | Du har rundt femten måneder. Det er rikelig, men bare hvis du bygger loggingen og dokumentasjonen fra starten i stedet for å ettermontere den                                                  |

Det du bør gjøre nå, som uansett gjør produktet bedre:

- Loggfør hver beslutning med inndata, vektversjon, algoritmeversjon, kandidatliste og resultat. Dette er kjernen i det en høyrisikovurdering vil kreve.

- Versjonér algoritmen og vektsettene. Hver endring skal ha dato, hvem som gjorde den, og hvorfor.

- Skriv én side som forklarer hvordan matchingen virker, på norsk, uten formler. Den siden blir vedlegg til salgsmaterialet, til databehandleravtalen og til en eventuell samsvarsvurdering.

- Bygg inn måling av skjevfordeling: hvis systemet systematisk gir færre oppdrag til en gruppe, skal det synes i et dashbord. Dette er både etisk riktig og et krav som kommer.

> **Salgsvinkel:** De færreste konkurrenter har tenkt på dette. Å kunne legge fram en ferdig personvernvurdering og en forklaring av algoritmen i første møte med en kommune er et sterkt tillitssignal, og det korter ned innkjøpsprosessen med måneder.

**10.4 Skolelovgivningen**

- **Politiattest.** Alle som skal jobbe fast i skolen må legge fram politiattest. Dette må være et hardt filter i systemet, med utløpsdato, og det skal ikke kunne overstyres av en administrator i appen.

- **Kompetansekrav.** Opplæringslova kapittel 17 stiller krav til kompetanse for å undervise, men med unntak for kortere vikariater. Nøyaktig hvor grensen går, og hvordan skolen praktiserer den, er et spørsmål til mor og til kommunens skolefaglige ansvarlig. Gjør det til en konfigurerbar regel per fag og trinn, ikke en hardkodet antakelse.

- **Tilkallingsvikarer og arbeidsmiljøloven.** Reglene for bruk av tilkallingsvikarer er strammet inn de siste årene, blant annet med drøftingsplikt om bruken av midlertidige ansettelser. Systemet ditt gir kommunen noe verdifullt her: en fullstendig logg over hvem som har fått hvor mange oppdrag. Det er et salgsargument, ikke et problem.

- **Taushetsplikt.** Meldinger ut skal aldri inneholde helseopplysninger om den fraværende eller opplysninger om enkeltelever. Dette er allerede innebygd i meldingsmalen i 8.3, men det bør stå som en eksplisitt regel i koden som validerer utgående tekst.

**10.5 Universell utforming**

Offentlige virksomheter i Norge er pålagt å følge WCAG for nettløsninger og apper. En kommune kan ikke kjøpe en løsning som ikke oppfyller kravet, og dette dukker opp i anskaffelsesdokumenter. Det er billig å gjøre riktig fra start og dyrt å ettermontere:

- Tilstrekkelig kontrast, minst 4,5:1 for vanlig tekst.

- Alle knapper skal ha et berøringsmål på minst 44 ganger 44 piksler. Ja-knappen trykkes med tommelen klokken 06:40.

- Skjermleserstøtte: \`Semantics\`-widgeter i Flutter, ikke bare ikoner uten etikett.

- Ikke bruk farge alene til å formidle status. Grønn og rød trenger en tekst eller et ikon ved siden av.

- Støtt systemets tekststørrelse. Mange vikarer er pensjonerte lærere.

**10.6 Anskaffelsesregler, og hvorfor de er gode nyheter**

| **Beløp (eks. mva)**     | **Regelverk**                                                                                               | **Hva det betyr for deg**                                                                                                   |
|--------------------------|-------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Under 500 000 kr         | Utenfor anskaffelsesloven. Innslagspunktet ble hevet fra 100 000 til 500 000 kr 1. juli 2026                | **Kommunen kan kjøpe direkte fra deg.** Ingen konkurranse, ingen utlysning. Dette er hele ditt handlingsrom de første årene |
| 500 000 til 1,3 mill. kr | Anskaffelsesloven gjelder med grunnleggende prinsipper om konkurranse og likebehandling, men ingen formkrav | Kommunen bør innhente noen tilbud. Du kan fortsatt vinne på å være den eneste som løser problemet                           |
| Over 1,3 mill. kr        | Full anskaffelsesforskrift, kunngjøring på Doffin                                                           | Her trenger du referanser, dokumentasjon og tålmodighet. Ikke sikt hit før du har tre fornøyde kommuner                     |

> **Prisstrategi som følger av dette:** Legg prisen for en enkeltskole og for mindre kommuner trygt under 500 000 kroner i året. En kommune med ti skoler til 25 000 kroner per skole lander på 250 000 kroner, godt innenfor direktekjøp. Det er ikke tilfeldig at dette også er en pris kommunen kan forsvare mot vikarbyråkostnader.

**11. Kostnader**

**11.1 Volumforutsetningene**

Alle tallene under bygger på disse antakelsene for én gjennomsnittlig barneskole. Erstatt dem med mors faktiske tall så snart du har dem, og regn om.

| **Størrelse**                                       | **Antatt verdi** | **Kommentar**                                               |
|-----------------------------------------------------|------------------|-------------------------------------------------------------|
| Ansatte som kan ha fravær                           | 35               | Lærere og assistenter                                       |
| Skoledager per år                                   | 190              |                                                             |
| Vikaroppdrag per år                                 | 300              | Ikke alt fravær utløser vikar. Deler dekkes internt         |
| Forespørsler per oppdrag før det fylles             | 4,5              | Bølge 1 gir 3, bølge 2 gir 3, sjeldnere en bredere bølge 3  |
| Andel forespørsler som slipper SMS takket være push | 50 prosent       | Konservativt. Kan bli 70 prosent når appbruken er god       |
| SMS-volum per skole per år                          | omtrent 850      | Forespørsler, påminnelser kvelden før og eskaleringsvarsler |

**11.2 Engangskostnader for å komme i gang**

| **Post**                                                  | **Kostnad**               | **Merknad**                                                                                                                                                              |
|-----------------------------------------------------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Google Play utviklerkonto                                 | 280 kr                    | Engangs                                                                                                                                                                  |
| Apple Developer Program                                   | 1 100 kr per år           | Kan ikke unngås hvis du vil ha iOS-app                                                                                                                                   |
| Domene                                                    | 150 til 300 kr per år     | Velg et kort domene, det sparer deg for SMS-segmenter                                                                                                                    |
| Sveve API-oppstart                                        | 500 kr                    | Engangs                                                                                                                                                                  |
| Selskapsetablering                                        | 0 til 36 000 kr           | Enkeltpersonforetak er gratis i Enhetsregisteret. AS krever 30 000 kr i aksjekapital pluss gebyr. Kommuner kjøper helst fra AS, men enkeltpersonforetak holder for pilot |
| Juridisk gjennomgang av databehandleravtale og personvern | 10 000 til 25 000 kr      | Gjør dette før første betalende kunde, ikke før piloten                                                                                                                  |
| Ansvarsforsikring                                         | 4 000 til 8 000 kr per år | Kreves ofte i kommunale avtaler                                                                                                                                          |
| **Sum, realistisk minimum for pilot**                     | **omtrent 2 000 kr**      | Play, Apple, domene og Sveve-oppstart                                                                                                                                    |
| **Sum før første betalende kunde**                        | **20 000 til 70 000 kr**  | Avhengig av selskapsform og hvor mye juridisk bistand du kjøper                                                                                                          |

**11.3 Driftskostnader i tre scenarioer**

Alle beløp er per år, eks. mva, og avrundet.

| **Post**                   | **1 skole (pilot)**        | **10 skoler**               | **100 skoler**                  |
|----------------------------|----------------------------|-----------------------------|---------------------------------|
| SMS-meldinger              | 800 kr (850 stk à 0,90)    | 4 300 kr (8 500 stk à 0,50) | 35 000 kr (85 000 stk à 0,41)   |
| SMS-abonnement             | 3 500 kr                   | 3 500 kr                    | 3 500 kr, eller avtale med LINK |
| Firestore og lagring       | 0 kr (innenfor gratisnivå) | 1 500 kr                    | 12 000 kr                       |
| Cloud Functions            | 600 kr                     | 2 500 kr                    | 20 000 kr                       |
| Push (FCM)                 | 0 kr                       | 0 kr                        | 0 kr                            |
| AI-kall                    | 30 kr                      | 300 kr                      | 3 000 kr                        |
| Feilovervåkning og logging | 0 kr (gratisnivå)          | 2 000 kr                    | 12 000 kr                       |
| Apple, Play og domene      | 1 500 kr                   | 1 500 kr                    | 1 500 kr                        |
| **Sum drift**              | **omtrent 6 500 kr**       | **omtrent 16 000 kr**       | **omtrent 87 000 kr**           |
| **Per skole**              | 6 500 kr                   | **1 600 kr**                | **870 kr**                      |

> **Det viktigste i denne tabellen:** De faste kostnadene dominerer på én skole og forsvinner nesten helt på ti. Marginal kostnad for skole nummer elleve er under 1 000 kroner i året. Det betyr at du kan gi bort piloten, og at prisingen din ikke trenger å ta hensyn til driftskostnader i det hele tatt. Den eneste kostnaden som skalerer med kundemassen er din egen tid til støtte.

**11.4 Verktøykostnader for deg som utvikler**

| **Verktøy**                | **Pris**                       | **Vurdering**                                                                 |
|----------------------------|--------------------------------|-------------------------------------------------------------------------------|
| Cursor Pro                 | omtrent 210 kr per måned       | Anbefalt. Se kapittel 12                                                      |
| Claude Pro eller Max       | 200 til 2 000 kr per måned     | Pro holder til å begynne med. Max hvis du bruker Claude Code tungt hver kveld |
| Firebase i utviklingsmiljø | 0 kr                           | Eget prosjekt på gratisnivå                                                   |
| **Sum**                    | **400 til 2 200 kr per måned** | Dette er den eneste faste utgiften som betyr noe før du har kunder            |

**11.5 Den kostnaden som faktisk betyr noe**

Din tid. Med 15 timer i uken og 20 uker til en pilot i drift, snakker vi om 300 timer. Til en alternativ timepris på 800 kroner er det 240 000 kroner i alternativkostnad. Det er ikke et argument mot å gjøre det, men det er et argument for å ikke bygge noe som ikke bidrar til at oppdraget blir fylt.

**11.6 Verdien for skolen, og hva du kan ta betalt**

Regnestykket som selger produktet:

> Tid brukt på vikarinnkalling i dag:
>
> 45 min/dag × 190 dager = 143 timer/år
>
> Kostnad for kommunen
>
> ved omtrent 500 kr/time inkl. sosiale kostnader
>
> = 71 000 kr/år
>
> Etter systemet:
>
> 10 min/dag × 190 dager = 32 timer/år
>
> = 16 000 kr/år
>
> Ren tidsbesparelse = 55 000 kr/år
>
> I tillegg, ikke prissatt her:
>
> høyere fyllingsgrad = færre delte klasser
>
> bedre match = bedre undervisning
>
> mindre stress for én navngitt person

| **Prismodell**               | **Nivå**              | **Kommentar**                                                               |
|------------------------------|-----------------------|-----------------------------------------------------------------------------|
| Per skole, årlig             | 15 000 til 30 000 kr  | Enklest å forstå. Skalerer dårlig mellom en skole på 90 elever og en på 600 |
| Per elev, årlig              | 40 til 70 kr per elev | Rettferdigere, og en modell kommuner er vant til fra andre skolesystemer    |
| Per kommune, med trappetrinn | 80 000 til 400 000 kr | Lettest å selge, og holder seg innenfor direktekjøpsgrensen på 500 000 kr   |
| Pilot                        | 0 kr i ett skoleår    | Mot at du får bruke dem som referanse og får tilgang til data               |

> **Anbefaling:** Per elev per år, med et gulv og et tak. For eksempel 55 kroner per elev, minimum 12 000 og maksimum 35 000 kroner per skole. En kommune med 3 000 elever lander da på rundt 165 000 kroner, trygt under direktekjøpsgrensen, og under en tredel av hva de sparer i ren tid.

**12. Utviklingsmiljø og arbeidsflyt**

Du ba om det miljøet som gir best tilgang til AI-verktøy. Det korte svaret er at du bør bruke to ting samtidig, og at de løser ulike oppgaver.

**12.1 Anbefalt oppsett**

| **Verktøy**                  | **Rolle**             | **Hvorfor**                                                                                                                                                                                               |
|------------------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Cursor**                   | Din daglige editor    | Bygget på VS Code, så Flutter- og Dart-utvidelsene fungerer og du kjenner deg igjen umiddelbart. Innebygd autofullføring som holder deg i flyt, og en agentmodus som er god på én til tre filer om gangen |
| **Claude Code i terminalen** | Tungt arbeid          | Refaktorering på tvers av mange filer, feilsøking der årsaken ligger et annet sted enn symptomet, og generering av testsuiter. Kjør det i Cursors innebygde terminal, så jobber begge på samme kodebase   |
| **Android Studio**           | Beholdes ved siden av | Flutter DevTools, widgetinspektøren, emulatorstyring og profilering er fortsatt best her. Du trenger ikke skrive kode i det, men du vil ha det åpent når du jakter på et layoutproblem                    |
| **Firebase Emulator Suite**  | Lokalt testmiljø      | Kjør Firestore, Auth og Functions lokalt. Uunnværlig når du skal teste bølger og frister uten å vente en time i sanntid                                                                                   |

**12.2 Hvordan du deler arbeidet mellom dem**

| **Oppgave**                                                            | **Verktøy**                                       |
|------------------------------------------------------------------------|---------------------------------------------------|
| Skrive en ny widget, justere layout, små endringer                     | Cursor, inline                                    |
| Lage en ny Cloud Function etter et mønster som allerede finnes         | Cursor, agentmodus                                |
| Implementere hele matchemotoren fra spesifikasjonen i dette dokumentet | Claude Code, med kapittel 7 limt inn som kontekst |
| «Denne testen feiler og jeg skjønner ikke hvorfor»                     | Claude Code                                       |
| Skrive tester for en modul som ikke har noen                           | Claude Code                                       |
| Bytte SMS-leverandør på tvers av hele kodebasen                        | Claude Code                                       |
| Finne ut hvorfor en liste hakker ved rulling                           | Android Studio med DevTools                       |

**12.3 To praktiske forutsetninger**

- **Dart- og Flutter-utvidelsene i Cursor.** Cursor er en VS Code-variant, og utvidelser derfra installeres normalt uten problemer, men de offisielle Dart-utvidelsene har til tider hatt begrensninger på distribusjon til varianter. Test dette den første kvelden. Hvis det knirker, finnes utvidelsene også via OpenVSX, og alternativet er å skrive Dart i Android Studio og TypeScript i Cursor.

- **En CLAUDE.md i rota av prosjektet.** Dette er den enkeltinvesteringen som gir mest tilbake. Skriv inn arkitekturvalgene fra dette dokumentet, navnekonvensjonene dine, hvordan du vil ha feilhåndtering, og hva som absolutt ikke skal endres. Da slutter AI-verktøyene å foreslå løsninger som ikke passer i prosjektet.

**Forslag til innhold i CLAUDE.md**

> \# Vikarmotor
>
> \## Arkitekturregler
>
> \- Matchemotoren i lib/domain/matching/ er en ren funksjon.
>
> Ingen Firebase-import, ingen DateTime.now(), ingen I/O.
>
> Klokken sendes alltid inn som parameter.
>
> \- All statusendring på shifts skjer kun i Cloud Functions.
>
> Firestore-regler nekter klientskriving til status-feltet.
>
> \- SMS går alltid gjennom SmsGateway-grensesnittet.
>
> Aldri direkte kall til leverandørens API fra domenekode.
>
> \- Alle modellkall gjennom functions/src/ai/. Aldri fra klient.
>
> \## Konvensjoner
>
> \- Domenespråk på norsk (shift, offer, substitute beholdes engelsk
>
> i kode, men fag, trinn og rolle er norske verdier).
>
> \- Tester ligger ved siden av filen de tester.
>
> \- Ingen nye pakker uten at jeg har godkjent det.
>
> \## Kommandoer
>
> \- flutter test
>
> \- cd functions && npm test
>
> \- firebase emulators:start

**12.4 Repostruktur**

> vikarmotor/
>
> app/ Flutter, mobil og web
>
> lib/
>
> domain/ delt domenemodell, ren Dart
>
> matching/ poengfunksjon og tildeling
>
> features/ vikar/, laerer/, admin/
>
> data/ Firestore-repositorier
>
> functions/ Cloud Functions, TypeScript
>
> src/
>
> matching/ speiling av domain/matching
>
> dispatch/ bolger, utsending, SMS
>
> ai/ modellkall, prompter
>
> scheduled/ nattlige jobber
>
> shared/ JSON-skjema for datamodellen
>
> docs/ dette dokumentet, personvernvurdering
>
> CLAUDE.md
>
> **Viktig arkitekturbeslutning:** Matchemotoren finnes i to språk: Dart i appen for forhåndsvisning i admin-grensesnittet, og TypeScript i Cloud Functions for den faktiske kjøringen. Det er duplisering, og det er greit, men da må testdataene være delte. Legg testtilfellene som JSON i shared/ og kjør samme sett mot begge implementasjonene. Alternativt: dropp Dart-versjonen og la forhåndsvisningen kalle en Cloud Function. Enklere, litt tregere, og sannsynligvis riktig valg for MVP.

**13. Gjennomføringsplan uke for uke**

Planen forutsetter 10 til 20 timer i uken, i snitt 15. Ukene er nummerert fra oppstart. Rekkefølgen er valgt slik at du har noe kjørbart tidligst mulig, og slik at det du bygger først er det du lærer mest av.

**13.1 Fase 0: Kartlegging (uke 1 til 2, omtrent 25 timer)**

| **Uke** | **Oppgaver**                                                                                                                                                | **Leveranse**                                |
|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| 1       | Møte 1 og 2 med mor. Tegn dagens prosessflyt. Samle inn vikarliste, timeplan og fraværshistorikk. Anonymiser alt.                                           | Prosesskart og rådata i et regneark          |
| 2       | Møte 3: ti scenarioer for kalibrering. Skriv regelboken: alle harde filtre, alle unntak. Sett opp Firebase-prosjekt i europe-north1, git-repo og CLAUDE.md. | Skriftlig regelbok, tomt prosjekt som bygger |

**13.2 Fase 1: Kjernen (uke 3 til 8, omtrent 90 timer)**

| **Uke** | **Oppgaver**                                                                                                                                         | **Leveranse**                                                    |
|---------|------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| 3       | Datamodellen i Firestore. Sikkerhetsregler. Importskript for vikarliste og timeplan fra CSV. Auth med telefonnummer eller epost.                     | Ekte data ligger i basen                                         |
| 4       | Matchemotoren, del 1: harde filtre og poengfunksjon, som ren TypeScript uten Firebase. Enhetstester mot håndlagde tilfeller.                         | Testdekket scorefunksjon                                         |
| 5       | Matchemotoren, del 2: global tildeling med ungarsk algoritme. Simulator som kjører hele fraværshistorikken gjennom motoren og skriver ut statistikk. | **Milepæl: du kan måle algoritmen mot tolv måneder virkelighet** |
| 6       | Behovsbygger (fravær til oppdrag via timeplan). Bølgeplanlegger. Cloud Tasks for utsatt utsending. Statusmaskinen.                                   | Oppdrag opprettes og planlegges automatisk                       |
| 7       | Utsenderen: FCM push med handlingsknapper, SMS via Sveve, dyplenke med engangstoken, svarhåndtering med transaksjon.                                 | **Milepæl: første ekte forespørsel sendt til din egen telefon**  |
| 8       | Eskaleringen: frist, varsel, skjerm med rangert liste og begrunnelser. Kill switch og døgnvolumtak.                                                  | Full løkke fra fravær til eskalering                             |

**13.3 Fase 2: Klienter og skyggedrift (uke 9 til 12, omtrent 60 timer)**

| **Uke** | **Oppgaver**                                                                                                                                                                  | **Leveranse**                                                      |
|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| 9       | Vikarappen i Flutter: forespørselsskjerm, ja og nei, mine oppdrag, sett meg utilgjengelig, mine data.                                                                         | App som kan installeres via TestFlight og intern testing           |
| 10      | Lærerappen: meld fravær med dato, tidsrom og fritekst. Kvittering som forklarer hva som skjer videre.                                                                         | To brukergrupper dekket                                            |
| 11      | Admin-webappen, minimumsversjon: dagens oversikt, manuell tildeling, vikarregister, av og på per filter.                                                                      | Rektor kan bruke systemet                                          |
| 12      | **Skyggedrift starter.** Mor melder fravær inn i systemet parallelt med dagens rutine. Systemet regner ut hvem det ville spurt, men sender ingenting. Du sammenligner daglig. | **Milepæl: dokumentert treffsikkerhet mot menneskelig beslutning** |

> **Ikke hopp over uke 12:** Skyggedrift er den billigste måten å finne ut at algoritmen er feil på. Hvis systemet i to uker foreslår det samme som rektor ville valgt i 70 prosent av tilfellene, er du klar. Hvis det treffer på 30 prosent, har du lært noe helt avgjørende uten å ha brent tilliten til en eneste vikar.

**13.4 Fase 3: Pilot i drift (uke 13 til 20, omtrent 100 timer)**

| **Uke**   | **Oppgaver**                                                                                                                                               | **Leveranse**                                    |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| 13        | Justering etter skyggedrift. Rekalibrering av vekter. Personvernvurdering skrevet. Databehandleravtale signert med kommunen.                               | Juridisk klarert                                 |
| 14        | Onboarding av vikarene: informasjonsmøte, appinstallasjon, samtykke til varsler, verifisering av profildata. Regn med at dette tar lengre tid enn du tror. | Vikarene er med                                  |
| 15        | **Pilot dag 1.** Start med én rolle eller ett trinn, ikke hele skolen. Vær tilgjengelig hver morgen klokken 06:30 i to uker.                               | **Milepæl: første ekte oppdrag fylt automatisk** |
| 16 til 17 | Daglig oppfølging og raske rettelser. Ukentlig samtale med rektor og med to eller tre vikarer. Logg alt som går galt.                                      | Feilliste som krymper                            |
| 18        | Utvid til hele skolen. AI-tolking av fritekst slås på.                                                                                                     | Full dekning på én skole                         |
| 19 til 20 | Mål og dokumenter: tid spart, fyllingsgrad, automatisk dekningsgrad, fordeling. Skriv en to siders casebeskrivelse.                                        | **Milepæl: dokumentert gevinst du kan selge på** |

**13.5 Fase 4: Læring og modenhet (uke 21 til 30)**

| **Uke**   | **Oppgaver**                                                                                                                  |
|-----------|-------------------------------------------------------------------------------------------------------------------------------|
| 21 til 22 | Nattlig statistikkjobb. Historikkfeltene i vikarprofilen begynner å fylles med ekte data                                      |
| 23 til 24 | Vektkalibrering mot historikken. Forhåndsvisningen i admin-flaten («slik ville disse tjue oppdragene blitt rangert»)          |
| 25 til 26 | AI-assistert regeloversetting i webappen. «Mine data»-skjermen for vikarene. Innsyn og eksport                                |
| 27 til 28 | Flerskolestøtte i praksis: deling av vikarpool på tvers, rettighetsstyring per skole, administrator på kommunenivå            |
| 29 til 30 | Universell utforming gjennomgått mot WCAG. Feilovervåkning, varsling ved driftsavvik, sikkerhetskopi og gjenoppretting testet |

**13.6 Fase 5: Skalering (fra måned 8)**

- Skole to og tre i samme kommune, denne gangen betalende.

- Selskapsetablering hvis du ikke allerede har gjort det.

- Én kommune med fem til ti skoler som referansekunde.

- Standardisert onboarding: importmal, oppstartsmøte, opplæringsvideo på ti minutter.

- Først nå: integrasjon mot Visma Flyt Skole eller IST, og Feide.

**14. Pilot og salg mot offentlig sektor**

Du har allerede erfaring med B2G-salg, så dette kapittelet holder seg til det som er spesielt for skolesektoren.

**14.1 Beslutningskjeden i en kommune**

| **Rolle**                                        | **Bryr seg om**                                                                 | **Hva du gir dem**                                                                                                                            |
|--------------------------------------------------|---------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Rektor                                           | At morgenen blir roligere og at klassene blir dekket                            | Demoen. Tallene fra piloten. En kollegas anbefaling                                                                                           |
| Kommunalsjef for oppvekst                        | Kostnad, likebehandling mellom skoler, at det ikke blir en sak                  | Casebeskrivelsen, kostnadssammenligning, at det virker på tvers av skoler                                                                     |
| IT-avdelingen                                    | Sikkerhet, drift, integrasjoner, at det ikke blir deres problem                 | Arkitekturbeskrivelse, at dere driftes i EU, at dere ikke krever noe av deres infrastruktur                                                   |
| Personvernombudet                                | Databehandleravtale, DPIA, hvor data ligger, underleverandører                  | Ferdig utfylt dokumentasjon. Dette er der du vinner eller taper måneder                                                                       |
| Innkjøp                                          | Om det må konkurranseutsettes                                                   | At prisen er under 500 000 kroner                                                                                                             |
| Tillitsvalgt (Utdanningsforbundet, Fagforbundet) | At vikarene ikke blir styrt av en svart boks, og at oppdrag fordeles rettferdig | **Ta dem med tidlig.** Vis dem fordelingsstatistikken og «mine data»-skjermen. De kan bli din beste ambassadør, eller din største bremsekloss |

> **Undervurdert råd:** Snakk med tillitsvalgt før du snakker med kommunalsjefen. Et system som fordeler arbeid automatisk er noe fagforeningene har god grunn til å være skeptiske til. Hvis du kommer til dem med åpenhet, innsynsrett og rettferdighetsstatistikk allerede innebygd, snur skepsisen til støtte. Hvis de hører om det først når kommunen har bestemt seg, blir det en kamp.

**14.2 Pilotavtalen**

Skriv en kort avtale på én side som gir deg det du trenger:

- Gratis bruk i ett skoleår.

- Skolen forplikter seg til å måle og rapportere tidsbruk før og etter.

- Du får bruke dem som referanse, med navn.

- Du får bruke anonymiserte data til å forbedre produktet, tydelig avgrenset i databehandleravtalen.

- Opsjon på ordinær avtale til avtalt pris etter piloten, slik at prisdiskusjonen er tatt på forhånd.

- Gjensidig oppsigelse med 30 dagers varsel, slik at ingen føler seg låst.

**14.3 Habilitet**

At mor er rektor er en enorm fordel, men det er også noe du må håndtere åpent. Når kommunen senere skal kjøpe, kan familieforholdet bli et spørsmål om habilitet. Gjør dette nå:

- Vær åpen om forholdet i all skriftlig kommunikasjon med kommunen fra første dag.

- Sørg for at hun ikke er den som signerer en betalt avtale eller sitter i en innkjøpsvurdering som gjelder deg.

- Få pilot nummer to på en skole uten familiebånd så tidlig som mulig, helst i uke 20 til 26. Det fjerner spørsmålet og gir deg samtidig en referanse som veier tyngre.

**14.4 Salgsmateriellet du trenger**

| **Dokument**                                     | **Lengde**        | **Når**         |
|--------------------------------------------------|-------------------|-----------------|
| Casebeskrivelse fra piloten                      | 2 sider           | Uke 20          |
| Hvordan matchingen virker, forklart uten formler | 1 side            | Uke 13          |
| Personvern og databehandling                     | 3 til 5 sider     | Uke 13          |
| Arkitektur og drift, for IT-avdelinger           | 2 sider           | Før kommunesalg |
| Priskalkulator                                   | Regneark          | Før kommunesalg |
| Demo på 10 minutter                              | Manus og testdata | Uke 16          |

**15. Risikoer og hvordan du møter dem**

| **Risiko**                                              | **Sannsynlighet**      | **Konsekvens**                                                                                 | **Tiltak**                                                                                                                             |
|---------------------------------------------------------|------------------------|------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| **Vikarene tar ikke i bruk appen**                      | Høy                    | Kritisk. Uten vikarer på app faller push bort, kostnadene stiger og opplevelsen blir dårligere | SMS med dyplenke må fungere helt uten app. Appen skal være en forbedring, aldri en forutsetning. Hold onboarding til under to minutter |
| Systemet fyller færre oppdrag enn rektor gjorde manuelt | Middels                | Kritisk. Da er produktet verdiløst                                                             | Skyggedrift i uke 12. Ikke gå i drift før treffsikkerheten er dokumentert                                                              |
| Timeplandata er rotete eller utdaterte                  | Høy                    | Middels. Feil oppdrag blir generert                                                            | Bygg en valideringsrutine ved import. La administrator godkjenne genererte oppdrag i de første ukene før utsending                     |
| Du brenner ut på et sideprosjekt                        | Middels                | Kritisk                                                                                        | Hold fasene korte. Ha noe kjørbart i uke 7. Ta en uke fri etter hver fase. Ikke utvid omfanget mellom fasene                           |
| Kommunens IT eller personvernombud stopper det          | Middels                | Høy. Kan forsinke med måneder                                                                  | Ta kontakt med dem i uke 13, ikke i uke 30. Ha dokumentasjonen klar                                                                    |
| Fagforeningen motsetter seg automatisk fordeling        | Middels                | Høy                                                                                            | Se 14.1. Involver tillitsvalgt tidlig, bygg innsyn og fordelingsstatistikk                                                             |
| Feil i bølgelogikken sender hundrevis av meldinger      | Lav                    | Høy. Omdømme og penger                                                                         | Døgnvolumtak per skole, kill switch, hviteliste i testmiljø, varsel til deg ved avvik                                                  |
| To vikarer får samme oppdrag                            | Lav hvis du følger 7.6 | Høy. Tillitsbrudd hos både skole og vikar                                                      | Transaksjon i databasen, aldri i appen. Skriv en test som kjører 100 samtidige krav mot samme oppdrag                                  |
| Konkurrent lanserer det samme                           | Middels                | Middels                                                                                        | Din fordel er ikke koden, det er tilgangen til en rektor og dataene fra en ekte skole. Kjør fort til pilot                             |
| Firebase-kostnaden løper løpsk                          | Lav                    | Lav ved dette volumet                                                                          | Sett budsjettvarsel i Google Cloud fra dag én. Ta det på fem minutter nå                                                               |

**15.1 Den risikoen som er størst**

> **Vær ærlig med deg selv:** Den vanligste dødsårsaken for prosjekter som dette er ikke teknisk. Det er at du bruker uke 3 til 12 på å bygge en vakker app, og aldri kommer til uke 15 der en ekte vikar får en ekte melding. Sett en hard frist: første ekte forespørsel sendt til din egen telefon innen uke 7. Hvis du ikke er der, kutt omfang, ikke utsett datoen.

**16. De neste sju dagene**

Konkret, i rekkefølge:

1.  **Avtal tre møter med mor**, med datoene i kalenderen. Bruk intervjuguiden i vedlegg A.

2.  **Be om rådataene i dag**: vikarlisten, timeplanen, og fraværshistorikk for siste skoleår. Det er dette som tar lengst tid å få tak i, så start klokken nå.

3.  **Be henne logge tidsbruk i to uker.** Bare et ark ved siden av telefonen: dato, hvor mange minutter, hvor mange oppdrag, hvor mange som ble dekket. Uten dette utgangspunktet kan du aldri bevise gevinsten.

4.  **Opprett Firebase-prosjektet** i region europe-north1. Denne avgjørelsen kan ikke endres senere. Sett budsjettvarsel med en gang.

5.  **Opprett git-repoet** med strukturen i 12.4, og skriv CLAUDE.md før du skriver noe annet.

6.  **Sett opp Cursor og Claude Code**, og verifiser at Dart- og Flutter-utvidelsene fungerer i Cursor. Ta det den første kvelden, så du vet det.

7.  **Skriv ned de ti scenarioene** til kalibreringsmøtet. Hvert scenario: et oppdrag, tre kandidater med ulike profiler, og et spørsmål om hvem hun ville ringt og hvorfor.

Ikke skriv produksjonskode denne uken. Den koden du skriver før du forstår regelboken, kommer du til å slette.

**Vedlegg A: Intervjuguide til mor**

**Møte 1: Hvordan gjør dere det i dag?**

- Ta meg gjennom en helt vanlig morgen der to lærere er syke. Fra du våkner til det er løst.

- Hvem melder fravær til hvem, og hvordan? Telefon, SMS, app, epost?

- Hvor mange fraværsmeldinger får dere en typisk uke? Og i en dårlig uke i februar?

- Hvor mange av dem trenger faktisk en vikar utenfra?

- Hvor lang tid tar det deg, eller den som har oppgaven, på en typisk dag?

- Hva gjør dere når dere ikke finner noen? Hvor ofte skjer det?

- Hvor mange vikarer står på listen? Hvor mange av dem bruker dere faktisk?

- Hvem er den beste vikaren dere har, og hva gjør henne best?

- Hva er det verste som har skjedd med en vikar? Hva burde systemet ha fanget opp?

- Hvis du fikk fjernet én ting ved denne oppgaven, hva ville det vært?

**Møte 2: Regelboken**

- Hvilke fag eller klasser krever at vikaren har formell kompetanse? Hvem avgjør det?

- Er det noen vikarer dere ikke bruker i bestemte klasser? Hvorfor, og hvordan huskes det i dag?

- Finnes det maksgrenser for hvor mye en vikar kan jobbe? Hvem passer på det?

- Hva må være oppfylt før noen i det hele tatt kan settes inn? Politiattest, taushetserklæring, annet?

- Hvor lenge er en politiattest gyldig hos dere i praksis?

- Er det klasser med elever som trenger en kjent voksen? Hvordan håndteres det?

- Når slår dere sammen grupper i stedet for å hente vikar? Hva er terskelen?

- Hvilke interne ressurser kan settes inn før dere ringer ut? Ledige lærere, ledelsen, andre?

- Når på døgnet er det greit å kontakte vikarer, og når er det ikke det?

**Møte 3: Kalibrering**

Ti scenarioer, bygget på ekte situasjoner fra historikken. For hvert: presenter oppdraget og tre kandidater med ulike styrker, og be henne velge og begrunne. Noter begrunnelsen ordrett.

Eksempel på et scenario:

> Oppdrag: 6A, mandag 08:30-13:00, matematikk og norsk.
>
> Klassen har to elever med vedtak om tilrettelegging.
>
> Kandidat A: Utdannet lærer med matematikk. Har aldri vært på
>
> skolen før. Svarer vanligvis raskt.
>
> Kandidat B: Ufaglært, men har hatt 6A elleve ganger i høst.
>
> Kjenner elevene godt. Svarer ofte sent.
>
> Kandidat C: Utdannet lærer uten matematikk i fagkretsen.
>
> Har vært på skolen seks ganger, ikke i 6A.
>
> Hvem ringer du først? Hvorfor? Hva om det hadde vært fredag?
>
> Hva om klassen ikke hadde hatt elever med vedtak?

Svarene her er det som setter vektene i 7.3. Hvis hun konsekvent velger B, vet du at klassekjennskap veier tyngre enn fagkompetanse på denne skolen, og da skal vektene reflektere det.

**Vedlegg B: Poengfunksjonen i pseudokode**

Utgangspunkt for implementeringen i uke 4. Skrevet som TypeScript, men logikken er den samme i Dart.

> type Vekter = {
>
> fag: number; klasse: number; sannsynlighetJa: number;
>
> pålitelighet: number; fordeling: number;
>
> preferanse: number; nærhet: number;
>
> };
>
> export function score(
>
> k: Kandidat, o: Oppdrag, ctx: Kontekst, w: Vekter
>
> ): Resultat {
>
> // --- harde filtre, returnerer null hvis kandidaten er ute ---
>
> const sperre = hardeFiltre(k, o, ctx);
>
> if (sperre) return { score: 0, utelukket: sperre };
>
> // --- fagkompetanse ---
>
> const fag = o.fag.length === 0 ? 0.5
>
> : gjennomsnitt(o.fag.map(f =\> fagTreff(k, f, o.trinn)));
>
> // fagTreff: 1.0 eksakt fag+trinn, 0.6 fag men feil trinn,
>
> // 0.4 beslektet fag, 0.1 ingen treff
>
> // --- klassekjennskap, med metning og tidsforvitring ---
>
> const h = k.historikk.klasseKjennskap\[o.klasse\];
>
> const vektetAntall = h
>
> ? sum(h.datoer.map(d =\> 0.5 \*\* (dagerSiden(d, ctx.naa) / 120)))
>
> : 0;
>
> const klasse = 1 - Math.exp(-vektetAntall / 4);
>
> // --- sannsynlighet for ja ---
>
> // Bayesiansk utjevning: nye vikarer trekkes mot 0.5
>
> const n = k.historikk.forespurtTotalt;
>
> const jaRate = (k.historikk.akseptert + 5 \* 0.5) / (n + 5);
>
> const dagJustering = ukedagFaktor(k, o.dato);
>
> const sannsynlighetJa = clamp01(jaRate \* dagJustering);
>
> // --- pålitelighet ---
>
> const pålitelighet = clamp01(
>
> 0.6 \* k.historikk.oppmoetesRate
>
> \+ 0.2 \* (1 - k.historikk.avlysteSentRate)
>
> \+ 0.2 \* (k.historikk.skolensVurdering / 5)
>
> );
>
> // --- fordeling: avvik fra forventet andel, ikke fra snitt ---
>
> const forventet = k.preferanser.dagerPerUke / ctx.sumØnskedeDager;
>
> const faktisk = k.historikk.oppdragSiste30d
>
> / Math.max(1, ctx.sumOppdragSiste30d);
>
> const fordeling = clamp01(0.5 + (forventet - faktisk) \* 5);
>
> // --- preferansetreff ---
>
> const preferanse = gjennomsnitt(\[
>
> k.preferanser.ukedager.includes(ukedag(o.dato)) ? 1 : 0.3,
>
> innenforTid(k.preferanser, o) ? 1 : 0.2,
>
> k.preferanser.foretrukneTrinn.includes(o.trinn) ? 1 : 0.5,
>
> \]);
>
> // --- nærhet ---
>
> const nærhet = clamp01(1 - (k.reisetidMin\[o.skoleId\] ?? 20) / 45);
>
> // --- utforskningstillegg for nye vikarer ---
>
> const nybegynner = n \< 10 ? 0.05 \* (1 - n / 10) : 0;
>
> const total =
>
> w.fag \* fag
>
> \+ w.klasse \* klasse
>
> \+ w.sannsynlighetJa \* sannsynlighetJa
>
> \+ w.pålitelighet \* pålitelighet
>
> \+ w.fordeling \* fordeling
>
> \+ w.preferanse \* preferanse
>
> \+ w.nærhet \* nærhet
>
> \+ nybegynner;
>
> return {
>
> score: Math.round(clamp01(total) \* 100),
>
> ledd: { fag, klasse, sannsynlighetJa, pålitelighet,
>
> fordeling, preferanse, nærhet },
>
> // leddene lagres i decisions-samlingen og brukes til
>
> // å generere begrunnelsen i eskaleringen
>
> };
>
> }

**Tildelingen**

> export function tildel(
>
> oppdrag: Oppdrag\[\], kandidater: Kandidat\[\],
>
> ctx: Kontekst, w: Vekter, plasserPerOppdrag: number
>
> ): Tildeling\[\] {
>
> // 1. Score alle par
>
> const M: number\[\]\[\] = \[\]; // rad = kandidat, kol = oppdragsplass
>
> const kolonneTilOppdrag: number\[\] = \[\];
>
> oppdrag.forEach((o, j) =\> {
>
> for (let p = 0; p \< plasserPerOppdrag; p++)
>
> kolonneTilOppdrag.push(j);
>
> });
>
> kandidater.forEach((k, i) =\> {
>
> M\[i\] = kolonneTilOppdrag.map(j =\> {
>
> const r = score(k, oppdrag\[j\], ctx, w);
>
> return r.utelukket ? Infinity : 100 - r.score;
>
> });
>
> });
>
> // 2. Løs som tildelingsproblem.
>
> // Hver kandidat får høyst ÉN plass. Det er denne
>
> // begrensningen som løser «samme fem lærere»-problemet.
>
> const par = ungarskAlgoritme(M);
>
> // 3. Filtrer bort par med uendelig kostnad
>
> return par
>
> .filter((\[i, kol\]) =\> M\[i\]\[kol\] !== Infinity)
>
> .map((\[i, kol\]) =\> ({
>
> kandidat: kandidater\[i\],
>
> oppdrag: oppdrag\[kolonneTilOppdrag\[kol\]\],
>
> score: 100 - M\[i\]\[kol\],
>
> }));
>
> }
>
> **Test som må skrives i uke 5:** Seks oppdrag, tjue kandidater der fem scorer høyt på alt. Kjør tildelingen. Verifiser at ingen kandidat får mer enn én forespørsel, at alle seks oppdrag får kandidater, og at det totale scoresummen er høyere enn en grådig per-oppdrag-tilnærming ville gitt. Denne ene testen er beviset på at kjernen i produktet virker.

**Vedlegg C: Kilder**

Priser og regelverk er hentet i september 2026 og bør verifiseres før de brukes i tilbud eller avtaler.

| **Tema**                                        | **Kilde**                                                                              |
|-------------------------------------------------|----------------------------------------------------------------------------------------|
| SMS-priser og abonnement                        | sveve.no/tjenester                                                                     |
| SMS-priser Norge, internasjonal leverandør      | twilio.com/en-us/sms/pricing/no                                                        |
| Firestore-priser og gratisnivå                  | cloud.google.com/firestore/pricing                                                     |
| Priser på modell-API                            | platform.claude.com/docs/en/about-claude/pricing                                       |
| KI-forordningen, vedlegg III og utsatte frister | artificialintelligenceact.eu/annex/3, samt forordning (EU) 2026/1744                   |
| Personvernforordningen artikkel 22              | lovdata.no, personopplysningsloven, og datatilsynet.no om automatiserte avgjørelser    |
| Databehandleravtaler for skoler                 | datatilsynet.no, «Databehandleravtale for skoler»                                      |
| Kompetansekrav i skolen                         | lovdata.no, opplæringslova kapittel 17, og udir.no                                     |
| Terskelverdier for offentlige anskaffelser      | arbinn.nho.no og regjeringen.no. Innslagspunktet hevet til 500 000 kr fra 1. juli 2026 |
| Konkurrent                                      | laerervikaren.no                                                                       |
| Konkurrent                                      | vikarsystemet.no                                                                       |

*Dokumentet er et arbeidsgrunnlag, ikke en fasit. Tallene i kapittel 11 skal erstattes med skolens egne så snart du har dem, og kapittel 10 bør leses gjennom av noen med juridisk kompetanse før første betalende kunde.*
