# Prüfstand Phase 1

Datum: 4. November 2026. Lokale Ausführung mit Node.js 24.22.1,
npm 11.9.0, TypeScript 7.0.2 und chess.js 1.4.0; Abhängigkeiten im Lockfile fixiert.

- `npm ci --no-audit --no-fund`: erfolgreich, eingefrorene Installation.
- `npm run check`: erfolgreich, strikte TypeScript-Prüfung.
- `npm test`: Build erfolgreich; **10 Tests bestanden, 0 fehlgeschlagen,
  0 übersprungen**, mit Ausgabe der zehn einzelnen Testnamen.

Geprüft: legale/illegale Züge und unveränderter Zustand bei Ablehnung; Rochade
und Verbot durch angegriffenes Durchgangsfeld; en passant; verpflichtende
Umwandlungsfigur und Unterverwandlung; getrennte Varianten und Wiederverwendung
identischer Kindzüge; Matt und Patt; dreifache Stellungswiederholung aus der
Variantenhistorie einschließlich Import; feste Stellungszuordnung verspäteter
Dialogdaten; Gedächtnis samt Herkunft, Hypothese und offenen Fragen;
Export/Import-Rundlauf und unabhängige Datenkopien; Ablehnung ungültiger
Annotationen sowie fehlerhafter, manipulierter oder inkonsistenter Sitzungen.

Die Tests verwenden die reale lokale Regelbibliothek. Die als `simulation`
markierten Dialogdaten sind ausschließlich Testdaten. Kein realer KI-Adapter,
kein Stockfish, kein Browserdurchlauf und keine Nutzerabnahme wurden geprüft.
Keine kostenpflichtigen API-Aufrufe, Actions, Veröffentlichungen oder Deployments.

Umgebungsbefund: Im eingeschränkten Runner zeigte `node --test` lediglich die
Datei als einen Test. Dieser Lauf gilt nicht als Funktionsnachweis. Erst der
Lauf mit freigegebenen Prozessrechten meldete die zehn Einzeltests. Ein erster
Build benötigte eine explizite Node-Typen-Auswahl in tsconfig; danach bestanden
Typprüfung und Tests.

## Phase 2 – Oberfläche und simulierter Dialog

Datum: 4. November 2026. Zusätzlich Vite 8.3.5, Playwright 1.64.1 und
System-Chromium 155.0.8059.79 unter Linux.

`npm ci --no-audit --no-fund` und `npm run test:all` erfolgreich:
strikte Typprüfung, TypeScript-/Web-Build, **14 Einzeltests bestanden**,
**5 Browsertests bestanden**, keine fehlgeschlagenen oder übersprungenen Tests.

Die vier zusätzlichen isolierten Tests prüfen Knotenbindung verzögerter
Antworten, Verwerfen nach Sitzungsersatz trotz gleicher Knoten-IDs,
Ablehnung ungültiger Antworten und fehlgeschlagener Anfragen ohne Mutation
sowie Ablehnung formal korrekter Antworten mit illegalen Zugvorschlägen.
Annotationstypen werden auch gegen nicht-stringförmige Herkunft/Art geprüft.

Browsernachweise in echtem Chromium:

1. Brettzug, Ablehnung illegaler Züge, getrennte Varianten, Planfrage,
   Simulationskennzeichnung, Gedächtnis samt offener Frage, tatsächlicher
   JSON-Download (Dateiinhalt gegen Sitzung geprüft), Neuladen und Dateiimport;
   fehlerhafter JSON-Import erhält den bisherigen Stand; keine Seitenfehler.
2. Verzögerte Antwort bleibt an der angefragten Stellung und erscheint nicht
   im neuen Knoten; Sitzungsimport verwirft ausstehende Antworten.
3. Ungültige Antwort und Anfragefehler werden angezeigt, ändern den Dialog
   nicht und erlauben einen erfolgreichen erneuten Versuch.
4. Rochade, en passant und Unterverwandlung durch Brettbedienung.
5. Importierter HTML-Text wird wörtlich angezeigt; mobile Ansicht bei
   390 × 844 ohne horizontalen Überlauf.

Desktop- und Mobilansicht wurden zusätzlich über Chromium-Screenshots
visuell geprüft. Kein manueller Nutzerabnahmetest, keine reale Modell- oder
Stockfish-Integration, keine kostenpflichtigen API-Aufrufe, kein Deployment.
Die simulierten Antworten sind bewusst allgemein und belegen keine
strategische Analysequalität. Daten bleiben bis zum Export im Arbeitsspeicher.

