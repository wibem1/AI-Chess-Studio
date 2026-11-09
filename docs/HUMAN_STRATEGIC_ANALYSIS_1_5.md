# Chess Studio 1.5 – menschliche Strategieanalyse statt pauschaler Enginebewertung

Status: Entwicklungsentwurf und erster implementierter Analyseschritt auf Branch `feat/human-strategic-analysis-1-5`. **Keine Version 1.5 veröffentlicht.**

## Produktgrundsatz

Die Lern-KI ist ein schachlicher Gesprächspartner, nicht nur der Übersetzer einer Engine-Zahl. Der Benutzer kann seine Pläne und Gründe erklären, Fehler untersuchen, Gegenpläne vergleichen und Schach verstehen lernen. Stockfish dient der begrenzten Prüfung konkreter Varianten und taktischer Risiken, **nicht** als alleinige Autorität für menschliche Spielbarkeit, Unterrichtswert oder Planverständlichkeit. Maia dient als menschennahes Spielmodell; Elo-Behauptungen benötigen eigene Validierung.

## Technischer Ausgangspunkt

- Bisherige Regelgrundlage: `src/position-facts.ts` (Figuren, Material, Schach, Matt und legale Schlagzüge); die freie KI-Analyse konnte darüber hinaus viele ungesicherte strategische Behauptungen formulieren.
- Neu: `src/strategic-features.ts` berechnet aus der aktuell sichtbaren FEN einfache strukturelle Merkmale mit Belegfeldern und **vorsichtigen** Planhypothesen. Keine Engine, keine Netzverbindung, keine numerische Stellungsbewertung. Dieselbe Berechnung wird auf der Modell-Transportgrenze neu ausgeführt (fremde Befunde werden ignoriert).
- `src/dialogue.ts` reicht die Befunde an den bisherigen Chat weiter; `src/model-contract.ts` beschreibt ausdrücklich ihren beschränkten Aussagewert. Bei ganzen Partien beziehen sie sich nur auf die letzte FEN; ältere Positionen dürfen nicht dadurch umgedeutet werden.
- Der Chat bleibt frei, darunter bisherige Varianten, Partien und Prüfung auf Zuglegalität unverändert.
- Vergleichsgrundlage: Kibitz `avienu/kibitz`, insbesondere `crates/kibitz-core/src/{imbalance,wsui,plans,route,scheme,prose_gate}.rs` (BSD-3-Clause), `crates/kibitz-verbalize` (BSD). Der vorliegende TypeScript-Baustein ist eigenständig geschrieben; keine fremden Codeabschnitte kopiert. GPL-3.0-App-Komponenten von Kibitz werden **nicht** übernommen.

## Ausbaupfad bis zu einer abnahmefähigen 1.5

1. **Strukturfakten vervollständigen:** Bauernhebel, rückständige Bauern, blockierte Freibauern, Leichtfigurenqualität, tatsächlich besetzbare Vorposten, offene/geschlossene Zentren, Entwicklung aus Zuggeschichte, Königssicherheit und Initiativhinweise. Für jeden Detektor: positive und negative Referenzstellungen.
2. **Widersprüche und Relationen:** Die KI soll nicht nur Merkmale aufzählen. Verknüpfungen zwischen einem schwachen Feld, einer möglichen Figurenroute, der gegnerischen Verteidigung und einem realistischen Zeithorizont werden zu *prüfbedürftigen* Planhypothesen. Auch robuste Gegenspiele und Alternativpläne bereitstellen. Menschliche Einfachheit, Rechenaufwand, Reversibilität und praktische Fallen getrennt von taktischer Haltbarkeit beurteilen.
3. **Taktische Schranke:** Nur konkrete Behauptungen zu Materialverlust, Varianten, Matt und Gegenschlag automatisch oder auf Anfrage mit eigener Regel-/Enginekontrolle abgleichen. Keine pauschale Abwertung eines menschlich gut spielbaren Plans wegen einer kleinen Stockfish-Differenz. Ungeprüft, widerlegt und belegt sauber unterscheiden.
4. **Erklärung mit Belegen:** Jeder konkrete Plan soll sich auf FEN/Spielzug, betroffene Figuren/Felder und bekannte Gegeneinwände beziehen. Vorhandene `draw_board`-Werkzeuge können auf Nachfrage diese Belegfelder zeigen. Keine ungefragten Brettaktionen. Die von der KI vorgeschlagenen Züge müssen weiter legal sein.
5. **Partie und Lernverlauf:** Frühere Stellungen einzeln rekonstruieren, nicht die Endstellung auf den gesamten Verlauf übertragen. Schlüsselstellen nach *menschlichen* Lernmomenten und – wo sinnvoll – taktischen Wendepunkten auswählen. Wiederkehrende Schwächen erst über mehrere konkrete, gespeicherte Beispiele behaupten.
6. **Qualität/Abnahme:** Keine ungerechtfertigten Bewertungen bei Materialungleichgewichten oder ruhigen Stellungen; Schach/Matt hat Vorrang; gegnerische Pläne nicht vergessen; beliebige eigene Nutzerideen ohne Belege nicht als Fakten übernehmen. Mit festen FEN-Testfällen, ungültigen Modellantworten, realen Enginevarianten und mehreren echten Modellantworten testen. Keine kostenpflichtigen Modellaufrufe ohne gesonderte Testfreigabe.

