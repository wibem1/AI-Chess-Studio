import {BrowserStore,type StoredVault} from './browser-store.js';
import {sealConfig,openConfig,sealDeviceConfig,openDeviceConfig,type LocalModelConfig} from './browser-vault.js';
import {ApiError,parseRequest,SYSTEM_PROMPT} from './model-contract.js';
import {validateReply} from './dialogue.js';
import {APP_VERSION} from './version.js';
import {BrowserTacticalAdapter} from './browser-tactics.js';

async function readProvider(response:Response):Promise<any>{
 const reader=response.body?.getReader();if(!reader)throw new Error();
 const chunks:Uint8Array[]=[];let total=0;
 try{while(true){const next=await reader.read();if(next.done)break;total+=next.value.length;if(total>65536)throw new Error();chunks.push(next.value);}}
 finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
/** Credentials are plaintext only in RAM. Profile mode stores ciphertext and a non-exportable CryptoKey. */
export class BrowserRuntime {
 private config:LocalModelConfig|null=null;private vaultEpoch=0;private attempts=0;private busy=false;
 private tactics=new BrowserTacticalAdapter();
 private restoring:Promise<void>|undefined;
 private channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('chess-studio-vault'):null;
 constructor(readonly store=new BrowserStore(),private transport:typeof fetch=(input,init)=>fetch(input,init)){if(this.channel)this.channel.onmessage=event=>{this.vaultEpoch++;this.config=null;this.restoring=event.data==='changed'?undefined:Promise.resolve();window.dispatchEvent(new Event('chess-vault-change'));};}
 private restoreDevice(){return this.restoring??= (async()=>{const epoch=this.vaultEpoch,record=await this.store.get<StoredVault>('vault');if(record?.version===2){try{const config=await openDeviceConfig(record);if(epoch===this.vaultEpoch)this.config=config;}catch{if(epoch===this.vaultEpoch)this.config=null;}}})();}
 async status(){await this.restoreDevice();const c=(await this.store.budget(ledger=>ledger.snapshot())).state;return {available:!!this.config,remaining:Math.max(0,Math.min(3-this.attempts,3-c.requests))};}
 async handle(path:string,method:string,raw?:any):Promise<any>{
  await this.restoreDevice();
  if(path==='/api/status'&&method==='GET')return this.status();
  if(path==='/api/diagnostics'&&method==='GET'){const record=await this.store.get<StoredVault>('vault');return {version:APP_VERSION,node:'nicht erforderlich',platform:'Web-App',model:{...await this.status(),configured:!!this.config,localKeySaved:!!record,storageMode:record?.version===2?'device':record?'password':'none',locked:!this.config,model:this.config?.model??null,costs:(await this.store.budget(l=>l.snapshot())).state,pricingIsEstimate:true},update:{stage:'web',message:'Web-App: unter App auf diesem Gerät nach Updates suchen.'}};}
  if(method!=='POST')throw new ApiError(405,'Aktion nicht unterstützt.');
  if(path==='/api/vault'||path==='/api/model-config'){
   if(this.busy)throw new ApiError(429,'Eine lokale Schlüsselaktion oder Modellanfrage läuft.');
   this.busy=true;const epoch=this.vaultEpoch;
   try{
    if(path==='/api/vault'){
     if(raw?.action==='lock'){this.config=null;this.channel?.postMessage('lock');return await this.status();}
     if(raw?.action==='use-device'){
      if(!this.config)throw new ApiError(403,'Bisherigen Passwortschutz zuerst entsperren.');
      const sealed=await sealDeviceConfig(this.config);if(epoch!==this.vaultEpoch)throw new ApiError(409,'Schlüssel wurde zwischenzeitlich geändert.');await this.store.put('vault',sealed);this.channel?.postMessage('changed');return await this.status();
     }
     if(raw?.action!=='unlock')throw new ApiError(400,'Ungültige Schlüsselaktion.');
     const record=await this.store.get<StoredVault>('vault');
     if(!record)throw new ApiError(400,'Kein lokales Schlüsselfach vorhanden.');
     const config=record.version===2?await openDeviceConfig(record):await openConfig(record,raw.password);if(epoch!==this.vaultEpoch)throw new ApiError(409,'Schlüsselfach wurde in einem anderen Fenster geändert.');this.config=config;return await this.status();
    }
    if(raw?.action==='disconnect'){await this.store.clear('vault');this.config=null;this.channel?.postMessage('changed');return await this.status();}
    if(raw?.action!=='connect'||raw.allowPaid!==true)throw new ApiError(400,'Kostenfreigabe und Schlüssel prüfen.');
    const config={enabled:true,apiKey:raw.apiKey,model:raw.model};
    const sealed=typeof raw.password==='string'&&raw.password.length?await sealConfig(config,raw.password):await sealDeviceConfig(config);await this.store.put('vault',sealed);this.channel?.postMessage('changed');
    const stored=await this.store.get<StoredVault>('vault');
    if(!stored||stored.version!==sealed.version)throw new ApiError(500,'Die Speicherung konnte nicht bestätigt werden. Bitte erneut speichern.');
    let unlocked:LocalModelConfig;
    try{unlocked=stored.version===2?await openDeviceConfig(stored):await openConfig(stored,raw.password);}
    catch{throw new ApiError(500,'Die Speicherung konnte nicht bestätigt werden: Der gespeicherte Schlüssel konnte nicht gelesen werden.');}
    if(unlocked.apiKey!==config.apiKey.trim()||unlocked.model!==config.model)throw new ApiError(409,'Gespeicherter Zugang wurde zwischenzeitlich geändert. Bitte erneut prüfen.');
    if(epoch!==this.vaultEpoch)throw new ApiError(409,'Schlüsselfach wurde in einem anderen Fenster geändert.');this.config=unlocked;return await this.status();
   }finally{this.busy=false;}
  }
  if(path==='/api/costs'){
   if(this.busy)throw new ApiError(429,'Eine Modellanfrage läuft.');
   return (await this.store.budget(ledger=>ledger.configure(raw))).value;
  }
  if(path==='/api/tactics')return this.tactics.check(raw?.fen,raw?.candidate,raw?.history);
  if(path==='/api/diagnostics')return this.probe();
  if(path==='/api/dialogue')return this.respond(raw);
  throw new ApiError(400,'Diese Funktion benötigt den Desktopbetrieb.');
 }
 private async probe(){
  if(!this.config)return {ok:false,httpStatus:null,message:'Lokales Schlüsselfach zuerst entsperren.'};
  try{
   const r=await this.transport('https://api.openai.com/v1/models/'+encodeURIComponent(this.config.model),{method:'GET',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',headers:{Authorization:'Bearer '+this.config.apiKey},signal:AbortSignal.timeout(5000)});
   await r.body?.cancel();return {ok:r.ok,httpStatus:r.status,message:r.ok?'Schlüssel und Modellzugriff bestätigt. Keine Textgenerierung ausgeführt.':r.status===401?'OpenAI lehnt den Schlüssel ab.':'Modellzugriff nicht bestätigt. Anbieterfreigabe und Kontingent prüfen.'};
  }catch{return {ok:false,httpStatus:null,message:'Anbieter nicht erreichbar. Internet, Browserfreigaben und CORS prüfen. Keine Textgenerierung ausgeführt.'};}
 }
 private async respond(raw:unknown){
  if(!this.config)throw new ApiError(403,'Lokales Schlüsselfach ist gesperrt.');
  const config=this.config;
  const request=parseRequest(raw);
  if(this.busy||this.attempts>=3)throw new ApiError(429,'Anfragelimit erreicht oder Anfrage läuft.');
  const {turns=[],...current}=request;
  const body=JSON.stringify({model:config.model,max_completion_tokens:800,response_format:{type:'json_object'},messages:[{role:'system',content:SYSTEM_PROMPT},...turns.map(t=>({role:t.role,content:`[Stellung ${t.nodeId}] ${t.text}`})),{role:'user',content:JSON.stringify(current)}]});
  if(new TextEncoder().encode(body).length>24000)throw new ApiError(400,'Modellkontext ist zu groß.');
  this.busy=true;let reserved=0,started=false;
  try{
   reserved=(await this.store.budget(l=>l.reserve(new TextEncoder().encode(body).length,800))).value;
   if(this.config!==config)throw new Error();
   this.attempts++;started=true;
   const response=await this.transport('https://api.openai.com/v1/chat/completions',{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',headers:{Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json'},body,signal:AbortSignal.timeout(15000)});
   if(!response.ok){await response.body?.cancel();throw new Error();}
   const envelope=await readProvider(response);await this.store.budget(l=>l.settle(reserved,envelope.usage));
   if(envelope.choices?.[0]?.finish_reason!=='stop')throw new Error();
   const reply=validateReply(JSON.parse(envelope.choices[0].message.content),request.legalMoves);
   if(!reply.message?.trim()||!reply.humanFactors||request.hintMode==='question'&&(!reply.openQuestions.length||reply.candidates.length))throw new Error();
   return reply;
  }catch(error){
   if(!started)throw new ApiError(402,'Lokales Kosten- oder Anfragebudget erreicht.');
   throw new ApiError(502,'Modellanfrage fehlgeschlagen oder Antwort ungültig. Budgetreservierung bleibt bei unklarer Nutzung bestehen.');
  }finally{this.busy=false;}
 }
}
