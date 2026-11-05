@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0runtime\node\node.exe" set "PATH=%~dp0runtime\node;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Bitte zuerst Node.js 24 von https://nodejs.org installieren.
  pause
  exit /b 1
)
node -e "if (process.versions.node.split('.')[0] !== '24') process.exit(1)"
if errorlevel 1 (
  echo Fuer diese App wird Node.js 24 benoetigt.
  pause
  exit /b 1
)
if not exist node_modules\chess.js\package.json goto install_dependencies
if not exist node_modules\stockfish\package.json goto install_dependencies
if not exist node_modules\typescript\bin\tsc goto install_dependencies
if not exist node_modules\vite\bin\vite.js goto install_dependencies
if not exist node_modules\.bin\tsc.cmd goto install_dependencies
if not exist node_modules\.bin\vite.cmd goto install_dependencies
goto build_app
:install_dependencies
echo Fehlende App- und Build-Werkzeuge werden installiert...
call npm ci --include=dev --include=optional --bin-links=true --no-audit --no-fund
if errorlevel 1 goto failed
:build_app
call npm run build
if errorlevel 1 goto failed
set CHESS_OPEN_BROWSER=1
set NODE_USE_ENV_PROXY=1
call npm start
if errorlevel 1 goto failed
exit /b 0
:failed
echo Die App konnte nicht gestartet werden. Die Fehlermeldung steht oben.
pause
exit /b 1