## Phase 3 – Modellanbindung lokal vorbereitet

4. November 2026: `npm run test:all` erfolgreich. Typprüfung und Web-Build
bestanden; **23 Einzeltests und sieben Chromium-Browsertests bestanden**,
keine fehlgeschlagen oder übersprungen. Keine neuen Paketabhängigkeiten.

Zusätzliche Nachweise mit ausschließlich lokalen Fixtures:

- Standard-/Konfigurationssperre erzeugt keinen Provideraufruf.
- Transportvertrag: fester OpenAI-HTTPS-Endpunkt, serverseitiger Authorization-
  Header, keine Weiterleitungen, begrenzte Ausgabe, Abbruchsignal.
- Ungültiger Kontext, FEN und illegale Zuglisten werden vor Transport abgelehnt.
- Drei Versuche je Prozess einschließlich Fehler; Sperre paralleler Anfragen.
- Providerfehler werden bereinigt; illegale Kandidaten, Verweigerungen,
  abgeschnittene und zu große Antworten werden verworfen.
- Modellherkunft und begrenzter Kontext bleiben im Sitzungsmodell erhalten.
- Tatsächlicher lokaler HTTP-Durchlauf prüft Herkunft, Bodylimit und
  Standardsperre; separater erfolgreicher HTTP-Durchlauf mit injiziertem
  Providertransport prüft validierte Antwort und fehlende Secret-Ausgabe.
- Zwei zusätzliche Browsertests prüfen den gesperrten realen Modus und
  die Modell-UI mit lokal ersetztem API-Endpunkt einschließlich Exportherkunft.
- Der erzeugte Browser-Build enthält weder CHESS_API_KEY, den Providerendpunkt
  noch einen Bearer-Header (Suche im erzeugten web-dist ohne Treffer).

Der Browser-Testserver erzwingt CHESS_ENABLE_PAID_API=0. Die HTTP-Fixtures
verwenden einen bedeutungslosen lokalen Testwert und keinen realen Schlüssel.
Es fand **kein Aufruf von OpenAI oder einem anderen Modellanbieter** statt.
15-Sekunden-Timeout und 800 Completion-Tokens sind konfigurierte Grenzen,
keine nachgewiesene Geldkostengarantie. Proxybetrieb und Kompatibilität eines
konkreten realen Modells bleiben ungeprüft. Die Gesamtphase 3 ist damit
noch nicht real integriert abgenommen. Nutzerabnahme von Phase 2 weiterhin offen.

## Phase 4 – realer lokaler Stockfish-Faktencheck

4. November 2026: reproduzierbare Lockfile-Installation mit `npm ci --no-audit
--no-fund`, anschließend `npm run test:all`. Typprüfung und Web-Build bestanden;
**32 Einzeltests und neun Chromium-Browsertests bestanden**, keine Fehler oder
übersprungenen Tests. Stockfish.js 19.0.1, Engine-ID „Stockfish 19 Lite WASM“.

Reale Engineprüfungen (keine Engine-Mocks):

- Weißes Matt in einem mit eigenem Kandidaten Qg7# wird als Mattdistanz +1
  gemeldet; erzeugte Variante ist nach chess.js legal.
- Schwarzes Matt in einem Qg2# wird aus weißer Perspektive korrekt als -1 gemeldet.
- Normale Ausgangsstellung liefert einen Centipawn-Befund und legale Variante.
- Parallele Anfrage wird gesperrt, Engineprozess beendet nach Ergebnis.
- Ein real gestarteter Prozess mit extrem kurzem Test-Timeout wird beendet;
  der Service bleibt nach Timeout erneut verwendbar. Fehlender Enginepfad
  wird als Fehler behandelt, nicht als erfolgreicher Suchbefund.

Isolierte Fehler-/Datenprüfungen: illegale Kandidaten einschließlich
Zeilenumbruch/UCI-Injektion, ungültige FEN und beendete Stellungen abgewiesen;
verspätete Befunde bleiben am Anfrageknoten, nach Sitzungsersatz verworfen;
Export/Import erhält Engine, Kandidat, Wert, Variante und Suchbedingungen;
manipulierte Metadaten, illegale Varianten und falsche Herkunft abgewiesen;
Antwort zu einem anderen Kandidaten wird nicht gespeichert.

