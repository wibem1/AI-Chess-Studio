# Gemeinsame Plattformbasis

Zielplattformen des Nutzers: Windows, macOS, Android und iPadOS. Das ist eine
langfristige Anforderung, keine Behauptung einer bereits fertigen Mobil-App.

## Gemeinsamer Kern

`src/` enthält Schachzustand, Lernpartie, Varianten, Lernangaben und
Dialogverträge ohne Node-/Windows-Imports. `web/` ist eine gemeinsame
responsive HTML-/TypeScript-Oberfläche mit Touch-/Tastaturbedienung.
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
| Windows | Node-Server, Starter, portable Laufzeit, DPAPI-Code; Linux-/Chromium-Regressionen | Native Windows-/DPAPI-Abnahme |
| macOS | Derselbe Node-Server, ausführbarer .command-Starter bei installiertem Node 24 | Native Safari-/Mac-Abnahme; Keychain-Adapter und Mac-Paket |
| Android | Gemeinsame Touch-Oberfläche bei Android-Größe im Chromium-Test | Eigenständige mobile Hülle oder sicher erreichbares Backend, Engine-Worker und Keystore |
| iPadOS | Gemeinsame Touch-Oberfläche bei iPad-Größe im Chromium-Test, Apple-Icon | Safari-/Echtgerätetest, mobile Hülle oder sicher erreichbares Backend, Engine-Worker und Keychain |

Der aktuelle lokale Node-Server bindet nur an Loopback. Eine iPad-/Android-
Standalone-App kann ihn nicht einfach auf dem Gerät starten. Das Manifest
ersetzt weder diesen Backendteil noch eine native App oder Offline-Engine.

## Nächste Plattformadapter

- Engine: Desktop derzeit eigener Stockfish-Prozess; mobil ein begrenzter
  WebAssembly-Worker oder ein ausdrücklich konfigurierter Companion-Server.
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
