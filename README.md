# AI-Chess-Studio

Aktueller Funktionsstand: **0.5.1**, Bereitstellungsstatus in PROJECT_STATE.md; native Nutzerabnahme steht noch aus. Änderungen: [CHANGELOG.md](CHANGELOG.md).
Ein großes gemeinsames Schachbrett und zwei Modi für dein persönliches Lernen.
Auf dem Desktop steht das vollständige, vergrößerte Brett oben; Status und
Werkzeuge darunter. Kleine Touchansichten behalten ihre bisherige Anordnung.

## Spielen und lernen

1. Im **Spielmodus** Farbe und Spielstärke wählen, „Partie starten“ drücken.
   Figuren ziehen oder Start- und Zielfeld antippen; Stockfish antwortet.
   „Neue Partie“ startet direkt wieder in der Grundstellung mit der gewählten
   Farbe/Stärke. Der vorherige Stand bleibt als gespeicherte Sicherung erhalten.
2. Bei einer Frage auf **Lernmodus** umschalten. Der Gegner pausiert. Auf demselben
   Brett Züge für beide Seiten ausprobieren, mit „Zug zurück“ zurückgehen oder
   mit „Zur Partiestellung“ neu ansetzen.
3. Direkt im Chat nach Ideen, Erklärungen und Gegenplänen fragen. Die Lernengine
   kennt Brettstellung und Zugfolge; keine manuelle Übertragung nötig. „Zug zeigen“
   führt einen geprüften Vorschlag im Lernzweig vor und markiert Start/Ziel.
   „Zug kommentieren“ sendet eine Frage zum gerade ausprobierten Zug, nach dem
   gewählten echten oder simulierten Dialogmodus und den bestehenden Kostenlimits.
4. Zurück zum **Spielmodus**: Die echte Partie wird an ihrer unveränderten Stelle
   fortgesetzt. Solange dort kein neuer Zug erfolgt ist, kehrt erneutes Lernen
   zu deinem bisherigen Lernzweig zurück. Alle Varianten bleiben im Baum erhalten.

Der Lernmodus enthält auch „Kommentar zu dieser Stellung“, „Varianten speichern
und vergleichen“ und weitere Lernwerkzeuge einschließlich PGN-Rückblick
„Partie verstehen“. Einstellungen sind über die Schaltfläche oben erreichbar.
Der Humanfaktor bleibt verbindlich: eigene Gedanken, verständliche Pläne und
praktische Schwierigkeiten besprechen, keine bloße Enginezahlenanalyse.

## Partien speichern und laden

Unter dem Brett **„Partien speichern und laden“** öffnen:

- Namen eingeben und **„Partie speichern“**: benannte Kopie im Browser auf diesem
  Gerät. Eine neue Speicherung erstellt einen weiteren Stand.
- Gespeicherte Partie auswählen und **„Partie laden“**.
- **„Als Datei speichern“** exportiert eine JSON-Partiedatei; **„Partiedatei laden“**
  öffnet sie auch auf einem anderen Gerät. Das ist unser vollständiges
  Studienformat, kein PGN-Export. Enthalten sind Kommentare, Varianten, Dialog,
  Variantennamen und Vergleiche; keine Schlüssel, Gerätepasswörter oder Kostenkonten.
- Vor jedem Laden wird die aktuelle Sitzung als eigene Sicherung abgelegt.
  Importierte Enginepartien öffnen im Lernmodus pausiert. Ungültige Dateien
  ersetzen die Sitzung nicht. Bis zu 100 lokale Stände; zusätzliche Sicherungen
  als Datei ablegen. Die Dateisicherung ist vom Browserdatenspeicher unabhängig.

Die automatische Sicherung der zuletzt verwendeten Sitzung bleibt zusätzlich
bestehen. Alte Sitzungsdateien sind weiter lesbar. Kein Zurücksetzen des
Schlüsselfachs oder der Kostenperiode nötig.

