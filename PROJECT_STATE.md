# Projektstand

Stand: 5. November 2026 · Entwicklungsversion 0.1.2

## Verbindliches Ziel

Persönliches Schach-Lernprogramm: gegen eine Engine spielen und während/nach
der Partie mit einer getrennten KI über Stellung, Strategien und Varianten
lernen. Varianten ausprobieren, benennen, speichern und vergleichen, ohne die
Partie zu verändern. Siehe DEVELOPMENT_PLAN.md; bisherige Reduktion auf
Analysebrett/Faktencheck war ein Missverständnis und ist korrigiert.

## Neu implementiert und geprüft

- Stockfish 19 Lite WASM als realer automatischer Spielgegner. Farbe und fünf
  Skill-Stufen wählen; keine Elo-Zusage. Vollständige Zughistorie für Regeln
  und Wiederholung, keine Bewertungs-/Suchinfos aus Spielzügen im Dialog.
- Partiekursor getrennt vom Analysebrett: pausieren, frühere Stellung wählen,
  Varianten spielen, anschließend exakt zur tatsächlichen Partie zurückkehren.
  Der Einstieg in die Planfrage pausiert die Partie ebenfalls.
- Enginefehler pausieren ohne Auto-Retry. Späte Antworten nach Pause/Resume,
  anderer Partie oder Sitzungsersatz werden nicht angewendet.
- Varianten benennen und A/B vergleichen: zwei Stellungen, Zugfolgen,
  gemeinsamer Ausgangspunkt und jeweilige Notizen/Gespräche.
- Partie, Namen und Vergleich im validierten Schema-1-JSON erhalten. Alte
  Sitzungen weiterhin importierbar. UI-Import pausiert eine Partie, statt
  unaufgefordert die Engine starten zu lassen.
- KI-Kontext berücksichtigt Vorfahren der aktuellen Stellung, die Lernpartie
  und ausdrücklich gewählten Vergleich, bleibt auf sechs Einträge begrenzt.
- Typprüfung, Build, 68 Einzeltests und 31 Chromium-Browsertests bestanden.
  Echte lokale Engine auf allen fünf Stufen sowie Weiß-/Schwarz-Lernablauf im
  Browser geprüft; KI-Antworten weiterhin ausschließlich Testfixtures.
- Vorheriger Stand 6da1a54 bleibt erhalten. Details: docs/VALIDATION.md.

## Humanfaktor konkretisiert

Nutzerklarstellung: Die Lernanalyse soll menschliche Denkweise berücksichtigen,
nicht nur Enginewerte. DEVELOPMENT_PLAN.md und Modellauftrag ergänzt:
eigene Begründungen, Planverständnis, Kandidatenfindung, Rechenaufwand,
Genauigkeit, übersehbare Antworten, Weiterführung und persönlicher Lernwert.
Keine Einstufung des Menschen aus dem Engine-Level, keine erfundenen
Psychologie-/Enginewerte; praktische Umsetzbarkeit ist keine taktische Freigabe.
Implementiert ist die Instruktion; reale pädagogische Qualität noch nicht belegt.

## Neue Humanfaktor-Bedienung und Plattformbasis

- Stellungsbezogene Selbstangaben: Planidee, Begründung, Unsicherheit, Lernziel.
  Persistenz im Sitzungsformat und Übergabe als begrenzter Dialogkontext.
- Wahl zwischen Leitfrage, kleinem Hinweis und ausführlicher Erklärung. Leitfrage
  zeigt keine fertige Lösung; unerwünschte Zugkandidaten werden abgewiesen.
- Strukturierte menschliche Lernaspekte für moderne reale Antworten; fehlende/
  fehlerhafte Daten werden nicht still als vollständige Lernanalyse behandelt.
- Gemeinsame Web-/Touch-Basis, Manifest und Icons; Mac-.command-Starter.
  PLATFORM_ARCHITECTURE.md trennt Desktop-Backend von den noch erforderlichen
  mobilen Engine-/Transport-/Keystore-Adaptern. Keine mobile Standalone-Freigabe.

## Fortlaufender Lerndialog integriert

