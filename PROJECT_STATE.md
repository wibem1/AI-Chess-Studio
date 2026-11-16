# Projektstand

## Architekturentscheidung vom 16.11.2026 – dynamische Modellauswahl
- Benutzerentscheidung: Jede KI-fähige App soll Modelle dynamisch aus Provider-Katalogen laden, soweit technisch möglich; bestehende funktionierende Auswahl bleibt unverändert. Maßgeblich sind die zentralen Standards v1.1, Abschnitte 17–22.
- Im hier dokumentierten Projektstand ist noch kein realer KI-Adapter nachgewiesen. **Nur Anforderung dokumentiert, nicht implementiert, nicht getestet, kein Release.** Bei Implementierung der KI-Anbindung anwenden; aktuellen Code/Branch vorher neu prüfen.


Stand: 4. November 2026

## Ziel

Dialogorientiertes strategisches Schachlabor mit Plandiskussion, gegnerischen Möglichkeiten, Variantenbaum, strategischem Gedächtnis und praktischer menschlicher Spielbarkeit. Stockfish ausschließlich als optionaler taktischer Faktencheck.

## Belegter Bestand

- Globale DEVELOPMENT_STANDARDS.md Version 1.0 und globale AGENTS.md vollständig gelesen.
- Repository wibem1/AI-Chess-Studio über GitHub geprüft: privat, vor diesem Grundlagenschritt leer.
- Phase 0: Projektanweisungen, geplanter Prototypumfang und Prüfkriterien dokumentiert.
- Kein Anwendungscode, keine installierten Abhängigkeiten, keine implementierten Funktionen.
- Keine Tests ausgeführt; keine Versions- oder Downloadfreigabe.

## Blocker

Das Terminal meldet „No usable execution environment is available“. Implementierung und lokale Unit-/Browserprüfungen sind in dieser Sitzung nicht ausführbar. GitHub-Lese- und Schreibzugriff stehen zur Verfügung. Der frühere Schachchat liegt lediglich als begrenzte Vorschau vor; seine vollständige Lektüre ist nicht belegt.

## Nächster einzelner Schritt

In einer verfügbaren Entwicklungsumgebung dieses Repository öffnen, Einstiegshinweise lesen und Phase 1 umsetzen: Schachkern mit etablierter Regelbibliothek, Variantenbaum und serialisierbarem Sitzungsmodell samt isolierten Tests. Erst nach bestandenen Prüfungen Code und Ergebnisse zusammen sichern.

## Noch offen

Realer Modellanbieter und Zugang, spätere Stockfish-Bereitstellung. Für Phase 1 ist noch keine kostenpflichtige Modellanfrage erforderlich.
