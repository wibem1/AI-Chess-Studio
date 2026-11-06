# Änderungen

## 0.5.1 – eindeutiges Speichern, keine Passwort-Mindestlänge

- Alte Passwortwiederherstellung separat unter dem Formular zugeklappt; neues
  Key-Speichern braucht kein früheres Passwort. Versteckte Zusatzfelder werden
  nicht automatisch als Passwort verwendet.
- Zehn-Zeichen-Vorgabe vollständig entfernt, auch für freiwilligen Zusatzschutz.
- Eindeutige Feld-/Freigabemeldungen statt nativer allgemeiner Passwortaufforderung.
- Speicherung erst nach Entschlüsseln der tatsächlich gespeicherten Kopie bestätigt;
  Eingabe erst bei Erfolg geleert, bei Fehlern für erneuten Versuch erhalten.

## 0.5.0 – Schlüssel ohne zusätzliches Passwort, Windows-Formulare

- API-Key standardmäßig im Browserprofil merken, ohne zusätzliches App-Passwort;
  verschlüsselt mit nicht exportierbarem CryptoKey in IndexedDB. Keine
  Provideranfrage durch Speichern oder Starten.
- Bestehende Passwortfächer bleiben lesbar; nach Entsperren ausdrücklich auf
  Speicherung ohne Zusatzpasswort umstellen. Optionaler Passwortschutz bleibt.
- Bedienungshilfe zusammenklappbar, damit Hilfstasten keine Formulare verdecken.
- Windows-Formulare bei vergrößerter Schrift ohne horizontalen Überlauf; schmale
  Einrichtungsbereiche ordnen Farbe und Spielstärke untereinander an.
- Profilmodus ist keine zusätzliche Zugangssperre und kein OS-Schlüsseltresor.
  Partien, Kosten und bisherige Schlüssel werden nicht gelöscht.

## 0.4.1 – Desktopbrett und neue Partie, 6. November 2026

- Desktopbrett größer und vollständig im Fenster: z. B. 450 statt 300 CSS-Pixel
  bei 1280×600. Status/Werkzeuge unter dem Brett; größere Figuren, ruhigere
  Karten und klassische Brettfarben. Kleine Touchansicht bleibt erhalten.
- Seitenleiste bei tatsächlich engem Inhalt unter das Brett, auch bei CSS-Zoom.
- „Neue Partie“ und „Partie starten“ beginnen in der Grundstellung mit gewählter
  Farbe/Stärke. Vorherige Partie samt Kommentaren/Varianten separat gesichert
  und sofort in der Partienliste sichtbar; fehlende Sicherung verhindert Reset.
- Zwei neue Browserfälle für Desktopgrößen, vollständige Sichtbarkeit und
  Neustart mit Wiederherstellung der Sicherung sowie Schwarz/Engine-Erstzug.

## 0.4.0 – ein Brett, Spielmodus und Lernmodus

- Großes gemeinsames Brett, zwei Modi statt vier Hauptbereiche. Umschalten
  pausiert/reaktiviert den Spielgegner; unveränderte Partie und Lernzweig bleiben
  getrennt. Bei unveränderter Partiestellung wird der Lernzweig wieder geöffnet.
- Lernchat und Varianten gemeinsam. Geprüfte Chat-Züge lassen sich auf dem Brett
  vorführen, mit markiertem Start/Ziel; eigene Lernzüge gezielt kommentieren.
- Benannte Partien lokal speichern/laden und als JSON-Datei übertragen, mit
  Kommentaren, Varianten, Dialog, Namen und Vergleichen. Vor dem Laden wird die
  aktuelle Sitzung separat gesichert. Ungültige Dateien ersetzen keine Sitzung.
- 100 Einzeltests und 55 Browsertests bestanden; tatsächlichen Übergang aus
  den veröffentlichten 0.3.3-Dateien mit erhaltenen Daten lokal geprüft.
- Schlüsselfach, Kosten, Diagnosen und Updatefunktion bleiben erhalten. Alte
  Sitzungsdateien weiter lesbar; kein Wechsel der Appkennung oder Datenbankversion.

## 0.3.3 – eindeutige Web-Updateanzeige, 6. November 2026

- Updateprüfung meldet ausdrücklich die aktuelle Version, wenn keine neue
  Fassung gefunden wird, statt einen Download anzudeuten.
