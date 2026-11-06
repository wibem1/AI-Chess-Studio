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


## Browser-Spielengine – nächster Plattformadapter auf work

6. November 2026: nach „weiter“ work und zentrale Standards abgeglichen. Keine
neue vollständige Nutzer-PGN vorhanden; Pflichtpartie 1Vh80QL2 bleibt offen.
Den unabhängigen PlayingEngine-Browseradapter im selben Projekt ergänzt.
Keine App-Version, kein Paket, Release oder Deployment.

BrowserPlayingEngine startet je Zug einen Stockfish-Lite-Single-Worker. Die
Desktopengine bleibt Standard und auswählbar. Gemeinsame preparePlayingPosition/
playingReply prüfen Geschichte, Level, Endstellung und legale Antwort. Fünf
Stufen, ein Thread, Hash 16 MiB, Tiefe 12, 20.000 Knoten, 200–1000 ms Suche;
acht Sekunden einschließlich Laden und 64 KiB Ausgabe. Jeder Erfolg, Fehler,
Timeout/Abbruch beendet Worker/Handler. Kein Retry/Serverfallback. LearningGame
unterstützt cancel bei Spielpause/-wechsel und verwirft weiter verspätete
Antworten. Enginewahl bleibt im validierten optionalen GameState.engine/JSON.

Build übernimmt nur unverändertes stockfish-19.0.1-Lite-Single-JS/WASM
(1.845.971 Byte WASM), COPYING und SOURCE. Kein Binary in Git. Dev-/App-Server
liefern vier exakt benannte versionierte Dateien. WASM-MIME/nosniff, self-Worker
und wasm-unsafe-eval ohne allgemeines unsafe-eval, kein COOP/COEP/SharedArrayBuffer.
Nur öffentliche Engine-Dateien immutable gecached, API weiterhin no-store.
Kein Service Worker, Schlüssel-/Sitzungscache oder CDN-Laufzeitdownload.

Sechs neue Einzeltests: fünf exakte Level/Grenzen und History-UCI, ungültige und
abgeschlossene Historien vor Workerstart, Fehler-/Ausgabe-/Zugschutz, Timeout
und spätere explizite Nutzung, Einzelanfrage/Pause/Abbruch/JSON-Auswahl, echte
HTTP-Assets bytegleich zum npm-Paket plus Allowlist/MIME/CSP/Lizenz/Quellverweis.
FakeWorker sind Protokollsimulationen; echte Engine separat im Browser geprüft.

