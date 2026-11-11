# Änderungen

## 1.5.5 – Stockfish-Variante bleibt beim Blättern geöffnet (11. November 2026)

- Die Überschrift „Variante“ bleibt bei jeder Stockfish-Neuberechnung dauerhaft sichtbar, ohne Flackern.
- Das aufklappbare Feld behält seinen vom Nutzer gewählten Zustand beim Wechsel zwischen Stellungen bei und schließt sich nur durch ausdrückliche Bedienung.
- Bis zur neuen Berechnung bleibt die bisherige Hauptvariante im Feld sichtbar und wird unmittelbar aktualisiert; solange wird der Bereich für Hilfstechnik als beschäftigt gekennzeichnet.
- Eigenständiger Browser-Regressionsfall für Vor/Zurück, Aufklappen, manuelles Schließen und stabile Position im Bedienbereich. Quellstand zunächst mit 40/40 Chromium-Tests in GitHub Actions 42992021667 geprüft.


## 1.5.4 – Ruhige Stockfish-Bewertung beim Stellungswechsel (11. November 2026)

- Während des Vor- und Zurückblätterns erscheint die Meldung „Stockfish berechnet die aktuelle Stellung …“ nicht mehr. Die Bewertung wird erst angezeigt, wenn ein Ergebnis vorliegt.
- Der Anzeigebereich bleibt während der Berechnung räumlich reserviert, damit die darunterliegende Oberfläche beim Wechsel der Stellung nicht springt.
- Die eigentliche Stockfish-Analyse und die Anzeige von Fehlern bleiben unverändert.
- Neuer Chromium-Regressionstest für Vorwärts-/Rückwärtsnavigation und stabile Anzeigehöhe; 39/39 Browsertests im Entwicklungsbranch erfolgreich (GitHub Actions 42988018298).


## 1.5.3 – Maia-Diagnose und vollständiger Partieverlauf (Veröffentlichungskandidat, 10. November 2026)

- KI-Diagnose enthält nun die vollständige Hauptzugfolge und den Variantenbaum mit Zugnotation und FEN, auch wenn kein KI-Anbieter kontaktiert wurde.
- Bei Maia-Enginezügen werden Modellstellung, ursprünglicher UCI-Zug, tatsächlich gespielter Zug und Folge-FEN mit dem jeweiligen Partiebezug protokolliert. Widersprüche halten die Partie an; kein Ersatzgegner.
- Tests: Varianten, Zugfolge ohne KI-Anfragen, echte lokale Maia-Berechnung und Browser-Download; keine bezahlten Modellaufrufe.
- Hinweis: Diese Diagnose belegt korrekte Übertragung von Enginezügen, nicht die schachliche Güte von Maia; alte Diagnosen ohne Zugliste lassen sich rückwirkend nicht vervollständigen.


## 1.5.2 – Strategische Planpriorisierung (Veröffentlichungskandidat, 10. November 2026)

- Die Lern-KI soll in strategischen Analysen einen vorläufig bevorzugten Plan empfehlen, mit konkreten Stellungsmerkmalen begründen, Alternativen vergleichen und nächste Schritte einschließlich Gegenspiel und Umplan-Kriterium nennen.
- Bei unklarer Beweislage Unsicherheit statt künstlicher Rangfolge; freiwillige neutrale Übersichten, kurze Faktenfragen, Hinweis-Modi und Partierückblicke behalten ihre eigenen Regeln.
- Änderungen in beiden Systemprompts und neue Prompt-Regressionstests. Reale Modellqualität ist damit nicht nachgewiesen; sie muss anhand der zweiten Referenzstellung geprüft werden.


## 1.5.1 – Sol-Timeout korrigiert (9. November 2026)

- Direkte OpenAI-Sol-Responses-Anfragen erhalten auch ohne ausdrücklich gesetzte Denkstufe 90 statt 45 Sekunden. Andere Anbieter-/Modellfristen und die separate 100-s-Clientfrist bleiben unverändert.
- Keine automatische Wiederholung fehlgeschlagener Anfragen, kein zusätzlicher kostenpflichtiger Anbieter-Test.
- Regressionstest für die Timeout-Auswahl ergänzt; TypeScript, Node-Tests, Web-Build, Chromium-Regression und Paketmanifest auf dem Korrekturbranch durch GitHub Actions 42677136225 erfolgreich überprüft.
- Eine tatsächliche Antwort des Sol-Anbieters innerhalb von 90 Sekunden ist nicht garantiert und noch nicht real getestet.


## 1.5.0 – Öffentliche Testversion: menschlich-strategische Analyse (9. November 2026)

- Neue regelgeprüfte Strategiemerkmale und begrenzte, als Hypothesen gekennzeichnete Langfristpläne für beide Seiten; der Lern-KI werden Belege, Voraussetzungen und gegnerische Gegenmaßnahmen geliefert.
- Springerstützpunkte mit kurzen Routen, legalem ersten Zug, begrenzter Material-Schlagfolge (bis zu vier Schläge) und gesonderten Warnungen zu unmittelbarem Schach, Großfigurenschlag und Umwandlung. Keine Behauptung einer vollständigen taktischen Prüfung oder einer sicheren Fortsetzung.
- Reproduzierbarer Prüfstand mit sechs legalen Eröffnungsstrukturen und fünf kritischen Positionen aus einer echten Lichess-Partie; originale PGN wird nicht verändert.
- Manuell zu bedienender Qualitätsvergleich unter Einstellungen → Diagnose und Fehlerberichte: Originalstellung und identische Strategiefrage vorbereiten, gespeicherte Antworten zur genau gleichen Frage übernehmen, Modell/Denkstufe soweit belegt erkennen, fünf begründete Teilbewertungen und expliziter JSON-Export/-Import.
- Keine automatische Anfrage an kostenpflichtige KI-Anbieter, keine ungefragte Stockfish-Analyse durch diese Erweiterung. Die tatsächliche Qualität von KI-Erklärungen mit realen Providern und native Gerätefunktionen sind noch nicht abschließend abgenommen; deshalb **Testversion**.
- Technischer Release-Kandidat: 262 Node-Tests sowie 12 fokussierte Chromium-Tests erfolgreich; vollständige Veröffentlichungsprüfung und GitHub-Pages-Livekontrolle sind vor Freigabe durchzuführen.


