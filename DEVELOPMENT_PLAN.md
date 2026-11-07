# Entwicklungsplan – persönliches Schach-Lernprogramm

Verbindliche Zielkorrektur aus den Nutzerklarstellungen vom 5. und 6. November 2026.
Die folgende Zwei-Modi-Konzeption ersetzt die bisherige Aufteilung in vier
gleichrangige Arbeitsbereiche.

## Verbindliche Zielkorrektur vom 7. November: freier Lernchat mit Werkzeugen

Der Nutzer beschreibt einen freien Gesprächspartner, der die aktuelle Stellung,
den tatsächlichen bisherigen Partieverlauf und das bisherige Gespräch kennt.
Fragen und Antworten brauchen keine vorbereiteten Formulare, Antwortfelder oder
Analysearten. Optionale Bedienabkürzungen dürfen das freie Gespräch nicht steuern.
Die Lernengine kann auf Wunsch Züge/Varianten auf dem Brett vorführen und gegen
die getrennte Schachengine weiterspielen, um Ideen gemeinsam zu untersuchen.

### Rollen und gemeinsame Informationen

- Der Nutzer formuliert sein Anliegen frei. Die Lernengine erklärt und diskutiert
  natürlich, erinnert sich an die bereitgestellten eigenen Gedanken und den Chat.
- Aktuelle ausgewählte Stellung, zugehörige Analysevariante und tatsächliche
  Partie werden getrennt bereitgestellt. Eine Frage zur früheren Stellung darf
  nicht still ans Partieende springen. Ein Partierückblick benötigt die echte
  Partiefolge. Kontextgrenzen/Kürzungen dürfen nicht als vollständiges Gedächtnis
  ausgegeben werden; gespeicherte Gespräche bleiben erhalten und löschbar.
- Die Schachengine ist Spielgegner bzw. ausdrücklich verwendetes Rechenwerkzeug.
  Ihre tatsächlichen Züge/Befunde werden der Lernengine wieder zugeführt, sodass
  sie über das Geschehene sprechen kann. Ein Prompt ersetzt diesen Rückkanal nicht.

### Brett- und Enginewerkzeuge: implementierter begrenzter Ablauf

Werkzeuge für Stellung/Verlauf lesen, Variante am Brett zeigen, Zug ausführen,
Schachengine antworten lassen, zurücknehmen und laufende Vorführung stoppen.
Die Lernengine verwendet sie bei Bedarf; technische Zugbefehle werden separat
regelgeprüft. Der sichtbare Erklärungstext ist frei und braucht dafür kein
festes Antwortschema. Ohne bestätigte Ausführung darf die KI nicht behaupten,
dass Figuren bereits bewegt oder Engineberechnungen ausgeführt wurden.

Vorführungen arbeiten standardmäßig in einem eigenen Lernzweig. Die tatsächliche
Partie bleibt erhalten. Weiteres Spielen gegen die Engine ist eine ausdrückliche,
begrenzt ausgeführte Nutzeranweisung, z.B. eine gewünschte Zahl an Fortsetzungszügen;
keine ungebremste Modell-/Engine-Schleife. Kostenlimits bleiben wirksam.

Abnahme: freie Rückfrage bezieht sich auf bisheriges Gespräch und gezeigte
Stellung; Variantenauftrag wird am Brett vorgeführt; tatsächliche Engineantwort
wird legal übernommen und anschließend in freier Sprache erklärt. Abbruch,
Rücknahme und Rückkehr zur echten Partie erhalten den ursprünglichen Verlauf.

### Gegenwärtiger Stand der Korrektur

Vorbereitet: der normale Lernchat verwendet freie Textantworten ohne angefordertes
JSON-Antwortformat, keine Pflichtfelder für Plan/Beurteilung/Lernanalyse und keine
sprachliche Zwangsroutung in das frühere Partierückblickschema. Mehr Gesprächsrunden
werden nach Kontextbudget übertragen. Tatsächliche Partie und aktuelle Stellung
sind getrennt im Modellkontext. Optionale alte strukturierte Antworten bleiben
lesbar; unzulässige Vorschläge werden nicht als ausführbare Züge angeboten.

