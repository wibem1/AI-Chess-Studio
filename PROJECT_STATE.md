# Nach 1.0.1: systematische Bedienbereinigung – in `work`, noch nicht veröffentlicht

Nutzer-Screenshot vom 8. November: überfrachteter Lernmodus mit Faktencheck, Textzug-Option, Demo-Bezeichnung und praktisch unbrauchbarem Variantenvergleich. Funktionsinventar und Entscheidungen unter `docs/UI_AUDIT.md`.

Umgesetzt: verborgene Textzug- und Faktencheck-Oberflächen, keine Legale-Züge-Liste, Demo-Bezeichnung im Senden-Knopf entfernt; bestehende technische Adapter und alte gespeicherte Simulationen/Faktenchecks bleiben erhalten. Variantenübersicht zeigt statt sämtlicher Halbzüge nur Endpunkte und ausdrücklich benannte Stellungen. Vergleichsauswahl ist entsprechend kompakt, bei weniger als zwei Varianten inaktiv. Die normale Brettbedienung, Bauernumwandlung, freier Chat, PGN, Speichern/Laden sowie gespeicherte Zweige bleiben vorhanden.

Objektive Prüfung: GitHub Actions Lauf https://github.com/wibem1/AI-Chess-Studio/actions/runs/42465566829 SUCCESS; Node 24, Typprüfung, Root- und Pages-Build, 172 Einzeltests, 11 gezielte Chromiumfälle einschließlich neuem verzweigten Variantenvergleich, PGN-Sicherung, Stellungsübergabe und unverrückbarer Brettsteuerung bestanden. Kein Deployment, keine bezahlten KI-Aufrufe, keine native iPad-Geräteabnahme. Auslieferung bleibt 1.0.1.

Noch offen: größere Partie mit echten parallelen Verzweigungen auf Touch-Gerät vollständig durchführen, Variantenablauf verbessern (Anfang und Unterschiede der Zweige), alte PGN-Zweitwege nach Kompatibilitätsprüfung zusammenführen, veraltete historische E2E-Tests aktualisieren. Kein neu nummerierter Release vor vollständiger Freigabe.

# Veröffentlicht: 1.0.1 – PWA-Update-Korrektur (8. November 2026)

GitHub Actions erfolgreich: https://github.com/wibem1/AI-Chess-Studio/actions/runs/42464356212
Quelle 956802a6eb5b1e705d1cabe5e03af745664ad1b4, gh-pages d47044f46617a529612fde673ecc1adfb0792e75. BUILD.json bestätigt 1.0.1, 22 Webdateien, GitHub-Pages-Statusprüfung erfolgreich.
Grund: Bisheriger Web-Update-Dialog verließ sich allein auf den Service Worker und konnte trotz neuer veröffentlichter Version 'aktuell' melden. Neue Implementierung prüft BUILD.json (Cache-Bypass) unabhängig, erlaubt nach erfolgreicher Sitzungssicherung kontrollierte Reparatur nur des App-Shell-Caches/registrierten Service Workers und nutzt online für die HTML-Navigation Netzwerk vor Offline-Cache. Nutzer-Sitzungsdaten, Zugang und andere Browser-Caches bleiben unberührt. Aktuelle UI-Änderungen greifen erst nach erfolgreichem Laden der neuen Version; für weiterhin festhängende Alt-PWA ist ein einmaliger separater Browseraufruf bzw. gezieltes Neuladen nötig, keine automatische Migration des Altclients nachgewiesen.
Prüfung: Node 24/TypeScript, 172 Einzeltests, Pages-Build und 20 gezielte Browsertests inklusive Offline erfolgreich; keine echte Alt-PWA-zu-Neu-PWA-Geräteabnahme, keine bezahlten Provideraufrufe.

# Veröffentlicht: 1.0.0 – 8. November 2026

GitHub Actions Run 42463648023 erfolgreich abgeschlossen: https://github.com/wibem1/AI-Chess-Studio/actions/runs/42463648023
Quelle: 0f888296faf472dd5893bc14bf9d98caade1e961, gh-pages: a8f2880a5bf98f4a45a2a852c17517a4d81eecbf.
GitHub Pages-Metadaten (gh-pages/BUILD.json) melden Version 1.0.0, korrekten Quellcommit und 22 erfasste Webdateien. GitHub Actions bestätigte den erfolgreichen Pages-Deploymentstatus. Separater Abruf der Live-Binärdateien/Prüfsummen und native iPad-Abnahme sind nicht erfolgt.
CI: Typprüfung, Build, 172/172 Einzeltests, Produktions-Build, 20/20 ausgewählte Browserfälle mit realen lokalen Stockfish-/Maia-Komponenten, Pages-Unterverzeichnis/Offlineprüfung bestanden. KI-Provider per Fixtures, kostenpflichtige Aufrufe deaktiviert; historische vollständige E2E-Suite nicht als vollständig grün bewertet.
Die Version ist unter https://wibem1.github.io/AI-Chess-Studio/ bereitgestellt. Bei PWA-Cache ggf. Aktualisierung prüfen. Nutzerabnahme offen.

# 1.0.0 in `work` integriert – Webveröffentlichung noch offen

Am 8. November 2026 wurde PR #4 über den konfliktaufgelösten Merge-Commit d6934f27c60869fe7d11847475e727d505731264 in `work` integriert. Der Konflikt betraf nur PROJECT_STATE.md; der dokumentierte Veröffentlichungsnachweis zu 0.16.1 wurde erhalten. Geprüfter Entwicklungsstand laut PR: Typprüfung, Root-/Pages-Build, 172 Einzeltests und 24 gezielte Browserfälle; keine native iPad-Abnahme und kein vollständig aktualisierter historischer Browsertestlauf. Aktuelle Session konnte diese Prüfungen mangels lauffähiger Projektumgebung nicht erneut ausführen. GitHub Pages wurde NICHT für 1.0.0 gebaut oder aktualisiert; live bleibt 0.16.1. Nächster Arbeitsschritt ist der aktuelle `npm run build:pages` mit Prüfung und anschließender `gh-pages`-Bereitstellung samt Live-Manifestkontrolle. Keine ungetestete Webbereitstellung als erfolgt bezeichnen.

# Vorbereitet: 1.0.0 – Bereinigter Lernablauf und stabile Brettsteuerung

Noch nicht veröffentlicht. Freier KI-Chat und Schlüsselstellungen als Hauptablauf.
Brettsteuerung unter dem Brett, kein erzwungenes Scrollen bei Brettaktionen;
bei tatsächlichem Moduswechsel bleibt bewusste Navigation erhalten.
Alte Analyse-/Gedanken-/Kommentarformulare und Simulationsauswahl samt Handlern
entfernt. SimulationAdapter bleibt ausschließlich Kern-/Testfunktion; gespeicherte
Simulationen, Reflexionen und Notizen werden weiterhin gelesen, keine Datenmigration.
Modellwahl in Zugangseinstellungen verschoben. Diagnosebutton direkt erreichbar,
konkreter Review-Prüfgrund zusätzlich im geschützten Diagnosebericht enthalten.
Bretttoolbar eigenes Modul, main.ts um alte Handler und Demo-Verzweigungen bereinigt.

Prüfung: 172 Einzeltests, 24 gezielte Browserfälle bestanden. Darunter OpenAI/
OpenRouter-Modellwechsel mit Fixture-Transport, Diagnose ohne Schlüssel/Denktexte,
echte Stockfish-/Maia-Spielantworten, Pages/Offline, PGN, Speichern/Laden von
Analysen, Schlüsselstellen, Stellungsübergabe und Scrollgeometrie bei 820/1440px
mit 125% Schrift. Keine bezahlten KI-Anfragen, keine native iPad-Abnahme.
Der vollständige historische Browsertestbestand ist nicht als grün freigegeben;
ältere Tests für entfernte Formulare/Simulation benötigen gesonderte Aktualisierung.
Letzter veröffentlichter Stand bleibt 0.16.1. Frühere Einträge sind Historie.

# Aktuell veröffentlicht: 0.16.1 – Konkrete Analysefehler und Speicherbereinigung

Am 8. November 2026 veröffentlicht, PR #3 integriert. Quelle 4cc05fd46c772a66499399cb282aa5173145cc53,
gh-pages 51ed010f95211c73fe1d531f493dad4832f3613c.
Pages-Run 42456586866 SUCCESS: https://github.com/wibem1/AI-Chess-Studio/actions/runs/42456586866
Live-Manifest vollständig identisch. HTML bytegleich, Service Worker und App-JS SHA-256 bestätigt.
Typprüfung, Root-/Pages-Build, 171 Einzeltests und 8 gezielte Browserfälle bestanden.
Prüfung umfasst konkrete illegale historische Alternative, Spielneustart, Analyse-Speicherung,
PGN/Backup sowie echten Stockfish und Offline-Restore. Providerantworten Fixtures.
Doppelte JSON-Speicheroberfläche samt Handlern entfernt. Automatische Sicherung erhalten.
Keine native iPad-Abnahme oder vollständige 1.0-Freigabe; weitere Bereinigung bleibt offen.
Keine bezahlten KI-Anfragen. Folgende Einträge sind ältere Zwischenstände.



# Entwicklung 1.0: Brettsteuerung unter dem Brett, stabile Ansicht

Neuer Nutzerauftrag vom 8. November: grundlegende Bereinigung fortsetzen,
Brettsteuerung unter das Brett, keine Ansichtssprünge durch Bedienung.
Implementiert: eigener board-toolbar-Baustein für einheitliche Anordnung,
Desktop-Sonderposition für Undo entfernt, erzwungenes Scrollen bei KI-Start und
Schlüsselstellen entfernt; Navigation scrollt nur beim tatsächlichen Moduswechsel.
Root-Build/Typprüfung bestanden; 8 Browserfälle mit Import/Analyse/Navigation
bestanden. Zusätzliche 2 Geometrie-/Scrollfälle bei 820/1440px und 125% Schrift
bestanden. Noch keine native iPad-Abnahme. Kein bezahlter KI-Aufruf.
Noch keine 1.0-Freigabe oder Veröffentlichung. Die grundlegende restliche
Code-/Formularbereinigung und vollständige aktualisierte Browserprüfung stehen aus.
Letzter veröffentlichter Stand 0.16.1. Frühere Stände folgen als Historie.

# Vorbereitet: 0.16.1

171 Einzeltests und 8 gezielte Browserfälle bestanden; Root-/Pages-Build geprüft.
Konkrete historische Alternativfehler, Spielneustart, gespeicherte Analyse,
PGN, Backupfehler und Pages/Offline/Stockfish geprüft. Providerantworten Fixtures.
Keine native iPad-Abnahme. Teilbereinigung; offene Arbeiten für 1.0 bleiben unten.
Noch nicht veröffentlicht.

# Entwicklung zu Version 1.0 – Bereinigung

Branch refactor/1.0-cleanup-20261108, Ausgangspunkt veröffentlichte 0.16.0.
Nutzerauftrag: Oberfläche und Code gründlich bereinigen, konkrete Fehlermeldungen.
Erster geprüfter Schritt: doppelte JSON-Speicheroberfläche und zugehörige Handler
entfernt, automatische Sicherung erhalten; sichere Detailmeldung für ungültige
Partierückblicke vom Prüfer über Web-/Desktoptransport bis zur Anzeige.
Vier reale illegale Alternativen aus Nutzerdiagnose als Regression geprüft.
Typprüfung, Root-Build und 171/171 Einzeltests bestanden.
Noch keine Browserabnahme dieses Umbaus, keine 1.0-Freigabe oder Veröffentlichung.

Noch erforderlich für 1.0:
- Veraltete Analyse-/Kommentarformulare und Simulationsbedienung entfernen,
  zugehörige Handler/Abhängigkeiten bereinigen; Testsimulation außerhalb Produkt-UI.
- Partien nur an einem Ort laden/speichern, Varianten und Faktencheck unter
  Weitere Werkzeuge; Anbieter/Modell/Darstellung in Einstellungen zusammenführen.
- Diagnose direkt erreichbar; genaue Validierungsursache auch im Bericht erhalten.
- main.ts in nachvollziehbare Verantwortlichkeiten teilen; tote Styles entfernen.
- Alte Oberflächentests auf aktuelle Abläufe umstellen, vollständige Prüfung und
  visuelle Desktop-/iPad-Größenprüfung, Speicher-/Update-Kompatibilität nachweisen.
- Erst danach Versionsnummer 1.0.0, Changelog, Integration und ggf. Veröffentlichung.

Letzter veröffentlichter Stand bleibt 0.16.0. Keine bezahlten KI-Anfragen.

# Aktuell veröffentlicht: 0.16.0 – Schlüsselstellungen und PGN-Korrektur

Am 8. November 2026 veröffentlicht. PR #2 integriert: Quelle 577309b059fa48bdaa5533ff6f8c89c4803c555f;
gh-pages 400e8e6dc175ce5d5faade4a32fccc97ea73acb8.
Pages-Run 42454418948 SUCCESS: https://github.com/wibem1/AI-Chess-Studio/actions/runs/42454418948
Live-BUILD.json vollständig identisch; HTML, Service Worker und App-JS/CSS per SHA-256 bestätigt.
170 Einzeltests, 5 gezielte Browserfälle und 1 Pages-/Stockfish-/Offlinefall bestanden.
Button „Schlüsselstellungen“ im Lernmodus: Analyseauftrag mit vollständiger Partie,
aktuelle Stellung erhalten, direkte Sprungbuttons nach geprüfter Antwort.
Lichess-Referenz 137 Halbzüge, Kommentarfolgen, Unicode-Trenner, Texteingabefallback,
JSON-Rundlauf und sichere Ablehnung bei fehlgeschlagener Sicherung geprüft.
Providerantworten Fixtures, keine bezahlten Anfragen. Native iPad-Abnahme offen.
Der alte Browsergesamtlauf ist weiterhin nicht vollständig grün freigegeben.
Die folgenden Einträge dokumentieren frühere Zwischenstände.

# Veröffentlichung vorbereitet: 0.16.0

