# AI-Chess-Studio

Lokales, deutschsprachiges Schachlabor mit Variantenbaum, strategischem
Gedächtnis, Dialog und optionalem Stockfish-Faktencheck.

## Start auf deinem PC

Im lokalen **Windows-Startpaket ist Node.js 24 bereits enthalten**.
ZIP vollständig entpacken und im Projektordner unter Windows
**AI-Chess-Studio-starten.cmd** doppelklicken. Ein reiner Git-Quellcheckout
benötigt dagegen eine vorhandene Node.js-24-Installation. Das Skript installiert bei Bedarf
Abhängigkeiten, baut die App und öffnet nach dem Start den Browser. Das
Serverfenster während der Nutzung geöffnet lassen. Der Windows-Startweg und
DPAPI sind implementiert, aber in dieser Linux-Umgebung nicht nativ geprüft.

Alternativ im Projektordner:

```bash
npm ci
npm run build
npm start
```

Die App läuft nur lokal, standardmäßig auf Port 5173 (`CHESS_PORT` ist optional).
Der reine statische Web-Build hat keine Modell-/Engine-API; npm start stellt
beides bereit. Quellcodeentwicklung ist mit npm run dev möglich.

Eine kurze Schrittfolge liegt auch in **ERSTE_SCHRITTE.txt**. Das Windows-Paket
ist kein veröffentlichtes Release; native Windows-Abnahme steht weiterhin aus.

## Eigenen API-Schlüssel direkt eingeben

1. In der App „Eigenen API-Schlüssel eingeben“ öffnen.
2. Schlüssel und Modell eingeben (vorbelegt: gpt-4.1-mini).
3. Preisannahmen/Budget in „Kostenkontrolle“ prüfen.
4. Kostenpflichtige Anfragen bewusst erlauben und „Schlüssel lokal speichern
   und KI aktivieren“ anklicken. Dies erzeugt noch keine Modellantwort.
5. Unter „Diagnose und Updates“ kann der Zugang ohne Textgenerierung geprüft
   werden. Anschließend eine Planfrage im realen Modus stellen.

**Dauerhafte lokale Speicherung:** Die Datei liegt im Benutzerprofil des
Rechners, auf dem der App-Server läuft: unter Windows
`%USERPROFILE%\.ai-chess-studio\credentials.json`, unter Linux/macOS
`~/.ai-chess-studio/credentials.json`. Windows nutzt benutzergebundene DPAPI-
Verschlüsselung über PowerShell; POSIX nutzt private Datei-/Verzeichnisrechte
(0600/0700), dort keine Verschlüsselung. Die Eingabe wird im Browser sofort
geleert, nicht in localStorage/sessionStorage oder Sitzungsexport übernommen.
„Gespeicherten Schlüssel löschen“ entfernt die Datei und sperrt den Zugang.

Für Speicherung **auf deinem PC** muss die App dort laufen. Bei Cloudbetrieb
liegt diese Datei auf dem Cloud-Rechner. Cloud-Secrets sind für den lokalen
PC-Betrieb nicht mehr erforderlich. Bestehende serverseitige CHESS_*-Variablen
werden aus Kompatibilitätsgründen weiterhin unterstützt.

## Kostenkontrolle

Voreinstellung: **0,05 USD pro Budgetperiode**, höchstens drei Modellanfragen
pro Periode und zusätzlich pro Serverstart, je maximal 800 Ausgabe-Tokens.
Verbrauch und Preisannahmen werden lokal in `credentials.json.usage.json`
gespeichert und über Neustarts weitergeführt. Eine neue Periode erfordert eine
explizite Bestätigung; sie hebt das zusätzliche Prozesslimit nicht auf.

Die Eingabe-/Ausgabepreise sind editierbare **Preisannahmen**, keine aktuelle
Anbieterpreisauskunft. Vor einem anderen Modell die Preise anpassen. Vor jeder
Anfrage wird eine vorsichtige Reservierung berechnet; reicht das Budget nicht,
wird kein Provideraufruf gestartet. Bestätigte Token-Nutzung korrigiert die
Schätzung. Bei Fehlern/fehlenden Nutzungsdaten bleibt die Reservierung bestehen.
Keine automatischen Wiederholungen. Preise/Schätzungen sind **kein verbindliches
Geldlimit der Anbieterrechnung**; ein separates Anbieterlimit ist weiterhin sinnvoll.
Nur eine App-Instanz mit demselben Benutzerprofil verwenden.

## Diagnose