## 1.1.3 – Stabile KI-gegen-Engine-Anzeige und Stockfish in gemeinsamer Bedienzeile (9. November 2026)

- Stockfish-Ein/Aus-Schalter, Bewertung und aufklappbare Variante stehen in der vorhandenen Zeile „KI gegen Engine“ neben Start und Stop. Die bisher separate Leiste unter dem Schachbrett entfällt.
- Engine- und Modellmeldungen reservieren dauerhaft zwei Zeilen; kurze und lange Texte verändern die Höhe der Bedienung nicht.
- Reine Statuswechsel bauen das Schachbrett nicht neu auf. Bei Stellungswechseln bleibt die Scrollposition erhalten; Browser-Scroll-Anker im Lernmodus deaktiviert. Keine wiederholten zusätzlichen Statusmeldungen im Chat während des Testspiels.
- Verifiziert mit Typprüfung, Produktions-Web-Build, 196 Einzeltests und 27 Chromium-Browsertests auf 390 und 1600 Pixel einschließlich echter lokaler Stockfish-Komponente. Keine echte kostenpflichtige KI-Provider- oder native Geräteabnahme.


## 1.1.2 – Kompakte Stockfish-Bewertung im Lernmodus (8. November 2026)

- Direkt unter dem Lernbrett die Stockfish-Anzeige auf eine platzsparende Leiste mit Ein/Aus-Schalter, Bewertung und erreichter Tiefe reduziert. Der Chat beginnt wieder deutlich näher am Brett.
- Hauptvariante, Knotenzahl und Suchgrenzen über „Variante“ aufklappbar; Erklärungstext und redundante Statusmeldung aus der Daueransicht entfernt.
- Bei Stellungswechsel bleiben veraltete Ergebnisse nicht stehen; bei Wechsel in den Spielmodus ist die Leiste ausgeblendet. Bewertung, Berechnungsgrenzen und KI-Befundübergabe bleiben unverändert.
- Veröffentlichung erst nach bestandener Typprüfung, automatisierten Einzeltests, Chromium-Integration und GitHub-Pages-Deployprüfung.


## 1.1.1 – Stockfish-Bewertung direkt unter dem Lernbrett (8. November 2026)

- Schalter „Stockfish-Bewertung anzeigen“ unmittelbar unter dem Schachbrett im Lernmodus; kein Umweg über Einstellungen oder eine KI-Frage.
- Beim Einschalten lokale Bewertung der sichtbaren Stellung mit Anzeige aus Sicht Weiß, Suchtiefe, Knoten und kurzer Hauptvariante; erneute Prüfung bei Stellungswechsel.
- Für identische FEN wird ein vorhandener geprüfter Befund für die anschließende KI-Frage wiederverwendet. Abschalten oder Wechsel in den Spielmodus beendet offene Suchen; keine Anzeige im Spielmodus.
- Suchlimits unverändert (Tiefe 12, 20.000 Knoten, 1 Sekunde). 196 Einzeltests und 26 Browserprüfungen einschließlich echter lokaler Stockfish-Suche im GitHub-Prüflauf erfolgreich; keine echte KI-Provider- oder native Geräteabnahme.


## 1.1.0 – Allgemeine KI-Anweisungen, Pfeile und zuschaltbare Stockfish-Stellungsprüfung (8. November 2026)

- Unter Einstellungen → Allgemeine KI-Anweisungen ein aufklappbares, vergrößerbares Textfeld mit Speichern/Löschen. Bis 2.000 Zeichen dauerhaft im lokalen Browserprofil und unabhängig von der Partie gespeichert; bei späteren KI-Anfragen als untergeordnete Lehr- und Stilwünsche berücksichtigt. Der Text wird beim KI-Aufruf an den gewählten Anbieter übermittelt.
- Die KI wird bei ausdrücklich gewünschten Brettzeichnungen gezielt auf die vorhandenen Werkzeuge `draw_board` (Pfeile/Linien) und `show_position` (Lehrdiagramm) hingewiesen; die Partie wird durch Zeichnungen nicht verändert. Anforderung und Darstellung mit simuliertem Modellaufruf im Browser getestet.
- Neue optional aktivierbare Stockfish-Stellungsprüfung für Lernchat-Antworten (standardmäßig ausgeschaltet). Beim Absenden der Anfrage prüft Stockfish 19 Lite die aktuelle spielbare Stellung lokal, gibt der KI den begrenzten Suchbefund (Bewertung aus Sicht Weiß, Tiefe, Hauptvariante) und zeigt ihn separat im Lernchat. Keine automatische Bewertungsleiste während der Partie, keine kostenpflichtige KI-Anfrage, wenn die eingeschaltete Prüfung scheitert.
- Suche mit maximal Tiefe 12, 20.000 Knoten und einer Sekunde begrenzt. Die Bewertung ist ein taktischer Anhaltspunkt, kein Nachweis einer vollständigen strategischen Analyse. Eine echte kostenpflichtige KI- oder native Geräteprüfung fand nicht statt.
- Unit-, Browser- und lokaler Stockfish-Integrationstest ohne kostenpflichtige Modellanfrage erfolgreich.


## 1.0.6 – Schlüsselstellungen bei fehlerhaften Alternativzügen behalten (8. November 2026)

- Vollständige Partierückblicke bleiben erhalten, auch wenn die KI einen illegalen oder identischen Alternativzug vorschlägt. Nur dieser Vorschlag und seine ungeprüfte Begründung werden entfernt und als verworfen gekennzeichnet.
- Die historischen Zugbezüge bleiben strikt auf Legalität und Übereinstimmung mit der Partie geprüft; Import und gespeicherte Daten werden weiterhin streng validiert.
- Browser- und Server-KI-Verarbeitung übernehmen nur bereinigte Analysen. Keine kostenpflichtige automatische Wiederholung.
- Speicherung, Neuladen und Navigation der Schlüsselstellungen in einem vollständigen Browser-Funktionstest ohne echte kostenpflichtige KI-Anfrage geprüft. Reale Modellqualität und native Geräteprüfung weiter offen.


