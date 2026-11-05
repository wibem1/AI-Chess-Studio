# Entwicklungsplan – persönliches Schach-Lernprogramm

Verbindliche Zielkorrektur aus der Nutzerklarstellung vom 5. November 2026.

## Kernziel

Der Nutzer spielt gegen Stockfish (oder später eine andere Engine) auf
unterschiedlichen Stufen. Während und nach der Partie kann er mit einer
getrennten KI über Stellung, mögliche Varianten und Strategien sprechen.
Er probiert Varianten aus, speichert, benennt und vergleicht sie. Es geht
um sein Lernen und Verstehen, nicht um eine Engine-Analyseoberfläche.

## Zentraler Lernablauf

Partie spielen → bei einer Frage pausieren → eigenen Plan diskutieren →
Gegenmöglichkeiten ausprobieren → Varianten A/B mit Notizen vergleichen →
zur unveränderten Partie zurückkehren → Partie fortsetzen → Lernsession sichern.
Nach Partieende stehen Dialog und Analysevarianten weiterhin zur Verfügung.

## Komponenten und Nachweis

1. **Spielgegner:** Stockfish Lite, Weiß/Schwarz, fünf Skill-Stufen, automatische
   legale Gegenzüge, vollständige Historie und Partieende. Real lokal getestet.
2. **Partie und Analyse:** echter Partiekursor getrennt vom Analysebrett;
   pausieren, verzweigen und fortsetzen. Veraltete Antworten nach Pause,
   Neustart der Partie oder Sitzungsersatz verwerfen. Automatisiert geprüft.
3. **Variantenarbeit:** Namen, zwei Bretter, Zugfolgen, gemeinsame Ausgangsstellung,
   Notizen und JSON-Sicherung einschließlich Partie-/Vergleichsmetadaten.
   Automatisiert und im Browser geprüft.
4. **KI-Lernbegleiter:** Dialog zum ausgewählten Stand, begrenzter Kontext aus
   vorherigen eigenen Plan-/Dialognotizen, Partie und ausgewähltem A/B-Vergleich.
   Herkunft/Hypothesen deutlich markieren. Transport und Kontext lokal simuliert
   geprüft; echte Modellqualität und Anbieterintegration noch offen.
5. **Lokale Bedienung:** dauerhafter API-Schlüssel auf dem App-Rechner,
   Kostenkontrolle, Diagnose und Updates vorhanden. Kein Cloud-Secret-Dialog
   als Voraussetzung für lokalen PC-Betrieb.
6. **Zusätzlicher Faktencheck:** taktische Engineanalyse nur ausdrücklich
   ausgelöst und getrennt vom automatischen Spielgegner; kein ungefragter
   bester Zug und keine automatische Bewertungsleiste im Lernmodus.

## Humanfaktor – verbindlicher Analysemaßstab

Die menschliche Denkweise ist Kern der Lernanalyse, nicht eine zusätzliche
Formulierung neben einer Enginebewertung. Ausgangspunkt sind die eigene Idee,
Begründung und offene Frage des Lernenden. Fehlen diese, fragt die KI nach,
statt ihm einen Gedankengang oder eine Spielstärke zuzuschreiben.

Bei Plänen und A/B-Vergleichen betrachtet der Lernbegleiter:

- Wie man auf die Idee kommen kann: Figurenaktivität, Bauernstruktur, Muster,
  Schwächen und erkennbare Drohungen, soweit konkret begründbar.
- Verständlichkeit des Plans und sinnvolle nächste Schritte.
- Rechenaufwand und notwendige Genauigkeit; leicht übersehbare Antworten.
- Wie sich der Plan nach einer gegnerischen Abweichung weiterführen lässt.
- Praktische Entscheidungsprobleme und Lernwert für die geäußerten Lernziele.

Taktische Haltbarkeit, strategische Idee und menschliche Umsetzbarkeit sind
getrennte Fragen. Ein leichter verständlicher Plan wird nicht ohne Prüfung
als taktisch korrekt bezeichnet. Es gibt keine erfundenen psychologischen
Scores oder Enginewerte. Gegnerabsichten und mögliche Denkfehler sind
Hypothesen. Die Engine-Stufe ist keine Einstufung des Menschen.

Diese Anforderungen sind im Modellauftrag konkretisiert; ihre Erfüllung durch
eine reale KI ist noch zu prüfen und wird nicht durch Prompttext bewiesen.

## Bedienbarer Humanfaktor

An jeder Stellung können freiwillig eigene Idee, Begründung, Unsicherheit und
Lernziel festgehalten werden. Diese Angaben sind Selbstangaben, keine Diagnose
oder Bewertung des Menschen. Sie werden mit der Sitzung gespeichert und als
begrenzter Kontext in den Dialog gegeben.

Gewünschter Hilfeumfang: Leitfrage (keine Zugvorschläge oder fertige Lösung in
der Anzeige), kleiner Denkhinweis oder ausführliche Erklärung. Moderne reale
Modellantworten müssen strukturierte Lernaspekte zu Idee, Rechenarbeit,
übersehbaren Antworten und Weiterführung enthalten; fehlerhafte Antworten
werden nicht als Lernergebnis gespeichert. Das beweist noch keine pädagogische
Qualität; Simulationen bleiben sichtbar als Simulation gekennzeichnet.

## Plattformziel

Windows, macOS, Android und iPadOS sind langfristige Zielplattformen.
Gemeinsamer Lernkern, responsives Frontend und getrennte Engine-/Modell-/
Speicheradapter sind verbindlich. Aktuell gibt es einen Desktop-Node-Backendweg;
eine mobile Standalone-App ist noch nicht fertig. Siehe PLATFORM_ARCHITECTURE.md.

## Noch erforderliche Abnahme

Ein realer, begrenzter KI-Dialog zum eigenen Plan und einem ausgewählten
Variantenvergleich mit nutzerseitig lokal hinterlegtem Schlüssel. Anschließend
gezielter manueller Windows-Lerndurchlauf. Simulationen und Linux-Tests ersetzen
weder diese reale KI-Prüfung noch die native Windows-Abnahme.

Der reale Lerndialog muss zusätzlich nachweisen: eigene Begründung aufgreifen,
praktischen Unterschied zweier Pläne erklären, mindestens einen relevanten
Aufmerksamkeits-/Rechenaspekt benennen und eine hilfreiche Lernfrage stellen,
ohne Enginezahlen, persönliche Eigenschaften oder taktische Sicherheit zu
erfinden. Nutzerfeedback zu Verständlichkeit und Lernwert gehört zur Abnahme.
