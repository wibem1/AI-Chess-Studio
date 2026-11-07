import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sealConfig,openConfig,sealDeviceConfig,openDeviceConfig} from '../src/browser-vault.js';
import {BrowserStore} from '../src/browser-store.js';
import {BrowserRuntime} from '../src/browser-runtime.js';
import {CostLedger,type CostState} from '../src/costs.js';
import {Session} from '../src/session.js';
import {BrowserTacticalAdapter} from '../src/browser-tactics.js';
import type {EngineWorker} from '../src/browser-uci.js';
const config={enabled:true,apiKey:'fixture-browser-secret',model:'gpt-4.1-mini'},password='fixture-device-password';
const request=()=>({nodeId:'n0',fen:new Session().snapshot().nodes[0]!.fen,legalMoves:new Session().legalMoves(),question:'Plan?',context:[]});
const reply={message:'Was möchtest du erreichen?',plan:'Idee prüfen',opponent:'Möglicher Gegenplan',risks:'Antwort prüfen',playability:'Verständlich spielen',assessment:{verdict:'unclear' as const,reason:'Testeinschätzung: keine geprüfte Gesamtbewertung.',dangers:[]},humanFactors:{idea:'Idee',calculation:'Rechnen',pitfalls:'Übersehbare Antwort',continuation:'Plan'},candidates:[],openQuestions:['Was möchtest du erreichen?']};
class MemoryStore extends BrowserStore {
 data=new Map<string,unknown>();
 override async get<T>(store:'vault'|'budget'|'session'):Promise<T|null>{return this.data.get(store) as T??null;}
 override async put(store:'vault'|'session',value:unknown){this.data.set(store,value);}
 override async clear(store:'vault'|'session'){this.data.delete(store);}
 override async budget<T>(mutate:(ledger:CostLedger)=>T):Promise<{value:T;state:CostState}>{const ledger=new CostLedger(this.data.get('budget')??null);const value=mutate(ledger),state=ledger.snapshot();this.data.set('budget',state);return {value,state};}
}
const connect=(runtime:BrowserRuntime)=>runtime.handle('/api/model-config','POST',{action:'connect',...config,password,allowPaid:true});
test('local AES-GCM vault uses fresh salt/IV, rejects wrong passwords/tampering and stores no plaintext',async()=>{
 const first=await sealConfig(config,password),second=await sealConfig(config,password);
 assert.notDeepEqual(first.salt,second.salt);assert.notDeepEqual(first.iv,second.iv);assert.notDeepEqual(first.ciphertext,second.ciphertext);
 assert.deepEqual(await openConfig(first,password),config);
 assert.ok(!Buffer.from(first.ciphertext).includes(Buffer.from(config.apiKey)));
 await assert.rejects(openConfig(first,'incorrect-password'),/nicht entsperrt/);
 new Uint8Array(first.ciphertext)[0]!^=1;await assert.rejects(openConfig(first,password),/nicht entsperrt/);
 assert.deepEqual(await openConfig(await sealConfig(config,'kurz'),'kurz'),config);
 await assert.rejects(sealConfig(config,''),/Passwort/);
 await assert.rejects(sealConfig({...config,apiKey:'x\nsecret-value'},password));
});
test('browser vault save, restart, unlock, lock and delete make no provider calls and preserve costs',async()=>{
 const store=new MemoryStore();let calls=0;const transport=(async()=>{calls++;throw new Error('must not call');}) as typeof fetch;
 const runtime=new BrowserRuntime(store,transport);await connect(runtime);
 assert.equal((await runtime.status()).available,true);
 const next=new BrowserRuntime(store,transport);assert.equal((await next.status()).available,false);
 await assert.rejects(next.handle('/api/vault','POST',{action:'unlock',password:'wrong'}));
 await next.handle('/api/vault','POST',{action:'unlock',password});assert.equal((await next.status()).available,true);
 await next.handle('/api/vault','POST',{action:'lock'});assert.equal((await next.status()).available,false);
 assert.ok(!JSON.stringify(await next.handle('/api/diagnostics','GET')).includes(config.apiKey));
 await next.handle('/api/model-config','POST',{action:'disconnect'});assert.equal(await store.get('vault'),null);assert.equal(calls,0);
});
test('browser provider contract, response validation and persisted request cap apply across restarts',async()=>{
 const store=new MemoryStore();let calls=0;
 const transport=(async(url,init)=>{calls++;assert.equal(url,'https://api.openai.com/v1/chat/completions');assert.equal(init!.mode,'cors');assert.equal(init!.credentials,'omit');assert.equal(init!.redirect,'error');assert.equal(init!.referrerPolicy,'no-referrer');assert.equal((init!.headers as any).Authorization,'Bearer '+config.apiKey);const body=JSON.parse(String(init!.body));assert.equal(body.max_completion_tokens,800);assert.equal(body.response_format.type,'json_object');return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(reply)}}],usage:{prompt_tokens:40,completion_tokens:30}}));}) as typeof fetch;
 for(let i=0;i<3;i++){const r=new BrowserRuntime(store,transport);await connect(r);assert.deepEqual(await r.handle('/api/dialogue','POST',request()),reply);}
 const r=new BrowserRuntime(store,transport);await connect(r);await assert.rejects(r.handle('/api/dialogue','POST',request()),/budget/);assert.equal(calls,3);assert.equal((await r.status()).remaining,0);
 assert.equal((await store.budget(l=>l.snapshot())).state.uncertainRequests,0);
});
test('browser invalid requests do not spend, failed or oversized replies reserve cost and never leak secrets',async()=>{
 for(const result of [()=>{throw new Error(config.apiKey);},()=>new Response('x'.repeat(65537)),()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({...reply,candidates:['illegal']})}}]}))]){
  const store=new MemoryStore();let calls=0;const r=new BrowserRuntime(store,(async()=>{calls++;return result();}) as typeof fetch);await connect(r);
  await assert.rejects(r.handle('/api/dialogue','POST',{...request(),legalMoves:['e5']}));assert.equal(calls,0);
  await assert.rejects(r.handle('/api/dialogue','POST',request()),error=>error instanceof Error&&!error.message.includes(config.apiKey));assert.equal(calls,1);
  const costs=(await store.budget(l=>l.snapshot())).state;assert.equal(costs.requests,1);assert.equal(costs.uncertainRequests,1);assert.ok(costs.estimatedUsd>0);
 }
});
test('browser pending request blocks key replacement, locking, and concurrent requests',async()=>{
 let finish!:(r:Response)=>void,started!:()=>void;const reached=new Promise<void>(r=>started=r);
 const r=new BrowserRuntime(new MemoryStore(),(async()=>{started();return new Promise<Response>(r=>finish=r);}) as typeof fetch);await connect(r);
 const pending=r.handle('/api/dialogue','POST',request());await reached;
 for(const [path,body] of [['/api/model-config',{action:'disconnect'}],['/api/vault',{action:'lock'}],['/api/dialogue',request()]] as const)await assert.rejects(r.handle(path,'POST',body));
 finish(new Response('failure',{status:401}));await assert.rejects(pending);assert.equal((await r.status()).available,true);
});
test('browser factcheck preserves full history, candidate, perspective and bounded UCI commands',async()=>{
 let messages:string[]=[],terminated=0;
 const worker:EngineWorker={onmessage:null,onerror:null,onmessageerror:null,terminate(){terminated++;},postMessage(command){messages.push(command);const line=(data:string)=>this.onmessage?.(new MessageEvent('message',{data}));if(command==='uci'){line('id name Stockfish 19 fixture');line('uciok');}if(command==='isready')line('readyok');if(command.startsWith('go ')){line('info depth 4 nodes 100 score cp 25 pv e7e5');line('bestmove e7e5');}}};
 const board=new Session();board.play('e4');const fen=board.snapshot().nodes[1]!.fen,history={rootFen:request().fen,moves:['e4']};
 const r=await new BrowserTacticalAdapter(()=>worker).check(fen,'e5',history);
 assert.deepEqual(r.history,history);assert.deepEqual(r.line,['e5']);assert.equal(r.score.value,-25);assert.equal(terminated,1);assert.ok(messages.includes('position fen '+history.rootFen+' moves e2e4'));assert.ok(messages.includes('go depth 12 nodes 20000 movetime 1000 searchmoves e7e5'));
});