## Eigenständige Web-App verwenden

In den Einstellungen „Eigenständige Web-App auf diesem Gerät verwenden“ öffnen.
Ohne Desktop-Backend wird dieser Betriebsweg automatisch gewählt; eine über das
Browsermenü installierte App startet ebenfalls so. Das Brett und die beiden Modi bleiben gleich.

- Unter „Eigenen API-Schlüssel eingeben“ Schlüssel und Modell eingeben, Kosten
  freigeben und speichern. **Kein zusätzliches App-Passwort erforderlich.** Die
  Die Speicherung wird durch Zurücklesen bestätigt; erst danach wird das Feld
  geleert. Bei Fehlern bleibt die Eingabe für einen erneuten Versuch erhalten. Beim nächsten
  Start lädt die App den lokalen Schlüssel selbst, ohne Modellanfrage.
- Vorhandener Passwortschutz bleibt erhalten. Einmal mit dem bisherigen Passwort
  entsperren und „Ohne zusätzliches Passwort auf diesem Gerät merken“ wählen,
  falls du umstellen möchtest. Der API-Key muss dafür nicht neu eingegeben werden.
  Ein zusätzliches Passwort ist nur eine freiwillige Option ohne Mindestlänge.
  Einen neuen Key im oberen Formular speichern; dafür ist das alte Passwort
  nicht nötig. Den alten Zugang separat im zugeklappten Bereich darunter öffnen.
- Unter „Kostenkontrolle“ Preisannahmen und USD-Budget prüfen. Höchstens drei
  Generierungsversuche pro Fenster und gespeicherter Budgetperiode; die Periode
  gilt für alle Fenster derselben Browseradresse. Neuladen, Schlüsselwechsel und
  Löschen des Schlüssels setzen den Verbrauch nicht zurück. Unsichere Anfragen
  behalten ihre Reservierung. Die Schätzung ersetzt kein Anbieterlimit.
- Partie, Varianten, Notizen, Reflexionen, Dialog, importierte PGN und der
  Nachrichtenentwurf werden automatisch lokal gespeichert. Nach Neuladen bleibt
  eine Enginepartie pausiert. Mehrere Fenster teilen die zuletzt gespeicherte
  Sitzung; unabhängige Arbeitsstände als JSON exportieren.
- „App auf diesem Gerät · offline und Updates“ zeigt die Offline-Bereitschaft.
  Danach im Browsermenü installieren; auf dem iPad unter Teilen → Zum
  Home-Bildschirm. Die erste Vorbereitung braucht HTTPS oder localhost und eine
  Verbindung. Aktualisierungen werden heruntergeladen, aber erst nach deiner
  Bestätigung und erfolgreicher Sitzungssicherung mit Neuladen übernommen.

**Lokaler Schlüsselspeicher:** Standardmäßig AES-GCM-256 mit zufälligem IV und
nicht exportierbarem CryptoKey in IndexedDB. Der Browser kann ihn beim nächsten
Start wieder verwenden. Das ist keine zusätzliche Zugangssperre: Wer Zugriff auf
dieses Browserprofil oder den Code derselben Webadresse hat, kann den Schlüssel
in der App benutzen. Kein nativer OS-/Hardware-Schlüsseltresor.

Vorhandener und optionaler Passwortschutz verwendet weiterhin PBKDF2-SHA256 mit
250.000 Iterationen, Salt und AES-GCM. Das zusätzliche Passwort wird nicht
persistiert; dieser Modus muss nach dem Neustart entsperrt werden. Eine Umstellung
ist erst nach erfolgreichem Entsperren möglich. Alte Daten werden nicht gelöscht.

Kein Klartext-API-Key in Browser-Storage, Partiedatei, Diagnose oder Offline-Cache.
Speichern, Wiederladen und Umstellen starten keine Provideranfrage und setzen
keinen Verbrauch zurück. Schlüsseländerungen und Löschen werden an andere offene
Fenster derselben Adresse gemeldet; eine explizite Fenstersperre bleibt bis zum
Neustart oder bewussten Entsperren erhalten. Keine automatische Textgenerierung.

