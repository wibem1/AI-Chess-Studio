# KI-Ergebnisse prüfen – vorbereitet in 0.11.0

## OpenRouter verwenden

Einstellungen → Eigenen API-Schlüssel eingeben → Provider OpenRouter wählen.
Eigenen OpenRouter-Schlüssel eingeben und kostenpflichtige Nutzung freigeben.
Der Katalog wird öffentlich geladen, ohne Textgenerierung. Nur Textmodelle mit
Werkzeugunterstützung werden angeboten; Sol und Argon stehen zuerst. Die
Fähigkeit ist eine Anbieterangabe, kein Nachweis guter Schachzüge.

Am Lernchat „Modell wechseln“ öffnen, gegebenenfalls Katalog laden, Modell und
Denkstufe wählen und „Modellwahl übernehmen“. Das startet keine KI-Anfrage.
Der gemeinsame OpenRouter-Schlüssel gilt für die gewählten Modelle. Der alte
OpenAI-Direktzugang bleibt auswählbar; Providerwechsel benötigt dessen Schlüssel.
Profile mit freiwilligem Passwortschutz behalten diesen: Modellwechsel dort nur
für das laufende Fenster, dauerhafte Änderung durch erneutes Speichern mit Passwort.

Preise im Katalog sind USD pro Million Eingabe-/Ausgabe-Tokens. Denk-Tokens
können Kosten verursachen. OpenRouter-Kosten aus Antworten werden bevorzugt;
fehlende Angaben bleiben Schätzungen. Nach einer Vorführung werden die gemeldeten
Kosten der beteiligten Aufrufe summiert. Keine Budgetperiode oder Drei-Anfragen-
Sperre. Niedrig/mittel/hoch verwenden maximal 8192/16384/32768 generierte Tokens;
das ist ein technisches Ausgabelimit, keine tatsächliche Verbrauchsprognose.

## KI-Diagnose herunterladen

Einstellungen → Diagnose und Updates → KI-Qualität auswerten und Diagnose
exportieren. Eigene Bewertung und einen konkreten Fehler eintragen, dann
„KI-Diagnose herunterladen“. Die Datei enthält private Partie-/Chatinhalte und
wird ausschließlich auf dieses Gerät heruntergeladen. Vor Weitergabe prüfen.
Keine Veröffentlichung oder automatische Übertragung an Entwickler.

Der Bericht enthält die letzten 20 Anbieter-Versuche seit Laufzeitstart:

- Zeit, Version, Stellung/FEN und Knotenbezug, gewünschtes Modell und Denkstufe.
- Tatsächlich gesendeten öffentlichen Anfragekontext samt Systemvorgaben,
  Gespräch, Verlauf, Legalzügen und Kürzungskennzeichnung.
- Öffentliche Antwort, Werkzeugaufrufe, Finish-Grund, vom Anbieter gemeldetes
  Modell/Provider und Token-/Denk-Token-/Kostenangaben, soweit vorhanden.
- Laufzeit, HTTP-Status und sichere Fehlerkategorie; keine rohen HTTP-Headers.
- Aktuelle Brettlage, aufgezeichnete ausgeführte Brettaktionen, Testpartiezüge,
  eigene Beobachtung und Browser-/Viewportdaten.

Schlüsselähnliche Werte werden redigiert, private Denk-/Fortsetzungsblöcke
weggelassen. Daher kein byteidentischer Replay des gesamten Anbieterprotokolls.
`accepted` bedeutet Transport-/Formatprüfung, NICHT schachlich richtig. Es gibt
keine automatische fachliche Gütenote. Nicht ausgeführte Transportversuche und
fehlende Nutzungsangaben sind entsprechend erkennbar; Kosten sind keine Rechnung.

Berichte bleiben im RAM: Web-Neuladen bzw. Serverneustart verliert sie.
Deshalb vor dem Neustart exportieren. Chatlöschung entfernt auch die Anfrage-
berichte; normale Partien/Notizen bleiben erhalten. Nur beim Berichtdownload
angegebene Zusatzbeobachtungen sind darin enthalten.

## Testpartie gegen Stockfish oder Maia

Im Lernmodus stehen ganz oben unter „Lernengine gegen Schachengine“ nur
„Start“ und „Stop“. Start beginnt den kostenpflichtigen Test von der aktuell
sichtbaren Stellung. Das aktuelle KI-Modell übernimmt die dort am Zug befindliche
Farbe. Gegner und Stufe stammen aus der bestehenden Partie, sonst aus den
Spielmoduseinstellungen. Keine zusätzliche Auswahl oder Bestätigungscheckbox.
Interne Obergrenze: 100 Modellzüge pro Start.
Der Test läuft im Lernzweig; der Cursor der tatsächlichen Partie bleibt erhalten.
Er startet KEINE neue Partie beim Anbieter und erzeugt keine FIDE-/Online-Elo.

Jeder Modellzug ist eine bezahlte Anfrage mit Stellung und Zuggeschichte. Danach
zieht die reale ausgewählte Spielengine. Falls diese zuerst am Zug ist, beginnt
sie. Das Modell muss genau einen legalen Zug liefern. Illegaler Zug oder falsches
Werkzeug beendet den Test, ohne automatische Korrektur oder Wiederholung.
Ein Regelende, die Zuggrenze oder ein Fehler beendet den Lauf. Eine erreichte
Zuggrenze bedeutet keinen Sieg. Die Stufen sind App-Profile, keine gemessene Elo.

„Stop“ unterbricht; Stellungs-/Sitzungs-
wechsel oder Verlassen des Lernmodus stoppt ebenfalls. Bereits gestartete
Anbieterarbeit kann Kosten verursacht haben. Die gezeigte Linie bleibt als Lernvariante erhalten. Modellwechsel wird während des
Laufs nicht still übernommen. Für Vergleichspartien gleiche Ausgangsstellung,
Gegnerstufe, Farbe und Zugzahl verwenden und Diagnosen jeweils herunterladen.

## Was die Tests bisher belegen

Technischer Ablauf mit abgefangenen Modellantworten, echter Stockfish-WASM-
und Maia-ONNX-Inferenz. Öffentlicher OpenRouter-Katalog tatsächlich geladen.
Keine bezahlten Modelltests und kein Nachweis schachlicher Lehrqualität.
Spielstärke und Erklärungsqualität getrennt beurteilen; Ergebnis einer einzigen
Partie ersetzt keinen Vergleich mehrerer Stellungen und beider Farben.


## Aktiven Zugang erkennen (ab 0.11.2)

Im Lernmodus zeigt die Karte oben Anbieter, Modell-ID und Denktiefe. Der
Betriebszustand unterscheidet Demo, lokal bereit, gesperrt und Lesefehler.
„Verbindung prüfen“ fragt den Anbieter ohne Textgenerierung ab. Bei OpenRouter
prüft das nur den Schlüssel; Modellverfügbarkeit/Werkzeugfähigkeit bleiben
bis zur tatsächlichen Anfrage unbestätigt. Ablehnungen erscheinen direkt
in der Karte. „Modell wechseln“ ändert das Modell mit dem vorhandenen Schlüssel
bei demselben Anbieter; für einen anderen Anbieter ist dessen Schlüssel nötig.
Bearbeitete Einrichtungsfelder werden durch Hintergrundstatus nicht ersetzt.
