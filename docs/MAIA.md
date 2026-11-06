# Maia als alternativer Spielgegner

Stand: 6. November 2026 · **0.7.0: echte Maia-2-Blitz-Inferenz implementiert und
mit CPU-WebAssembly im Chromium geprüft.** Stockfish bleibt auswählbar.
Native Windows-/macOS-/Android-/iPad-Abnahme ist davon getrennt offen.

## Bedienung und Verhalten

Unter „Neue Partie einrichten“ den **Spielgegner Maia-2** wählen, Farbe und
Profil 1100/1300/1500/1700/1900 einstellen und die Partie starten. Bei Schwarz
zieht Maia zuerst, bei Weiß nach dem eigenen Zug. Die eingestellte Zahl
konditioniert das Modell, misst nicht die Stärke des Nutzers und ist keine
Elo-Zusage. Für beide Modell-Elo-Eingaben wird dasselbe gewählte Profil benutzt;
keine heimliche Schätzung der menschlichen Spielstärke.

Maia sagt menschliche Züge voraus. Aus ihrer legalen Zugverteilung wird mit
Temperatur 1 gewählt; Züge unter 1 % Wahrscheinlichkeit werden ausgeschlossen,
der wahrscheinlichste bleibt immer verfügbar. Keine absichtlich eingebauten
Stockfish-Fehler und keine Stockfish-Suche hinter der Maia-Auswahl. Die ersten
Eröffnungszüge sind in Maia-2s Trainingsdaten unterrepräsentiert; natürliches
Spiel in jeder Stellung ist nicht garantiert. Keine zusätzliche Eröffnungs-
bibliothek oder versteckte Ersatzengine eingebaut.

Lernmodus pausiert den Gegner; eigene Varianten, Kommentare, Rücknahme,
Fortsetzen und gespeicherte Partien behalten die gewählte Engineidentität.
Bei Lade-/Berechnungsfehlern bleibt die Partie pausiert. Kein automatischer
Wechsel zu Stockfish und keine automatische Wiederholungsschleife.
Der getrennte KI-Lerndialog und dessen Kostenfreigaben bleiben unverändert.

## Lokale Laufzeit und Modellherkunft

- Kein Konto, API-Key, Python, GPU oder Cloudserver für Maia erforderlich.
  Ein einzelner Browser-Worker mit onnxruntime-web **1.31.1**, CPU/WASM,
  `numThreads=1`. Kein SharedArrayBuffer oder Cross-Origin-Isolation nötig.
- Modell 42.532.592 Byte plus WASM-Laufzeit 14.848.852 Byte und kleiner Loader:
  grob 60 MB beim ersten tatsächlichen Maia-Einsatz. Stockfish-/App-Start lädt
  diese großen Dateien nicht vor. Browsercache wird beim Einsatz gefüllt;
  anschließend offline spielbar, solange der Browser die Dateien behält.
- Die unveränderte ONNX-Konvertierung stammt aus
  [dxg7/maia-chess-models, 93316189](https://github.com/dxg7/maia-chess-models/tree/93316189bb5cfd9fd49bc0eada3e9ba23b820050).
  SHA-256 `fdfa2a8d52d88b73373074cd9124f1c1e244e6d8ff4175f2400ca532ecca9e13`.
  Der Build und der Worker prüfen Größe und Fingerabdruck. Keine anderen
  Modell-URLs oder nachgeladenen Drittanbieter-Skripte.
- [Offizielles Maia-2-Projekt](https://github.com/CSSLab/maia2): CSSLab, MIT.
  Die Konvertierungsquelle bezeichnet ihr Modell als CC BY 4.0; ihr Ursprung
  und diese Angabe werden zusätzlich zur offiziellen MIT-Attribution erhalten.
  Quellen und sämtliche Lizenztexte neben dem Modell sowie über „Lizenzen“.
- Encoder/Decoder: [IndieFoundry/maia2-onnx](https://github.com/IndieFoundry/maia2-onnx/tree/abe12b13a546d5cdad2ace53343adcf721537b08),
  npm **0.1.0**, MIT. Dessen veröffentlichte PyTorch-Referenzwerte dienen dem
  Vergleich; keine eigene PyTorch-Ausführung oder Neu-Konvertierung behauptet.

18 veröffentlichte Vergleichsfälle: bevorzugte Züge stimmen überein, absolute
Wahrscheinlichkeitsabweichung unter 0,005. Enthalten sind beide Zugfarben,
Eröffnungs-/Mittelspiel-/Endspielstellungen und drei Rating-Eingaben. Dieser
Nachweis prüft Modell/Encoding, nicht menschlich empfundene Spielqualität.
Browserfälle prüfen echte Züge beider Farben, Touchgrößen, Moduswechsel,
Rücknahme, Downloadabbruch und Offline-Neustart im Pages-Unterverzeichnis.

Maia-Wertausgaben werden weder als Enginebewertung noch als kalibrierte
Gewinnwahrscheinlichkeit im Lernchat verwendet. Maia-3 bleibt eine mögliche
spätere Erweiterung; seine offizielle Python-/UCI-Laufzeit ist hier nicht
integriert. Frühere Machbarkeitsannahmen ohne Browserpaket sind durch die
hier nachgewiesene Maia-2-Lösung ersetzt.
