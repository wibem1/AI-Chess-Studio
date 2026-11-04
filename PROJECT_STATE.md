# Projektstand

Stand: 4. November 2026

## Ziel

Dialogorientiertes strategisches Schachlabor mit Plandiskussion, gegnerischen
Möglichkeiten, Variantenbaum, strategischem Gedächtnis und menschlicher
Spielbarkeit. Stockfish ausschließlich als optionaler taktischer Faktencheck.

## Belegter Bestand

- Globale und lokale Regeln gelesen; letzter verifizierter Stand c4acb74 erhalten.
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
- Reproduzierbare Lockfile-Installation, Typprüfung und Web-Build bestanden;
  32 Einzeltests und neun echte Chromium-Browsertests bestanden, keine
  Fehler/übersprungenen Tests. Reale lokale Engine-Mattprüfungen für beide Farben
  und vollständiger Browser-/HTTP-Durchlauf nachgewiesen. docs/VALIDATION.md.

## Blocker und Grenzen

Phase 3 real weiterhin offen: keine Autorisierung kostenpflichtiger Aufrufe,
kein gewähltes reales Modell, keine sichere Schlüsselbindung und keine zusätzliche
Netzfreigabe für api.openai.com. Keine Secrets im Browser/Repository.
Providerprüfungen verwenden ausschließlich lokale Fixtures, kein KI-Qualitätsnachweis.

Stockfish arbeitet mit FEN ohne Wiederholungshistorie/Tablebases. Die Lite-Engine
nutzt ein kleineres Netz als die volle Engine. UCI-Knoten-/Zeitgrenzen sind
intervallgeprüft, kein exaktes CPU-Limit. Lizenzhinweise: THIRD_PARTY_NOTICES.md.

Node-Server über npm run dev erforderlich; statischer Build enthält weder Modell-
noch Engine-API. Sitzungsdaten bis zum Export nur im Arbeitsspeicher.
Keine manuelle Nutzerabnahme, keine Veröffentlichung/Deployments/Actions,
keine kostenpflichtigen Modellaufrufe.

## Nächster einzelner Schritt

Lokalen Anwendungstest mit dem Nutzer durchführen: Stellung spielen, Plan in der
Simulation diskutieren, Variante abzweigen, eigenen Kandidaten explizit mit
Stockfish prüfen, Sitzung exportieren und wiederherstellen. Reale KI danach
nur bei ausdrücklicher Kostenfreigabe, Modellwahl, sicherem Schlüssel und
Netzfreigabe testen; diese Voraussetzungen bleiben offen.