Schlüsselstellungen-Button, direkte Navigation und PGN-Korrektur geprüft.
170 Einzeltests und 5/5 gezielte Browserfälle bestanden. Browserfälle prüfen
Buttonauftrag, unveränderte Ausgangsposition, direkte Sprünge, Analyse-Speicherung,
Referenz-PGN und fehlgeschlagene Sicherung. Providerantworten Fixtures.
Kein vollständiger grüner Alt-Browsergesamtlauf, keine native iPad-Abnahme.
Keine bezahlten KI-Anfragen. Veröffentlichung und Live-Prüfung stehen noch aus.

# Fortgesetzter Korrekturstand: PGN-Import

PR #2 erweitert, noch nicht veröffentlicht. Vor der Laufzeitunterbrechung:
170 Einzeltests bestanden; die drei PGN-Browserfälle bestanden (Referenzimport,
Datei/JSON-Rundlauf und Sitzungsbackup, Texteingabe, fehlgeschlagene Sicherung).
Reale Referenz EgorSN – wibem: 137 Halbzüge bis 69. Kh2, Ergebnis und Uhren geprüft.
Unicode-Zeilentrenner und aufeinanderfolgende Lichess-Kommentare werden nur für
den Parser angepasst; gespeicherter Originaltext bleibt erhalten. Texteingabe
im normalen Lademenü ergänzt. Einleitungstext wird abgewiesen.

Der vollständige 97er-Browserlauf zeigte Fehler älterer Oberflächentests; sein
Endergebnis und der Vergleichslauf gegen 0.15.0 sind nach Laufzeitwechsel nicht
mehr verfügbar. Keine vollständige Testfreigabe behaupten. Vor Veröffentlichung
gezielte Tests und Builds erneut ausführen, Versionsnummer/CHANGELOG anheben,
PR integrieren und Pages samt Live-Manifest prüfen. Native iPad-Abnahme offen.
Letzter veröffentlichter Stand bleibt 0.15.0. Keine bezahlten KI-Anfragen.

# Nicht integrierter Korrekturstand: iPad-PGN-Import (8. November 2026)

Branch `fix/ipad-pgn-import-20261108` – **implementiert, nicht gebaut oder getestet, nicht veröffentlicht**.
Ausgangspunkt: Branch `work`, Stand 0.15.0. Bezug: Issue #1.

- Datei-Input ohne starren HTML-`accept`-Filter; auf iPadOS/Safari soll eine
  PGN-Datei auch bei abweichender UTType-/MIME-Erkennung auswählbar sein.
  Nach Auswahl kontrolliert weiterhin der Importer den Inhalt; Bilddateien
  werden ausdrücklich abgewiesen.
- Der Dateilader gibt den konkreten Parser-/Sicherungsfehler gekürzt als
  Status aus, statt sämtliche Fehler mit „ungültig oder nicht lesbar“ zu verdecken.
- PGN-Textnormalisierung für Unicode-Zeilentrenner U+2028/U+2029/U+0085;
  strenger Parser zuerst, kompatibler Modus als Fallback. Original-Zugfolge
  und Rohtext bleiben für den erfolgreichen Import erhalten, soweit
  Eingangsnormalisierung nicht erforderlich ist.
- Neue Einzeltests für Unicode-Trenner, PGN-Inhalt mit `.pgn`, `.txt` und
  unbekannter Endung sowie Ablehnung ungeeigneter Inhalte.
- **Noch offen:** Typprüfung, Build, sämtliche Tests, echte iPad-Safari-
  Dateiauswahl, Import der Original-Lichess-Datei, eventuell PGN-Text-
  Eingabefallback. Diese Prüfungen sind nicht erfolgt; keine Freigabe.
- Aktuell gesicherter, veröffentlichter Stand bleibt 0.15.0 auf `work`.
  Integration erst nach Prüfungen und Konfliktabgleich mit Codex, keine
  unkoordinierte parallele Bearbeitung von `work`.

# Projektstand

## Aktuell veröffentlicht: 0.15.0 – Fremde PGN-Partien direkt laden

Nutzer bestätigt PGN (.pgn) als gewünschtes Fremdformat. Normaler Dateilader
unter „Partien speichern und laden → Partiedatei laden“ akzeptiert jetzt PGN,
Text-PGN und bisherige JSON-Sitzungen. Fremde Einzelpartien öffnen im Lernmodus
an der Ausgangsstellung, ohne Spielernamen-/Farbzuordnung oder Pflichtfragen.
Vor/Zurück, Varianten, freie Analyse und Schlüsselstellen nutzen die tatsächliche
importierte Hauptzugfolge. Vorherige Sitzung vor Wechsel lokal sichern; bei
fehlgeschlagener Sicherung oder geänderter Quelle nicht ersetzen. Laufende
Anfragen/Engines vor Sicherung anhalten. Kein automatischer KI-/Engineaufruf.

Spielernamen/Ergebnis kompakt anzeigen, Kommentare zur aktuellen Originalstellung
unter dem Brett aufklappbar und als Text ausgeben. Roh-PGN mit Kommentaren,
Kopfdaten und Ergebnis bleibt erhalten; native JSON-Speicherung enthält daneben
neue Analyse/Schlüsselstellen, Chat und Varianten. Freier Import wird als solcher
serialisiert/validiert, vorhandener geführter eigener Rückblick bleibt kompatibel.
KI-Kontext ordnet bei fremden Partien keine Seite dem Nutzer zu.

Prüfung: Typprüfung, Root-/Pages-Build, 165/165 Einzeltests und 8/8 gezielte
Chromiumfälle bestanden (pgn-file, analysis-navigation, game-review,
position-transfer). PGN-Import ohne Nutzeridentität, einseitige Kurzpartie,
BOM, ungültige Dateien, vollständiger Chat-/Analyserverlauf, JSON-Rundreise,
Kommentar als Literaltext, Quellsicherung/Rückladen und 390px-Ansicht geprüft.
PGN-Browserfall auf schmaler Ansicht visuell geprüft. Bestehenden Speichertest
entkoppelt von alter Lade-Statusmeldung: auf tatsächlich abgeschlossenen
Speichervorgang warten, bevor die neue Speicher-ID gelesen wird.

Grenzen: Eine Einzelpartie/Hauptvariante bis 256 KiB und 1000 Halbzüge; keine
PGN-Datenbanksammlung oder grafische Erkennung von PNG-Bildern. Roh-PGN bleibt
inklusive vorhandener Nebenvarianten erhalten; Nebenvarianten werden nicht als
separate editierbare Zweige importiert. Neue Analysen im nativen JSON sichern,
kein neuer PGN-Export. KI-Antworten Fixtures, kein bezahlter Aufruf und keine
native Geräteabnahme. Kein vollständiger Lauf aller älteren Browsertests.

Am 7. November 2026 (Europe/Berlin) nach ausdrücklichem Auftrag veröffentlicht.
Quelle 409d4a83e12ccd28d049362de5102d6ff1a35f86; gh-pages
cd6895b85317bc8bd66c1dfb6bb6d02781f136ff. Pages-Run 42422394121 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42422394121
Live-BUILD.json vollständig mit vorbereitetem Manifest identisch; SHA-256 von
index.html, service-worker.js, assets/index-BC7uNfVY.css und
assets/index-DFG6tH8M.js bestätigt. Zusätzlich 1/1 Pages-Unterordner-Browserfall
mit echtem Stockfish und Offline-Restore bestanden. Kein bezahlter KI-Aufruf.
Nächster Schritt: Nutzer übernimmt Web-Update und lädt eine fremde Einzel-PGN
über Partien speichern und laden → Partiedatei laden.

## Zuvor veröffentlicht: 0.14.1 – Schlüsselstellungen als Analyseauftrag erkennen

Nutzer fragt anhand Screenshot nach fehlenden Schlüsselstellen-Buttons. Im
Eingabefeld steht „Zeige die Schlüsselstellungen des Spiels“, Ansicht zeigt
ein einzelnes Lehrdiagramm. Erkennung in 0.14.0 akzeptierte Schlüsselstellen,
aber nicht Schlüsselstellungen; Anfrage blieb freier Chat mit Brettwerkzeugen.
Ohne geprüften Partierückblick waren deshalb keine Navigationspunkte vorhanden.

Korrektur: Schlüsselstellung(en), Schlüsselstelle(n), Schlüsselposition(en),
Schlüsselmoment(e) und Wendepunkt(e) erkennen; auch Umschreibung Schluessel.
Reale Screenshot-Formulierung als Browserregression statt nur naher Testphrase.
Die Aufgabe nutzt damit den geprüften Partieverlauf und erzeugt navigierbare,
mit der Partie gespeicherte Zugbezüge. Keine Änderung der gesicherten Antworten
oder automatische bezahlte Wiederholungsanfrage.

Typprüfung, Root-/Pages-Build und 162/162 Einzeltests bestanden; 3/3 betroffene
Browserfälle (analysis-navigation, game-review) inklusive exakter Nutzerfrage,
Pfeil-/Tastaturnavigation, Speichern/Laden und Legacy-Rückblick bestanden.
Providerantworten Fixtures, kein bezahlter Aufruf oder native Geräteabnahme.
Der übrige 21er-Prüfstand aus 0.14.0 wird nicht als neu vollständig ausgeführt
behauptet. Am 7. November 2026 nach ausdrücklichem Auftrag veröffentlicht.
Quelle eed1abe4015f6cc4cdff602b7367f4510eb51d1a; gh-pages
0bda85c8f7da853a51861973359f8a9d27c732db. Pages-Run 42414451932 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42414451932
Live-BUILD.json vollständig mit vorbereitetem Manifest identisch; SHA-256 von
index.html, service-worker.js, assets/index-qIRQUTWd.js und
assets/index-DZAWGkdv.css bestätigt. Keine bezahlte KI-Anfrage.

Bedienweg nach dem Update: Zur Lernstellung zurückkehren und die ursprüngliche
Frage „Zeige die Schlüsselstellungen des Spiels“ erneut senden. Nach geprüftem Rückblick stehen
←/→ mit Zähler oberhalb des Bretts. Vorliegende freie Lehrdiagramm-Antwort wird
nicht nachträglich als verknüpfte Partieanalyse ausgegeben.

## Zuvor veröffentlicht: 0.14.0 – Antwortgröße, Schlüsselstellen und gespeicherte Analyse

Nutzerauftrag nach Praxisabnahme von 0.13.0: KI-Antwortfeld wie Eingabe
vergrößerbar; bei erfragten Schlüsselstellen per Pfeilen zwischen Stellungen
springen; Analyse und Schlüsselstellen mit jeder Partiekopie speichern.

Umgesetzt:
- Antwortfläche vertikal aufziehbar, zusätzlich eigener Griff für Pointer/Touch
  und Tastatur (Auf/Ab, Home/End am Griff). Gewählte Höhe über Rerendern und
  Neuladen als lokale Ansichtseinstellung erhalten. Antwort bleibt schreibgeschützt.
- Explizite Fragen nach Schlüsselstellen/Schlüsselmomenten/Wendepunkten laufen
  auch aus dem freien Chat über den vorhandenen geprüften Partierückblick.
  Allgemeiner Chat und gewöhnliche freie Partieanalyse bleiben unverändert frei.
- Rückblick enthält strukturierte, beim Speichern/Import erneut geprüfte Zugbezüge
  im optionalen Annotation.gameReview. Tatsächliche Zugfolge, Reihenfolge und
  legale Alternativen prüfen; keine erfundenen Knoten oder Verknüpfung nur über Text.
- Pfeilbuttons am Brett, Zähler und Zugbezug. Links/Rechts bei Fokus in dieser
  Navigation, am Brett oder in der Antwort; Texteingaben und Größenänderungsgriff
  behalten eigene Tasten. Sprung zeigt die Stellung VOR dem besprochenen Zug und
  pausiert gegebenenfalls den Gegner. Tatsächlicher Partiecursor bleibt erhalten.
- Neueste Analyse standardmäßig ausgewählt; über vorhandene Sprungknöpfe können
  auch Schlüsselstellen einer älteren Analyse gewählt werden. Eindeutige Zuglabels
  älterer textbasierter Rückblicke bleiben navigierbar.
- Partie speichern, JSON-Dateisicherung, Autosicherung und Kopien enthalten Analyse
  und geprüfte Schlüsselstellen zusammen mit Chat und Varianten. Gesicherte Spiele
  werden nach Laden/Reload wieder navigierbar. Bereits gespeicherte ältere Kopien
  sind unveränderte Momentaufnahmen; erneutes Speichern erstellt den neuen Stand.

Prüfung: Typprüfung, Root-/Pages-Build, 162/162 Einzeltests und 21/21 gezielte
Chromiumfälle bestanden: analysis-navigation, game-review und die 18 zuletzt
verwendeten Funktions-/Layout-/Pages-Fälle. Echter Ziehgriff, Größenbeibehaltung
über Stellungswechsel, Tastatur ohne Eingabefeld-Konflikt, benanntes Speichern,
Dateiinhalt, Laden/Reload, Legacy-Rückblick und manipulierte Zugreferenz geprüft.
Desktop-Screenshot visuell geprüft; schmale Ansicht ohne horizontalen Überlauf.
Providerantworten Fixtures, bestehende Stockfish-/Maia-Regressionen real. Kein
bezahlter Modellaufruf und keine native Geräteabnahme. Kein neuer vollständiger
Gesamtlauf aller älteren Browserfälle; bekannte frühere Prüfgrenzen bleiben.

Am 7. November 2026 nach ausdrücklichem Auftrag veröffentlicht.
Quelle 95ce1e8554f9cd82744582df660ec57fba802846; gh-pages
1d8c2ac6cafbf20c2cfa3c3ca97222d75cfc8502. Pages-Run 42413364798 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42413364798
Direktes Live-BUILD.json vollständig mit dem vorbereiteten Manifest identisch.
Version/Quelle und Live-SHA-256 von index.html, service-worker.js,
assets/index-DlVXQxnY.js und assets/index-DZAWGkdv.css bestätigt.
Keine kostenpflichtige KI-Anfrage oder neue native Geräteabnahme.
Nächster Schritt: Nutzer übernimmt das Web-Update und prüft Antwortgröße,
Schlüsselstellen-Navigation und Speichern/Laden in seiner Geräteumgebung.

