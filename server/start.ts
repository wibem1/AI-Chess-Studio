import { spawn } from 'node:child_process';
import { createStudioServer } from './app.js';
const port = Number(process.env.CHESS_PORT ?? '5173');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('CHESS_PORT muss zwischen 1 und 65535 liegen.');
const server = createStudioServer();
server.on('error',() => {console.error('Lokaler Start fehlgeschlagen. Port und Build prüfen.');process.exitCode=1;});
server.listen(port,'127.0.0.1',() => {
 console.log(`AI-Chess-Studio läuft lokal auf Port ${port}.`);
 if(process.env.CHESS_OPEN_BROWSER==='1') {
  const url=`http://127.0.0.1:${port}`;
  const command=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open';
  const args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
  const browser=spawn(command,args,{detached:true,stdio:'ignore'});
  browser.on('error',()=>console.error('Browser konnte nicht automatisch geöffnet werden.'));
  browser.unref();
 }
});
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal,() => server.close(() => {process.exitCode=0;}));
