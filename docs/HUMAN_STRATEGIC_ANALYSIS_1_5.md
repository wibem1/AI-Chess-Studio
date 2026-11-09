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

## Implementierter Schritt: evidenzgebundene Bauernpläne und Gegenmaßnahmen (9. November 2026)

`src/strategic-plans.ts` wurde über die ursprünglichen pauschalen Planhinweise hinaus überarbeitet. Die Architektur ist von Kibitz' Trennung zwischen Brettmerkmalen, Planentwicklung und mehrstufigem Vorgehen inspiriert; die TypeScript-Implementierung ist eigenständig. Bei isoliertem gegnerischem Bauern und eigenem Turm auf derselben Linie wird jetzt der **durch Figuren freie Weg bis zum Zielbauern** ausdrücklich geprüft. Ein eigener Springer als Hindernis verhindert den Angriffsbefund. Freibauernpläne benennen besetzte Vorfelder als konkrete Hindernisse. Ein neuer dritter Planansatz findet legale Bauernvorstöße, die im nächsten Zug Kontakt zu einem gegnerischen Bauern herstellen (z. B. e4 als möglicher Hebel gegen d5), ohne den Zug als taktisch haltbar zu bewerten. Alle Ziele nennen Vorbereitung, mögliche Abwehr, Unsicherheit und – beim Bauernhebel – einen als legal ermittelten Ausgangszug. Zur Begrenzung der KI-Anfrage wird je Seite zunächst nur die führende Planhypothese übergeben.

Die Testdatei `test/strategic-plans.test.ts` enthält neun gezielte Fälle, darunter blockierte Linie, blockierter Freibauer, legaler Hebel, serverseitige Neuberechnung gegen manipulierte Daten, Kontextbudget und Anbindung an den freien Dialog. **Diese automatisierten Node-/TypeScript-Tests wurden auf dem Branch noch nicht ausgeführt.** Ein separater, vereinfachter JavaScript-FEN-Simulationstest (ohne `chess.js` und ohne echte Legalitätsprüfung) konnte die Planlogik in fünf exemplarischen Stellungen ausführen: Startstellung, freier Turmangriff, blockierter Turmangriff, blockierter Freibauer, Bauernhebel. Das ist ein begrenzter Logik-Sanity-Check, **kein vollständiger Testnachweis** und keine Modell-/Engineprüfung.

Noch ausstehend: fachliche Qualität in komplexen Mittelspielen, ganzheitliche Planverknüpfung und Figurenwege nach Kibitz, genaue Prüfung gegnerischer taktischer Antworten, variable Planfortschreibung über mehrere Züge, Build und Browserregressionen sowie echte Lern-KI-Tests. Der neue Teil ist eine kleine, prüfbedürftige Erweiterung, **keine freigegebene Version 1.5**.

## Entwicklungsschritt: Strategien nach legalen Halbzügen neu prüfen (9. November 2026)

In `src/strategic-plan-development.ts` ist eine erste deterministische Fortschreibung implementiert: Aus der vorherigen FEN, einem wirklich **legalen** Zug und der erreichten FEN werden die zuvor erkannten Hauptpläne für beide Seiten mit neu berechneten Planhypothesen verglichen. Ausgegeben werden `still_candidate` (weiterhin als Hypothese sichtbar), `goal_obsolete` (ursprüngliches Bauernziel ist von diesem Feld verschwunden) oder `reconsider` (die Voraussetzungen des bisherigen Hauptplans werden nicht mehr bestätigt). Keine dieser Stufen behauptet einen Gewinn, Verlust oder taktische Widerlegung. Der alte Plan wird **nicht als bestehende Wahrheit** über den Zug hinaus konserviert.

`src/dialogue.ts` liefert diese kompakte Fortschreibung im gewöhnlichen Lernchat mit; `src/model-contract.ts` baut die Werte aus der zuvor auf Regelkonformität geprüften tatsächlichen Zuggeschichte **neu** auf. Extern übermittelte Fortschreibungsbehauptungen werden ignoriert. Bei leerer Historie gibt es keine erfundenen Änderungen. Direkte Stellungsanalysen im Schach oder nach dem Spielende erzeugen keine längerfristigen Pläne: Die konkrete Gefahr hat Vorrang.