## Zuvor veröffentlicht: 0.13.0 – Varianten blättern, Stellungen übergeben, ruhiges Brett

Nutzerwunsch nach Praxisabnahme von 0.12.0: Vor/Zurück an der aktuellen
Lernstellung, jede Stellung in den anderen Modus übergeben und kein springendes
Brett bei unterschiedlich langen Statusmeldungen im KI-Engine-Spiel.

Umgesetzt:
- Vor und Zurück direkt in der Werkzeugleiste der Lernansicht. Vor folgt der
  aktuellen Lernvariante und deren gemerktem Endpunkt, auch abseits der echten
  Partiefolge. Zum Anfang und bestehende Zugnavigation bleiben vorhanden.
- Stellung spielen übernimmt die sichtbare Lernposition als spielbare Kopie:
  Variantenstellung inklusive Verlauf/Notizen oder separate KI-Lehrstellung
  als unabhängige Wurzel. Farbe/Gegner/Stufe aus der bisherigen Partie bzw.
  den Spieleinstellungen; Orientierung erhalten. Bei gegnerischem Zugrecht
  antwortet die gewählte Spielengine. Keine automatische Lern-KI-Anfrage.
- Vor Übernahme den bisherigen Stand lokal sichern. Misslingt die Sicherung
  oder ändert sich inzwischen die Quelle, keine neue Sitzung übernehmen.
  Alte Partie und Zweige bleiben in Sicherung vor Stellungsübergabe ladbar.
- Stellung lernen übernimmt exakt die sichtbare Spielposition und pausiert den
  Gegner, ohne zur vorherigen Lernvariante oder Partiestellung zu springen.
  Tabs behalten ihre bisherige Bedeutung; bewusste Übergabe über den Brettbutton.
- Auch importierte geführte Rückblicke können als freie Spielkopie übernommen
  werden; der gesicherte Originalrückblick bleibt unverändert geführt.
- KI-Engine-Status mit konstantem zweizeiligem Platz, lange Meldungen scrollbar.
  Während Testpartien kein zusätzlicher Vorführungs-Stopbutton; eigener Start/Stop
  bleibt sichtbar. Keine wechselnden Rückmeldungen unter dem Brett pro Halbzug.

Prüfung: Typprüfung, Root-/Pages-Build und 160/160 Einzeltests bestanden;
18/18 gezielte Chromiumfälle aus position-transfer, compact-board, coach-tools,
model-diagnostics, windows-learning, access-layout und pages. Neue Prüfungen
für Nebenvarianten, Quellschutz, Import-/Diagrammübernahme, Sicherung und Rückladen.
Live-Geometrie über echten Stockfish-Testpartieverlauf bei 1600 und 390 px:
Brettposition und Statushöhe konstant (Toleranz 1 CSS-Pixel), einschließlich
langer Modell-/kurzer Engine-/Fehlermeldung. Modellantworten ausschließlich
Fixtures; echte Stockfish-/Maia-Inferenz in den Regressionen. Mobilansicht visuell
geprüft. Keine bezahlte KI-Anfrage oder native Geräteabnahme.
Kein neuer vollständiger Lauf aller älteren Browserfälle; Prüfgrenzen aus
0.12.0 bleiben ausdrücklich bestehen.

Am 7. November 2026 nach ausdrücklichem Auftrag veröffentlicht.
Quelle 7bce4c01d21bb8af26c1585f49aebd0a7c56edb5; gh-pages
2333a9f4fcd3fb6e40a00a4c63c2b04bf5fc4c16. Pages-Run 42407105406 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42407105406
Direktes Live-BUILD.json vollständig mit vorbereitetem Manifest identisch.
Version/Quelle sowie Live-SHA-256 von index.html, service-worker.js,
assets/index-BJesWPVd.js und assets/index-umAiEBsq.css bestätigt.
Keine kostenpflichtigen KI-Aufrufe oder neue native Abnahme.
Nächster Schritt: Nutzer übernimmt das verfügbare Web-Update und prüft
Vor/Zurück, Stellungsübergabe und ruhiges Brett in seiner Geräteumgebung.

## Zuvor veröffentlicht: 0.12.0 – kompakter Arbeitsbereich und KI-Lehrdiagramme

Nutzerauftrag nach Praxisabnahme von 0.11.2: mehr Platz für Brett/Chat, weniger
Erklärtexte und Optionen, Technik aus dem Blickfeld, Modell oben; KI soll
Stellungen sowie Pfeile/Linien zeigen können. Anschließend ausdrücklich zur Veröffentlichung beauftragt.

Umgesetzt:
- Kompakte Modellanzeige im Kopf, Demo/gesperrt/laufend weiterhin erkennbar.
  Zugangskarte, Verbindungstest und Modellwechsel ausschließlich in Einstellungen.
- Gemeinsame kleine Werkzeugleiste am Brett. Start/Stop des KI-Engine-Tests bleibt
  oben. Weniger dauernde Texte; kurze Senden-/Plan-Schaltflächen. Separate
  Analyseknöpfe und Stellungs-/Zugkommentare aus der normalen Ansicht entfernt;
  bestehende Notizen/Sitzungen nicht gelöscht. Weitere Werkzeuge zugeklappt.
- Zum Anfang springen direkt am Brett, aus beiden Modi. Analyse pausiert die
  tatsächliche Partie; ihre Zugfolge bleibt erhalten. Auch freie Lernzweige ohne
  Enginepartie können danach wieder vorwärts durchgegangen werden.
- Keine möglichen Zielfelder beim Antippen oder Ziehen im Spielmodus.
  Lernmodus darf weiterhin legale Ziele anzeigen. Brettgröße in beiden Modi gleich.
- Neue geprüfte Modellwerkzeuge show_position (FEN-Lehrstellung) und draw_board
  (bis zwölf grüne/rote/blaue Pfeile oder Linien). SVG-Koordinaten folgen der
  Brettdrehung und Größe; nur feste Typen/Farben/Felder, kein Modell-SVG/Code.
  show_line/play_engine bleiben für echte legale Varianten der Partie zuständig.
- Lehrstellungen sind gesonderte, vorübergehende, nicht direkt spielbare Ansichten
  desselben Bretts. Tatsächliche Partie/Analysezugfolge unverändert; Zur Lernstellung
  stellt die Ansicht wieder her. Markierungen auf Lehrstellung nachträglich änderbar.
  Ein Stellungs-/Sitzungs-/Moduswechsel entfernt die Ansicht; Chatlöschung ebenfalls.
  Zeichnungen sind Erklärungen, keine regelgeprüften Zugausführungen. Diagramme werden
  in Anfrageberichten/Chat protokolliert, aber nicht als aktive Ansicht wiederhergestellt.

Prüfung: Typprüfung, Root-/Pages-Build und 156/156 Einzeltests bestanden;
14/14 gezielte Chromiumfälle (compact-board, coach-tools, model-diagnostics,
access-layout, windows-learning, pages) bestanden. Neue Grenzen-/Manipulations-
und Nichtveränderungstests; ganze Modellwerkzeugschleife mit abgefangenen
Providerantworten, echter Stockfish-WASM-/Maia-ONNX-Inferenz und Pages-Offlineweg.
Desktop und 390-px-Ansicht sowie Lehrdiagramm visuell geprüft. Keine bezahlten
KI-Anfragen, kein Nachweis echter Modellentscheidungen, keine native Geräteabnahme.
Kein vollständiger neuer Gesamtlauf aller älteren Browserfälle; alte Tests mit
entfernten Kommentar-/Analyseoptionen benötigen Anpassung an den neuen Ablauf.
Die frühere Sechser-Fehlerliste ist damit nicht pauschal als behoben freigegeben.

Version 0.12.0 am 7. November 2026 veröffentlicht. Quellcommit
89a7961924297291ad04519209feaf5a38f76533; gh-pages
3e7b58b69fcbdedf9d1ef8f9c05e5150cbf153e1. Pages-Run 42404462432 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42404462432
Direktes Live-BUILD.json vollständig mit dem vorbereiteten Manifest identisch;
Version, Quelle und Dateihashes bestätigt. Live-HTML, Service Worker, Haupt-JS
assets/index-BxlHw25U.js und CSS assets/index-BL6wUJ7P.css per SHA-256 geprüft.
Kein neuer Gesamttest oder echte Anbieter-/Geräteabnahme damit behauptet.
Nächster Schritt: Nutzer übernimmt das Web-Update; echte KI im Chat z.B.
„Baue ein Königsendspiel auf und zeichne den Königsweg“ prüfen.

## Zuvor veröffentlicht: 0.11.2 – Bereitstellung und Live-Dateien bestätigt

Am 7. November 2026 nach erneuter ausdrücklicher Veröffentlichungsanweisung
abgeschlossen. Unveränderter App-Quellcommit:
df70c52281c457ee9ebbc6a17474657149dd862f.
Veröffentlichter gh-pages-Commit: 9393887a57409cab225e2a170585f1ca23aee37e.
Exakt derselbe Dateibaum ad15c3d3049520d9b30f309007627e424220b163 wie der
vorige Upload b2acd65; keine App-, Versions- oder Assetänderung beim Neustart.

GitHub-Run **42401490401: SUCCESS**, alle drei Jobs einschließlich Deploy:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42401490401
Live: https://wibem1.github.io/AI-Chess-Studio/
Direktes Live-BUILD.json stimmt vollständig mit dem vorbereiteten Manifest
überein: Version 0.11.2, Basis /AI-Chess-Studio/, Quellcommit und Dateihashes.
Live-SHA-256 von index.html, service-worker.js, Haupt-JavaScript
assets/index-BjupTJ3F.js und CSS assets/index-BMXFL-Rw.css stimmen mit dem
geprüften Build überein. Keine erfolgreiche native Geräte-/Anbieterkontoabnahme
behauptet. Kein bezahlter KI-Test.

Erster Deploy 42397507785 scheiterte an syncing_files/Timeout; dessen gezielte
Wiederholung blieb über 30 Minuten Queued ohne Jobs. Nach Nutzerauftrag
„weiter“ einmal neuer Commit mit identischem Dateibaum und bestehendem
gh-pages-Elterncommit: Bereitstellung erfolgreich. Keine weiteren Versuche nötig.

Prüfgrenzen bleiben ausdrücklich bestehen: 154/154 Einzeltests, 80/86
Browserfälle bestanden; sechs Fehler im vollständigen Lauf nachfolgend
dokumentiert. Nutzer hatte Veröffentlichung nach Bekanntgabe erneut beauftragt.
Nächster Schritt: Nutzer übernimmt das verfügbare Web-Update und prüft seinen
tatsächlichen Anbieterzugang; Browserprüffehler sind separat zu klären.
Keine neue Einrichtung oder Datenlöschung erforderlich.

## Vorheriger Zwischenstand: Übertragung und ausstehendes Pages-Deployment

Nach Mitteilung der sechs Browserprüffehler hat der Nutzer ausdrücklich erneut
„veröffentlichen“ beauftragt. Daher unveränderten gesicherten Appstand
df70c52281c457ee9ebbc6a17474657149dd862f übertragen; keine Appkorrektur oder
Versionsänderung und keine Behauptung eines vollständig grünen Prüflaufs.

gh-pages: b2acd65bd8a07349ee272d6961edfd0f6c7e377c.
BUILD.json auf genau diesem Commit bestätigt 0.11.2 und die Quelle.
Das öffentliche Dateiset entspricht dem vorbereiteten Pages-Build: 23 Dateien,
unveränderte Binärdateien über vorhandene Git-Blobs erhalten, alte gehashte
Assets entfernt. Nativer Publisher scheiterte an fehlender Git-Push-Anmeldung
dieses Runners; deshalb denselben Dateibaum über verbundenen GitHub-Zugang als
neuen Commit mit bisherigem gh-pages-Commit als Eltern und Ref-Lease übertragen.
Keine neue Ablage, kein neuer Workflow, kein Force-Push, keine bezahlte KI-Anfrage.

Pages-Lauf: https://github.com/wibem1/AI-Chess-Studio/actions/runs/42397507785
Build und report-build-status SUCCESS. Deploy lief von 17:41 bis 17:51 UTC
dauerhaft mit syncing_files und scheiterte an „Timeout reached, aborting!“.
Fehler aus den echten Deploy-Joblogs (128478011930) bestätigt.
Einmal gezielt nur fehlgeschlagene Jobs erneut gestartet, von GitHub angenommen.
Letzter geprüfter öffentlicher Laufstatus: **Queued / Re-run triggered**;
API latest-attempt/jobs noch leer. Keine weiteren Wiederholungen gestartet.

Direktes Live-BUILD.json zuletzt weiterhin 0.11.1. **Kein bestätigter Onlinegang
von 0.11.2.** Ursache des aktuellen Veröffentlichungsstillstands ist GitHubs
Pages-Auslieferung, nicht mehr eine fehlende Nutzerfreigabe. Die nachfolgend
dokumentierten sechs Browserprüffehler und die echte Anbieter-/Geräteabnahme
bleiben offen. Nächster Schritt: den bereits beauftragten Wiederholungslauf
prüfen und nach Erfolg Live-BUILD.json plus HTML/JS/CSS/Service-Worker-Hashes
gegen artifacts/Pages-0.11.2-DtSXXu beziehungsweise dessen BUILD.json prüfen;
anschließend Changelog/README als veröffentlicht kennzeichnen.
Nicht ohne neuen Befund erneut hochladen.

## Veröffentlichungsprüfung 0.11.2 am 7. November 2026: blockiert

Auftrag: ausschließlich gesicherten Appstand df70c52281c457ee9ebbc6a17474657149dd862f
über bestehenden gh-pages-Branch veröffentlichen. Globale Standards, AGENTS.md,
Projektstand, Changelog und docs/WEB_PUBLISHING.md gelesen. App-Code unverändert.