„Lokale Diagnose anzeigen“ meldet Laufzeit, Modellkonfiguration, Restanfragen
und Updatestatus ohne Schlüsselwerte oder Sitzungstexte. „OpenAI-Zugang prüfen“
ruft nur Modellmetadaten ab, keine Textgenerierung; Statusmeldungen unterscheiden
fehlende Konfiguration, abgelehnten Schlüssel, fehlendes Modell und
Verbindungsprobleme. Konfiguriert heißt noch nicht real erfolgreich geprüft.

Die App nutzt OpenAI Chat Completions über einen festen HTTPS-Endpunkt.
Unter einer verwalteten Cloud gelten weiterhin deren Netzwerkfreigaben.
Bei geerbtem Proxy Node mit `NODE_USE_ENV_PROXY=1` starten; der Windows-Starter
setzt dies. Die App umgeht keine Netzwerkbeschränkungen.

## Updates

„Nach Updates suchen“ prüft den Entwicklungsbranch **work** von
wibem1/AI-Chess-Studio. Git muss installiert und der Repositoryzugriff vorhanden
sein. Nach Anzeige des Zielcommits und ausdrücklicher Zustimmung kann die App
fetch, reines Fast-forward, npm ci und Build/Unit-Prüfungen ausführen. Eigene
ungesicherte Codeänderungen, abweichende Quelle oder ein verändertes Ziel
blockieren die Installation. Kein Force/Reset, kein automatisches Deployment.

Nach erfolgreichem Update die App beenden und neu starten. Bei einem Fehler
bleibt die Installation als unvollständig markiert; es gibt keinen behaupteten
atomaren Rollback. Die vorherigen Commits bleiben in Git erhalten. Während
des Updates keine zweite Installation starten und keinen Quellcode bearbeiten.

## Schach, Dialog und Sitzungen

- Brettklicks oder SAN-Züge (e4, Nf3, O-O); Sonderzüge und legale Züge mit chess.js.
- Frühere Variantenknoten wählen und andere Züge spielen, um abzuzweigen.
- Simulation ist klar markiert und nutzt deterministische Beispieldaten.
  Sie belegt keine strategische Analysequalität eines Modells.
- Dialog, eigene Hypothesen und offene Fragen bleiben an ihrer Stellung;
  verspätete Antworten werden nach Sitzungsersatz verworfen.
- Stockfish 19 Lite WASM startet ausschließlich nach Klick. Optional einen
  eigenen SAN-Kandidaten prüfen: keine automatische Bewertungsleiste oder
  Zugvorgabe. Bedingungen: ein Thread, 16 MiB Hash, Tiefe 12 / 20.000 Knoten /
  1 s Suchzeit, 8 s Prozess-Timeout. Aktuelle FEN ohne Wiederholungshistorie
  oder Tablebases. Angezeigte Varianten sind regelgeprüft; Werte gelten unter
  diesen Suchbedingungen und sind keine absolute strategische Wahrheit.
- Sitzungsdaten liegen bis zum JSON-Export nur im Arbeitsspeicher. Vor Neuladen
  exportieren; Datei-/Textimport validiert Varianten und erhält Gedächtnis und
  Suchbefunde. API-Schlüssel und Kostenkonto gehören nicht zum Export.

## Nachweise und Grenzen

`npm run test:all`: Typprüfung, Build, **47 Einzeltests und 12 Chromium-
Browsertests**. Der gebaute Anwendungsserver wird getestet, einschließlich
echtem lokalem Stockfish. Schlüsseltests verwenden ausschließlich bedeutungslose
Testwerte, Provider-/Update-Tests lokale Fixtures. Es wurde kein echtes Update
auf diesen Arbeitsstand und keine kostenpflichtige Textgenerierung ausgeführt.
Ein realer Modelltest und manuelle Nutzerabnahme stehen aus.

[Projektstand](PROJECT_STATE.md) · [Prüfergebnisse](docs/VALIDATION.md) ·
[Engine-Lizenz und Quellen](THIRD_PARTY_NOTICES.md)


## Lokales Startpaket reproduzieren

`tools/package_windows.py` erstellt aus einem sauberen, gesicherten Git-Stand
ein privates ZIP mit frischen Git-Metadaten und offizieller portabler
Windows-Node-Laufzeit. Das Tool verlangt Archiv und offizielle SHA-256-Liste,
verifiziert vor dem Entpacken und kopiert keine Profile, Schlüssel oder
installierten Abhängigkeiten. Erststart installiert per npm ci mit Lockfile.
Beispielparameter: --node-archive, --node-checksums und --output.
Node-Lizenztexte bleiben im unveränderten Laufzeitpaket enthalten.
