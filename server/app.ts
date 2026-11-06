import {maiaAsset} from '../src/maia-files.js';
import {engineAsset,engineContentType} from '../src/engine-files.js';
import { FileCredentialsStore, credentialsPath } from './credentials.js';
import { CostControl } from './costs.js';
import { UpdateService } from './updates.js';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { ModelService, readConfig } from './model.js';
import { PlayingEngineService } from './playing-engine.js';
import { StockfishService } from './stockfish.js';
import { modelMiddleware } from './http.js';

/** Local application server. Serves only built public assets, never the checkout. */
export function createStudioServer(options: { webRoot?: string; env?: NodeJS.ProcessEnv; credentialsPath?: string } = {}) {
  const webRoot = options.webRoot ?? fileURLToPath(new URL('../../web-dist/',import.meta.url));
  const stockfish = new StockfishService();
  const playingEngine=new PlayingEngineService();
  const env = options.env ?? process.env;
  const store = new FileCredentialsStore(options.credentialsPath ?? credentialsPath(env));
  const api = modelMiddleware(new ModelService(readConfig(env), fetch, store,new CostControl((options.credentialsPath ?? credentialsPath(env))+'.usage.json')), raw => stockfish.check(raw),new UpdateService(fileURLToPath(new URL('../../',import.meta.url))),raw=>playingEngine.move(raw));
  return createServer((req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self'; connect-src 'self' https://api.openai.com; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const host = req.headers.host ?? '';
    if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) { res.writeHead(403);res.end('Nur lokal verfügbar.');return; }
    void api(req,res,() => { void (async () => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {res.writeHead(405);res.end();return;}
      const path = (req.url ?? '').split('?')[0]!;
      const engine=engineAsset(path)??maiaAsset(path);
      let relative: string;
      if(engine)relative=path.slice(1);
      else if (path === '/' || path === '/index.html') relative = 'index.html';
      else if(path==='/licenses.html' || path==='/licenses/chess.js-LICENSE.txt' || path==='/service-worker.js' || path==='/manifest.webmanifest' || /^\/icons\/(icon-192|icon-512|apple-touch-icon)\.png$/.test(path))relative=path.slice(1);
      else if (/^\/assets\/[a-zA-Z0-9_-]+\.(js|css)$/.test(path)) relative = path.slice(1);
      else {res.writeHead(404);res.end('Nicht gefunden.');return;}
      try {
        const content = await readFile(join(webRoot,relative));
        res.setHeader('Content-Type',engine?engineContentType(engine):relative.endsWith('.webmanifest')?'application/manifest+json':relative.endsWith('.png')?'image/png':relative.endsWith('.txt')?'text/plain; charset=utf-8':(relative.endsWith('.js')||relative.endsWith('.mjs')) ? 'text/javascript; charset=utf-8' : relative.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8');
        res.setHeader('Cache-Control',engine?'public, max-age=31536000, immutable':'no-store');
        res.writeHead(200);res.end(req.method === 'HEAD' ? undefined : content);
      } catch {res.writeHead(404);res.end('Anwendung nicht gebaut. Zuerst npm run build ausführen.');}
    })(); });
  });
}
