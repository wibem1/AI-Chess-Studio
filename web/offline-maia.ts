import {appPath} from '../src/app-path.js';
import {MAIA_BYTES,MAIA_CACHE,MAIA_FILES,MAIA_SHA256,MAIA_ASSET_BASE} from '../src/maia-files.js';

const files=MAIA_FILES.filter(name=>name==='maia2-blitz.fp16.onnx'||name==='ort-wasm-simd-threaded.mjs'||name==='ort-wasm-simd-threaded.wasm');
const fileUrl=(name:string)=>new URL(appPath(MAIA_ASSET_BASE+name),location.origin).href;
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');

export async function maiaOfflineAvailable():Promise<boolean>{
 if(!('caches' in window))return false;
 const cache=await caches.open(MAIA_CACHE);
 for(const name of files){
  const response=await cache.match(fileUrl(name));
  if(!response?.ok)return false;
  const bytes=await response.arrayBuffer();
  if(!bytes.byteLength)return false;
  if(name==='maia2-blitz.fp16.onnx'&&bytes.byteLength!==MAIA_BYTES)return false;
 }
 return true;
}

/** Explicit download. Never add provider credentials or private session data to the cache. */
export async function prepareMaiaOffline(progress:(message:string)=>void):Promise<void>{
 if(!('caches' in window)||!crypto.subtle)throw new Error('Offline-Speicherung wird von diesem Browser nicht unterstützt.');
 const cache=await caches.open(MAIA_CACHE);
 let done=0;
 for(const name of files){
  const url=fileUrl(name);
  progress('Maia-Dateien werden geprüft und geladen ('+done+'/'+files.length+') …');
  let response=await cache.match(url);
  if(!response?.ok){
   response=await fetch(url,{credentials:'omit',redirect:'error',cache:'no-store'});
   if(!response.ok||new URL(response.url).origin!==location.origin)throw new Error('Maia-Datei nicht erreichbar: '+name);
  }
  const buffer=await response.arrayBuffer();
  if(!buffer.byteLength)throw new Error('Leere Maia-Datei: '+name);
  if(name==='maia2-blitz.fp16.onnx'){
   const digest=hex(await crypto.subtle.digest('SHA-256',buffer));
   if(buffer.byteLength!==MAIA_BYTES||digest!==MAIA_SHA256){
    await cache.delete(url);
    throw new Error('Maia-Modell ist beschädigt. Bitte den Download wiederholen.');
   }
  }
  await cache.put(url,new Response(buffer,{headers:{'Content-Type':name.endsWith('.mjs')?'text/javascript':'application/octet-stream'}}));
  done++;
  progress('Maia-Dateien lokal gespeichert ('+done+'/'+files.length+') …');
 }
 if(!await maiaOfflineAvailable())throw new Error('Maia-Dateien wurden nicht vollständig gespeichert.');
}
