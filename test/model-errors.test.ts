import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ModelService} from '../server/model.js';
import {ServerModelAdapter} from '../src/model-client.js';
import {ApiError} from '../src/model-contract.js';
import {COACH_ERRORS} from '../src/model-errors.js';
import {Session} from '../src/session.js';
import {SimulationAdapter} from '../src/dialogue.js';
const s=new Session();s.play('e4');s.play('e5');
const request={nodeId:'n2',fen:s.snapshot().nodes[2]!.fen,question:'Partie besprechen',legalMoves:s.legalMoves(),context:[],topic:'review' as const,hintMode:'explain' as const,history:{rootFen:s.snapshot().nodes[0]!.fen,moves:['e4','e5'],truncated:false}};
const base=await new SimulationAdapter().respond(request);
const envelope=(content:unknown,finish='stop')=>new Response(JSON.stringify({choices:[{finish_reason:finish,message:{content:JSON.stringify(content)}}],usage:{prompt_tokens:20,completion_tokens:20}}));
test('provider rejection, truncation, malformed reply and invalid retrospective have distinct safe error codes',async()=>{
 for(const [code,response] of [['provider_auth',()=>new Response('secret-provider-body',{status:401})],['provider_limit',()=>new Response('secret-provider-body',{status:429})],['output_limit',()=>envelope(base,'length')],['provider_format',()=>new Response('not-json secret-provider-body')],['reply_format',()=>envelope({})],['review_format',()=>envelope(base)]] as const){
  let calls=0;const service=new ModelService({enabled:true,apiKey:'secret-config-key',model:'fixture'},(async()=>{calls++;if(calls===1&&['reply_format','review_format'].includes(code))return envelope('Weiß und Schwarz besetzen mit ihren Bauern das Zentrum und bereiten die Entwicklung ihrer Figuren vor.');return response();}) as typeof fetch);
  await assert.rejects(service.reply(request),e=>e instanceof ApiError&&e.status===502&&e.code===code&&!e.message.includes('secret'));assert.equal(calls,['reply_format','review_format'].includes(code)?2:1);
 }
});
test('client displays only recognized safe error codes, never provider or server exception text',async()=>{
 for(const code of Object.keys(COACH_ERRORS)){
  const adapter=new ServerModelAdapter((async()=>new Response(JSON.stringify({code,error:'secret-provider-body'}),{status:502})) as typeof fetch);
  await assert.rejects(adapter.respond(request),e=>e instanceof Error&&e.message.startsWith(COACH_ERRORS[code as keyof typeof COACH_ERRORS])&&!e.message.includes('secret'));
 }
 const unknown=new ServerModelAdapter((async()=>new Response(JSON.stringify({code:'unknown',error:'secret-provider-body'}),{status:502})) as typeof fetch);
 await assert.rejects(unknown.respond(request),e=>e instanceof Error&&e.message.includes('nicht übermittelt')&&!e.message.includes('secret'));
});


test('client deadline covers both separately bounded review phases while ordinary requests stay unchanged',async()=>{
 const original=AbortSignal.timeout,limits:number[]=[];
 AbortSignal.timeout=(ms:number)=>{limits.push(ms);return new AbortController().signal;};
 try{
  const adapter=new ServerModelAdapter((async()=>new Response('{}')) as typeof fetch);
  await adapter.respond(request);await adapter.respond({...request,topic:'chat'});
  assert.deepEqual(limits,[360000,100000]);
 }finally{AbortSignal.timeout=original;}
});
