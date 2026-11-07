import {ModelDiagnostics} from './model-diagnostics.js';
import {providerBase,providerOf,providerOptions,validModel,generationOptions,modelCatalog} from './model-provider.js';
import {taggedReply,providerToolFields,ProviderContinuity,coachProviderFields,coachProviderMessages,coachToolReply} from './coach-provider.js';
import {decodeModelContent,normalizeModelReply} from './model-reply.js';
import {COACH_ERRORS,CoachFailure,providerFailure,type CoachFailureCode} from './model-errors.js';
import {validateGameReview} from './game-review.js';
import {BrowserStore,type StoredVault} from './browser-store.js';
import {sealConfig,openConfig,sealDeviceConfig,openDeviceConfig,type LocalModelConfig} from './browser-vault.js';
import {ApiError,parseRequest,SYSTEM_PROMPT,FREE_CHAT_PROMPT} from './model-contract.js';
import {validateReply} from './dialogue.js';
import {APP_VERSION} from './version.js';
import {BrowserTacticalAdapter} from './browser-tactics.js';

async function readProvider(response:Response,maxBytes=65536):Promise<any>{
 const reader=response.body?.getReader();if(!reader)throw new Error();
 const chunks:Uint8Array[]=[];let total=0;
 try{while(true){const next=await reader.read();if(next.done)break;total+=next.value.length;if(total>maxBytes)throw new Error();chunks.push(next.value);}}
 finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
/** Credentials are plaintext only in RAM. Profile mode stores ciphertext and a non-exportable CryptoKey. */
export class BrowserRuntime {
 readonly traces=new ModelDiagnostics();
 private continuity=new ProviderContinuity();
 private config:LocalModelConfig|null=null;private vaultEpoch=0;private busy=false;
 private tactics=new BrowserTacticalAdapter();
 private restoring:Promise<void>|undefined;
 private channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('chess-studio-vault'):null;
 constructor(readonly store=new BrowserStore(),private transport:typeof fetch=(input,init)=>fetch(input,init)){if(this.channel)this.channel.onmessage=event=>{this.vaultEpoch++;this.config=null;this.restoring=event.data==='changed'?undefined:Promise.resolve();window.dispatchEvent(new Event('chess-vault-change'));};}
 private restoreDevice(){return this.restoring??= (async()=>{const epoch=this.vaultEpoch,record=await this.store.get<StoredVault>('vault');if(record?.version===2){try{const config=await openDeviceConfig(record);if(epoch===this.vaultEpoch)this.config=config;}catch{if(epoch===this.vaultEpoch)this.config=null;}}})();}
 async status(){await this.restoreDevice();const record=await this.store.get<StoredVault>('vault');return {available:!!this.config,saved:!!record,locked:!!record&&!this.config,limit:null,remaining:null};}
 async handle(path:string,method:string,raw?:any,signal?:AbortSignal):Promise<any>{
  await this.restoreDevice();
  if(path==='/api/models'&&method==='POST')return modelCatalog(this.transport);
  if(path==='/api/ai-diagnostics'&&method==='POST'){if(raw?.action==='clear'){this.traces.clear();return {cleared:true};}return this.traces.export(raw,this.config?.apiKey);}
  if(path==='/api/status'&&method==='GET')return this.status();
  if(path==='/api/diagnostics'&&method==='GET'){const record=await this.store.get<StoredVault>('vault');return {version:APP_VERSION,node:'nicht erforderlich',platform:'Web-App',model:{...await this.status(),configured:!!this.config,localKeySaved:!!record,storageMode:record?.version===2?'device':record?'password':'none',locked:!this.config,model:this.config?.model??null,provider:this.config?providerOf(this.config):null,reasoning:this.config?.reasoning??null,costs:(await this.store.budget(l=>l.snapshot())).state,pricingIsEstimate:true},update:{stage:'web',message:'Web-App: unter App auf diesem Gerät nach Updates suchen.'}};}
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
    if(raw?.action==='select-model'){
     if(!this.config||raw.provider!==providerOf(this.config)||!validModel(raw.model,this.config))throw new ApiError(400,'Aktiven Provider und Modell prüfen.');
     const config={...this.config,model:raw.model,...providerOptions(raw)},record=await this.store.get<StoredVault>('vault');if(raw.reasoning===undefined)delete config.reasoning;if(record?.version===2){const sealed=await sealDeviceConfig(config);if(epoch!==this.vaultEpoch)throw new ApiError(409,'Zugang geändert.');await this.store.put('vault',sealed);this.channel?.postMessage('changed');}this.continuity.clear();this.config=config;return {...await this.status(),selectionPersistent:record?.version===2};
    }
    if(raw?.action!=='connect'||raw.allowPaid!==true)throw new ApiError(400,'Kostenfreigabe und Schlüssel prüfen.');
    const config={enabled:true,apiKey:raw.apiKey,model:raw.model,...providerOptions(raw)};
    const sealed=typeof raw.password==='string'&&raw.password.length?await sealConfig(config,raw.password):await sealDeviceConfig(config);await this.store.put('vault',sealed);this.channel?.postMessage('changed');
    const stored=await this.store.get<StoredVault>('vault');
    if(!stored||stored.version!==sealed.version)throw new ApiError(500,'Die Speicherung konnte nicht bestätigt werden. Bitte erneut speichern.');
    let unlocked:LocalModelConfig;
    try{unlocked=stored.version===2?await openDeviceConfig(stored):await openConfig(stored,raw.password);}
    catch{throw new ApiError(500,'Die Speicherung konnte nicht bestätigt werden: Der gespeicherte Schlüssel konnte nicht gelesen werden.');}
    if(unlocked.apiKey!==config.apiKey.trim()||unlocked.model!==config.model)throw new ApiError(409,'Gespeicherter Zugang wurde zwischenzeitlich geändert. Bitte erneut prüfen.');
    if(epoch!==this.vaultEpoch)throw new ApiError(409,'Schlüsselfach wurde in einem anderen Fenster geändert.');this.continuity.clear();this.config=unlocked;return await this.status();
   }finally{this.busy=false;}
  }
  if(path==='/api/costs'){
   if(this.busy)throw new ApiError(429,'Eine Modellanfrage läuft.');
   return (await this.store.budget(ledger=>ledger.configure(raw))).value;
  }
  if(path==='/api/tactics')return this.tactics.check(raw?.fen,raw?.candidate,raw?.history);
  if(path==='/api/diagnostics')return this.probe();
  if(path==='/api/dialogue')return this.respond(raw,signal);
  throw new ApiError(400,'Diese Funktion benötigt den Desktopbetrieb.');
 }
 private async probe(){
  if(!this.config)return {ok:false,httpStatus:null,message:'Lokales Schlüsselfach zuerst entsperren.'};
  try{
   const r=await this.transport(providerOf(this.config)==='openrouter'?providerBase(this.config)+'/key':providerBase(this.config)+'/models/'+encodeURIComponent(this.config.model),{method:'GET',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',headers:{Authorization:'Bearer '+this.config.apiKey},signal:AbortSignal.timeout(5000)});
   await r.body?.cancel();return {ok:r.ok,httpStatus:r.status,message:r.ok?(providerOf(this.config)==='openrouter'?'OpenRouter-Schlüssel akzeptiert; Modellzugriff und Brettwerkzeuge noch nicht geprüft.':'Schlüssel und Modellzugriff bestätigt. Keine Textgenerierung ausgeführt.'):r.status===401?'OpenAI lehnt den Schlüssel ab.':'Modellzugriff nicht bestätigt. Anbieterfreigabe und Kontingent prüfen.'};
  }catch{return {ok:false,httpStatus:null,message:'Anbieter nicht erreichbar. Internet, Browserfreigaben und CORS prüfen. Keine Textgenerierung ausgeführt.'};}
 }
 private async respond(raw:unknown,signal?:AbortSignal){
  if(!this.config)throw new ApiError(403,'Lokales Schlüsselfach ist gesperrt.');
  const config=this.config;
  const request=parseRequest(raw);if(request.expectedModel&&request.expectedModel!==config.model)throw new ApiError(409,'Modell während des Testlaufs gewechselt.');
  if(this.busy)throw new ApiError(429,'Eine Modellanfrage läuft bereits.');
  const {turns=[],toolExchanges,...current}=request;
  const retrospective=request.topic==='review'&&(request.hintMode??'explain')==='explain',outputTokens=retrospective||request.topic==='chat'?1800:800;
  const body=JSON.stringify({model:config.model,...generationOptions(config,outputTokens),...providerToolFields(config,request),...(request.topic==='chat'?{}:{response_format:{type:'json_object'}}),messages:[{role:'system',content:request.topic==='chat'?FREE_CHAT_PROMPT:SYSTEM_PROMPT},...turns.map(t=>({role:t.role,content:`[Stellung ${t.nodeId}${t.fen?`, FEN ${t.fen}`:''}] ${t.text}`})),{role:'user',content:JSON.stringify(current)},...(providerOf(config)==='openrouter'?this.continuity.restore(coachProviderMessages(request)):coachProviderMessages(request))]});
  if(new TextEncoder().encode(body).length>120000)throw new ApiError(400,'Modellkontext ist zu groß.');
  const trace=this.traces.start(JSON.parse(body),{nodeId:request.nodeId,fen:request.fen,provider:providerOf(config),model:config.model,reasoning:config.reasoning??null,toolRound:request.toolExchanges?.length??0,priceAssumptions:(await this.store.budget(l=>l.snapshot())).state},config.apiKey);
  this.busy=true;let httpStatus:number|undefined;let reserved=0,started=false;let failureCode:CoachFailureCode='network';
  try{
   reserved=(await this.store.budget(l=>l.reserve(new TextEncoder().encode(body).length,JSON.parse(body).max_tokens??JSON.parse(body).max_completion_tokens))).value;
   if(this.config!==config)throw new Error();
   started=true;
   trace.sent();const response=await this.transport(providerBase(config)+'/chat/completions',{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',headers:{Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json'},body,signal:AbortSignal.any([AbortSignal.timeout(config.reasoning?90000:15000),...(signal?[signal]:[])])});
   httpStatus=response.status;
   if(!response.ok){await response.body?.cancel();throw new CoachFailure(providerFailure(response.status));}
   failureCode='provider_format';
   const envelope=await readProvider(response,providerOf(config)==='openrouter'?524288:65536);if(providerOf(config)==='openrouter')this.continuity.remember(envelope.choices?.[0]?.message);trace.received(envelope,response.status);await this.store.budget(l=>l.settle(reserved,envelope.usage));
   if(envelope.choices?.[0]?.finish_reason==='length')throw new CoachFailure('output_limit');
   const toolReply=coachToolReply(envelope.choices?.[0],request);if(toolReply){trace.finish('accepted');return taggedReply(toolReply,config,envelope,trace.id);}
      if(envelope.choices?.[0]?.finish_reason!=='stop')throw new Error();
   failureCode='reply_format';
   const reply=normalizeModelReply(decodeModelContent(envelope.choices[0].message.content,request.topic!=='chat'),request.legalMoves);
   if(!reply.message?.trim()||request.hintMode==='question'&&(!reply.openQuestions.length||reply.candidates.length))throw new Error();
   failureCode='review_format';if(retrospective)validateGameReview(reply.gameReview,request.history);
   trace.finish('accepted');return taggedReply(reply,config,envelope,trace.id);
  }catch(error){
   if(!started){trace.finish('failed','accounting');throw new ApiError(402,'Verbrauch konnte nicht gespeichert werden.');}
   const code=error instanceof CoachFailure?error.code:failureCode;trace.finish('failed',code,httpStatus);
   throw new ApiError(502,COACH_ERRORS[code]+' Keine neue Antwort gespeichert. Die Kostenschätzung bleibt bei unklarer Nutzung bestehen.',code);
  }finally{this.busy=false;}
 }
}
