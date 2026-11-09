# Chess Studio 1.5 – Schachliche Qualitätsprüfung (Korpus 1)

## Ziel und Grenzen

Die Node-Tests sind bisher überwiegend synthetische Einzelfälle. Dieser Korpus ergänzt sechs **legale, reproduzierbare Eröffnungsfolgen** mit 20 Halbzügen aus Spanisch, Abgelehntem Damengambit, Französisch, Sizilianisch, Caro-Kann und Italienisch. Die resultierenden Stellungen sind **keine behaupteten historischen Partien**, und ihre automatische Prüfung ist **keine Bewertung der Schachkompetenz des Sprachmodells**. Ein Korpus für späteren Vergleich echter KI-Antworten benötigt darüber hinaus Expertenurteile, mehr echte Mittelspielstellungen und die tatsächlichen Antworten mehrerer Modelle.

## Prüfregeln für den deterministischen Kern

Die Tests in `test/strategic-quality-corpus.test.ts` rekonstruieren jede Stellung durch `chess.js`-geprüfte SAN-Züge, statt ungeprüfte FEN zu behaupten. Sie prüfen einen gültigen Partieverlauf, unveränderte Original-FEN, maximal einen Hauptplan je Seite, den Status als nicht bewiesene Hypothese, reale Brettfelder als Belege, die Legalität konkreter erster Zugkandidaten und die Übereinstimmung von unmittelbaren Gegenspielwarnungen mit dem geprüften Ausgangszug. Dass der Planer in einer Stellung gar keinen Plan erkennt, ist **kein technischer Defekt**, zeigt aber möglichen Verbesserungsbedarf: Er ist derzeit bewusst enger als ein menschlicher Schachlehrer.

## Rubrik für reale KI-Antworten – noch NICHT ausgeführt

Jede Antwort zu derselben Stellung soll separat nach folgenden Dimensionen von 0 (mangelhaft) bis 3 (sehr gut) beurteilt werden. Eine numerische Summe ist nur mit nachvollziehbarer textlicher Begründung sinnvoll.

1. **Bretttreue:** Stimmen Figurfelder, am Zug befindliche Farbe und vorgeschlagene Züge? Kein erfundener Zug.
2. **Strategischer Gehalt:** Benennt die Antwort die tragenden Bauernstrukturen, guten/schlechten Figuren und langfristigen Ziele, statt reine Merkmalslisten zu geben?
3. **Plan und Umsetzung:** Erklärt sie konkrete Vorbereitung, Reihenfolge, Figurenmanöver und realistische Zeitkosten?
4. **Gegnerisches Gegenspiel:** Beurteilt sie Pläne beider Seiten und unmittelbare taktische Einwände fair?
5. **Lernwert:** Erläutert sie das *Warum* in verständlicher Sprache und unterscheidet Hypothesen, geprüfte Züge und offene Fragen?

Für jede Stellung soll der Testfragewortlaut identisch bleiben: `Erkläre mir die Stellung aus menschlich-strategischer Sicht. Was sind die wichtigsten Pläne beider Seiten, warum, und welche konkreten Gegenmaßnahmen sind denkbar?`

**Kein automatischer kostenpflichtiger Modelltest.** Vor einem solchen Vergleich: gewünschte Modelle, Denktiefe, gleiches Kostenbudget und ausdrückliche Freigabe festlegen. Die App erlaubt bereits den manuellen Diagnoseexport gemäß `docs/AI_EVALUATION.md`.
