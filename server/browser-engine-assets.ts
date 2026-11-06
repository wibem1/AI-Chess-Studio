import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {readFileSync} from 'node:fs';
import type {Plugin} from 'vite';
import {ENGINE_ASSET_BASE,ENGINE_FILES,engineAsset,engineContentType} from '../src/engine-files.js';
const require=createRequire(import.meta.url);

/** Copy the unchanged pinned upstream runtime, license and source reference at build time. */
export function browserEngineAssets():Plugin {
 const folder=dirname(require.resolve('stockfish/package.json'));
 const metadata=JSON.parse(readFileSync(join(folder,'package.json'),'utf8'));
 if(metadata.version!=='19.0.1')throw new Error('Browser-Engine-Dateien müssen zur festgelegten Version passen.');
 const notice=`Stockfish.js ${metadata.version}, lite-single (single-threaded WebAssembly).\nUnmodified upstream JS/WASM. GPL-3.0, see COPYING.txt.\nCorresponding source and build instructions:\nhttps://github.com/nmrugg/stockfish.js/tree/v19.0.1\nSource archive: https://github.com/nmrugg/stockfish.js/archive/refs/tags/v19.0.1.tar.gz\nStockfish upstream: https://github.com/official-stockfish/Stockfish\n`;
 const contents=(name:string):Buffer=>name===ENGINE_FILES.source?Buffer.from(notice):readFileSync(name===ENGINE_FILES.license?join(folder,'Copying.txt'):join(folder,'bin',name));
 return {
  name:'pinned-browser-stockfish-assets',
  generateBundle(){for(const name of Object.values(ENGINE_FILES))this.emitFile({type:'asset',fileName:ENGINE_ASSET_BASE.slice(1)+name,source:contents(name)});},
  configureServer(server){
   server.middlewares.use((req,res,next)=>{
    const path=(req.url??'').split('?')[0]!,name=engineAsset(path);
    if(!path.startsWith('/engine/')){next();return;}
    if(!name){res.writeHead(404);res.end('Nicht gefunden.');return;}
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
    res.setHeader('Content-Type',engineContentType(name));res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','public, max-age=31536000, immutable');
    res.end(req.method==='HEAD'?undefined:contents(name));
   });
  }
 };
}
