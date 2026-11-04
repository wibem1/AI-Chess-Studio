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