Erneute Prüfung im aktuellen Linux-Runner (Node 24.22.1, Headless Chromium
153.0.8010.0 aus @sparticuz/chromium; Standard-Playwright-Download unbrauchbar):
npm ci erfolgreich; npm run test:all: Typprüfung, Root-/Pages-Build und
154/154 Einzeltests bestanden. Vollständiger Browserlauf: **80/86 bestanden,
6 fehlgeschlagen**, keine vollständige Freigabe. Fünf gezielte
model-diagnostics-Fälle auch separat bestanden, echte Stockfish-/Maia-Inferenz,
Providerantworten ausschließlich Fixtures, keine bezahlten Anfragen.

Fehlgeschlagene Fälle:
- e2e/coach-tools.spec.ts:19: alte Erwartung Brett/Antwort innerhalb 900 px;
  Brettunterkante 1220.109375. Erwartung widerspricht dem dokumentierten
  gleichen Lernbrett mit Scrollen seit 0.11.1.
- e2e/desktop-restart.spec.ts:13, e2e/studio.spec.ts:51 und
  e2e/workbench.spec.ts:22: Klick-Timeout; Trace zeigt
  „Partien speichern und laden“ als abfangendes Element aus #board-area.
  Ursache/Abhängigkeit von Headless-Browser und Fontmetriken noch ungeklärt.
- e2e/studio.spec.ts:161: Fixture fängt nur /api/status ab; neue aktive
  Identität kommt aus Diagnose. Erwartet „KI-Zugang konfiguriert“, erhalten
  „Kein aktiver KI-Zugang“. Testfixture/Vertrag gezielt prüfen.
- e2e/studio.spec.ts:332: Timeout beim integrierten Desktop-Lerndialog;
  noch kein nachgewiesener Defekt des echten Anbieterzugangs.

**Nicht veröffentlicht.** Vorgesehener Publisher setzt erfolgreichen
Gesamtprüflauf voraus. Kein gh-pages-Push, kein Release, kein neuer Workflow.
Live-BUILD.json direkt gelesen: weiterhin 0.11.1, Quelle
e0fead85321f90b14c9d1dc2f67f617b7ab4328c.
Nächster Schritt: diese sechs Prüffehler gezielt klären, ohne sie als
bestätigte Nutzer-/Anbieterfehler auszugeben. Appänderungen würden den Auftrag
„ausschließlich bereits gesicherter Entwicklungsstand 0.11.2“ überschreiten;
dieser Dokumentationsnachtrag ändert keine App-Datei.

## Implementiert und inzwischen veröffentlicht: 0.11.2 – KI-Zugang nachvollziehbar

Nutzer meldet unklaren aktiven Zugang und ausbleibende Funktion. Lokal belegte
Probleme: aktive Identität nur im Untermenü; Kostenaktualisierung schrieb
Provider-/Denkstufenwahl zurück, OpenAI-Direktmodelle ohne erneuten Schlüssel
nicht änderbar. Tatsächlicher Kontozustand des Nutzers ist nicht bekannt.
Behoben: Anbieter/Modell/Denktiefe und Betriebszustand als sichtbare Karte oben;
Modellwechsel und Verbindungstest dort. Aktive Identität und Bereitschaft werden
gemeinsam aus lokaler Diagnose gelesen; bearbeitete Formulardaten bleiben stehen.
Verbindungstest generiert keinen Text, OpenRouter bestätigt dabei nur den Schlüssel.
Keine Änderung der verschlüsselten Schlüsselablage oder bezahlter echter Test.
154/154 Einzeltests; 7 betroffene Browserfälle über zwei Läufe erfolgreich,
inklusive OpenRouter-Wechsel/Reload, unverändertem Formular bei Statusrefresh,
HTTP-401-Anzeige und tatsächlicher OpenAI-Modell-ID im abgefangenen Request.
Echte Stockfish/Maia-Inferenz mit Modellfixtures weiterhin bestanden.
Native Windows-/Anbieterkonto-Abnahme offen. Noch nicht veröffentlicht.

## Zuvor veröffentlicht: 0.11.1 – Gleiches Lernbrett und Teststart oben

Die Mindestgrößenkorrektur in 0.11.0 genügte dem Nutzer nicht. Jetzt gleiche
Brettgröße in Spiel- und Lernmodus; kein Reservieren von Chathöhe durch
Brettverkleinerung und kein erzwungenes Scrollen nach Eingabe/Antwort.
Vertikale Reihenfolge bleibt bestehen; bei knapper Höhe muss gescrollt werden.
5/5 Chromiumfälle bestanden: exakter Größenvergleich bei 1920×1080,1600×900,
1280×900,1032×552,980×900,901×900,810×1080,390×844 (Toleranz 1 CSS-Pixel),
64 quadratische Felder, Chat unter dem Brett, Vergleichsbretter und Partieanalyse.
Root-Build/Typprüfung bestanden. Screenshot geprüft, keine native Windows-Abnahme.
„Lernengine gegen Schachengine“ ganz oben mit nur Start/Stop, ohne
Zusatzformular oder Kostencheckbox. Start gilt als Nutzerauftrag für den
bezahlten Test: aktuelles Modell, sichtbare Stellung, am Zug befindliche Farbe,
Gegner/Stufe der vorhandenen Partie (sonst Spielmoduseinstellung). Interne
Obergrenze 100 Modellzüge, Stop/Regelende/Fehler beenden vorher. Separater Test mit d4/d5-Ausgangslage bestanden (5/5 Match-Einzeltests).
Mit ausdrücklichem Nutzerauftrag am 7. November veröffentlicht. Quellcommit
e0fead85321f90b14c9d1dc2f67f617b7ab4328c; gh-pages
8e725c82071ee1ef6e5dfa797b0c34301bada410; Pages-Run 42387905227 SUCCESS.
Öffentliches BUILD.json bestätigt Version und Quelle. Nächster Schritt:
Windows-Abnahme durch den Nutzer und echte Modelltests mit Diagnose.

## Zuvor veröffentlicht: 0.11.0 – OpenRouter, KI-Diagnose und Testpartie

Nutzeraufträge vom 7. November: frei wählbare Modelle über OpenRouter,
Anfrageberichte zur fachlichen Qualitätsprüfung und Lernengine gegen
Stockfish/Maia spielen lassen. Der Nutzerbefund zur übersehenen angegriffenen
Dame ist KEIN behobener Qualitätsfehler. Tatsächliches Modell/Einstellungen der
alten fehlerhaften Antwort waren nicht protokolliert. Keine zusätzlichen
Taktikhinweise als vermeintliche Lösung eingebaut; Modellqualität bleibt zu prüfen.

Implementiert:
- Windows-Lernlayout korrigiert: Desktop-Mindestbrettgröße 280 CSS-Pixel bei
  niedrigen Fenstern, sonst 360; Schrift und Figuren skalieren mit dem Brett.
  Eingabe/aktuelle Antwort bleiben darunter; Desktop-Fokus und Antwort scrollen
  zum sichtbaren Brett. Mobile Größenregeln bleiben erhalten.
- OpenAI-Direktzugang weiter unterstützt; OpenRouter mit aktuellem öffentlichem
  Katalog, Werkzeugfilter, Sol/Argon zuerst, Denkstufe und Modellwechsel ohne
  erneute Schlüsseleingabe. Neue Felder verschlüsselt im bestehenden Browserfach;
  alte Konfigurationen weiter lesbar. Optionales Passwortfach wird beim Modell-
  wechsel nicht still umgestellt: dort Auswahl nur im RAM, dauerhafte Änderung
  über das Zugangsformular. Keine neuen Abhängigkeiten oder Anbieter-Fallbackmodelle.
- Nur feste OpenAI-/OpenRouter-Ziele. Werkzeuge weiter separat regelgeprüft.
  Provider-Fortsetzungsblöcke für Werkzeugrunden im RAM erhalten, nicht exportiert.
  OpenRouter-Modellantwort mit tatsächlichem Modell und gemeldeten Kosten versehen;
  bei Vorführung Summierung der Aufrufe. Fehlende Kostendaten bleiben unbekannt.
- KI-Diagnose: letzte 20 Anbieter-Versuche im RAM, vollständiger öffentlicher
  Anfragekontext mit FEN, Systemvorgaben, Chat/Verlauf, Werkzeugprotokoll,
  Antwort, Modell/Provider, Token-/Denk-Token-Nutzung, Zeit und Fehlerkategorie.
  Separater JSON-Download mit aktueller Brett-/Testlage, ausgeführten Brettaktionen
  und eigener Bewertung/Beobachtung. Schlüssel/Headers und private Denkblöcke
  ausgeschlossen/redigiert. Export lädt nichts automatisch hoch. Vor Reload
  sichern; Chatlöschung entfernt auch Anfrageberichte. Keine automatische Gütenote.
- Testpartie im Lernzweig an der gewählten Stellung: Modell spielt Weiß/Schwarz
  gegen echten Stockfish oder Maia, Stufe 1–5, höchstens 5/10/30/100 Modellzüge.
  Ein bezahlter Aufruf pro Modellzug, ausdrücklicher Start, kein Retry bei illegalen
  Zügen. Stoppen, Sitzungs-/Stellungswechsel und Verlassen des Lernmodus brechen ab.
  Modellwechsel verhindert Fortsetzung mit anderem Modell. Partiecursor erhalten;
  Ergebnis nur bei tatsächlichem Regelende, sonst Zuggrenze/Fehler, keine Elo-Zusage.

Prüfung: 153/153 Einzeltests, strikte Typprüfung und Root-/Pages-Build bestanden.
Breiter Chromiumlauf 74/83 bestanden; neun alte UI-Annahmen (Spaltenlayout,
Schlüsselbeschriftung, Partiestart-Teiltreffer) eingegrenzt und korrigiert.
Danach 17/17 betroffene Fälle bestanden. Zusätzlicher realer Maia-Testlauf und
abschließende Kernprobe: 4/4 bestanden. Alle 84 aktuellen Browserfälle damit
individuell erfolgreich; kein vollständiger 84/84-Lauf behauptet.
Öffentlicher echter OpenRouter-Katalog gelesen: 433 Textmodelle, 374 mit
Werkzeugen; Sol und Argon mit Denk-/Werkzeugparametern und Preisen enthalten.
Providerantworten ausschließlich Fixtures; echte Stockfish-WASM-/Maia-ONNX-
Inferenz. KEINE bezahlte KI-Partie oder schachliche Modelleignung nachgewiesen.
Mobile Lernansicht/Diagnoseseite visuell geprüft. Native Geräteabnahme offen.

Am 7. November mit ausdrücklichem Nutzerauftrag veröffentlicht. Quellcommit
c95e934f2b8e7eb0d20d49077603e0addb4484d3; gh-pages
aa92eee6040bd5973a4ad38ea04c2f65eeb695ed; Pages-Run 42386684454 SUCCESS.
Öffentliches BUILD.json bestätigt 0.11.0 und den Quellcommit; HTML, Service Worker,
Haupt-JavaScript und CSS stimmen per SHA-256 mit dem geprüften Build überein.
Nächster Schritt: echte Modellvergleiche anhand exportierter Diagnosen.
Bedienung und Prüfgrenzen: docs/AI_EVALUATION.md.

## Zuvor veröffentlicht: 0.10.1 – Kostenanzeige und vertikaler Lerndialog

Veröffentlicht nach ausdrücklicher Nutzerfreigabe am 7. November 2026. Quelle
`5150905144dcc99211ed7e8e662d12971d09954e`; gh-pages
`49c852db20d4d1d490c433e53510a73a265b3d23`. GitHub-Lauf
[42378369092](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42378369092)
für genau diesen Commit: **completed / success**. Öffentliches BUILD.json
stimmt vollständig mit Version und Quellcommit überein. SHA-256 von index.html,
Service Worker, Haupt-JavaScript und CSS entsprechen dem vorbereiteten Build.


Nutzerentscheidung vom 7. November: Budgetperiode und Drei-Anfragen-Grenze
entfernen. In Browser und Desktop keine Sperre anhand lokaler Verbrauchswerte,
keine Periodenfreigabe und kein Prozess-/Fensterkontingent mehr. Vorhandene
Kostenwerte/Preisannahmen bleiben erhalten, auch bei früher ausgeschöpftem
Budget. Die Oberfläche zeigt Kosten/Anfragen fortlaufend; nur Preisannahmen
sind einstellbar. Altes budgetUsd-Feld ausschließlich zur Speicherkompatibilität,
keine Auswertung als Limit. Kein Schlüssel-/Sitzungswechsel nötig.

Brettvorführung bereits seit 0.10.0 vorhanden: freie Bitte im Chat, geprüfte
show_line/play_engine-Ausführung im Lernzweig und Rückkehr zum Ausgangspunkt.
Dazu sichtbaren Beispielhinweis am Chat ergänzt. Tatsächliche Partie bleibt
erhalten; weiterhin zwei Werkzeugrunden pro Nachricht, eine aktive Anfrage und
keine automatischen Wiederholungen. Das ist kein Gesamt-Anfragekontingent.

Zusätzlicher Nutzerauftrag: Brett muss beim Besprechen sichtbar bleiben.
Breite Spaltenansicht entfernt. Einheitliche Reihenfolge: Planbutton über dem
Brett, darunter Eingabe, aktuelle Antwort, bisheriger Chat. Aktuelle Antwort
und Verlauf getrennt dargestellt, keine doppelten Beiträge oder neuen
Speicherformate. Lange Antworten intern scrollbar; Brett nach Fensterhöhe und
Schriftgröße begrenzt. Zugnavigation/weitere Werkzeuge folgen erst danach.
Planbutton sendet einen ausdrücklichen freien Vorführungsauftrag über dieselbe
geprüfte Werkzeugkette. Ungesendeter Entwurf bleibt erhalten. Ohne aktiven
KI-Zugang bzw. während einer laufenden Anfrage/Rückblicksperre deaktiviert.

Prüfung: 141/141 Einzeltests; 18/18 betroffene Chromium-Browserfälle inklusive
mehrerer Fenster, Reload, gespeichertem Zugang, Offline/Update, grafischer
Vorführung mit echtem Stockfish und Maia sowie Windowsgrößen bestanden.
Anbieterantworten dabei Fixtures, keine bezahlten Modellanfragen. Native
Geräteabnahme und tatsächliche KI-Werkzeugwahl bleiben gesondert offen.

