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

Nutzerentscheidung vom 6. November 2026: Primäres Ziel ist eine gemeinsame
plattformübergreifende Web-App für Windows, macOS, Android und iPadOS, langfristig
als installierbare PWA. Native Hüllen bleiben optional. Die Oberfläche gliedert
sich in Partie, Lernen, Varianten und Einstellungen; seltene Optionen werden
aufgeklappt. Version 0.2.0 setzt diesen Oberflächenumbau um.
Gemeinsamer Lernkern, responsives Frontend und getrennte Engine-/Modell-/
Speicheradapter sind verbindlich. Aktuell gibt es einen Desktop-Node-Backendweg;
eine mobile Standalone-App ist noch nicht fertig. Siehe PLATFORM_ARCHITECTURE.md.

## Technisch integrierter Lerndialog

Der Lernablauf enthält Gesprächseinstieg, natürliche Antwort, gezielte
Rückfrage, Kontextfortführung und Partierückblick. Die Modellanbindung nutzt
geprüfte Zugfolgen und echte vorherige Gesprächsrunden als separate Rollen.
Simulationsantworten sind keine Modellvorgeschichte. Ältere fachliche Details
bleiben abrufbar, ohne den natürlichen Gesprächsfluss zu überladen.

Der Browser-Integrationslauf verbindet eine echte Stockfish-Partie mit dem
tatsächlichen Modell-Service und einem ersetzten Provider für drei
Gesprächsrunden einschließlich Rückblick aus einer Analysevariante. Das
belegt Datenfluss und Bedienung, nicht reale Modellqualität.

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


## Neuer Lernmodus: Partie verstehen (Nutzerentscheidung 6. November 2026)

Der vorhandene Lern-Tab wird um einen eigenständigen, geführten Rückblick auf
**bereits gespielte menschliche Partien** ergänzt. Kein neues Projekt, keine
zweite App und kein automatischer Engine-Analysebildschirm. Die laufende
Plattformentwicklung bleibt unangetastet; Umsetzung als abgegrenzter Folgeschritt
auf dem jeweils aktuellen geprüften Code.

### Benutzerablauf und didaktische Regeln

1. **PGN importieren:** Einfügen oder Datei laden, einschließlich Zugfolge,
   Spielerfarbe, Ergebnis und soweit vorhanden Uhrzeiten, Zeitkontrolle und
   PGN-Kommentare. Validierung durch die bestehende Schachregelbibliothek;
   fehlerhafte PGNs verständlich zurückweisen, Import niemals als aktive
   Enginepartie starten.
2. **Eigene Perspektive:** Spielerfarbe wählen/erkennen; Brett frei drehbar,
   für den schwarzen Spieler standardmäßig **Schwarz unten**. Dieselbe
   Orientierung in Partie-, Lern- und Variantenansicht konsistent erhalten,
   einschließlich auf Tablet/Handy. Kein Wechsel zu Lichess notwendig.
3. **Geführter Rückblick:** Vor einem ausgewählten eigenen Zug anhalten;
   tatsächlich gespielten Zug und Engineurteil zunächst **verbergen**.
   Zum Zeitpunkt passende Stellung, Zugnummer, Spielerseite und optional
   damals verbrauchte Bedenkzeit anzeigen. Kritische Stellen dürfen aus
   objektiven Indikatoren wie Materialänderung, taktischer Spannung, neuen
   Freibauern, Planwechsel oder ungewöhnlicher Zugzeit vorausgewählt
   werden; keine behauptete psychologische Diagnose.
4. **Zuerst den Menschen fragen:** „Was wolltest du erreichen?“,
   „Welche Antwort des Gegners hast du erwartet?“, „Welche Alternativen
   hast du erwogen?“ und gegebenenfalls „Hat sich dein Plan geändert?“.
   Nutzer darf auch „weiß ich nicht mehr“ angeben; frühere Gedanken
   niemals als Fakten erfinden. Fragen dosieren, nicht alles gleichzeitig.
