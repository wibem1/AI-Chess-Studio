# Chess Studio 1.5 – Reale Partie: Schlüsselstellungen für die Qualitätsprüfung

## Herkunft und Abgrenzung
Das Repository enthält bereits die vollständige, vom Nutzer bereitgestellte Partie `test/fixtures/lichess-1Vh80QL2.pgn` (EgorSN – wibem, 6.11.2026, 137 Halbzüge, remis). Sie wird unverändert als **echter, lokaler Quellbeleg** verwendet. `test/fixtures/lichess-1Vh80QL2.md` beschreibt die Herkunft und die originale Unicode-/Kommentarstruktur. Die Lichess-Kommentare und dortigen Alternativen sind **importierte Einschätzungen**, keine neue unabhängige Stockfish-Berechnung und kein Beweis für menschlich-strategische Lehrqualität.

## Fünf verankerte Schlüsselfragen
Die neuen Tests `test/real-game-strategy-quality.test.ts` rekonstruieren die Position vor dem gespielten Zug und prüfen dessen Legalität, die genannte Kommentaralternative und die **tatsächlich folgende** gegnerische Antwort. Ein eigener Zweig für die Alternative darf die Original-FEN niemals verändern.

| Halbzug | Tatsächlich gespielt | In PGN genannte Alternative | Tatsächliche gegnerische Antwort | Prüfgegenstand |
| --- | --- | --- | --- | --- |
| 11 | 6. e5 | 6. Nc3 | 6… dxe5 | Zentrum und Figurenentwicklung |
| 35 | 18. Nd6 | 18. Rxf6 | 18… Re7 | Springerplan gegen taktische Möglichkeiten |
| 41 | 21. Nxb7 | 21. Ne4 | 21… Rxb7 | Bauerngewinn versus Gegenangriff |
| 55 | 28. Rd1 | 28. b4 | 28… Nxg3 | Turmmanöver und Taktik |
| 93 | 47. Rxg7 | 47. Ra7 | 47… Nxg7 | Materialverlust im Endspiel |

## Qualitätsmaßstab
Für jeden Fall muss eine echte KI-Antwort die Stellung korrekt wiedergeben, die Stellung **beider** Seiten würdigen, einen nachvollziehbaren Plan mit Umsetzung nennen und den gegnerischen Gegenzug berücksichtigen. Die fünf importierten Zugalternativen sind eine Hilfe zur Kontrolle, **keine Pflicht**, genau dieselben Züge als beste zu nennen. Bewertet werden Bretttreue, sachliche Korrektheit, Planausarbeitung, gegnerisches Gegenspiel und pädagogischer Wert – nicht die bloße Übereinstimmung mit einer Enginezahl.

**Noch offen:** Es wurden in diesem Schritt keine echten KI-Antworten eingeholt und keine bezahlten Modellaufrufe gemacht. Die automatischen Tests bewerten nur die Rekonstruktion und das Verhalten des deterministischen Kerns. Für eine echte Modellbewertung sind identische Prompts, protokollierte Antworten und manuelle Bewertung nach `docs/STRATEGIC_QUALITY_CORPUS_1_5.md` erforderlich.
