import type {Plugin} from 'vite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
/** Cache public build artifacts only, never runtime requests or user data. */
export function pwaAssets():Plugin{return {
 name:'local-offline-shell',apply:'build',enforce:'post',
 generateBundle(_options,bundle){
  const publicFiles=['licenses.html','licenses/chess.js-LICENSE.txt','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
  const artifacts=Object.keys(bundle).filter(name=>name==='index.html'||/^(assets|engine)\//.test(name));
  const hash=createHash('sha256');
  for(const name of artifacts.sort()){const entry=bundle[name]!;hash.update(name);hash.update(entry.type==='chunk'?entry.code:entry.source);}
  for(const name of publicFiles){hash.update(name);hash.update(readFileSync('public/'+name));}
  const cache='chess-studio-shell-'+hash.digest('hex').slice(0,20),paths=['/',...artifacts.filter(p=>p!=='index.html').map(p=>'/'+p),...publicFiles.map(p=>'/'+p)];
  this.emitFile({type:'asset',fileName:'service-worker.js',source:`
const CACHE=${JSON.stringify(cache)},PATHS=${JSON.stringify(paths)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PATHS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('chess-studio-shell-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&(url.pathname==='/'||url.pathname==='/index.html')){
  event.respondWith(caches.open(CACHE).then(cache=>cache.match('/')).then(response=>response||fetch(request)));return;
 }
 if(url.search||!PATHS.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname)).then(response=>response||fetch(request)));
});
`});
 }
};}
