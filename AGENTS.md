# AI-Chess-Studio: Einstieg für Entwicklungsagenten

1. Zuerst die globalen [DEVELOPMENT_STANDARDS.md](https://github.com/wibem1/AI-Development-Standards/blob/main/DEVELOPMENT_STANDARDS.md) und [AGENTS.md](https://github.com/wibem1/AI-Development-Standards/blob/main/AGENTS.md) vollständig lesen.
2. Danach PROJECT_STATE.md, gegebenenfalls TODO.md und den relevanten Code lesen.
3. Ein überschaubarer Schritt, objektive Prüfung, gemeinsames Sichern von Code, Prüfergebnissen und Projektstand. Den letzten verifizierten Stand erhalten.
4. Ziel ist ein persönliches deutschsprachiges Schach-Lernprogramm: Der Mensch spielt gegen Stockfish oder eine andere Engine auf wählbarer Stärke und bespricht während/nach der Partie mit einer getrennten KI Stellungen, Strategien und Varianten. Analysevarianten müssen die laufende Partie unverändert lassen; speichern, benennen, vergleichen und zur Partie zurückkehren sind Kernfunktionen. Siehe DEVELOPMENT_PLAN.md.
5. Regelprüfung und strategische KI trennen. Eine etablierte Schachbibliothek für legale Züge verwenden. KI-Aussagen sind begründete Hypothesen; gegnerische Absichten sind keine gesicherten Fakten.
6. Stockfish ist im ausdrücklich gestarteten Spielmodus der automatische Gegner. Davon getrennt ist Stockfish-Analyse ein optionaler taktischer Faktencheck auf Aufruf. Keine automatische Bewertungsleiste oder ungefragte Zugvorgabe während des Lernens. Enginegegner und KI-Lernbegleiter nicht verwechseln.
7. Automatisierte Tests bevorzugen; den Nutzer erst nach eigenen Prüfungen um einen kurzen gezielten Anwendungstest bitten. Mock-Tests belegen keine reale KI- oder Stockfish-Integration.
8. Keine Veröffentlichung, Releases, Deployments oder Änderung der Repository-Sichtbarkeit ohne ausdrücklichen Auftrag. Keine automatischen GitHub-Actions-Workflows einrichten. Keine API-Schlüssel im Repository oder unverschlüsselt im Browser speichern. Gemäß ausdrücklichem Nutzerwunsch nach lokalem Key im Webbetrieb ist ein mit Gerätepasswort verschlüsseltes IndexedDB-Schlüsselfach zulässig; Passwort nicht speichern, Klartext nur im entsperrten RAM, kein Schlüssel in Sitzung/Diagnose/Offline-Cache.
9. Status präzise benennen: geplant, implementiert, statisch geprüft, simuliert getestet, mit realen Komponenten getestet, vom Nutzer bestätigt.

10. Langfristige Zielplattformen: Windows, macOS, Android, iPadOS. Gemeinsamer browserfähiger Lernkern und UI; Plattformfunktionen über Adapter. Node-/DPAPI-Abhängigkeiten bleiben außerhalb des Frontends. PLATFORM_ARCHITECTURE.md beachten. Touch-Viewport-Tests sind keine native Geräteabnahme.

11. Versionierung: package.json ist die zentrale Quelle der App-Version; package-lock.json
    synchron halten. Jede neu ausgelieferte Codekorrektur erhöht die Patchnummer
    (0.1.0 → 0.1.1), neue Funktionen die Minor-Nummer (0.2.0). Vor Bereitstellung
    Tests bestehen lassen und CHANGELOG.md aktualisieren. UI, Start, Diagnose,
    ZIP-Dateiname und Paketmanifest müssen zur selben Version gehören. Alte
    nummerierte Downloads bleiben über ihre Git-Commits erhalten. Versionsnummern
    sind keine Zusage nativer Abnahme oder Erlaubnis für Releases/Deployments.
