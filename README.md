# AI-Chess-Studio

Ein dialogorientiertes strategisches Schachlabor: Mensch und KI entwickeln und hinterfragen Pläne, untersuchen gegnerische Möglichkeiten und vergleichen praktisch spielbare Varianten.

## Erster funktionaler Prototyp – geplant

- Lokale Weboberfläche mit Schachbrett und legaler Zugeingabe.
- Variantenbaum: Abzweigungen anlegen und zwischen Stellungen wechseln.
- Stellungsbezogener Dialog zu Plan, Gegenplan, Kandidatenzügen, Risiken und praktischer Spielbarkeit.
- Strategisches Gedächtnis mit Herkunft, Stellung, Hypothesen und offenen Fragen.
- Export und Import einer Sitzung einschließlich Varianten und Gedächtnis.
- KI-Zugvorschläge werden gegen die Schachregeln geprüft. Veraltete Antworten dürfen nach einem Stellungswechsel nicht der neuen Stellung zugeordnet werden.

Ein deterministischer Testadapter ermöglicht automatisierte Tests ohne API-Kosten. Er wird klar als Simulation gekennzeichnet. Ein funktionaler KI-Prototyp benötigt zusätzlich einen tatsächlich geprüften Modelladapter; vorgetäuschte KI-Antworten genügen nicht.

Stockfish wird später separat angebunden und ausschließlich auf Abruf verwendet. Seine Ergebnisse belegen taktische Befunde unter den angegebenen Suchbedingungen, keine absolute strategische Wahrheit.

## Entwicklungsphasen

0. Projektgrundlage und Prüfkriterien sichern.
1. Schachkern, Variantenbaum und Sitzungsformat implementieren und isoliert testen.
2. Kleine Oberfläche und strategischen Dialog mit Testadapter integrieren; automatisierten Browserdurchlauf prüfen.
3. Reale KI-Anbindung mit serverseitiger Schlüsselverwaltung und begrenztem Kontext testen.
4. Optionalen Stockfish-Faktencheck separat integrieren.

Der Technologieentscheid erfolgt beim Start von Phase 1 anhand der verfügbaren Entwicklungsumgebung. Bevorzugt: TypeScript mit etablierter Schachbibliothek und automatisierten Unit- und Browsertests.

## Abnahme des ersten Prototyps

Automatisiert nachweisen: legale/illegale Züge einschließlich Rochade, en passant und Umwandlung; getrennte Varianten; korrekte Dialogzuordnung; Erhalt und Export/Import des strategischen Gedächtnisses; Behandlung ungültiger KI-Ausgaben und fehlgeschlagener Anfragen. Danach ein kurzer manueller Durchlauf: Stellung spielen, Plan diskutieren, Variante abzweigen, Sitzung wiederherstellen.

Aktueller Nachweisstand und nächster Schritt: siehe [PROJECT_STATE.md](PROJECT_STATE.md).

## Phase 1 – lokaler Schachkern

Voraussetzung: Node.js 24 und npm. Installation mit `npm ci`, Typprüfung mit
`npm run check`, Build und isolierte Tests mit `npm test`.
Die Phase-1-Basis umfasst zehn einzelne Testfälle; Phase 2 ergänzt vier Dialogtests. Eine alleinige Dateizählung
ist kein ausreichender Nachweis (in eingeschränkten Umgebungen sind gegebenenfalls
zusätzliche Prozessrechte erforderlich).

`src/session.ts` exportiert `Session`: `play` akzeptiert SAN oder
`{from, to, promotion?}`, `select` wechselt Variantenknoten, `legalMoves` und
`status` prüfen die ausgewählte Variante mit chess.js einschließlich ihrer
Zughistorie. Ein bereits vorhandener identischer Kindzug wird wiederverwendet.
Nach einem von chess.js erkannten Partieende werden weitere Züge abgewiesen.
Eine alternative Analyse kann an einem früheren Knoten fortgesetzt werden.

`snapshot` liefert eine unabhängige Kopie. `annotate` speichert Dialog und
strategisches Gedächtnis mit Knoten-ID, Herkunft, Hypothesenkennzeichnung und
offenen Fragen. Für spätere asynchrone Antworten muss die Knoten-ID beim
Anfragestart festgehalten werden. Dies ist ein Datenmodell, noch kein Modelladapter.
`export`/`Session.import` verwenden JSON-Schema-Version 1. Beim Import werden
Elternbeziehungen, legale Züge und abgeleitete FEN-Stellungen rekonstruiert und
geprüft; ungültige Sitzungen werden vollständig abgelehnt.

Phase 2 ergänzt eine lokale Oberfläche und simulierte Dialoge. Eine serverseitige Modellanbindung ist inzwischen vorbereitet (siehe Phase 3);
reale Modelltests und Stockfish stehen weiterhin aus.
Prüfgrundlage: [docs/VALIDATION.md](docs/VALIDATION.md).


## Phase 2 – lokale Oberfläche und Testadapter

Nach `npm ci` mit `npm run dev` lokal starten. Der Entwicklungsserver bindet nur
an die Loopback-Adresse. Es erfolgt kein Deployment. Das Schachbrett unterstützt
Start-/Zielfeld-Auswahl und Umwandlungen; alternativ können SAN-Züge eingegeben
werden. Frühere Knoten im Variantenbaum erlauben neue Abzweigungen.

