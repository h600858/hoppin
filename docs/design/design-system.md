# Innhopp designsystem

Kilde: skissene i `docs/design/*.png` og mockupene i `docs/design/mockups/*.html`.
HTML-filene er referanser for utseende, ikke kode som skal kopieres. Alle verdier under skal ligge i `packages/ui` som ett Flutter-tema, og ingen widget skal ha hardkodede farger.

## Farger

| Token | Hex | Bruk |
|---|---|---|
| `bg` | #F3F9F5 | Bakgrunn i app og admin |
| `surface` | #FFFFFF | Kort, paneler, tabeller |
| `surfaceMuted` | #F8FBF9 | Bunnfelt i paneler |
| `border` | #DDE7E1 | Kantlinjer på kort og knapper |
| `divider` | #EEF3F0 | Skillelinjer mellom rader |
| `ink` | #16271F | Primær tekst, mørke knapper, admin-sidemeny |
| `inkSecondary` | #3E4B46 | Brødtekst i kort |
| `inkMuted` | #56635E | Metadata, tidspunkter, etiketter |
| `headerGreen` | #4CAE7D | Toppfelt i mobilappen. Tekst på denne er alltid `ink`, aldri hvit |
| `primary` | #2D7D5A | Primærknapp («Ja, jeg tar den»), lenker, avkrysning |
| `primaryPressed` | #1F5C41 | Trykket tilstand, tekst på `primarySoft` |
| `primarySoft` | #E6F3EA | Chips, «DEKKET», avatarbakgrunn |
| `navActive` | #24543E | Aktivt menypunkt i admin-sidemeny |
| `urgent` | #C1410D | «LEDIG», «ESKALERT», badge med hvit tekst |
| `urgentText` | #A8370B | Rød tekst på lys bakgrunn |
| `urgentSoft` | #FEF0E7 | Bakgrunn på ledige oppdrag |
| `urgentBorder` | #F1C6AA | Kant på ledige oppdrag |
| `help` | #6E4A06 | Tekst for «VIL HA HJELP» |
| `helpSoft` | #FDF5E0 | Bakgrunn for «VIL HA HJELP» |
| `helpBorder` | #E8D59E | Kant for «VIL HA HJELP» |
| `neutralSoft` | #F1F3F2 | «VENTER», «INGEN SVAR», «PAUSE» |
| `neutralText` | #4A5652 | Tekst på `neutralSoft` |

Status bruker alltid farge **og** tekst (WCAG): ledig, sendt ut, eskalert, vil ha hjelp, dekket, venter.

## Typografi

Font: **Figtree** (Google Fonts, pakken `google_fonts` eller bundlet som asset).

| Stil | Størrelse / vekt | Bruk |
|---|---|---|
| display | 28 til 32 / 800, letterSpacing -0.4 | Sidetitler, «Fraværet er meldt» |
| title | 19 / 700 | Toppfelt i mobil |
| cardTitle | 17 / 700 | «5B · Matematikk» |
| body | 15 til 17 / 400 til 600 | Brødtekst |
| meta | 13 til 14 / 400 til 600 | Tid, sted, metadata |
| label | 12 til 13 / 700, VERSALER, letterSpacing 0.6 | Seksjonsetiketter og statusbadges |

Støtt systemets tekststørrelse. Ingen fast skalering.

## Form og avstand

* Radius: kort 16, admin-paneler 18, inputfelt 12 til 14, badges 6, chips 7, pilleknapper 99.
* Avstand: 4, 8, 12, 16, 20, 24, 28, 36. Mobil sidemarg 16. Admin sidemarg 36.
* Berøringsmål minst 44×44. Primærknapper i mobil er 56 til 58 høye og fyller bredden.
* Ingen skygger. Kort skilles med `border`.

## Komponenter (lag disse i packages/ui)

* `StatusBadge(status)`: én farge og tekst per oppdragsstatus.
* `ShiftCard`: tid venstre (start fet, slutt dempet), klasse · fag, forklaring, bunnlinje med utsendingsstatus. Bakgrunn etter status.
* `PrimaryButton`, `SecondaryButton` (hvit med kant), `DangerOutlineButton` («Sett meg utilgjengelig»).
* `AppHeader`: grønt toppfelt, valgfri tilbakeknapp, skolenavn.
* `SectionCard` med versal etikett i `primary`.
* `ChipGroup` for fag og ukedager (valgt = `ink` fylt, ikke valgt = hvit med kant).
* Admin: `AdminShell` (mørk sidemeny 248 px + innhold), `KpiTile`, `DataTable`-rad, `ActivityFeed`.

## Skjermoversikt

Mobil (vikar): dagsoversikt, forespørsel (bunnark), profil, mine oppdrag.
Mobil (lærer): meld fravær, kvittering.
Felles mobil: innlogging med telefonnummer.
Web uten innlogging: svarside fra SMS-dyplenke.
Admin: dagens oversikt, eskalering, vikarregister. Senere: regler og vekter, timeplan, beslutningslogg.
