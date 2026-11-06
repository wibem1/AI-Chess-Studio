# Projektstand

Stand: 6. November 2026 · ausgelieferte Basis **0.2.0**

Branch work: zusätzlich integrierter, noch nicht freigegebener Entwicklungsstand
„Partie verstehen“ und eigenständige Web-App mit Browser-Spielengine. Gemäß neuer Anforderung keine neue
App-Versionsnummer und kein Downloadpaket für diese Integrationsschritte.

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

## Abgeschlossener voriger Schritt: Tab-Oberfläche 0.2.0

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

## Integriert: Partie verstehen gemäß Commit 2744e63e

Plancommit nach dem abgeschlossenen Oberflächenumbau per Fast-forward übernommen.
Zentrale Regeln erneut vom aktuellen main gelesen. Kein paralleler Agent.

- PGN-Hauptvariante aus Text/Datei mit Spielernamen/Farbe, Resultat, Zeitkontrolle
  und Originalkommentaren; Validierung mit chess.js, atomarer Wechsel mit
  Zustimmung zum Ersetzen vorhandener Sitzung, keine automatische Enginepartie.
- Eigene Perspektive, Schwarz unten, frei drehbar in allen drei Brettbereichen
  einschließlich A/B-Brettern und JSON-Wiederherstellung.
- Geführte eigene Entscheidungen: Originalzug zunächst verborgen, eine Frage
  nach der anderen, „Weiß ich nicht mehr“ zulässig. Eigene Antwort oder explizites
  Aufdecken öffnet den aktuellen Zug; keine kommenden Originalzüge im UI-/KI-
  Kontext. Kommentare nur nach Freigabe aufklappbar. KI/Faktencheck vorher gesperrt.
- Eigene Varianten im bestehenden Baum, Original unverändert; auch nachgespielte
  künftige SANs werden als unabhängige Analysezweige behandelt. Antworten,
  Notizen, Auflösungsstand, Orientierung und Varianten im Sitzungsformat 2.
  Normale alte Sitzungen bleiben Format 1; alte Apps lehnen Format 2 klar ab.
- Zugzeit aus benachbarten eigenen Uhrständen mit Basis/Inkrement, keine erfundene
  Dauer bei Lücken oder komplexer Zeitkontrolle. Ganze PGN bleibt erhalten.
- Historische drei-/fünffache Wiederholung sowie 50-/75-Zug-Regel unterschieden.
  Importierte Aufzeichnung darf nach einem bloßen Remisanspruch weitergehen.
  Bei Wiederholung kein isolierter FEN-Faktencheck; sonst volle verifizierte
  Geschichte bis zum angefragten Knoten auch an Stockfish übergeben.
- Lokale Zusammenfassung eigener Angaben und vorbereitete KI-Lernfrage; keine
  erfundenen Motive, persönlichen Muster oder Elo-/Persönlichkeitsdiagnosen.
  Rückkehr zum geführten Modus invalidiert ausstehende freie Engineantworten.

Verbindlicher realer Test 1Vh80QL2, wibem/Schwarz, 69 Züge: vollständige PGN
fehlt bisher im Repository/Chat und wurde beim Nutzer angefragt. Nicht aus den
aufgezählten Reflexionszügen rekonstruiert. Tests verwenden klar benannte
synthetische PGNs; die reale Partie ist damit nicht abgenommen.

## Integriert: Browser-Spielengine

- Zusätzlicher PlayingEngine-Adapter mit echtem Stockfish-19.0.1-Lite-Single-
  WebAssembly-Worker; bestehender Desktopadapter bleibt Standard und auswählbar.
- Gemeinsame Historien-/Zug-/Endzustandsvalidierung; dieselben fünf Stufen,
  ein Thread, Hash 16 MiB, Tiefe 12, 20.000 Knoten, 200–1000 ms Suche. Worker
  endet nach jedem Zug; acht Sekunden Gesamtfrist und 64 KiB Ausgabelimit.
- Enginewahl im JSON erhalten. Adapterwechsel pausiert bewusst; kein Retry
  oder stiller Fallback. Spielsteuerung bricht laufende Browser-Worker ab.
  Kein Worker durch Tabwechsel oder PGN-Import.
- Unveränderte lokale Engine-Dateien plus GPL-Lizenz/Quellverweis unter exakter
  versionierter Allowlist. Kein CDN oder offenes node_modules. WASM-MIME/CSP
  geprüft, kein allgemeines unsafe-eval/SharedArrayBuffer. Nur öffentliche
  Engine-Dateien HTTP-gecached; keine API-/Schlüssel-/Sitzungsdaten.
- Echte Browserengine auf fünf Stufen bei gesperrten Backend-APIs, Schwarz auf
  Telefon-/iPad-Größen, JSON-Restore, Abbruch/Fortsetzen und WASM-Ausfall geprüft.
  Separater statischer Python-Host ohne Node-App: echter Gegenzug bei fehlender
  /api/status und keine /api/play-Anfrage.

Das ist der Spielengine-Adapter, noch keine komplette mobile PWA. KI, Schlüssel,
zusätzlicher Faktencheck und Updates brauchen weiter den bisherigen Backendweg.
Native Safari-/Android-/iPad-Abnahme offen.

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

