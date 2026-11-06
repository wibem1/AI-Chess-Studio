import {engineContentType} from '../src/engine-files.js';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {Plugin} from 'vite';
import {MAIA_ASSET_BASE,MAIA_FILES,MAIA_SHA256,MAIA_BYTES,maiaAsset} from '../src/maia-files.js';
const require=createRequire(import.meta.url);
export function maiaAssets():Plugin{
 const ort=dirname(dirname(require.resolve('onnxruntime-web/wasm')));
 if(JSON.parse(readFileSync(join(ort,'package.json'),'utf8')).version!=='1.31.1')throw new Error('Maia-Laufzeitversion stimmt nicht.');
 const contents=(name:string)=>readFileSync(name.startsWith('ort-')?join(ort,'dist',name):join('vendor/maia2',name));
 const model=contents(MAIA_FILES[0]);if(model.byteLength!==MAIA_BYTES||createHash('sha256').update(model).digest('hex')!==MAIA_SHA256)throw new Error('Maia-Modellfingerabdruck stimmt nicht.');
 return {name:'pinned-maia-browser-assets',generateBundle(){for(const name of MAIA_FILES)this.emitFile({type:'asset',fileName:MAIA_ASSET_BASE.slice(1)+name,source:contents(name)});},configureServer(server){server.middlewares.use((req,res,next)=>{const name=maiaAsset((req.url??'').split('?')[0]!);if(!name){next();return;}if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}res.setHeader('Content-Type',engineContentType(name));res.end(req.method==='HEAD'?undefined:contents(name));});}};
}
