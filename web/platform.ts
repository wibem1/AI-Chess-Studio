import {BrowserRuntime} from '../src/browser-runtime.js';
export const browserRuntime=new BrowserRuntime();
let web=false;
export const platformReady=(async()=>{
 if(new URLSearchParams(location.search).get('platform')==='web'){web=true;return 'web' as const;}
 try{const r=await fetch('/api/status',{signal:AbortSignal.timeout(3000),cache:'no-store'});const value=r.ok?await r.json():null;if(value&&typeof value.available==='boolean'&&typeof value.remaining==='number')return 'desktop' as const;}catch{}
 web=true;return 'web' as const;
})();
export const isWebPlatform=()=>web;
export async function platformFetch(path:RequestInfo|URL,init?:RequestInit):Promise<Response>{
 await platformReady;
 if(!web)return fetch(path,init);
 try{
  if(typeof path!=='string'||!path.startsWith('/api/'))throw new Error('Ungültiger lokaler Aufruf.');
  const value=await browserRuntime.handle(path,init?.method??'GET',init?.body?JSON.parse(String(init.body)):undefined);
  return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch(error){return new Response(JSON.stringify({error:error instanceof Error?error.message:'Lokale Aktion fehlgeschlagen.'}),{status:typeof (error as {status?:unknown}|null)?.status==='number'?(error as {status:number}).status:400,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
}