## Integriert: eigenständige Web-App und Offlineweg

- Ohne Node-Backend bzw. bewusst über den Web-Link: browserlokaler Enginegegner
  und zusätzlicher taktischer Faktencheck, direkter begrenzter OpenAI-Transport.
  Bestehender Desktopbetrieb bleibt als separater Adapter verfügbar.
- Nutzerentscheidung „Key wird lokal gespeichert“ für den Webbetrieb umgesetzt:
  ausschließlich AES-GCM-verschlüsseltes Schlüsselfach in IndexedDB, eigenes
  Gerätepasswort nicht gespeichert; Klartext nur im entsperrten RAM. Kein
  Klartextschlüssel in Browser-Storage/Export/Diagnose/Offline-Cache. Nach Reload
  entsperren statt Key erneut eingeben, sichtbare Speicher- und Fehlerbestätigung.
- Gemeinsame Dialogvalidierung/Systemvorgaben und Kostenlogik mit Desktop.
  Höchstens drei Versuche je Fenster und persistenter Budgetperiode, atomare
  Reservierung auch zwischen Fenstern, konservativer Rest bei unklarer Nutzung.
  Schlüsselwechsel, Reload und Löschen umgehen den Periodenverbrauch nicht.
- Browser-Sitzung samt Varianten, Gedanken, Dialog, PGN-Rückblick und Entwurf
  automatisch lokal gesichert. Wiederherstellung validiert, Partie pausiert;
  JSON bleibt unabhängige Sicherung/Übertragung. Fehlerhafte gespeicherte Daten
  werden nicht automatisch überschrieben. Letzte Sitzung gilt je Browseradresse.
- Installierbarer öffentlicher App-Rahmen: Build erzeugt inhaltsbasierten
  Service-Worker-Cache nur für App-/Engine-Dateien. Kein API-/Provider-/Schlüssel-
  Cache. Echter Offline-Neustart mit PGN und Stockfish nach Vorbereitung geprüft.
- Updates warten auf Zustimmung und erfolgreiche Sitzungssicherung. Kein
  automatisches Neuladen. Desktop-Git-Update nur im Desktopbetrieb angeboten.
  Diagnose und Schlüsselfach/Entsperren brauchen keine Textgenerierung.
- Natives Wischen nach Web-Schlüsselspeicherung bei Windows-/Telefon-/Tablet-
  Größen, Mausrad und fehlende Textmarkierung automatisiert geprüft. Das ersetzt
  keine reale Windows-Touch-/Safari-/Android-/iPad-Abnahme.

## Prüfstand

Typprüfung/Build, **93 Einzeltests und 49 Chromium-Browsertests** bestanden.
Echte lokale Stockfish-Prozesse/Worker, Offline-Reload und wartender Service-
Worker mit bestätigter Updateübernahme. Providerzugriff nur Fixtures; kein
kostenpflichtiger Aufruf. Details und Prüfgrenzen: docs/VALIDATION.md.

Zentrale Regeln und origin/work vor Sicherung abgeglichen. Keine parallelen
Agenten, neue Abhängigkeiten, Releases, Deployments, Actions oder Sichtbarkeits-
änderungen. Version bleibt gemäß Integrationsplan 0.2.0; kein neues Downloadpaket.
Die vorhandene Cloud-Konfiguration reicht zum Entwickeln/Testen; keine Secrets
oder neuen Netzfreigaben nötig, kein Umgebungsentwurf geändert/veröffentlicht.

## Offene Abnahme und Grenzen

- Vollständige Nutzer-PGN 1Vh80QL2 fehlt weiterhin. Synthetische PGNs sind klar
  benannt und ersetzen diese reale Abnahme nicht. Keine Motive/Züge erfunden.
- Echter pädagogischer KI-Dialog sowie Provider-CORS/Kontozugriff nicht mit
  realem Schlüssel geprüft. Tests belegen Vertrag/Bedienung, keine Lernqualität.
- Native Windows-Touch/DPAPI, macOS/Safari, Android/iPadOS und jeweilige
  Installation bleiben offen. Browserpasswort-Speicher ist kein nativer Keychain.
- Webspeicher ist an Browseradresse/Port/Profil gebunden; Browserdatenlöschung
  entfernt ihn. Mehrere Fenster teilen die letzte Sitzung, keine Cloud-Synchronisation.
  Preisannahmen sind kein hartes Anbieter-Geldlimit; Web-/Desktopprofile getrennt.
- Bestehender Node-Server weiterhin ausschließlich Loopback. Für einen öffentlich
  erreichbaren Start auf Mobilgeräten wäre eine gesondert beauftragte HTTPS-
  Bereitstellung nötig; diese wurde nicht ausgeführt.

## Nächste Abnahme

Reale Nutzer-PGN und gezielte Geräte-/KI-Praxisabnahme des jetzt integrierten
Webstands. Fehlende Nachweise offen benennen; keine weitere Entwicklungs-
Teilstufe als fertige native App ausgeben. Keine neue Version/Downloadfreigabe
oder Veröffentlichung ohne den vereinbarten Auftrag.
