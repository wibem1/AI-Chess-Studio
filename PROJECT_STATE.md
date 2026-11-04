# Projektstand

Stand: 4. November 2026

## Ziel

Dialogorientiertes strategisches Schachlabor mit Plandiskussion, gegnerischen
Möglichkeiten, Variantenbaum, strategischem Gedächtnis und menschlicher
Spielbarkeit. Stockfish ausschließlich als optionaler taktischer Faktencheck.

## Belegter Bestand

- Globale und lokale Regeln vollständig gelesen; sauberer Phase-2-Ausgangsstand
  76bc06c erhalten (Phase 1: 51ba463).
- Lokale deutsche Oberfläche mit legalen Brett-/SAN-Zügen, Variantenbaum,
  Planwerkstatt, stellungsbezogenem Gedächtnis und JSON-Datei-/Textimport.
- Simulation bleibt voreingestellt und ausdrücklich gekennzeichnet.
- Phase 3 vorbereitet: serverseitiger OpenAI-Chat-Completions-Transport,
  gleichursprüngliche lokale API und getrennt auswählbarer realer Dialogmodus.
- Schlüssel ausschließlich serverseitig; bewusste Freigabe und Modellname
  erforderlich. Standardmäßig gesperrt. Keine Secrets eingerichtet.
- Begrenzter Kontext, validierte FEN/Züge und Antworten, bereinigte Fehler;
  800 Completion-Tokens, 15 Sekunden, keine Retries, eine parallele Anfrage,
  drei Versuche je Serverprozess. Kein dauerhaftes Geldlimit.
- Modellherkunft als Hypothese serialisierbar; Antworten bleiben am Anfrageknoten
  und werden bei Sitzungsersatz verworfen.
- Strikte Typprüfung und Web-Build bestanden; 23 Einzeltests und sieben
  echte Chromium-Browsertests bestanden, keine fehlgeschlagen/übersprungen.
  Provider- und Modell-API-Antworten ausschließlich lokal ersetzt.
  Prüfgrundlage: docs/VALIDATION.md.

## Blocker und Grenzen

Keine reale Modellanfrage ausgeführt oder freigegeben; Phase 3 deshalb nicht
vollständig mit realem Anbieter validiert. Vorhandene Konfiguration und
Variablennamen geprüft: kein CHESS_API_KEY, CHESS_MODEL oder
CHESS_ENABLE_PAID_API vorhanden. api.openai.com nicht zusätzlich freigegeben.
Keine API-Schlüssel im Browser/Repository. Keine kostenpflichtigen Aufrufe,
Veröffentlichungen, Deployments oder Actions. Stockfish fehlt weiterhin.

Der statische Web-Build enthält keinen API-Server; die lokale Anbindung läuft
über npm run dev. Daten bleiben bis zum JSON-Export im Arbeitsspeicher.
Manuelle Nutzerabnahme ist noch offen; nicht als erfolgt behaupten.

## Nächster einzelner Schritt

Phase 3 real prüfen, sobald ausdrücklich kostenpflichtige Modelltests erlaubt
und Modell, sichere serverseitige Schlüsselbindung sowie Netzzugang festgelegt
sind. Anbieter-Geldlimit separat einrichten; Prozess-/Tokenlimits ersetzen es
nicht. Dann einen begrenzten realen Plan-/Gegenplan-Durchlauf einschließlich
Fehlerfall und Herkunft prüfen und Ergebnisse gemeinsam sichern. Bis dahin
bleiben Simulation und alle lokalen Tests ohne Provideraufrufe nutzbar.
