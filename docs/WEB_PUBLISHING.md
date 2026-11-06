# GitHub Pages im bestehenden Chess-Studio-Repository

Nutzerentscheidung: **kein neues Repository**. Ausschließlich das vorhandene
`wibem1/AI-Chess-Studio` verwenden. Kein neues Repository wurde angelegt; der
vorangegangene Anlegeversuch war schon bei einer lesenden Benutzerabfrage mit
Forbidden gescheitert. Netlify ist wegen der Kontingente keine gewünschte Lösung.

## Öffentliche Website und Repository-Sichtbarkeit

Der Nutzer hat die bestehende Ablage selbst auf **Public** gestellt und dies
bestätigt. Öffentlicher HTTP-Abruf des Repositorys liefert jetzt 200. Die dafür
nötige Freigabe ist damit vorhanden; nicht erneut nach der Sichtbarkeit fragen.
Kein neues Repository, keine weitere Sichtbarkeitsänderung durch den Agenten.
Die GitHub-Verwaltungs-API `/repos/wibem1/AI-Chess-Studio/pages` liefert auch nach
dieser tatsächlichen Änderung weiterhin Forbidden. Native Git-Berechtigung und
Pages-Verwaltungsberechtigung bleiben getrennt zu prüfen.

Vor der Freigabe fand ein heuristischer Scan aller 30 vorhandenen Revisionen
keine Treffer für verbreitete API-Key-/GitHub-Token-/Private-Key-Muster; keine
Werte ausgegeben. Das ist kein allgemeiner Nachweis über sämtliche privaten
Inhalte in einer Historie.

## Aktueller Stand 0.3.2

`npm run build:pages` erzeugt `pages-dist` für **/AI-Chess-Studio/**.
Worker, Links, Manifest, Startadresse, Icons, Lizenzen und Offline-Cache sind auf
diesen Unterordner abgestimmt. Root-Build und Desktopbetrieb bleiben unterstützt.
`.nojekyll` enthalten; HTML-CSP ergänzt, weil GitHub Pages `_headers` nicht
verarbeitet. HTTP-Header wie frame-ancestors/Referrer-Policy werden durch eine
Meta-CSP nicht vollständig ersetzt. Keine Behauptung eines persönlichen Logins.

```sh
npm ci
npm run test:all
node scripts/publish-pages.mjs --prepare-only
```

`--prepare-only` erzeugt ausschließlich lokal einen neuen Ordner unter
artifacts/Pages-0.3.2-… mit exakter öffentlicher Dateiliste und BUILD.json
(Version, Quellcommit, SHA-256 je Datei). Keine Schlüssel, Sitzungen, Profile,
Node-Server oder Entwicklungsdateien. Das frühere Root-ZIP 0.3.0 bleibt erhalten
und ist nicht das neue Unterordner-Paket.

## Veröffentlichung und spätere Updates

Der Publisher nutzt ausschließlich den Branch **gh-pages im bestehenden
Repository**. Der Codebranch und dessen Historie werden nicht überschrieben.
Auf gh-pages werden die gebauten Web-Dateien veröffentlicht. Ein neuer Stand
hängt als weiterer Commit an; keine erzwungenen Pushes. Fremde Zielinhalte
oder eine andere Zielanwendung blockieren den Vorgang. WebAssembly liegt für
Pages auf diesem Distributionsbranch; nicht im Entwicklungsbranch.

Nach einmaliger Einrichtung lautet der manuell gestartete Updatebefehl:

```sh
npm run publish:pages
```

Der Befehl führt zuerst alle App-Tests und beide Builds aus und überträgt dann
nur die öffentlichen Dateien nach gh-pages. Keine eigenen GitHub-Actions-
Workflows werden eingerichtet. GitHub Pages unterliegt eigenen Nutzungsgrenzen;
keine unbegrenzte Zahl von Updates oder unbegrenzter Datenverkehr zugesagt.

Repository-Sichtbarkeit ist bereits öffentlich. Nach Übertragung des gh-pages-
Branches einmal unter **Settings → Pages** einstellen:
**Deploy from a branch → gh-pages → / (root) → Save**.
Danach die von GitHub tatsächlich angezeigte HTTPS-Adresse prüfen. Erwarteter
Pfad ist `/AI-Chess-Studio/`; Live-Erreichbarkeit erst nach Prüfung bestätigen.

Die GitHub-Verwaltungs-API liefert hier Forbidden; Git-Push-Rechte sind kein
Nachweis für Sichtbarkeits-/Pages-Verwaltungsrechte. Eine notwendige manuelle
Einstellung nicht als automatisch erledigt ausgeben. Kein kostenpflichtiger
Tarif, keine neue Domain oder andere Anbieterleistung beauftragt.

## Prüfung

94 Einzeltests und 52 Chromium-Browserfälle; darunter echter Stockfish,
Unterordner-Manifest/Scope, Offline-Reload mit pausierter Partie/Entwurf und
Lizenznavigation ohne Root-Requests. Der Publisher ist mit echten lokalen Git-
Repositories auf Erstveröffentlichung, fortlaufende gh-pages-Historie,
unveränderten Codebranch und Abbruch bei fremden Dateien getestet. Diese Tests
sind auf file:// beschränkt und veröffentlichen nichts extern.

Nach tatsächlicher Pages-Aktivierung HTTPS, sichtbare Version, Wasm-MIME,
Installation, Offline-Restore und bestätigte Updates an der echten Adresse
prüfen. Live-Abnahme, echte KI-Qualität, native Geräte und Nutzer-PGN bleiben
offen. Sitzungen und verschlüsselter Key bleiben im jeweiligen Browser; eine
neue Domain hat einen eigenen Speicher, Übertragung von Partien erfolgt per JSON.

## Tatsächlich ausgeführte Übertragung

work: **6f747c2**. Web-Stand 0.3.1 erfolgreich als neuer Branch gh-pages im
bestehenden Repository gesichert: **82d92273eb8a6abc40555a7ca126fc3b41db05c7**.
`git ls-remote` bestätigt diesen Branch. Keine neue Ablage angelegt.
Die Pages-Einstellung über die Verwaltungs-API bleibt blockiert. Der direkte
Live-Prüfversuch wird vom Netzwerkproxy mit CONNECT 403 (HTTP 000) abgewiesen;
daraus folgt keine Aussage über den tatsächlichen HTTP-Status der Website.
Einmalige Pages-Quellwahl und Live-Bestätigung durch GitHub/Nutzer sind noch offen.