Zwei zusätzliche Browserdurchläufe: echtes lokales Stockfish über den
lokalen HTTP-Endpunkt und die UI; null Engineanfragen beim Laden/Spielen,
exakt eine nach Klick; Mattbefund mit sichtbaren Suchgrenzen und Erhalt nach
Export/Import. Separater HTTP-Fehlerfixture verändert die Sitzung nicht und
lässt erneute Prüfung zu. Keine automatische Zugübernahme/Bewertungsleiste.

Suchbedingungen: ein Thread, 16 MiB Hash, Tiefe 12, 20.000 Knoten, 1000 ms
Suchzeit, 8000 ms Prozess-Timeout; tatsächlich erreichte Werte werden gespeichert.
Der zusätzliche Timeout-Test verwendet absichtlich 1 ms. Stockfish untersucht
FEN ohne Wiederholungshistorie/Tablebases; keine Aussage über uneingeschränkte
Suchtiefe oder strategische Wahrheit. Reale Modellanbieter weiterhin nicht
aufgerufen; Nutzerabnahme weiterhin offen. Kein Deployment/Release/Publish.

## Lokaler Anwendungsabschluss

4. November 2026: `npm run test:all` erneut nach Ergänzung des normalen
Anwendungsservers erfolgreich. **33 Einzeltests und neun Chromium-Browsertests**,
keine fehlgeschlagen/übersprungen; Typprüfung und Web-Build erfolgreich.

Der Browserlauf startet jetzt `npm start` und verwendet die gebauten Assets
samt denselben lokalen Modell-/Stockfish-APIs; kein Vite-Entwicklungsserver.
Damit wurden Brett, Varianten, Dialog, Datei-Download/-Import und echter
Stockfish auch im normalen lokalen Betriebsweg geprüft.

Ein zusätzlicher HTTP-Test bestätigt öffentliches HTML/JS mit passenden
Content-Types, CSP und nosniff, Ablehnung von Repository-/Secret-Pfaden,
unerlaubten Methoden und fremden Origins sowie die gesperrte Modell-API.
Der JavaScript-Build enthält keine CHESS_API_KEY-Konfiguration. Der Server
bindet ausschließlich an Loopback. Keine Deployment-/Veröffentlichungsprüfung,
keine reale Modellanfrage und keine manuelle Nutzerabnahme behauptet.

Es wurde keine installierte Ollama-/llama-server-Laufzeit gefunden. Ein
kostenfreies lokales Sprachmodell wurde deshalb nicht als vorhanden oder
integriert ausgewiesen; hierfür wurden keine Modelle nachgeladen.

## Vorbereitung des freigegebenen realen KI-Tests

4. November 2026: Nutzerfreigabe für einen kleinen realen KI-Funktionstest;
Umfang auf höchstens drei Versuche in dieser Aufgabe begrenzt, je 800
Completion-Tokens. Keine Freigabe für unbegrenzte Nutzung und kein Geldlimit
allein durch Token-/Prozessgrenzen.

Konfiguration und tatsächliche Variablennamen geprüft: CHESS_API_KEY,
CHESS_MODEL, CHESS_ENABLE_PAID_API fehlen in der laufenden Umgebung. Keine
bestehenden Secret-/Variablenbindungen vorhanden. Keine Werte ausgegeben.
Gespeicherter Cloud-Entwurf ergänzt gpt-4.1-mini, Aktivierungswert 1 und
CHESS_API_KEY als sichere Anforderung ausschließlich für api.openai.com;
die Domain wurde automatisch zu den gewünschten Netzwerkzielen hinzugefügt.
Startanweisungen berücksichtigen Proxy und bestehenden Testumfang.

Kein echter Modellaufruf erfolgt, da der Schlüsselwert noch fehlt. Keine
Aktivierung/Veröffentlichung des Entwurfs behauptet. Anwendungscode unverändert;
vorheriger Nachweis mit 33 Einzeltests und neun Browsertests bleibt bestehen,
kein unnötiger erneuter Testlauf für reine Dokumentationsänderungen.

## Lokaler Schlüssel, Diagnose, Kosten und Updates

4. November 2026: Nutzer verlangt ausdrücklich direkte App-Eingabe und dauerhafte
lokale Speicherung des Schlüssels sowie Diagnose, Kostenkontrolle und Updates.
Vorherige Cloud-Secret-Bedienung ist nicht mehr der erforderliche lokale Weg.

`npm run test:all`: Typprüfung und Build erfolgreich; **47 Einzeltests und
12 Chromium-Browsertests bestanden**, null Fehler/übersprungene Tests.

