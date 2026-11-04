# Projektstand

Stand: 4. November 2026

## Ziel

Dialogorientiertes strategisches Schachlabor mit Plandiskussion, gegnerischen
Möglichkeiten, Variantenbaum, strategischem Gedächtnis und menschlicher
Spielbarkeit. Stockfish ausschließlich als optionaler taktischer Faktencheck.

## Belegter Bestand

- Globale DEVELOPMENT_STANDARDS.md Version 1.0 und globale AGENTS.md sowie
  lokale Einstiegsdateien vollständig gelesen.
- Phase 0 dokumentiert; Phase 1 implementiert und isoliert getestet.
- TypeScript-Schachkern mit chess.js 1.4.0: legale Züge, Sonderzüge,
  Partieende und Variantenhistorie einschließlich Stellungswiederholung.
- Variantenbaum mit Stellungswechsel und getrennten Abzweigungen.
- Serialisierbares Sitzungsmodell (Schema 1), rekonstruktiv validierter Import,
  stellungsbezogene Dialog-/Gedächtnisdaten mit Herkunft und Hypothesen.
- Strikte Typprüfung und Build bestanden. Zehn automatisierte Einzeltests
  bestanden, keine fehlgeschlagen oder übersprungen; siehe docs/VALIDATION.md.
- Keine Oberfläche, reale KI, Stockfish-Integration oder Nutzerabnahme.
  Dialogdaten im Test sind Simulation und kein Integrationsnachweis.

## Blocker und Grenzen

Der frühere Terminalblocker ist behoben. Netzwerkoperationen und der vollständige
Node-Testlauf benötigen in dieser Umgebung zusätzliche Ausführungsrechte.
Realer Modellanbieter und Zugang sowie spätere Stockfish-Bereitstellung sind
weiter offen, blockieren Phase 2 mit Testadapter aber nicht.
Keine Veröffentlichung, kein Deployment, keine kostenpflichtigen API-Aufrufe.

## Nächster einzelner Schritt

Phase 2: kleine lokale Weboberfläche mit legaler Zugeingabe, Variantenwechsel
und stellungsbezogenem strategischem Dialog über einen klar gekennzeichneten
deterministischen Testadapter integrieren; automatisierten Browserdurchlauf
mit Sitzungswiederherstellung, ungültigen Ausgaben und Anfragefehlern prüfen.
Code, Prüfergebnisse und Projektstand danach gemeinsam sichern.
