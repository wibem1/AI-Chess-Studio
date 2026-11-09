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

## Reproduzierbare manuelle Ergebnisbewertung (9. November 2026)

Das neue browserkompatible Modul `src/strategic-evaluation.ts` erzeugt aus legalen Hauptzügen fünf eindeutige Bewertungsfälle der schon belegten Lichess-Partie. Es rekonstruiert die unveränderliche **Stellung unmittelbar vor** dem Schlüsselschritt, kontrolliert die dokumentierten gespielten Züge sowie die folgenden realen Antworten und gibt die **identische Frage** für alle Modelle aus. Beleg: `test/strategic-evaluation.test.ts`.

`recordStrategicEvaluation()` kann später eine tatsächliche Modellantwort zusammen mit Modellbezeichnung, Denkstufe und **fünf getrennten Bewertungen (0–3) mit je einer konkreten Begründung** als strukturierten Datensatz aufnehmen. Fehlende Antworten, Noten, Begründungen und unpassende FEN werden abgewiesen. Die Gesamtzahl wird nur aus **explizit vergebenen** Noten berechnet; der Code behauptet keine automatische Bewertung und führt weder Engine- noch kostenpflichtige KI-Aufrufe aus. Ein manuell erzeugter Platzhalter in Tests ist ausdrücklich **keine reale Modellantwort**. Eine Benutzeroberfläche und die Anbindung an echte Exportdiagnosen stehen noch aus.

## Eingebaute Bewertungsansicht (9. November 2026)

Im noch unveröffentlichten Entwicklungsbranch gibt es unter **Einstellungen → Diagnose und Fehlerberichte → Schachliche KI-Qualität vergleichen (manuell)** eine aufklappbare Rubrik. Originalpartie als PGN öffnen, die fünf Prüfungsfälle laden, Modellantwort passend zur exakt gleichen FEN aus dem gespeicherten Lerndialog auswählen oder tatsächlich vorliegende Antwort einfügen, Modell und Denkstufe eintragen und jede der fünf Rubriken (0–3) **mit konkreter Begründung** beurteilen. Die Gesamtpunkte und Texte werden pro Fall und Modell in einer kompakten Vergleichstabelle angezeigt. Vor einem Seitenneuladen den JSON-Download auslösen: **kein automatisches dauerhaftes Speichern**, dafür manuell kontrollierbarer Export und späterer Import. Der Import wird durch den Bewertungs-Kern erneut auf die gerade geöffnete Referenz-PGN geprüft. Export enthält reale Texte und ist vertraulich zu behandeln.

**Verifiziert** mit [GitHub Actions 42645497597](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42645497597): 257 Node-Tests, 12 Chromium-Browsertests sowie Typprüfung und Web-Build erfolgreich. Ein neuer Test prüft den vollständigen Benutzerablauf ohne irgendeine KI-Anfrage. Die in diesem Browsertest angezeigte Antwort ist ausdrücklich ein **Testtext**, keine tatsächlich erhobene Modellqualität. Eine inhaltliche Begutachtung echter Modellantworten und native Geräteabnahme stehen weiterhin aus.

## Einheitliche Prüfungsfrage auf dem Originalbrett vorbereiten (9. November 2026)

Im Einstellungsbereich `Schachliche KI-Qualität vergleichen (manuell)` kann nach Auswahl eines belegten Falles nun **„Stellung und Prüffrage vorbereiten”** gewählt werden. Die App springt zur tatsächlichen Stellung vor dem kritischen Zug in der importierten Original-PGN, wechselt in den Lernmodus und trägt die unveränderte standardisierte Strategiefrage ein. **Nur vorbereiten, nicht absenden:** Es findet kein Modell-/Engine-/Provideraufruf statt und die ursprüngliche Zugfolge bleibt erhalten. Der Benutzer startet einen etwa kostenpflichtigen KI-Aufruf getrennt mit „Senden”. Bei noch laufender Anfrage oder aktiver KI-Testpartie wird die Vorbereitung abgewiesen, statt den Vorgang heimlich zu unterbrechen.

Bestätigt mit [GitHub Actions 42646986136](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42646986136): 257 Node-Tests, 12 Playwright-Browsertests, TypeScript und Web-Build erfolgreich. Der Test prüft das tatsächliche Öffnen von Knoten `n10` der Lichess-Partie und das vorbelegte Fragefeld bei null Modellanfragen. Noch **keine** realen Modellbewertungen oder native Geräteabnahmen.
