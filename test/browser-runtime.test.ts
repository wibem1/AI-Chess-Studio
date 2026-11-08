import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sealConfig,openConfig,sealDeviceConfig,openDeviceConfig} from '../src/browser-vault.js';
import {BrowserStore} from '../src/browser-store.js';
import {BrowserRuntime,providerTimeoutMs,classifyRequestFailure} from '../src/browser-runtime.js';
import {COACH_ERRORS} from '../src/model-errors.js';
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
test('browser provider contract, response validation and usage accounting apply across restarts without a cap',async()=>{
 const store=new MemoryStore();let calls=0;
 const transport=(async(url,init)=>{calls++;assert.equal(url,'https://api.openai.com/v1/chat/completions');assert.equal(init!.mode,'cors');assert.equal(init!.credentials,'omit');assert.equal(init!.redirect,'error');assert.equal(init!.referrerPolicy,'no-referrer');assert.equal((init!.headers as any).Authorization,'Bearer '+config.apiKey);const body=JSON.parse(String(init!.body));assert.equal(body.max_completion_tokens,800);assert.equal(body.response_format.type,'json_object');return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(reply)}}],usage:{prompt_tokens:40,completion_tokens:30}}));}) as typeof fetch;
 for(let i=0;i<5;i++){const r=new BrowserRuntime(store,transport);await connect(r);assert.deepEqual(await r.handle('/api/dialogue','POST',request()),reply);}
 const r=new BrowserRuntime(store,transport);await connect(r);await r.handle('/api/dialogue','POST',request());assert.equal(calls,6);assert.equal((await r.status()).remaining,null);
 assert.equal((await store.budget(l=>l.snapshot())).state.uncertainRequests,0);
});
test('browser invalid requests do not spend, failed or oversized replies reserve cost and never leak secrets',async()=>{
 for(const result of [()=>{throw new Error(config.apiKey);},()=>new Response('x'.repeat(65537))]){
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
 assert.equal((await r.handle('/api/diagnostics','POST',{})).ok,true);assert.equal(calls,1);assert.equal((await r.status()).remaining,null);assert.equal((await r.store.budget(l=>l.snapshot())).state.requests,0);
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

test('saved access ignores old consumed periods and still respects password locking',async()=>{
 const store=new MemoryStore();let calls=0;const runtime=new BrowserRuntime(store,async()=>{calls++;throw new Error('No network expected');});
 await runtime.handle('/api/model-config','POST',{action:'connect',...config,allowPaid:true});
 await store.budget(l=>{for(let i=0;i<3;i++)l.reserve(100,800);});
 const next=new BrowserRuntime(store),status=await next.status();assert.equal(status.saved,true);assert.equal(status.available,true);assert.equal(status.remaining,null);assert.equal(status.limit,null);
 await next.handle('/api/vault','POST',{action:'lock'});const locked=await next.status();assert.equal(locked.saved,true);assert.equal(locked.locked,true);assert.equal(locked.available,false);assert.equal(calls,0);
});

test('browser coach distinguishes provider rejection, output limit and invalid review without leaking provider bodies',async()=>{
 const session=new Session();session.play('e4');session.play('e5');
 const req={...request(),nodeId:'n2',fen:session.snapshot().nodes[2]!.fen,legalMoves:session.legalMoves(),topic:'review',hintMode:'explain',history:{rootFen:session.snapshot().nodes[0]!.fen,moves:['e4','e5'],truncated:false}};
 for(const [code,result] of [['provider_auth',()=>new Response(config.apiKey,{status:401})],['output_limit',()=>new Response(JSON.stringify({choices:[{finish_reason:'length'}]}))],['review_format',()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(reply)}}],usage:{prompt_tokens:20,completion_tokens:20}}))]] as const){
  const store=new MemoryStore();let calls=0;const runtime=new BrowserRuntime(store,(async()=>{calls++;return result();}) as typeof fetch);await connect(runtime);
  await assert.rejects(runtime.handle('/api/dialogue','POST',req),e=>e instanceof Error&&(e as {code?:string}).code===code&&!e.message.includes(config.apiKey));assert.equal(calls,1);assert.equal((await store.budget(l=>l.snapshot())).state.requests,1);
 }
});

test('OpenRouter selection preserves optional password vault and can restore default reasoning',async()=>{
 const store=new MemoryStore(),runtime=new BrowserRuntime(store);await runtime.handle('/api/model-config','POST',{action:'connect',enabled:true,apiKey:'fixture-or-key',model:'openai/gpt-6.1-sol',provider:'openrouter',reasoning:'high',password,allowPaid:true});const vault=await store.get('vault');
 const changed=await runtime.handle('/api/model-config','POST',{action:'select-model',provider:'openrouter',model:'google/gemini-4-argon'});assert.equal(changed.selectionPersistent,false);assert.deepEqual(await store.get('vault'),vault);const d=await runtime.handle('/api/diagnostics','GET');assert.equal(d.model.reasoning,null);assert.equal(d.model.model,'google/gemini-4-argon');
});