Zusätzliche Layoutprüfung abgeschlossen: 141/141 Einzeltests, Typprüfung und
Root-/Pages-Build bestanden. Breiter Browserlauf: 50/51 Fälle bestanden; einzig
ein veralteter Kostentest verlangte noch das entfernte Budgetfeld. Diesen
Test auf Preisannahmen umgestellt, danach Schlussprobe mit Planbutton, Kosten-
Einstellungen und Layout: 3/3 bestanden. Alle 51 betroffenen Fälle damit
einzeln erfolgreich, kein einzelner vollständig grüner 51er-Lauf behauptet.
Geometrie bei 1600/1440/1280×900, 810×1080, 390×844, 1280×600 und 150-%-
Schrift geprüft; Brett, Eingabe und aktuelle Antwort gleichzeitig sichtbar.
Desktop-, vergrößerte und Telefonansicht visuell geprüft. Native Geräte-
und echte KI-Modellqualität dadurch nicht abgenommen. Keine bezahlten Aufrufe.

Öffentliche App auf 0.10.1. Nächster Schritt: Nutzerabnahme des vertikalen
Lernlayouts und des Planbuttons mit dem eigenen Modell. Keine neue Einrichtung
oder Datenlöschung nötig.

## Aktuell: 0.10.0 veröffentlicht – freier Lernchat, Brettwerkzeuge und Desktoplayout

Veröffentlicht nach ausdrücklicher Nutzerfreigabe am 7. November 2026. Quelle
`c93d6a0c33f9fb801ec7c5b4f4410acf4e7aca16`; gh-pages
`b266112dc57d773ecb6ea0318a4ccd2d53dfbcc5`. GitHub-Lauf
[42373356791](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42373356791)
für genau diesen Commit: **completed / success**. Öffentlicher Abruf bestätigt
das vollständige BUILD.json mit Version und Quellcommit. SHA-256 von index.html,
Service Worker, Haupt-JavaScript und CSS stimmen mit dem vorbereiteten Build überein.

Nutzerauftrag vom
7. November: frei sprechen, Züge am Brett zeigen, mit der Spielengine fortsetzen;
zusätzlich Windowslayout mit zu großer Zugliste über dem abgeschnittenen Brett
verbessern. Ziel/Abnahme in DEVELOPMENT_PLAN.md, Einstieg in AGENTS.md aktualisiert.

Implementiert:

- Freier Textchat ohne Pflicht-Antwortschema; aktuelle ausgewählte Stellung,
  tatsächliche Partie und Gespräch im Kontext. Unvollständige Zusatzfelder
  vernichten keine Erklärung. Nur legale Vorschläge ausführbar. Bis 40 passende
  Gesprächsbeiträge unter begrenztem Kontextbudget, Kürzung markiert. Für
  Werkzeugfolgen anfangs Kontextreserve; gespeicherter Verlauf bleibt vollständig.
- Optionale show_line- und play_engine-Funktionsaufrufe getrennt vom Erklärungstext.
  Gemeinsame Regelprüfung, Ausführung im Lernzweig, echte Antwort der gewählten
  Stockfish-/Maia-Spielengine. Ergebnis mit ausgeführten SANs und FEN als echte
  assistant/tool-Nachrichten zurück an den Lernchat, dann freie Erklärung.
- Maximal zwei Werkzeugrunden je Nachricht, bis drei normal budgetierte Modell-
  anfragen einschließlich Erklärung. Keine automatischen Anfrage-Retries,
  Limit-/Budgetrücksetzung oder unbeschränkte Spielschleife. Bleibt nach einer
  Aktion kein Budget für Erklärung, bleibt ein ehrlicher App-Aktionsbericht.
- Stopptaste, Rückkehr zum Vorführungsbeginn, Schutz bei Session-/Stellungswechsel
  und Chatlöschung. Unzulässige Linien vor erstem Zug vollständig verworfen.
  Tatsächlicher Partiecursor unverändert, gezeigte Varianten bleiben erhalten.
  Vorführungsberichte und nachfolgende Erklärungen bleiben auch beim Wechsel
  zu früheren Stellungen im freien Chat sichtbar und passend verortet.
- Desktop: Brett links vollständig sichtbar, Chat/Eingabe rechts. Kompakte
  Zugliste darunter, gewählter Zug sichtbar. Niedrige/schmale Fenster gestapelt,
  mobile Ansicht erhalten. Getrennte Chat-/Zuglistenscrollbereiche; Hilfe überdeckt
  die Eingabe nicht. Schriftvergrößerung und kurze Windowsfenster geprüft.

Prüfstand: 141/141 Einzeltests, Typprüfung und Builds bestanden. Breiter
Chromiumdurchlauf 79/79 bestanden; danach zusätzliche Maia-Werkzeugprobe und
gezielte Schlussprüfungen bestanden, siehe docs/VALIDATION.md. Echter Stockfish
und echtes Maia-2 in der Werkzeugkette geprüft; Modellaufrufe dafür ausdrücklich
kontrollierte Fixtures. Keine bezahlten Modellaufrufe. Reale KI-Werkzeugauswahl,
pädagogische Qualität und native Windows-/iPad-Abnahme bleiben getrennt offen.

Nächster einzelner Schritt: Nutzerabnahme des freien Lernchats und Windowslayouts
in 0.10.0. Keine erneute Schlüsseleinrichtung und keine Datenlöschung erforderlich.

## Aktuell: 0.9.0 veröffentlicht – Chatverlauf löschen und Fehlerauskunft

Veröffentlicht nach ausdrücklicher Nutzerfreigabe am 7. November 2026. Quelle
`7c40cb77afa27e240efc0becbae97d58f132d465`; gh-pages
`148d2beabe0ec69e6acffd8ed84b69cf6b1610d2`. GitHub-Lauf
[42351623420](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42351623420)
für genau diesen Commit: **completed / success**. Direkter öffentlicher Abruf
bestätigt 0.9.0 und Quellcommit; BUILD.json vollständig sowie SHA-256 von HTML,
Service Worker und neuem JS-Bundle stimmen mit dem vorbereiteten Build überein.
Native Geräte- und echte Modellabnahme bleiben davon getrennt.


Nutzerauftrag: Möglichkeit zum Löschen des bisherigen Chatverlaufs. Schaltfläche
„Chatverlauf löschen“ direkt im Lernchat, mit kurzer Bestätigung. Löscht alle
Dialogue-Annotationen dieser Sitzung über alle Varianten. Züge, aktive Stellung,
Partie, Varianten, eigene Notizen/Reflexionen, ungesendeter Entwurf und KI-Zugang
bleiben erhalten; benannte gespeicherte Kopien anderer Sitzungen unverändert.

Nach dem Löschen wird die automatische Sitzung gespeichert. Auch bereits
laufende Antworten werden über eine nicht persistierte Chatrevision verworfen,
damit sie den Verlauf nicht erneut auffüllen. Beim nächsten Gespräch wird kein
gelöschter Chat als Modellvorgeschichte übergeben. Keine Anfrage oder Änderung
am Kostenkonto durch das Löschen. Die zuvor vorbereitete Diagnosekorrektur aus
0.8.2 ist enthalten; die unbekannte Ursache des echten KI-Fehlers bleibt offen.

Prüfungen: 128/128 Einzeltests; Browserablauf mit Bestätigung/Abbrechen und
Neuladen geprüft. Abschließende Ergebnisse siehe docs/VALIDATION.md. Veröffentlichung bestätigt. Nächster Schritt: vorhandene App über ihre Updatefunktion übernehmen.

## Enthaltene vorbereitete Diagnosekorrektur aus 0.8.2

Nutzer meldet nach 0.8.1 „Modellanfrage fehlgeschlagen“, darüber weiterhin die
alte Mattbeschreibung. Nun eine echte Sitzungsdatei und Screenshot vorhanden.
Datei lokal erfolgreich mit Session.import geladen; für die tatsächliche Partie
141 Halbzüge rekonstruiert. parseRequest akzeptiert die Anfrage; rekonstruierter
Test-Providerpayload rund 13 kB, unter dem 24-kB-Weblimit. Kein bezahlter Aufruf.
Keine nachgewiesene Ursache aus Dateikorruption oder Kontextgröße. Die Sitzung
enthält keine neue Modellantwort und keine Fehlerdetails des fehlgeschlagenen
Aufrufs. Anbieterablehnung, Abbruch oder Formatprüfung bleiben mögliche Ursachen.

Nachgewiesener Appfehler: Web-/Desktopanbieter fassen unterschiedliche Fehler
zu HTTP 502 zusammen; der gemeinsame Client verschluckt auch diesen Fehlertext.
Implementiert: feste sichere Kategorien für Netzwerk, HTTP-Ablehnung, Anbieterlimit,
Antwortformat, Ausgabelimit und ungültigen Rückblick; Kategorien im Web- und
Desktoptransport erhalten. UI zeigt sichere Kategorie und kennzeichnet die
bisherigen Chatbeiträge als frühere Antworten. Keine Anbieterrohtexte oder
Schlüssel anzeigen; keine automatischen Versuche oder Budgetrücksetzung.

Prüfungen: 126/126 Einzeltests, neuer Browserfall bestanden; abschließende
Prüfungen siehe docs/VALIDATION.md. Dies ist eine Diagnosekorrektur, kein
Nachweis, dass die tatsächliche Modellanfrage nun gelingt. Keine Nutzerdatei
oder deren private Originalinhalte ins öffentliche Repository übernommen.

Die Diagnosekorrektur ist mit 0.9.0 veröffentlicht. Nächster Schritt: die
konkrete Fehlerkategorie des echten Aufrufs beurteilen. Keine
weiteren kostenpflichtigen Wiederholungen ohne neue Diagnose empfehlen.

## Aktuelle Korrektur: 0.8.1 veröffentlicht

Veröffentlichung nach ausdrücklicher Nutzerfreigabe abgeschlossen: Quelle
`d4f21d18bd179fe56f26e66b9a680ad0ef5936cc`, gh-pages
`cf999e7a5f08a0d0bc16ea5e0da4373e6a37633d`, Lauf
[42350153155](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42350153155)
**completed / success** für genau diesen Commit. Öffentliche App am 7. November
2026 direkt geprüft: BUILD.json stimmt vollständig mit 0.8.1/Quelle überein;
SHA-256 von index.html, service-worker.js und neuem JS-Bundle stimmen mit dem
vorbereiteten Build überein. Keine native Geräte- oder echte Modellabnahme daraus
ableiten. Adresse: https://wibem1.github.io/AI-Chess-Studio/ .


7. November 2026. Ausgangspunkt: work 85fa26aa, veröffentlichte App 0.8.0.
Nutzerbeleg: „Analysiere das Spiel“ führte nur zu wiederholter Beschreibung
der Mattstellung, ohne konkrete Entscheidungen im Verlauf zu erklären.

Ursachen im Code: freie Spielanalyse konnte als topic position laufen; das
gemeinsame Antwortschema priorisierte aktuelle FEN/assessment und sehr kurze
Antworten. Der ganze SAN-Verlauf war bereits vorhanden; keine Behauptung, die
gesamte Historie habe grundsätzlich gefehlt.

Implementiert: sprachlich ausdrückliche Spielanalyse als review/explain routen,
tatsächliche Partie statt ausgewähltem Analysezweig verwenden. Eigener validierter
Partierückblick mit 2–4 chronologischen Lernmomenten, belegten SAN-Zügen, legalen
Alternativen an der historischen Stellung und konkreter Lerngewohnheit. Bei sehr
kurzen Partien entsprechend weniger Momente. Reine Schlusszugantworten und falsche
Zuordnungen ablehnen. Buttons öffnen die Stellung VOR einer Entscheidung; keine
Partieänderung. Regelereignisse gleichmäßiger verteilt, volle Historie erforderlich.
Keine Sitzungsmigration oder Änderungen an gespeicherten Zugängen. Ein Aufruf,
1800 Ausgabe-Tokens nur für diesen Rückblick mit entsprechender Kostenreservierung;
bisherige Limits bleiben. Keine automatischen Faktenchecks oder Retries.

Prüfungen und Grenzen: siehe neuen Abschnitt in docs/VALIDATION.md. Implementierung
und automatisierter Ablauf sind belegt; echte Modellqualität ist weiterhin offen.
Keine bezahlten Modellaufrufe. Veröffentlichung nach ausdrücklicher Nutzerfreigabe. Die konkrete Nutzerpartie
aus dem Screenshot liegt nicht als vollständige Datei vor; synthetische Tests
ersetzen deren Prüfung nicht.

Nächster einzelner Schritt: vorhandene Web-App über ihre Updatefunktion auf
0.8.1 übernehmen. Echte schachliche Erklärqualität bleibt gesondert zu beurteilen.
Nicht erneut Zugang einrichten oder Daten löschen. Bei bereitgestellter echter
Partiedatei kann deren tatsächlicher Kontext separat geprüft werden.

## Bisher veröffentlichter Stand

Stand: 7. November 2026 · **0.8.0 veröffentlicht, GitHub-Erfolg bestätigt**.
Quelle cf672f2e28026cec25e0a98f46f4a52bf61f2835; gh-pages
75e778925920f000cf99ca16c23816e9a678a47e; Run 42346000024 SUCCESS.
Öffentliches commitgebundenes BUILD.json bestätigt Version, Basis, Quelle
und unveränderten Maia-Modellfingerabdruck (22 Dateien). Direkter github.io-
Abruf hier netzpolitisch gesperrt; native Nutzerabnahme bleibt getrennt offen.

Aktuelle Nutzerfehler: Spiel nicht analysierbar, Chat zu weit von Brett entfernt,
technische Einstellungen zu prominent, merkwürdige Antworten, Demo trotz
Schlüssel-Speicherung. Konkreter Geräte-/Antwortbefund fehlt; keine pauschale
Ursachenbehauptung über die echte Modellqualität.

Identifizierte und implementierte Korrekturen:

- Gespeicherter Zugang wurde bei verbrauchtem Anfragekontingent nach Neustart
  nicht automatisch ausgewählt. Schlüssel, Freigabe und verbleibende Anfragen
  jetzt trennen; echte KI bleibt bei Limits als gesperrt ausgewählt. Lokale
  Prüfung beim Start, persistente explizite Moduswahl, Speichern aktiviert KI.
  Kein Provider-Testaufruf, keine Freigabe-/Budgetrücksetzung oder Key-Migration.
- Lernmodus einspaltig: Navigation und Brett, direkt darunter Chat; weitere
  Werkzeuge und zugeklappte Technik folgen. Auch mobil keine Formulare dazwischen.
- Laufende/abgeschlossene Partie am anklickbaren Zugverlauf durchgehen und
  Varianten abzweigen. Verstecktes Thema „review“ versetzt eigene Nachrichten
  nicht mehr ans Partieende. Ganze Partie nur über ausdrücklichen Analyseknopf.
  Analyseknöpfe übersteuern Leitfragen nur für diese Anfrage, nicht die Präferenz.
- Demo ohne erfundene Eröffnungspläne oder beliebige erste legale Züge. Alte
  Beiträge erhalten; Demo-Zugtipps nicht mehr als KI-Vorführung anbieten.
- Direkte Antwort zuerst; Brettfiguren, begrenzte geprüfte Verlaufsereignisse
  sowie tatsächliche vorhandene Stockfish-Zahlen/Varianten mit FEN/Suchgrenzen
  im Kontext. Unterschiedliche Dialogstellungen explizit zugeordnet. Harte
  Matt-Widersprüche verworfen; keine automatische Stockfish-Analyse gestartet.

Prüfung: `npm run test:all` bestanden – strikte Typprüfung, Web-/Pages-Build,
**119/119 Einzeltests und 72/72 Chromiumfälle**. Nach dem abschließenden
Starttext erneut beide Builds und zwei Zugangsregressionen bestanden. Desktop-
und Mobilansichten mit gespeichertem Testzugang visuell geprüft; KI-Antwort
dafür abgefangen, keine reale Modellqualität behauptet. Echte
KI-Qualität weiterhin nicht durch bezahlte Modellaufrufe geprüft; keine solchen
Aufrufe autorisiert/ausgeführt. Native Windows-/Android-/iPad-Abnahme bleibt offen.
Nächster einzelner Schritt: Nutzer übernimmt 0.8.0 und prüft die eigene
Analysebedienung und Zugangsanzeige. Keine erneute Key-Eingabe oder Einrichtung
verlangen; Limits bleiben bewusst aktiv. Reale KI-Qualitätsbefunde anschließend
an konkreten Stellung-/Antwortpaaren prüfen, keine bloßen Fixture-Versprechen.

## Voriger bestätigter Stand 0.7.0

Stand: 6. November 2026 · **0.7.0 veröffentlicht, GitHub-Erfolg bestätigt**.
Quelle 5c5e9e298286b56498ad4edbfab979ecf58d8c78; gh-pages
25527617b61573a816c3ee620acd76b68b6d0f4d; Run 42312123694 SUCCESS.
Öffentliches commitgebundenes BUILD.json bestätigt Version, Basis, Quellcommit
und Maia-Modellfingerabdruck (22 Builddateien). Liveabruf von github.io hier
netzpolitisch gesperrt; native Geräteabnahme bleibt getrennt offen.
Aktueller Auftrag: Maia als wirklichen alternativen Gegner anschließen.

Echte Maia-2-Blitz-ONNX-Inferenz im einzelnen CPU-WASM-Browserworker, lokal auf
allen Zielplattformen verwendbarer gemeinsamer Code. Fünf Trainingsprofile
1100/1300/1500/1700/1900, keine Elo-Zusage. Stockfish bleibt auswählbar.
Maia-Laden erst bei tatsächlichem Einsatz (rund 60 MB Modell/Laufzeit), dann
separater Browsercache für Offline-Spiel. Kein API-Key oder bezahlter Aufruf
für Maia. Fehler pausieren, kein stiller Stockfish-Ersatz. Regelprüfung,
Lernchat, Rücknahme, Varianten und Partienablage bleiben getrennt erhalten.

Modellgröße und SHA-256 beim Build und vor Inferenz geprüft. Originalgewicht
unverändert von commitgebundener GitHub-ONNX-Quelle; Encoder/Decoder und ORT
fest versioniert. Quellen/Lizenzen in vendor/maia2 und öffentlichem Lizenzlink.
Modellschwäche frühe Eröffnung und Nicht-Kalibrierung der Profile ausdrücklich
benannt. Maia-Wertkopf wird nicht als Lernbewertung ausgegeben.

Kleine Prüfungen bestanden: echte WASM-Vorhersagen an 18 veröffentlichten
Referenzfällen, beide Zugfarben/drei Ratings; Maia-Spiel für beide Farben im
Chromium, Lernmodus, Rücknahme, Downloadabbruch, Touch-Viewports sowie
vollständiger Offline-Neustart unter /AI-Chess-Studio/. `npm run test:all`
bestanden: Typprüfung, beide Builds, **112/112 Einzeltests und 68/68
Chromiumfälle**. Nach abschließender Lernchat-Beschriftung erneut beide Builds
und sechs betroffene Browserfälle bestanden. Echte Maia-Desktopansicht visuell
kontrolliert.
Keine kostenpflichtigen Modellaufrufe. Native Windows-/macOS-/Android-/iPad-
Abnahme und subjektive menschliche Spielqualität bleiben gesondert offen.
Nächster einzelner Schritt: reale Spielprobe auf den Nutzergeräten mit 0.7.0,
besonders Erstladen, Speicherbedarf und subjektiv menschlichere Zugwahl.
Kein erneutes Einrichten von Schlüsseln, Servern oder Cloud-Umgebung nötig.

## Voriger bestätigter Stand 0.6.0

Stand: 6. November 2026 · **0.6.0 veröffentlicht, GitHub-Erfolg bestätigt**.
Quelle 1f73f79b6c64275fa2bd6061d0b4970ae67a0e13; gh-pages
89f9efca91b434a4070fa64dec48abe0a9d052cd; Run 42308288822 SUCCESS.
Öffentliches commitgebundenes BUILD.json bestätigt Version, Basis und Quelle.
Liveabruf von github.io hier netzpolitisch gesperrt; Geräteabnahme getrennt offen.

Aktueller Nutzerauftrag: Schriftzoom, Rücknahme während der Partie, klare
Gefahren und begründete Stellungsvor-/nachteile im Lerndialog; Maia als
menschlicheren alternativen Gegner untersuchen.

- Schrift 80–200 %, lokal im Browser gespeichert, ohne Anfrage oder Änderung
  an Partie/Key. Kopfbereich und Desktopbrett passen sich an Schriftgrößen an.
- „Schritt zurück“ auf Desktop neben den Modusschaltern, mobil am Brett:
  letzter eigener Zug samt möglicher Antwort zurück; eigene Seite wieder am
  Zug. Laufende Antwort abbrechen/verspätete verwerfen, keine Rücknahme vor
  Partiestart oder des ersten weißen Enginezugs bei eigener schwarzer Seite.
  Alte Varianten mit Notizen/Kommentaren bleiben gespeichert.
- Echte KI-Erklärung verlangt qualitative Beurteilung mit Begründung und
  konkreten Gefahren. Regelgeprüfte Fakten aus FEN zu Material, Zugrecht,
  Schach/Matt/Patt, Matt in einem und legalen Schlagzügen werden mitgegeben;
  Schach/Matt und Material separat sichtbar. Kein automatischer Enginebalken.
  Leitfragen/kleine Hinweise bleiben gestuft, Demo klar als Beispiel bezeichnet.
- Maia-Machbarkeit samt offiziellen Quellen in docs/MAIA.md. Maia ist **nicht
  integriert/getestet**; offizielle Python-/UCI-Laufzeit ist nicht direkt auf
  GitHub Pages nutzbar. Gewichtsbedingungen/Browserexport offen, keine Gewichte
  geladen. Stockfish bleibt vorhandener Gegner.

Prüfung am endgültigen Stand: `npm run test:all` erfolgreich, Typprüfung,
Web-/Pages-Build, **110/110 Einzeltests und 65/65 Chromiumfälle**. Drei echte
Browseransichten visuell kontrolliert (Desktop, 200-%-Schrift, Mobilansicht). Keine kostenpflichtigen Modellaufrufe;
Lerndialog mit abgefangenem Providertransport, nicht als echte Modellqualität
bewertet. Native Windows/Android/iPad-Abnahme bleibt getrennt offen.
Nächster einzelner Entwicklungsschritt: isolierter Maia-Browser-Prototyp,
zuerst Modellrecht/Exportfähigkeit und vorhandene Browserlaufzeiten prüfen.
Neue Schrift-/Rücknahmebedienung auf tatsächlichen Nutzergeräten noch nicht
bestätigt; reale Lern-KI-Qualität durch die Antwortfixtures nicht belegt.

## Voriger bestätigter Stand 0.5.1

Stand: 6. November 2026 · **0.5.1 veröffentlicht, GitHub-Erfolg bestätigt**.
Aktuelle Quelle 5cd6b45; gh-pages 3eb4c61bc7ce5b442d28c23211e050243be890a7;
Run 42303046331 SUCCESS. Öffentliches commitgebundenes BUILD.json bestätigt
Version, Basis und Quellcommit. Nächster Schritt: Nutzer übernimmt 0.5.1 und
prüft Neu-Speichern im oberen API-Key-Formular ohne altes Passwort.

Voriger Auftrag: Nutzer meldet auf 0.5.0 „Passwort eingeben“ beim Speichern
und lehnt die Zehn-Zeichen-Vorgabe nochmals ausdrücklich ab. Exakte Quelle
des nativen Dialogs auf seinem Gerät nicht beobachtet; kein endgültiger
Ursachennachweis behauptet. Code/Bedienung verbessert: alter Passwortzugang
getrennt und zugeklappt unterhalb des Neu-Speicherformulars, kein altes
Passwort zum Ersetzen durch neuen Key nötig. Ausgeblendetes Zusatzpasswort
deaktiviert/ignoriert, keine Mindestlänge für freiwilligen Schutz.
Eigene klare Formularvalidierung; Eingabe bleibt bei fehlender Freigabe oder
Speicherfehler bestehen. Erfolg erst nach Lesen/Entschlüsseln der persistierten
Kopie; danach Eingabe leeren. Partien/Budgets/DB-Version unverändert.
104/104 Einzeltests, 62/62 Browserfälle bestanden. Reale Geräteabnahme offen.
Bereitstellung abgeschlossen; native Speicher-/Bedienungsabnahme durch Nutzer offen.

Vorige Bereitstellung 0.5.0:
Aktueller Quellcommit cb25948, gh-pages b05543e4ea5d8eef0177e953562eef021b7d9bf8,
Run 42294382384 SUCCESS. Öffentliches commitgebundenes BUILD.json bestätigt
Version/Basis/Quellcommit. Nächster Schritt: Nutzer übernimmt 0.5.0; neue Keys
ohne Zusatzpasswort speichern, bestehende Passwortfächer bei Wunsch nach
einmaligem Entsperren explizit umstellen. Windows-Bedienungsabnahme offen.

Voriger bestätigter Stand 0.4.1:
Aktueller Quellcommit 9626a023c6158db36060c584eec50c245b30ddba, gh-pages
9a8785e55c760e077338b68c9a98e579a74dabfe, Run 42290733124 SUCCESS.
Commitgebundenes öffentliches BUILD.json bestätigt 0.4.1 und Quellcommit.
Nächster Schritt: Update auf 0.4.1 und native Windows-Bedienungsabnahme durch
Nutzer; kein erneutes Einrichten oder Löschen von Daten erforderlich.

Vorige Bereitstellung 0.4.0 erfolgreich bestätigt.
Quellcommit 76de2fc, gh-pages 441b36dc64d92c8fad11b3675a52539336974ae6,
Run 42285782065 SUCCESS. Commitgebundenes öffentliches BUILD.json bestätigt
0.4.0 und Quellcommit. Der rohe Branch-Alias lieferte zunächst noch gecachte
0.3.3-Metadaten; daraus keine Live-Störung ableiten. Direkter github.io-Abruf
bleibt hier durch Netzwerkpolitik gesperrt. Nutzer hatte das vorige Update
auf 0.3.3 bereits bestätigt.
Bestehendes öffentliches Repository und gh-pages verwenden, keine neue Ablage.

## Aktueller Auftrag 0.5.0: kein Pflichtpasswort, Windows-Überlauf beheben

Nutzer beanstandet die Pflicht zu einem mindestens zehnstelligen Zusatzpasswort
und liefert 0.4.1-Screenshot mit horizontalem Scrollbalken und abgeschnittener
rechter Spalte. Überlauf vor Korrektur reproduziert bei 1066 px schon mit 16 px
Schrift: intrinsische Mindestbreite des Level-Selects verbreiterte Grid-Spalten.

Standard jetzt lokales Browserprofil ohne zusätzliches App-Passwort:
AES-GCM-256, nicht exportierbarer CryptoKey und Ciphertext in einem IndexedDB-
Vault-Datensatz (Version 2); automatisch lokal öffnen. Kein OS-/Hardwaretresor,
keine zusätzliche Sperre gegen dieses Browserprofil/Same-Origin-Code.
Vorhandene Version-1-Passwortfächer bleiben unverändert lesbar. Optionaler
Zusatzschutz bleibt; nach Entsperren ausdrücklich ohne erneute Key-Eingabe auf
Profilmodus umstellen. Kein automatisches Überschreiben alter Daten.
Budget und Partien unverändert. Keine Provideranfrage durch Speichern/Start.

Formularspalten minmax(0,1fr), Felder/Beschriftungen innerhalb ihrer Breite,
schmale Einrichtung untereinander. Hilfstasten hinter „Bedienungshilfe“;
Diagnose nutzt im Webbetrieb den lokalen Adapter statt falschem Serverfehler.
Gezielte Layoutprüfung bei 1066/1280/1440 und 16/24 px Schrift vor/nach Korrektur.
103/103 Einzeltests und 60/60 Browsertests einschließlich Scrollhilfe bestanden.
Gesamtsuite und Auslieferung sind in docs/VALIDATION.md dokumentiert.

