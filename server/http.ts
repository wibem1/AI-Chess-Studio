import { APP_VERSION } from '../src/version.js';
import type { UpdateService } from './updates.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ApiError, ModelService } from './model.js';

export function modelMiddleware(service: ModelService, tactics?: (raw: unknown) => Promise<unknown>, updates?:UpdateService, play?:(raw:unknown)=>Promise<unknown>) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!['/api/status','/api/dialogue','/api/tactics','/api/model-config','/api/diagnostics','/api/costs','/api/update','/api/play'].includes(req.url ?? '')) { next(); return; }
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(body));
    };
    const host = req.headers.host ?? '';
    if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) { send(403, { error: 'Nur lokal verfügbar.' }); return; }
    if (req.url === '/api/status' && req.method === 'GET') { send(200, service.status()); return; }
    if(req.url==='/api/diagnostics' && req.method==='GET'){send(200,{version:APP_VERSION,node:process.versions.node,platform:process.platform,model:service.diagnostics(),update:updates?.status()??null});return;}
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
      if(req.url==='/api/play'){if(!play)throw new ApiError(503,'Spielengine fehlt.');send(200,await play(raw));}
      else if(req.url==='/api/diagnostics'){send(200,await service.probeAccess());}
      else if(req.url==='/api/costs'){send(200,service.configureCosts(raw));}
      else if(req.url==='/api/update'){
        const r=raw as {action?:unknown;target?:unknown};
        if(!updates)throw new ApiError(503,'Updates nicht verfügbar.');
        try{
          if(r?.action==='check')send(200,await updates.check());
          else if(r?.action==='install' && typeof r.target==='string')send(202,await updates.install(r.target));
          else throw new Error();
        }catch{throw new ApiError(400,'Update nicht verfügbar oder eigene Änderungen vorhanden. GitHub-Zugriff und Projektstand prüfen.');}
      } else if (req.url === '/api/model-config') {
        send(200, service.configure(raw));
      } else if (req.url === '/api/tactics') {
        if (!tactics) throw new ApiError(503, 'Stockfish nicht verfügbar.');
        send(200, await tactics(raw));
      } else send(200, await service.reply(raw));
    } catch (error) {
      send(error instanceof ApiError ? error.status : 500,
        { error: error instanceof ApiError ? error.message : 'Interner Fehler.',code:error instanceof ApiError?error.code:'' });
    }
  };
}
