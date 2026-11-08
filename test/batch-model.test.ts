import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validModel,isBatchModel,modelCatalog} from '../src/model-provider.js';
import {BrowserRuntime} from '../src/browser-runtime.js';

test('batch variants are not interactive models, normal model remains available',()=>{
 assert.equal(isBatchModel('google/gemini-4-argon:batch'),true);
 assert.equal(validModel('google/gemini-4-argon:batch',{provider:'openrouter'}),false);
 assert.equal(validModel('google/gemini-4-argon',{provider:'openrouter'}),true);
});
test('catalog excludes batch-only models without concealing normal ones',async()=>{
 const entry=(id:string)=>({id,name:id,architecture:{output_modalities:['text']},pricing:{prompt:'0.000002',completion:'0.00001'},supported_parameters:['tools']});
 const models=await modelCatalog((async()=>new Response(JSON.stringify({data:[entry('google/gemini-4-argon:batch'),entry('google/gemini-4-argon')]}))) as typeof fetch);
 assert.deepEqual(models.map(x=>x.id),['google/gemini-4-argon']);
});
test('batch variant is rejected before credential storage or provider transport',async()=>{
 let calls=0;
 const r=new BrowserRuntime(undefined,(async()=>{calls++;return new Response('{}');}) as typeof fetch);
 await assert.rejects(r.handle('/api/model-config','POST',{action:'connect',provider:'openrouter',model:'google/gemini-4-argon:batch',apiKey:'fixture-not-real',allowPaid:true}),/:batch/);
 assert.equal(calls,0);
});
