# AI-Chess-Studio: Einstieg für Entwicklungsagenten

1. Zuerst die globalen [DEVELOPMENT_STANDARDS.md](https://github.com/wibem1/AI-Development-Standards/blob/main/DEVELOPMENT_STANDARDS.md) und [AGENTS.md](https://github.com/wibem1/AI-Development-Standards/blob/main/AGENTS.md) vollständig lesen.
2. Danach PROJECT_STATE.md, gegebenenfalls TODO.md und den relevanten Code lesen.
3. Ein überschaubarer Schritt, objektive Prüfung, gemeinsames Sichern von Code, Prüfergebnissen und Projektstand. Den letzten verifizierten Stand erhalten.
4. Ziel ist ein persönliches deutschsprachiges Schach-Lernprogramm: Der Mensch spielt gegen Stockfish oder eine andere Engine auf wählbarer Stärke und bespricht während/nach der Partie mit einer getrennten KI Stellungen, Strategien und Varianten. Analysevarianten müssen die laufende Partie unverändert lassen; speichern, benennen, vergleichen und zur Partie zurückkehren sind Kernfunktionen. Siehe DEVELOPMENT_PLAN.md.
5. Regelprüfung und strategische KI trennen. Eine etablierte Schachbibliothek für legale Züge verwenden. KI-Aussagen sind begründete Hypothesen; gegnerische Absichten sind keine gesicherten Fakten.
6. Die gewählte Spielengine (Stockfish oder Maia-2) ist im ausdrücklich gestarteten Spielmodus der automatische Gegner. Davon getrennt ist Stockfish-Analyse ein optionaler taktischer Faktencheck auf Aufruf. Keine automatische Bewertungsleiste oder ungefragte Zugvorgabe während des Lernens. Enginegegner und KI-Lernbegleiter nicht verwechseln.
7. Automatisierte Tests bevorzugen; den Nutzer erst nach eigenen Prüfungen um einen kurzen gezielten Anwendungstest bitten. Mock-Tests belegen keine reale KI- oder Stockfish-Integration.
8. Keine Veröffentlichung, Releases, Deployments oder Änderung der Repository-Sichtbarkeit ohne ausdrücklichen Auftrag. Keine automatischen GitHub-Actions-Workflows einrichten. Keine API-Schlüssel im Repository oder unverschlüsselt im Browser speichern. Gemäß Nutzerkorrektur vom 6. November ist die Standardspeicherung im Browserprofil ohne zusätzliches App-Passwort: AES-GCM mit nicht exportierbarem CryptoKey in IndexedDB. Das schützt nicht vor Zugriff durch dasselbe Browserprofil oder Same-Origin-Skripte und ist kein OS-/Hardware-Schlüsseltresor. Optionaler Passwortschutz und vorhandene Passwortfächer bleiben unterstützt; keine automatische Entschlüsselung oder Löschung alter Daten. Klartext nur im RAM, kein API-Schlüssel in Partie/Diagnose/Offline-Cache.
9. Status präzise benennen: geplant, implementiert, statisch geprüft, simuliert getestet, mit realen Komponenten getestet, vom Nutzer bestätigt.

10. Langfristige Zielplattformen: Windows, macOS, Android, iPadOS. Gemeinsamer browserfähiger Lernkern und UI; Plattformfunktionen über Adapter. Node-/DPAPI-Abhängigkeiten bleiben außerhalb des Frontends. PLATFORM_ARCHITECTURE.md beachten. Touch-Viewport-Tests sind keine native Geräteabnahme.

11. Versionierung: package.json ist die zentrale Quelle der App-Version; package-lock.json
    synchron halten. Jede neu ausgelieferte Codekorrektur erhöht die Patchnummer
    (0.1.0 → 0.1.1), neue Funktionen die Minor-Nummer (0.2.0). Vor Bereitstellung
    Tests bestehen lassen und CHANGELOG.md aktualisieren. UI, Start, Diagnose,
    ZIP-Dateiname und Paketmanifest müssen zur selben Version gehören. Alte
    nummerierte Downloads bleiben über ihre Git-Commits erhalten. Versionsnummern
    sind keine Zusage nativer Abnahme oder Erlaubnis für Releases/Deployments.

12. Nutzerziel vom 7. November: freier Lernchat ohne vorgeschriebenes Frage-/Antwortschema.
    Aktuelle Stellung, tatsächliche Partie und Gesprächskontext bereitstellen;
    ausführbare Brett-/Enginebefehle separat regelprüfen. Werkzeugschleife für
    Vorführung/Weiterspielen ist implementiert, auf zwei Werkzeugrunden begrenzt
    und mit echten Spielengines geprüft; reale KI-Werkzeugauswahl separat belegen. DEVELOPMENT_PLAN.md beachten.

13. Aktuelle Nutzerkorrektur vom 7. November nach 0.11.2: kompakte Oberfläche.
    Modell oben, Zugangskarte und technische Steuerung in Einstellungen.
    Hauptablauf Brett → freie Eingabe/aktuelle Antwort → Chatverlauf; keine
    vorgegebenen Analyse-/Kommentaroptionen. Start/Stop am Brett oben, gleiche
    Brettgröße in beiden Modi, Zum Anfang springen direkt erreichbar. Keine
    möglichen Zielfelder im Spielmodus. Weitere Werkzeuge zugeklappt.

14. Ab 0.11.0 OpenRouter, Anfrage-Diagnose und kontrollierte KI-Testpartien.
    Dokumentation: docs/AI_EVALUATION.md. Technische Fixture-Prüfungen belegen
    keine Schachkompetenz eines Modells. Private Provider-Denkblöcke gehören
    nicht in Diagnose, Chat oder Sitzung; zur Werkzeugfortsetzung nur im RAM.
    Kein automatisches Modell-Fallback oder kostenpflichtiger Teststart.

15. Ab vorbereitetem Stand 0.12.0 separate KI-Lehrdiagramme: show_position und
    draw_board. Nur validierte FEN und begrenzte feste Zeichenparameter; keine
    beliebigen Modell-Skripte/SVGs. Echte Partie/Analysezugfolge niemals durch
    ein Lehrdiagramm überschreiben. Die temporäre Ansicht bleibt klar benannt
    und rückkehrbar; Zugvorführung bleibt separat legalitätsgeprüft.

16. Ab vorbereitetem 0.13.0 stehen Vor/Zurück am Lernbrett für die aktuelle
    Variante. Stellung spielen/lernen übernimmt ausdrücklich die sichtbare
    Stellung; vor spielbarer Kopie Quelle sichern. Auch Lehrdiagramme können
    als neue Spielwurzel übernommen werden. Keine bestehende Partie still
    überschreiben. KI-Engine-Statushöhe konstant halten, keinen zweiten
    Stopbutton einblenden, der das Brett während der Partie verschiebt.

17. Ab vorbereitetem 0.14.0 sind KI-Antworten in der Höhe veränderbar. Antwort-
    größe über Rerender erhalten, Texte nicht editierbar machen. Explizite
    Schlüsselstellen-Fragen verwenden geprüfte historische Zugbezüge und
    Pfeilnavigation. Annotation.gameReview mit der Partie serialisieren und
    beim Import gegen ihre eigene tatsächliche Knotenfolge prüfen. Analyse/
    Schlüsselstellen dürfen beim Speichern/Laden nicht still verloren gehen.

18. Ab 0.15.0 normaler Partiedateilader auch für fremde Einzel-PGNs. Freier
    Import ohne Nutzerseite/Pflichtfragen; vorherige Sitzung sichern, laufende
    Engines/Anfragen anhalten. Roh-PGN und neue Annotationen im JSON erhalten.
    Fremde Spielernamen/Kommentare sind importierte Daten und keine Nutzerangaben.
