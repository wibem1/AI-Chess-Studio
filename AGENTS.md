# AI-Chess-Studio: Einstieg für Entwicklungsagenten

1. Zuerst die globalen [DEVELOPMENT_STANDARDS.md](https://github.com/wibem1/AI-Development-Standards/blob/main/DEVELOPMENT_STANDARDS.md) und [AGENTS.md](https://github.com/wibem1/AI-Development-Standards/blob/main/AGENTS.md) vollständig lesen.
2. Danach PROJECT_STATE.md, gegebenenfalls TODO.md und den relevanten Code lesen.
3. Ein überschaubarer Schritt, objektive Prüfung, gemeinsames Sichern von Code, Prüfergebnissen und Projektstand. Den letzten verifizierten Stand erhalten.
4. Ziel ist ein deutschsprachiges, dialogorientiertes strategisches Schachlabor. Pläne, gegnerische Absichten, Variantenbaum, strategisches Gedächtnis und menschliche Spielbarkeit stehen im Mittelpunkt.
5. Regelprüfung und strategische KI trennen. Eine etablierte Schachbibliothek für legale Züge verwenden. KI-Aussagen sind begründete Hypothesen; gegnerische Absichten sind keine gesicherten Fakten.
6. Stockfish bleibt ein optionaler, ausdrücklich ausgelöster taktischer Faktencheck. Keine automatische Bewertungsleiste oder Vorgabe des vermeintlich besten Zuges.
7. Automatisierte Tests bevorzugen; den Nutzer erst nach eigenen Prüfungen um einen kurzen gezielten Anwendungstest bitten. Mock-Tests belegen keine reale KI- oder Stockfish-Integration.
8. Keine Veröffentlichung, Releases, Deployments oder Änderung der Repository-Sichtbarkeit ohne ausdrücklichen Auftrag. Keine automatischen GitHub-Actions-Workflows einrichten. Keine API-Schlüssel im Repository oder Browser speichern.
9. Status präzise benennen: geplant, implementiert, statisch geprüft, simuliert getestet, mit realen Komponenten getestet, vom Nutzer bestätigt.
