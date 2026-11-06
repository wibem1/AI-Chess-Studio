# Projektstand

Stand: 6. November 2026 · ausgelieferte Basis **0.2.0**, Pages-Korrektur **0.3.2**

Veröffentlichungsauftrag: öffentliche Web-App über kostenloses GitHub Pages,
**im bestehenden Repository AI-Chess-Studio**, kein neues Repository. Version
0.3.2 für /AI-Chess-Studio/ und Distributionsbranch gh-pages geprüft.
Nutzer hat das bestehende Repository auf Public gestellt und bestätigt;
öffentlicher HTTP-Abruf 200. Diese Freigabe nicht erneut anfordern. GitHub-Verwaltungs-API liefert Forbidden, Git-
Zugriff funktioniert. Kein neues Repository. Web-Dateien auf gh-pages übertragen; Pages-Aktivierung
und Live-Erreichbarkeit noch nicht bestätigt.
Konkrete Schritte und Updatebefehl: docs/WEB_PUBLISHING.md.

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

Dieser frühere Integrationsschritt lieferte zunächst nur den Spielengine-Adapter.
Die danach integrierte eigenständige Web-App folgt unten. Native Safari-/
Android-/iPad-Abnahme bleibt offen.

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

Typprüfung/Build, **94 Einzeltests und 52 Chromium-Browsertests** bestanden.
Echte lokale Stockfish-Prozesse/Worker, Offline-Reload und wartender Service-
Worker mit bestätigter Updateübernahme. Providerzugriff nur Fixtures; kein
kostenpflichtiger Aufruf. Details und Prüfgrenzen: docs/VALIDATION.md.

Zentrale Regeln und origin/work vor Sicherung abgeglichen. Keine parallelen
Agenten, neue Abhängigkeiten, Releases, Deployments, Actions oder Sichtbarkeits-
änderungen beim Integrationsabschluss. Danach ausdrücklicher Auftrag zur Web-
Veröffentlichung: Version 0.3.0 als geprüftes Web-Paket vorbereitet, Hosting offen.
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
Teilstufe als fertige native App ausgeben. Der Veröffentlichungsauftrag liegt
nun vor; als nächsten Schritt den tatsächlich verbundenen Hostingzugang nutzen
und die öffentliche HTTPS-Adresse samt Live-Prüfung nachtragen.

## Pages-Anpassung 0.3.1 im vorhandenen Repository

Unterordnerfähig: Worker, Web-Adapter, Manifest, Icons, Lizenzen und scoped
Offline-Cache. Cache-Aufräumen auf eigenes Basisverzeichnis begrenzt. Root-
Desktop-/Web-Build bleibt erhalten. HTML-CSP ergänzt, da Pages keine _headers
verarbeitet. Kein eigener Actions-Workflow, kein bezahlter Aufruf, keine Änderung
der Repository-Sichtbarkeit. Echte Unterordner-/Offline-/WASM-Prüfung bestanden.
Manueller Publisher überträgt ausschließlich öffentliche Builddateien und schützt
fremde Zielinhalte; lokal mit echten Git-Repositories geprüft. Nutzer hat Public selbst gesetzt; Pages-Aktivierung bleibt bei blockierter
Verwaltungs-API über die GitHub-Einstellungen vorzunehmen. Kein neues Repository.

## Übertragung des Web-Stands

- Geprüfter App-/Codecommit auf work: 6f747c2, Version 0.3.1.
- Tatsächlich übertragener gh-pages-Commit: 82d92273eb8a6abc40555a7ca126fc3b41db05c7.
  Native Git-Übertragung im bestehenden Repository erfolgreich; Codebranch erhalten.
- Öffentlicher Repository-Abruf nach Nutzerfreigabe HTTP 200.
- Pages-Verwaltungs-API weiterhin Forbidden. Einmalige Benutzereinstellung:
  Settings → Pages → Deploy from a branch → gh-pages → / (root) → Save.
- Live-Prüfversuch der erwarteten Adresse scheitert bereits am Netzwerkproxy
  mit CONNECT 403 / HTTP 000. Kein HTTP-404-/Fehlernachweis über die Website
  selbst und keine erfolgreiche Live-Abnahme behauptet.
- Nächster Schritt: Nutzer speichert die Pages-Quelle; angezeigte GitHub-Adresse
  und tatsächlichen Onlinegang bestätigen. Nicht erneut Public anfordern.

## Pages-Einstellung durch Nutzer gespeichert

Nutzer bestätigt die Auswahl gh-pages / (root) und Save. BUILD.json auf dem
öffentlichen gh-pages-Branch ist abrufbar (HTTP 200), Version 0.3.1, Basis
/AI-Chess-Studio/, Quellcommit 6f747c2. Erwartete App-Adresse:
https://wibem1.github.io/AI-Chess-Studio/ . Erneute Live-/Buildstatusprüfung
nach Nutzeraktion weiterhin durch Netzwerkproxy blockiert (CONNECT 403,
HTTP 000); kein Fehlernachweis der Website selbst. Nutzer kann die Adresse
jetzt öffnen; erfolgreiche Live-Nutzung bleibt bis zur Bestätigung offen.
Nicht erneut dieselbe Pages-Einstellung anfordern.

## Brettkorrektur 0.3.2

Nutzer meldet auf Screenshot der installierten Windows-Web-App 0.3.1 fehlende
rechte Brettspalte. Reproduziert in echtem Chromium: intrinsische Mindestbreite
der Unicode-Figuren verbreitert 1fr-Tracks, overflow:hidden schneidet g/h-Felder
ab. Die 64 Felder waren im Zustand/DOM vorhanden; bisherige Zähltests reichten
für die visuelle Vollständigkeit nicht aus.

Korrektur nur in Darstellung: minmax(0,1fr) für acht Spalten und Reihen,
explizite Zellgrößen ohne automatische Mindestbreite und Figurenmaß relativ
zum eigenen Brett (Container-Einheiten). Haupt- und A/B-Bretter gleich behandelt.
Zwei neue geometrische Browserfälle schlagen vorher fehl und bestehen danach.
Acht Viewports von 390x844 bis 1920x1080, 100/150/200 Prozent CSS-Zoom,
beide Orientierungen, größere Grundschrift und h2-h4 als echter Randzug.
64 vollständige quadratische Felder und passende Figurenrechtecke geprüft.
CSS-Zoom-Nachbildung ist keine native Windows-/Safari-Abnahme. Kompaktes Brett
bei 1280x600 zusätzlich visuell geprüft. npm run test:all: 94/52 bestanden.

Bestehende Partie, Varianten, Dialog, Schlüsselfach und Speicherkennungen werden
nicht geändert. Veröffentlichung über denselben bestehenden gh-pages-Branch;
keine neue Ablage oder erneute Public-/Pages-Einrichtung erforderlich.

Korrektur tatsächlich übertragen: work 97cb9ec, gh-pages
73dfea1fccfe557bd4bb42a207c71f66d3b6e59d. Öffentliches commitgebundenes
BUILD.json mit 0.3.2, /AI-Chess-Studio/ und Quellcommit 97cb9ec abgerufen.
GitHub-Pages-Bereitstellung kann nachlaufen; eigener Live-Host weiterhin
netzwerkbedingt nicht prüfbar. Aktualisierung über die bestehende Web-App-
Updatefunktion, keine erneute Einrichtung oder Datenlöschung.
