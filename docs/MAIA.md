# Maia als alternativer Spielgegner

Geprüfter Quellenstand: 6. November 2026. **Machbarkeit untersucht; noch nicht
integriert oder mit echten Maia-Zügen getestet.** Stockfish bleibt verfügbar.

Maia lernt aus menschlichen Partien, welche Züge Menschen unterschiedlicher
Spielstärke wahrscheinlich spielen. Das passt besser zum gewünschten Gegner
als eine bloße Reduzierung der Stockfish-Suchstärke. Es garantiert weder eine
bestimmte Elo-Leistung noch natürlich wirkende Züge in jeder Stellung.
Menschliche Zugwahrscheinlichkeit ist außerdem keine taktische Widerlegung
oder verlässliche Gesamtbewertung für den getrennten Lernbegleiter.

## Offizielle Implementierungen

- [Maia Classic](https://github.com/CSSLab/maia-chess): neun Gewichte für
  Lichess-Stärken 1100–1900; benötigt lc0/UCI, empfohlen `go nodes 1` ohne
  tiefere Suche. Laut Autoren kann das tatsächliche Spiel stärker als die
  Trainingsgruppe sein. Keine Elo-Zusage aus einem Modellnamen ableiten.
- [Maia2](https://github.com/CSSLab/maia2): Python/PyTorch auf CPU, CUDA oder MPS;
  die Dokumentation empfiehlt inzwischen Maia3 für neue Projekte. MIT-Code;
  Gewichte separat prüfen.
- [Maia3](https://github.com/CSSLab/maia3): Python-/UCI-Inferenz, 5M-, 23M- und
  79M-Modelle, unterschiedliche Spieler-/Gegnerstärken und Samplingparameter.
  Das 5M-Modell ist der empfohlene Einstieg für CPU und GUI. Erster Start lädt
  Modellgewichte von Hugging Face. Code unter AGPL-3.0; die konkreten
  Gewichtsbedingungen wurden hier nicht geprüft. WDL-/CP-Ausgaben sind
  Vorhersagen menschlicher Ergebnisse, keine durchsuchte Stockfish-Bewertung.

In den gelesenen offiziellen Anleitungen ist keine direkt verwendbare
Browserverteilung dokumentiert. GitHub Pages führt keine Python-/UCI-Prozesse
aus. Einen Maia-Schalter ohne lauffähiges Modell anzubieten wäre irreführend.
Die Modellgewichte wurden nicht heruntergeladen; Hugging Face gehört nicht
zu den freigegebenen Netzwerkzielen dieser Entwicklungsumgebung.

## Nächster technischer Schritt

Einen isolierten Browser-Prototyp mit legal nutzbarem, kleinem Modell und
passender Inferenzlaufzeit untersuchen: Export-/Operatorunterstützung,
WASM-/WebGPU-Laufzeit, Downloadgröße, Arbeitsspeicher, Erststart/Offline-Cache
und Zuglatenz zuerst messen. Bei Maia3 5M beginnen, sofern Lizenz und
Exportfähigkeit bestätigt sind; ältere Modelle als Alternative prüfen.
Windows/macOS sowie tatsächliche Android-/iPad-Geräte berücksichtigen;
CPU-Fallback ist nötig, falls WebGPU fehlt. Keine versteckte Cloudabhängigkeit.

Erst danach in den Spielengine-Adapter aufnehmen: legale Züge, vollständige
Partiehistorie, Stärkeprofil, abbrechbare laufende Berechnung, Rücknahme und
Moduswechsel müssen genauso funktionieren wie bei Stockfish. Engineidentität
und Parameter ehrlich anzeigen; Stockfish als Alternative erhalten. Ein
lokaler Python-/UCI-Adapter wäre eine getrennte Desktop-Erweiterung und kein
Ersatz für die plattformübergreifende Browserintegration.
