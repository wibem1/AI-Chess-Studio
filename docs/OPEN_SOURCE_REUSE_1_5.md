# Open-Source-Übernahmeplan für Chess Studio 1.5
Stand: 9. November 2026 · Untersuchung des öffentlich lesbaren Quellcodes · Entwicklung in `feat/human-strategic-analysis-1-5`

## Zweck und verbindliche Abgrenzung
Chess Studio bleibt ein freier, menschlich orientierter Schachdialog mit Brettaktionen, Varianten und einer **optionalen** Stockfish-Kontrolle. Die Qualität eines Plans misst sich nicht an einem Zentibauernabstand allein, sondern an schachlich belegbarer Zielrichtung, gegnerischer Verteidigung, erforderlichen Zwischenzügen, menschlicher Verständlichkeit, Präzisionsbedarf und Robustheit. Eine KI darf keine empirisch unbelegten menschlichen Fehlerwahrscheinlichkeiten ausgeben. Wir verwenden bestehende quelloffene Verfahren als Bausteine, ohne aus Chess Studio eine andere Anwendung zu machen.

## Geprüfte Referenzprojekte – konkreter Code, Funktion und Entscheidung

| Referenz und Quelldateien | Relevante Idee | Entscheidung | Lizenzhinweis |
|---|---|---|---|
| [Kibitz](https://github.com/avienu/kibitz), `crates/kibitz-core/src/imbalance.rs`, `record.rs` | Unabhängig vom Sprachmodell erkennbare, strukturierte Ungleichgewichte mit Feldern, Seite und Belegen | **Übernehmen als Analysemodell**, sukzessive eigene TypeScript-Detektoren; Schema und Gegenbeispiele testen | `crates/*`: BSD-3-Clause |
| Kibitz, `plans.rs` | Zusammengehörige Planhinweise um Ziele zusammenführen, mehrere unabhängige Befunde als Unterstützung | **Hohe Priorität**; offene Pläne beider Seiten statt isolierter Floskeln | BSD-3-Clause |
| Kibitz, `route.rs`, `scheme.rs` | Tatsächliche Figurenwege und geordnete Zwischenziele, Voraussetzungen/Blockaden | **Hohe Priorität nach Merkmalsvalidierung**; vorbereitende Schritte dynamisch aus der Stellung prüfen | BSD-3-Clause |
| Kibitz, `wsui.rs`, `see.rs`, `prose_gate.rs` | Günstiger statischer Taktikvorfilter, Abtauschprüfung, Unterdrückung irrelevanter Warnungen | **Selektiv nutzen**; Warnungen erst als Hypothesen, bei konkreter Gefahr begrenzte Enginekontrolle; Filter nicht mit taktischem Beweis verwechseln | BSD-3-Clause |
| Kibitz, `crates/kibitz-verbalize/src/llm.rs`, `explain.rs` | Erklärungstext mit belegbaren Feldern/Markierungen; LLM-Ausgabe prüfen und kontrollierter Ersatz | **Prinzip übernehmen**, jedoch den freien KI-Dialog und bestehende Brettwerkzeuge erhalten; kein starres Template als primäre Benutzeroberfläche | BSD-3-Clause |
| Kibitz, `crates/kibitz-profile/src/player.rs` | Wiederholte Fehler- und Strukturmuster über viele Partien | **Später**, erst bei ausreichend bestätigter Partiehistorie; keine voreiligen Nutzerprofile | BSD-3-Clause |
| [ChessGPT](https://github.com/andrewnakas/ChessGpt), `crates/coach/src/verify.rs` | SAN-Züge aus freiem Modelltext erkennen, gegen Partie/Legalität/Enginevarianten prüfen | **Hohe Priorität** für verifizierbare Aussagen; explizit „legal“ von „durch Engine belegt“ trennen | AGPL-3.0: zunächst nur als Referenz, keine direkte Codeübernahme |
| ChessGPT, `crates/coach/src/tools.rs` | Deterministische Werkzeuge als nachprüfbare Faktenquelle | **Bestehende Tool-Schleife stärken**, nicht zweite Werkzeugarchitektur hinzufügen | AGPL-3.0 |
| ChessGPT, `crates/coach/src/key_moments.rs` | Automatische Schlüsselmomente nach objektiven Wendepunkten | **Nur ergänzend**: menschliche Lernmomente auch ohne große Enginebewertungsänderung finden | AGPL-3.0 |
| [GrokChess](https://github.com/saadkamal/GrokChess), `src/lib/coachText.ts` | Einfache konkrete Sätze aus legalen Brettfakten, zentralem Einfluss, Drohungen | **Gezielt nutzen**, nach nachgewiesener Korrektheit, ohne den freien Dialog einzuschränken | MIT |
| GrokChess, `src/lib/moveQuality.ts` | Starre Zugklassen aus Bewertungsverlust | **Nicht als pädagogischen Maßstab übernehmen**; höchstens separat gekennzeichneter Enginevergleich | MIT |

Nicht in die Anwendung übernehmen: Kibitz-`app/` (GPL-3.0, Tauri/Rust/SQLite/Chessground), fremde komplette Benutzeroberflächen, beliebige kopierte Schachbuch-Erklärungen, starre Enginescore-Labels als Ersatz für Strategiediskussion. Separate Abhängigkeiten mit GPL-Pflichten (z.B. Stockfish, Chessground) müssen eigenständig betrachtet werden.

## Urheberrechtliche Übernahmeregeln
1. **Idee / Architektur** darf nach eigener Implementierung in bestehendes TypeScript und `chess.js` übertragen werden, ohne Rust-Anwendung oder deren Buildsystem zu übernehmen.
2. Für **konkret übernommene BSD-3-Clause- bzw. MIT-Codeabschnitte** sind die jeweils erforderlichen Urheber- und Lizenzhinweise sowie die Vorgaben zur Weitergabe zu beachten. Jede Übernahme verlangt ein Datei- und Lizenzprotokoll; nicht pauschal „alles ist BSD“ annehmen.
3. ChessGPT-Code unter AGPL-3.0 **nicht kopieren oder portieren**, solange die Lizenzfolgen für unser Gesamtprojekt nicht gesondert entschieden sind. Funktionsideen können unabhängig realisiert werden.
4. Bei fehlendem Mehrwert oder übermäßiger Komplexität lieber einen kleinen bestehenden `chess.js`-Baustein erweitern; keine zweite Schachregelbibliothek einführen.

## Integration in das bereits vorhandene Chess Studio
- `src/position-facts.ts`: deterministische Regeln und konkrete Brettfakten beibehalten.
- `src/strategic-features.ts`: bereits implementierte erste Fakten aus FEN erweitern, mit Gegenbeispielen testen und eine übersichtliche Beweisstruktur pro Aussage entwickeln.
- `src/strategic-plans.ts`: bisher **nur vorbereitende Hypothesen** über isolierte Bauern und Freibauern. Kibitz-`plans/route/scheme` als Vorlage für echte verknüpfte Planziele, Figurenwege und notwendige Bedingungen. Keine illegalen oder taktisch ungeprüften Folgen als ausführbar darstellen.
- `src/dialogue.ts`, `src/model-contract.ts`: freie KI-Fragen, eigene Gedanken und bisherige Brettaktionen bleiben erste Klasse. Rechenbefunde werden mit ihrem FEN-Geltungsbereich, Belegfeldern, Konfidenz-/Prüfstatus und möglichen Gegeneinwänden verbunden; nicht ungeprüft dem Sprachmodell glauben.
- `src/coach-tools.ts`: vorhandenes `show_line`, `draw_board`, `show_position`, `play_engine` nur dort erweitern, wo es eine reale, nachgewiesene Lücke gibt.
- Partieanalyse: langfristige Hypothesen nach *jeder neuen Stellung* erneut prüfen; historische Aussagen an historische FEN binden. Engine-Zahl allein soll keinen Schlüsselzug definieren.

## Reihenfolge und überprüfbare Tests
1. **Zuerst** den bestehenden 1.5-Branch typprüfen und die bislang nur geschriebenen Tests ausführen; Lücken und Regressionen beheben. Keinen neuen Funktionsumfang als „funktioniert“ melden, solange diese Prüfung fehlt.
2. Kibitz-Planverknüpfung als eigenen, kleinen Testbaustein: z.B. isolierter Bauer + offene Linie + Figurenanreise → eine Hypothese mit mehreren unabhängigen Belegen; negative Tests bei blockierter Linie oder wirksamer Gegenseite.
3. Mehrstufige Strategie/Route mit Stellungsfortschreibung: legaler erster Schritt, Plan nach gegnerischer Verteidigung adaptieren oder aufgeben, keine gespeicherten Schein-Zugfolgen.
4. ChessGPT-inspirierte **unabhängig implementierte** Validierung der im KI-Text behaupteten Züge; Satzteil „Ein Zug ist legal“ darf **keine** sachliche Überlegenheit behaupten.
5. Kibitz-inspirierter Taktikvorfilter und optionaler Stockfish-Faktencheck; Planvergleich aus menschlicher Perspektive bleibt separate Antwort.
6. Gezielte qualitative Gegenüberstellung anhand eigener, konkreter PGN/FEN-Stellungen und echten Modellantworten; Kosten nur nach Freigabe. Sicherungs-/Abnahmetests für Varianten, freies Gespräch, PGN, Einstellungen und Release.

## Abnahmeszenarien
- *Objektiv fast ausgeglichen, praktisch schwer zu verteidigen*: die KI benennt den schwer zu findenden Verteidigungsplan und notwendige Präzision, erfindet aber keine menschliche Fehlerquote.
- *Angriff gegen isolierten Bauern*: mehrere Vorbereitungsziele, gegnerische Verteidigung und notwendige Neuplanung nach einem Gegenzug – nicht nur „Turm auf offene Linie“.
- *Bauernstruktur gezielt schwächen*: motivierter Bauernhebel nur nach Prüfung von Timing und konkretem Gegenspiel.
- *Nur scheinbare Taktik*: angreifbare, aber problemlos bewegliche Dame oder normaler Abtausch führt nicht zu erfundenem Materialgewinn.
- *Zwei strategisch plausible Pläne*: vergleichbarer Lernwert, Risikoprofil, Rechentiefe und Spielbarkeit; Stockfish nennt höchstens ergänzende, exakt stellungsgebundene Befunde.
- *KI halluziniert eine Variante*: Bericht wird differenziert (nicht legal / legal, aber nicht belegt / geprüft), ohne unbelegte Schachfakten.

## Verifikationsstand
Dies ist eine **belegte Architekturauswahl aus öffentlichen Quelldateien**, kein Nachweis der Wirksamkeit oder abgeschlossener Codeintegration. Die bestehenden `strategic-features.ts` und `strategic-plans.ts` sind ein noch nicht vollständig getesteter Prototyp; keine fremden Codeabschnitte übernommen. Die bereits veröffentlichte Chess Studio 1.1.3 bleibt unangetastet.
