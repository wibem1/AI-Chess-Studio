# Projektstand

Stand: 4. November 2026

## Ziel

Dialogorientiertes strategisches Schachlabor mit Plandiskussion, gegnerischen
Möglichkeiten, Variantenbaum, strategischem Gedächtnis und menschlicher
Spielbarkeit. Stockfish ausschließlich als optionaler taktischer Faktencheck.

## Belegter Bestand

- Globale DEVELOPMENT_STANDARDS.md Version 1.0 und globale AGENTS.md sowie
  lokale Einstiegsdateien vollständig gelesen.
- Phase 1 im Commit 51ba463 auf Branch work erhalten: TypeScript-Schachkern,
  chess.js, Variantenbaum und validiertes Sitzungsformat.
- Phase 2 implementiert und mit Simulation getestet: lokale deutsche Oberfläche,
  Brett-/SAN-Züge, Variantenwechsel, Planwerkstatt und strategisches Gedächtnis.
- Deterministischer Testadapter zeigt ausdrücklich simulierte Hypothesen,
  ungeordnete legale Beispielkandidaten, Risiken, Spielbarkeit und offene Fragen.
  Keine echte strategische Analyse durch ein Modell.
- Dialogantworten bleiben am Anfrageknoten; Sitzungsersatz verwirft ausstehende
  Antworten. Ungültige Ausgaben und Anfragefehler verändern den Dialog nicht.
- JSON-Download sowie Text-/Dateiimport erhalten Varianten, Dialog und Gedächtnis.
- Lockfile-Installation, strikte Typprüfung und Web-Build bestanden;
  14 isolierte Tests und fünf echte Chromium-Browsertests bestanden,
  keine fehlgeschlagen oder übersprungen. Siehe docs/VALIDATION.md.
- Desktop-/Mobilansicht zusätzlich visuell geprüft, nicht vom Nutzer bestätigt.

## Blocker und Grenzen

Keine reale KI oder Stockfish angebunden. Simulation belegt ausschließlich
Datenfluss und Bedienung, keine Analysequalität. Daten liegen im Arbeitsspeicher;
Export vor Neuladen erforderlich. Tests/Netzwerk benötigen in dieser Umgebung
zusätzliche Prozessrechte; System-Chromium ist vorhanden.
Keine Veröffentlichung, kein Deployment, keine kostenpflichtigen API-Aufrufe.

## Nächster einzelner Schritt

Vor Phase 3 den lokalen Phase-2-Durchlauf kurz vom Nutzer prüfen lassen:
Stellung spielen, eigenen Plan diskutieren (Simulation), Variante abzweigen,
Sitzung exportieren und wiederherstellen. Phase 3 anschließend gezielt
vorbereiten: Modellanbieter, serverseitige Schlüsselverwaltung, Kontext- und
Kostenbegrenzung festlegen. Reale Modelltests erst nach ausdrücklicher
Autorisierung kostenpflichtiger API-Aufrufe; aktuell weiterhin untersagt.
