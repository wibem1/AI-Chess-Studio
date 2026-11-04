import { createStudioServer } from './app.js';
const port = Number(process.env.CHESS_PORT ?? '5173');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('CHESS_PORT muss zwischen 1 und 65535 liegen.');
const server = createStudioServer();
server.on('error',() => {console.error('Lokaler Start fehlgeschlagen. Port und Build prüfen.');process.exitCode=1;});
server.listen(port,'127.0.0.1',() => console.log(`AI-Chess-Studio läuft lokal auf Port ${port}.`));
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal,() => server.close(() => {process.exitCode=0;}));