test('temporary IndexedDB read failure does not permanently forget an encrypted saved key',async()=>{
 const store=new MemoryStore();
 const saved=new BrowserRuntime(store);
 await saved.handle('/api/model-config','POST',{action:'connect',...config,allowPaid:true});
 class OnceUnavailableStore extends MemoryStore {
  reads=0;
  override async get<T>(name:'vault'|'budget'|'session'):Promise<T|null>{
   if(name==='vault'&&this.reads++===0)throw new Error('Temporary IndexedDB read failure');
   return super.get<T>(name);
  }
 }
 const unstable=new OnceUnavailableStore();
 await unstable.put('vault',await store.get('vault'));
 const runtime=new BrowserRuntime(unstable);
 await assert.rejects(runtime.status(),/Temporary IndexedDB/);
 // A subsequent status read must try the original encrypted record again.
 assert.equal((await runtime.status()).available,true);
 assert.equal((await runtime.status()).saved,true);
 assert.deepEqual(await unstable.get('vault'),await store.get('vault'));
});

test('direct OpenAI Sol uses stateless Responses with encrypted-key storage and no paid network',async()=>{
 const store=new MemoryStore(),calls:string[]=[];
 const runtime=new BrowserRuntime(store,(async(url,init)=>{
  calls.push(String(url));
  const body=JSON.parse(String(init!.body));
  assert.equal(body.model,'gpt-6.1-sol');
  assert.equal(body.store,false);
  assert.equal(body.parallel_tool_calls,false);
  assert.ok(Array.isArray(body.input));
  assert.ok(!JSON.stringify(body).includes(config.apiKey));
  return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(reply)}]}],usage:{input_tokens:55,output_tokens:22}}));
 }) as typeof fetch);
 await runtime.handle('/api/model-config','POST',{action:'connect',apiKey:config.apiKey,model:'gpt-6.1-sol',provider:'openai',allowPaid:true});
 assert.deepEqual(await runtime.handle('/api/dialogue','POST',request()),reply);
 assert.deepEqual(calls,['https://api.openai.com/v1/responses']);
 assert.equal((await store.budget(l=>l.snapshot())).state.uncertainRequests,0);
 const report=await runtime.handle('/api/ai-diagnostics','POST',{});
 assert.ok(!JSON.stringify(report).includes(config.apiKey));
});

test('Sol direct tool call returns a legal app-level command without invoking the engine automatically',async()=>{
 const calls:string[]=[];
 const runtime=new BrowserRuntime(new MemoryStore(),(async(url,init)=>{
  calls.push(String(url));
  const body=JSON.parse(String(init!.body));
  assert.equal(body.tools?.length,4);
  return new Response(JSON.stringify({status:'completed',output:[
   {type:'reasoning',id:'rs_1',encrypted_content:'ENCRYPTED_PRIVATE_REASONING'},
   {type:'function_call',call_id:'call_line',name:'show_line',arguments:'{"moves":["e4"]}'}
  ],usage:{input_tokens:32,output_tokens:21}}));
 }) as typeof fetch);
 await runtime.handle('/api/model-config','POST',{action:'connect',provider:'openai',model:'gpt-6.1-sol',apiKey:config.apiKey,allowPaid:true});
 const result=await runtime.handle('/api/dialogue','POST',{...request(),topic:'chat',toolsEnabled:true});
 assert.equal(result.toolCall?.function.name,'show_line');
 assert.equal(result.toolCall?.function.arguments,'{"moves":["e4"]}');
 assert.equal(calls.length,1);
 const report=await runtime.handle('/api/ai-diagnostics','POST',{});
 assert.ok(!JSON.stringify(report).includes('ENCRYPTED_PRIVATE_REASONING'));
});

test('Sol Responses uses a longer timeout while legacy model transport keeps its prior limit',()=>{
 assert.equal(providerTimeoutMs({enabled:true,apiKey:'fixture-sol-key',model:'gpt-6.1-sol',provider:'openai'}),45000);
 assert.equal(providerTimeoutMs({enabled:true,apiKey:'fixture-sol-key',model:'gpt-6.1-sol',provider:'openai'},true),90000);
 assert.equal(providerTimeoutMs({enabled:true,apiKey:'fixture-sol-key',model:'gpt-4.1-mini',provider:'openai'},true),15000);
 assert.equal(providerTimeoutMs({enabled:true,apiKey:'fixture-sol-key',model:'gpt-6.1-sol',provider:'openai',reasoning:'high'}),90000);
 assert.equal(providerTimeoutMs({enabled:true,apiKey:'fixture-sol-key',model:'gpt-4.1-mini',provider:'openai'}),15000);
 assert.equal(providerTimeoutMs({enabled:true,apiKey:'fixture-sol-key',model:'openai/gpt-6.1-sol',provider:'openrouter'}),15000);
 assert.match(COACH_ERRORS.timeout,/Zeitlimit/);
});