Nun implementiert: show_line und play_engine als optionale Werkzeugaufrufe,
getrennt vom freien Erklärungstext. Gemeinsame Ausführung im Lernzweig, geprüfte
Spielengine-Antwort und tatsächliche Stellung als tool-Ergebnis zurück an das
Modell. Höchstens zwei Werkzeugrunden und abschließende freie Erklärung, also
bis zu drei kostenpflichtige Modellanfragen. Stoppen, Zurück zum Ausgangspunkt,
Session-/Stellungswechsel und Chatlöschung verhindern spätere Brettänderungen.
Bereits gezeigte Züge bleiben als untersuchbare Variante erhalten.

Der technische Ablauf ist mit kontrollierten KI-Werkzeugaufrufen und echtem
Stockfish sowie echtem Maia-2 im Browser geprüft. Reale KI-Werkzeugauswahl und
pädagogische Qualität bleiben getrennt offen; keine unbeschränkte autonome
Schleife behaupten. Normale reine Textnachrichten benötigen weiterhin keine
Werkzeugaufrufe und kein Antwortschema.

## Windows-/Desktopkorrektur vom 7. November

Breite Lernansicht: vollständiges Brett links, Chat einschließlich Eingabe rechts.
Zugnavigation und maximal 72 px hohe, separat scrollbare Zugliste unter dem Brett;
ausgewählter Zug bleibt auch beim Größenwechsel sichtbar. Chatverlauf hat eigenen
Scrollbereich. Bedienungshilfe überdeckt die Eingabe/Senden-Taste nicht. Bei
schmalen oder niedrigen Fenstern einspaltig, ohne die gesamte Liste vor das Brett
zu setzen. Mobil-/Tabletansicht bleibt gestapelt. Native Windows-Abnahme bleibt
von automatisierten Chromiumprüfungen der Windows-Fenstergrößen getrennt.

## Korrektur vom 7. November: Analyse bedienen und KI-Zugang erkennen

0.8.0: Chat direkt unter dem Brett, Technik nach unten. Sichtbarer Zugverlauf
zum Durchgehen laufender und abgeschlossener Partien; Analysezweige bleiben vom
Partiecursor getrennt. Explizite Analyseknöpfe statt versteckter Themen-/Hilfestufen.
Eigene Rückfragen bleiben an der gewählten Brettstellung. KI-Zugangserkennung
richtet sich nach dem gespeicherten Fach, nicht nach einem freien Anfrageplatz:
vorhandener, aber blockierter Zugang bleibt eigene KI mit genanntem Sperrgrund.
Keine ungefragte Budgetfreigabe oder Anbieteranfrage durch Speichern/Neustarten.

Lernqualität: keine künstlichen Demo-Strategien, direkte Erklärungen zuerst,
Fakten und Suchbefunde an ihre FEN binden. Belegte Verlaufsereignisse sind keine
Blunderwertung. Reale Modellqualität benötigt weiterhin konkrete Anwendungs-
belege; Antwortfixtures allein belegen nur den Vertrag und die Darstellung.

## Ergänzung vom 6. November: Schrift, Rücknahme, klare Beurteilung, Maia

- Schriftgröße im Kopfbereich dauerhaft lokal einstellbar (80–200 %).
- Spielmodus: eigenen letzten Zug samt möglicher Engineantwort zurücknehmen;
  alte Folge mit Notizen als Variante erhalten, laufende Berechnung abbrechen.
- Lernengine: qualitativen Stellungsvorteil begründen und konkrete Gefahren
  benennen. Regelgeprüfte Brettfakten sichtbar von KI-Hypothesen trennen;
  Unsicherheit ausdrücklich nennen. Demo ist keine echte Stellungsanalyse.
- Menschlicher Spielgegner zusätzlich zu Stockfish: 0.7.0 integriert echte
  Maia-2-Blitz-ONNX-Inferenz im Browserworker, fünf Profile, Laden bei Bedarf,
  Offline-Cache und unveränderte Regel-/Rücknahme-/Lernabläufe. Reale Inferenz
  und veröffentlichte Referenzstellungen geprüft; Details in [docs/MAIA.md](docs/MAIA.md).
  Nächster einzelner Schritt: reale Windows-/Android-/iPad-Spielprobe, besonders
  Erstladen, Speicherbedarf und subjektiv menschlichere Zugwahl beurteilen.

## Kernziel