5. **Gestufte Auflösung:** Erst nach Nutzerantwort oder ausdrücklichem
   Aufdecken den damaligen Zug, plausible gegnerische Antworten,
   Alternativen und optional den ausdrücklich ausgelösten Stockfish-
   Faktencheck zeigen. Strategisches Verständnis, taktische Korrektheit,
   Bedenkzeit und praktische menschliche Spielbarkeit getrennt betrachten.
6. **Varianten ausprobieren:** Bestehenden Variantenbaum verwenden;
   Originalpartie unverändert erhalten. Alternative Folgen mit eigenem
   Plan und Gegenplan diskutieren. Stellungsbezogene Notizen, Aussagen,
   Zweifel und Lernfragen in Sitzungsexport/-import speichern.
7. **Abschluss:** Individuelle, auf konkreten Entscheidungen beruhende
   Lernzusammenfassung mit belegten Mustern und Unsicherheit; auch
   gelungene Entscheidungen besprechen. Keine pauschalen Persönlichkeits-
   oder Elo-Diagnosen. Nächste Übungen gezielt auf beobachtete Muster
   ausrichten.

### Erster verbindlicher Testfall

Lichess-PGN vom 06.11.2026, Partie
https://lichess.org/game/1Vh80QL2, Spieler **wibem mit Schwarz**,
Ergebnis 1/2-1/2, 10+0, 69 Züge. Die vollständige PGN wird beim Import
aus der Nutzereingabe übernommen, nicht aus Engine-Kommentaren rekonstruiert.
Wichtige Reflexionsstellen: 7...Sxe5, 17...Le6, 21...Txb7,
28...Sxg3, 31...Sxh4, Übergang zu weißen Freibauern, 45...Kd6,
47...Sxg7 und 68...Sg3+. Fragen sollen ermitteln, ob es sich
beispielsweise um spontane Schlagzüge, übersehene gegnerische Antworten,
fehlende strategische Neubewertung oder unbekannte Endspielkonzepte handelte.
Das sind **Prüfhypothesen, keine zugeschriebenen Motive**.

Die Uhrzeiten der PGN werden den Zügen korrekt zugeordnet; die
verbrauchte Zeit wird aus den aufeinanderfolgenden Zeitständen derselben
Spielerseite ermittelt. Drei- und fünffache Stellungswiederholung müssen
aus der vollständigen historischen Stellung einschließlich Zugrecht und
Sonderrechten korrekt erkannt werden. Keine irreführende Endspielanalyse
aus isolierter FEN ohne Historie.

### Abnahmekriterien und Umsetzungsschnitt

- Import einer realen PGN mit Schwarz unten, korrekter Zugnavigation,
  Spielerseite, Zugzeiten und drehbarem Brett auf Desktop/Tablet;
  bestehende Partie- und Variantenfunktionen bleiben intakt.
- Ohne explizite Freigabe keine Fehlerzeichen, Evaluationsbalken,
  Bestzüge oder künftigen tatsächlichen Züge im geführten Dialog.
- Nach eigener Erklärung schrittweise Auflösung, echter Partierückblick,
  Variantenabzweig und Wiederaufnahme ohne Verlust von Notizen.
- Konkrete Tests für PGN-Fehler, Uhrzuordnung, schwarze Brettorientierung,
  drei Wiederholungen, sichere Sitzungsserialisierung sowie fehlende
  ungefragte Provider-/Stockfish-Aufrufe.
- Reale KI-Qualität erst nach gezielter Praxisprüfung behaupten;
  automatische Tests und Simulationen allein reichen nicht.
- Keine gleichzeitige ungeordnete Codebearbeitung mit Codex; dieser
  Plan ist die Übergabe, Implementierung erst nach Abstimmung mit dem
  laufenden Arbeitsschritt. Keine eigenmächtige Freigabe oder Versionierung.
