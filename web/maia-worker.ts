import * as ort from 'onnxruntime-web/wasm';
import {createMaia,sampleMove,type Maia} from '@indiefoundry/maia2-onnx';
import {MAIA_BYTES,MAIA_SHA256,MAIA_CACHE} from '../src/maia-files.js';
ort.env.wasm.numThreads=1;
ort.env.wasm.proxy=false;
let model:Promise<Maia>|undefined;
async function load(base:string):Promise<Maia>{
 const url=new URL('maia2-blitz.fp16.onnx',base);if(url.origin!==location.origin)throw new Error('Falsche Modellquelle.');
 ort.env.wasm.wasmPaths=base;
 let cache:Cache|undefined;try{cache=await caches.open(MAIA_CACHE);}catch{}
 const cached=await cache?.match(url.href);const response=cached??await fetch(url.href,{credentials:'omit',redirect:'error'});
 if(!response.ok)throw new Error('Maia-Modell konnte nicht geladen werden.');
 const bytes=await response.arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(bytes.byteLength!==MAIA_BYTES||hash!==MAIA_SHA256){await cache?.delete(url.href);throw new Error('Maia-Modellprüfung fehlgeschlagen.');}
 if(!cached)try{await cache?.put(url.href,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));}catch{}
 const session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm']});
 // This pinned conversion names the official board/policy/value tensors differently.
 return createMaia({Tensor:ort.Tensor,session:{run:async({boards,...feeds})=>{const out=await session.run({board:boards as ort.Tensor,...feeds as Record<string,ort.Tensor>});return {logits_move:out.policy!,logits_value:out.value!};}}});
}
self.onmessage=async(event:MessageEvent<{base:string;fen:string;rating:number}>)=>{
 try{
  if(!model)self.postMessage({status:'Maia wird vorbereitet: beim ersten Einsatz etwa 60 MB laden. Das Brett bleibt bedienbar.'});
  model??=load(event.data.base);const maia=await model;
  self.postMessage({status:'Maia berechnet einen menschlichen Zug …'});
  const prediction=await maia.predict(event.data.fen,event.data.rating,event.data.rating);
  const uci=sampleMove(prediction,{minP:0.01}).uci;self.postMessage({uci});
 }catch(error){console.error('Maia-WASM:',error instanceof Error?error.message:'Laufzeitfehler');model=undefined;self.postMessage({error:'Maia konnte nicht rechnen. Internetverbindung und freien Gerätespeicher prüfen; danach bewusst fortsetzen. Es wurde kein Ersatzgegner gestartet.'});}
};