Der Nutzer spielt gegen Stockfish (oder später eine andere Engine) auf
unterschiedlichen Stufen. Während und nach der Partie kann er mit einer
getrennten KI über Stellung, mögliche Varianten und Strategien sprechen.
Er probiert Varianten aus, speichert, benennt und vergleicht sie. Es geht
um sein Lernen und Verstehen, nicht um eine Engine-Analyseoberfläche.

## Verbindliche Bedienkonzeption: ein Brett, zwei Modi

Nutzerentscheidung vom 6. November nach Verwendung von 0.3.3: Die aktuelle
Oberfläche ist zu umständlich und unverständlich. Das ist eine grundlegende
Korrektur des Bedienablaufs, keine weitere Sammlung zusätzlicher Menüs.
Die bestehende Vier-Tab-Oberfläche ist damit nicht die gewünschte Zieloberfläche.

- **Ein großes gemeinsames Schachbrett** steht im Mittelpunkt, per Maus und
  Antippen bedienbar. Zwei klar benannte Rollen: Schachengine als Gegner,
  Lernengine als dialogfähiger Lernbegleiter. Keine dritte zentrale Engine-
  Bedienung; ein zusätzlicher taktischer Faktencheck bleibt ein Nebenwerkzeug.
- **Spielmodus:** Farbe/Spielstärke wählen und gegen die Schachengine spielen.
  Der Normalablauf braucht weder Texteingabe für Züge noch Variantenverwaltung,
  Gesprächsvorbereitung oder mehrere Dialogauswahlen.
- **Lernmodus:** direkt aus der laufenden oder beendeten Partie umschalten.
  Die Schachengine pausiert; Züge für beide Seiten ausprobieren, zurücknehmen,
  alternative Folgen aufbauen, speichern, benennen und vergleichen. Das
  eigentliche Partieprotokoll bleibt unverändert. Variantenarbeit und Chat
  befinden sich gemeinsam in diesem Modus, nicht in getrennten Hauptansichten.
- **Hin und zurück:** Beim Wechsel ins Lernen mit der aktuellen Stellung beginnen;
  eine begonnene Lernvariante beim Hin- und Herschalten erhalten. Zurück zum
  Spielmodus an die tatsächliche Partiestellung zurückkehren. Bereits laufende
  Engineantworten dürfen nach Pause keine Variante oder Partie verändern.
- **Chat unmittelbar am Brett:** Stellung, Zugrecht und tatsächliche Zugfolge
  stammen automatisch aus dem Brett. Der Nutzer muss FEN, Züge und Varianten
  nicht erneut in den Chat übertragen oder ein Gespräch vorbereiten.
- **Lernengine zeigt Züge:** Ihre regelgeprüften Vorschläge direkt auf dem
  gemeinsamen Brett nachvollziehen und erklären lassen. Eine Vorführung läuft
  im Lernzweig, verändert keine echte Partiefolge und startet keinen Gegenzug.
  Aussage, Vorschlag und zugehörige Ausgangsstellung bleiben verbunden; weder
  veraltete noch illegale Modellzüge unkontrolliert anwenden.
- **Nutzer zeigt Züge:** Eigene Brettzüge und ausprobierte Folgen mit der
  Lernengine besprechen und kommentieren lassen. Fragen, Erklärungen und
  Varianten beziehen sich auf dieselbe Stellung. Keine zusätzliche manuelle
  Synchronisierung zwischen Chat und Brett.
- **Humanfaktor unverändert zentral:** eigene Idee, Begründung, verständlicher
  Plan, praktische Schwierigkeiten, gegnerische Möglichkeiten und gestufte
  Hilfen. Kein bloßer Enginezahlen- oder Bestzugdialog.
- **Nebenfunktionen zurücknehmen:** Einstellungen, Schlüssel, Kostenkontrolle,
  Diagnose, Updates und Dateiübertragung bleiben vorhanden, dominieren aber
  den normalen Spiel-/Lernablauf nicht. PGN-Rückblick „Partie verstehen“ bleibt
  innerhalb des Lernmodus erreichbar. Keine bestehenden Sitzungen löschen.

### Partienablage – zusätzliche Nutzeranforderung

