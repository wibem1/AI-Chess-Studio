import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CostControl} from '../server/costs.js';
import {ModelService} from '../server/model.js';

test('budget persists reservations, token estimates and price settings across restarts',()=>{
 const folder=mkdtempSync(join(tmpdir(),'chess-costs-')),path=join(folder,'usage.json');
 try{const c=new CostControl(path);const reserved=c.reserve(4000,800);assert.ok(reserved>0);
  const restart=new CostControl(path);assert.equal(restart.snapshot().requests,1);assert.equal(restart.snapshot().uncertainRequests,1);
  restart.settle(reserved,{prompt_tokens:100,completion_tokens:20});
  assert.ok(Math.abs(restart.snapshot().estimatedUsd-0.000072)<1e-10);
  const reload=new CostControl(path);assert.equal(reload.snapshot().promptTokens,100);assert.equal(reload.snapshot().completionTokens,20);
  reload.configure({action:'configure',budgetUsd:0.02,inputUsdPerMillion:1,outputUsdPerMillion:2});
  assert.equal(new CostControl(path).snapshot().inputUsdPerMillion,1);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
test('old exhausted budget and request count do not block provider transport',async()=>{
 const costs=new CostControl();const old={...costs.snapshot(),budgetUsd:0,requests:99,estimatedUsd:1};
 const {CostLedger}=await import('../src/costs.js');const ledger=new CostLedger(old);
 for(let i=0;i<6;i++)ledger.reserve(100,800);
 assert.equal(ledger.snapshot().requests,105);assert.ok(ledger.snapshot().estimatedUsd>1);
 let calls=0;const service=new ModelService({enabled:true,apiKey:'test-cost-key',model:'gpt-4.1-mini'},(async()=>{calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'Eine freie Antwort.'}}],usage:{prompt_tokens:100,completion_tokens:20}}));}) as typeof fetch,undefined,ledger);
 const {Session}=await import('../src/session.js');const s=new Session();
 for(let i=0;i<5;i++)await service.reply({nodeId:'n0',fen:s.snapshot().nodes[0]!.fen,question:'Plan?',legalMoves:s.legalMoves(),context:[],topic:'chat'});
 assert.equal(calls,5);assert.equal(ledger.snapshot().requests,110);

});
test('uncertain failures accumulate estimates beyond three requests without resetting history',()=>{
 const c=new CostControl();for(let i=0;i<6;i++){const n=c.reserve(100,800);c.settle(n,null);}
 assert.equal(c.snapshot().uncertainRequests,6);assert.equal(c.snapshot().requests,6);assert.ok(c.snapshot().estimatedUsd>0);
});
test('invalid prices cannot disable accounting',()=>{
 const c=new CostControl();for(const value of [-1,NaN,Infinity])assert.throws(()=>c.configure({action:'configure',inputUsdPerMillion:value,outputUsdPerMillion:1}));
});
