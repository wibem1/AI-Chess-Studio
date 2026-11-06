# Änderungen

## Noch nicht freigegeben – Browser-Spielengine (6. November 2026)

- Zusätzlicher begrenzter Stockfish-WASM-Worker im Browser, bestehende
  Desktop-Engine weiter auswählbar. Keine neue Version/Downloadfreigabe.
- Gemeinsame Historien-/Zugvalidierung, fünf Stufen, Abbruch und saubere
  Fehlerpause ohne automatischen Server-Fallback. Auswahl bleibt im JSON.
- Exakte versionierte Engine-Assets mit Lizenz/Quellverweis im Web-Build,
  restriktive Auslieferung und nur notwendige WebAssembly-/Worker-CSP.
- 86 Einzeltests und 43 Chromium-Browsertests bestanden, darunter echter
  Browser-Stockfish bei gesperrten Backend-APIs. Modell-/Schlüsseladapter und
  echte mobile Geräteabnahme bleiben offen.

## Noch nicht freigegeben – Partie verstehen (6. November 2026)

Anforderung aus Commit 2744e63e im bestehenden Lern-Tab umgesetzt. Keine neue
App-Versionsnummer oder Downloadfreigabe für diesen Entwicklungsstand.

- PGN aus Text/Datei, Farberkennung, drehbares Brett und konsistente Perspektive.
- Eigene Entscheidung vor Originalzug, dosierte Reflexionsfragen, gestufte
  Freigabe und unveränderte Originalpartie mit unabhängigen Analysezweigen.
- Uhren korrekt je Spielerseite; fehlende Zeiten bleiben unbekannt.
- Drei-/fünffache Wiederholung historisch geprüft, Faktencheck mit Zuggeschichte.
- Eigene Zusammenfassung und Sitzungsformat 2 mit Antworten, Notizen und Varianten;
  normale Format-1-Sitzungen bleiben importierbar.
- 80 Einzeltests und 38 Browsertests bestanden; reale Lichess-PGN und echte
  pädagogische KI-/Geräteabnahme noch offen. Keine kostenpflichtigen Anfragen.

## 0.2.0 – 6. November 2026

- Neue responsive Oberfläche mit Partie, Lernen, Varianten und Einstellungen.
- Gemeinsames Brett bleibt über die drei Lernbereiche erhalten; Einstellungen
  enthalten Schlüssel, Budget, Sitzungssicherung und Diagnose.
- Aufklappbare Zusatzwerkzeuge, kompakte Bretteingabe, direkter Partie-Einstieg.
- Desktop mit zwei Spalten, mobile Navigation fest unten; Tastatur und Direktlinks.
- Vorhandene Engine-, Dialog- und Speicherabläufe bleiben erhalten.
- 68 Einzeltests und 34 Chromium-Browsertests bestanden; echte lokale Engine,
  Modellzugriff mit Fixtures. Native Geräteabnahme und eigenständiger mobiler
  Backendbetrieb sind weiterhin offen. Kein Release/Deployment.

## 0.1.2 – 5. November 2026

- Schutz gegen Textmarkierung beim Ziehen normaler Seitentexte.
- Ziehen auf Text/Hintergrund verschiebt die Seite auch bei als Maus gelieferten
  Bewegungen; Eingaben und Brett behalten ihre eigene Bedienung.
- Gezielter Ablauf nach Schlüsselspeicherung geprüft; 68 Einzeltests und 31
  Chromium-Browsertests bestanden. Echte Windows-Touchabnahme bleibt offen.

## 0.1.1 – 5. November 2026

- Ständig sichtbare Scrollhilfe mit Hoch-/Runter-Tasten als Ausweichbedienung.
- Bedienungsdiagnose mit lokalem Textdateiexport ohne Eingabewerte/Schlüssel.
- 68 Einzeltests und 29 Chromium-Browsertests bestanden. Native Windows-
  Scrollursache weiterhin offen; keine bestätigte Behebung auf dem Nutzergerät.

## 0.1.0 – 5. November 2026

Erste nummerierte Entwicklungsversion nach den bisherigen unnummerierten Paketen.

- Versionsnummer oben in der App, im Browser-Titel, Startfenster und Diagnose.
- Windows-Paket, entpackter Ordner und Paketinformationen eindeutig nummeriert.
- Enthält die bisherigen Funktionen: Enginepartie, Lerndialog, Varianten,
  Mausziehen und Touch-Taps, lokaler Schlüssel, Kostenkontrolle und Diagnose.
- Enthält die bisherigen Korrekturen für fehlende Build-Werkzeuge, belegten
  Standardport, Touch-Scrollen auf dem Brett und sichtbare Speicherbestätigung.

68 Einzeltests und 27 Chromium-Browsertests bestanden. Native Windows-Touch-/
DPAPI-Abnahme und der dort gemeldete Scrollstillstand sind weiterhin offen.

Künftige Korrekturen erhöhen die dritte Zahl, neue Funktionen die zweite Zahl.
