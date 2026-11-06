# Stockfish.js

Die lokale Engine wird unverändert als npm-Abhängigkeit `stockfish@19.0.1`
verwendet (Lockfile mit Integritätswert). Ausgeführt wird Stockfish 19 Lite WASM,
single-threaded. Der Enginecode und das veröffentlichte npm-Paket stehen unter
GPL-3.0; die Lizenz liegt im installierten Paket unter `stockfish/Copying.txt`.
Nicht-Engine-Code des Upstreamprojekts ist laut dessen README MIT-lizenziert.

- Projekt und Quellen: https://github.com/nmrugg/stockfish.js
- Quellstand der Distribution: https://github.com/nmrugg/stockfish.js/tree/v19.0.1
- Distributionsartefakte: https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1
- Stockfish-Ursprungsprojekt: https://github.com/official-stockfish/Stockfish

Engine-Binärdateien und WASM bleiben außerhalb des Entwicklungsbranchs.
Für die beauftragte GitHub-Pages-Veröffentlichung enthält der getrennte
Distributionsbranch gh-pages die unveränderten öffentlichen Engine-Dateien. Beim
Vite-Build werden die unveränderten Dateien stockfish-19-lite-single.js/.wasm
unter engine/stockfish-19.0.1/ in den ignorierten Web-Build übernommen. Ebenfalls
enthalten: COPYING.txt und SOURCE.txt mit der zugehörigen Quellversion und dem
Quellarchiv-Link. Dev- und App-Server liefern nur diese explizit erlaubten Dateien;
kein Laufzeitdownload von einem CDN und kein freier Zugriff auf node_modules.

Direkter zugehöriger Quellstand/Buildanleitung:
https://github.com/nmrugg/stockfish.js/tree/v19.0.1
Quellarchiv: https://github.com/nmrugg/stockfish.js/archive/refs/tags/v19.0.1.tar.gz

Für die nun beauftragte Web-Distribution gehören Lizenz, Quellverweis und
die unveränderte Engineversion gemeinsam zum Paket. Öffentliches Hosting ist
noch nicht erfolgt.

# chess.js

Regelprüfung durch chess.js 1.4.0, Copyright (c) 2025 Jeff Hlywa,
BSD-2-Clause. Die vollständige unveränderte Lizenz liegt im Web-Build unter
licenses/chess.js-LICENSE.txt; öffentliche Zuordnung unter licenses.html.
Die Veröffentlichung der Web-App ist nun beauftragt; das Paket enthält diese
Hinweise und die bestehenden Stockfish-Lizenz-/Quellverweise gemeinsam.