- Natürliche Dialogantwort vor aufklappbaren fachlichen Details; Gesprächsziele
  Stellung, Variantenvergleich und Partierückblick, vorbereiteter Einstieg.
- Rückfragen werden auf Klick in den Entwurf übernommen, nicht automatisch
  gesendet. Passende Beiträge früherer Stellungen bleiben sichtbar/verlinkt.
- Bis zu zwei echte frühere Gesprächsrunden mit separaten user/assistant-Rollen;
  keine simulierten Antworten als vermeintlich echte Modellvorgeschichte.
- Server validiert die tatsächliche Zugfolge gegen die angefragte FEN.
  Gekürzte Historie ist markiert; Unicode-Requestbudget unter 16 KiB geprüft.
- Voller Browserablauf mit echter Engine und tatsächlichem Modell-Service,
  Provider lokal ersetzt, drei Gesprächsrunden einschließlich Rückblick geprüft.
- Laufende Konfiguration und lokaler Schlüsselspeicher geprüft: kein nutzbarer
  realer Modellzugang in dieser Umgebung. Keine bezahlte Anfrage ausgeführt.

## Windows-Startfehler behoben

Nutzermeldung: tsc fehlt beim Build. Starter prüfte nur chess.js und übersah
fehlende Build-Werkzeuge. Windows-/Mac-Start und Selbstupdate installieren jetzt
explizit Entwicklungs-/optionale Pakete und Binärverknüpfungen. Fehler mit
npm ci --omit=dev nachgestellt; Reparatur selbst bei NODE_ENV=production
nachgewiesen. Anschließend Build, 64 Einzeltests und 19 Browsertests bestanden.
Keine Änderung an lokalen Schlüsseln oder Benutzerdaten.

## Figuren mit der Maus ziehen

- Direkte Brettbedienung mit Pointer Events: Figur folgt dem Zeiger, legale
  Zielfelder werden markiert. Loslassen spielt über dieselbe Regelprüfung wie
  Klick-/SAN-Eingabe; Stockfish antwortet im Spielmodus automatisch.
- Rochade, en passant, Schlagen und gewählte Unterumwandlung geprüft. Illegale
  Züge verändern die Stellung nicht; außerhalb loslassen, Escape, Fokusverlust
  und Pointerabbruch räumen die Ziehanzeige auf. Rendern bei Stellungswechsel
  verwirft einen noch laufenden Ziehvorgang.
- Vier neue Chromium-Maustests: legale/illegale Züge, Abbruch, Analysevarianten,
  Sonderzüge, echter Stockfish-Gegner sowie gedrehtes Brett als Schwarz.
  Typprüfung/Build, 64 Einzeltests und alle 23 Browsertests bestanden.
- Nutzer bestätigt inzwischen den erfolgreichen lokalen App-Start unter Windows.
  Mausbedienung ist unter Linux/Chromium geprüft; native Geräteabnahme bleibt offen.

## Lokaler Serverstart bei belegtem Port

Nutzermeldung: Installation und Build erfolgreich, danach generischer
Serverstartfehler. Der bisherige Fehlerhandler unterdrückte den OS-Fehlercode;
der genaue Fehler auf dem Nutzer-PC ist deshalb noch nicht belegt. Wahrscheinliche
Ursachen sind eine laufende vorherige App oder ein unter Windows reservierter Port.

- Default 5173 weicht bei EADDRINUSE/EACCES einmal auf einen vom Betriebssystem
  zugewiesenen freien Loopback-Port aus. Keine fremden Prozesse werden beendet.
- Browseröffnung und Konsolenausgabe verwenden die tatsächlich gebundene Adresse.
  Explizites CHESS_PORT bleibt fest; Startfehler nennen Ursache/OS-Code.
- Realer Sockettest und echter CLI-Start mit absichtlich belegtem 5173 erfolgreich;
  Ausweichadresse liefert App und API-Status. EACCES separat simuliert geprüft.
- Typprüfung/Build, 68 Einzeltests und 23 Browsertests bestanden. Nativer Test
  dieser Startkorrektur unter Windows noch offen.

## Touch-Scrollen repariert