Partien mit Kommentaren und sämtlichen Varianten speichern und laden. Umsetzung
0.4.0: benannte lokale Sammlung und vollständige JSON-Dateien einschließlich
Lerndialog, Namen und Vergleichen. Vor dem Laden vorhandene Arbeit separat
sichern, ungültige Dateien zurückweisen und keine Zugangsdaten übertragen.
PGN-Import für gespielte Partien bleibt zusätzlich im Lernmodus verfügbar;
JSON ist das verlustfreie Studienformat, PGN-Export damit nicht behauptet.

### Umsetzung und Abnahme

Zuerst den zusammenhängenden Kernablauf umsetzen: großes Brett und zwei Modi,
sicherer Wechsel zwischen echter Partie und Lernzweig, unmittelbar sichtbarer
Lernchat mit Brettkontext und nutzbare Zugvorführung. Bestehende Engine-,
Regel-, Speicher- und Kostenadapter soweit sinnvoll weiterverwenden. Nicht
lediglich die vier bisherigen Tabs umbenennen oder zusätzliche Formulare anbauen.

Automatisiert prüfen: echte Enginepartie, Wechsel während einer laufenden
Engineanfrage, Lernzüge beider Seiten ohne Gegenzug, Rückkehr zur unveränderten
Partie, erneutes Öffnen der Lernvariante, regelgeprüfte Chat-Vorschläge,
Stellungsbindung verspäteter Antworten und gespeicherte Varianten/Notizen.
Desktop-, Handy- und Tablet-Brett vollständig sichtbar und bedienbar prüfen.
Kein bezahlter Provideraufruf für die Entwicklungsprüfung. Reale Qualität und
Verständlichkeit des Lerndialogs anschließend gesondert belegen.

Diese Oberfläche wird mit **0.4.0 implementiert und automatisiert geprüft**.
Der veröffentlichte Stand 0.3.3 enthält sie noch nicht; tatsächliche Bereitstellung
und Nutzerabnahme stehen im PROJECT_STATE.md. Der bestehende verifizierte Stand
bleibt bis zur Umsetzung erhalten; Android-Installation ist ein separater Fehler.

## Zentraler Lernablauf

Partie spielen → bei einer Frage pausieren → eigenen Plan diskutieren →
Gegenmöglichkeiten ausprobieren → Varianten A/B mit Notizen vergleichen →
zur unveränderten Partie zurückkehren → Partie fortsetzen → Lernsession sichern.
Nach Partieende stehen Dialog und Analysevarianten weiterhin zur Verfügung.

## Komponenten und Nachweis

1. **Spielgegner:** Stockfish Lite, Weiß/Schwarz, fünf Skill-Stufen, automatische
   legale Gegenzüge, vollständige Historie und Partieende. Real lokal getestet.
2. **Partie und Analyse:** echter Partiekursor getrennt vom Analysebrett;
   pausieren, verzweigen und fortsetzen. Veraltete Antworten nach Pause,
   Neustart der Partie oder Sitzungsersatz verwerfen. Automatisiert geprüft.
3. **Variantenarbeit:** Namen, zwei Bretter, Zugfolgen, gemeinsame Ausgangsstellung,
   Notizen und JSON-Sicherung einschließlich Partie-/Vergleichsmetadaten.
   Automatisiert und im Browser geprüft.
4. **KI-Lernbegleiter:** Dialog zum ausgewählten Stand, begrenzter Kontext aus
   vorherigen eigenen Plan-/Dialognotizen, Partie und ausgewähltem A/B-Vergleich.
   Herkunft/Hypothesen deutlich markieren. Transport und Kontext lokal simuliert
   geprüft; echte Modellqualität und Anbieterintegration noch offen.
5. **Lokale Bedienung:** dauerhafter API-Schlüssel auf dem App-Rechner,
   Kostenkontrolle, Diagnose und Updates vorhanden. Kein Cloud-Secret-Dialog
   als Voraussetzung für lokalen PC-Betrieb.
6. **Zusätzlicher Faktencheck:** taktische Engineanalyse nur ausdrücklich
   ausgelöst und getrennt vom automatischen Spielgegner; kein ungefragter
   bester Zug und keine automatische Bewertungsleiste im Lernmodus.

## Humanfaktor – verbindlicher Analysemaßstab

Die menschliche Denkweise ist Kern der Lernanalyse, nicht eine zusätzliche
Formulierung neben einer Enginebewertung. Ausgangspunkt sind die eigene Idee,
Begründung und offene Frage des Lernenden. Fehlen diese, fragt die KI nach,
statt ihm einen Gedankengang oder eine Spielstärke zuzuschreiben.

