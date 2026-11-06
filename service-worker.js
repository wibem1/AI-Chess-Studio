
const CACHE="chess-studio-shell-2f41492d43686573732d53747564696f2f-99343e595f3ab1971931",PREFIX="chess-studio-shell-2f41492d43686573732d53747564696f2f-",BASE="/AI-Chess-Studio/",PATHS=["/AI-Chess-Studio/","/AI-Chess-Studio/assets/index-BsaBuBih.js","/AI-Chess-Studio/assets/index-DCt6W2NG.css","/AI-Chess-Studio/engine/stockfish-19.0.1/COPYING.txt","/AI-Chess-Studio/engine/stockfish-19.0.1/SOURCE.txt","/AI-Chess-Studio/engine/stockfish-19.0.1/stockfish-19-lite-single.js","/AI-Chess-Studio/engine/stockfish-19.0.1/stockfish-19-lite-single.wasm","/AI-Chess-Studio/licenses.html","/AI-Chess-Studio/licenses/chess.js-LICENSE.txt","/AI-Chess-Studio/manifest.webmanifest","/AI-Chess-Studio/icons/icon-192.png","/AI-Chess-Studio/icons/icon-512.png","/AI-Chess-Studio/icons/apple-touch-icon.png"];
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
