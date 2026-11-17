# Åpne spørsmål

Spørsmål som må avklares før eller underveis. Når et spørsmål er besvart: skriv svaret
og datoen, og lag et beslutningsnotat hvis det påvirker arkitekturen.

## Venter på skolen (intervju med rektor)

1. **Status «vil ha hjelp».** Skissene viser en status der en assistent ønskes, oppdraget
   er åpent for alle og det ikke er noen frist (skisse 01: «Åpent for alle · ingen
   frist»). Den finnes ikke i planen. Er det en egen oppdragstype, en egen status i
   statusmaskinen, eller et flagg på oppdraget? Påvirker matching og eskalering.
2. **Faktiske harde filtre, kompetansekrav og vekter.** Standardverdiene i CLAUDE.md er
   midlertidige. Plan vedlegg A (møte 2 og 3) er intervjuguiden.
3. **Importformat for timeplan og vikarliste.** Hva kan skolen eksportere, og i hvilket
   format (CSV, Excel, Visma)?

## Produkt og design

4. **Hva ser en vikar av skolens dag?** Skisse 01 viser alle dagens timer, også dekkede
   timer med navnet på en annen vikar («Vikar: Kari Nes»). Hvor mye skal en vikar se av
   andres oppdrag? Påvirker personvern og Firestore-reglene.
5. **Innlogging i admin-web.** Telefonnummer som i mobilappen, eller e-post?
6. **Svarsiden fra SMS-lenken.** Bør trolig være lett HTML fra Hosting eller en
   function, ikke Flutter Web, fordi Flutter Web er tungt å laste på mobildata tidlig
   om morgenen.

## Domene og algoritme

7. **Kritisk hastegrad mot regel 3.** «Alle kvalifiserte i én utsending» kolliderer med
   «høyst én forespørsel per kandidat per bølge» når flere kritiske oppdrag trenger de
   samme folkene. Hvilken regel vinner?
8. **Statuser på tilbud (offers).** Planen nevner `superseded`, `for_sent` og utløpt,
   men det finnes ingen statusmaskin for offers. Avklares i steg 2.

## Drift

9. **Region og runtime.** Sjekk før steg 12 at Firestore, Functions (2. gen), Cloud
   Scheduler og Cloud Tasks finnes i europe-north1, og om Node.js 24 fortsatt er
   forhåndsversjon (preview) i Cloud Functions (se decisions/0003).
