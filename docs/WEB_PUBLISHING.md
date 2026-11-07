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

## Aktueller Stand 0.5.1

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
artifacts/Pages-0.5.1-… mit exakter öffentlicher Dateiliste und BUILD.json
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

104 Einzeltests und 62 Chromium-Browserfälle; darunter echter Stockfish,
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


0.5.0 tatsächlich veröffentlicht: Quellcommit cb25948, gh-pages
b05543e4ea5d8eef0177e953562eef021b7d9bf8, Run 42294382384 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42294382384
Öffentliches commitgebundenes BUILD.json mit Version/Basis/Quelle verifiziert.
Direkter Live-Host weiterhin netzwerkbedingt nicht erreichbar; kein behaupteter
nativer Windows-/Android-Test. Keine kostenpflichtige Anfrage, keine neue Ablage.


0.5.1 tatsächlich bereitgestellt: Quelle 5cd6b45, gh-pages
3eb4c61bc7ce5b442d28c23211e050243be890a7, Run 42303046331 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42303046331
Öffentliches commitgebundenes BUILD.json mit Version/Basis/Quelle verifiziert.
Direkter Live-Host-/nativer Gerätetest weiterhin offen. Keine neue Ablage,
kein neuer Workflow und keine kostenpflichtige Modellanfrage.


## Veröffentlichung 0.12.0 am 7. November 2026

Quelle 89a7961924297291ad04519209feaf5a38f76533; gh-pages
3e7b58b69fcbdedf9d1ef8f9c05e5150cbf153e1. Unveränderter gesicherter Stand
für /AI-Chess-Studio/ gebaut, öffentliche Dateiliste über bestehenden
GitHub-Zugang als fortlaufender Commit übertragen. Kein neuer Workflow.
Pages-Run 42404462432 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42404462432
Live-BUILD.json vollständig identisch mit vorbereitetem Manifest;
SHA-256 von index.html, service-worker.js, assets/index-BxlHw25U.js und
assets/index-BL6wUJ7P.css bestätigt. Native Nutzer-/Anbieterabnahme getrennt.
Prüfgrundlage 156 Einzeltests und 14 gezielte Browserfälle; kein neu behaupteter
vollständiger Browsergesamtlauf. Keine kostenpflichtige KI-Anfrage.


## Veröffentlichung 0.13.0 am 7. November 2026

Gesicherte Quelle 7bce4c01d21bb8af26c1585f49aebd0a7c56edb5 unverändert
für /AI-Chess-Studio/ gebaut. gh-pages 2333a9f4fcd3fb6e40a00a4c63c2b04bf5fc4c16;
23 öffentliche Dateien, fortlaufender Commit über verbundenen GitHub-Zugang.
Run 42407105406 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42407105406
Direktes Live-BUILD.json vollständig mit vorbereitetem Manifest identisch;
SHA-256 von HTML, Service Worker, assets/index-BJesWPVd.js und
assets/index-umAiEBsq.css bestätigt. Prüfgrundlage 160 Einzeltests und
18 gezielte Browserfälle; kein neuer vollständiger Browsergesamtlauf oder
native Geräte-/echte Anbieterabnahme behauptet. Keine bezahlten KI-Anfragen.


## Veröffentlichung 0.14.0 am 7. November 2026

Unveränderte Quelle 95ce1e8554f9cd82744582df660ec57fba802846 für
/AI-Chess-Studio/ gebaut. gh-pages 1d8c2ac6cafbf20c2cfa3c3ca97222d75cfc8502;
23 öffentliche Dateien als fortlaufender Commit. Kein neuer Workflow.
Pages-Run 42413364798 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42413364798
Live-BUILD.json vollständig mit vorbereitetem Manifest identisch; SHA-256 von
index.html, service-worker.js, assets/index-DlVXQxnY.js und
assets/index-DZAWGkdv.css bestätigt. Prüfgrundlage 162 Einzeltests und
21 gezielte Browserfälle. Kein neuer vollständiger Browsergesamtlauf oder
native Geräte-/echte Modellabnahme behauptet. Keine bezahlten KI-Anfragen.


## Veröffentlichung 0.14.1 am 7. November 2026

Unveränderte Quelle eed1abe4015f6cc4cdff602b7367f4510eb51d1a gebaut;
gh-pages 0bda85c8f7da853a51861973359f8a9d27c732db. 23 öffentliche Dateien,
fortlaufender Commit, kein neuer Workflow. Pages-Run 42414451932 SUCCESS:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42414451932
Live-BUILD.json vollständig mit vorbereitetem Manifest identisch; SHA-256 von
index.html, service-worker.js, assets/index-qIRQUTWd.js und
assets/index-DZAWGkdv.css bestätigt. 162 Einzeltests und 3 betroffene
Browserfälle als Prüfgrundlage; kein neuer vollständiger Browserlauf,
keine native Abnahme oder bezahlte KI-Anfrage behauptet.


## Veröffentlichung 0.15.0 am 7. November 2026 (Europe/Berlin)

Auf ausdrücklichen Nutzerauftrag den gesicherten und geprüften Quellcommit
409d4a83e12ccd28d049362de5102d6ff1a35f86 gebaut und ausschließlich 23 öffentliche
Dateien als cd6895b85317bc8bd66c1dfb6bb6d02781f136ff auf gh-pages übertragen.
Fortlaufende Historie, Ref-Lease gegen 0bda85c; keine neuen Workflows/Provider.
Pages-Run 42422394121 SUCCESS für genau diesen Commit:
https://github.com/wibem1/AI-Chess-Studio/actions/runs/42422394121
Live-BUILD.json bytegleich zum vorbereiteten Manifest; Version 0.15.0 und
Quellcommit bestätigt. SHA-256 von index.html, service-worker.js,
assets/index-BC7uNfVY.css und assets/index-DFG6tH8M.js identisch zum Build.
Root-/Pages-Build bestanden; zusätzlich 1/1 Pages-Browserfall mit echtem
Stockfish, Unterordner und Offline-Restore bestanden. Bereits gesicherte
165 Einzeltests und 8 gezielte Funktionsfälle bleiben separat dokumentiert.
Kein bezahlter Modellaufruf oder neue native Geräteabnahme.
