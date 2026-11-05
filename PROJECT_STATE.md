# Projektstand

Stand: 5. November 2026

## Verbindliches Ziel

Persönliches Schach-Lernprogramm: gegen eine Engine spielen und während/nach
der Partie mit einer getrennten KI über Stellung, Strategien und Varianten
lernen. Varianten ausprobieren, benennen, speichern und vergleichen, ohne die
Partie zu verändern. Siehe DEVELOPMENT_PLAN.md; bisherige Reduktion auf
Analysebrett/Faktencheck war ein Missverständnis und ist korrigiert.

## Neu implementiert und geprüft

- Stockfish 19 Lite WASM als realer automatischer Spielgegner. Farbe und fünf
  Skill-Stufen wählen; keine Elo-Zusage. Vollständige Zughistorie für Regeln
  und Wiederholung, keine Bewertungs-/Suchinfos aus Spielzügen im Dialog.
- Partiekursor getrennt vom Analysebrett: pausieren, frühere Stellung wählen,
  Varianten spielen, anschließend exakt zur tatsächlichen Partie zurückkehren.
  Der Einstieg in die Planfrage pausiert die Partie ebenfalls.
- Enginefehler pausieren ohne Auto-Retry. Späte Antworten nach Pause/Resume,
  anderer Partie oder Sitzungsersatz werden nicht angewendet.
- Varianten benennen und A/B vergleichen: zwei Stellungen, Zugfolgen,
  gemeinsamer Ausgangspunkt und jeweilige Notizen/Gespräche.
- Partie, Namen und Vergleich im validierten Schema-1-JSON erhalten. Alte
  Sitzungen weiterhin importierbar. UI-Import pausiert eine Partie, statt
  unaufgefordert die Engine starten zu lassen.
- KI-Kontext berücksichtigt Vorfahren der aktuellen Stellung, die Lernpartie
  und ausdrücklich gewählten Vergleich, bleibt auf sechs Einträge begrenzt.
- Typprüfung, Build, 56 Einzeltests und 15 Chromium-Browsertests bestanden.
  Echte lokale Engine auf allen fünf Stufen sowie Weiß-/Schwarz-Lernablauf im
  Browser geprüft; KI-Antworten weiterhin ausschließlich Testfixtures.
- Vorheriger Stand 6da1a54 bleibt erhalten. Details: docs/VALIDATION.md.

## Weiter vorhandene Funktionen

Lokaler App-Server/Windows-Starter; private persistente Schlüsselablage
(Windows-DPAPI implementiert, unter Linux nicht nativ geprüft), Kostenbudget
als Schätzung, Diagnose, explizite Git-Updates und optionaler zusätzlicher
Stockfish-Faktencheck. Kein Schlüssel in Git, Diagnose oder Sitzungsexport.

## Grenzen und nächste Abnahme

Die echte KI ist noch nicht mit einem realen Schlüssel geprüft. Vorhandene
Freigabe für bis zu drei begrenzte reale Testversuche gilt; nicht erneut
erfragen und keinen Schlüssel im Chat anfordern. Lokaler PC-Eingabeweg ist
bevorzugt, weil Cloud-Bindungen hier nicht angewendet sichtbar waren.

Native Windows-/DPAPI-Prüfung und manueller Lerndurchlauf stehen aus. Sitzungen
werden bewusst als JSON gespeichert, keine automatische lokale Sitzungssicherung.
Skill-Stufen sind keine geeichten Elo-Werte. Budget ist keine verbindliche
Anbieterrechnung. Keine Veröffentlichung, Deployments, Releases, Actions oder
kostenpflichtige Textgenerierung durch den Agenten ausgeführt.

Nächster einzelner Schritt: realen Lern-Dialog zum eigenen Plan und zu einem
A/B-Vergleich prüfen, danach Ergebnisse und Projektstand gemeinsam sichern.
