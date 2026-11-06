# Web-App bereitstellen

Der Nutzer hat die Veröffentlichung der Web-App am 6. November 2026 ausdrücklich
beauftragt. Bereitstellungsstand: 0.3.0. Öffentliches Hosting ist noch **nicht**
aktiv: kein Hostingkonto verbunden; `gh api repos/wibem1/AI-Chess-Studio` wird in
dieser Sitzung mit Forbidden abgewiesen. Git-Branchzugriff ersetzt keine
Berechtigung zur Einrichtung von GitHub Pages. Kein Konto/Bezahldienst angelegt,
keine Sichtbarkeit geändert und kein Actions-Workflow eingerichtet.

## Fertiges Paket

`artifacts/AI-Chess-Studio-Web-0.3.0.zip` enthält nur den gebauten statischen
Inhalt von `web-dist`, mit index.html unmittelbar im ZIP-Stamm. Keine Node-
Server, Profile, API-Schlüssel, Sitzungen, Entwicklungsabhängigkeiten oder .env.
Lizenz/Quellverweis für Stockfish und vollständige chess.js-Lizenz enthalten.
Die Dateien unter artifacts sind ignorierte Ausgaben, keine Engine-Binaries in Git.

Reproduzieren: Node 24 und unverändertes Lockfile, `npm ci`, `npm run test:all`,
dann ausschließlich den Inhalt von `web-dist` als ZIP packen. Version immer aus
package.json; package-lock.json synchron. Öffentliche Dateien `_headers`,
`licenses.html` und `licenses/chess.js-LICENSE.txt` werden beim Build kopiert.

## Einfacher manueller Hostingweg

Wenn noch kein eigener Webspace existiert, ist ein statischer Hostinganbieter
mit manuellem Upload geeignet, beispielsweise Netlify Drop:
https://app.netlify.com/drop . Dafür ist ein eigenes Anbieterkonto erforderlich.
Der Nutzer meldet sich dort selbst an; kein Passwort oder API-Key im Chat.
Keine kostenpflichtigen Anbieteroptionen oder eigenen Domains buchen.

1. Web-Paket herunterladen und entpacken.
2. Bei Netlify anmelden und den entpackten Ordner mit index.html hochladen.
3. Die dort tatsächlich angezeigte HTTPS-Adresse öffnen. Keine URL erfinden.

Es ist kein npm-Build beim Hosting nötig. `_headers` gibt für Netlify/kompatible
Hosts CSP, Referrerschutz, WASM-MIME und revalidierte Worker/Index-Dateien vor.
Andere Hosts müssen entsprechende Header selbst konfigurieren. Das Paket braucht
das Stammverzeichnis einer Website, keinen Unterpfad wie /AI-Chess-Studio/.
GitHub Pages im Projekt-Unterpfad wird daher nicht ungeprüft als Ziel angeboten.

## Nach tatsächlicher Bereitstellung prüfen

- HTTPS, korrekte Version 0.3.0, alle vier Tabs; keine horizontalen Überläufe.
- Browser-Stockfish zieht auf bewussten Partiestart, Wasm kommt vom eigenen Host.
- Offline-Bereitschaft abwarten, Seite offline neu laden, Sitzung wiederhergestellt.
- Lizenz- und Quelllinks funktionieren; Hosting-CSP/Cache-/WASM-Header kontrollieren.
- Schlüssel wird nur nach eigener Eingabe verschlüsselt lokal gespeichert;
  Neuladen sperrt. Keine automatische Textgenerierung zum Deploymenttest.
- Öffentliche URL und Ergebnis in PROJECT_STATE/VALIDATION nachtragen. Vorher
  keine erfolgreiche Veröffentlichung oder vollständige Geräteabnahme behaupten.

Die Website liefert nur App-/Engine-Dateien aus. Eigene Sitzungen und das
verschlüsselte Schlüsselfach bleiben im jeweiligen Browser; bewusste KI-Anfragen
gehen direkt an OpenAI. Die lokale Desktop-Adresse und die neue HTTPS-Adresse
haben getrennte Speicher. Sitzung bei Bedarf als JSON übertragen; Schlüssel auf
dem neuen Gerät einmal hinterlegen. Vorhandene Cloud-Entwicklungsumgebung hat
mit der installierten Web-App nichts zu tun.

Paketprüfung: ZIP-CRC vollständig geprüft, 16 öffentliche Dateien, index.html im
Stamm, Version 0.3.0 im Buildmanifest. SHA-256:
`403f030ff10afe53dc60397d7b9d9bd609038af94ecdbbb2cb57f07e93617202`.