Gezielte neue Tests (noch nicht in der Node-/TypeScript-Laufzeit ausgeführt) prüfen Legalität, unveränderte Hypothesen, blockierte bzw. veränderte Pläne, Angriffsziel nach tatsächlichem Schlagzug, vorrückenden Zielbauern, erneute Berechnung gegen manipulierte Daten und die Unterdrückung strategischer Ratschläge bei Schach/Matt. `Rxd5` und `...d4` wurden als konkrete Regressionsfälle aufgenommen.

**Grenze:** Das ist eine regelgebundene Statusfortschreibung, noch keine berechnete langfristige Variantenstrategie. Es wird kein Zugbaum bewertet, keine Stockfish-Engine automatisch eingeschaltet, und die Erfolgschance eines Plans wird nicht geschätzt. Solange die tatsächlichen npm-Abhängigkeiten im lokalen Arbeitscontainer fehlen und dieser GitHub nicht klonen kann, ist weder ein vollständiger Build noch eine Testabnahme belegt. Nach dem Build muss insbesondere das Dialog-Kontextbudget mit umfangreichen Partien und laufenden Brettwerkzeugen geprüft werden.

## Statische Konsistenzkorrektur der Planfortschreibung (9. November 2026)

Die erste Regressionsprüfung enthielt einen falschen positiven Fall: `Kd2` blockiert als eigener König die Linie des Turms d1 zum Bauern d5; ein bestehender Test verlangte dennoch `still_candidate`. Korrigiert: `Kf2` belässt die Linie frei, `Kd2` verursacht `reconsider` mit belegbarer Blockade auf d2. Die Planfortschreibung benennt bei solchen Fällen nun das konkrete Hindernis statt lediglich die alte Planidee pauschal zu verwerfen. **Keine abgeschlossene Laufzeitprüfung; die Tests wurden ergänzt, nicht erfolgreich ausgeführt.**

## Mehrfach belegte Pläne – erste erfolgreiche Integration (9. November 2026)

Der Planer bezieht neben der Isolierung eines gegnerischen Bauern und einer freien Turmlinie nun auch die halboffene Linie (falls in den begrenzten strategischen Merkmalen enthalten) sowie die **tatsächliche statische Deckung des angegriffenen Bauern** aus `chess.js` ein. Die KI bekommt damit zusammengehörige Belege in einem einzigen Plan, ergänzt um den konkreten Hinweis, ob der Bauer bereits gedeckt ist oder eine aktuelle Deckung nicht erkennbar ist. Ein bloß ungedeckter Bauer gilt dennoch nicht als gewonnen. Die Implementierung übernimmt **keinen fremden Rust-Quellcode**, sondern das Prinzip der Kibitz-Planverknüpfung in eigenständigem TypeScript.

**Technische Prüfung:** GitHub Actions [42604214281](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42604214281) erfolgreich (TypeScript, Node-Tests, Web-Build, fokussierte Chromium-Regressionen); vorgelagerter Basislauf [42603767332](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42603767332) ebenso erfolgreich. Der umfassende, zuvor nicht abschließende Browsertest wurde für die Entwicklungsprüfung auf wichtige, zeitbegrenzte Regressionen umgestellt. Schachliche Praxistests mit realen LLM-Antworten bleiben offen.

## Erster geprüfter Springerweg zu einem Stützpunkt (9. November 2026)

