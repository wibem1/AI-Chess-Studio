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


## Direkte Figurenbedienung mit der Maus

5. November 2026: Nutzer bestätigt den lokalen Start nach der tsc-Reparatur und
fordert Figuren ziehen statt Texteingabe. Pointer-Ereignisse spielen über den
bestehenden LearningGame-/chess.js-Weg; kein eigener Regelpfad. Der Zeiger zeigt
die Figur, legale Zielfelder und das Feld darunter. Klick/Tastatur/SAN bleiben
bedienbar. Rendern/Abbruch/Fokusverlust entfernen Ghost und Pointer-Capture.

Typprüfung und Build erfolgreich; 64 Einzeltests und abschließend 23 Chromium-
Browsertests bestanden. Die vier neuen Browserfälle prüfen echte Mausbewegungen
mit gedrückter Taste, legale/illegale Züge, Loslassen außerhalb, Escape und
Pointerabbruch, Variantenbildung, Schlagen, Rochade, en passant und Unterumwandlung.
Ziehen als Weiß und auf dem gedrehten Schwarzbrett löst den echten lokalen
Stockfish-Gegner aus; jeweils genau ein menschlicher Zug und eine Engineantwort.
Die bisherigen Klick- und Touch-Tap-Tests bleiben erfolgreich. Die neuen
Maus-Testhelfer scrollen das Brett vor Mauskoordinaten in den sichtbaren Bereich.

Keine kostenpflichtigen API-Aufrufe. Chromium unter Linux ist kein nativer
Windows-/Safari-/Mobilgerätetest; Ziehen per Touch/Pen ist über denselben
Pointerweg implementiert, aber hier nicht separat als Gerätebedienung abgenommen.


## Serverstart: belegter oder gesperrter Standardport

5. November 2026: Nutzer meldet erfolgreichen Build und danach den generischen
Startfehler. Dieser kam aus dem Listen-Fehlerhandler; ein konkreter OS-Code war
in der Nutzerausgabe nicht enthalten. Keine bestätigte Ferndiagnose behauptet.

Implementiert: Defaultport 5173 darf bei EADDRINUSE/EACCES einmal auf Port 0
(OS vergibt einen freien Port atomar) ausweichen. Bind bleibt 127.0.0.1;
keine fremden Prozesse beendet, keine Firewalländerungen. Explizites CHESS_PORT
weicht nicht aus. Die echte gebundene Adresse wird ausgegeben und geöffnet.
Fehler enthalten sichere OS-Codes und verständliche Hinweise ohne interne Inhalte.

npm run test:all: Typprüfung, Build, **68 Einzeltests und 23 Browsertests**
bestanden. Neue Tests: real belegter Socket, App erreichbar am Ausweichport,
explizit belegter Port bleibt Fehler, EACCES-Ausweichpfad simuliert, andere Fehler
lösen keinen Retry aus, Listenerbereinigung und verständliche Fehlermeldungen.
Zusätzlich tatsächlichen dist/server/start.js-Prozess mit real belegtem 5173
gestartet: Ausweichadresse liefert App-HTML und gesperrten Modell-API-Status;
anschließend nur eigene Testprozesse sauber beendet. Kein kostenpflichtiger Aufruf.

Dies prüft die Startlogik unter Linux; native Windows-Portreservierung und
Browseröffnung durch rundll32 bleiben auf dem Nutzergerät zu bestätigen.


## Scrollen mit dem Finger über dem Brett

5. November 2026: Nutzer präzisiert Scrollfehler als Fingerbedienung in der App.
Ursache im Code: touch-action:none blockierte Browser-Panning und der gemeinsame
Pointerhandler interpretierte Fingerbewegungen als Figurenziehen. Korrektur:
touch-action:pan-y pinch-zoom, kein Touch-Pointerstart im Draghandler; Klick-
Ereignisse von Taps bleiben unverändert für die Start-/Zielauswahl.

Gezielter Lauf mit sechs Touch-/Maus-Browserfällen bestanden. Neuer Test sendet
über CDP tatsächliche TouchStart/Move/End-Gesten in Chromium, beginnend auf e2
mit weißem Bauern, bei Android- und iPad-Viewportgrößen. Scrollposition nimmt
zu, keine Dragfigur/kein Zug entsteht; danach funktionieren zwei Taps mit
legaler Zielmarkierung und genau einem Zug im Export. Mausziehen/Sonderzüge,
Abbruch und echter Stockfish auf gedrehtem Brett bleiben erfolgreich.