## Start auf deinem PC

Im lokalen **Windows-Startpaket ist Node.js 24 bereits enthalten**.
ZIP vollständig entpacken und im Projektordner unter Windows
**AI-Chess-Studio-starten.cmd** doppelklicken. Ein reiner Git-Quellcheckout
benötigt dagegen eine vorhandene Node.js-24-Installation. Das Skript installiert bei Bedarf
Abhängigkeiten, baut die App und öffnet nach dem Start den Browser. Das
Serverfenster während der Nutzung geöffnet lassen. Der Windows-Startweg und
DPAPI sind implementiert, aber in dieser Linux-Umgebung nicht nativ geprüft.

Alternativ im Projektordner:

```bash
npm ci
npm run build
npm start
```

Die App läuft nur lokal, standardmäßig auf Port 5173 (`CHESS_PORT` ist optional).
Ist der Standardport belegt oder vom Betriebssystem gesperrt, wählt die App
automatisch einen freien lokalen Port und öffnet dessen Adresse. Ein ausdrücklich
gesetzter CHESS_PORT bleibt verbindlich und meldet bei Problemen den Fehlercode.
Der statische Web-Build verwendet die lokalen Browseradapter. `npm start` stellt
zusätzlich die bisherigen Desktop-APIs bereit. Quellcodeentwicklung ist mit npm run dev möglich.

Eine kurze Schrittfolge liegt auch in **ERSTE_SCHRITTE.txt**. Das Windows-Paket
ist kein veröffentlichtes Release; native Windows-Abnahme steht weiterhin aus.

## Spielen und dabei lernen

1. Farbe und Engine-Spielstärke (Level 1 bis 5) wählen und „Partie starten“ drücken. Am Anfang ist dies die normale Anfangsstellung.
   Als Schwarz führt Stockfish den ersten Zug aus. Sonst spielst du zuerst.
2. Figuren mit der Maus auf das Zielfeld ziehen; legale Ziele werden markiert.
   Stockfish antwortet automatisch. Start-/Zielklicks und SAN-Eingabe bleiben möglich.
3. „Pausieren und analysieren“ wählen, frühere Stellungen anklicken und andere
   Züge ausprobieren. Die tatsächliche Partiestellung wird nicht verändert.
   Auch der Einstieg in die Planfrage pausiert die Partie automatisch.
4. Mit der KI über den ausgewählten Stand sprechen; Frage, Antwort und
   Gedächtnis bleiben dieser Stellung zugeordnet. Der Simulationsmodus zeigt
   nur Beispieldaten, keine echte Analyse.
5. Varianten benennen, A/B auswählen und „Vergleich anzeigen“: zwei Bretter,
   Zugfolgen, gemeinsamer Ausgangspunkt und jeweilige Notizen. Der ausgewählte
   Vergleich geht als begrenzter Kontext in die nächste KI-Frage ein.
6. „Zur Partie zurück und fortsetzen“ kehrt exakt zur tatsächlichen Partie
   zurück. Bei Enginefehlern bleibt sie pausiert, ohne automatische Retry-Schleife.
7. Unter „Einstellungen → Sitzung speichern oder laden“ die Sitzung als JSON speichern. Sie enthält Partie, Varianten, Namen,
   Vergleich und Gespräche; Import startet keine Engine automatisch, sondern
   pausiert die Partie zur sicheren Durchsicht.

Die Stufen entsprechen Stockfish Skill Level 0/5/10/15/20 mit begrenzter
Suchzeit (200 bis 1000 ms), Tiefe 12 und 20.000 Knoten. Es sind keine geeichten
Elo-Stufen; auch Level 1 kann stark spielen. Spielzüge nutzen die Zughistorie
für Wiederholungen, Rochade und en passant. Der zusätzliche taktische
Faktencheck bleibt ein separater ausdrücklicher Aufruf.