Bei Plänen und A/B-Vergleichen betrachtet der Lernbegleiter:

- Wie man auf die Idee kommen kann: Figurenaktivität, Bauernstruktur, Muster,
  Schwächen und erkennbare Drohungen, soweit konkret begründbar.
- Verständlichkeit des Plans und sinnvolle nächste Schritte.
- Rechenaufwand und notwendige Genauigkeit; leicht übersehbare Antworten.
- Wie sich der Plan nach einer gegnerischen Abweichung weiterführen lässt.
- Praktische Entscheidungsprobleme und Lernwert für die geäußerten Lernziele.

Taktische Haltbarkeit, strategische Idee und menschliche Umsetzbarkeit sind
getrennte Fragen. Ein leichter verständlicher Plan wird nicht ohne Prüfung
als taktisch korrekt bezeichnet. Es gibt keine erfundenen psychologischen
Scores oder Enginewerte. Gegnerabsichten und mögliche Denkfehler sind
Hypothesen. Die Engine-Stufe ist keine Einstufung des Menschen.

Diese Anforderungen sind im Modellauftrag konkretisiert; ihre Erfüllung durch
eine reale KI ist noch zu prüfen und wird nicht durch Prompttext bewiesen.

## Bedienbarer Humanfaktor

An jeder Stellung können freiwillig eigene Idee, Begründung, Unsicherheit und
Lernziel festgehalten werden. Diese Angaben sind Selbstangaben, keine Diagnose
oder Bewertung des Menschen. Sie werden mit der Sitzung gespeichert und als
begrenzter Kontext in den Dialog gegeben.

Gewünschter Hilfeumfang: Leitfrage (keine Zugvorschläge oder fertige Lösung in
der Anzeige), kleiner Denkhinweis oder ausführliche Erklärung. Moderne reale
Modellantworten müssen strukturierte Lernaspekte zu Idee, Rechenarbeit,
übersehbaren Antworten und Weiterführung enthalten; fehlerhafte Antworten
werden nicht als Lernergebnis gespeichert. Das beweist noch keine pädagogische
Qualität; Simulationen bleiben sichtbar als Simulation gekennzeichnet.

## Plattformziel

Nutzerentscheidung vom 6. November 2026: Primäres Ziel ist eine gemeinsame
plattformübergreifende Web-App für Windows, macOS, Android und iPadOS, langfristig
als installierbare PWA. Native Hüllen bleiben optional. Die Oberfläche gliedert
sich in Partie, Lernen, Varianten und Einstellungen; seltene Optionen werden
aufgeklappt. Version 0.2.0 setzt diesen Oberflächenumbau um.
Gemeinsamer Lernkern, responsives Frontend und getrennte Engine-/Modell-/
Speicheradapter sind verbindlich. Aktuell gibt es einen Desktop-Node-Backendweg;
eine mobile Standalone-App ist noch nicht fertig. Siehe PLATFORM_ARCHITECTURE.md.

## Technisch integrierter Lerndialog

Der Lernablauf enthält Gesprächseinstieg, natürliche Antwort, gezielte
Rückfrage, Kontextfortführung und Partierückblick. Die Modellanbindung nutzt
geprüfte Zugfolgen und echte vorherige Gesprächsrunden als separate Rollen.
Simulationsantworten sind keine Modellvorgeschichte. Ältere fachliche Details
bleiben abrufbar, ohne den natürlichen Gesprächsfluss zu überladen.

Der Browser-Integrationslauf verbindet eine echte Stockfish-Partie mit dem
tatsächlichen Modell-Service und einem ersetzten Provider für drei
Gesprächsrunden einschließlich Rückblick aus einer Analysevariante. Das
belegt Datenfluss und Bedienung, nicht reale Modellqualität.

## Noch erforderliche Abnahme

Ein realer, begrenzter KI-Dialog zum eigenen Plan und einem ausgewählten
Variantenvergleich mit nutzerseitig lokal hinterlegtem Schlüssel. Anschließend
gezielter manueller Windows-Lerndurchlauf. Simulationen und Linux-Tests ersetzen
weder diese reale KI-Prüfung noch die native Windows-Abnahme.