## 1.0.5 – Ausgabelimit für Sol-Partierückblicke wählbar (8. November 2026)

- In Einstellungen → KI-Modell und Denkstufe kann das Ausgabelimit für vollständige Partierückblicke mit OpenAI Sol gewählt werden: automatisch oder 2.048, 4.096, 6.144, 8.192 bzw. 12.288 Ausgabetokens.
- Für ausführliche Partierückblicke gilt ohne Denkstufe standardmäßig 6.144 Ausgabetokens und maximal 90 Sekunden; gewöhnlicher Lernchat bleibt unverändert.
- Auswahl wird mit dem verschlüsselten Modellzugang gespeichert, bei Neustart wiederhergestellt und kann auf Automatisch zurückgesetzt werden.
- Token-Obergrenze ist kein Kostenlimit und garantiert keine vollständige Antwort. Keine automatischen kostenpflichtigen Wiederholungen.
- Validierung mit Unit- und Browsertests ohne kostenpflichtige Modellanfragen; native Geräteprüfung ausstehend.


## 1.0.4 – Sol 6.1: robuste Antwortfrist und Abbruchdiagnose (8. November 2026)

- Direkte OpenAI-Sol-Responses-Aufrufe ohne eingestellte Denkstufe dürfen bis zu 45 statt 15 Sekunden dauern; bei eingestellter Denkstufe weiterhin 90 Sekunden.
- Selbstausgelöste Zeitüberschreitungen nur bei tatsächlich abgebrochenen Aufrufen als solche benennen; Netzwerk-/Antwortfehler und manuelle Abbrüche unterscheiden.
- Keine automatische Wiederholung fehlgeschlagener oder abgebrochener Modellanfragen; mögliche Kosten bleiben vorsichtshalber ungeklärt.
- Schlüsselfach, Partien, Modellwahl und bestehende Anbietertransporte unverändert; zusätzliche Tests mit simulierten Abbrüchen, keine kostenpflichtigen Modellanfragen.


## 1.0.3 – Einstellungen neu geordnet und KI-Fehler besser erkannt (8. November 2026)

- KI-Anbieter und API-Schlüssel, KI-Modell und Denkstufe, Kosten, Sitzungen, Updates und Diagnose als eigenständige Einstellungsbereiche.
- Altes doppeltes Lernchat-Einstellungsmenü ausgeblendet; bestehende Funktionen und gespeicherte Daten bleiben erhalten.
- Verhindert, dass Hintergrundaktualisierungen die gerade eingegebene Modellkennung überschreiben.
- OpenRouter-Modelle mit `:batch` aus dem interaktiven Katalog ausgeschlossen; bereits gespeicherte Batchmodelle vor kostenpflichtigen Anfragen lokal abgewiesen.
- Nach einem KI-Fehler eine alte Antwort ausdrücklich als frühere Antwort kennzeichnen; HTTP-Status sicher an die Benutzeroberfläche weiterreichen.
- Typprüfung, Einzeltests und Tablet-Browsertests über GitHub Actions; echte KI-Provideranfragen und native Android-/iPad-Abnahme nicht durchgeführt.


## 1.0.2 – KI-Anbieter, Schlüsselzustand, Oberfläche und Sol-Transport (8. November 2026)

- Anbieterwahl OpenAI direkt oder OpenRouter im Einstellungsformular ausdrücklich sichtbar.
- Beim nicht lesbaren Schlüsselfach keinen falschen OpenAI-Zugang vorauswählen.
- Für neu gewähltes OpenAI direkt ist `gpt-6.1-sol` die Modell-Voreinstellung; bestehende gespeicherte Modelle werden nicht verändert.
- Fehlgeschlagene Leseversuche des verschlüsselten lokalen Schlüssels erneut prüfen, ohne ihn zu löschen.
- Direkte Sol-6.1-Anfragen werden an die OpenAI Responses API geleitet; OpenRouter behält Chat Completions.
- Vier Brettwerkzeuge werden über eine validierte Responses-Funktionsschnittstelle fortgeführt; bis zu zwei Werkzeugrunden, keine ungeprüften Züge.
- Verschlüsselter Modell-Fortsetzungskontext bleibt ausschließlich im RAM und wird aus Diagnoseberichten entfernt.
- Funktionstests mit Mock-Antworten; echter OpenAI-Modellzugriff und Tool-Fortsetzung bleiben ausdrücklich ungeprüft.


## 1.0.1 – Web-App-Update und Cache-Reparatur

- Version unabhängig vom Service Worker anhand des aktuellen GitHub-Pages-Build-Manifests prüfen.
- Bei blockiertem Offline-Update nach erfolgreicher Sitzungssicherung nur den App-eigenen Service Worker und Shell-Cache erneuern.
- Fehlende Build-Metadaten und Fehler bei der Sicherung verständlich anzeigen; andere App- und Nutzerdaten nicht löschen.


## 1.0.0 – Bereinigter Lernablauf (vorbereitet)

- Brettsteuerung unter dem Brett; Navigation und Schlüsselstellen erhalten die Scrollposition.
- Alte Analyse-, Gedanken-, Kommentar- und Simulationsbedienung entfernt; freier KI-Chat.
- Gespeicherte Notizen und alte Sitzungsdaten bleiben lesbar.
- Modellwahl in den Zugangseinstellungen; Diagnose-Download direkt erreichbar.
- Konkrete Validierungsursachen auch im Diagnosebericht.
- Tote Bedienhandler entfernt, Brettsteuerung in eigenes Modul ausgelagert.
- 172 Einzeltests und 24 gezielte Browsertests bestanden, keine native iPad-Abnahme.


## 0.16.1 – Klare Analysefehler und einheitlicher Speicherweg

