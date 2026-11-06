# Gemeinsame Plattformbasis

Zielplattformen des Nutzers: Windows, macOS, Android und iPadOS. Das ist eine
langfristige Anforderung, keine Behauptung einer bereits fertigen Mobil-App.
Seit 6. November 2026 ist die gemeinsame browserbasierte App der primäre Weg;
eine installierbare PWA ist das langfristige Ziel, native Hüllen sind optional.
0.2.0 liefert die Tab-Oberfläche. Auf work ist zusätzlich ein Browser-Spielgegner
integriert; Modell-/Schlüsselwege sind noch nicht eigenständig mobil umgesetzt.

## Gemeinsamer Kern

`src/` enthält Schachzustand, Lernpartie, Varianten, Lernangaben und
Dialogverträge ohne Node-/Windows-Imports. `web/` ist eine gemeinsame
responsive HTML-/TypeScript-Oberfläche mit Touch-/Tastaturbedienung. Die vier
Tabs Partie/Lernen/Varianten/Einstellungen teilen dasselbe Brett und behalten
Daten/Entwürfe beim Wechsel; auf kleinen Viewports steht die Navigation unten.
Lerninformationen bleiben im plattformneutralen JSON-Format exportierbar.
Manifest, Startbildschirm-Icons und Apple-Touch-Icon sind vorhanden. Es gibt
bewusst keine Service-Worker-Caches für Schlüssel, Sitzungen oder API-Antworten
und noch keinen Offlinebetrieb.

Vorhandene Austauschgrenzen: `PlayingEngine`, `TacticalAdapter`,
`DialogueAdapter` und serverseitig `CredentialsStore`. Neue Plattformen
implementieren diese Grenzen; sie duplizieren nicht die Lernlogik.

## Aktueller und geplanter Betriebsweg

| Plattform | Aktuell implementiert/geprüft | Für eigenständigen Betrieb noch nötig |
| --- | --- | --- |
| Windows | Node-Server/Starter/DPAPI-Code; zusätzlich realer Browser-Worker unter Chromium | Native Windows-/DPAPI-Abnahme |
| macOS | Derselbe Node-Server, ausführbarer .command-Starter bei installiertem Node 24 | Native Safari-/Mac-Abnahme; Keychain-Adapter und Mac-Paket |
| Android | Touch-Oberfläche und echter WASM-Spielgegner bei Android-Größe im Chromium-Test | Mobile Modell-/Schlüsseladapter und native Geräteprüfung |
| iPadOS | Touch-Oberfläche und echter WASM-Spielgegner bei iPad-Größe im Chromium-Test | Safari-/Echtgerätetest, mobile Modell-/Schlüsseladapter |

Der aktuelle lokale Node-Server bindet nur an Loopback. Eine iPad-/Android-
Standalone-App kann ihn nicht einfach auf dem Gerät starten. Das Manifest
ersetzt diesen Backendteil nicht. Nur der neue Browser-Spielgegner benötigt
keine Node-Engine-API; Modellzugriff, lokaler Key-Store und Git-Updates sind
weiterhin Desktop-Funktionen. Es gibt noch keinen vollständigen Offlinebetrieb.

## Browser-Engine im Entwicklungsstand

PlayingEngine hat jetzt Browser- und Desktopadapter. Gemeinsam genutzt werden
Geschichte, legale Züge, Endbedingungen und die fünf begrenzten Stufen. Jeder
Browserzug verwendet einen frischen Lite-Single-Worker und beendet ihn danach;
Pause/Neustart können ihn sofort abbrechen. Kein SharedArrayBuffer und keine
COOP-/COEP-Voraussetzung. Genau definierte selbst ausgelieferte Engine-Assets,
keine fremden Laufzeitdomains. Lizenz/Quellbezug siehe THIRD_PARTY_NOTICES.md.

Echte Chromium-Worker auf allen fünf Stufen, mit vollständig gesperrten
Backend-APIs, auf Telefon-/iPad-Größen, mit Abbruch/Fortsetzen und Fehlerfall
geprüft. Die Fähigkeit wird nicht als native Safari-/Android-Abnahme ausgegeben.
Der zusätzliche TacticalAdapter bleibt serverseitig und startet nur auf Klick.

## Nächster Schritt zur selbständigen Web-App

Modelltransport und dauerhaft lokale Schlüsselablage für Browsergeräte festlegen
und prüfen. Bestehende Windows-DPAPI-/POSIX-Profile werden nicht als mobil verfügbar
ausgegeben. Danach browserfähigen taktischen Faktencheck und den vollständigen
PWA-/Offlineweg ergänzen; keine Schlüssel-/API-Caches als Abkürzung einführen.

## Nächste Plattformadapter

- Engine: Desktopadapter mit eigenem Stockfish-Prozess und zusätzlicher begrenzter
  Browser-WASM-Worker implementiert; native mobile Abnahme steht aus.
- Modelltransport: gemeinsamer Dialogvertrag; sichere native HTTP-Anbindung
  oder authentifizierter Backendadapter, keine Schlüssel in Browser-Storage.
- Schlüssel: Windows DPAPI, künftig macOS-/iPadOS-Keychain und Android-Keystore.
  Der aktuelle POSIX-Dateiweg auf Mac ist privat, aber nicht verschlüsselt.
  Kein automatisches Synchronisieren des Schlüssels zwischen Geräten.
- Sitzungen: gemeinsames Schema, später lokaler Datenadapter pro Gerät.
  Aktuell bewusster JSON-Export/-Import; keine versprochene Cloud-Synchronisierung.
- Updates: Desktop-Git-Weg existiert; Android/iPad benötigen einen eigenen
  Paket-/Storeweg. Keine Git-/npm-Installation auf einem iPad voraussetzen.

Vor einer Netzfreigabe über Loopback hinaus sind HTTPS, Authentifizierung,
Berechtigungen und explizites Pairing nötig. Die bestehenden Schutzregeln
werden nicht für einen schnellen mobilen Zugriff abgeschaltet. Native
Hüllentechnik wird separat anhand der genannten Adapter geprüft; aktuell
wird kein ungeprüftes Framework als fertige Lösung eingeführt.
