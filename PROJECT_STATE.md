# Projektstand

Stand: 6. November 2026 · Entwicklungsversion **0.2.0**

## Verbindliches Ziel

Persönliches deutschsprachiges Schach-Lernprogramm: gegen Stockfish oder später
eine andere Engine spielen und während/nach der Partie mit einer getrennten KI
über eigene Ideen, Stellungen und Strategien lernen. Varianten ausprobieren,
speichern, benennen und vergleichen, ohne die laufende Partie zu verändern.
Menschliche Denkweise ist Kern der Lernanalyse; Enginebewertung allein reicht nicht.
Siehe DEVELOPMENT_PLAN.md.

Nutzerentscheidung vom 6. November: eine gemeinsame responsive Web-App für
Windows, macOS, Android und iPadOS, langfristig installierbare PWA. Vier Tabs und
aufklappbare Werkzeuge lösen die sperrige Gesamtseite ab. Native Hüllen optional.

## Aktueller Schritt: Tab-Oberfläche 0.2.0

- Partie: gemeinsames Brett, Farbe/Level, Einrichtung, Start/Pause/Fortsetzen,
  Partieverlauf. „Neue Partie“ am Brett öffnet/fokussiert die Einrichtung.
- Lernen: dasselbe Brett, fortlaufender Lerndialog, eigene Gedanken und gestufte
  Hilfe; Notizen und zusätzlicher taktischer Faktencheck aufklappbar.
- Varianten: Variantenbaum, Benennen und A/B-Vergleich neben demselben Brett.
- Einstellungen: lokaler Schlüssel, Budget, Sitzung sichern/laden, Diagnose und
  Updates. Schlüsselwerte weder in Browser-Storage noch Sitzungsexport.
- Desktop: Brett und Arbeitsbereich nebeneinander. Kleinere Viewports: gestapelt,
  Navigation bleibt unten sichtbar. Züge/Umwandlung/legale Züge aufklappbar.
- Tabwechsel erzeugen kein neues Brett und starten keine Modell-/Engineanfrage;
  Stellung, Partie, Varianten und Entwurf bleiben bestehen. Tastatur mit
  Pfeiltasten/Home/End, Direktlinks und Browser-Zurück geprüft.
- Browser-/Node-Version aus package.json; ZIP/Ordner/Manifest gleich nummeriert.
  CHANGELOG.md dokumentiert Änderungen. Frühere Commits/Pakete bleiben erhalten.

## Weiterhin nachgewiesene Funktionen

- Stockfish 19 Lite WASM als realer Gegner auf fünf Skill-Stufen, Weiß/Schwarz,
  volle legale Historie mit chess.js, Sonderzüge und Partieende.
- Getrennter Partiekursor, Analysezweige, Namen, Vergleich und JSON-Import/-Export;
  Import pausiert Partien, veraltete Engine-/Dialogantworten werden verworfen.
- KI-Lernvertrag mit eigenen Ideen/Begründung/Lernziel, Leitfrage/Hinweis/Erklärung,
  begrenzter tatsächlicher Zugfolge und passenden früheren Gesprächsrunden.
  Simulation und echte Herkunft getrennt, keine automatische Enginebewertung.
- Lokale Schlüsseldatei: Windows-DPAPI implementiert, POSIX privat 0600/0700;
  dauerhafte sichtbare Speicheranzeige, Fortschritt und eindeutige Fehler.
- Kosten als Schätzung: Budget, dauerhafte Reservierungen, höchstens drei
  Modellversuche je Serverstart und Budgetperiode, keine automatischen Retries.
- Diagnose, ausdrücklich bestätigte Git-Updates, lokaler Desktop-Server,
  portable Windows-Node-Laufzeit, Mac-Starter und Portausweichlogik.
- Mausziehen, Touch-Taps, natives Wischen, Seitenziehen auf Text statt Markieren,
  separate Scrollhilfe und rein lokale Bedienungsdiagnose ohne Eingabewerte.

## Prüfstand

Typprüfung/Build, **68 Einzeltests und 34 Chromium-Browsertests** bestanden.
Tests nutzen die tatsächliche gebaute App und echte lokale Stockfish-Prozesse;
Provider-/Updatezugriffe sind Fixtures, keine bezahlte Anfrage.

Bestehende Browserabläufe folgen den sichtbaren Tabs und Aufklappabschnitten
mit echten Klicks; versteckte Controls werden nicht per DOM-Manipulation geöffnet.
Neue Fälle prüfen gemeinsame Brettidentität/Daten/Entwurf, keine Modellanfrage
beim Wechsel, Tastatur, Direktlink/Reload/Browser-Zurück, Partiestart-Einstieg und
alle Tabs bei 390x844, 820x1180 und 1440x900 ohne horizontales Überlaufen.
Desktop-/Mobil-/Lern-Screenshots der echten App visuell geprüft. Ausführlicher
Nachweis und frühere Korrekturen: docs/VALIDATION.md.

## Grenzen und Nutzerbefunde

Nutzer meldete erfolgreichen lokalen Windows-Start und später funktionierende
Schlüsselspeicherung. Scrollproblem wurde als Textmarkierung beim Ziehen
präzisiert; die gezielte Browserkorrektur ist geprüft, echte Windows-Touch-
Abnahme weiterhin offen. Native DPAPI-/Mac-/Safari-/Android-/iPad-Abnahme und
ein realer pädagogischer Lerndialog sind nicht durch Linux-/Fixturetests ersetzt.

Der Node-Server bindet weiterhin ausschließlich an Loopback. Responsive Tabs,
Manifest und Icons liefern noch keinen eigenständigen Android-/iPad-Betrieb.
Es gibt keinen Service-Worker-/API-/Schlüsselcache und keinen Offlinebetrieb.
Sitzungen bleiben bis zum bewussten Export im Arbeitsspeicher. Skill-Stufen sind
keine geeichten Elo-Werte; Kostenanzeige ist kein verbindliches Anbieterlimit.

Keine Releases, Deployments, Actions, Sichtbarkeitsänderungen oder kostenpflichtige
Textgenerierung ausgeführt. Bestehende Freigabe für bis zu drei begrenzte reale
KI-Tests gilt weiter; nicht erneut nach Cloud-Secrets fragen und niemals einen
Schlüssel im Chat anfordern.

## Nächster einzelner Plattformschritt

PlayingEngine um einen begrenzten Stockfish-WASM-Worker im Browser ergänzen und
mit denselben Spiel-/Regeltests prüfen. Danach mobilen Modelltransport und lokale
Schlüsselablage prüfen. Details und verbleibende Plattformadapter:
PLATFORM_ARCHITECTURE.md. Parallel bleibt die native Nutzerabnahme offen.
