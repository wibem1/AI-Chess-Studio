# Projektstand

Stand: 4. November 2026

## Ziel

Dialogorientiertes strategisches Schachlabor mit Plandiskussion, gegnerischen
Möglichkeiten, Variantenbaum, strategischem Gedächtnis und menschlicher
Spielbarkeit. Stockfish ausschließlich als optionaler taktischer Faktencheck.

## Belegter Bestand

- Globale und lokale Regeln gelesen; letzter verifizierter Stand 3372613 erhalten.
- Phasen 1/2: lokale deutsche Oberfläche mit legalen Brett-/SAN-Zügen,
  Variantenbaum, Planwerkstatt, Gedächtnis und JSON-Datei-/Textimport.
- Phase 3 vorbereitet: serverseitiger OpenAI-Transport, sichere Schlüsseltrennung,
  begrenzter Kontext und getrennt auswählbarer realer Dialogmodus. Keine reale
  Modellvalidierung; Simulation bleibt voreingestellt, reale KI gesperrt.
- Phase 4 implementiert und mit realer lokaler Komponente getestet:
  Stockfish.js 19.0.1 / Stockfish 19 Lite WASM, single-threaded, nur auf Klick.
  Optional eigener Kandidat, keine automatische Bewertungsleiste/Zugvorgabe.
- Enginebefunde mit weißer Werteperspektive, legaler untersuchter Variante,
  Kandidat und Suchbedingungen; als separate stellungsgebundene factchecks
  serialisiert. Verspätete Befunde bleiben am Anfrageknoten; nach Import verworfen.
- Grenzen: Tiefe 12 / 20.000 Knoten / 1 s Suchzeit, 1 Thread, 16 MiB Hash;
  Prozess-Timeout 8 s, maximal eine Prüfung gleichzeitig. Suchwerte gelten nur
  unter diesen Bedingungen, keine absolute strategische Wahrheit.
- Lokaler Abschluss: npm run build und npm start liefern Oberfläche und beide
  APIs ohne Vite-Entwicklungsserver. Nur gebaute öffentliche Assets werden
  ausgeliefert, keine Repository-/Secret-Dateien; lokale Herkunft und CSP geprüft.
- Reproduzierbare Lockfile-Installation, Typprüfung und Web-Build bestanden;
  33 Einzeltests und neun echte Chromium-Browsertests bestanden, keine
  Fehler/übersprungenen Tests. Reale lokale Engine-Mattprüfungen für beide Farben
  und vollständiger Browser-/HTTP-Durchlauf nachgewiesen. docs/VALIDATION.md.

## Blocker und Grenzen

Phase 3 real weiterhin offen: Nutzer hat inzwischen einen kleinen realen
KI-Funktionstest freigegeben (höchstens drei Versuche in dieser Aufgabe,
jeweils maximal 800 Completion-Tokens, keine automatische Wiederholung).
Als Modell ist gpt-4.1-mini vorbereitet. Im Cloud-Entwurf gespeichert:
CHESS_MODEL=gpt-4.1-mini, CHESS_ENABLE_PAID_API=1, Secret-Anforderung
CHESS_API_KEY ausschließlich für api.openai.com und aktualisierte Startanweisungen.
Die Secret-Destination wurde der gewünschten Netzwerkfreigabe hinzugefügt.
Der tatsächliche Schlüssel fehlt; laufende Umgebung hat keine CHESS_*-Bindungen.
Entwurf gespeichert bedeutet nicht angewendet oder veröffentlicht.
Keine Secrets im Browser/Repository; kein realer Modellaufruf ausgeführt.
Providerprüfungen verwenden ausschließlich lokale Fixtures, kein KI-Qualitätsnachweis.

Stockfish arbeitet mit FEN ohne Wiederholungshistorie/Tablebases. Die Lite-Engine
nutzt ein kleineres Netz als die volle Engine. UCI-Knoten-/Zeitgrenzen sind
intervallgeprüft, kein exaktes CPU-Limit. Lizenzhinweise: THIRD_PARTY_NOTICES.md.

Gebauter lokaler Anwendungsserver mit npm start fertiggestellt und geprüft;
Entwicklungsserver weiterhin mit npm run dev verfügbar. Der reine statische
Web-Build allein enthält weder Modell- noch Engine-API. Sitzungsdaten bis zum Export nur im Arbeitsspeicher.
Keine manuelle Nutzerabnahme, keine Veröffentlichung/Deployments/Actions,
keine kostenpflichtigen Modellaufrufe.

## Nächster einzelner Schritt

Der lokale Funktionsumfang ist implementiert und automatisiert geprüft.
Noch offen bleibt die Nutzerabnahme (nicht durch automatisierte Tests ersetzt): Stellung spielen, Plan in der
Simulation diskutieren, Variante abzweigen, eigenen Kandidaten explizit mit
Stockfish prüfen, Sitzung exportieren und wiederherstellen. Reale KI danach
nach sicherer Schlüsseleingabe und Anwendung der gespeicherten Umgebungseinstellungen
testen. Vor dem Aufruf aktuelle Bindungen und Netzfreigabe prüfen. Die vorhandene
Freigabe für bis zu drei begrenzte Testversuche nicht erneut erfragen; sie ist
keine Freigabe für unbegrenzten Dauerbetrieb. Nach dem Test bezahlten Modus
wieder deaktivieren, sofern der Nutzer keine weitere Nutzung freigibt.