- Ungültige Alternativzüge mit historischem Zugbezug benennen.
- Doppelten JSON-Speicherbereich und zugehörigen Code entfernt.
- Automatische Sicherung erhalten, KI-Diagnose übersichtlicher erreichbar.
- 171 Einzeltests und 8 gezielte Browserfälle bestanden.


## 0.16.0 – Schlüsselstellungen und PGN-Import

- Sichtbarer Analysebutton im Lernmodus und direkte Sprungbuttons am Brett.
- Lichess-Kommentarfolgen und Unicode-Zeilentrenner unterstützt, Texteingabefallback.
- 170 Einzeltests und 5 gezielte Browserfälle bestanden; native iPad-Abnahme offen.


## 0.15.0 – Fremde PGN-Partien laden (veröffentlicht am 7. November 2026)

- PGN-Dateien direkt über „Partiedatei laden“ öffnen, ohne eigene Spielerseite
  oder Pflichtfragen. Frei nachspielen, Varianten untersuchen und analysieren.
- Spielernamen/Ergebnis und aufklappbare Originalkommentare; Kommentare als Text.
- Vor Wechsel Sitzung sichern und laufende Engines/Anfragen anhalten. Ungültige
  Dateien ersetzen die aktuelle Partie nicht.
- PGN samt neuer Analyse, Schlüsselstellen und Lernchat im nativen JSON erhalten.
- 165 Einzeltests und 8 gezielte Browserfälle bestanden; Details in PROJECT_STATE.md.

## 0.14.1 – Schlüsselstellungen erkennen (veröffentlicht am 7. November 2026)

- „Zeige die Schlüsselstellungen des Spiels“ wie Schlüsselstellen als geprüften
  Partierückblick behandeln, damit Pfeilnavigation statt einzelner Lehrdarstellung
  entsteht. Auch Schlüsselpositionen, Singular und Schluessel-Schreibweise.
- Exakte Nutzerformulierung im Browser mit Navigation und gespeicherter Analyse geprüft.

## 0.14.0 – Vergrößerbare Antwort und gespeicherte Schlüsselstellen (veröffentlicht am 7. November 2026)

- KI-Antwort vertikal vergrößerbar, mit Griff und Tastaturbedienung; gewählte Höhe
  bleibt beim Blättern und Neuladen erhalten.
- Explizite Schlüsselstellen-Fragen liefern geprüfte Zugbezüge. Pfeilbuttons und
  Links/Rechts springen zwischen den historischen Stellungen vor diesen Zügen.
- Analyse und Schlüsselstellen strukturiert in der Partiedatei und lokalen
  Speicherung erhalten; nach Laden weiter navigierbar. Ältere textbasierte
  Rückblicke mit eindeutigen Zuglabels bleiben unterstützt.

## 0.13.0 – Stellungen zwischen Modi übernehmen (veröffentlicht am 7. November 2026)

- Vor-/Zurück-Buttons unmittelbar am Brett; Vor folgt der aktuellen Lernvariante.
- Stellung spielen und Stellung lernen übergeben die sichtbare Position gezielt
  in den anderen Modus, auch separate KI-Lehrstellungen.
- Vor spielbarer Übernahme bisherigen Stand lokal sichern; Quelle und Orientierung
  erhalten, Sicherung bleibt ladbar. Gegner/Stufe/Farbe aus bestehenden Einstellungen.
- Feste Höhe der KI-Engine-Statusanzeige und kein zweiter Stopbutton während
  Testpartien: Das Brett verschiebt sich nicht mit unterschiedlich langen Meldungen.

## 0.12.0 – Kompakter Lernbereich und Lehrdiagramme (veröffentlicht am 7. November 2026)

- Oben kompakte KI-Modellanzeige; Zugang und Verbindungstest in Einstellungen.
- Weniger dauernde Erklärtexte und Zusatzknöpfe, kompakte Werkzeugleiste am Brett.
- Zum Anfang springen in beiden Modi; freie Lernzweige behalten die Vorwärtsnavigation.
- Im Spielmodus keine Markierung möglicher Zielfelder, auch beim Ziehen.
- KI kann separate FEN-Lehrstellungen sowie bis zwölf Pfeile/Linien darstellen.
  Ansicht ist drehbar und mit Zur Lernstellung rückkehrbar; Partie bleibt erhalten.
- Lehrdiagramme sind vorübergehende Ansichten. Echte Zugvorführungen weiterhin
  separat regelgeprüft. Details und Prüfgrenzen in PROJECT_STATE.md.

## 0.11.2 – Klarer KI-Zugang (veröffentlicht am 7. November 2026)

- Anbieter, Modell-ID, Denktiefe und Demo-/Bereitschaftsstatus oben im Lernmodus.
- Verbindung dort ohne Textgenerierung prüfbar; Ablehnung mit HTTP-Status sichtbar.
- Modellwechsel dort auch für OpenAI direkt ohne erneute Schlüsseleingabe.
- Hintergrundaktualisierung überschreibt keine bearbeitete Anbieter-/Modellwahl.
- Aktiver Zugang und Modell stammen gemeinsam aus derselben lokalen Diagnose.
- GitHub Pages erfolgreich bereitgestellt und Live-Dateien per Prüfsummen bestätigt.
  154/154 Einzeltests und 80/86 Browserfälle bestanden; sechs bekannte Prüffehler
  bleiben in PROJECT_STATE.md dokumentiert. Tatsächlicher Anbieterzugang und
  native Geräteabnahme weiterhin offen.

## 0.11.1 – Gleich großes Lernbrett und Teststart oben (veröffentlicht am 7. November 2026)

- „Lernengine gegen Schachengine“ ganz oben mit ausschließlich Start/Stop.
  Start ab sichtbarer Stellung mit aktuellem Modell und eingestellter Spielengine.
- Lernbrett verwendet dieselbe Größe wie das Spielbrett, einschließlich schmaler
  Desktopfenster und mobiler Ansichten. Kein Schrumpfen zugunsten des Chats.
- Automatisches Zurückscrollen beim Schreiben/Antworten entfernt. Eingabe und
  aktuelle Antwort bleiben unter dem Brett; bei wenig Fensterhöhe wird gescrollt.

