import type {Plugin} from 'vite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
/** Cache public build artifacts only, never runtime requests or user data. */
export function pwaAssets():Plugin{let base='/';return {
 name:'local-offline-shell',apply:'build',enforce:'post',
 configResolved(config){base=config.base;if(!/^\/(?:[a-zA-Z0-9_.-]+\/)*$/.test(base))throw new Error('App-Basis muss ein lokaler Verzeichnispfad sein.');if(!config.define)throw new Error('App-Basisdefinition fehlt.');config.define.__APP_BASE__=JSON.stringify(base);},
 generateBundle(_options,bundle){
  const publicFiles=['licenses.html','licenses/chess.js-LICENSE.txt','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
  const artifacts=Object.keys(bundle).filter(name=>name==='index.html'||/^(assets|engine)\//.test(name));
  const hash=createHash('sha256');hash.update(base);
  for(const name of artifacts.sort()){const entry=bundle[name]!;hash.update(name);hash.update(entry.type==='chunk'?entry.code:entry.source);}
  for(const name of publicFiles){hash.update(name);hash.update(readFileSync('public/'+name));}
  const prefix='chess-studio-shell-'+Buffer.from(base).toString('hex')+'-',cache=prefix+hash.digest('hex').slice(0,20),paths=[base,...artifacts.filter(p=>p!=='index.html').map(p=>base+p),...publicFiles.map(p=>base+p)];
  this.emitFile({type:'asset',fileName:'service-worker.js',source:`
const CACHE=${JSON.stringify(cache)},PREFIX=${JSON.stringify(prefix)},BASE=${JSON.stringify(base)},PATHS=${JSON.stringify(paths)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PATHS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&(url.pathname===BASE||url.pathname===BASE+'index.html')){
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(BASE)).then(response=>response||fetch(request)));return;
 }
 if(url.search||!PATHS.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname)).then(response=>response||fetch(request)));
});
`});
 }
};}