Abschließend npm run test:all: Typprüfung, Build, 68 Einzeltests und 24
Chromium-Browsertests bestanden. Keine kostenpflichtigen Provideraufrufe.
Dies sind echte Browsergesten in Geräteemulation unter Linux; native Windows-
Touchscreens, Android und iPadOS/Safari bleiben separat zu bestätigen.


## Speicherung und Touch-Scrollen im selben Ablauf

5. November 2026: Nutzer berichtet leeres Schlüsselfeld, keinerlei Rückmeldung
und erneuten Scrollstillstand. Bisheriges Feldleeren war absichtlich, die Meldung
kam erst nach mehreren Serverantworten. Ein weiterer Statusabruf konnte unbegrenzt
warten; die Speicherfrist war ebenso kurz wie der interne DPAPI-Aufruf (5 s).

Korrektur der Rückmeldung: sofortiger sichtbarer Status und Fokus auf die Meldung
zum Schließen der Touchtastatur, 15-s-Frist für lokale Speicherung, Auswertung der
Speicherbestätigung direkt aus deren Antwort. Folge-Status ist zeitbegrenzt und
blockiert keine Bestätigung. Timeout bedeutet unbestätigt, nicht sicher gescheitert.
Serverdiagnose enthält localKeySaved als Boolean aus erfolgreichem lokalem Laden/
Speichern; dauerhaft sichtbare Anzeige nach Reload/Neustart. Keine Schlüsselwerte.

Gezielter kombinierter Lauf: Android 412x915, iPad 820x1180 und Desktop-Touch
1280x720 mit bedeutungslosen Testschlüsseln. Echten Speicherrequest vorübergehend
angehalten, native TouchStart/Move/End-Wischgesten währenddessen: Scrollposition
ändert sich, Feld leer, Fortschritt im sichtbaren Bereich und kein Eingabefokus.
Danach echten lokalen POSIX-Speicherrequest freigegeben: Bestätigung, erneutes
Wischen, Reload mit gespeicherter Statusanzeige, Löschen erfolgreich. Separater
HTTP-500-Fixturefall: klare Fehlermeldung, kein Erfolgshinweis, Scrollen weiter
möglich. Bestehender Test prüft weiterhin fehlende Browser-/Exportpersistenz.
Einzeltest erstellt einen neuen Service aus der Datei und prüft Status nach
Wiederladen und nach Löschen.

Abschließend npm run test:all: Typprüfung/Build, 68 Einzeltests und 26
Chromium-Browsertests bestanden. Kein kostenpflichtiger Provideraufruf.
Der vollständige vom Nutzer beobachtete Scrollstillstand ist hier nicht
reproduziert; native Windows-Touch-/DPAPI- und Safari-Abnahme bleibt offen.
Diese Statusverbesserung ist kein Nachweis der Behebung eines nativen Freeze.

Nutzer bestätigt Gerät/Browser als Windows-Touchscreen mit Chrome oder Edge.
Die Desktop-Touchemulation prüft Eingabeverhalten, aber weder echte Windows-
Bildschirmtastatur noch den nativen Schlüsselspeicher. Kein weiterer Gerätewechsel
als Erklärung angenommen.


## Versionierung 0.1.0

5. November 2026: erste explizit nummerierte Entwicklungsversion. package.json
und Lockfile tragen 0.1.0. Gemeinsames browser-/serverfähiges Versionsmodul liest
package.json; TypeScript übernimmt das JSON in den kompilierten Serverbuild.
UI-Kopf, Browser-Titel, Startkonsole, Diagnose, Paketmanifest, ZIP-Name und
entpackter Paketordner zeigen dieselbe Nummer. CHANGELOG und Projektanweisungen
legen Patch-/Minor-Erhöhungen für künftige ausgelieferte Änderungen fest.

npm run test:all bestanden: Typprüfung/Build, 68 Einzeltests und 27 Chromium-
Browsertests. Bestehender HTTP-Test prüft Versionsmetadaten; neuer Browsertest
prüft sichtbare Nummer, Dokumenttitel, tatsächliche Serverdiagnose und deren UI.
Separater echter CLI-Start meldet 0.1.0 und liefert dieselbe Diagnoseversion.
Packager vergleicht Version/Quellcommit vor Bereitstellung; keine Geheimnisse
in Paket oder Version. Keine kostenpflichtigen API-Aufrufe und kein Release.

