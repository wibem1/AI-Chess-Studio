#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1 || ! node -e "process.exit(process.versions.node.split('.')[0]==='24'?0:1)"; then
  echo 'Bitte Node.js 24 installieren: https://nodejs.org'
  read -r -p 'Zum Schliessen Enter druecken.'
  exit 1
fi
if [ ! -f node_modules/chess.js/package.json ]; then npm ci --no-audit --no-fund; fi
npm run build
export CHESS_OPEN_BROWSER=1 NODE_USE_ENV_PROXY=1
npm start
