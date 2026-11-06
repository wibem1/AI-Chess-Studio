# Gemeinsame Plattformbasis

Ziel: eine persönliche deutschsprachige Schach-Lern-App für Windows, macOS,
Android und iPadOS. Die gemeinsame responsive Web-App ist der primäre Weg;
native Hüllen sind optional. Der aktuelle geprüfte und veröffentlichte Stand steht in PROJECT_STATE.md.
Native Geräteabnahme bleibt offen.

## Gemeinsamer Kern und Betriebsarten

`src/` enthält Zustand, Regelprüfung, Varianten, eigene Gedanken und
Lernverträge ohne Node-/Windows-Abhängigkeiten. Spielmodus und Lernmodus teilen ein Brett.
Enginegegner, zusätzliche taktische Prüfung und KI-Lernbegleiter sind getrennt.
`PlayingEngine`, `TacticalAdapter` und `DialogueAdapter` bleiben Austauschgrenzen.
`model-contract.ts` und `costs.ts` teilen Dialogprüfung und Kostenlogik zwischen
Browser und Desktop; filesystem/DPAPI/Git bleiben in `server/`.

| Funktion | Eigenständiger Webbetrieb | Bisheriger Desktopbetrieb |
| --- | --- | --- |
| Auswahl | Statischer Host, installierte PWA oder explizit `?platform=web` | Erreichbare lokale Node-API |
| Spielen | Stockfish-Lite-WASM oder Maia-2-Blitz-ONNX im Browserworker | Stockfish-Prozess oder dieselben Browser-Worker |
| Zusätzlicher Faktencheck | Eigener WASM-Worker auf Klick | Lokaler Stockfish-Prozess auf Klick |
| KI-Dialog | Direkter CORS-HTTPS-Aufruf zu OpenAI nach Freigabe | Lokaler HTTP-Adapter, dann HTTPS zu OpenAI |
| Schlüssel | AES-GCM-verschlüsselte IndexedDB; Gerätepasswort nicht gespeichert; Klartext nur RAM | Windows-DPAPI-Dateiprofil; POSIX privat, derzeit unverschlüsselt |
| Kosten | IndexedDB, atomare Reservierungen über Fenster hinweg | Persistente private JSON-Datei |
| Sitzung | Automatisch lokal in IndexedDB plus bewusster JSON-Export | RAM plus bewusster JSON-Export |
| Update | Neuer Service Worker wartet auf Zustimmung und erfolgreiche Sicherung | Bestätigtes Git-/npm-Update mit Schutz eigener Änderungen |

Der vorhandene Node-Server bleibt an Loopback gebunden. Keine Netzfreigabe,
öffentliche Bereitstellung oder neue Authentifizierungsbehauptung. Der statische
Build braucht HTTPS oder localhost, am Domain-Stamm oder im konfigurierten Unterverzeichnis; file:// ist nicht unterstützt.
Ein Backend-Ausfall beim Start wählt den Webbetrieb; im geöffneten Fenster gibt
es keinen stillen Wechsel zwischen den getrennten Schlüssel-/Kostenprofilen.

## Lokale Schlüssel und Transport

Entsprechend dem ausdrücklichen Nutzerwunsch nach lokalem Schlüssel in einer
Web-App wird ausschließlich verschlüsselter Inhalt im Browser dauerhaft gespeichert.
Kein Klartextschlüssel in Browser-Storage, Sitzungen, Diagnose oder Offline-Dateien.
Standard ab 0.5.0: AES-GCM-256, zufälliger 12-Byte-IV, Formatbindung als AAD,
nicht exportierbarer CryptoKey zusammen mit Ciphertext in IndexedDB (ein atomarer
Vault-Datensatz, Format 2). Automatisches lokales Öffnen ohne zusätzliches
App-Passwort und ohne Provideraufruf. Dieses Modell schützt nicht vor Same-Origin-
Code oder einem zugänglichen Browserprofil; kein OS-/Hardware-Schlüsseltresor.

Optionaler und vorhandener Passwortschutz bleibt Format 1: PBKDF2-SHA256 mit
250.000 Iterationen, Salt 16 Byte, AES-GCM-256; Passwort nicht persistiert.
Format 1 wird nicht automatisch überschrieben. Nach Entsperren explizit auf
Profilmodus umstellen, ohne Kostenperiode oder Partie zu verändern. Explizites
Sperren bleibt im jeweiligen Fenster wirksam; Änderungen/Löschen anderer Fenster
invalidieren RAM-Zugang über BroadcastChannel. Kein Schlüssel-Sync zwischen Geräten.