Die Versionsnummer identifiziert den Stand; offene native Windows-Touch-/DPAPI-
Befunde bleiben offen und werden dadurch nicht als behoben eingestuft.


## 0.1.1: Direkte Scrollhilfe bei blockierten nativen Eingaben

5. November 2026: Nutzer bestätigt Scrollstillstand für Finger, Mausrad und
Bild ↓; Schlüsselspeicherung funktioniert. Im App-Code keine globale Scrollsperre
gefunden. Native Windows-Ursache weiterhin nicht reproduziert. Statt einer
weiteren unbelegten Ursachenbehauptung direkte Ausweichbedienung und Messung.

Feste Hoch-/Runter-Tasten verwenden document.scrollingElement.scrollBy, lösen
Fokus und beenden eigenes Figurenziehen. Keine fremden Prozesse/Browserzustände
verändert, keine Sitzung neu geladen. Feste Diagnoseanzeige erfasst UI-/Server-
Version, Browser, Seiten-/Viewportmaße, Scrollposition, CSS-Overflow/Touchaktion,
Fokus-Tag sowie letzte Pointer-/Scrollereignisse mit defaultPrevented. Nur
Scrollsteuerungstasten werden protokolliert, keine sonstigen Tastatureingaben;
keine Werte/DOM-Texte/Schachpartien/Schlüssel im Bericht. Export ausschließlich
lokal auf Klick. Speichern und Schließen stehen vor dem Bericht und bleiben
auch ohne Scrollen innerhalb des Diagnosefensters erreichbar.

Neue Browserfälle verhindern native wheel/touchmove/PageDown absichtlich:
Scrollhilfe bewegt die Seite dennoch abwärts und aufwärts. Bericht zeigt den
verhinderten Wheel-Event und passende Version/Seitenmaße; Exportdateiname enthält
0.1.1. Desktop-Touchtest prüft Erreichbarkeit nach Schlüsseleingabe und dass zwei
unterschiedliche Sentinel-Feldwerte im Bericht fehlen.
Erster Gesamtlauf deckte fehlerhafte defaultPrevented-Messung auf: Microtasks
liefen vor späteren Eventlistenern. Nach Wechsel auf nachgelagerten Timer zwei
gezielte Fälle erfolgreich, anschließend kompletter Testlauf erfolgreich.

Endstand: Typprüfung/Build, 68 Einzeltests und 29 Chromium-Browsertests bestanden.
Die künstliche Blockade ist ein Test des Fallbacks, kein Nachweis der Ursache
auf dem Windows-Touchscreen. Nutzerabnahme und deren Diagnose stehen aus.
Keine kostenpflichtigen Provideraufrufe oder automatische Diagnosesendung.


## 0.1.2: Textmarkierung statt Seitenbewegung

5. November 2026: Weitere Nutzerpräzisierung während Bereitstellung von 0.1.1:
Scrollversuch nach Schlüsselspeicherung markiert Text. Das konkrete Symptom
behandelt diese getrennte Korrektur; 0.1.1 bleibt unverändert reproduzierbar.

Normale Seitentexte setzen user-select:none/-webkit-user-select:none; Formfelder
und editierbare Inhalte erlauben weiter Auswahl. Body erlaubt natives pan-y und
Pinch-Zoom. Zusätzlich beginnt vertikales Maus-Ziehen außerhalb von Controls/
Brett nach 8 px eine direkte Seitenbewegung. Dadurch funktionieren auch als Maus
gelieferte Gesten. Dies ist keine Feststellung, welcher Windows-Treiber oder
Browserzustand beim Nutzer vorliegt. Pointer-Capture wird nur während des
Ziehens gehalten und bei Ende, Escape, Fokusverlust oder Cancel freigegeben.
Ein Drag löst keinen Folge-Klick aus. Keine Eingaben/Partiedaten werden verändert.

Neuer End-to-End-Fall speichert einen bedeutungslosen Testschlüssel, zieht den
Rückmeldungstext vertikal und prüft Scrollweg >80 px sowie leere Textauswahl.
Ziehen im Hintergrund in Gegenrichtung bewegt zurück. Weiterer Fall bestätigt
Textauswahl im SAN-Eingabefeld, funktionierenden Zugbutton und Escape-Abbruch.
Bestehende echten Touchgesten, Brett-Taps, Maus-Sonderzüge, Enginepartien und
Scrollhilfe/Diagnose bleiben erfolgreich.

