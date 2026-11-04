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
Die Tests müssen zehn einzelne Testfälle melden; eine alleinige Dateizählung
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

Noch keine Oberfläche, Modellanbindung, Anfragefehlerbehandlung oder Stockfish.
Prüfgrundlage: [docs/VALIDATION.md](docs/VALIDATION.md).