Zusätzlich geprüft:

- Lokale Schlüsseldatei über Service-Neustart geladen, POSIX-Rechte 0600/0700,
  explizites Löschen, fehlerhafte Datei fail-closed ohne Inhaltsausgabe.
- Realer lokaler Konfigurationsendpunkt mit Originprüfung, Kosten-Zustimmung,
  leerem Passwortfeld nach Übernahme, ohne Schlüssel in Status oder Export.
  Keine Provideranfrage allein durch Eingabe/Speichern. Browser-Storage geprüft.
- Kostenbudget blockiert vor dem Transport, bestätigt Token-Schätzungen,
  reserviert unklare Fehlversuche, speichert Verbrauch/Preisannahmen über
  Neustart und verlangt Zustimmung zum Perioden-Neustart. Ungültige Preise
  und Budgets werden abgewiesen.
- Diagnose der Modellmetadaten über injizierten Transport: GET statt
  Textgenerierung, keine bezahlte Anfrage verbucht; keine Schlüssel ausgegeben.
- Updateprüfung/Installation mit injizierten Git-/npm-Abläufen: erlaubte Quelle,
  Zielcommit, Dirty-Checkout-Sperre, Fast-forward, Build/Unit-Prüfung,
  Fehlerstatus und kein Force/Reset. Browser prüft Update-Zustimmung und Fehler.
- Browser prüft lokale Diagnose und dauerhafte Budgeteinstellung; weiterhin
  sämtliche Schach-/Sitzungs-/echten Engineabläufe erfolgreich.

Keine echte Modellanfrage, keine echten Git-/npm-Selbstupdates durchgeführt.
Die Windows-DPAPI- und Doppelklickstarter-Pfade sind implementiert, können in
Linux nicht nativ ausgeführt werden und gelten nicht als Windows-abgenommen.
Preisannahmen sind nicht gegen eine aktuelle Anbieterrechnung verifiziert.
Updateinstallation ist nicht atomar; bei Fehlern wird ein unvollständiger Stand
angezeigt und kein angeblicher Rollback oder erfolgreicher Neustart behauptet.

## Abschluss und lokales Windows-Startpaket

5. November 2026: wiederhergestellter Git-Stand f361b1e sauber vorgefunden,
globale/lokale Regeln erneut gelesen, vollständiger Anwendungslauf erneut:
47 Einzeltests und 12 Chromium-Browsertests bestanden, Typprüfung/Build erfolgreich.
Kein kostenpflichtiger Provideraufruf, keine Veröffentlichung/Deployment.

Offizielle portable Windows-Laufzeit node-v24.22.2-win-x64.zip von nodejs.org
abgerufen; SHA-256 gegen offizielle SHASUMS256.txt geprüft:
ca1bff5d8ead13c9f2ea404a176db46bd430704d5b5113734049fa365e7799e2.
Starter berücksichtigt die beiliegende Laufzeit vor einer globalen Installation.
Packager prüft Prüfsumme und Archivpfade, verwendet nur einen sauberen Git-Commit
und erzeugt frische Git-Metadaten mit der genehmigten Projektquelle. Keine
Benutzerprofile/Schlüssel, keine node_modules aus der Cloud und keine
Cloud-Konfiguration werden übernommen. Node-Lizenztexte bleiben enthalten.

Das Paket ist ein privates lokales Startpaket, kein veröffentlichtes Release.
Die Windows-Binärdatei/DPAPI werden hier nicht nativ ausgeführt; Windows-
Nutzerabnahme und echte Modellvalidierung bleiben getrennte offene Nachweise.

Paketkandidat aus Commit 32a4000 tatsächlich erzeugt und entpackt:
ZIP-CRC ohne Fehler; Quell-HEAD entspricht dem Paketmanifest; Git-Status sauber;
Origin exakt https://github.com/wibem1/AI-Chess-Studio.git; Node.exe als
Windows-PE-Datei erkannt und Laufzeit-Lizenztexte vorhanden. Kein Cloud-
Benutzerprofil, keine installierten App-Abhängigkeiten und keine .env übernommen.
Aus dem entpackten Paket npm ci sowie npm run test:all ausgeführt: Typprüfung,
Build, 47 Einzeltests und 12 Browsertests erneut bestanden. Dies ist ein echter
Wiederherstellungs-/Anwendungstest unter Linux, kein nativer Windows-Test.
Der finale Paketstand unterscheidet sich nur in dieser Dokumentation vom
geprüften Kandidaten und wird erneut mit Integritätsmanifest erzeugt.