npm run test:all vollständig bestanden: Typprüfung/Build, 68 Einzeltests und
31 Chromium-Browsertests. Keine kostenpflichtigen Provideranfragen. Das Symptom
ist im Browserablauf geprüft; echte Windows-Geräteabnahme bleibt offen.

## 0.2.0: Responsive Tab-Oberfläche

6. November 2026: Nutzer wünscht gemeinsame Web-App und übersichtlichere Tabs/
aufklappbare Menüs. Umgebung nach Startfehler wieder verfügbar; globale und
lokale Regeln/Stand erneut gelesen. Vier Bereiche umgesetzt: Partie, Lernen,
Varianten, Einstellungen. Das gemeinsame Brett wird nur in Einstellungen
verborgen und nicht beim Wechsel neu erzeugt. Tabwechsel starten keinen
Engine-/Modellaufruf und ersetzen keine Sitzung. Weniger häufige Funktionen
stehen in Details-Abschnitten; direkte Neue-Partie-Aktion fokussiert Einrichtung.

Ruhige Desktop-Zweispaltenansicht und gestapelte Touch-Ansicht mit fester
Bodennavigation, skalierbarem Brett, klarer Version und kompakten Werkzeugen.
Monochrome Schachsymbol-Fontfallbacks und inline SVG für Navigation ohne
externe Ressourcen. Screenshots der echten gebauten App auf Desktop/Mobil
und im Lernbereich geprüft; keine generierten Mockups.

Die 31 bisherigen Browserfälle wurden an echte Tab-/Details-Navigation
angepasst. Testhilfe liest das zugehörige Panel und klickt dessen Tab bzw.
Zusammenfassung; sie setzt kein hidden/open und verändert keine App-Daten.
Erster unadaptierter Lauf wurde nach Auffinden versteckter Controls abgebrochen.
Anschließend vollständiger Lauf mit 68 Einzeltests/34 Browsertests bestanden.
Nach visueller Brett-/Optionsanpassung neun relevante Browserfälle erfolgreich,
abschließend nochmals vollständiger Lauf erfolgreich: Typprüfung, Build,
**68 Einzeltests und 34 Chromium-Browsertests**, keine übersprungenen Tests.

Neue Nachweise: exakt vier Tabs, nur aktives Panel sichtbar, Brett-DOM-Identität
und Stellung erhalten, Gesprächsentwurf erhalten, kein Modellrequest durch
Tabwechsel, Pfeiltasten/Home/End, Fokus, Direktlink, Reload und Browser-Zurück.
Neue-Partie-Einstieg wechselt/fokussiert Einrichtung ohne Anfrage. Alle vier Tabs
bei 390x844 (Telefon), 820x1180 (iPad-Größe), 1440x900 (Desktop) ohne horizontales
Überlaufen; Touch-Navigation bleibt erreichbar und Brett-Taps funktionieren.
Bestehende echte Enginepartien, Sonderzüge, Varianten/Import/Export, Lerndialog,
Schlüsselspeicherung/Fehler und natives Wischen weiterhin erfolgreich.

Der echte KI-Provider wurde nicht aufgerufen. Keine kostenpflichtigen Anfragen,
kein Deployment oder Release. Responsive Oberfläche und bestehendes Manifest
sind noch keine eigenständige mobile/offlinefähige PWA: Engine-Worker,
Modelltransport und Browser-/Geräte-Schlüsseladapter bleiben erforderlich.
Echte Windows-/Mac-/Android-/iPad-/Safari-Abnahme bleibt gesondert offen.


## Partie verstehen – Integration nach Plancommit 2744e63e

6. November 2026: zentralen Standards-main neu gelesen, aktuellen Projektstand
geprüft und 2744e63e4c44a023742691319765f42e1fdbb6da per Fast-forward auf dem
abgeschlossenen 0.2.0-UI-Stand übernommen. Als abgegrenzten Folgeschritt den
menschlichen PGN-Rückblick im vorhandenen Lern-Tab integriert. Keine neue
App-Versionsnummer, kein Paket, Release oder Deployment; package.json unverändert.

Implementiert: PGN-Datei/Text, strikte Regelprüfung, Original-PGN/Kommentare/
Headers, Spielerfarbe aus Namen oder Wahl, Schwarz unten/freie Orientierung in
Brett und Vergleich. Geführte Vorzugpositionen ohne kommende tatsächliche Züge;
eine Reflexionsfrage je Schritt, unbekannte Erinnerung zulässig. Antwort oder
bewusstes Aufdecken gibt aktuellen eigenen Zug frei, Originalkommentar nur
aufklappbar. Ausdrückliche vollständige Ansicht und Rückkehr zum Leitmodus.
Varianten/Notizen und eigene Angaben bleiben unabhängig von der Originalfolge;
das Nachspielen eines noch verborgenen SANs erzeugt einen eigenständigen Zweig.