## Spielengine im Browser – integrierter Entwicklungsstand

Unter „Partie → Neue Partie einrichten → Spielengine“ zwischen Desktop-Engine
(Standard im Desktopbetrieb) und „Browser-Engine · auf deinem Gerät“ wählen. Die zweite
Variante berechnet Stockfish-Züge in einem eigenen Web Worker auf dem Gerät;
sie ruft keine Spielengine-API und keinen KI-Anbieter auf. Alle fünf Spielstufen
verwenden dieselben Grenzen: ein Thread, 16 MiB Hash, Tiefe 12, 20.000 Knoten und
200–1000 ms Suche; acht Sekunden Gesamtfrist einschließlich Laden. Die Engine
bekommt die vollständige verifizierte Partiehistorie bis zum aktuellen Zug.

Die Auswahl bleibt mit der Partie im JSON erhalten. Ein Wechsel bei vorhandener
Partie pausiert diese; „Fortsetzen“ ist bewusst nötig. Pause/Partiewechsel
beenden einen laufenden Browser-Worker; illegale Ausgaben, Ladefehler und Zeitlimit
pausieren ohne automatische Wiederholung oder stillen Desktop-Fallback.
Tabwechsel und PGN-Import starten keinen Worker.

Der Web-Build enthält unveränderte Stockfish-19.0.1-Lite-Single-Dateien (WASM
etwa 1,85 MB), GPL-Lizenz und Quellverweis. Es gibt keinen Engine-CDN-Aufruf.
Der Service Worker speichert ausschließlich öffentliche App-Dateien und Engine-
Assets, niemals API-Antworten, Schlüssel oder Sitzungen. Die Engine läuft ohne
SharedArrayBuffer/cross-origin isolation. Spielgegner und zusätzlicher taktischer
Faktencheck laufen im Webbetrieb als getrennte, begrenzte Worker auf Aufruf.
Die Nutzer-PGN und native Safari-/Android-/iPad-/Windows-Abnahme bleiben offen.

## Partie verstehen – integrierter Entwicklungsstand

Unter „Lernen → Partie verstehen · PGN importieren“ eine bereits gespielte
menschliche Partie einfügen oder aus Datei einlesen. Spielernamen für die
Farberkennung angeben oder Weiß/Schwarz ausdrücklich wählen. Vor dem Wechsel
eine vorhandene Sitzung sichern und das Ersetzen bestätigen. Fehlerhafte PGNs
ersetzen nichts. Der Import startet weder Enginegegner noch KI.

Der Rückblick hält vor einer eigenen Entscheidung an. Schwarz steht für den
schwarzen Spieler unten; „Brett drehen“ ändert die Ansicht in allen Bereichen
und in beiden Vergleichsbrettern. Die Auswahl enthält Zugnummern ohne die
kommenden Originalzüge. Zunächst erscheint eine Frage nach der eigenen Idee;
„Weiß ich nicht mehr“ ist eine gültige eigene Angabe. Nach einer Antwort oder
bewusstem Aufdecken erscheint der damalige eigene Zug. Die weiteren Fragen
nach erwarteter Antwort, Alternativen und Planwechsel werden einzeln gestellt.

PGN-Kommentare werden erhalten und nur nach Freigabe aufklappbar gezeigt; darin
vorhandene Analyse ist keine neu bestätigte Engineanalyse. Bedenkzeit stammt
nur aus benachbarten Uhrenständen derselben Seite unter Berücksichtigung einer
unterstützten einfachen Zeitkontrolle/Inkrement. Fehlende/unklare Zeiten bleiben
unbekannt. Die Eingabe akzeptiert eine Hauptvariante mit bis zu 1000 Halbzügen
und maximal 256 KiB; rohe PGN einschließlich Kommentare bleibt erhalten.

