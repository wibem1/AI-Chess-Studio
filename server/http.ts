import type { IncomingMessage, ServerResponse } from 'node:http';
import { ApiError, ModelService } from './model.js';

export function modelMiddleware(service: ModelService, tactics?: (raw: unknown) => Promise<unknown>) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url !== '/api/status' && req.url !== '/api/dialogue' && req.url !== '/api/tactics') { next(); return; }
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(body));
    };
    const host = req.headers.host ?? '';
    if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) { send(403, { error: 'Nur lokal verfügbar.' }); return; }
    if (req.url === '/api/status' && req.method === 'GET') { send(200, service.status()); return; }
    // Require an exact same-origin browser request, including the port. No CORS grants.
    if (req.method !== 'POST' || req.headers.origin !== `http://${host}` ||
        req.headers['content-type']?.split(';')[0] !== 'application/json') {
      send(403, { error: 'Anfrage nicht erlaubt.' }); return;
    }
    try {
      let size = 0; const chunks: Buffer[] = [];
      for await (const chunk of req) {
        size += Buffer.byteLength(chunk);
        if (size > 16_384) throw new ApiError(413, 'Anfrage zu groß.');
        chunks.push(Buffer.from(chunk));
      }
      let raw: unknown;
      try { raw = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw new ApiError(400, 'Ungültiges JSON.'); }
      if (req.url === '/api/tactics') {
        if (!tactics) throw new ApiError(503, 'Stockfish nicht verfügbar.');
        send(200, await tactics(raw));
      } else send(200, await service.reply(raw));
    } catch (error) {
      send(error instanceof ApiError ? error.status : 500,
        { error: error instanceof ApiError ? error.message : 'Interner Fehler.' });
    }
  };
}
