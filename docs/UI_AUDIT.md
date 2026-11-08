# Bedien- und Funktionsprüfung nach 1.0.1

Stand: 8. November 2026. Grundlage: aktuelle `work`-Quellen und Nutzer-Screenshot. **Keine vollständige native Geräteabnahme.**

## Maßstab
Zwei klare Wege: (1) Partie gegen Stockfish/Maia spielen; (2) die sichtbare Stellung und den wirklichen Partieverlauf im freien KI-Chat verstehen und Varianten auf dem Brett ausprobieren. Kein separates, zwingendes Formularsystem. Gespeicherte Daten dürfen nicht verloren gehen.

| Bereich | Entscheidung | Begründung / Umsetzung |
| --- | --- | --- |
| Brett, Drehen, zurück/vor, Schlüsselmomente | Behalten und zusammenhalten | Unmittelbar spiel- und lernrelevant; keine Scrollsprünge |
| KI-Chat, Gespräch, Diagnose | Behalten | Zentrale Lernfunktion und Fehlersuche |
| Spielengine Stockfish/Maia, Start/Stop | Behalten | Eigener Spielmodus und kontrolliertes Testspiel |
| Varianten anlegen | Behalten, vereinfachen | Auf einer früheren Stellung einen alternativen Zug am Brett spielen; Original bleibt erhalten |
| Varianten auswählen | Vereinfachen | Keine vollständige Schaltflächenliste jeder Halbzug-Stellung. Nur Endpunkte und benannte Zwischenstellungen anbieten |
| Varianten vergleichen | Vereinfachen, im echten Gerät nachprüfen | Nur sinnvolle Variantenziele, nicht jeden Halbzug. Zwei Brettansichten bleiben optional |
| Partien speichern/laden, PGN, Sicherung | Behalten | Wichtig für dauerhaften Lernverlauf und Kompatibilität |
| Eigenständiger taktischer Faktencheck | Aus normaler Oberfläche nehmen | Schachengine als Spielgegner und explizites KI-Werkzeug genügen für Hauptablauf. Bestehende Faktencheck-Daten bleiben lesbar, technischer Adapter bleibt vorerst erhalten |
| Zug per Text / SAN | Aus normaler Oberfläche nehmen | Brettbedienung ist der Standard; eventuelle Spezialtests/Importe behalten interne Regeln |
| Liste sämtlicher legaler Züge | Aus normaler Oberfläche nehmen | Überfüllt die Oberfläche; Zugvalidierung bleibt im Schachkern |
| Bauernumwandlung | Als Ausnahme behalten | Unterverwandlung in Turm/Läufer/Springer muss möglich bleiben |
| Demo-/Simulationsmodus | Nicht als gewöhnliche Produktoption | Keine simulierte KI als reale Analyse ausgeben. Alte Simulationskennzeichen in gespeicherten Chats nur historisch anzeigen |
| Geführter Alt-Partierückblick / PGN-Zweitimport | Später zusammenführen | Doppelte Importoberfläche; nicht löschen, bis die Speicher- und Rückblickskompatibilität getestet ist |
| Technische Engine-Parameter, Modell, API, Offline | Einstellungen | Nicht im Hauptfluss; explizite Diagnose und Zugang weiterhin erreichbar |
| Alte Formulare, redundante Schalter | Entfernen | Keine konkurrierenden Bedienwege neben freiem Chat |

## Aktueller Entwicklungsstand (noch nicht veröffentlicht)

Die normale Oberfläche versteckt Textzug-, Legale-Züge- und Faktencheck-Bedienung; die zugehörigen technischen Verarbeitungspfade bleiben vorerst bestehen, um Spielregeln, alte Dateien und gespeicherte Faktenchecks nicht zu beschädigen. Die bisher ausufernde Variantenliste ist auf Variantenspitzen und ausdrücklich benannte Stellungen reduziert. Die Vergleichauswahl ist entsprechend verkleinert; die aktuelle Partie und gespeicherte Zweige bleiben im Sitzungsmodell erhalten.

## Offene Qualitätsfragen

1. Variantenablauf auf langem PGN und selbst gespielter Partie mit echtem Touch testen: Abzweig anlegen, benennen, wechseln, vergleichen, speichern und nach Neuladen zurückkehren. Hauptpartie darf dabei nicht wechseln.
2. Doppelte PGN-Import- und Rückblickwege nach vollständigem Kompatibilitätstest zusammenführen.
3. Anzeige aller gespeicherten Varianten verständlich machen, auch wenn mehr als zwei konkurrierende Zweige vorkommen; nicht nur die aktuelle Stelle, sondern der Variantenanfang muss sichtbar werden.
4. Historische Browser-Tests mit entfernten UI-Formularen aktualisieren, statt diese als bestanden auszugeben.
5. Echte KI-Ausgabe einschließlich Board-Werkzeugen bleibt fachlich separat zu prüfen; Fixtures beweisen keine Schachkompetenz.

Keine neue Version oder Online-Veröffentlichung ohne erfolgreiche Prüfung. Der zuletzt bestätigte Live-Stand ist 1.0.1.