## Zielkorrektur und erster vollständiger Engine-Lernablauf

5. November 2026: Nutzer präzisiert das eigentliche Ziel: gegen Engine spielen,
parallel/danach mit KI lernen, Varianten ausprobieren/speichern/vergleichen.
AGENTS.md und DEVELOPMENT_PLAN.md entsprechend korrigiert.

`npm run test:all`: Typprüfung und Build bestanden, **56 Einzeltests und
15 Chromium-Browsertests bestanden**, keine fehlgeschlagen/übersprungenen Tests.

Reale Stockfish-Spielengine auf fünf Skill-Stufen geprüft (0/5/10/15/20,
200–1000 ms, Tiefe 12, 20.000 Knoten). Nur legale Spielzüge werden angewendet;
keine Suchbewertung als vermeintlicher strategischer Dialog ausgegeben.
Historie wird bis zur Engine transportiert; Wiederholungspartie und gefälschte
Historie werden abgewiesen. Hauptpartie/Analyse, Weiß/Schwarz, falsche Zugseite,
Pause/Resume-Rennen, Sitzungsersatz, illegale Antworten, Namen/Vergleich und
JSON-Erhalt isoliert geprüft. Ein anfänglicher JSON-Rundlauf deckte abweichende
Feldreihenfolge auf; Export wurde kanonisch geordnet, anschließend kompletter
Lauf bestanden (keine Assertions abgeschwächt).

Neue Browsernachweise: echte Partie als Weiß mit Engineantwort; pausieren,
anderen Eröffnungszug als Variante spielen, benennen, A/B nebeneinander sehen,
Simulationsdialog führen, speichern/wiederherstellen und zum unveränderten
Partiekursor zurückkehren. Als Schwarz spielt die echte Engine zuerst und das
Brett ist passend gedreht. Enginefehler pausieren ohne unkontrollierte Retries.
Keine echte Sprachmodell-Anfrage; native Windows-Abnahme weiterhin offen.

## Humanfaktor als verbindlicher Lernmaßstab

5. November 2026: Nutzer betont menschliches Schachdenken als Grundlage der
Lernanalyse. Modellauftrag und Entwicklungsplan konkretisiert: eigene Ideen
und Begründungen, verständliche Kandidatenfindung, Planfolgeschritte, notwendige
Rechenarbeit/Genauigkeit, leicht übersehbare Antworten, Reaktion auf Abweichungen
und Lernwert. Keine Zuschreibung persönlicher Eigenschaften oder Spielstärke
aus dem Engine-Level; keine ungeprüfte taktische Freigabe verständlicher Pläne.

npm test und npm run check bestanden: Build, 56 Einzeltests, Typprüfung.
Keine UI-/Schnittstellenänderung; der vorherige Browsernachweis bleibt bestehen.
Dies ist ein Instruktions-/Regressionsnachweis, ausdrücklich kein Nachweis realer
pädagogischer Antwortqualität. Reale Dialogabnahme und Nutzerfeedback zu
Verständlichkeit/Lernwert stehen weiterhin aus. Keine bezahlte Anfrage ausgeführt.

## Bedienbarer Humanfaktor und gemeinsame Plattformbasis

5. November 2026: Humanfaktor von reiner Instruktion zur Bedienfunktion erweitert.
Eigene Idee, Begründung, Unsicherheit und Lernziel sind stellungsgebunden im
JSON erhalten. Leitfrage, kleiner Hinweis und Erklärung liefern unterschiedliche
Anzeigetiefen; direkte Zugkandidaten im Leitfragenmodus und fehlerhafte/fehlende
menschliche Analysefelder moderner realer Antworten werden verworfen.

`npm run test:all`: Typprüfung/Build, **60 Einzeltests und 18 Chromium-
Browsertests bestanden**, keine fehlgeschlagenen/übersprungenen Tests. Ein
vorheriger Browserlauf war durch den eigenen Vorschauprozess auf Port 5173
blockiert; nach Beenden dieses Prozesses vollständiger Lauf erfolgreich.

Neue Nachweise: Reflexion bleibt an ihrer Stellung und überlebt Export/Import;
Gedankengang und gewünschter Hinweisumfang kommen beim Adapter an; Leitfragen
zeigen keine fertige Lösung, Hinweise und Erklärungen sind getrennt; fehlerhafte
Analyse wird nicht gespeichert. Browser prüft Eingabe, Leitfrage ohne Kandidaten,
Wiederherstellung und Touch-Brettbedienung bei 412x915 und 820x1180.

