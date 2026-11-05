import { spawn } from 'node:child_process';
import { createStudioServer } from './app.js';
import { listenLocally, startupError } from './listen.js';
const port = Number(process.env.CHESS_PORT ?? '5173');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('CHESS_PORT muss zwischen 1 und 65535 liegen.');
const server = createStudioServer();
try {
 const actualPort = await listenLocally(server, port, process.env.CHESS_PORT === undefined);
 const url = `http://127.0.0.1:${actualPort}`;
 console.log(`AI-Chess-Studio läuft lokal: ${url}`);
 console.log('Dieses Fenster während der Nutzung geöffnet lassen.');
 server.on('error', error => { console.error(startupError(error, actualPort)); process.exitCode=1; });
 if(process.env.CHESS_OPEN_BROWSER==='1') {
  const command=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open';
  const args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
  const browser=spawn(command,args,{detached:true,stdio:'ignore'});
  browser.on('error',()=>console.error(`Browser konnte nicht automatisch geöffnet werden. Bitte ${url} im Browser öffnen.`));
  browser.unref();
 }
} catch (error) { console.error(startupError(error, port)); process.exitCode=1; }
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal,() => server.close(() => {process.exitCode=0;}));
