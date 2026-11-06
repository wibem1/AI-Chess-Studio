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

## Aktueller Stand 0.4.1

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
artifacts/Pages-0.4.1-… mit exakter öffentlicher Dateiliste und BUILD.json
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

100 Einzeltests und 57 Chromium-Browserfälle; darunter echter Stockfish,
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

## Kontrolle nach einem ausbleibenden Update

Ein Datei-Upload allein bestätigt keinen Onlinegang. Nach Nutzerbefund wurde
GitHubs Lauf 42245157162 für 73dfea1 überprüft: FAILURE nach 10m44s, deploy-Job
„Timeout reached, aborting!“. Einmalige erneute Übertragung der unveränderten
geprüften 0.3.2-App als 47427bd700213e6b22412dec23c5df9201bb664a erfolgreich:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42253628918 .
Erfolg für genau diesen Commit über Laufstatus, Seitentitel und vollen Commitlink
verifiziert. Kein neuer Workflow und keine zusätzlichen KI-Aufrufe.

`npm run publish:pages` wartet jetzt nach dem Upload auf diese Kontrolle.
Separat: `npm run check:pages` (maximal zwölf Minuten, keine weiteren Pushes).
Bei Failure/Timeout/unklarem Datenformat wird keine fertige Veröffentlichung
behauptet. Der Check nutzt öffentliche GitHub-HTML-Daten, weil die Verwaltungs-
API hier blockiert ist. Formatänderungen können die Kontrolle fehlschlagen lassen;
sie darf dann keinen Erfolg erfinden. GitHub-Erfolg und ein zusätzlicher realer
Browser-/Gerätetest bleiben unterschiedliche Nachweise.

Android: Die App erzeugt keine Meldung „bereits installiert“ und speichert keinen
geräteübergreifenden Installationsstatus. Manifest-ID ./ löst innerhalb des
Projektpfades auf /AI-Chess-Studio/ auf und bleibt stabil. Eine Installation auf
Windows ist kein Nachweis einer Androidinstallation. Die native Chrome-Meldung
muss am konkreten Dialog/Browser geprüft werden; nicht durch wechselnde IDs,
Datenlöschung oder einen behaupteten erfolgreichen Androidtest überdecken.


## Updateanzeige 0.3.3

Die App-Version auf dem letzten Android-Screenshot war bereits 0.3.2, die zu
diesem Zeitpunkt neueste veröffentlichte Fassung. Eine Verknüpfung ändert den
Updateweg nicht. Ab 0.3.3 meldet die Prüfung ausdrücklich „Version … ist aktuell“,
wenn der Server keinen neuen Worker liefert; Download/Fehler/bereit sind getrennt.
Übernahme weiterhin unter Einstellungen → App auf diesem Gerät → Web-App auf
Updates prüfen → Zustimmung zum Sichern/Neuladen → Bereites Web-Update übernehmen.
Eine native Installation ist für diesen Ablauf nicht erforderlich.


0.3.3 tatsächlich veröffentlicht: Quellcommit 63ef08fbe38b0186295d2a21cd41e1b700877a65,
gh-pages 69149dcee15182f8199f15ee20b11405a895d5ee, GitHub-Run 42273159023 SUCCESS.
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42273159023
Öffentliches BUILD.json nach Upload: Version 0.3.3, Basis /AI-Chess-Studio/ und
exakter Quellcommit stimmen. Eigene Live-/native Android-Abnahme bleibt getrennt.


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


0.4.1 tatsächlich bereitgestellt: Quellcommit 9626a023c6158db36060c584eec50c245b30ddba,
gh-pages 9a8785e55c760e077338b68c9a98e579a74dabfe, Run 42290733124 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42290733124
Commitgebundenes öffentliches BUILD.json mit Version/Basis/Quelle überprüft.
Keine direkte Live-Host-/native Windows-Abnahme im netzwerkbeschränkten Runner.
Code und Prüf-/Projektstand gemeinsam auf work; kein neuer Workflow oder API-Test.