## 0.11.0 – OpenRouter, KI-Diagnose und Testpartien (veröffentlicht am 7. November 2026)

- Windows-Lernbrett: lesbare Mindestgröße statt Schrumpfen bis auf 140 CSS-Pixel;
  bei niedrigen Desktopfenstern mindestens 280, sonst 360 CSS-Pixel. Beim
  Schreiben und nach Antworten Brett und Besprechung gemeinsam ins Bild rücken.

- OpenRouter-Zugang und aktueller Modellkatalog mit Werkzeugfilter, Sol/Argon-
  Favoriten, Denkstufe und Modellwechsel ohne erneute Schlüsseleingabe.
- Anbieter-Modell und gemeldete Kosten je Antwort; Token-/Denk-Nutzung im Bericht.
- JSON-Diagnose der letzten 20 Anbieter-Versuche samt tatsächlichem öffentlichen
  Anfrage-/Antwortkontext, Brettaktionen, eigener Bewertung und Testpartie.
- Lernengine spielt kontrolliert im Lernzweig gegen Stockfish/Maia. Wählbare
  Farbe/Stufe/Zugzahl, Stoppen, kein stilles Korrigieren illegaler Modellzüge.
- Tatsächliche Partie und alte Zugänge erhalten; private Denkblöcke nicht exportiert.
- Neue Funktionen mit Fixtures und echten Spielengines geprüft. Kein Nachweis,
  dass ein konkretes KI-Modell als Schachlehrer zuverlässig genug ist.

## 0.10.1 – Kostenanzeige und sichtbares Brett beim Lerndialog (veröffentlicht am 7. November 2026)

- Budgetperiode, lokale Geldsperre und Drei-Anfragen-Grenze im Browser und
  Desktop entfernt. Kosten/Anfragen werden weiter geschätzt und gespeichert.
- Bereits ausgeschöpfter Verbrauch blockiert weder Folgefragen noch den
  gespeicherten KI-Zugang nach Neuladen. Keine Löschung oder Neukonfiguration.
- Lernlayout einspaltig: direkt unter dem Brett Eingabe und aktuelle Antwort,
  danach Chatverlauf. Lange Antworten scrollbar, Brett nach Fensterhöhe begrenzt.
- „Zeige deinen Plan auf dem Brett“ oberhalb des Bretts fordert eine legale
  Vorführung an; ungesendete Texte bleiben erhalten. Kein eigener Antwortzwang.
- Neueste Antwort aus dem bisherigen Verlauf hervorgehoben, ohne Duplikate
  oder Änderungen am gespeicherten Chatformat.

## 0.10.0 – Freier Lernchat, Brett-/Enginewerkzeuge und Desktoplayout (veröffentlicht am 7. November 2026)

- Freie Textantworten ohne Antwortschema; Stellung, echte Partie und Gespräch
  getrennt bereitgestellt. Alte strukturierte Antworten kompatibel lesbar.
- Lernengine kann legale Varianten im Lernzweig zeigen und die gewählte Spielengine
  antworten lassen. Tatsächliche Züge/Stellung gehen zur Erklärung zurück ins Modell.
- Maximal zwei Werkzeugrunden und bis zu drei budgetierte KI-Anfragen je Nachricht.
  Stoppen und Vorführung zurück; Partiecursor bleibt unverändert.
- Breite Desktopansicht mit Brett links und Chat/Eingabe rechts. Kompakte Zugliste
  unter dem Brett, interner Scroll und sichtbarer aktueller Zug beim Größenwechsel.
- Niedrige/schmale Fenster und Mobilansicht gestapelt; Hilfe überdeckt Senden nicht.
- Technischer Ablauf mit echten Spielengines und kontrollierten Modellaufrufen
  geprüft. Reale KI-Werkzeugwahl und native Geräteabnahme bleiben gesondert offen.

## 0.9.0 – Chatverlauf löschen und verbesserte Fehlerauskunft

- Schaltfläche direkt am Lernchat; vor dem Löschen kurze Bestätigung.
- Entfernt den Chat der aktuellen Partie einschließlich aller Varianten.
  Partie, Notizen, Entwurf und gespeicherte andere Partiekopien bleiben erhalten.
- Sofortige automatische Sitzungssicherung; nach Neuladen bleibt der Chat leer.
  Bereits laufende Antworten werden nach dem Löschen nicht mehr gespeichert.
- Enthält die vorbereitete Diagnosekorrektur aus 0.8.2, ohne Behauptung einer
  bereits behobenen echten Modellstörung. Keine automatische Anfrage oder
  Budgetrücksetzung durch die Löschfunktion.

## 0.8.2 – Aussagekräftige Fehler beim Lerndialog (in 0.9.0 veröffentlicht)

- Anbieterablehnung, Anbieterlimit, Netzwerk, abgeschnittene Antworten und
  ungültige Modell-/Rückblickformate anhand fester sicherer Meldungen unterscheiden.
- Web- und Desktoptransport erhalten diese Kategorien bis zur sichtbaren Meldung.
- Bei Fehlschlag ausdrücklich erklären, dass sichtbare Chatbeiträge von früheren
  Anfragen stammen. Keine Rohantworten oder Schlüssel ausgeben.
- Keine automatischen Wiederholungen, zusätzlichen Modellaufrufe, Änderungen an
  Budget oder gespeicherten Partien. Ursache des konkreten Nutzerfehlers noch
  nicht nachgewiesen; keine erfolgreiche echte Analyse behauptet.

## 0.8.1 – Partierückblick mit konkreten Lernmomenten

- Eine ausdrückliche Nachricht wie „Analysiere das Spiel“ wählt den Partierückblick
  samt Erklärung; auch von einem früheren Lernzweig aus die tatsächliche Partie.
- Eigenes Antwortformat: Überblick, zwei bis vier chronologische Entscheidungen,
  tatsächliche Zugnummern, nachvollziehbare Folgen, Alternativen zum Prüfen und
  eine konkrete Lerngewohnheit. Keine Schlussstellungsbewertung als Partieanalyse.