Fünf neue Browserfälle: echtes WASM auf allen fünf Stufen bei vollständig
blockierten /api/** und crossOriginIsolated=false, Schwarz bei Telefon-/iPad-
Größen und JSON-Restore, während JS-Ladung pausieren und explizit mit neuem
Worker fortsetzen, fehlende WASM-Datei ohne Retry/Fallback, keine Worker durch
Tabs/PGN-Import. Der erste Fehlerfall wartete nur fünf Sekunden; Upstream kann
bei einer Ladestörung keinen Worker-error melden. Deshalb den unveränderten
achtsekündigen Gesamt-Timeout mit zehn Sekunden Beobachtungsfrist geprüft.
Kein Engine-Zeitlimit erhöht und kein Retry eingeführt. Gezielter Lauf bestanden.

Endgültig npm run test:all: Typprüfung/Build, **86 Einzeltests und 43 Chromium-
Browsertests** bestanden, keine Fehler/übersprungen. Bestehende Desktopengine,
Rückblick/Originalschutz, Sonderzüge, Dialog-, Schlüssel- und Touchabläufe intakt.
Keine kostenpflichtige Provideranfrage.

Zusätzlich web-dist auf reinem Python-http.server (127.0.0.1:5174) ohne Node-App:
/api/status=404, echter Browser-Stockfish-Gegenzug, Schwarz unten und kein
/api/play-Request. Messergebnis:
{"staticPythonHost":true,"backendStatus":404,"browserStockfishReply":true,"desktopEngineRequests":0}.
Eigenen statischen Prüfserver danach beendet; keine Netzfreigabe geändert.

Dies belegt den browserlokalen Spielgegner, keine vollständige mobile/offline-
fähige Lern-App. Modell-/Schlüssel-/Faktencheckadapter weiterhin Backend; echte
Safari-/Android-/iPad-/Windows-Abnahme und vollständige Nutzer-PGN bleiben offen.

## Eigenständige Web-App – Abschluss auf work, 6. November 2026

Nutzerauftrag „fertigmachen“: gemeinsame Web-App ohne Node-Pflicht im Betrieb,
mit lokalem Schlüssel, Humanfaktor/Lerndialog, Sitzungssicherung und Offlineweg.
Globale Regeln und origin/work abgeglichen; keine neueren fremden Änderungen.
Keine neue Version/Downloadfreigabe, kein Release/Deployment, keine bezahlte API.
Die vorhandene Entwicklungsumgebung wurde genutzt, keine neue Netzfreigabe oder
Secrets konfiguriert und kein Umgebungsentwurf geändert/veröffentlicht.

### Implementierte Grenzen

- Shared model-contract/CostLedger erhalten Desktopprüfung und Humanfaktor.
  Browsertransport: feste OpenAI-HTTPS-Pfade, CORS, keine Cookies/Referrer/
  Redirects, 15 Sekunden, 800 Ausgabe-Tokens, 64 KiB Antwort. Speichern und
  Entsperren ohne Providerkontakt; Modell-Metadaten nur auf ausdrücklichen Aufruf.
- Gerätepasswort-geschütztes AES-GCM-256-Schlüsselfach in IndexedDB, PBKDF2-SHA256
  250.000 Iterationen, frisches Salt/IV; Passwort nicht persistiert. Ausschließlich
  Ciphertext im Webspeicher, Klartext nur im entsperrten RAM. Dies konkretisiert
  den ausdrücklichen lokalen Schlüsselwunsch für die Web-App, kein nativer Keystore.
  BroadcastChannel sperrt andere Fenster bei Sperren/Ändern/Löschen, ohne Werte
  zu übertragen; Schlüsselaktion und Modellanfrage können lokal nicht überlappen.
- Jede Budgetreservierung ist eine vollständige IndexedDB-Transaktion. Drei
  Versuche je Fenster und gespeicherter Periode, auch über Reload/Schlüsselwechsel
  hinweg. Unsichere Nutzung bleibt reserviert; Preise/Budget sind Schätzwerte.
- Browser-UCI-Prozess für Gegner und getrennten Faktencheck: bounded Worker,
  volle historische importierte Zugfolge, Kandidat/SAN/PV/Perspektive validiert.
  Kein ungefragter Faktencheck, Wiederholungsschutz und Originalzug-Sperre intakt.
- Serialisierte automatische Sitzungssicherung plus Entwurf, validierter Restore,
  pausierte Partie und bestehender JSON-Weg. Ladefehler überschreiben vorhandene
  lokale Daten nicht. Ein Speicherstand pro Browseradresse, keine Cloud-Synchronisation.
- Inhaltsbasierter SW-Cache nur für exakt gebaute öffentliche App-/Engine-Dateien.
  Nie APIs, externe Hosts, POSTs oder Asset-Queries. Kein Key-/Passwort-/Sitzungs-
  Cache. Installation verlangt HTTPS/localhost. Neuer Worker bleibt wartend bis
  Zustimmung und erfolgreicher Sitzungssicherung; kein automatisches Neuladen.

### Prüfungen und Ergebnisse

`npm run test:all` im finalen Quellstand: Typprüfung und Produktionsbuild sowie
**93 Einzeltests und 49 Chromium-Browsertests bestanden**, keine Fehler,
übersprungenen oder ausstehenden Fälle. Node 24.22.1, gepinnte Abhängigkeiten
unverändert. Echte lokale Stockfish-Prozesse und Browser-WASM, Anbieter-/Git-
Updateantworten ausschließlich Fixtures; keine echten Anbieterzugangsdaten.

Sieben neue Einzeltests prüfen AES-Zufallswerte/Entschlüsselung/Manipulations-
schutz, Neustart/Entsperren/Löschen ohne Provider, festen Transportvertrag und
periodisches Limit über neue Runtimeinstanzen, ungültige Anfrage/Antwort und
konservative Reservierung, Schutz vor paralleler Schlüsseländerung, UCI-Historie/
Kandidat/Weißperspektive sowie Metadatenprüfung ohne Anfrageverbrauch.

Sechs neue Browserfälle prüfen:

1. Reale IndexedDB-Verschlüsselung, klare Speicherbestätigung und leere Eingaben,
   Mausrad nach Speichern, falsches/richtiges Gerätepasswort, nach Reload gesperrt,
   erfolgreicher Fixture-Dialog, Wiederherstellung und kein Key/Passwort im Export.
2. Zwei Fenster mit gemeinsamen atomaren Reservierungen: von vier zeitnahen
   Anfragen kommen genau drei zum nachgebildeten Provider; Limit nach Reload erhalten.
3. Echter zusätzlicher Browser-Stockfish-Befund samt Auto-Restore bei gesperrten
   Backend-APIs, keine Spiel-/Taktik-/Modellanfrage an einen App-Server.
4. Natives Fingerwischen nach Schlüssel-Speichern bei 1440x900, 390x844 und
   820x1180: Seite bewegt sich, kein markierter Text, kein horizontales Überlaufen.
5. Echter SW-App-Cache, Offline-Reload mit PGN/Reflexion und gesperrtem Key;
   anschließend ausdrücklicher Wechsel zum freien Spiel und echter WASM-Gegenzug.
   Cache enthält Engine, keine API-/OpenAI-URLs. Kein künstlicher Offline-Fixture-HTML.
6. Auf separatem lokalen Prüfserver geänderter SW/Index: real wartender Worker,
   keine vorzeitige Aktualisierung, fehlende Zustimmung verhindert Reload,
   bestätigte Übernahme lädt neuen Index und erhält den Nachrichtenentwurf.

Die fünf Spielstufen werden jetzt in getrennten frischen Browserkontexten geprüft:
Neuladen ist wegen des neuen Auto-Restore keine Garantie einer leeren Partie mehr.
Keine Assertion abgeschwächt. Neue Engine-UCI-Helfer erhalten alle vorherigen
Abbruch-/Timeout-/Zugschutztests. Bestehende 43 Desktop-/PGN-/Dialog-/Touchfälle grün.

Bei der Eingrenzung gab es einen nativen fetch-Aufruf mit falschem `this` im neuen
Browsertransport; durch Wrapperbindung behoben und echte Browser-Fixture-Aufrufe
verifiziert. Der Offline-Spieltest verlässt jetzt ausdrücklich den geführten
Rückblick und wählt die Ausgangsstellung, statt eine dort absichtlich gesperrte
Enginepartie oder einen falschen Zugturn zu erwarten. Schutzlogik unverändert.
Die abschließende Sichtprüfung kürzt Schlüsseltexte und zeigt Entsperren vor
Neueingabe; die letzte Oberfläche wurde erneut im vollständigen Prüflauf getestet.

Erster Standard-Sandboxlauf scheiterte an EPERM für localhost, vollständiger Lauf
mit zulässigen lokalen Serverprozessen erfolgreich. Zusätzlicher direkter Node-
Lauf außerhalb npm hatte beim Update-Fixture den fehlenden npm_execpath als
Voraussetzung; dokumentierter npm-Prüfweg bestand vollständig, gezielter Update-
Test mit dem vorhandenen npm-Pfad ebenfalls 5/5. Keine Tests deaktiviert.

Zusätzliche Prüfung auf reinem Python-http.server über Loopback, ohne Node-App:

```json
{"staticHost":true,"backendStatus":404,"browserEngineReply":true,"backendModelPlayTacticsCalls":0,"viewportFits":true}
```

Eigener statischer Prüfserver anschließend beendet. Desktop- und Telefon-
Einstellungen der echten gebauten App als lokale Screenshots gesichtet; keine
Schlüsselwerte aufgenommen. `git diff --check` sauber. Code, diese Prüfergebnisse
und aktueller PROJECT_STATE werden zusammen auf work gesichert.

### Verbleibende Abnahme

Kein Beleg für echten OpenAI-CORS/Kontozugriff oder pädagogische Antwortqualität,
keine native Windows-Touch/DPAPI-/macOS-Safari-/Android-/iPadOS-Abnahme. Ein
öffentlicher HTTPS-Startpunkt für Mobilgeräte wurde nicht veröffentlicht.
Vollständige Nutzer-PGN 1Vh80QL2 fehlt weiterhin; synthetische legale Test-PGNs
bleiben ausdrücklich als solche markiert und ersetzen diesen Pflichtfall nicht.

## Web-Veröffentlichung beauftragt – Paket 0.3.0 vorbereitet

6. November 2026: Nutzer präzisiert „WebApp veröffentlichen“. Kein Hostingkonto
verbunden; lesender `gh api repos/wibem1/AI-Chess-Studio`-Aufruf liefert Forbidden.
Kein Nachweis für Pages-Einrichtungsrechte; Git-Push-Rechte werden damit nicht
verwechselt. Keine Kontoanlage, neuen Secrets, kostenpflichtigen Optionen,
GitHub Actions oder Änderung der Repository-Sichtbarkeit. Die App ist noch nicht
öffentlich erreichbar. Hostingfrage gestellt, unabhängige Paketarbeit erledigt.

Version in package.json/package-lock.json auf 0.3.0 synchronisiert. Statische
Header für kompatibles Hosting (_headers), vollständige unveränderte BSD-Lizenz
von chess.js und zugängliche Lizenz-/Quellseite ergänzt. Node-Server erlaubt nur
die beiden genau benannten zusätzlichen öffentlichen Lizenzpfade; Klartext-MIME
und Bytegleichheit mit dem gepinnten chess.js-Paket gezielt überprüft. Öffentlicher
App-Footer und Offline-Shell enthalten den Lizenzzugang.

`npm run test:all`: Typprüfung, Build, **93 Einzeltests und 49 Browsertests grün**
mit Version 0.3.0. Nach Ergänzung der Lizenz-Assertions Produktionsbuild und sechs
gezielte Browserengine-/HTTP-Assettests erneut bestanden. Keine bezahlte API.

Web-ZIP enthält 16 öffentliche Dateien, einschließlich BUILD.json mit Version
und SHA-256 pro Datei; index.html direkt im ZIP-Stamm. Exakte öffentliche
Dateiauswahl, keine Symlinks, keine Server-/Profil-/Sitzungs-/Secretdateien und
ZIP-CRC geprüft. Paket 1.284.870 Byte, SHA-256:
`403f030ff10afe53dc60397d7b9d9bd609038af94ecdbbb2cb57f07e93617202`.
Die ignorierte Datei liegt unter artifacts/AI-Chess-Studio-Web-0.3.0.zip.
Paket-/Uploadanleitung: docs/WEB_PUBLISHING.md.

Dies ist ein geprüftes Bereitstellungspaket, kein erfolgreicher Onlinegang.
Hosting-CSP und Browserfunktion an einer tatsächlichen öffentlichen HTTPS-Adresse
müssen nach Zugang/Bereitstellung verifiziert werden. Kein öffentlicher Link
oder kostenfreier Kontotarif wurde ohne Providerbeleg erfunden. Echte KI-Qualität,
Geräteabnahme und die vollständige Nutzer-PGN bleiben weiterhin offen.

## GitHub Pages im bestehenden Repository – 0.3.1

6. November 2026: Nutzer lehnt ein zusätzliches Repository ab. Kein neues
Repository angelegt. Nutzer stellt AI-Chess-Studio selbst auf Public;
öffentlicher HTTP-Abruf danach 200. Quelle und Ziel für den Distributionsbranch
sind ausschließlich wibem1/AI-Chess-Studio, separater Branch gh-pages. Die
Verwaltungs-API für /pages liefert nach der echten Sichtbarkeitsänderung weiter
Forbidden; eine Pages-Einstellung wird deshalb nicht als erledigt ausgegeben.

Root- und Unterordner-Build über dieselbe Vite-Konfiguration. Aufgelöste Basis
für Web-Transport, Engine-Worker, Navigation und SW-Registrierung; Manifest
relativ. Cache-Namensraum enthält das Basisverzeichnis und löscht ausschließlich
eigene Shell-Caches. .nojekyll und HTML-CSP für Pages; keine Behauptung eigener
HTTP-Header, die Pages nicht unterstützt. Kein automatischer Actions-Workflow.

`npm run test:all` im abschließenden Stand: Typprüfung, Root- und Pages-Build,
**94 Einzeltests und 50 Chromium-Browsertests bestanden**, keine ausgelassen.
Neuer realer Unterordnerfall: /AI-Chess-Studio/ einschließlich Redirect, Manifest-
Scope/Icons, echter Stockfish-WASM-Gegenzug, echte SW-Kontrolle, ausschließlich
scoped Cache-Dateien, Offline-Reload mit pausierter Partie und Nachrichtenentwurf,
Offline-Lizenznavigation, keine Root-Anfragen oder Browserexceptions.

Zusätzlicher Publisher-Test arbeitet mit echten lokalen Git-Repositories und
auf file:// beschränkten Git-Protokollen. Er prüft ersten gh-pages-Commit,
weiteren Updatecommit ohne erzwungenen Push, unveränderten main-Codebranch,
Abbruch bei fremden Zieldateien und Zurückweisung einer credentials.json im
Build. Erstes Fixture deckte ein vom main abweichendes Remote-HEAD auf; der
Publisher wählt nun den exakten Distributionsbranch. Auf bestehenden Quellcode-
Branches werden keine Build-Dateien gelöscht oder geschrieben. Lokale Prozess-
Sandbox erfordert für verschachtelte Git-Prozesse einen freigegebenen Testlauf;
der vollständige abschließende Lauf besteht. Keine bezahlte API-Anfrage.

Beim Nutzerwechsel vom zusätzlich vorgeschlagenen Repository zum bestehenden
Projekt wurde auch der Unterordner-Test angepasst. Ein verbliebener alter
Repositoryname in der Icon-Assertion verursachte einen vorübergehenden Testfehler;
korrigierte Assertion und kompletter finaler Lauf 94/50 grün. Kein Testschutz
entfernt und keine Anwendungssperre abgeschwächt.

Heuristische Historienprüfung vor öffentlicher Freigabe: 30 vorhandene Revisionen
auf verbreitete Token-/Schlüssel-/Private-Key-Muster, keine Treffer und keine
Werte ausgegeben. Das ist keine allgemeine Zusicherung über alle privaten Inhalte.
Live-Adresse und Pages-Aktivierung werden erst nach tatsächlichem Ergebnis
bestätigt. Reale KI-Qualität, native Geräteabnahme und Nutzer-PGN bleiben offen.

Übertragung nach erfolgreichem finalem Prüflauf: work-Commit 6f747c2 gespeichert,
Publisher tatsächlich gegen das vorhandene Repository ausgeführt, neuer
Distributionsbranch gh-pages erfolgreich übertragen. `git ls-remote` bestätigt
82d92273eb8a6abc40555a7ca126fc3b41db05c7. BUILD.json bindet den Web-Stand 0.3.1 an
6f747c2. Codebranch bleibt erhalten; kein neues Repository. Nutzerfreigabe Public
ist vorhanden und durch öffentlichen Repository-Abruf HTTP 200 bestätigt.

Die Pages-Verwaltungs-API bleibt Forbidden. Der direkte Website-Prüfversuch an
https://wibem1.github.io/AI-Chess-Studio/ scheitert vor dem Zielserver am
Netzwerkproxy: CONNECT 403, HTTP 000. Deshalb weder erfolgreiche Live-Abnahme
noch einen Website-404 behaupten. Erforderliche einmalige GitHub-Einstellung:
Settings → Pages → Deploy from a branch → gh-pages → / (root) → Save.
Danach tatsächliche Pages-Aktivierung und angezeigte Adresse bestätigen.

Nachtrag: Nutzer hat gh-pages / (root) ausgewählt und Save bestätigt. Öffentliches
BUILD.json wurde separat mit HTTP 200 und 0.3.1 / Basis /AI-Chess-Studio/
verifiziert. Nach dem Speichern erneuter Abruf der App-Adresse und des neuesten
Pages-Buildstatus versucht: beide am CONNECT-Proxy mit 403/HTTP 000 blockiert.
Keine Aussage über einen HTTP-Fehler der Website und kein erfolgreicher Live-
Smoke-Test daraus abgeleitet. Zieladresse zum Öffnen durch den Nutzer bereit.

## Brett vollständig sichtbar – Korrektur 0.3.2

Nutzer-Screenshot der installierten Windows-PWA 0.3.1 zeigt rechts abgeschnittene
h-Linie (teilweise auch g). Ursache lokal in tatsächlicher App reproduziert:
`repeat(8,1fr)` erlaubt intrinsische Mindestbreiten der großen Figuren. Auf dem
höhebegrenzt kleinen Desktopbrett ist die Summe der Tracks breiter als der Rahmen;
`overflow:hidden` verdeckt die überstehenden Felder. Der DOM hat trotzdem 64
Felder, deshalb haben bisherige reine Zähltests diesen Fehler nicht erkannt.

Vor Korrektur zwei neue Browserfälle rot, anschließend beide grün. Hauptbrett
und Vergleichsbretter nutzen nun acht `minmax(0,1fr)`-Tracks in beiden Achsen,
Zellen ohne automatische Mindestmaße und Figurengröße relativ zum eigenen Brett.
Kein geänderter Schachzustand, keine Speicher-/Schlüssel-/Sitzungsmigration.

Neue Messung prüft alle 64 Zellrechtecke vollständig innerhalb des Brettrahmens,
quadratische gleiche Feldgrößen sowie Textrechtecke der Figuren. Hauptbrett bei
1280x600, 1440x900, 1920x1080, 980x560, 901x500, 900x500, 390x844 und 820x1180,
je 100/150/200 Prozent CSS-Zoom und beiden Orientierungen. Zusätzlich 24-px-
Grundschrift und tatsächlich ausgeführter h2-h4-Zug. Beide A/B-Bretter bei vier
Fenstergrößen einschließlich schmaler Vergleichsspalten.

CSS-Zoom ist eine gezielte Layoutsimulation und kein Nachweis nativer Browser-
Zoom-/Windows-DPI-/Safari-Schriftmetriken. Ein erster Element-Screenshot bei
künstlichem 150-%-CSS-Zoom zeigte nur den im kleinen Viewport gerenderten
Ausschnitt eines sticky Brettes; nicht als vollständige Sichtprüfung verwendet.
Die Gegenprüfung bei normalem Zoom und gleicher problematischer kompakter Größe
1280x600 zeigt alle acht Spalten und Reihen und wurde visuell gesichtet
(artifacts/board-032-compact.png). Die geometrischen Tests decken Zoom zusätzlich ab.

Abschließend `npm run test:all`: Typprüfung, Root-/Pages-Build, **94 Einzeltests und
52 Chromium-Browsertests bestanden**, keine Fehler oder ausgelassenen Fälle.
Versionsquelle und Lockfile synchron auf 0.3.2, bestehende Import-/Engine-/Dialog-/
Touch-/Offline-/Updateabläufe grün. Keine kostenpflichtige Provideranfrage.
Code, Regressionen und Projektstand gemeinsam sichern und als 0.3.2 auf dem
vorhandenen gh-pages-Branch bereitstellen. Keine neue Pages-Einrichtung nötig.

Auslieferungsnachweis 0.3.2: work 97cb9ec und gh-pages
73dfea1fccfe557bd4bb42a207c71f66d3b6e59d erfolgreich gepusht. Öffentliches
commitgebundenes BUILD.json abgerufen, Version 0.3.2 und sourceCommit
97cb9ec verifiziert. Das bestätigt den hochgeladenen Stand, keinen eigenen
Live-Browsertest am durch den Netzwerkproxy gesperrten github.io-Host.

## Ausbleibendes Update: tatsächlicher GitHub-Deploy-Timeout

Nutzer meldet fehlendes Update und Chrome-Android-Meldung „bereits installiert“.
Vor Appänderungen öffentlicher GitHub-Actions-Verlauf geprüft: Lauf
42245157162 für den übertragenen gh-pages-Commit 73dfea1 tatsächlich FAILURE,
deploy-Annotation „Timeout reached, aborting!“, Laufdauer 10m44s. Buildartefakt
vorhanden (1,22 MB), Veröffentlichung nicht erfolgreich. Kein belegter App-Cache-
Fehler daraus abgeleitet. Die frühere Aussage „Update bereit“ allein aufgrund
des übertragenen Buildmanifests war zu weitgehend.

Genau ein neuer Lauf der unveränderten, zuvor 94/52 geprüften App 0.3.2 ausgelöst,
Commit 47427bd700213e6b22412dec23c5df9201bb664a. Lauf 42253628918 erfolgreich:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42253628918 .
Neuer Statusprüfer mit vollem Commitlink und passendem Titel auf dem echten Lauf
geprüft: state success, zugehörige GitHub-Schlussfolgerung SUCCESS. Das belegt
GitHubs Bereitstellung; Livehost und Android-Browser wurden damit nicht simuliert.
Keine weiteren automatischen Deployversuche, keine neuen Workflow-Dateien.

Manueller Veröffentlichungsbefehl ergänzt um wartende Kontrolle. Öffentliche
HTML-Daten nur als Daten parsen, feste Repo-/Laufpfade und numerische IDs. Vier
neue Einzeltests: nur gh-pages-/Pages-Läufe zulassen, exakten Commit verlangen,
Failure/Cancelled/Timeout/Pending/Unknown nicht als Erfolg behandeln, unbekanntes
Antwortformat fail-closed. npm run check und abschließend npm test **98/98 grün**.
App-/PWA-Code, Installationskennung und 0.3.2-UI unverändert; der vorherige echte
komplette Browserteststand **52/52** gilt für diesen unveränderten Appcode.
Kein neuer kostenpflichtiger Aufruf und keine Daten-/Schlüssellöschung.

Androidbefund bleibt offen: Quellprüfung bestätigt, dass unsere App keine
„bereits installiert“-Meldung oder geräteübergreifende Installationsliste besitzt.
Manifest-ID bleibt /AI-Chess-Studio/ nach relativer Auflösung. Daraus folgt kein
Nachweis einer vorhandenen Installation auf dem Telefon. Versionsnummer und
Ort des nativen Dialogs beim Nutzer angefragt; tatsächliche Android-Installation
nicht mit Linux-Chromium-/Touchgrößentests gleichsetzen.

## Android-Bedienungsdiagnose und Chromium-Versionsvergleich

Nutzerdatei (nicht veröffentlicht) meldet App 0.3.2, Android-Chrome 156, Touch,
CSS-Viewport 600x841, Skala 1. Die reduzierte UA enthält keinen Nachweis einer
Windows-Installation und keine Daten über Chromes native Installationsliste.
Neustart hatte laut Nutzer nicht geholfen; keine weiteren ungezielten Resets.

Offizieller Chromium-Fix 2e165cdb08d714941e3573a18b719bfdad78ff66 vom 13.10.2026
mit exakt beschriebenen Meldungen und Ursache gelesen. Versionierte Registry-
Quellen aus 156.0.8078.94, 157.0.8103.73 und 158.0.8127.24 verglichen: 156 prüft
nur Origin, die beiden neueren geprüften Stände prüfen App-Scope. Diese Fakten
sind durch echte Quellabrufe belegt; kein Android-Installationstest daraus
behauptet. Gezielte Empfehlung: Chrome auf einen korrigierten Stand aktualisieren,
dann Installation erneut versuchen. Genauigkeit und offene Gerätebestätigung
unter docs/ANDROID_INSTALLATION.md. Keine App-Code-/Manifest-/Datenänderung,
kein neuer Build oder Deployment, keine bezahlte Anfrage. Kein vollständiger
Nutzer-Diagnoseinhalt in Git. Vorheriger App-Prüfstand bleibt unverändert.


## Web-Updateanzeige 0.3.3 – 6. November 2026

Befund: Nutzer-Screenshot bereits 0.3.2; erneuter Abruf des öffentlichen
BUILD.json bestätigt dieselbe neueste Version. GitHub-Lauf 42253628918 für
47427bd erneut SUCCESS. Kein neuer Stand zum Zeitpunkt der Meldung vorhanden;
daraus keine native Android-Updateabnahme ableiten.

Korrektur: eindeutige Meldung mit laufender Version bei unverändertem Worker,
Downloadphase, bereites Update, abgebrochene Worker-Installation und fehlgeschlagene
Prüfung. Bereits laufender Installer wird beim Start beobachtet; Prüfung erst
nach Registrierung freigegeben. Keine Speicherlöschung/Manifeständerung.

Prüfung: npm run test:all mit Typprüfung, beiden Builds, 98/98 Einzeltests und
53/53 Chromiumfällen bestanden. Neue Fehlerregression: echte Worker-Installation
absichtlich abgelehnt, anschließend Worker-HTTP-Abruf 503; Update bleibt gesperrt,
Prüfung erneut möglich, Rückkehr zur unveränderten Fassung und Entwurf erhalten.
Bestehender Übernahmetest erweitert: unverändert, absichtlich langsamer Download,
Bestätigung und erhaltene Sitzung. Nach Bereinigung abgeschlossener State-Listener
beide Builds und die vier relevanten Pages-/Offlinefälle nochmals bestanden.

Zusätzlicher realer Versionswechsel auf lokalem Pages-Unterordner: unveränderte
0.3.2-Dateien aus dem bisherigen pages-dist (JS-SHA-256 identisch mit öffentlichem
BUILD.json) geladen, Server auf neuen pages-dist umgestellt. Alter Updateknopf
findet 0.3.3, übernimmt erst nach Zustimmung und erhält Nachrichtenentwurf;
anschließende Prüfung meldet Version 0.3.3 aktuell. Keine Provideranfrage.
Dies prüft echten Service Worker/Chromium, keine native Android-Installation
und keine direkte Live-Abnahme der vom Proxy gesperrten github.io-Adresse.


0.3.3 tatsächlich veröffentlicht: Quellcommit 63ef08fbe38b0186295d2a21cd41e1b700877a65,
gh-pages 69149dcee15182f8199f15ee20b11405a895d5ee, GitHub-Run 42273159023 SUCCESS.
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42273159023
Öffentliches BUILD.json nach Upload: Version 0.3.3, Basis /AI-Chess-Studio/ und
exakter Quellcommit stimmen. Eigene Live-/native Android-Abnahme bleibt getrennt.


## 0.4.0 – großes Brett, zwei Modi und Partienspeicherung

Nutzerkonzeption umgesetzt: Spielmodus/Lernmodus statt vier Hauptbereichen,
Chat und Varianten im Lernmodus, Einstellungen separat. Ein DOM-Brett bleibt
bestehen. LearningGame merkt den Lernkursor zur jeweiligen echten Partiestellung;
Gegnerpause, Cancellation und Revision schützen die Partie vor verspäteten Zügen.
Nach einem echten neuen Partiezug beginnt Lernen an dessen neuer Stellung.
Nach Neuladen wird eine Partie erst nach ausdrücklicher Spielwahl fortgesetzt.

Modellvorschläge sind optional strukturierte, positionsgebundene Annotationen.
Schon beim Eintragen/Import müssen SAN-Züge zur jeweiligen Stellung legal sein;
Mensch-/Faktencheck-Annotationen dürfen keine Modellvorschläge ausgeben. Vorführung
pausiert den Gegner, öffnet den zugehörigen Lernzweig und markiert Start/Ziel.
„Zug kommentieren“ ist eine explizite Chat-Anfrage mit bestehendem Budget, keine
ungefragte Analyse nach jedem Brettzug. Simulierte Antworten bleiben gekennzeichnet.

Partien: benannte Kopien in separatem IndexedDB-Schlüssel saved-games, gleiche
Datenbankversion 1. Atomare Transaktionen, höchstens 100 gespeicherte Stände.
Vollständige Sitzung als JSON mit Kommentaren, Dialog und Varianten, ohne Vault,
Passwort oder Kostenkonto. Aktueller Stand wird vor dem Laden separat gespeichert;
Datei erst validieren, dann ersetzen. Dateigröße maximal 8 MiB wie im bestehenden
Sitzungsimport. Sammlung bleibt beim Löschen der automatischen Sitzung erhalten.

Zwei zusätzliche Einzeltests: Lernzweig über Wechsel behalten/neue Partiestellung
beachten; legale Vorschläge serialisieren, falsche Herkunft und illegale Vorschläge
beim Eintragen/Import ablehnen. Zwei neue Browserfälle: echte Stockfish-Partie,
Moduswechsel, markierte Vorführung, eigener Zugkommentar, pausierter Neustart;
benannte Kopie über Neuladen, Datei-Rundlauf mit echten Kommentar-/Dialog- und
Variantendaten sowie ungültige Datei ohne Zustandsverlust. Vorhandene 53 Fälle
auf tatsächliche Modusbedienung umgestellt und beibehalten.

Bei der Migration zeigten Tests: alter Testhelfer erwartete auch in Einstellungen
einen ausgewählten Haupttab; geändert auf tatsächliche Nebenansicht. Rückblick
war nach Neuladen hinter geschlossener Werkzeuggruppe verborgen; bei vorhandenem
Rückblick automatisch sichtbar gemacht. Alte Fortsetzen-Tests an bewussten
Spielmoduswechsel angepasst. Die sechs betroffenen/neu hinzugefügten Abläufe
gezielt bestanden, anschließend Gesamtsuite auf endgültigem Quellstand.

Desktop 1440x900 und Handy 390x844 visuell im realen Chromium kontrolliert.
Brett vollständig, zwei Modi, Chat daneben/unterhalb, Dateimenü am Brett.
Browser-/Touch-Viewport-Prüfungen ersetzen keine native Geräte- oder echte
KI-Qualitätsabnahme. Keine bezahlte Provideranfrage; Modelltransporte über Fixtures.


Endgültiger Prüfstand 0.4.0: npm run check bestanden; npm test 100/100;
Root-/Pages-Builds bestanden; abschließendes npx playwright test 55/55,
0 fehlgeschlagen (2,6 Minuten). Der Test für fünf Spielstufen bei absichtlich
fehlendem Backend prüft jetzt die automatische Browser-Enginewahl und die
versteckte technische Auswahl, statt eine ausgeblendete Auswahl anzuklicken.
Keine App-Tests entfernt.

Zusätzlich öffentlicher 0.3.3-Altstand aus gh-pages (Quellcommit 63ef08f,
index.html, Worker und JS/CSS jeweils SHA-256 gegen öffentliches BUILD.json
verifiziert) auf lokalem Pages-Unterordner. e2-e4 und Nachrichtenentwurf erzeugt,
Server auf endgültigen 0.4.0-Build umgestellt, über alten Updateknopf mit
Zustimmung übernommen. Version 0.4.0, Stellung n1 und Entwurf erhalten; erneute
Prüfung meldet aktuell. Dies ist echte Chromium-/Service-Worker-Integration,
keine native Android-Abnahme oder bezahlte Modellprüfung.


## Tatsächliche Bereitstellung 0.4.0

Quellcommit 76de2fcbad3cedda51359420e0b4089ed8fc258c, gh-pages
441b36dc64d92c8fad11b3675a52539336974ae6. GitHub-Run 42285782065 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42285782065
Commitgebundenes öffentliches BUILD.json bestätigt Version 0.4.0, Basis
/AI-Chess-Studio/ und exakten Quellcommit. Branch-Alias raw/gh-pages lieferte
zunächst gecachte 0.3.3-Metadaten; keinen Fehler des Live-Hosts daraus behaupten.
Live-Adresse weiterhin vom Netzwerkproxy gesperrt; Nutzer-/native Abnahme offen.
Keine neue Ablage, kein Workflow, keine weitere Sichtbarkeitsänderung oder
kostenpflichtige Modellanfrage. Projekt-/Prüfstand mit Code auf work gesichert.


## 0.4.1 – Desktopdarstellung und Neustart

Eingegrenzt: Höhenabzug 300 px in 0.4.0 verkleinert das Brett bei kurzen
Windows-Viewports, z. B. auf 300 px bei 1280×600. Neue Partie war ausschließlich
Navigation zur Einrichtung, ohne neue Grundstellung oder GameState.

Desktop jetzt Brett zuerst, Status/Werkzeuge unterhalb; Breite durch verfügbaren
Platz und Höhe minus 150 px begrenzt, maximal 960 px. 450 px bei 1280×600,
750 px bei 1440×900. Kopf-/Seitenleisten getrennt ohne Überlagerung. Container-
Query statt allein viewportbezogener Media Query für tatsächliche schmale Inhalte
bei CSS-Zoom. Figuren proportional zum Brett. Klassische Farben/ruhigere Karten;
kleine Touchanordnung nicht geändert. Desktop/Handy im echten Chromium visuell
geprüft, keine native Windows-/Android-Abnahme behauptet.

Neustart: vorherige Sitzung nach Pause separat im vorhandenen Partienarchiv,
dann neue Session und Grundstellung mit gewählter Farbe/Stärke. Inert-Schutz
während des Speicherns, kein Reset bei Sicherungsfehler; Archivanzeige aktualisiert.
Modell-/Engineantworten zur vorigen Session können die neue Partie nicht verändern.
Zwei neue Browserfälle prüfen sichtbare Brettunterkante und Mindestgröße an drei
Desktopfenstern, schmales Layout, echten Reset, erhaltenen Kommentar nach Laden
und automatischen Stockfish-Erstzug bei Schwarz. Bestehender Navigationstest
prüft jetzt Neustart statt bloß Fokus auf Farbeingabe.

Gezielte Brett-/Neustartfälle 4/4 bestanden. Ein erster Gestaltungsversuch zeigte
bei CSS-Zoom überlagernde rechte Karte; Trace ausgewertet und mittels tatsächlicher
Containerbreite behoben. Zwischenzeitlich zu hohes Brett störte Drag-Koordinaten;
endgültige Variante hält das ganze Brett im Desktopfenster sichtbar.


Endgültiger Stand: Typprüfung und 100/100 Einzeltests bestanden; nach endgültiger
CSS-Anordnung Root-/Pages-Builds erneut bestanden und npx playwright test mit
57/57 bestanden (2,7 Minuten), einschließlich Drag/Sonderzüge, vollständigem
Brett bei Zoom, Touchgrößen, Speicher-/Neustartablauf und echten Enginezügen.
Keine kostenpflichtige Modellanfrage. Native Windows-/Android-Abnahme bleibt offen.


0.4.1 tatsächlich bereitgestellt: Quellcommit 9626a023c6158db36060c584eec50c245b30ddba,
gh-pages 9a8785e55c760e077338b68c9a98e579a74dabfe, Run 42290733124 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42290733124
Commitgebundenes öffentliches BUILD.json mit Version/Basis/Quelle überprüft.
Keine direkte Live-Host-/native Windows-Abnahme im netzwerkbeschränkten Runner.
Code und Prüf-/Projektstand gemeinsam auf work; kein neuer Workflow oder API-Test.


## 0.5.0 – einfacher lokaler Schlüssel und Windows-Formulare

Vorheriger Stand 0.4.1 reproduziert: bei 1066 px überragen Level-Select, Label und
Startknopf den Formularrahmen. minmax(0,1fr), min-width:0/width:100% und Umbruch
der Labels korrigieren den intrinsischen Mindestbreitenfehler. Schmale Formulare
stehen untereinander. Bedienungshilfe ein-/ausklappbar, Diagnose über den
Plattformadapter. Windows-Schrift 16/24 px und drei Desktopbreiten geprüft.

Lokale Speicherung jetzt standardmäßig Format 2: AES-GCM-256, zufälliger IV,
AAD, nicht exportierbarer CryptoKey im gleichen atomaren IndexedDB-Vaultrecord.
Automatisches Öffnen bei Start; kein Passwort/Provideraufruf dafür. Schutzgrenze:
Same-Origin-Code und Nutzer dieses Browserprofils können den Schlüssel benutzen;
kein nativer Schlüsselbund. Optionaler Passwortschutz/Altbestand Format 1 bleibt
mit PBKDF2 lesbar. Umstellung erst nach Entsperren, kein Überschreiben bei falschem
Passwort. Andere Fenster über BroadcastChannel invalidiert/neu geladen;
explizite Sperre im Fenster bleibt bis Entsperren/Neustart bestehen.
Budget und Partien nicht migriert oder zurückgesetzt. Manifest/DB-Version gleich.
Ältere App-Versionen vor 0.5.0 können Format 2 nicht öffnen; nicht automatisch
zurückmigrieren, alte Fenster auf den neuen Stand bringen.

Drei zusätzliche Einzeltests: Profile-Crypto/non-extractability/tampering,
Speichern/Neustart/Sperren/Löschen ohne Zusatzpasswort mit unverändertem Budget
und null Providercalls; Altpasswortfach nach Entsperren umstellen. Echter
Browsernachweis ergänzt: CryptoKey strukturiert in IndexedDB gespeichert und
nach Reload verwendbar, keine Pflichtpassworteingabe, Löschen über zweites
Fenster synchronisiert; alte Passwortspeicherung ohne neue API-Key-Eingabe
umgestellt. Neuer Layoutfall schlug vorher fehl und besteht nachher.
Bestehende Passwort-/Budget-/Offlinefälle beibehalten, zusätzliche Passwortwahl
in Legacy-Testabläufen ausdrücklich über optionale UI geöffnet.

Gezielt 103/103 Einzeltests und zehn relevante Browserfälle grün.
Gesamtsuite zunächst 103/103 und 60/60 grün; nach Feinschliff schmaler Formulare
beide Builds und neun relevante Fälle erneut grün. Abschließende Gesamtsuite
mit kompakter Bedienungshilfe separat unten. Keine kostenpflichtige Anfrage.


Endgültiger Quellstand: npm run test:all mit Typprüfung, beiden Builds,
103/103 Einzeltests und 60/60 Chromiumfällen bestanden (2,6 Minuten).
Kompakte Hilfe über echte Klicks geöffnet, Scroll-/Diagnosefälle weiter bestanden.
Profil-Speicherung, alte Passwortfächer, Umstellung, Löschung über zweites Fenster,
unveränderte Budgets und Layout bei großer Schrift enthalten. Keine tatsächliche
Provider-/kostenpflichtige Generierung. Native Geräteprüfung durch Nutzer offen.


0.5.0 tatsächlich veröffentlicht: Quellcommit cb25948, gh-pages
b05543e4ea5d8eef0177e953562eef021b7d9bf8, Run 42294382384 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42294382384
Öffentliches commitgebundenes BUILD.json mit Version/Basis/Quelle verifiziert.
Direkter Live-Host weiterhin netzwerkbedingt nicht erreichbar; kein behaupteter
nativer Windows-/Android-Test. Keine kostenpflichtige Anfrage, keine neue Ablage.


## 0.5.1 – erneuter Bericht „Passwort eingeben“, Key nicht gespeichert

Nutzer bestätigt 0.5.0 und lehnt Zehn-Zeichen-Mindestlänge auch nach der
vorigen Korrektur ab. Originaler Dialog auf nativem Gerät nicht sichtbar;
UI-Verwechslung mit vorangestellter alter Passwortwiederherstellung plausibel,
kein endgültiger Ursachennachweis. Neu-Speichern jetzt vor diesem separaten,
zugeklappten alten Zugang. Neues Formular ohne native allgemeine Passwort-
Validierung; eindeutige API-Key-/Modell-/Freigabemeldung. Geschlossenes
Zusatzpasswortfeld deaktiviert und bei der Anfrage ignoriert. Mindestlänge
zehn vollständig entfernt, einschließlich Krypto-Erzeugung/HTML/Text.

Speichererfolg wird über Lesen des Vault-Datensatzes und Entschlüsseln der
persistierten Kopie bestätigt, nicht über Öffnen des gerade erzeugten RAM-
Objekts. Fehlende, beschädigte oder unerwartete Kopie meldet keinen Erfolg
und keine irreführende Aufforderung zum alten Passwort. Bei Fehlern bleiben
API-Key und freiwilliges Passwort im maskierten Eingabefeld (nur DOM/RAM).
Erst Erfolg leert Felder. Keine Werte in Diagnose/Dateien oder Klartextpersistenz.

Neuer Einzeltest simuliert quittierte, aber verworfene und beschädigte
Schreibvorgänge: beide abgelehnt. Vorhandener Kryptotest öffnet jetzt auch
frei gewähltes kurzes Passwort. Zwei neue Browserfälle: gesperrter Altzugang
hindert Neu-Speichern nicht; ein verdeckter alter Passwortwert wird ignoriert;
fehlende Kostenfreigabe zeigt klare Meldung und erhält Eingabe. Zweites Szenario
speichert freiwilliges Zwei-Zeichen-Passwort und öffnet es nach Neustart.
Altzugang in vorhandenen Tests ausdrücklich über die eigene Gruppe geöffnet.
Touchfortschritt und fehlgeschlagene Speicherung auf erhaltene Eingabe geprüft.

Endgültig npm run test:all mit Typprüfung, Root-/Pages-Builds, 104/104 Einzeltests
und 62/62 Chromiumfällen grün (2,6 Minuten). Keine kostenpflichtige Modellanfrage.
Kein behaupteter nativer Windows-/Android-Nachweis.