Uhren je Spielerseite aus unmittelbar benachbarten Clock-Kommentaren inklusive
Basis und einfachem Inkrement; fehlende, negative/korrigierte oder komplexe
Zeiten bleiben unbekannt. Wiederholungsidentität nutzt Brett, Zugrecht, Rochade
und en-passant-Rechte entlang der tatsächlichen Variante. Dreifach/50 Züge sind
bei Aufzeichnungen beanspruchbar, fünffach/75 Züge automatisch; Matt hat Vorrang.

Faktencheck optional nach Freigabe mit verifizierter vollständiger Geschichte
bis zum Knoten. Stockfish bekommt rootFen plus UCI-Zugfolge; Report bestätigt
dieselbe Geschichte und bleibt exportierbar. Bei Wiederholungsanspruch keine
isolierte FEN-Analyse. Falsche Historie/Reportpfade werden abgewiesen. Das Modell
bekommt nur bekannte Geschichte und explizite eigene Angaben/aufgedeckten Zug,
keine ganze PGN/Kommentare oder kommende Originalfolge. Keine psychologischen
Motive aus Uhrzeiten/Schlagzügen hergeleitet.

Sitzungsformat 2 verhindert, dass ältere Apps Review-Metadaten ignorieren und
künftige Originalzüge still zeigen. Normale Schema-1-Sitzungen bleiben unverändert
importierbar. Prüfung der gesamten Originalkette gegen PGN, Perspektive,
Entscheidungsindizes, Antworten, aktiven zulässigen Knoten, History-Reports,
JSON-Größe und Stellungslimit. Manipulierte Daten führen zu Fehler statt Teilimport.

Neue 12 Einzeltests: Metadaten/Schwarz/keine automatische Engine, Uhrzuordnung,
fehlende Zeiten/Inkremente, PGN-/Perspektivfehler, Zweige/Originalerhalt/Notizen,
Serialisierungsangriffe, drei/fünf Wiederholungen, Rochaderecht und Variante,
Spoilerschutz/Adaptergates und tatsächlicher Requestkontext, echter optionaler
Stockfish mit Historie, 50-/75-Zug-Regel, verspätete Engine bei Rückkehr sowie
alte/neue Sitzungsformate. Erster gezielter Lauf hatte eine zu breite Testannahme:
Ein künftiger SAN kann gleichzeitig ein unbekanntes legales Kandidatenwort sein;
der Spoiler-Test prüft Originalkontext/-historie statt die komplette Legalzugliste.
Nach präziser Prüfung gezielter Lauf erfolgreich.

Vier neue Browserfälle: vollständiger Import/Reflexion/Variante/Vergleich/JSON-
Ablauf, Dateiimport und Zurückweisen ohne Verlust vorhandener Sitzung, sichtbare
historische Wiederholung ohne ungefragten Engineaufruf, Schwarzperspektive und
Drehen über alle Tabs bei Telefon-/iPad-Größen. Netzwerkzähler belegen keine
ungefragten /api/play-, /api/tactics- oder /api/dialogue-Aufrufe. Eingefügte
PGN-Kommentare werden wörtlich angezeigt; kein HTML/Script ausgeführt.

Endgültig npm run test:all: Typprüfung/Build, **80 Einzeltests und 38 Chromium-
Browsertests** bestanden, keine übersprungen. Echte lokale Stockfish-Prüfungen,
Modell-/Updateanbieter nur Fixtures. Entwicklungsansicht mit synthetischer PGN
visuell geprüft. Keine bezahlte Provideranfrage und keine Versions-/Downloadfreigabe.

Wichtig: Der verpflichtende reale Lichess-Test 1Vh80QL2 (06.11.2026, wibem
Schwarz, 69 Züge, 10+0, remis) bleibt offen. Vollständige PGN nicht vorhanden;
Nutzer um PGN-Text gebeten. Weder aus genannten Zügen rekonstruiert noch die
synthetische Testpartie als Ersatz ausgegeben. Auch reale pädagogische Qualität,
endgültige individuelle Übungsempfehlungen durch echte KI und native Geräte-
Abnahme sind durch diese Tests nicht belegt.
