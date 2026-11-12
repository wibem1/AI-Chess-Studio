# Gesamte Partie mit Stockfish prüfen

**Stand:** 12. November 2026 – Entwicklungsbranch, nicht veröffentlicht.

## Bedienung
Im Lernmodus unter dem Brett `Gesamte Partie mit Stockfish prüfen` aufklappen und ausdrücklich `Partie prüfen` drücken. Es wird die tatsächlich gespielte Hauptpartie (bei einer laufenden Spielpartie bis zum aktuellen Spielcursor, bei importierten Partien der vollständige Originalverlauf) untersucht. Der sichtbare Lerncursor oder angelegte Varianten werden nicht verändert. Der Auftrag kann abgebrochen werden; unvollständige Auswertungen erscheinen nicht als abgeschlossen.

Angezeigt werden für beide Seiten die Anzahl geprüfter Züge, der durchschnittliche angenäherte Centipawn-Bewertungsverlust sowie die Zahl der Ungenauigkeiten, Fehler und groben Fehler. Maximal 16 auffällige Entscheidungen sind direkt anspringbar (Stellung *vor* dem fraglichen Zug). Beim Speichern der Partie als Sitzungs-JSON und im Browser-Autosave bleiben die Befunde erhalten; sie werden beim Import gegen die ursprüngliche Zugfolge geprüft. Ein neue Partie erhält nicht automatisch den alten Bericht.

`KI zur Spielqualität befragen` bereitet nur eine Frage vor, es startet noch **keine** kostenpflichtige KI-Anfrage. Der Lernchat erhält bei passenden Fragen eine **begrenzte faktische Zusammenfassung** des gespeicherten Stockfish-Berichts; unabhängig davon, ob die letzte Stellung Schachmatt ist. Ohne vollständigen Bericht darf die KI keine angeblich objektive Fehlerstatistik erfinden. Ein abgeschlossener Spielstand hindert weder die Partiebewertung noch die KI-Frage.

## Technische Grenzen
- Die lokale Stockfish-Suche ist pro Stellung begrenzt auf maximal Tiefe 12, 20.000 Knoten oder eine Sekunde. Die Partie wird seriell abgearbeitet (bei 145 Halbzügen bis zu 146 Stellungsprüfungen). Nur ausdrücklich angeforderte Scans rechnen in dieser Größenordnung; kein regelmäßiger Hintergrundlauf.
- Die Differenz zweier *stellungsbasierter* Bewertungen aus Sicht des ziehenden Spielers dient als grober Centipawn-Verlust; negative Differenzen werden auf null gesetzt. Die Anzeige verwendet 50 / 120 / 250 cp als transparente, eigene Schwellen für Ungenauigkeit / Fehler / groben Fehler. Mattbewertungen werden für diese Heuristik auf ±1500 cp abgebildet, Remis auf 0. Das Verfahren ist nicht mit der Lichess-Genauigkeit oder der dortigen Fehlerklassifikation identisch und kann bei geringer Suchtiefe falsch liegen.
- Keine Messung einer menschlichen Elo oder einer empirisch kalibrierten Zuggenauigkeit; keine Aussage, dass ein Modell „menschlich“ spielt. Bei langen Partien kann die Rechnung mehrere Minuten dauern. Die UI ist bewusst auf höchstens 300 Halbzüge begrenzt.
- Kein Stockfish-Fallback in Maia-Partien: Maia bleibt der Spielgegner. Für die nachträgliche Partieanalyse wird der unabhängig gestartete, lokal laufende Stockfish benutzt. Modellzug und Stockfish-Befund dürfen nicht verwechselt werden.
- Die Ergebnisse werden an die KI nur bei einer **ausdrücklichen** Frage zum gesamten Spiel gesendet. Sie dienen als taktisch begrenzte Faktenbasis, nicht als strategische Wahrheit.
- Browser-/automatisierte Tests belegen Funktion und korrekte Datenübergabe; eine weitergehende schachliche Kalibrierung und Praxisabnahme sind getrennt offen.