Nutzer meldet blockiertes Scrollen mit dem Finger. Ursache: touch-action:none
auf dem Brett und Ziehgesten auch für Touch-Ereignisse. Touch nutzt jetzt
bewusst Start-/Zielfeld-Taps; Wischen und Pinch-Zoom bleiben Browsergesten.
Maus-/Stiftziehen bleibt über den bestehenden Regelpfad erhalten.

Neuer Chromium-Test sendet native Touchgesten über einem besetzten Bauernfeld
bei 412x915 und 820x1180: Seite scrollt, keine Figur folgt, kein Zug entsteht;
anschließend markieren und spielen zwei Taps genau einen legalen Zug.
Typprüfung/Build, 68 Einzeltests und 24 Browsertests bestanden. Native Tablet-
Abnahme weiterhin offen. Dieser Stand ersetzt die frühere ungetestete Annahme,
Touchziehen sei gleichermaßen sinnvoll wie Mausziehen.

## Schlüsselspeicherung: sichtbarer Status und kombinierter Touchtest

Nutzer meldet leeres Schlüsselfeld ohne Rückmeldung und erneuten Scrollstillstand
nach dem Speichern. Das Leeren war vorgesehen; bisher erschien jedoch erst nach
Speichern plus Statusabruf eine Rückmeldung. Die 5-s-Clientfrist war zudem so
kurz wie der Windows-DPAPI-Timeout. Der Scrollstillstand wurde in diesem Ablauf
noch nicht reproduziert; keine vollständige Behebung auf dem Nutzergerät behauptet.

- Sofort sichtbare Fortschrittsmeldung, Touchtastatur durch Fokuswechsel schließen;
  Speicherung hat 15 s Frist, Bestätigung hängt nicht mehr vom Folgeabruf ab.
- Dauerhafter Hinweis anhand serverseitig bestätigter lokaler Speicherung, auch
  nach Neustart. Fehler und unbestätigter Timeout werden deutlich unterschieden.
  Weder Status noch Export enthalten den Schlüssel; Feld bleibt bewusst leer.
- Kombinierte Chromium-Touchtests bei Android-/iPad-/Desktopgrößen: native
  Wischgesten während absichtlich wartendem Speichern, nach Erfolg sowie Fehler;
  Tastaturfokus, Persistenzanzeige nach Reload, Löschen und keine Browserfehler.
- Typprüfung/Build, 68 Einzeltests und 26 Browsertests bestanden. Native
  Windows-DPAPI-/Touchprüfung weiterhin offen. Nutzer bestätigt Windows-Touchscreen
  mit Chrome oder Edge; kombinierter Desktop-Touchtest läuft hier unter Linux.

## Einheitliche Versionsnummern eingeführt

Erste nummerierte Entwicklungsversion: 0.1.0. Zentrale Quelle package.json;
Frontend und Server lesen dieselbe Nummer. Sichtbar oben in der App, Browser-
Titel, Startkonsole und lokaler Diagnose (Server und Oberfläche getrennt genannt).
Windows-ZIP und oberster entpackter Ordner tragen 0.1.0; Paketmanifest enthält
zusätzlich den Quellcommit. CHANGELOG.md und AGENTS.md regeln künftige Erhöhungen.

Typprüfung/Build, 68 Einzeltests und 27 Browsertests bestanden. Zusätzlicher
echter CLI-Prozess bestätigt Startausgabe und Diagnose mit 0.1.0. Paketmetadaten
werden vor Bereitstellung gegen dieselbe Nummer geprüft. Keine neue Behauptung
zur offenen nativen Windows-Scroll-/Schlüsselspeicherabnahme; keine Veröffentlichung
als Release und kein Deployment.

## 0.1.1: Scrollhilfe und Bedienungsdiagnose

Nutzer bestätigt: auch Mausrad und Bild ↓ bewegen die Seite im Fehlerzustand
nicht. Reine Touch-Erklärung reicht damit nicht. Schlüsselspeicherung funktioniert
nach Nutzerangabe; native Windows-Scrollursache weiterhin unbestimmt.

