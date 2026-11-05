# Projektstand

Stand: 5. November 2026

## Ziel

Lokales strategisches Schachlabor: Pläne, Gegenpläne, Varianten, Gedächtnis und
menschliche Spielbarkeit. Stockfish ausschließlich als expliziter Faktencheck.

## Belegter Bestand

- Globale und lokale Regeln gelesen; vorheriger Stand f361b1e bleibt erhalten.
- Phasen 1/2: deutsche lokale Oberfläche, legale Brett-/SAN-Züge, Variantenbaum,
  Planwerkstatt, Gedächtnis und validierter JSON-Datei-/Textimport.
- Phase 3: serverseitiger OpenAI-Transport implementiert; kein echter Modelltest.
  Simulation bleibt verfügbar und ausdrücklich gekennzeichnet.
- Phase 4: echter lokaler Stockfish 19 Lite WASM getestet, nur auf Klick;
  Kandidaten, Suchwerte, legale Varianten und Bedingungen stellungsgebunden.
- Nutzerwunsch umgesetzt: direkte Eingabe des API-Schlüssels in der App,
  dauerhafte lokale Speicherung außerhalb des Repositorys, Laden nach Neustart,
  explizites Löschen. Keine Schlüssel in Browser-Storage, Export oder Diagnose.
- Windows: benutzergebundene DPAPI-Verschlüsselung implementiert (nicht nativ
  getestet); Linux: Datei/Ordner 0600/0700 und Neustart/Löschen real geprüft.
- Diagnose für lokale Konfiguration sowie OpenAI-Modellmetadaten ohne
  Textgenerierung. Bereinigte Fehlermeldungen ohne Schlüssel/Providerdetails.
- Kostenkontrolle mit persistiertem Verbrauch, einstellbaren Preisannahmen und
  Budget, konservativer Reservierung vor Aufruf, bestätigten Tokenzahlen,
  maximal drei Anfragen pro Periode/Serverstart, explizitem Perioden-Neustart.
- Updatefunktion: Quelle/Branch work/Ziel geprüft, ausdrückliche Zustimmung,
  sauberes Repository, Fast-forward ohne Force/Reset, npm ci und Unit-Prüfung,
  Status/Fehler/Neustarthinweis. Git-Abläufe isoliert simuliert, kein Live-Update.
- Normaler lokaler Anwendungsserver über npm start; Windows-Doppelklickstarter
  mit Browseröffnung implementiert (Linux-Ausführung geprüft, Windows ausstehend).
- Typprüfung, Build, 47 Einzeltests und 12 echte Chromium-Browsertests bestanden;
  kein fehlgeschlagener/übersprungener Test. docs/VALIDATION.md.

- Lokales Startpaket vorbereitet: portable offizielle Windows-x64-Node.js-24.22.2-
  Laufzeit (SHA-256 gegen nodejs.org geprüft), kurze Anleitung, Starter und
  reproduzierbarer Packager. Keine Schlüssel/Benutzerprofile im Paket.
  Frische Git-Metadaten erhalten die spätere Updatefähigkeit; Git bleibt dafür
  eine optionale zusätzliche Voraussetzung. Keine native Windows-Freigabe.

## Grenzen

Keine reale KI-Antwort nachgewiesen; bisher fehlt ein nutzbarer realer Schlüssel
in dieser Laufzeit. Nutzer hat bis zu drei begrenzte reale Testversuche erlaubt;
diese Freigabe nicht erneut erfragen. Kein Schlüssel im Chat anfordern.

Cloud-Konfigurationsänderungen waren trotz Nutzer-Speichern/Veröffentlichen
bei diesem Chat nicht als aktive Bindungen sichtbar. Daher ist lokale
PC-Schlüsseleingabe jetzt der bevorzugte Weg. Speicherung erfolgt auf dem
Rechner des App-Servers; bei Cloudbetrieb also nicht auf dem Windows-PC.
Verwaltete Netzfreigaben bleiben unabhängig davon erforderlich.

Kosten sind Schätzungen zu editierbaren Preisannahmen, kein verbindliches
Anbieter-Geldlimit. Unklare Abrechnung bleibt konservativ reserviert. Eine
App-Instanz pro Benutzerprofil nutzen. Fehlgeschlagenes Update kann einen
unvollständigen Installationsstand hinterlassen; kein atomarer Rollback
behauptet. Vorheriger Quellstand bleibt in Git erhalten.

Keine native Windows-/DPAPI-Abnahme und keine manuelle Nutzerabnahme.
Keine Veröffentlichung, kein Deployment/Release, keine Actions und keine
kostenpflichtige Textgenerierung durch den Agenten ausgeführt.

## Nächster einzelner Schritt

Die lokale Windows-App starten, einmalig den Schlüssel in der App speichern,
Preisannahmen/Budget prüfen, Diagnose ausführen und den autorisierten kleinen
realen Plan-/Gegenplan-Test prüfen. Danach echten Nachweis samt Projektstand
sichern. Schlüssel nicht exportieren; ohne weitere Freigabe keine unbegrenzten
kostenpflichtigen Tests oder automatische API-Anfragen durchführen.
