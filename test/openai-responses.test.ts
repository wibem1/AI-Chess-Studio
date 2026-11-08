import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResponsesBody,normalizeResponses,needsResponses} from '../src/openai-responses.js';
import {coachToolReply} from '../src/coach-provider.js';
import {Session} from '../src/session.js';
import {ModelDiagnostics} from '../src/model-diagnostics.js';
import {encryptedReasoningForCall} from '../src/openai-responses.js';
import type {DialogueRequest} from '../src/dialogue.js';

const fen=new Session().snapshot().nodes[0]!.fen;
const req={nodeId:'n0',fen,topic:'chat',toolsEnabled:true,legalMoves:new Session().legalMoves(),question:'Zeige e4 am Brett'} as DialogueRequest;
const config={provider:'openai' as const,model:'gpt-6.1-sol'};
test('Sol direct uses Responses while OpenRouter and legacy Chat Completions remain untouched',()=>{
 assert.equal(needsResponses(config),true);
 assert.equal(needsResponses({provider:'openrouter',model:'openai/gpt-6.1-sol'}),false);
 assert.equal(needsResponses({provider:'openai',model:'gpt-4.1-mini'}),false);
});
test('Responses request restricts tools, disables storage and has correct output limits',()=>{
 const body=createResponsesBody(config,req,'coach instructions',{},[],1800);
 assert.equal(body.model,'gpt-6.1-sol');assert.equal(body.store,false);
 assert.equal(body.parallel_tool_calls,false);
 assert.ok(body.max_output_tokens>=1800);
 assert.equal(body.tools?.length,4);
 assert.ok(body.tools?.every(t=>t.strict===false&&t.type==='function'&&typeof t.name==='string'));
});
test('Sol tool call feeds the existing validated board command and local result back to Responses',()=>{
 const envelope={status:'completed',output:[{type:'function_call',call_id:'call_1',name:'show_line',arguments:'{"moves":["e4"]}'}],usage:{input_tokens:51,output_tokens:25}};
 const normalized=normalizeResponses(envelope);
 const reply=coachToolReply(normalized.choices[0],req);
 assert.equal(reply?.toolCall?.function.name,'show_line');
 assert.equal(normalized.usage?.prompt_tokens,51);
 const follow={...req,toolExchanges:[{call:reply!.toolCall!,content:'',result:{ok:true,fromFen:fen,fen:new Session().snapshot().nodes[0]!.fen,moves:[],nodeId:'n0'}}]};
 const body=createResponsesBody(config,follow as DialogueRequest,'coach instructions',{},[],1800);
 assert.equal(body.input.at(-2)?.type,'function_call');
 assert.equal(body.input.at(-1)?.type,'function_call_output');
 assert.equal(body.input.at(-1)?.call_id,'call_1');
 assert.equal(body.tools?.length,4);
});
test('Sol free prose and incomplete outputs normalize safely',()=>{
 const choice=normalizeResponses({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Die offene Linie ist entscheidend.'}]}],usage:{input_tokens:5,output_tokens:9}});
 assert.equal(choice.choices[0]?.message.content,'Die offene Linie ist entscheidend.');
 assert.equal(normalizeResponses({status:'incomplete',output:[]}).choices[0]?.finish_reason,'length');
 assert.throws(()=>normalizeResponses({status:'completed',output:[{type:'function_call',call_id:'x',name:'unknown',arguments:'{}'}]}));
 assert.throws(()=>normalizeResponses({status:'completed',output:[{type:'function_call',call_id:'x',name:'show_line',arguments:'{"moves":["e4"]}'},{type:'function_call',call_id:'y',name:'show_line',arguments:'{"moves":["d4"]}'}]}));
});

test('encrypted reasoning stays in memory and cannot leak via diagnostics',()=>{
 const opaque=encryptedReasoningForCall({output:[{type:'reasoning',id:'rs_1',encrypted_content:'PRIVATE_OPAQUE_CONTENT'},{type:'function_call',call_id:'call_9',name:'draw_board',arguments:'{"marks":[]}'}]});
 assert.equal(opaque?.callId,'call_9');assert.equal(opaque?.items[0]?.encrypted_content,'PRIVATE_OPAQUE_CONTENT');
 const trace=new ModelDiagnostics().start({input:opaque?.items},{} as Record<string,unknown>,'fixture-key');trace.sent();
 // A fresh diagnostic store is not meaningful; inspect the tracked one.
 const diagnostics=new ModelDiagnostics();diagnostics.start({input:opaque?.items}, {},'fixture-key');
 assert.ok(!JSON.stringify(diagnostics.export()).includes('PRIVATE_OPAQUE_CONTENT'));
});

test('Sol whole-game retrospective has a larger bound than ordinary requests',()=>{
 const review={...req,topic:'review' as const,hintMode:'explain' as const,toolsEnabled:false};
 const detailed=createResponsesBody(config,review,'review instructions',{},[],1800);
 const ordinary=createResponsesBody(config,req,'chat instructions',{},[],1800);
 assert.equal(detailed.max_output_tokens,6144);
 assert.equal(ordinary.max_output_tokens,2048);
 assert.equal(createResponsesBody({...config,reasoning:'medium'},review,'review',{},[],1800).max_output_tokens,16384);
});
