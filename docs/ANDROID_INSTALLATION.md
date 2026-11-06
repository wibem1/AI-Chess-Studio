# Android-Installation: Diagnose Chrome 156

Stand: 6. November 2026. Nutzer sieht im Android-Chrome-Menü „Diese App wurde
bereits installiert“, danach „App konnte nicht geöffnet werden“. Keine passende
App unter Android-Apps gefunden; Neustart/Beenden erzwingen half nicht.
chrome://webapks-Befund vom Nutzer „nicht vorhanden“ (Seite vs. Eintrag nicht
weiter unterschieden). Daraus keine erfolgreiche lokale Installation ableiten.

## Diagnose und belastbarer Quellvergleich

Vom Nutzer gelieferte lokale Bedienungsdiagnose meldet App 0.3.2 und Chrome 156
mit Android-Kennung, Touch, CSS-Viewport 600x841 und Zoomfaktor 1. Eine Windows-
oder übliche X11-Desktop-Kennung ist nicht enthalten. Die reduzierte Angabe
Android 10/K ist kein sicherer Nachweis der tatsächlichen Android-Version.
Originaldatei und vollständige Gerätekennung werden nicht im öffentlichen
Repository gespeichert.

Der offizielle Chromium-Fix beschreibt exakt die Kombination beider Meldungen:
https://github.com/chromium/chromium/commit/2e165cdb08d714941e3573a18b719bfdad78ff66
Titel: [WebApk] Make install detection scope-aware for same-origin PWAs.
Chromium-Issue: 568841400. Hauptänderung vom 13. Oktober 2026.

Seit M154 prüft die betroffene Installationslogik nur den Origin, nicht den
App-Pfad. Eine andere installierte WebApp auf derselben Domain kann daher für
Chess Studio eine vorhandene Installation vortäuschen. Öffnen prüft den Scope
enger und findet für Chess Studio dann kein passendes Paket. Dies erklärt
auch, warum die Suche nach Chess Studio unter Android-Apps leer sein kann.
Es belegt nicht, welche andere App auf dem Nutzergerät installiert ist.

Konkreter Versionsvergleich der veröffentlichten Tags:
- 156.0.8078.94: WebappRegistry.isAppInstalledForUrl ruft
  hasAtLeastOneWebApkForOrigin(origin) auf; der Fehler ist dort noch enthalten.
- 157.0.8103.73: ruft hasInstalledWebApkForUrl(url) auf und prüft Scope-Pfade;
  entsprechende Korrektur ist in diesem geprüften Stand vorhanden.
- 158.0.8127.24: ebenfalls Scope-bezogene Prüfung.

Verglichene Dateien (jeweils unter den genannten Tags):
chrome/android/java/src/org/chromium/chrome/browser/webapps/WebappRegistry.java.
Der native Dialog stammt aus PwaUniversalInstallBottomSheetCoordinator/Mediator;
AppInstallMenuHandler.doUniversalInstall liefert dessen Installed-Bool.
Chrome://web-app-internals wurde nicht empfohlen: die Konfiguration ist im
geprüften Quellstand nur außerhalb Android registriert.

## Nächster gezielter Schritt

Chrome über den Google Play Store auf eine Version mit dem Fix aktualisieren;
belegt ist 157.0.8103.73. Danach Installation erneut versuchen. Keine Daten-
löschung und keine zufällige Änderung unserer Manifest-ID als Ersatz.
Ob ein passendes Update für das konkrete Gerät bereits angeboten wird und die
Installation danach gelingt, muss der Nutzer am Gerät bestätigen. Chrome-
Ursache ist aufgrund des Versions-/Symptomvergleichs sehr plausibel, nicht durch
einen nativen Gerätetest des Agenten endgültig bewiesen.

Die Datei-Meldung „Server nicht erreichbar“ stammt vom Aufruf des Desktop-
Diagnoseendpunkts. Bei statischem GitHub Pages ist dieser nicht vorhanden; die
Meldung belegt keinen Installationsfehler. Die bestehende Bedienungsdiagnose
enthält keine native Chrome-Installationsdatenbank. Deren Grenzen offen benennen.
Keine App-Codeänderung, neue Veröffentlichung oder bezahlte Anfrage für diese
Untersuchung. Keine Behauptung einer bereits behobenen Androidinstallation.