- Züge werden der tatsächlichen Geschichte zugeordnet; Alternativen werden an
  der Stellung vor dem genannten Zug auf Legalität geprüft. Unpassende und reine
  Schlusszugantworten werden verworfen, ohne automatische Wiederholung.
- Direkt zu den Stellungen vor den besprochenen Entscheidungen springen. Kein
  neues Sitzungsformat; Texte und bestehende Partien bleiben importierbar.
- Regelereignisse über den Verlauf verteilen statt Anfang/Ende zu bevorzugen.
  Vollständige Geschichte erforderlich; zu große Anfragen vor Versand stoppen.
- Ein einzelner Partierückblick erhält bis zu 1800 statt 800 Ausgabe-Tokens;
  passende Kostenreservierung, unveränderte Budget-/Anfragelimits. Keine
  zusätzlichen Modell- oder automatischen Stockfish-Anfragen.
- Ablauf und Regelprüfung automatisiert getestet; echte pädagogische Modellqualität
  und die Nutzerpartie im Screenshot dadurch nicht abgenommen.

## 0.8.0 – Lernchat am Brett, Partienanalyse und eindeutiger KI-Zugang

- Lernmodus als durchgehender Ablauf: Zugnavigation, Brett, Chat, danach weitere
  Werkzeuge und zugeklappte technische Einstellungen – auf Desktop und Mobil.
- Partien inklusive abgeschlossener Spiele am Zugverlauf durchgehen; Anfang,
  zurück, vor und zur tatsächlichen Partie. Lernzweige verändern diese nicht.
- „Stellung besprechen“ und „Partie besprechen“ direkt erreichbar. Eine versteckte
  Gesprächsauswahl setzt das Brett nicht mehr automatisch ans Partieende zurück.
  Explizite Analyse liefert eine Erklärung trotz früherer Leitfragen-Präferenz.
- Gespeicherter Schlüssel, gesperrtes Fach und Anfrage-/Kostenlimit getrennt
  anzeigen. Kein stiller Demo-Rückfall bei vorhandenem Zugang; Speichern aktiviert
  die eigene KI ausdrücklich, Moduswahl bleibt beim Neustart erhalten.
- Demo gibt keine erfundenen Pläne oder beliebigen Zugtipps. Frühere Demo-Beiträge
  bleiben erhalten, werden aber nicht mehr als vorführbare KI-Züge angeboten.
- Direkterer Antwortauftrag; tatsächliche Figurenfelder, geprüfte Verlaufsereignisse
  und vorhandene Suchbefunde mit FEN/Suchgrenzen im Kontext. Frühere Dialogstellungen
  bleiben unterscheidbar; eindeutig falsche Matt-Beurteilungen werden verworfen.
- Keine automatische Kostenfreigabe, Schlüsseländerung, Budgetrücksetzung oder
  ungefragte zusätzliche Engineanalyse.

## 0.7.0 – Maia als echter lokaler Spielgegner

- Maia-2 Blitz neben Stockfish auswählbar, fünf Trainingsprofile 1100–1900.
  Echte ONNX-/WASM-Inferenz auf dem Gerät, keine API oder Ersatz-Stockfish-Engine.
- Modell/Laufzeit erst bei Maia-Nutzung laden (etwa 60 MB); danach im Browsercache
  für Offline-Spiel. Keine Python-/GPU-/Serverabhängigkeit.
- Weiß/Schwarz, Moduswechsel, Rücknahme, gespeicherte Gegneridentität und Abbruch
  laufender Berechnungen unterstützt. Fehler pausieren statt Gegner zu wechseln.
- Feste Modell-/Paketversionen, Fingerabdruckprüfung und Lizenz-/Quellnachweise.
  Profile sind keine Elo-Zusage; frühe Eröffnung bleibt eine Modellschwäche.

## 0.6.0 – Schriftgröße, Partierücknahme, klarere Lernbeurteilung

- Schriftgröße 80–200 %, im Browser gespeichert; Desktopbrett berücksichtigt
  die tatsächliche Höhe des vergrößerten Kopfbereichs.
- „Schritt zurück“ im Spielmodus: letzten eigenen Zug samt möglicher Antwort
  zurücknehmen, laufende Engineberechnung verwerfen, alte Variante erhalten.
- Echte KI-Erklärung verlangt begründeten Stellungsvorteil und konkrete Gefahren.
  Material, Schach/Matt und Matt in einem separat regelgeprüft; kein automatischer
  Enginebewertungsbalken. Demo-Beispielantworten deutlich gekennzeichnet.
- Maia-Machbarkeit und offizielle Quellen dokumentiert; keine Maia-Integration
  behauptet. Stockfish und vorhandene Schlüssel-/Partienspeicher unverändert.

## 0.5.1 – eindeutiges Speichern, keine Passwort-Mindestlänge

- Alte Passwortwiederherstellung separat unter dem Formular zugeklappt; neues
  Key-Speichern braucht kein früheres Passwort. Versteckte Zusatzfelder werden
  nicht automatisch als Passwort verwendet.
- Zehn-Zeichen-Vorgabe vollständig entfernt, auch für freiwilligen Zusatzschutz.
- Eindeutige Feld-/Freigabemeldungen statt nativer allgemeiner Passwortaufforderung.
- Speicherung erst nach Entschlüsseln der tatsächlich gespeicherten Kopie bestätigt;
  Eingabe erst bei Erfolg geleert, bei Fehlern für erneuten Versuch erhalten.

## 0.5.0 – Schlüssel ohne zusätzliches Passwort, Windows-Formulare

- API-Key standardmäßig im Browserprofil merken, ohne zusätzliches App-Passwort;
  verschlüsselt mit nicht exportierbarem CryptoKey in IndexedDB. Keine
  Provideranfrage durch Speichern oder Starten.
- Bestehende Passwortfächer bleiben lesbar; nach Entsperren ausdrücklich auf
  Speicherung ohne Zusatzpasswort umstellen. Optionaler Passwortschutz bleibt.