Kibitz' Trennung zwischen räumlicher Route und strategischer Zweckbestimmung wurde als **eigenständiger** TypeScript-Baustein `src/strategic-knight-routes.ts` umgesetzt. Die Wegsuche erkennt maximal zweizügige, aktuell von eigenen Figuren freie Springerwege zu Feldern in der gegnerischen Brettseite, die ein eigener Bauer kontrolliert und die **derzeit nicht durch gegnerische Bauern** angegriffen sind. Für die am Zug befindliche Seite wird der erste Springerzug auf tatsächliche Legalität geprüft. Die nicht am Zug befindliche Seite bekommt nur einen hypothetischen Pfad, keinen behaupteten legalen SAN-Zug. Über `src/strategic-plans.ts` wird die Route mit Belegfeldern, Stützbauer, Zwischenetappen und Gegenmaßnahmen als `improve_knight_outpost` in die bisherige KI-Planstruktur aufgenommen. Ein Pfad der Form `b1–c3–d5` ist **kein** Beleg dafür, dass die komplette mehrzügige Folge spielbar oder gut ist; gegnerische Antworten, andere Figurenangriffe und langfristige Zielwertigkeit sind weiterhin zu prüfen. Weder fremder Rust-Code noch ein GPL-Codebestand wurden übernommen.

**GitHub Actions:** [42613124332](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42613124332) erfolgreich, einschließlich TypeScript, Node, Web und fokussierter Chromium-Regressionen. Kein Live-Release und keine reale KI-Qualitätsabnahme.

## Springerroute: gegnerische Figurenkontrolle und alternative Wege (9. November 2026)

Der bisherige Filter gegen gegnerische Bauernangriffe wurde auf **jede gegnerische Figur** mittels `chess.js`-`isAttacked` ausgeweitet. Ziel und Zwischenfelder werden bei gegenwärtiger gegnerischer Kontrolle nicht als automatisch sinnvoller Springerweg behandelt. Die Wegsuche lässt außerdem verschiedene kurze Routen zu, selbst wenn sie teilweise dieselben Zwischenfelder durchlaufen; innerhalb eines Weges werden Zyklen ausgeschlossen. Diese Überprüfung ist **konservativ**: Feldkontrolle ist nicht identisch mit taktischer Widerlegung, ein durch eigene Figuren ausreichend gedecktes Feld kann trotzdem gut sein. Die bereits bestehende Trennung zwischen einem legal geprüften ersten Zug und einer **nicht verifizierten** mehrzügigen Planhypothese bleibt verbindlich. Neue Negativfälle: schwarzer Turm beherrscht das Zielfeld d5; schwarzer Läufer beherrscht die Zwischenstation c3.

Prüfbeleg: [GitHub Actions 42614496428](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42614496428), vollständig erfolgreich (Typprüfung, Node-Tests, Web-Build, gezielte Chromium-Regressionen). Eine reale fachliche KI-Schachabnahme ist damit nicht ersetzt.

## Umkämpfte, aber mehrfach gedeckte Springerfelder – geprüfte Ergänzung (9. November 2026)

Mit `chess.js.attackers(square,color)` werden eigene und gegnerische Angreifer eines Zwischen- oder Zielfeldes erhoben. Der Springer, der dorthin geführt werden soll, zählt nicht als eigener unabhängiger Verteidiger. Ein aktuell von gegnerischen Figuren kontrolliertes Feld wird nur bei **numerischem Verteidigerüberschuss** als hypothetische Station akzeptiert, nicht aber bei gegnerischem Bauernangriff. Umkämpfte Felder erscheinen als `contestedSquares` im Plan, verbunden mit einer ausdrücklichen Warnung, dass Angreiferzählung weder eine Taktikprüfung noch eine garantierte mehrzügige Zugfolge darstellt. Unangegriffene Routen haben Vorrang.

Gegenbeispiele untersuchen die Kontrolle von c3 durch einen schwarzen Läufer f6, während Weiß auf c1 einen Turm und auf d2 einen Bauern als zusätzliche Verteidiger hat. Derselbe Springerweg wird bei nur einem Verteidiger verworfen. Ein schwarzer Bauer auf a6 unterbindet eine ansonsten bevorzugte Ausweichroute nach b5, damit die beiden Tests tatsächlich die Schutzverhältnisse auf c3 messen. GitHub Actions [42618368501](https://github.com/wibem1/AI-Chess-Studio/actions/runs/42618368501) **SUCCESS** (236 Node-Tests, TypeScript, Web-Build, Chromium-Regressionen). Noch keine echte KI-Qualitätsabnahme, keine Veröffentlichung.