Varianten laufen im bestehenden Baum, die Originalpartie bleibt unverändert.
Künftige Originalzüge und ihre Stellungen bleiben im geführten Modus verborgen.
„Originalpartie vollständig ansehen“ gibt sie ausdrücklich frei; „Geführten
Rückblick fortsetzen“ kehrt zur gewählten Entscheidung zurück. Die lokale
Lernzusammenfassung sammelt die eigenen Aussagen, keine vermeintlichen Motive
oder Persönlichkeits-/Elo-Diagnosen. Eine daraus vorbereitete KI-Frage wird erst
nach Klick gesendet; reale pädagogische Qualität bleibt gesondert zu prüfen.

Für den optionalen Faktencheck einer importierten Partie wird die vollständige
Zuggeschichte übergeben. Dreifache Wiederholung ist hier ein beanspruchbares,
fünffache ein automatisches Remis; bei Wiederholungsanspruch erfolgt keine
isolierte FEN-Endspielbewertung. Kein Faktencheck vor Freigabe oder ohne Klick.

Rückblicke werden als **Sitzungsformat 2** mit Original-PGN, Perspektive, eigenen
Antworten, Auflösungsstand, Varianten und Notizen exportiert. Alte normale
Sitzungen (Format 1) bleiben importierbar. Alte App-Fassungen lehnen Format 2
ab, statt den geführten Modus still zu verlieren. JSON-Import ist auf 8 MiB und
5000 Stellungen begrenzt. Kein Schlüssel gehört in diese Datei.

Der verbindliche reale Test 1Vh80QL2 (wibem/Schwarz, 69 Züge) ist noch offen:
Die vollständige Nutzer-PGN liegt diesem Entwicklungsstand nicht vor. Automatische
Prüfungen verwenden ausdrücklich synthetische Partien, keinen rekonstruierten Ersatz.

## Fortlaufender Lerndialog während und nach der Partie

Im Tab „Lernen“ wählst du aktuelle Stellung, Varianten A/B oder
Partierückblick. „Lerngespräch vorbereiten“ pausiert die Partie und formuliert
einen Einstieg aus deinen Angaben, startet aber noch keine Anfrage. Erst
„Nachricht senden“ sendet sie im ausgewählten echten oder simulierten Modus.

Antworten erscheinen als Gespräch; fachliche Details kannst du aufklappen.
Rückfrage-Schaltflächen übernehmen einen Gesprächsimpuls in die Eingabe,
senden ihn aber nicht automatisch. Beiträge früherer Stellungen desselben
Zweigs bleiben mit ihrer Stellung sichtbar. Eine andere Variante übernimmt
nicht still deren fremden Gesprächsverlauf. Beim Partierückblick kehrt die
App zur tatsächlichen Partiestellung zurück, auch aus einer Analysevariante.

Der Modell-Service bekommt die aktuelle Frage, geprüfte tatsächliche Zugfolge,
eigene Gedanken und bis zu zwei letzte passende echte Gesprächsrunden.
Simulationsantworten werden nicht als echte KI-Vorgeschichte weitergegeben.
Kontext, Gesprächsbeiträge und Requestgröße bleiben begrenzt; bei langen
Verläufen werden ältere Beiträge gekürzt/entfernt. Die vollständige Sitzung
bleibt im Export erhalten. Mehr Gesprächsanfragen bleiben den bestehenden
Kosten-/Anfragelimits unterworfen, ohne automatische Wiederholungen.

## Eigene Gedanken und gestufte Hilfe

Unter „Meine Gedanken und Lernwünsche“ kannst du an der aktuellen Stellung
freiwillig eigene Planidee, Begründung, Unsicherheit und Lernziel speichern.
Wähle außerdem Leitfrage, kleinen Denkhinweis oder ausführliche Erklärung.
Im Leitfragenmodus zeigt die App keine fertige Analyse oder Kandidatenliste.
Gedankengänge und Hilfeumfang bleiben beim Export/Import stellungsbezogen
 erhalten. Dies ist keine automatische Einstufung deiner Spielstärke.