- Bedienungshilfe zusammenklappbar, damit Hilfstasten keine Formulare verdecken.
- Windows-Formulare bei vergrößerter Schrift ohne horizontalen Überlauf; schmale
  Einrichtungsbereiche ordnen Farbe und Spielstärke untereinander an.
- Profilmodus ist keine zusätzliche Zugangssperre und kein OS-Schlüsseltresor.
  Partien, Kosten und bisherige Schlüssel werden nicht gelöscht.

## 0.4.1 – Desktopbrett und neue Partie, 6. November 2026

- Desktopbrett größer und vollständig im Fenster: z. B. 450 statt 300 CSS-Pixel
  bei 1280×600. Status/Werkzeuge unter dem Brett; größere Figuren, ruhigere
  Karten und klassische Brettfarben. Kleine Touchansicht bleibt erhalten.
- Seitenleiste bei tatsächlich engem Inhalt unter das Brett, auch bei CSS-Zoom.
- „Neue Partie“ und „Partie starten“ beginnen in der Grundstellung mit gewählter
  Farbe/Stärke. Vorherige Partie samt Kommentaren/Varianten separat gesichert
  und sofort in der Partienliste sichtbar; fehlende Sicherung verhindert Reset.
- Zwei neue Browserfälle für Desktopgrößen, vollständige Sichtbarkeit und
  Neustart mit Wiederherstellung der Sicherung sowie Schwarz/Engine-Erstzug.

## 0.4.0 – ein Brett, Spielmodus und Lernmodus

- Großes gemeinsames Brett, zwei Modi statt vier Hauptbereiche. Umschalten
  pausiert/reaktiviert den Spielgegner; unveränderte Partie und Lernzweig bleiben
  getrennt. Bei unveränderter Partiestellung wird der Lernzweig wieder geöffnet.
- Lernchat und Varianten gemeinsam. Geprüfte Chat-Züge lassen sich auf dem Brett
  vorführen, mit markiertem Start/Ziel; eigene Lernzüge gezielt kommentieren.
- Benannte Partien lokal speichern/laden und als JSON-Datei übertragen, mit
  Kommentaren, Varianten, Dialog, Namen und Vergleichen. Vor dem Laden wird die
  aktuelle Sitzung separat gesichert. Ungültige Dateien ersetzen keine Sitzung.
- 100 Einzeltests und 55 Browsertests bestanden; tatsächlichen Übergang aus
  den veröffentlichten 0.3.3-Dateien mit erhaltenen Daten lokal geprüft.
- Schlüsselfach, Kosten, Diagnosen und Updatefunktion bleiben erhalten. Alte
  Sitzungsdateien weiter lesbar; kein Wechsel der Appkennung oder Datenbankversion.

## 0.3.3 – eindeutige Web-Updateanzeige, 6. November 2026

- Updateprüfung meldet ausdrücklich die aktuelle Version, wenn keine neue
  Fassung gefunden wird, statt einen Download anzudeuten.
- Laufender Download, bereites Update und fehlgeschlagene Installation werden
  getrennt angezeigt. Bereits laufende Installation beim Start wird beobachtet.
- Übernahme bleibt von Zustimmung und erfolgreicher Sitzungssicherung abhängig.
  Keine Änderung an Appkennung, Schlüsselfach oder Sitzungsspeicher.

## Veröffentlichungskontrolle – 6. November 2026, App bleibt 0.3.2

- Ausgebliebenes Update auf GitHub-deploy-Timeout eingegrenzt. Einmaliger neuer
  Lauf für die unveränderte App 0.3.2 erfolgreich abgeschlossen.
- Veröffentlichung wartet künftig auf den bestätigten Pages-Erfolg des exakten
  Commits. Upload, Pending oder Failure werden nicht als fertiges Update gemeldet.
- Vier zusätzliche Statusregressionen; 98 Einzeltests grün, unveränderter Appstand
  mit 52 Browsertests geprüft. Android-Meldung noch nicht am Gerät geklärt.

## 0.3.2 – vollständige Brettdarstellung, 6. November 2026

- Abgeschnittene rechte Brettspalten bei kleinen Desktopfenstern behoben.
  Acht feste gleich große Rasterspalten/-reihen; Figurengröße relativ zum Brett.
- Dieselbe Korrektur für beide Variantenvergleichsbretter.
- Zwei neue Browserregressionen prüfen sämtliche 64 Feld- und Figurenrechtecke,
  kleine/große Fenster, beide Orientierungen, CSS-Zoom und vergrößerte Schrift.
- 94 Einzeltests und 52 Browsertests bestanden. Keine Datenmigration,
  keine kostenpflichtige Anfrage; Aktualisierung über den vorhandenen Pages-Weg.

## 0.3.1 – GitHub Pages vorbereitet, 6. November 2026

- App, Engine, Links, Manifest und Offline-Worker für Projekt-Unterordner.
- Cache-Namensraum pro App-Pfad, HTML-CSP und .nojekyll für statisches Pages.
- Separater Web-Build und manuell gestarteter gh-pages-Publisher im bestehenden Repository mit
  vorgeschalteten Tests; keine eigenen Actions, kein Sichtbarkeitswechsel.
- 94 Einzeltests und 50 Browsertests einschließlich echter Unterordner-/Offline-
  Engine und lokalem Git-Veröffentlichungsweg. Keine Live-Veröffentlichung:
  Repository vom Nutzer auf Public gestellt; Pages-Verwaltungs-API weiter blockiert.

## 0.3.0 – zur Web-Bereitstellung vorbereitet, 6. November 2026

- Verbindet die integrierte Web-App und „Partie verstehen“ in einem nummerierten
  Web-Paket nach ausdrücklichem Veröffentlichungsauftrag.
- Hosting-Header für statische Bereitstellung sowie zugängliche vollständige
  chess.js-Lizenz und Stockfish-Lizenz-/Quelllinks ergänzt.
- Noch keine öffentliche URL: Hostingzugang fehlt, GitHub-Website-API blockiert.
  Lokale Prüfung und Bereitstellungsanleitung unter docs/WEB_PUBLISHING.md.

