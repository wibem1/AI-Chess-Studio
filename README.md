# AI-Chess-Studio

Ein dialogorientiertes strategisches Schachlabor: Mensch und KI entwickeln und hinterfragen Pläne, untersuchen gegnerische Möglichkeiten und vergleichen praktisch spielbare Varianten.

## Lokal starten

Voraussetzung: Node.js 24 und npm.

```bash
npm ci
npm run build
npm start
```

`npm start` startet die gebaute Anwendung samt Modell-/Stockfish-API nur lokal
auf Port 5173. `CHESS_PORT` kann den Port ändern. Für Quellcodeentwicklung gibt
es weiterhin `npm run dev`. Kein Deployment und keine Veröffentlichung nötig.
Alle 33 Einzeltests und neun Browsertests sind bestanden; die Browsertests
laufen gegen denselben gebauten Anwendungsserver.

**Nutzbar:** Schachbrett, Varianten, Gedächtnis, Sitzungsexport/-import,
Simulationsdialog und echter lokaler Stockfish-Faktencheck. **Noch offen:**
reale KI-Validierung und manuelle Nutzerabnahme. Echte KI ist standardmäßig
gesperrt; die bisherige Vorgabe verbietet kostenpflichtige API-Aufrufe.

## Ziel des vollständigen Prototyps

- Lokale Weboberfläche mit Schachbrett und legaler Zugeingabe.
- Variantenbaum: Abzweigungen anlegen und zwischen Stellungen wechseln.
- Stellungsbezogener Dialog zu Plan, Gegenplan, Kandidatenzügen, Risiken und praktischer Spielbarkeit.
- Strategisches Gedächtnis mit Herkunft, Stellung, Hypothesen und offenen Fragen.
- Export und Import einer Sitzung einschließlich Varianten und Gedächtnis.
- KI-Zugvorschläge werden gegen die Schachregeln geprüft. Veraltete Antworten dürfen nach einem Stellungswechsel nicht der neuen Stellung zugeordnet werden.

Ein deterministischer Testadapter ermöglicht automatisierte Tests ohne API-Kosten. Er wird klar als Simulation gekennzeichnet. Ein funktionaler KI-Prototyp benötigt zusätzlich einen tatsächlich geprüften Modelladapter; vorgetäuschte KI-Antworten genügen nicht.

Stockfish ist separat angebunden und wird ausschließlich auf Abruf verwendet. Seine Ergebnisse belegen taktische Befunde unter den angegebenen Suchbedingungen, keine absolute strategische Wahrheit.

## Entwicklungsphasen

0. Projektgrundlage und Prüfkriterien sichern.
1. Schachkern, Variantenbaum und Sitzungsformat implementieren und isoliert testen.
2. Kleine Oberfläche und strategischen Dialog mit Testadapter integrieren; automatisierten Browserdurchlauf prüfen.
3. Reale KI-Anbindung mit serverseitiger Schlüsselverwaltung und begrenztem Kontext testen.
4. Optionalen Stockfish-Faktencheck separat integrieren.

Implementiert mit TypeScript, chess.js, Vite für den Web-Build, Node.js als lokalem Anwendungsserver und automatisierten Unit-/Browsertests.

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
reale Modelltests stehen weiterhin aus; Stockfish ist lokal angebunden (siehe Phase 4).
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
und offene Fragen. Der Simulationsdialog führt keine Modell- oder Stockfish-Anfragen aus.
Unter „Simulation prüfen“ lassen sich ungültige Antworten, Anfragefehler und
verzögerte Antworten gezielt auslösen.

Antworten bleiben am Knoten der Anfrage. Nach dem Import einer anderen Sitzung
werden ausstehende Antworten verworfen. Ungültige Antworten und illegale
Kandidaten werden abgewiesen. Eigene Notizen können als Hypothese samt offener
Frage gespeichert werden. Die Daten liegen nur im Arbeitsspeicher: vor dem
Neuladen als JSON-Datei exportieren; Wiederherstellung über Dateiauswahl oder
JSON-Text. Fehlgeschlagener Import erhält die bisherige Sitzung. Im Browser gibt es keine
API-Schlüssel und keine automatische Speicherung.