Der reale Lerndialog muss zusätzlich nachweisen: eigene Begründung aufgreifen,
praktischen Unterschied zweier Pläne erklären, mindestens einen relevanten
Aufmerksamkeits-/Rechenaspekt benennen und eine hilfreiche Lernfrage stellen,
ohne Enginezahlen, persönliche Eigenschaften oder taktische Sicherheit zu
erfinden. Nutzerfeedback zu Verständlichkeit und Lernwert gehört zur Abnahme.


## Neuer Lernmodus: Partie verstehen (Nutzerentscheidung 6. November 2026)

Der vorhandene Lern-Tab wird um einen eigenständigen, geführten Rückblick auf
**bereits gespielte menschliche Partien** ergänzt. Kein neues Projekt, keine
zweite App und kein automatischer Engine-Analysebildschirm. Die laufende
Plattformentwicklung bleibt unangetastet; Umsetzung als abgegrenzter Folgeschritt
auf dem jeweils aktuellen geprüften Code.

### Benutzerablauf und didaktische Regeln

1. **PGN importieren:** Einfügen oder Datei laden, einschließlich Zugfolge,
   Spielerfarbe, Ergebnis und soweit vorhanden Uhrzeiten, Zeitkontrolle und
   PGN-Kommentare. Validierung durch die bestehende Schachregelbibliothek;
   fehlerhafte PGNs verständlich zurückweisen, Import niemals als aktive
   Enginepartie starten.
2. **Eigene Perspektive:** Spielerfarbe wählen/erkennen; Brett frei drehbar,
   für den schwarzen Spieler standardmäßig **Schwarz unten**. Dieselbe
   Orientierung in Partie-, Lern- und Variantenansicht konsistent erhalten,
   einschließlich auf Tablet/Handy. Kein Wechsel zu Lichess notwendig.
3. **Geführter Rückblick:** Vor einem ausgewählten eigenen Zug anhalten;
   tatsächlich gespielten Zug und Engineurteil zunächst **verbergen**.
   Zum Zeitpunkt passende Stellung, Zugnummer, Spielerseite und optional
   damals verbrauchte Bedenkzeit anzeigen. Kritische Stellen dürfen aus
   objektiven Indikatoren wie Materialänderung, taktischer Spannung, neuen
   Freibauern, Planwechsel oder ungewöhnlicher Zugzeit vorausgewählt
   werden; keine behauptete psychologische Diagnose.
4. **Zuerst den Menschen fragen:** „Was wolltest du erreichen?“,
   „Welche Antwort des Gegners hast du erwartet?“, „Welche Alternativen
   hast du erwogen?“ und gegebenenfalls „Hat sich dein Plan geändert?“.
   Nutzer darf auch „weiß ich nicht mehr“ angeben; frühere Gedanken
   niemals als Fakten erfinden. Fragen dosieren, nicht alles gleichzeitig.
5. **Gestufte Auflösung:** Erst nach Nutzerantwort oder ausdrücklichem
   Aufdecken den damaligen Zug, plausible gegnerische Antworten,
   Alternativen und optional den ausdrücklich ausgelösten Stockfish-
   Faktencheck zeigen. Strategisches Verständnis, taktische Korrektheit,
   Bedenkzeit und praktische menschliche Spielbarkeit getrennt betrachten.
6. **Varianten ausprobieren:** Bestehenden Variantenbaum verwenden;
   Originalpartie unverändert erhalten. Alternative Folgen mit eigenem
   Plan und Gegenplan diskutieren. Stellungsbezogene Notizen, Aussagen,
   Zweifel und Lernfragen in Sitzungsexport/-import speichern.
7. **Abschluss:** Individuelle, auf konkreten Entscheidungen beruhende
   Lernzusammenfassung mit belegten Mustern und Unsicherheit; auch
   gelungene Entscheidungen besprechen. Keine pauschalen Persönlichkeits-
   oder Elo-Diagnosen. Nächste Übungen gezielt auf beobachtete Muster
   ausrichten.

### Erster verbindlicher Testfall