- Ständig erreichbare Hoch-/Runter-Tasten bewegen das Scroll-Element direkt,
  lösen Eingabefokus und brechen etwaiges Figurenziehen ab. Kein Neuladen oder
  Löschen von Sitzung/Schlüssel. Das ist eine Ausweichbedienung.
- Lokale Bedienungsdiagnose zeigt UI-/Serverversion, Browser, Viewport, Seitenmaße,
  Scrollposition, Fokusart und letzte Pointer-/Scrollereignisse einschließlich
  Verhinderung. Keine Feldwerte, gedrückten Texte oder Schach-/Schlüsseldaten.
- Diagnoseexport und Schließen oben im festen Diagnosefenster erreichbar;
  Textdatei wird nur auf Klick gespeichert, keine automatische Übertragung.
- Typprüfung/Build, 68 Einzeltests und 29 Browsertests bestanden. Zusätzliche
  Fälle blockieren native Gesten absichtlich und prüfen direkte Scrolltasten,
  Diagnoseexport, sichtbare Bedienelemente und Ausschluss eingegebener Testwerte.
  Keine Behauptung, damit sei die native Windows-Ursache nachgestellt/behoben.

## 0.1.2: Ziehen wählte Text statt die Seite zu verschieben

Neue Nutzerpräzisierung: Nach Speichern führt der Scrollversuch zu Textmarkierung.
Das konkrete Symptom wird nun gezielt behandelt; nicht mehr nur ein abstrakter
Scrollstillstand angenommen. Keine bestätigte Aussage zum Windows-Treiber.

- Normale Seitentexte verhindern versehentliche native Auswahl. Eingabefelder
  und editierbare Texte behalten Auswahl/Bearbeitung; native Touch-Panning und
  Pinch-Zoom bleiben möglich.
- Mausgemeldetes Ziehen auf Text/Hintergrund verschiebt die Seite direkt;
  Formfelder, Buttons, Links, Zusammenfassungen und Brett bleiben ausgeschlossen.
  Escape/Fokusverlust/Pointerabbruch beenden den Vorgang; keine versehentlichen
  Folge-Klicks. Scrollhilfe und lokale Diagnose aus 0.1.1 bleiben erhalten.
- Neuer Browserablauf speichert Testschlüssel, zieht die Rückmeldung und prüft
  Scrollweg ohne Textauswahl sowie Gegenrichtung. Eingabeauswahl, Zugbutton und
  Escape-Abbruch geprüft. Alle bestehenden Touch-/Bretttests weiter bestanden.
- Typprüfung/Build, 68 Einzeltests und 31 Browsertests bestanden. Prüfung auf dem
  echten Windows-Touchscreen durch den Nutzer bleibt erforderlich.

## Weiter vorhandene Funktionen

Lokaler App-Server/Windows-Starter; private persistente Schlüsselablage
(Windows-DPAPI implementiert, unter Linux nicht nativ geprüft), Kostenbudget
als Schätzung, Diagnose, explizite Git-Updates und optionaler zusätzlicher
Stockfish-Faktencheck. Kein Schlüssel in Git, Diagnose oder Sitzungsexport.

## Grenzen und nächste Abnahme

Die echte KI ist noch nicht mit einem realen Schlüssel geprüft. Vorhandene
Freigabe für bis zu drei begrenzte reale Testversuche gilt; nicht erneut
erfragen und keinen Schlüssel im Chat anfordern. Lokaler PC-Eingabeweg ist
bevorzugt, weil Cloud-Bindungen hier nicht angewendet sichtbar waren.

Native Windows-/DPAPI-Prüfung und manueller Lerndurchlauf stehen aus. Sitzungen
werden bewusst als JSON gespeichert, keine automatische lokale Sitzungssicherung.
Skill-Stufen sind keine geeichten Elo-Werte. Budget ist keine verbindliche
Anbieterrechnung. Keine Veröffentlichung, Deployments, Releases, Actions oder
kostenpflichtige Textgenerierung durch den Agenten ausgeführt.

Nächster einzelner Schritt: realen Lern-Dialog zum eigenen Plan und zu einem
A/B-Vergleich prüfen, danach Ergebnisse und Projektstand gemeinsam sichern.