test('browser access diagnosis uses model metadata only and does not spend request budget',async()=>{
 let calls=0;const r=new BrowserRuntime(new MemoryStore(),(async(url,init)=>{calls++;assert.equal(url,'https://api.openai.com/v1/models/gpt-4.1-mini');assert.equal(init!.method,'GET');assert.equal(init!.credentials,'omit');return new Response('{}');}) as typeof fetch);
 assert.equal((await r.handle('/api/diagnostics','POST',{})).ok,false);assert.equal(calls,0);await connect(r);
 assert.equal((await r.handle('/api/diagnostics','POST',{})).ok,true);assert.equal(calls,1);assert.equal((await r.status()).remaining,3);assert.equal((await r.store.budget(l=>l.snapshot())).state.requests,0);
});


test('device vault keeps credentials encrypted with a non-exportable key and rejects tampering',async()=>{
 const a=await sealDeviceConfig(config),b=await sealDeviceConfig(config);
 assert.equal(a.key.extractable,false);assert.deepEqual(await openDeviceConfig(structuredClone(a)),config);
 await assert.rejects(crypto.subtle.exportKey('raw',a.key));
 assert.ok(!Buffer.from(a.ciphertext).includes(Buffer.from(config.apiKey)));
 assert.ok(!JSON.stringify(a).includes(config.apiKey));assert.notDeepEqual(a.iv,b.iv);
 await assert.rejects(openDeviceConfig({...a,key:b.key}),/nicht gelesen/);
 new Uint8Array(a.ciphertext)[0]!^=1;await assert.rejects(openDeviceConfig(a),/nicht gelesen/);
});
test('default local save restores without a password and does not call a provider or reset costs',async()=>{
 const store=new MemoryStore();let calls=0;const transport=(async()=>{calls++;throw new Error('unexpected');}) as typeof fetch;
 await store.budget(l=>l.configure({action:'configure',budgetUsd:0.03,inputUsdPerMillion:0.4,outputUsdPerMillion:1.6}));
 const before=(await store.budget(l=>l.snapshot())).state;
 const first=new BrowserRuntime(store,transport);await first.handle('/api/model-config','POST',{action:'connect',...config,allowPaid:true});
 assert.equal((await store.get<{version:number}>('vault'))!.version,2);
 const next=new BrowserRuntime(store,transport);assert.equal((await next.status()).available,true);
 const data=await next.handle('/api/diagnostics','GET');assert.equal(data.model.storageMode,'device');assert.ok(!JSON.stringify(data).includes(config.apiKey));
 await next.handle('/api/vault','POST',{action:'lock'});assert.equal((await next.status()).available,false);
 await next.handle('/api/vault','POST',{action:'unlock'});assert.equal((await next.status()).available,true);
 await next.handle('/api/model-config','POST',{action:'disconnect'});assert.equal((await new BrowserRuntime(store,transport).status()).available,false);
 assert.deepEqual((await store.budget(l=>l.snapshot())).state,before);assert.equal(calls,0);
});
test('password vault stays readable and can switch to profile storage only after unlocking',async()=>{
 const store=new MemoryStore(),runtime=new BrowserRuntime(store);await connect(runtime);
 const before=(await store.budget(l=>l.snapshot())).state,next=new BrowserRuntime(store);
 assert.equal((await next.status()).available,false);
 await assert.rejects(next.handle('/api/vault','POST',{action:'use-device'}),/zuerst/);
 assert.equal((await store.get<{version:number}>('vault'))!.version,1);
 await next.handle('/api/vault','POST',{action:'unlock',password});await next.handle('/api/vault','POST',{action:'use-device'});
 assert.equal((await store.get<{version:number}>('vault'))!.version,2);
 assert.equal((await new BrowserRuntime(store).status()).available,true);
 assert.deepEqual((await store.budget(l=>l.snapshot())).state,before);
});