Lichess-PGN vom 06.11.2026, Partie
https://lichess.org/game/1Vh80QL2, Spieler **wibem mit Schwarz**,
Ergebnis 1/2-1/2, 10+0, 69 Züge. Die vollständige PGN wird beim Import
aus der Nutzereingabe übernommen, nicht aus Engine-Kommentaren rekonstruiert.
Wichtige Reflexionsstellen: 7...Sxe5, 17...Le6, 21...Txb7,
28...Sxg3, 31...Sxh4, Übergang zu weißen Freibauern, 45...Kd6,
47...Sxg7 und 68...Sg3+. Fragen sollen ermitteln, ob es sich
beispielsweise um spontane Schlagzüge, übersehene gegnerische Antworten,
fehlende strategische Neubewertung oder unbekannte Endspielkonzepte handelte.
Das sind **Prüfhypothesen, keine zugeschriebenen Motive**.

Die Uhrzeiten der PGN werden den Zügen korrekt zugeordnet; die
verbrauchte Zeit wird aus den aufeinanderfolgenden Zeitständen derselben
Spielerseite ermittelt. Drei- und fünffache Stellungswiederholung müssen
aus der vollständigen historischen Stellung einschließlich Zugrecht und
Sonderrechten korrekt erkannt werden. Keine irreführende Endspielanalyse
aus isolierter FEN ohne Historie.

### Abnahmekriterien und Umsetzungsschnitt

- Import einer realen PGN mit Schwarz unten, korrekter Zugnavigation,
  Spielerseite, Zugzeiten und drehbarem Brett auf Desktop/Tablet;
  bestehende Partie- und Variantenfunktionen bleiben intakt.
- Ohne explizite Freigabe keine Fehlerzeichen, Evaluationsbalken,
  Bestzüge oder künftigen tatsächlichen Züge im geführten Dialog.
- Nach eigener Erklärung schrittweise Auflösung, echter Partierückblick,
  Variantenabzweig und Wiederaufnahme ohne Verlust von Notizen.
- Konkrete Tests für PGN-Fehler, Uhrzuordnung, schwarze Brettorientierung,
  drei Wiederholungen, sichere Sitzungsserialisierung sowie fehlende
  ungefragte Provider-/Stockfish-Aufrufe.
- Reale KI-Qualität erst nach gezielter Praxisprüfung behaupten;
  automatische Tests und Simulationen allein reichen nicht.
- Keine gleichzeitige ungeordnete Codebearbeitung mit Codex; dieser
  Plan ist die Übergabe, Implementierung erst nach Abstimmung mit dem
  laufenden Arbeitsschritt. Keine eigenmächtige Freigabe oder Versionierung.

## Nutzerentscheidung 7. November: Kosten nur anzeigen

Keine Budgetperioden, lokalen Geldlimits oder Drei-Anfragen-Kontingente.
Vorhandene Verbrauchswerte/Preisannahmen weiterführen; kein Schlüsselwechsel
oder Löschen der Sitzung nötig. Grafische Brettbesprechung im freien Chat
über bestehende geprüfte show_line/play_engine-Werkzeuge. Eine aktive Anfrage
und begrenzte Werkzeugrunden bleiben erhalten.

## Nutzerkorrektur 7. November: vertikale Besprechung am sichtbaren Brett

Eingabe und aktuelle Antwort unmittelbar unter dem Brett; älterer Verlauf
darunter. Keine Desktop-Spaltenansicht im Lernmodus. Oberhalb des Bretts
„Zeige deinen Plan auf dem Brett“ als ausdrücklicher Vorführungsauftrag an
die bestehende KI-Werkzeugkette. Freier Chat bleibt frei, ungesendete Entwürfe
bleiben erhalten. Lange aktuelle Antworten intern scrollbar, Brett an
Fensterhöhe/Schrift angepasst. Kein neuer Datenspeicher und keine Partieänderung.

## Nutzerentscheidung 7. November: Modelle selbst vergleichen

OpenRouter mit Modellauswahl, Denkstufe und nachvollziehbaren Kosten. Diagnose
muss übergebene Stellung, Kontext und öffentliche Antwort statt bloß Zugang
belegen. Ein regelgeprüfter Zug ist kein Qualitätsnachweis. Gegen die Spielengine
antreten lassen, ohne die tatsächliche Partie zu verändern; begrenzter expliziter
Start, kein stiller Retry und vollständige Fehler-/Zugbezüge im Bericht.
Die frühere Mini-Modellwahl war fachlich nicht abgenommen. Schachliche
Modellqualität erst anhand echter Antworten und Testpartien bewerten.
