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
