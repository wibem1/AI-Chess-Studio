import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ModelService} from '../server/model.js';
import {Session} from '../src/session.js';
import {ModelDiagnostics} from '../src/model-diagnostics.js';
import {CostLedger} from '../src/costs.js';
import {sealDeviceConfig,openDeviceConfig} from '../src/browser-vault.js';
import {modelCatalog} from '../src/model-provider.js';
const s=new Session(),request={nodeId:'n0',fen:s.snapshot().nodes[0]!.fen,question:'Erkläre die Stellung',legalMoves:s.legalMoves(),context:[],topic:'chat'};
test('OpenRouter sends one explicit model, captures provider evidence, usage and costs, and strips credentials and private reasoning',async()=>{
 const key='fixture-sensitive-api-key',service=new ModelService({enabled:true,apiKey:key,model:'openai/gpt-6.1-sol',provider:'openrouter',reasoning:'medium'},(async(url,init)=>{
  assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');const b=JSON.parse(String(init!.body));assert.equal(b.model,'openai/gpt-6.1-sol');assert.deepEqual(b.reasoning,{effort:'medium'});assert.equal(b.models,undefined);assert.equal(b.max_tokens,16384);assert.equal((init!.headers as any).Authorization,'Bearer '+key);
  return new Response(JSON.stringify({id:'provider-test-1',model:'openai/gpt-6.1-sol-v1',provider:'OpenAI',choices:[{finish_reason:'stop',message:{content:'Prüfe die Drohung. '+key,reasoning_content:'PRIVATE THINKING',reasoning_details:[{text:'SECRET THOUGHT'}]}}],usage:{prompt_tokens:120,completion_tokens:45,completion_tokens_details:{reasoning_tokens:30},cost:0.007}}));
 }) as typeof fetch);
 await service.reply(request);const d=service.exportDiagnostics({comment:key});assert.equal(d.requests[0].request.messages[0].role,'system');assert.equal(d.requests[0].fen,request.fen);assert.equal(d.requests[0].response.model,'openai/gpt-6.1-sol-v1');assert.equal(d.requests[0].response.usage.cost,0.007);assert.equal(d.requests[0].status,'accepted');assert.equal(d.requests[0].response.usage.completion_tokens_details.reasoning_tokens,30);
 const encoded=JSON.stringify(d);for(const secret of [key,'PRIVATE THINKING','SECRET THOUGHT'])assert.ok(!encoded.includes(secret));assert.ok(!('requests' in service.diagnostics()));
});
test('failed provider response preserves only safe status and error category without a retry',async()=>{
 let calls=0;const service=new ModelService({enabled:true,apiKey:'secret-error-key',model:'fixture'},(async()=>{calls++;return new Response('secret-error-key provider private error',{status:429});}) as typeof fetch);
 await assert.rejects(service.reply(request));const d=service.exportDiagnostics({});assert.equal(calls,1);assert.equal(d.requests[0].httpStatus,429);assert.equal(d.requests[0].status,'failed');assert.ok(!JSON.stringify(d).includes('provider private error'));
});
test('diagnostic ring is bounded, clearable, and does not erase cost history',()=>{
 const d=new ModelDiagnostics();for(let i=0;i<25;i++){const t=d.start({i},{},'fixturekey');t.finish('accepted');}assert.equal(d.export().requests.length,20);assert.equal(d.export().requests[0].request.i,5);d.clear();assert.equal(d.export().requests.length,0);
 const c=new CostLedger(),reservation=c.reserve(100,100);c.settle(reservation,{prompt_tokens:50,completion_tokens:100,cost:0.008});assert.equal(c.snapshot().estimatedUsd,0.008);assert.equal(c.snapshot().providerReportedUsd,0.008);assert.equal(c.snapshot().providerReportedRequests,1);
});
test('provider and reasoning survive encrypted device storage without changing legacy configs',async()=>{
 const config={enabled:true,apiKey:'fixture-provider-secret',model:'google/gemini-4-argon',provider:'openrouter',reasoning:'low'};
 assert.deepEqual(await openDeviceConfig(await sealDeviceConfig(config)),config);await assert.rejects(sealDeviceConfig({...config,provider:'https://evil.example'}));
});
test('catalog accepts supported text models and pricing but never invents absent models',async()=>{
 const catalog=await modelCatalog((async()=>new Response(JSON.stringify({data:[{id:'openai/gpt-6.1-sol',name:'Sol',architecture:{output_modalities:['text']},pricing:{prompt:'0.000002',completion:'0.00001'},supported_parameters:['tools','reasoning']},{id:'bogus',pricing:{prompt:0,completion:0},architecture:{output_modalities:['text']}}]}))) as typeof fetch);
 assert.equal(catalog.length,1);assert.equal(catalog[0]!.inputUsdPerMillion,2);assert.equal(catalog[0]!.tools,true);
});

test('provider reasoning continuation survives a tool round-trip but is absent from every diagnostic export',async()=>{
 const {Studio}=await import('../src/dialogue.js'),{CoachBoard}=await import('../src/coach-board.js');const studio=new Studio(),board=new CoachBoard(()=>studio.session,()=>({move:async()=>{throw Error();}}),()=>{},0);let calls=0;
 const details=[{type:'reasoning.encrypted',data:'OPAQUE_PROVIDER_DATA',signature:'SIGNED_BLOCK'}];
 const service=new ModelService({enabled:true,apiKey:'fixture-continuity-key',model:'google/gemini-4-argon',provider:'openrouter',reasoning:'low'},(async(_url,init)=>{
  const b=JSON.parse(String(init!.body));calls++;
  if(calls===1)return new Response(JSON.stringify({choices:[{finish_reason:'tool_calls',message:{content:'Ich zeige e4.',reasoning_details:details,tool_calls:[{id:'signed-call',type:'function',function:{name:'show_line',arguments:'{ "moves": ["e4"] }'}}]}}],usage:{prompt_tokens:10,completion_tokens:20,cost:0.001}}));
  const assistant=b.messages.find((m:any)=>m.tool_calls);assert.deepEqual(assistant.reasoning_details,details);assert.equal(assistant.tool_calls[0].function.arguments,'{ "moves": ["e4"] }');return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'e4 wurde gezeigt.'}}],usage:{prompt_tokens:10,completion_tokens:20,cost:0.001}}));
 }) as typeof fetch);
 await studio.ask('Zeige e4',{source:'model',respond:r=>service.reply(r)},'chat',undefined,(call,node)=>board.execute(call,node));assert.equal(calls,2);const exported=JSON.stringify(service.exportDiagnostics({}));assert.ok(!exported.includes('OPAQUE_PROVIDER_DATA'));assert.ok(!exported.includes('SIGNED_BLOCK'));assert.equal(service.exportDiagnostics({}).requests[1].status,'accepted');
});

test('a model switch cannot silently change a running evaluation, and provider cancellation reaches the transport',async()=>{
 let calls=0;const service=new ModelService({enabled:true,apiKey:'fixture-cancel-key',model:'openai/gpt-6.1-sol',provider:'openrouter'},(async(_url,init)=>{calls++;return new Promise<Response>((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));}) as typeof fetch);
 await assert.rejects(service.reply({...request,expectedModel:'google/gemini-4-argon'}),/gewechselt/);assert.equal(calls,0);
 const controller=new AbortController(),pending=service.reply(request,controller.signal);controller.abort();await assert.rejects(pending);assert.equal(calls,1);assert.equal(service.exportDiagnostics({}).requests[0].status,'failed');
});