`npm run test:all` prüft Typen, Build, 33 isolierte Tests und neun echte
Chromium-Browserdurchläufe. Playwright nutzt `CHROMIUM_PATH`, wenn gesetzt,
ansonsten `/usr/bin/chromium`, falls vorhanden, oder seinen installierten
Chromium. In dieser Cloud-Umgebung ist System-Chromium vorhanden. Außerhalb
dieser Umgebung bei Bedarf `npx playwright install chromium` ausführen.
Der Browserlauf startet und beendet seinen eigenen gebauten Anwendungsserver auf Port
5173; dort darf währenddessen kein anderer Server laufen.

Noch nicht vom Nutzer bestätigt: ein kurzer manueller Durchlauf mit eigenem
Plan, Abzweigung und anschließender Wiederherstellung. Kein Nachweis realer KI.


## Phase 3 – serverseitige Modellanbindung vorbereitet

Die lokale Anwendung (npm start oder npm run dev) stellt `/api/status` und `/api/dialogue` bereit.
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


## Phase 4 – optionaler lokaler Stockfish-Faktencheck

„Taktischen Faktencheck starten“ führt ausschließlich nach diesem Klick eine
lokale Suche aus. Optional kann ein eigener legaler SAN-Kandidat angegeben
werden; dann wird nur dieser Wurzelzug untersucht. Ohne Kandidaten wird die
Stellung untersucht. Es gibt keine automatische Bewertungsleiste, keinen
vorgegebenen besten Zug und keine automatische Übernahme eines Enginezuges.

Genutzt wird Stockfish.js 19.0.1 mit **Stockfish 19 Lite WASM**, single-threaded,
serverseitig im eigenen Node-Prozess. Die kleinere Lite-Netzvariante ist nicht
mit dem vollständigen Stockfish-Netz gleichzusetzen. `npm ci` installiert die
verifizierten Paketartefakte über das Lockfile; ein C++-/WASM-Build ist unnötig.
Das npm-Paket enthält mehrere Varianten (insgesamt etwa 205 MB entpackt),
ausgeführt wird die etwa 1,7 MB große Lite-Single-Variante.

Suchgrenzen: Tiefe 12, 20.000 Knoten, eine Sekunde Suchzeit, ein Thread und
16 MiB Hash. Es gilt die zuerst erreichte Suchgrenze; die UCI-Engine prüft
Knoten-/Zeitgrenzen in Intervallen, daher sind sie keine exakten harten
CPU-Grenzen. Ein zusätzlicher Prozess-Timeout von acht Sekunden umfasst den
Engine-Start. Maximal eine Prüfung zugleich; Prozesse werden nach Ergebnis
oder Fehler beendet. Der Engineprozess erhält keine Server-Umgebungsvariablen
und somit keine Modellschlüssel.

Die Anzeige nennt Engine, tatsächlich erreichte Tiefe/Knotenzahl, Gesamtdauer,
Suchbedingungen, eine legal geprüfte untersuchte Variante und den Suchwert.
Centipawns sind aus Sicht von Weiß; Mattdistanzen benennen die begünstigte
Farbe. Das ist ein taktischer Suchbefund unter diesen Bedingungen, keine
absolute strategische Wahrheit. Untersucht wird die aktuelle FEN ohne
Wiederholungshistorie und ohne Tablebases. Beendete Varianten werden abgewiesen.

Befunde bleiben an der angefragten Stellung, auch wenn während der Suche
gewechselt wird. Ein Sitzungsimport verwirft ausstehende Ergebnisse. Herkunft
`stockfish`, Kandidat und Suchbedingungen werden als separater `factcheck`
in Schema 1 gespeichert. Bestehende Sitzungen ohne Befunde bleiben importierbar;
ältere App-Stände unterstützen die neue Befundart nicht. Importierte Befunde
werden auf Struktur, Stellung und legale Varianten geprüft, sind aber kein
kryptografisch beglaubigter Nachweis einer früheren Engineausführung.

Die Engine läuft nur am lokalen Node-Server (`npm start` oder `npm run dev`), nicht im statischen
Web-Build. Es sind weder API-Schlüssel noch kostenpflichtige Dienste erforderlich.
Echte lokale Engine- und Browserprüfungen sind in docs/VALIDATION.md dokumentiert.
Lizenz-/Quellenhinweise: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