Bereitstellung abgeschlossen. Nutzer übernimmt Update und prüft Windowsdarstellung.
Native Windows-/Android-Abnahme und echte KI-Qualität bleiben offen.

## Korrektur 0.4.1 – aktueller Nutzerauftrag

Nutzer meldet Desktopbrett zu klein, Android passend, neue Partie ohne Wirkung
und unbefriedigende Gestaltung. Ursachen: Höhenabzug von 300 CSS-Pixeln macht
kurze Windows-Viewports klein; alter Button öffnete nur die Einrichtung.

0.4.1: Desktopbrett oben im Panel, Status/Werkzeuge darunter; nutzbare Höhe bis
Fensterhöhe minus 150 px, größere proportional skalierte Figuren und ruhigere
Desktopgestaltung. Bei 1280×600 450 statt 300 px. Tatsächliche Inhaltsbreite
steuert Umbruch, damit CSS-Zoom keine Seitenleiste über Brettknöpfe legt.
Android-Touchlayout nicht umgestaltet.

Ein gemeinsamer Neustart für Button und Formular: laufende Engine pausieren,
aktuelle Sitzung bei Inhalt separat sichern, dann neue Session/Grundstellung
und gewünschte Farbe/Stärke starten. Sessionwechsel verwirft alte Antworten;
kein stiller Verlust von Kommentaren/Varianten. Partienliste sofort aktualisiert.
Fehlschlag der Sicherung lässt die bisherige Sitzung pausiert erhalten.

Zwei zusätzliche Browserregressionen: große und vollständig sichtbare Bretter
bei 1280×600, 1440×900, 1920×1080 und schmale Darstellung; Neustart aus einem
kommentierten Lernzweig, Wiederladen der Sicherung, Engine-Erstzug bei Schwarz.
100/100 Einzeltests und 57/57 Browsertests bestanden; endgültige Desktop- und
Handydarstellung visuell geprüft. Auslieferungsstatus in docs/VALIDATION.md.
Native Windows-/Android-Abnahme durch Nutzer weiterhin erforderlich.

## Aktueller Schritt: ein Brett, zwei Modi und gespeicherte Partien

- Großes gemeinsames Brett; Spielmodus gegen Stockfish und Lernmodus mit Chat
  und Varianten. Einstellungen sind eine Nebenansicht statt eines dritten Modus.
- Moduswechsel pausiert den Gegner und verwirft ausstehende Gegenzüge. Rückkehr
  zur unveränderten echten Partie; erneutes Lernen erhält den Lernzweig, solange
  sich die Partiestellung nicht geändert hat. Wiederhergestellte Partien bleiben
  bis zum ausdrücklichen Spielmodus/Fortsetzen pausiert.
- Die Lernengine erhält Stellung und tatsächliche Zugfolge automatisch. Geprüfte
  Kandidaten als „Zug zeigen“ im Lernzweig anwenden, Start/Ziel markieren. Eigene
  Züge mit ausdrücklichem „Zug kommentieren“ besprechen. Keine automatische
  kostenpflichtige Anfrage. Humanfaktor und bisherige Limits unverändert.
- Unter dem Brett „Partien speichern und laden“: benannte lokale Kopien und
  vollständige JSON-Dateien mit Kommentaren, Varianten, Dialog, Namen/Vergleichen.
  Vor dem Laden aktuelle Arbeit separat sichern; ungültige Datei verwirft nichts.
  Bestehende Sitzungsschemas 1/2 lesbar. Keine Schlüssel/Kosten in Dateien.
- Sammlung liegt als separater Schlüssel im bestehenden IndexedDB-Sessionstore,
  Transaktionen schützen vor überschriebenen parallelen Speicherungen. Keine
  Datenbankversionsänderung, Cache-/Vault-Löschung oder neue Manifest-ID.
- Erweiterte PGN-Rückblicke, Diagnose, Schlüssel, Kosten und Web-Updates bleiben
  vorhanden. Geöffneter Rückblick bleibt nach Wiederherstellung sichtbar.

Prüfgrundlage: **100/100 Einzeltests und 55/55 Chromiumfälle bestanden**, einschließlich zwei neuer
Arbeitsablauf-/Speicherfälle. Gezielt echte Enginepausen, erhaltene Lernzweige,
regelgeprüfte Chat-Vorführung, Kommentar-/Varianten-Dateirundlauf, lokale Sammlung,
fehlgeschlagener Import und Wiederherstellung nach Neuladen. Desktop-/Handy-
Screenshots visuell geprüft. Tatsächlich veröffentlichte 0.3.3-Altdateien gegen
BUILD.json verifiziert; lokaler Updatewechsel auf 0.4.0 erhält Stellung/Entwurf. Details und endgültige Ergebnisse: docs/VALIDATION.md.
Echte KI-Lernqualität, Bedienungsabnahme und native Android-Installation weiterhin
offen. Keine bezahlten Modellaufrufe für die Entwicklung.

Nächster einzelner Schritt: Nutzer übernimmt 0.4.0 über die bestehende
Web-Updatefunktion und erprobt Spiel-/Lernwechsel sowie Partien speichern/laden.
Umsetzung, automatische Prüfungen und Veröffentlichung abgeschlossen; echte
Bedienungs-/KI-Abnahme bleibt vom Nutzer zu bestätigen. Das erfolgreiche Update auf 0.3.3 nicht erneut
als Problem führen. Die native Chrome-156-Installation bleibt ein separater Fehler.

## Verbindliches Ziel

Persönliches deutschsprachiges Schach-Lernprogramm: gegen Stockfish oder später
eine andere Engine spielen und während/nach der Partie mit einer getrennten KI
über eigene Ideen, Stellungen und Strategien lernen. Varianten ausprobieren,
speichern, benennen und vergleichen, ohne die laufende Partie zu verändern.
Menschliche Denkweise ist Kern der Lernanalyse; Enginebewertung allein reicht nicht.
Siehe DEVELOPMENT_PLAN.md.

Nutzerentscheidung vom 6. November: eine gemeinsame responsive Web-App für
Windows, macOS, Android und iPadOS, langfristig installierbare PWA. Vier Tabs und
aufklappbare Werkzeuge lösen die sperrige Gesamtseite ab. Native Hüllen optional.

## Abgeschlossener voriger Schritt: Tab-Oberfläche 0.2.0

- Partie: gemeinsames Brett, Farbe/Level, Einrichtung, Start/Pause/Fortsetzen,
  Partieverlauf. „Neue Partie“ am Brett öffnet/fokussiert die Einrichtung.
- Lernen: dasselbe Brett, fortlaufender Lerndialog, eigene Gedanken und gestufte
  Hilfe; Notizen und zusätzlicher taktischer Faktencheck aufklappbar.
- Varianten: Variantenbaum, Benennen und A/B-Vergleich neben demselben Brett.
- Einstellungen: lokaler Schlüssel, Budget, Sitzung sichern/laden, Diagnose und
  Updates. Schlüsselwerte weder in Browser-Storage noch Sitzungsexport.
- Desktop: Brett und Arbeitsbereich nebeneinander. Kleinere Viewports: gestapelt,
  Navigation bleibt unten sichtbar. Züge/Umwandlung/legale Züge aufklappbar.
- Tabwechsel erzeugen kein neues Brett und starten keine Modell-/Engineanfrage;
  Stellung, Partie, Varianten und Entwurf bleiben bestehen. Tastatur mit
  Pfeiltasten/Home/End, Direktlinks und Browser-Zurück geprüft.
- Browser-/Node-Version aus package.json; ZIP/Ordner/Manifest gleich nummeriert.
  CHANGELOG.md dokumentiert Änderungen. Frühere Commits/Pakete bleiben erhalten.

## Integriert: Partie verstehen gemäß Commit 2744e63e

Plancommit nach dem abgeschlossenen Oberflächenumbau per Fast-forward übernommen.
Zentrale Regeln erneut vom aktuellen main gelesen. Kein paralleler Agent.

- PGN-Hauptvariante aus Text/Datei mit Spielernamen/Farbe, Resultat, Zeitkontrolle
  und Originalkommentaren; Validierung mit chess.js, atomarer Wechsel mit
  Zustimmung zum Ersetzen vorhandener Sitzung, keine automatische Enginepartie.
- Eigene Perspektive, Schwarz unten, frei drehbar in allen drei Brettbereichen
  einschließlich A/B-Brettern und JSON-Wiederherstellung.
- Geführte eigene Entscheidungen: Originalzug zunächst verborgen, eine Frage
  nach der anderen, „Weiß ich nicht mehr“ zulässig. Eigene Antwort oder explizites
  Aufdecken öffnet den aktuellen Zug; keine kommenden Originalzüge im UI-/KI-
  Kontext. Kommentare nur nach Freigabe aufklappbar. KI/Faktencheck vorher gesperrt.
- Eigene Varianten im bestehenden Baum, Original unverändert; auch nachgespielte
  künftige SANs werden als unabhängige Analysezweige behandelt. Antworten,
  Notizen, Auflösungsstand, Orientierung und Varianten im Sitzungsformat 2.
  Normale alte Sitzungen bleiben Format 1; alte Apps lehnen Format 2 klar ab.
- Zugzeit aus benachbarten eigenen Uhrständen mit Basis/Inkrement, keine erfundene
  Dauer bei Lücken oder komplexer Zeitkontrolle. Ganze PGN bleibt erhalten.
- Historische drei-/fünffache Wiederholung sowie 50-/75-Zug-Regel unterschieden.
  Importierte Aufzeichnung darf nach einem bloßen Remisanspruch weitergehen.
  Bei Wiederholung kein isolierter FEN-Faktencheck; sonst volle verifizierte
  Geschichte bis zum angefragten Knoten auch an Stockfish übergeben.
- Lokale Zusammenfassung eigener Angaben und vorbereitete KI-Lernfrage; keine
  erfundenen Motive, persönlichen Muster oder Elo-/Persönlichkeitsdiagnosen.
  Rückkehr zum geführten Modus invalidiert ausstehende freie Engineantworten.

Verbindlicher realer Test 1Vh80QL2, wibem/Schwarz, 69 Züge: vollständige PGN
fehlt bisher im Repository/Chat und wurde beim Nutzer angefragt. Nicht aus den
aufgezählten Reflexionszügen rekonstruiert. Tests verwenden klar benannte
synthetische PGNs; die reale Partie ist damit nicht abgenommen.

## Integriert: Browser-Spielengine

- Zusätzlicher PlayingEngine-Adapter mit echtem Stockfish-19.0.1-Lite-Single-
  WebAssembly-Worker; bestehender Desktopadapter bleibt Standard und auswählbar.
- Gemeinsame Historien-/Zug-/Endzustandsvalidierung; dieselben fünf Stufen,
  ein Thread, Hash 16 MiB, Tiefe 12, 20.000 Knoten, 200–1000 ms Suche. Worker
  endet nach jedem Zug; acht Sekunden Gesamtfrist und 64 KiB Ausgabelimit.
- Enginewahl im JSON erhalten. Adapterwechsel pausiert bewusst; kein Retry
  oder stiller Fallback. Spielsteuerung bricht laufende Browser-Worker ab.
  Kein Worker durch Tabwechsel oder PGN-Import.
- Unveränderte lokale Engine-Dateien plus GPL-Lizenz/Quellverweis unter exakter
  versionierter Allowlist. Kein CDN oder offenes node_modules. WASM-MIME/CSP
  geprüft, kein allgemeines unsafe-eval/SharedArrayBuffer. Nur öffentliche
  Engine-Dateien HTTP-gecached; keine API-/Schlüssel-/Sitzungsdaten.
- Echte Browserengine auf fünf Stufen bei gesperrten Backend-APIs, Schwarz auf
  Telefon-/iPad-Größen, JSON-Restore, Abbruch/Fortsetzen und WASM-Ausfall geprüft.
  Separater statischer Python-Host ohne Node-App: echter Gegenzug bei fehlender
  /api/status und keine /api/play-Anfrage.

Dieser frühere Integrationsschritt lieferte zunächst nur den Spielengine-Adapter.
Die danach integrierte eigenständige Web-App folgt unten. Native Safari-/
Android-/iPad-Abnahme bleibt offen.

## Weiterhin nachgewiesene Funktionen

- Stockfish 19 Lite WASM als realer Gegner auf fünf Skill-Stufen, Weiß/Schwarz,
  volle legale Historie mit chess.js, Sonderzüge und Partieende.
- Getrennter Partiekursor, Analysezweige, Namen, Vergleich und JSON-Import/-Export;
  Import pausiert Partien, veraltete Engine-/Dialogantworten werden verworfen.
- KI-Lernvertrag mit eigenen Ideen/Begründung/Lernziel, Leitfrage/Hinweis/Erklärung,
  begrenzter tatsächlicher Zugfolge und passenden früheren Gesprächsrunden.
  Simulation und echte Herkunft getrennt, keine automatische Enginebewertung.
- Lokale Schlüsseldatei: Windows-DPAPI implementiert, POSIX privat 0600/0700;
  dauerhafte sichtbare Speicheranzeige, Fortschritt und eindeutige Fehler.
- Kosten als Schätzung: Budget, dauerhafte Reservierungen, höchstens drei
  Modellversuche je Serverstart und Budgetperiode, keine automatischen Retries.
- Diagnose, ausdrücklich bestätigte Git-Updates, lokaler Desktop-Server,
  portable Windows-Node-Laufzeit, Mac-Starter und Portausweichlogik.
- Mausziehen, Touch-Taps, natives Wischen, Seitenziehen auf Text statt Markieren,
  separate Scrollhilfe und rein lokale Bedienungsdiagnose ohne Eingabewerte.

## Integriert: eigenständige Web-App und Offlineweg

- Ohne Node-Backend bzw. bewusst über den Web-Link: browserlokaler Enginegegner
  und zusätzlicher taktischer Faktencheck, direkter begrenzter OpenAI-Transport.
  Bestehender Desktopbetrieb bleibt als separater Adapter verfügbar.