Manifest und drei PNG-Icons werden mit passenden Content-Types bereitgestellt;
Pfadtraversal auf Serverquellen bleibt gesperrt. Keine Service-Worker-/API-Caches,
keine Offlinebehauptung. Mac-Starter mit bash -n syntaktisch geprüft.

Dies sind Chromium-Viewport-/Touch-Simulationen unter Linux, keine Tests auf
Android, iPadOS/Safari, macOS oder Windows. Mac-Starter und native Schlüssel-
Adapter sind nicht nativ abgenommen. Der aktuelle Backendweg benötigt Node;
eigenständige mobile Apps sind noch nicht implementiert. Architektur und
Plattformmatrix stehen in PLATFORM_ARCHITECTURE.md. Reale pädagogische
Modellqualität bleibt offen; keine kostenpflichtige Anfrage ausgeführt.

## Fortlaufender Lerndialog integriert

5. November 2026: npm run test:all vollständig erfolgreich: Typprüfung/Build,
**64 Einzeltests und 19 Browsertests**, keine Fehler/übersprungenen Tests.

Neue Nachweise: echte vorherige Dialogpaare aus demselben Zweig werden als
getrennte user/assistant-Rollen an den Modell-Service weitergegeben; Simulation
und fremde Geschwistervarianten ausgeschlossen. Tatsächliche SAN-Historie wird
rekonstruiert und gegen FEN geprüft. Gefälschte Historie, system-Rollen im
Verlauf und Vergleich ohne gewählte Varianten werden abgewiesen. Lange Unicode-
Anfragen bleiben unter dem HTTP-Bytebudget; Export enthält den vollen Dialog.

Der neue Browser-Integrationslauf spielt zuerst gegen echten lokalen Stockfish,
pausiert zum Gespräch, bereitet einen Einstieg ohne API-Aufruf vor, sendet eine
Frage über den realen Modell-Service mit injiziertem lokalem Providertransport,
greift eine Rückfrage ohne automatisches Senden auf und führt eine zweite Runde
mit geprüftem Rollenverlauf. Eine dritte Runde prüft den Partierückblick nach
einem Abstecher in eine Analysevariante: echte Partie/FEN/Verlauf bleiben korrekt.
Sitzung enthält die drei Modell-Fixture-Antworten und unveränderten Partiekursor.

Frühere Beiträge im aktuellen Zweig bleiben nun bewusst sichtbar; der bestehende
Verspätungs-Test wurde auf die neue Sichtbarkeit und den Herkunftslink angepasst.
Die Datenzuordnung bleibt am ursprünglichen Knoten, nicht an der neuen Stellung.

Laufzeitstatus, Variablennamen und normaler lokaler Konfigurationsladeweg zeigen
keinen nutzbaren echten Schlüsselzugang. Keine Werte ausgegeben, keine neue
Schlüsseleingabe im Chat verlangt. Keine echte Provider-/kostenpflichtige
Textgenerierung, keine Aussage über reale pädagogische Qualität. Nativer
Plattformtest weiterhin separat erforderlich.

## Startreparatur: tsc fehlt unter Windows

5. November 2026: Nutzer meldet beim Start „tsc konnte nicht gefunden werden“.
Der bisherige Starter prüfte nur chess.js und konnte daher eine unvollständige
oder auf Produktionspakete beschränkte Installation fälschlich überspringen.
Windows-/Mac-Starter prüfen nun auch Stockfish, TypeScript, Vite und die
zugehörigen Startverknüpfungen. Reparatur und Selbstupdate installieren mit
--include=dev --include=optional --bin-links=true trotz abweichender npm-Vorgaben.

Den Zustand real nachgestellt: npm ci --omit=dev installiert chess.js, aber
kein tsc. Anschließend NODE_ENV=production npm ci mit den neuen Flags:
TypeScript 7.0.2 und Vite 8.3.5 verfügbar. Mac-Starter mit bash -n geprüft.
Vollständiger Lauf danach: Typprüfung, Build, 64 Einzeltests und 19 Browsertests
bestanden, keine fehlgeschlagen/übersprungen. Keine native Windows-Ausführung
behauptet. Kein API-Schlüssel oder Benutzerprofil durch die Reparatur verändert.
