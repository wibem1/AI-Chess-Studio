# Projektstand

## Aktuelle Korrektur: 0.8.1 implementiert, noch nicht veröffentlicht

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
Keine bezahlten Modellaufrufe, keine Veröffentlichung. Die konkrete Nutzerpartie
aus dem Screenshot liegt nicht als vollständige Datei vor; synthetische Tests
ersetzen deren Prüfung nicht.

Nächster einzelner Schritt: ausdrückliche Veröffentlichungsfreigabe für 0.8.1,
dann bestehenden Pages-Veröffentlichungsweg samt Erfolgskontrolle verwenden.
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