## Noch nicht freigegeben – eigenständige Web-App (6. November 2026)

- Browserlokaler KI-Transport mit lokaler AES-GCM-Schlüsselverschlüsselung;
  Gerätepasswort entsperrt nach Neustart, kein Klartextschlüssel im Webspeicher.
- Persistente, fensterübergreifend atomare Budgetreservierung und Diagnose ohne
  Textgenerierung; gemeinsame Vertrag-/Kostenlogik mit dem Desktopbetrieb.
- Browserfähiger zusätzlicher taktischer Faktencheck, automatische Sitzungssicherung
  und pausierte Wiederherstellung einschließlich PGN-Lernrückblick/Entwurf.
- Installierbare PWA mit ausschließlich öffentlichem Offline-App-/Engine-Cache,
  Updates erst nach Bestätigung und erfolgreicher Sitzungssicherung.
- 93 Einzeltests und 49 Chromium-Browsertests; echte Engines und Offline-/Worker-
  Abläufe, Anbieter nur Fixtures. Reale PGN, Geräte- und KI-Abnahme bleiben offen.
  Keine neue Versionsnummer, Downloadfreigabe, Veröffentlichung oder bezahlte API.

## Noch nicht freigegeben – Browser-Spielengine (6. November 2026)

- Zusätzlicher begrenzter Stockfish-WASM-Worker im Browser, bestehende
  Desktop-Engine weiter auswählbar. Keine neue Version/Downloadfreigabe.
- Gemeinsame Historien-/Zugvalidierung, fünf Stufen, Abbruch und saubere
  Fehlerpause ohne automatischen Server-Fallback. Auswahl bleibt im JSON.
- Exakte versionierte Engine-Assets mit Lizenz/Quellverweis im Web-Build,
  restriktive Auslieferung und nur notwendige WebAssembly-/Worker-CSP.
- 86 Einzeltests und 43 Chromium-Browsertests bestanden, darunter echter
  Browser-Stockfish bei gesperrten Backend-APIs. Modell-/Schlüsseladapter und
  echte mobile Geräteabnahme bleiben offen.

## Noch nicht freigegeben – Partie verstehen (6. November 2026)

Anforderung aus Commit 2744e63e im bestehenden Lern-Tab umgesetzt. Keine neue
App-Versionsnummer oder Downloadfreigabe für diesen Entwicklungsstand.

- PGN aus Text/Datei, Farberkennung, drehbares Brett und konsistente Perspektive.
- Eigene Entscheidung vor Originalzug, dosierte Reflexionsfragen, gestufte
  Freigabe und unveränderte Originalpartie mit unabhängigen Analysezweigen.
- Uhren korrekt je Spielerseite; fehlende Zeiten bleiben unbekannt.
- Drei-/fünffache Wiederholung historisch geprüft, Faktencheck mit Zuggeschichte.
- Eigene Zusammenfassung und Sitzungsformat 2 mit Antworten, Notizen und Varianten;
  normale Format-1-Sitzungen bleiben importierbar.
- 80 Einzeltests und 38 Browsertests bestanden; reale Lichess-PGN und echte
  pädagogische KI-/Geräteabnahme noch offen. Keine kostenpflichtigen Anfragen.

## 0.2.0 – 6. November 2026

- Neue responsive Oberfläche mit Partie, Lernen, Varianten und Einstellungen.
- Gemeinsames Brett bleibt über die drei Lernbereiche erhalten; Einstellungen
  enthalten Schlüssel, Budget, Sitzungssicherung und Diagnose.
- Aufklappbare Zusatzwerkzeuge, kompakte Bretteingabe, direkter Partie-Einstieg.
- Desktop mit zwei Spalten, mobile Navigation fest unten; Tastatur und Direktlinks.
- Vorhandene Engine-, Dialog- und Speicherabläufe bleiben erhalten.
- 68 Einzeltests und 34 Chromium-Browsertests bestanden; echte lokale Engine,
  Modellzugriff mit Fixtures. Native Geräteabnahme und eigenständiger mobiler
  Backendbetrieb sind weiterhin offen. Kein Release/Deployment.

## 0.1.2 – 5. November 2026

- Schutz gegen Textmarkierung beim Ziehen normaler Seitentexte.
- Ziehen auf Text/Hintergrund verschiebt die Seite auch bei als Maus gelieferten
  Bewegungen; Eingaben und Brett behalten ihre eigene Bedienung.
- Gezielter Ablauf nach Schlüsselspeicherung geprüft; 68 Einzeltests und 31
  Chromium-Browsertests bestanden. Echte Windows-Touchabnahme bleibt offen.

## 0.1.1 – 5. November 2026

- Ständig sichtbare Scrollhilfe mit Hoch-/Runter-Tasten als Ausweichbedienung.
- Bedienungsdiagnose mit lokalem Textdateiexport ohne Eingabewerte/Schlüssel.
- 68 Einzeltests und 29 Chromium-Browsertests bestanden. Native Windows-
  Scrollursache weiterhin offen; keine bestätigte Behebung auf dem Nutzergerät.

## 0.1.0 – 5. November 2026

Erste nummerierte Entwicklungsversion nach den bisherigen unnummerierten Paketen.

- Versionsnummer oben in der App, im Browser-Titel, Startfenster und Diagnose.
- Windows-Paket, entpackter Ordner und Paketinformationen eindeutig nummeriert.
- Enthält die bisherigen Funktionen: Enginepartie, Lerndialog, Varianten,
  Mausziehen und Touch-Taps, lokaler Schlüssel, Kostenkontrolle und Diagnose.
- Enthält die bisherigen Korrekturen für fehlende Build-Werkzeuge, belegten
  Standardport, Touch-Scrollen auf dem Brett und sichtbare Speicherbestätigung.

68 Einzeltests und 27 Chromium-Browsertests bestanden. Native Windows-Touch-/
DPAPI-Abnahme und der dort gemeldete Scrollstillstand sind weiterhin offen.

Künftige Korrekturen erhöhen die dritte Zahl, neue Funktionen die zweite Zahl.