Im voreingestellten Simulationsmodus verwendet die Planwerkstatt den deterministischen lokalen
`SimulationAdapter`. Die Kandidaten sind ungeordnete legale Beispielzüge,
keine strategischen Empfehlungen oder Enginebewertungen. Die Beispieldaten
zeigen Plan, mögliche gegnerische Absicht als Hypothese, Risiken, Spielbarkeit
und offene Fragen. Es werden keine Modell- oder Stockfish-Anfragen ausgeführt.
Unter „Simulation prüfen“ lassen sich ungültige Antworten, Anfragefehler und
verzögerte Antworten gezielt auslösen.

Antworten bleiben am Knoten der Anfrage. Nach dem Import einer anderen Sitzung
werden ausstehende Antworten verworfen. Ungültige Antworten und illegale
Kandidaten werden abgewiesen. Eigene Notizen können als Hypothese samt offener
Frage gespeichert werden. Die Daten liegen nur im Arbeitsspeicher: vor dem
Neuladen als JSON-Datei exportieren; Wiederherstellung über Dateiauswahl oder
JSON-Text. Fehlgeschlagener Import erhält die bisherige Sitzung. Im Browser gibt es keine
API-Schlüssel und keine automatische Speicherung.

`npm run test:all` prüft Typen, Build, 23 isolierte Tests und sieben echte
Chromium-Browserdurchläufe. Playwright nutzt `CHROMIUM_PATH`, wenn gesetzt,
ansonsten `/usr/bin/chromium`, falls vorhanden, oder seinen installierten
Chromium. In dieser Cloud-Umgebung ist System-Chromium vorhanden. Außerhalb
dieser Umgebung bei Bedarf `npx playwright install chromium` ausführen.
Der Browserlauf startet und beendet seinen eigenen lokalen Server auf Port
5173; dort darf währenddessen kein anderer Server laufen.

Noch nicht vom Nutzer bestätigt: ein kurzer manueller Durchlauf mit eigenem
Plan, Abzweigung und anschließender Wiederherstellung. Kein Nachweis realer KI.


## Phase 3 – serverseitige Modellanbindung vorbereitet

Die lokale Vite-Anwendung stellt `/api/status` und `/api/dialogue` bereit.
`ServerModelAdapter` im Browser kennt nur diese relativen Endpunkte. Der
Node-Server kann OpenAI Chat Completions am festen HTTPS-Endpunkt
`api.openai.com/v1/chat/completions` aufrufen. Im statischen Web-Build ist kein
API-Server enthalten; `vite preview` bietet diese Anbindung nicht an.

**Der aktuelle Arbeitsauftrag untersagt kostenpflichtige API-Aufrufe. Die
reale Anbindung wurde deshalb nicht aktiviert oder mit OpenAI getestet.**
Standardmäßig bleibt sie gesperrt. Es wurden keine Schlüssel angelegt.
Nach einer künftigen ausdrücklichen Autorisierung benötigt der Server:

- `CHESS_API_KEY`: Schlüssel ausschließlich als sichere serverseitige
  Umgebungsbindung; niemals im Browser, Repository, `VITE_*` oder Chat.
- `CHESS_MODEL`: ausdrücklich ausgewähltes Modell, das Chat Completions mit
  JSON-Ausgabe und `max_completion_tokens` unterstützt; kein Defaultmodell.
- `CHESS_ENABLE_PAID_API=1`: separate bewusste Aktivierung. Bis zur
  Autorisierung nicht setzen. Eine Aktivierung kann kostenpflichtige
  Anfragen durch den Nutzer auslösen.

Bei Proxybetrieb muss Node mit `NODE_USE_ENV_PROXY=1` gestartet werden,
damit die geerbte HTTPS-Proxy-/CA-Konfiguration für fetch verwendet wird.
Der Zugang zu `api.openai.com` muss in der Umgebung erlaubt sein.
Es wurden weder Netzfreigaben noch Secret-Anforderungen verändert.

Der Server erlaubt nur gleichursprüngliche lokale JSON-POSTs, höchstens
16 KiB Eingabedaten, 1000 Zeichen pro Planfrage und sechs stellungsbezogene
Kontexteinträge à 800 Zeichen. FEN und Zugliste werden serverseitig geprüft.
Ausgabe: höchstens 800 Completion-Tokens, 64 KiB Antwortdaten, 15 Sekunden
Wartezeit; keine Wiederholungsversuche. Es gilt eine parallele Anfrage und
ein Limit von drei Versuchen je Serverprozess, auch bei Fehlern. Ein Neustart
setzt dieses Limit zurück. Dies ist **keine Geld- oder Gesamtkostengarantie**;
ein tatsächliches Geldlimit muss zusätzlich beim Anbieter eingerichtet werden.

Providerfehler und Schlüssel werden nicht an den Browser weitergegeben.
Ungültige, verweigerte, abgebrochene oder illegale Antworten werden verworfen.
Modellantworten werden mit Herkunft „Modell“ und als Hypothese gespeichert;
Simulation und Modell sind getrennte Dialogmodi. Die Tests erzwingen für den
Browser-Testserver die API-Sperre und verwenden ausschließlich lokale
Transport-/HTTP-Fixtures. Sie belegen keine reale Modellqualität oder
Anbieterkompatibilität. Manuelle Nutzerabnahme steht weiterhin aus.