## Plattformen

Ziel: Windows, Mac, Android und iPad. Die Weboberfläche und der Lernkern sind
gemeinsam angelegt; Touch-Bedienung wird auch bei Android-/iPad-Größen geprüft.
Für Mac gibt es `AI-Chess-Studio-starten.command` (Node.js 24 erforderlich).
Native Windows-/Mac-Tests und Tests auf Android/iPad sind noch offen.
Die eigenständige Web-App benötigt keinen Node-Server. Offline-Start und lokale
Stockfish-Engine sind automatisiert im Browser geprüft; die native Android-
Installation bleibt auf dem gemeldeten Chrome-156-Gerät offen. Details: PLATFORM_ARCHITECTURE.md.

## Menschliche Denkweise statt bloßer Enginebewertung

Der KI-Lernbegleiter soll deine eigenen Ideen und Begründungen aufgreifen und
Pläne auch nach Verständlichkeit, Folgeschritten, Rechenaufwand, notwendiger
Genauigkeit und leicht übersehbaren Antworten besprechen. Bei A/B-Vergleichen
geht es ebenso um praktische Entscheidungen und Lernwert. Er soll nach deinen
Gedanken fragen und dir keine Spielstärke oder Denkfehler unterstellen.
Ein verständlicher Plan ist dadurch noch nicht taktisch bestätigt.

Dieser Auftrag ist implementiert; ein realer Lerndialog muss die Qualität
noch nachweisen. Siehe Humanfaktor-Kriterien in DEVELOPMENT_PLAN.md.

## API-Schlüssel im bisherigen Desktopbetrieb

1. Unter „Einstellungen“ den Abschnitt „Eigenen API-Schlüssel eingeben“ öffnen.
2. Schlüssel und Modell eingeben (vorbelegt: gpt-4.1-mini).
3. Preisannahmen/Budget in „Kostenkontrolle“ prüfen.
4. Kostenpflichtige Anfragen bewusst erlauben und „Schlüssel lokal speichern
   und KI aktivieren“ anklicken. Dies erzeugt noch keine Modellantwort.
   Beim Speichern erscheint sofort ein Status. Das Eingabefeld wird bewusst
   geleert; „API-Schlüssel lokal gespeichert“ bleibt als Bestätigung sichtbar,
   auch nach dem Neustart. Ein leeres Feld erfordert keine erneute Eingabe.
5. Unter „Diagnose und Updates“ kann der Zugang ohne Textgenerierung geprüft
   werden. Anschließend eine Planfrage im realen Modus stellen.

**Dauerhafte lokale Speicherung:** Die Datei liegt im Benutzerprofil des
Rechners, auf dem der App-Server läuft: unter Windows
`%USERPROFILE%\.ai-chess-studio\credentials.json`, unter Linux/macOS
`~/.ai-chess-studio/credentials.json`. Windows nutzt benutzergebundene DPAPI-
Verschlüsselung über PowerShell; POSIX nutzt private Datei-/Verzeichnisrechte
(0600/0700), dort keine Verschlüsselung. Die Eingabe wird im Browser sofort
geleert, nicht in localStorage/sessionStorage oder Sitzungsexport übernommen.
„Gespeicherten Schlüssel löschen“ entfernt die Datei und sperrt den Zugang.

Für Speicherung **auf deinem PC** muss die App dort laufen. Bei Cloudbetrieb
liegt diese Datei auf dem Cloud-Rechner. Cloud-Secrets sind für den lokalen
PC-Betrieb nicht mehr erforderlich. Bestehende serverseitige CHESS_*-Variablen
werden aus Kompatibilitätsgründen weiterhin unterstützt.

## Kostenkontrolle