OpenAI ist der einzige Provider-Zielhost: feste HTTPS-Pfade, keine Weiterleitung,
keine Cookies/Referrer, CORS, 15 Sekunden, maximal 800 Ausgabe-Tokens und 64 KiB
Antwort. Keine automatischen Zugangs-/Generierungsaufrufe beim Speichern,
Entsperren, Tabwechsel oder PGN-Import. Metadatenprüfung nur ausdrücklich.
Kontext, Humanfaktor, Kandidaten und Antwortformat werden gleich wie am Desktop
validiert. Providerfehler geben keine Rohantwort/Schlüssel aus. Reales Provider-
CORS und pädagogische Antwortqualität wurden nicht mit einem echten Key geprüft.

Kostenreservierungen laufen in jeweils einer IndexedDB-Lese-/Schreibtransaktion,
sodass mehrere Fenster die Periode nicht gleichzeitig überbuchen können.
Maximal drei Versuche je Fenster und Periode, konservative Reservierung bei
unklarem Verbrauch, keine Retries. Preisannahmen sind Schätzwerte, kein hartes
Anbieter-Geldlimit. Web-/Desktopbudgets sind getrennt; Wechsel setzt kein Profil
zurück. Sperr-/Änderungssignal per BroadcastChannel enthält keine Zugangsdaten.

## Engine, Daten und Offlineweg

Stockfish 19.0.1 Lite-Single wird unverändert mit GPL-Lizenz und Quellverweis
selbst ausgeliefert, kein CDN. Ein Thread, Hash 16 MiB, Tiefe 12/20.000 Knoten,
200–1000 ms für Spielzüge; Faktencheck 1000 ms. Acht Sekunden Gesamtfrist,
64 KiB Ausgabe, Workerende bei Erfolg/Fehler/Abbruch. Keine COOP-/COEP- oder
SharedArrayBuffer-Voraussetzung. Volle geprüfte Historie beim Spielgegner und
beim Faktencheck importierter Partien; historischer Wiederholungsschutz bleibt.

Sitzungsformat 1/2 bleibt plattformneutral. Browserdaten sind an Adresse, Port
und Profil gebunden; mehrere Fenster teilen die zuletzt gespeicherte Sitzung.
Schreibreihenfolge wird serialisiert; ungültige gespeicherte Daten werden nicht
stillschweigend überschrieben. Nach Restore pausiert die Partie. JSON ist der
unabhängige Backup-/Gerätewechselweg, keine Cloud-Synchronisierung.

Der Service Worker cached eine beim Build erzeugte exakte Liste öffentlicher
Dateien (Index, gehashte JS/CSS, Manifest/Icons, Engine und Lizenz). Inhaltsbasierter
Cache-Name; weder APIs noch externe Hosts, POSTs oder Query-Asset-URLs werden
gecached. Sitzungen liegen separat in IndexedDB. Nach vollständiger Vorbereitung
startet die Web-App offline und kann lokal spielen/lernen; reale KI braucht Netz.
Neue Worker aktivieren ein Update erst nach Zustimmung und erfolgreicher Sicherung,
kein automatisches Neuladen einer laufenden Partie. Alte eigene Shell-Caches
werden bei Aktivierung entfernt. Keine native Store-/Updateprüfung behauptet.

## Nachgewiesen und offen

Linux-Chromium prüft reale WASM-Spielzüge auf fünf Stufen, browserlokalen
Faktencheck, Touchgrößen, verschlüsseltes Schlüsselfach, Kostenkonkurrenz,
Sitzungsrestore, echten Offline-Reload und bestätigte Worker-Updateübernahme.
Providerantworten sind Fixtures. Native Windows-Touch/DPAPI, macOS/Safari,
Android und iPadOS sowie echte KI-Lernqualität und die vollständige Nutzer-PGN
1Vh80QL2 sind noch nicht abgenommen. Details: docs/VALIDATION.md.

## Maia-2 ab 0.7.0

`PlayingEngine` bleibt die Schnittstelle. Der Maia-Worker lädt erst beim
ausdrücklichen Spielzug das fest versionierte ONNX-Modell und die WASM-Laufzeit
vom eigenen Host, prüft den Fingerabdruck und nutzt den CPU-Provider mit einem
Thread. Keine Python-/Node-/WebGPU-Abhängigkeit im Frontend. Der Seiten-Worker
reagiert während der Inferenz; Pausieren beendet den Inferenzworker und verwirft
verspätete Ergebnisse. Eigene Cache-API-Ablage für unveränderliche Modelldateien;
nicht Teil des verpflichtenden Offline-Shell-Downloads, keine Zugangsdaten.
Modellfehler pausieren das Spiel; kein stiller Ersatz durch Stockfish.
Die optionale `game.opponent`-Angabe bleibt in JSON-Partien erhalten; vorhandene
Partien ohne Angabe bedeuten weiterhin Stockfish. Details in docs/MAIA.md.
