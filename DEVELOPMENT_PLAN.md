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

## Noch erforderliche Abnahme

Ein realer, begrenzter KI-Dialog zum eigenen Plan und einem ausgewählten
Variantenvergleich mit nutzerseitig lokal hinterlegtem Schlüssel. Anschließend
gezielter manueller Windows-Lerndurchlauf. Simulationen und Linux-Tests ersetzen
weder diese reale KI-Prüfung noch die native Windows-Abnahme.
