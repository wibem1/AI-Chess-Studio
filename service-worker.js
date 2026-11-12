
const CACHE="chess-studio-shell-2f41492d43686573732d53747564696f2f-687f83f991787a1657a2",PREFIX="chess-studio-shell-2f41492d43686573732d53747564696f2f-",BASE="/AI-Chess-Studio/",OPTIONAL=["/AI-Chess-Studio/engine/maia2-blitz-ort1.31.1/LICENSES.txt","/AI-Chess-Studio/engine/maia2-blitz-ort1.31.1/SOURCE.txt","/AI-Chess-Studio/engine/maia2-blitz-ort1.31.1/maia2-blitz.fp16.onnx","/AI-Chess-Studio/engine/maia2-blitz-ort1.31.1/ort-wasm-simd-threaded.mjs","/AI-Chess-Studio/engine/maia2-blitz-ort1.31.1/ort-wasm-simd-threaded.wasm"],OPTIONAL_CACHE="chess-studio-maia2-blitz-ort1.31.1",PATHS=["/AI-Chess-Studio/","/AI-Chess-Studio/assets/index-B7pPx51l.js","/AI-Chess-Studio/assets/index-BApQJz5W.css","/AI-Chess-Studio/assets/maia-worker-DeKSBr_z.js","/AI-Chess-Studio/engine/stockfish-19.0.1/COPYING.txt","/AI-Chess-Studio/engine/stockfish-19.0.1/SOURCE.txt","/AI-Chess-Studio/engine/stockfish-19.0.1/stockfish-19-lite-single.js","/AI-Chess-Studio/engine/stockfish-19.0.1/stockfish-19-lite-single.wasm","/AI-Chess-Studio/licenses.html","/AI-Chess-Studio/licenses/chess.js-LICENSE.txt","/AI-Chess-Studio/manifest.webmanifest","/AI-Chess-Studio/icons/icon-192.png","/AI-Chess-Studio/icons/icon-512.png","/AI-Chess-Studio/icons/apple-touch-icon.png"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PATHS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&(url.pathname===BASE||url.pathname===BASE+'index.html')){
  event.respondWith((async()=>{try{const fresh=await fetch(request,{cache:'no-store'});if(fresh.ok)return fresh;}catch{}return (await (await caches.open(CACHE)).match(BASE))||Response.error();})());return;
 }
 if(!url.search&&OPTIONAL.includes(url.pathname)){event.respondWith((async()=>{let cache;try{cache=await caches.open(OPTIONAL_CACHE);const saved=await cache.match(request);if(saved)return saved;}catch{}const response=await fetch(request);if(response.ok)try{await cache?.put(request,response.clone());}catch{}return response;})());return;}
 if(url.search||!PATHS.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname)).then(response=>response||fetch(request)));
});