- Laufender Download, bereites Update und fehlgeschlagene Installation werden
  getrennt angezeigt. Bereits laufende Installation beim Start wird beobachtet.
- Übernahme bleibt von Zustimmung und erfolgreicher Sitzungssicherung abhängig.
  Keine Änderung an Appkennung, Schlüsselfach oder Sitzungsspeicher.

## Veröffentlichungskontrolle – 6. November 2026, App bleibt 0.3.2

- Ausgebliebenes Update auf GitHub-deploy-Timeout eingegrenzt. Einmaliger neuer
  Lauf für die unveränderte App 0.3.2 erfolgreich abgeschlossen.
- Veröffentlichung wartet künftig auf den bestätigten Pages-Erfolg des exakten
  Commits. Upload, Pending oder Failure werden nicht als fertiges Update gemeldet.
- Vier zusätzliche Statusregressionen; 98 Einzeltests grün, unveränderter Appstand
  mit 52 Browsertests geprüft. Android-Meldung noch nicht am Gerät geklärt.

## 0.3.2 – vollständige Brettdarstellung, 6. November 2026

- Abgeschnittene rechte Brettspalten bei kleinen Desktopfenstern behoben.
  Acht feste gleich große Rasterspalten/-reihen; Figurengröße relativ zum Brett.
- Dieselbe Korrektur für beide Variantenvergleichsbretter.
- Zwei neue Browserregressionen prüfen sämtliche 64 Feld- und Figurenrechtecke,
  kleine/große Fenster, beide Orientierungen, CSS-Zoom und vergrößerte Schrift.
- 94 Einzeltests und 52 Browsertests bestanden. Keine Datenmigration,
  keine kostenpflichtige Anfrage; Aktualisierung über den vorhandenen Pages-Weg.

## 0.3.1 – GitHub Pages vorbereitet, 6. November 2026

- App, Engine, Links, Manifest und Offline-Worker für Projekt-Unterordner.
- Cache-Namensraum pro App-Pfad, HTML-CSP und .nojekyll für statisches Pages.
- Separater Web-Build und manuell gestarteter gh-pages-Publisher im bestehenden Repository mit
  vorgeschalteten Tests; keine eigenen Actions, kein Sichtbarkeitswechsel.
- 94 Einzeltests und 50 Browsertests einschließlich echter Unterordner-/Offline-
  Engine und lokalem Git-Veröffentlichungsweg. Keine Live-Veröffentlichung:
  Repository vom Nutzer auf Public gestellt; Pages-Verwaltungs-API weiter blockiert.

## 0.3.0 – zur Web-Bereitstellung vorbereitet, 6. November 2026

- Verbindet die integrierte Web-App und „Partie verstehen“ in einem nummerierten
  Web-Paket nach ausdrücklichem Veröffentlichungsauftrag.
- Hosting-Header für statische Bereitstellung sowie zugängliche vollständige
  chess.js-Lizenz und Stockfish-Lizenz-/Quelllinks ergänzt.
- Noch keine öffentliche URL: Hostingzugang fehlt, GitHub-Website-API blockiert.
  Lokale Prüfung und Bereitstellungsanleitung unter docs/WEB_PUBLISHING.md.

## Noch nicht freigegeben – eigenständige Web-App (6. November 2026)

- Browserlokaler KI-Transport mit lokaler AES-GCM-Schlüsselverschlüsselung;
  Gerätepasswort entsperrt nach Neustart, kein Klartextschlüssel im Webspeicher.
- Persistente, fensterübergreifend atomare Budgetreservierung und Diagnose ohne
  Textgenerierung; gemeinsame Vertrag-/Kostenlogik mit dem Desktopbetrieb.
- Browserfähiger zusätzlicher taktischer Faktencheck, automatische Sitzungssicherung
  und pausierte Wiederherstellung einschließlich PGN-Lernrückblick/Entwurf.
- Installierbare PWA mit ausschließlich öffentlichem Offline-App-/Engine-Cache,
  Updates erst nach Bestätigung und erfolgreicher Sitzungssicherung.
- 93 Einzeltests und 49 Chromium-Browsertests; echte Engines und Offline-/Worker-
  Abläufe, Anbieter nur Fixtures. Reale PGN, Geräte- und KI-Abnahme bleiben offen.
  Keine neue Versionsnummer, Downloadfreigabe, Veröffentlichung oder bezahlte API.

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