## Akzeptanzkriterien

- Keine erfundene schachliche Gewissheit aus rein statischen Merkmalen; Benennung von Unsicherheiten.
- Beide Seiten und kritische Antworten im Analysekontext; nachvollziehbare planbezogene Schachfelder.
- Analysen berücksichtigen geäußerte eigene Gedanken, statt sie durch automatische Enginezuglisten zu ersetzen.
- Klare Trennung zwischen **Brettfakt**, **Plan-Hypothese**, **geprüfter taktischer Befund** und **menschlicher Empfehlung**.
- Keine Verschlechterung von PGN-Import, Varianten, KI-Dialog, Stockfish-Option, Kosten-/Schlüsselspeicherung.
- Bevor eine echte 1.5 freigegeben wird: erfolgreiche Typprüfung, Einzeltests, Integrationstests und nachvollziehbarer Praxistest an geeigneten realen Partien; aktuelle 1.1.3 bleibt bis dahin live.

## Grenzen der ersten Teilimplementierung

Die bisherigen Detektoren beschreiben zunächst einfache Bauern-, Linien-, Figurenentwicklungs- und Schildstrukturen. Sie berechnen **noch keine echten langfristigen Zugfolgen**, keine tiefen taktischen Widerlegungen und keine Stellungsgüte. Besonders wichtig: Ein Läuferpaar oder Freibauer ist nicht automatisch gut, eine offene Linie nicht automatisch beherrscht, ein fehlender Schildbauer nicht automatisch eine Königsschwäche. Ein aktueller FEN-Schnappschuss beweist nicht die Entwicklungsgeschichte. Der Status bleibt **implementiert, nicht mit echten KI-Antworten oder vollständigen Builds validiert**, bis eine Prüfung tatsächlich nachgewiesen ist.

## Erweiterter Nutzerauftrag: Pläne über mehrere Züge und praktische Verteidigbarkeit (9. November 2026)

Stockfish liefert einen wertvollen, aber eingeschränkten Referenzwert unter idealisierter Verteidigung. Der entscheidende Unterschied ist die praktische Erreichbarkeit: Eine geringe Engine-Differenz kann eine überaus anspruchsvolle Verteidigung verbergen. Umgekehrt beweist ein leicht schlechterer Enginewert nicht, dass ein strategisch verständlicher Plan unbrauchbar ist. Die App soll deshalb **keine numerische Ersatzbewertung behaupten** und nicht ohne eigene Belege angeben, wie wahrscheinlich der Gegner einen Rettungszug findet.

Ein Langfrist-Plan ist künftig ausdrücklich ein strukturierter, veränderlicher Entwurf mit `goal`, `target`, `evidence`, geordneten `stages`, `prerequisites`, `possibleDefense`, `practicalDifficulty` und `status`. Ein Plan kann zum Beispiel einen isolierten Bauern zunächst fixieren, dann weitere Figuren heranführen und erst danach den Bauern gewinnen. Oder einen Freibauern durch Blockadekontrolle, Figurenverbesserung und vorbereitetes Vorrücken verwerten. Die Absicht ist noch **kein nachgewiesener taktisch ausführbarer Zugplan**: konkrete Etappen, Gegenzüge und Zugfolgen müssen erst durch Stellungsfortschreibung geprüft werden.

Erste prototypische Typen und Kandidaten entstehen in `src/strategic-plans.ts`. Der freie Chat erhält diesen Kontext; die serverseitige Anfragevalidierung berechnet ihn anhand der FEN neu. Er wird für die beiden Farben getrennt begrenzt. Langfristig werden Planverläufe nach jedem Halbzug neu geprüft und an eine gespeicherte Ausgangsstellung gebunden. Für echte *menschliche* Spielbarkeit werden keine unbelegten Fehlerwahrscheinlichkeiten eingeführt. Stattdessen qualitativer Vergleich: Zahl kritischer Entscheidungen, Zwang zur Genauigkeit, Erkennbarkeit der Gegenspielidee, Robustheit bei Abweichungen. Eventuelle empirische Maia-/Menschenstatistiken müssen als eigene, getrennte Evidenz ausgewiesen werden.

## Externe Open-Source-Komponenten (verbindliche Auswahl)

Die geprüften Übernahme-/Nichtübernahmeentscheidungen, Herkunft, Lizenzgrenzen, Integrationspunkte und Abnahmeszenarien stehen in [OPEN_SOURCE_REUSE_1_5.md](OPEN_SOURCE_REUSE_1_5.md). Insbesondere Kibitz ist die Hauptreferenz für strategische Planbildung; ChessGPT für die Sicherung faktischer KI-Aussagen; GrokChess für einfache Schachfakten. Die bestehende freie Lern-KI wird **nicht** durch ein festes Template oder reine Enginezug-Klassifikation ersetzt.