Voreinstellung: **0,05 USD pro Budgetperiode**, höchstens drei Modellanfragen
pro Periode und zusätzlich pro Serverstart, je maximal 800 Ausgabe-Tokens.
Verbrauch und Preisannahmen werden lokal in `credentials.json.usage.json`
gespeichert und über Neustarts weitergeführt. Eine neue Periode erfordert eine
explizite Bestätigung; sie hebt das zusätzliche Prozesslimit nicht auf.

Die Eingabe-/Ausgabepreise sind editierbare **Preisannahmen**, keine aktuelle
Anbieterpreisauskunft. Vor einem anderen Modell die Preise anpassen. Vor jeder
Anfrage wird eine vorsichtige Reservierung berechnet; reicht das Budget nicht,
wird kein Provideraufruf gestartet. Bestätigte Token-Nutzung korrigiert die
Schätzung. Bei Fehlern/fehlenden Nutzungsdaten bleibt die Reservierung bestehen.
Keine automatischen Wiederholungen. Preise/Schätzungen sind **kein verbindliches
Geldlimit der Anbieterrechnung**; ein separates Anbieterlimit ist weiterhin sinnvoll.
Nur eine App-Instanz mit demselben Benutzerprofil verwenden.

## Scrollhilfe und Bedienungsdiagnose

Normale Seitentexte sind gegen versehentliches Markieren beim Wischen geschützt.
Ziehen auf Text/leerem Hintergrund verschiebt die Seite auch dann, wenn eine
Geste als Mausbewegung ankommt. Eingabefelder behalten Textauswahl und Bearbeitung;
Brett, Schaltflächen und andere Bedienelemente behalten ihre eigenen Gesten.

Unten rechts bleiben „↑ Hoch“, „↓ Runter“ und „Bedienung prüfen“ sichtbar.
Die Tasten bewegen die Seite direkt, falls Wischen, Mausrad oder Bildtasten
blockiert sind. „Bedienung prüfen“ zeigt Version, Browser, Seitenmaße,
Scrollposition, Fokusart und letzte Scroll-/Pointerereignisse; keine Werte von
Eingabefeldern, Schlüssel oder Partiedaten. „Diagnose als Text speichern“ erstellt
eine lokale Datei für die Fehlersuche. Die Diagnose wird nicht automatisch gesendet.
Die native Windows-Scrollblockade ist weiterhin nicht reproduziert; diese Hilfe
ist eine Ausweichbedienung, kein behaupteter Nachweis ihrer Ursachenbehebung.

## Diagnose

„Lokale Diagnose anzeigen“ meldet Laufzeit, Modellkonfiguration, Restanfragen
und Updatestatus ohne Schlüsselwerte oder Sitzungstexte. „OpenAI-Zugang prüfen“
ruft nur Modellmetadaten ab, keine Textgenerierung; Statusmeldungen unterscheiden
fehlende Konfiguration, abgelehnten Schlüssel, fehlendes Modell und
Verbindungsprobleme. Konfiguriert heißt noch nicht real erfolgreich geprüft.

Die App nutzt OpenAI Chat Completions über einen festen HTTPS-Endpunkt.
Unter einer verwalteten Cloud gelten weiterhin deren Netzwerkfreigaben.
Bei geerbtem Proxy Node mit `NODE_USE_ENV_PROXY=1` starten; der Windows-Starter
setzt dies. Die App umgeht keine Netzwerkbeschränkungen.

## Updates

„Nach Updates suchen“ prüft den Entwicklungsbranch **work** von
wibem1/AI-Chess-Studio. Git muss installiert und der Repositoryzugriff vorhanden
sein. Nach Anzeige des Zielcommits und ausdrücklicher Zustimmung kann die App
fetch, reines Fast-forward, npm ci und Build/Unit-Prüfungen ausführen. Eigene
ungesicherte Codeänderungen, abweichende Quelle oder ein verändertes Ziel
blockieren die Installation. Kein Force/Reset, kein automatisches Deployment.

