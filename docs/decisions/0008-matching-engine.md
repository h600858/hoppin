---
status: godkjent
dato: 2026-11-20
---

# 0008. Matchemotoren

## Kontekst

Matchemotoren er kjernen i produktet (plan kap. 7). Den skal være deterministisk,
forklarbar og testbar uten Firebase (regel 1 til 3), og den må løse at seks klasser
ikke skal mase på de samme fem vikarene.

## Beslutning

**Grense.** `match(input)` i `functions/src/matching/` er en ren funksjon. Inn kommer
klokken for kjøringen, tidssonen, skolens konfigurasjon, oppdragene i bølgen og
kandidatene med profil, historikk (`substituteStats`), opptatt tid og ubesvarte
tilbud. Ut kommer alle kandidater per oppdrag med utelukkelsesgrunn eller delscorer,
og hvem som er valgt, i samme form som `decisions`. Henting, lagring og SHA-256 av
inputen skjer utenfor motoren (steg 4), fordi `node:*` ikke er lov i `matching/`.
Tidspunkt er ISO-tekst som i skjemaene, så testtilfeller kan være ren JSON.

**Tid.** Lokal dato, ukedag og klokkeslett regnes fra UTC med `Intl` og skolens
tidssone. Testene dekker overgangen til og fra sommertid.

**Harde filtre** i fast rekkefølge, og bare det første som slår inn lagres:
politiattest, aktiv status, rolle, tidskollisjon, klassesperre, arbeidstid, formell
kompetanse, allerede spurt, ubesvart tilbud. Politiattest og aktiv status kan ikke slås
av. Politiattesten må utløpe etter oppdragsdagen.

**Formell kompetanse** (midlertidig, open-questions 2): lærerutdanning og faget på
trinnet med nivå 3. Begge deler ligger i `schoolConfigs.filters.formalCompetence`.

**Ubesvarte tilbud** (plan 7.4): en vikar med `maxOpenOffersPerSubstitute` ubesvarte
tilbud får ikke nye, unntatt for akutte og kritiske oppdrag. Nytt filter `open_offer`.

**Global tildeling** med egen min-kostnad maks-flyt, ingen pakke:
kilde → kandidat (kapasitet 1) → oppdrag (kapasitet 1, kostnad 100 minus score) →
sluk (kapasitet lik bølgestørrelsen). Kandidatkanten med kapasitet 1 gir høyst én
forespørsel per kandidat per kjøring. Kostnader regnes i heltall.

**Forrang ved knapphet.** Kritiske og akutte oppdrag får et kostnadstillegg som gjør
at de velger før rolige og normale.

**Kritisk hastegrad** (besvarer open-questions 7): én forespørsel per kandidat per
kjøring gjelder alltid. Et kritisk oppdrag får alle kvalifiserte som ikke er tatt av
et annet kritisk oppdrag.

**Determinisme.** Kandidater og oppdrag sorteres på ID før beregning, og like scorer
avgjøres av færrest oppdrag siste 30 dager, deretter ID. Samme input gir alltid samme
output, også med stokket rekkefølge.

**Kandidatutvalget** (hvilke vikarer som er med, også andre skoler ved
`sharesSubstitutePool`) bestemmes utenfor motoren.

## Konsekvenser

- Hele kjeden kan testes på millisekunder, og flyten bevises mot brute force på små
  tilfeller.
- Vekter, filtre og bølgetabell er konfigurasjon. Det eneste faste er rekkefølgen på
  filtrene og formen på poengfunksjonen.
- Nærhet har ingen data ennå og bruker en standard reisetid til vi har det.