- Nutzerentscheidung „Key wird lokal gespeichert“ für den Webbetrieb umgesetzt:
  ausschließlich AES-GCM-verschlüsseltes Schlüsselfach in IndexedDB, eigenes
  Gerätepasswort nicht gespeichert; Klartext nur im entsperrten RAM. Kein
  Klartextschlüssel in Browser-Storage/Export/Diagnose/Offline-Cache. Nach Reload
  entsperren statt Key erneut eingeben, sichtbare Speicher- und Fehlerbestätigung.
- Gemeinsame Dialogvalidierung/Systemvorgaben und Kostenlogik mit Desktop.
  Höchstens drei Versuche je Fenster und persistenter Budgetperiode, atomare
  Reservierung auch zwischen Fenstern, konservativer Rest bei unklarer Nutzung.
  Schlüsselwechsel, Reload und Löschen umgehen den Periodenverbrauch nicht.
- Browser-Sitzung samt Varianten, Gedanken, Dialog, PGN-Rückblick und Entwurf
  automatisch lokal gesichert. Wiederherstellung validiert, Partie pausiert;
  JSON bleibt unabhängige Sicherung/Übertragung. Fehlerhafte gespeicherte Daten
  werden nicht automatisch überschrieben. Letzte Sitzung gilt je Browseradresse.
- Installierbarer öffentlicher App-Rahmen: Build erzeugt inhaltsbasierten
  Service-Worker-Cache nur für App-/Engine-Dateien. Kein API-/Provider-/Schlüssel-
  Cache. Echter Offline-Neustart mit PGN und Stockfish nach Vorbereitung geprüft.
- Updates warten auf Zustimmung und erfolgreiche Sitzungssicherung. Kein
  automatisches Neuladen. Desktop-Git-Update nur im Desktopbetrieb angeboten.
  Diagnose und Schlüsselfach/Entsperren brauchen keine Textgenerierung.
- Natives Wischen nach Web-Schlüsselspeicherung bei Windows-/Telefon-/Tablet-
  Größen, Mausrad und fehlende Textmarkierung automatisiert geprüft. Das ersetzt
  keine reale Windows-Touch-/Safari-/Android-/iPad-Abnahme.

## Prüfstand

Typprüfung/Build, **98 Einzeltests und 52 Chromium-Browsertests** bestanden.
Echte lokale Stockfish-Prozesse/Worker, Offline-Reload und wartender Service-
Worker mit bestätigter Updateübernahme. Providerzugriff nur Fixtures; kein
kostenpflichtiger Aufruf. Details und Prüfgrenzen: docs/VALIDATION.md.

Zentrale Regeln und origin/work vor Sicherung abgeglichen. Keine parallelen
Agenten, neue Abhängigkeiten, Releases, Deployments, Actions oder Sichtbarkeits-
änderungen beim Integrationsabschluss. Danach ausdrücklicher Auftrag zur Web-
Veröffentlichung: Version 0.3.0 als geprüftes Web-Paket vorbereitet, Hosting offen.
Die vorhandene Cloud-Konfiguration reicht zum Entwickeln/Testen; keine Secrets
oder neuen Netzfreigaben nötig, kein Umgebungsentwurf geändert/veröffentlicht.

## Offene Abnahme und Grenzen

- Vollständige Nutzer-PGN 1Vh80QL2 fehlt weiterhin. Synthetische PGNs sind klar
  benannt und ersetzen diese reale Abnahme nicht. Keine Motive/Züge erfunden.
- Echter pädagogischer KI-Dialog sowie Provider-CORS/Kontozugriff nicht mit
  realem Schlüssel geprüft. Tests belegen Vertrag/Bedienung, keine Lernqualität.
- Native Windows-Touch/DPAPI, macOS/Safari, Android/iPadOS und jeweilige
  Installation bleiben offen. Browserpasswort-Speicher ist kein nativer Keychain.
- Webspeicher ist an Browseradresse/Port/Profil gebunden; Browserdatenlöschung
  entfernt ihn. Mehrere Fenster teilen die letzte Sitzung, keine Cloud-Synchronisation.
  Preisannahmen sind kein hartes Anbieter-Geldlimit; Web-/Desktopprofile getrennt.
- Bestehender Node-Server weiterhin ausschließlich Loopback. Für einen öffentlich
  erreichbaren Start auf Mobilgeräten wäre eine gesondert beauftragte HTTPS-
  Bereitstellung nötig; diese wurde nicht ausgeführt.

## Nächste Abnahme

Reale Nutzer-PGN und gezielte Geräte-/KI-Praxisabnahme des jetzt integrierten
Webstands. Fehlende Nachweise offen benennen; keine weitere Entwicklungs-
Teilstufe als fertige native App ausgeben. Der Veröffentlichungsauftrag liegt
nun vor; als nächsten Schritt den tatsächlich verbundenen Hostingzugang nutzen
und die öffentliche HTTPS-Adresse samt Live-Prüfung nachtragen.

## Pages-Anpassung 0.3.1 im vorhandenen Repository

Unterordnerfähig: Worker, Web-Adapter, Manifest, Icons, Lizenzen und scoped
Offline-Cache. Cache-Aufräumen auf eigenes Basisverzeichnis begrenzt. Root-
Desktop-/Web-Build bleibt erhalten. HTML-CSP ergänzt, da Pages keine _headers
verarbeitet. Kein eigener Actions-Workflow, kein bezahlter Aufruf, keine Änderung
der Repository-Sichtbarkeit. Echte Unterordner-/Offline-/WASM-Prüfung bestanden.
Manueller Publisher überträgt ausschließlich öffentliche Builddateien und schützt
fremde Zielinhalte; lokal mit echten Git-Repositories geprüft. Nutzer hat Public selbst gesetzt; Pages-Aktivierung bleibt bei blockierter
Verwaltungs-API über die GitHub-Einstellungen vorzunehmen. Kein neues Repository.

## Übertragung des Web-Stands

- Geprüfter App-/Codecommit auf work: 6f747c2, Version 0.3.1.
- Tatsächlich übertragener gh-pages-Commit: 82d92273eb8a6abc40555a7ca126fc3b41db05c7.
  Native Git-Übertragung im bestehenden Repository erfolgreich; Codebranch erhalten.
- Öffentlicher Repository-Abruf nach Nutzerfreigabe HTTP 200.
- Pages-Verwaltungs-API weiterhin Forbidden. Einmalige Benutzereinstellung:
  Settings → Pages → Deploy from a branch → gh-pages → / (root) → Save.
- Live-Prüfversuch der erwarteten Adresse scheitert bereits am Netzwerkproxy
  mit CONNECT 403 / HTTP 000. Kein HTTP-404-/Fehlernachweis über die Website
  selbst und keine erfolgreiche Live-Abnahme behauptet.
- Nächster Schritt: Nutzer speichert die Pages-Quelle; angezeigte GitHub-Adresse
  und tatsächlichen Onlinegang bestätigen. Nicht erneut Public anfordern.

## Pages-Einstellung durch Nutzer gespeichert

Nutzer bestätigt die Auswahl gh-pages / (root) und Save. BUILD.json auf dem
öffentlichen gh-pages-Branch ist abrufbar (HTTP 200), Version 0.3.1, Basis
/AI-Chess-Studio/, Quellcommit 6f747c2. Erwartete App-Adresse:
https://wibem1.github.io/AI-Chess-Studio/ . Erneute Live-/Buildstatusprüfung
nach Nutzeraktion weiterhin durch Netzwerkproxy blockiert (CONNECT 403,
HTTP 000); kein Fehlernachweis der Website selbst. Nutzer kann die Adresse
jetzt öffnen; erfolgreiche Live-Nutzung bleibt bis zur Bestätigung offen.
Nicht erneut dieselbe Pages-Einstellung anfordern.

## Brettkorrektur 0.3.2

Nutzer meldet auf Screenshot der installierten Windows-Web-App 0.3.1 fehlende
rechte Brettspalte. Reproduziert in echtem Chromium: intrinsische Mindestbreite
der Unicode-Figuren verbreitert 1fr-Tracks, overflow:hidden schneidet g/h-Felder
ab. Die 64 Felder waren im Zustand/DOM vorhanden; bisherige Zähltests reichten
für die visuelle Vollständigkeit nicht aus.

Korrektur nur in Darstellung: minmax(0,1fr) für acht Spalten und Reihen,
explizite Zellgrößen ohne automatische Mindestbreite und Figurenmaß relativ
zum eigenen Brett (Container-Einheiten). Haupt- und A/B-Bretter gleich behandelt.
Zwei neue geometrische Browserfälle schlagen vorher fehl und bestehen danach.
Acht Viewports von 390x844 bis 1920x1080, 100/150/200 Prozent CSS-Zoom,
beide Orientierungen, größere Grundschrift und h2-h4 als echter Randzug.
64 vollständige quadratische Felder und passende Figurenrechtecke geprüft.
CSS-Zoom-Nachbildung ist keine native Windows-/Safari-Abnahme. Kompaktes Brett
bei 1280x600 zusätzlich visuell geprüft. npm run test:all: 94/52 bestanden.

Bestehende Partie, Varianten, Dialog, Schlüsselfach und Speicherkennungen werden
nicht geändert. Veröffentlichung über denselben bestehenden gh-pages-Branch;
keine neue Ablage oder erneute Public-/Pages-Einrichtung erforderlich.

Korrektur tatsächlich übertragen: work 97cb9ec, gh-pages
73dfea1fccfe557bd4bb42a207c71f66d3b6e59d. Öffentliches commitgebundenes
BUILD.json mit 0.3.2, /AI-Chess-Studio/ und Quellcommit 97cb9ec abgerufen.
GitHub-Pages-Bereitstellung kann nachlaufen; eigener Live-Host weiterhin
netzwerkbedingt nicht prüfbar. Aktualisierung über die bestehende Web-App-
Updatefunktion, keine erneute Einrichtung oder Datenlöschung.

## Auslieferungsfehler eingegrenzt und korrigiert

GitHub-Lauf 42245157162 für 73dfea1: FAILURE, deploy-Annotation „Timeout reached,
aborting!“, Dauer 10m44s. Das erklärt das ausgebliebene 0.3.2-Update, ohne aus
Browser-Caches eine unbelegte Ursache abzuleiten. Unveränderte bereits geprüfte
App einmal erneut als 47427bd übertragen. Lauf 42253628918: SUCCESS; voller
Commitlink und Laufstatus über öffentliche GitHub-Seiten verifiziert.

Neue manuelle Statuskontrolle scripts/pages-status.mjs, npm run check:pages.
Veröffentlichungsbefehl wartet jetzt nach Upload auf einen bestätigten Erfolg
für genau den gh-pages-Commit. Fehler, unbekanntes Schema und ausstehende Läufe
melden keinen Erfolg, lösen keine weiteren Pushes aus. Vier Parser-/Status-
Regressionen; npm test 98/98, bestehender unveränderter Appstand zuvor 52/52
Browserfälle. Keine neue App-Version, Appkennung, Löschung oder Migration.
Android-Installation ohne tatsächlichen Geräte-/Dialogbefund nicht als behoben
behauptet; Windows-Installation allein blockiert kein zweites Androidgerät.

## Android-Diagnose: Chrome-156-Fehler plausibel identifiziert

Nutzerdatei bestätigt 0.3.2 mit Android-Chrome 156. Offizieller Chromium-Fix
2e165cdb08d714941e3573a18b719bfdad78ff66 beschreibt genau die beobachtete
Installed-/Open-Fehlerkombination für verschiedene PWAs desselben Origins.
Geprüfter 156.0.8078.94-Tag enthält Origin-weite Prüfung; 157.0.8103.73 enthält
Scope-Korrektur. Nächster gezielter Schritt: Chrome im Play Store auf einen
korrigierten Stand aktualisieren, Installation am Gerät erneut prüfen. Kein
weiterer Reset oder Manifest-ID-Wechsel. Welche andere Same-Origin-App auf dem
Gerät vorhanden ist, wurde nicht nachgewiesen; native Abnahme weiter offen.
Details und Quellen: docs/ANDROID_INSTALLATION.md. Originale Nutzerdatei und
vollständige Browserkennung nicht in das öffentliche Repository übernommen.


## Updateanzeige 0.3.3 geprüft

Unverändert/Download/bereit/fehlgeschlagen ausdrücklich getrennt; keine Änderung
an Appkennung oder Datenspeicher. npm run test:all: 98/98 Einzeltests, 53/53
Chromiumfälle. Abschließende Root-/Pages-Builds und vier PWA-/Pages-Fälle nach
Listenerbereinigung erneut bestanden. Echter lokaler Übergang aus veröffentlichtem
0.3.2-Build zu 0.3.3 mit Zustimmung, erhaltenem Entwurf und anschließender
Aktuell-Meldung bestanden. Native Android-Abnahme weiterhin offen.
0.3.3 tatsächlich bereitgestellt: Quellcommit 63ef08f, gh-pages
69149dcee15182f8199f15ee20b11405a895d5ee; Run 42273159023 SUCCESS. Öffentliches
BUILD.json bestätigt Version, Basis und Quellcommit. Nächster einzelner Schritt:
Nutzer bestätigt: Update auf 0.3.3 hat funktioniert. Native Android-Installation
weiterhin nicht möglich. Keine erneute Chrome-/Pages-Einrichtung anfordern.

## Neuer Auftrag: sichtbare Schlüsselstellungen-Aktion

Im Lernmodus Button „Schlüsselstellungen“ am Brett ergänzt. Er verwendet den
vorhandenen geprüften Partierückblick und fordert Suche und Beschreibung an.
Nach Analyse direkte Sprungbuttons zusätzlich zu Vor/Zurück am Brett; bestehende
Speicherung der gameReview-Annotation bleibt zuständig. Keine automatische
Anfrage beim Öffnen. Kein kostenpflichtiger Test. Noch nicht veröffentlicht;
gezielte Browserprüfung und Veröffentlichung bleiben ausstehend.