Nach erfolgreichem Update die App beenden und neu starten. Bei einem Fehler
bleibt die Installation als unvollständig markiert; es gibt keinen behaupteten
atomaren Rollback. Die vorherigen Commits bleiben in Git erhalten. Während
des Updates keine zweite Installation starten und keinen Quellcode bearbeiten.

## Schach, Dialog und Sitzungen

- Figuren ziehen, Start-/Zielklicks oder SAN-Züge (e4, Nf3, O-O). Beim Ziehen
  legale Zielfelder sehen; außerhalb des Bretts loslassen oder Escape bricht ab.
  Auf Touchscreens Figur und dann Zielfeld antippen; Wischen scrollt auch über
  dem Brett und löst keinen Zug aus. Für Bauernumwandlung die gewünschte Figur
  vor dem Zug auswählen. Sonderzüge
  und legale Züge werden mit chess.js geprüft.
- Frühere Variantenknoten wählen und andere Züge spielen, um abzuzweigen.
- Simulation ist klar markiert und nutzt deterministische Beispieldaten.
  Sie belegt keine strategische Analysequalität eines Modells.
- Dialog, eigene Hypothesen und offene Fragen bleiben an ihrer Stellung;
  verspätete Antworten werden nach Sitzungsersatz verworfen.
- Im Spielmodus ist Stockfish 19 Lite WASM der automatische Gegner.
  Der getrennte Analyse-Faktencheck startet ausschließlich nach Klick. Optional einen
  eigenen SAN-Kandidaten prüfen: keine automatische Bewertungsleiste oder
  Zugvorgabe. Bedingungen: ein Thread, 16 MiB Hash, Tiefe 12 / 20.000 Knoten /
  1 s Suchzeit, 8 s Prozess-Timeout. Aktuelle FEN ohne Wiederholungshistorie
  oder Tablebases. Angezeigte Varianten sind regelgeprüft; Werte gelten unter
  diesen Suchbedingungen und sind keine absolute strategische Wahrheit.
- Im Desktopbetrieb liegen Sitzungen bis zum JSON-Export im Arbeitsspeicher;
  im Webbetrieb werden sie automatisch in IndexedDB gesichert. Datei-/Textimport validiert Varianten und erhält Gedächtnis und
  Suchbefunde. API-Schlüssel und Kostenkonto gehören nicht zum Export.

## Nachweise und Grenzen

`npm run test:all`: Typprüfung, Build, **104 Einzeltests und 62 Chromium-
Browsertests**. Der gebaute Anwendungsserver wird getestet, einschließlich
echtem lokalem Stockfish. Schlüsseltests verwenden ausschließlich bedeutungslose
Testwerte, Provider-/Update-Tests lokale Fixtures. Die bestätigte Web-Updateübernahme wurde mit einem echten Service Worker auf
einem lokalen Prüfserver getestet. Kein Release, Deployment, Git-App-Update
oder kostenpflichtige Textgenerierung ausgeführt.
Ein realer Modelltest und manuelle Nutzerabnahme stehen aus.

[Entwicklungsplan](DEVELOPMENT_PLAN.md) · [Projektstand](PROJECT_STATE.md) · [Prüfergebnisse](docs/VALIDATION.md) ·
[Engine-Lizenz und Quellen](THIRD_PARTY_NOTICES.md)


## Lokales Startpaket reproduzieren

`tools/package_windows.py` erstellt aus einem sauberen, gesicherten Git-Stand
ein privates ZIP mit frischen Git-Metadaten und offizieller portabler
Windows-Node-Laufzeit. ZIP und entpackter Ordner tragen die App-Version;
PAKET-INFORMATION.json enthält Version und Quellcommit. Das Tool verlangt Archiv und offizielle SHA-256-Liste,
verifiziert vor dem Entpacken und kopiert keine Profile, Schlüssel oder
installierten Abhängigkeiten. Erststart installiert per npm ci mit Lockfile.
Beispielparameter: --node-archive, --node-checksums und --output.
Node-Lizenztexte bleiben im unveränderten Laufzeitpaket enthalten.