test('storage success requires decrypting the persisted copy, not only the in-memory object',async()=>{
 class DiscardingStore extends MemoryStore {override async put(_store:'vault'|'session',_value:unknown){}}
 const missing=new BrowserRuntime(new DiscardingStore());await assert.rejects(missing.handle('/api/model-config','POST',{action:'connect',...config,allowPaid:true}),/nicht bestätigt/);
 class CorruptingStore extends MemoryStore {override async put(store:'vault'|'session',value:unknown){const copied=structuredClone(value) as {ciphertext:ArrayBuffer};new Uint8Array(copied.ciphertext)[0]!^=1;await super.put(store,copied);}}
 const corrupt=new BrowserRuntime(new CorruptingStore());await assert.rejects(corrupt.handle('/api/model-config','POST',{action:'connect',...config,allowPaid:true}),/nicht gelesen/);
 assert.equal((await corrupt.status()).available,false);
});

test('saved access remains distinguishable from demo when period or password blocks requests',async()=>{
 const store=new MemoryStore();let calls=0;const runtime=new BrowserRuntime(store,async()=>{calls++;throw new Error('No network expected');});
 await runtime.handle('/api/model-config','POST',{action:'connect',...config,allowPaid:true});
 await store.budget(l=>{for(let i=0;i<3;i++)l.reserve(100,800);});
 const next=new BrowserRuntime(store),status=await next.status();assert.equal(status.saved,true);assert.equal(status.available,true);assert.equal(status.remaining,0);assert.equal(status.limit,'period');
 await next.handle('/api/vault','POST',{action:'lock'});const locked=await next.status();assert.equal(locked.saved,true);assert.equal(locked.locked,true);assert.equal(locked.available,false);assert.equal(calls,0);
});