test('timeout errors are distinct from connectivity errors and deliberate cancellation',()=>{
 const abort=new DOMException('The operation was aborted','AbortError');
 const deadline=new DOMException('The request timed out','TimeoutError');
 assert.equal(classifyRequestFailure(deadline,true,false,'network'),'timeout');
 assert.equal(classifyRequestFailure(abort,true,false,'network'),'timeout');
 assert.equal(classifyRequestFailure(abort,true,true,'network'),'network');
 assert.equal(classifyRequestFailure(new TypeError('Failed to fetch'),false,false,'network'),'network');
 assert.equal(classifyRequestFailure(new SyntaxError('Invalid JSON'),true,false,'provider_format'),'provider_format');
});
test('a cancelled Sol request does not retry, alter the saved key, or settle uncertain cost as zero',async()=>{
 const store=new MemoryStore(),controller=new AbortController();
 let calls=0;
 let notifyStarted!:()=>void;
 const started=new Promise<void>(resolve=>{notifyStarted=resolve;});
 const runtime=new BrowserRuntime(store,(async(_url,init)=>{
  calls++;notifyStarted();
  const signal=init?.signal as AbortSignal;
  return new Promise<Response>((_resolve,reject)=>{
   if(signal.aborted){reject(signal.reason);return;}
   signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
  });
 }) as typeof fetch);
 await runtime.handle('/api/model-config','POST',{action:'connect',provider:'openai',model:'gpt-6.1-sol',apiKey:config.apiKey,allowPaid:true});
 const ongoing=runtime.handle('/api/dialogue','POST',request(),controller.signal);
 // Cancel only after the actual mock transport starts; no 45-second wait needed.
 await started;
 controller.abort();
 await assert.rejects(ongoing,(e:unknown)=>e instanceof Error&&(e as Error&{code?:string}).code==='network');
 assert.equal(calls,1);
 assert.equal((await runtime.status()).available,true);
 const state=(await store.budget(l=>l.snapshot())).state;
 assert.equal(state.requests,1);
 assert.equal(state.uncertainRequests,1);
});

test('review output setting persists in device vault, is visible and can reset to automatic',async()=>{
 const store=new MemoryStore(),runtime=new BrowserRuntime(store);
 await runtime.handle('/api/model-config','POST',{action:'connect',provider:'openai',model:'gpt-6.1-sol',apiKey:config.apiKey,allowPaid:true});
 await assert.rejects(runtime.handle('/api/model-config','POST',{action:'select-model',provider:'openai',model:'gpt-6.1-sol',reviewOutputTokens:99999}),/Ausgabelimit/);
 await runtime.handle('/api/model-config','POST',{action:'select-model',provider:'openai',model:'gpt-6.1-sol',reviewOutputTokens:8192});
 assert.equal((await runtime.handle('/api/diagnostics','GET')).model.reviewOutputTokens,8192);
 const reloaded=new BrowserRuntime(store);
 assert.equal((await reloaded.handle('/api/diagnostics','GET')).model.reviewOutputTokens,8192);
 await reloaded.handle('/api/model-config','POST',{action:'select-model',provider:'openai',model:'gpt-6.1-sol',reviewOutputTokens:null});
 assert.equal((await reloaded.handle('/api/diagnostics','GET')).model.reviewOutputTokens,null);
 const again=new BrowserRuntime(store);
 assert.equal((await again.handle('/api/diagnostics','GET')).model.reviewOutputTokens,null);
});

test('general coaching preferences reach provider system prompt, never party data or credentials',async()=>{
 const store=new MemoryStore(),prompts:string[]=[];
 const transport=(async(_url,init)=>{
  const body=JSON.parse(String(init!.body));prompts.push(body.messages[0].content);
  assert.equal(body.messages[0].role,'system');
  assert.ok(!JSON.stringify(body).includes('generalInstructions":'));
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(reply)}}],usage:{prompt_tokens:30,completion_tokens:35}}));
 }) as typeof fetch;
 const runtime=new BrowserRuntime(store,transport);await connect(runtime);
 await runtime.handle('/api/dialogue','POST',{...request(),generalInstructions:'Bitte kurze Sätze und anschauliche Pläne.'});
 await runtime.handle('/api/dialogue','POST',request());
 assert.match(prompts[0]!,/Bitte kurze Sätze und anschauliche Pläne/);
 assert.doesNotMatch(prompts[1]!,/Bitte kurze Sätze und anschauliche Pläne/);
 assert.equal(prompts.length,2);
 await assert.rejects(runtime.handle('/api/dialogue','POST',{...request(),generalInstructions:'X'.repeat(2001)}),/2.000 Zeichen/);
 assert.equal(prompts.length,2);
});
