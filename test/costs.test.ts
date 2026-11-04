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
  assert.equal(new CostControl(path).snapshot().budgetUsd,0.02);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
test('insufficient budget blocks before provider transport and does not count a paid attempt',async()=>{
 const costs=new CostControl();costs.configure({action:'configure',budgetUsd:0,inputUsdPerMillion:0.4,outputUsdPerMillion:1.6});
 let calls=0;const service=new ModelService({enabled:true,apiKey:'test-budget-key',model:'gpt-4.1-mini'},(async()=>{calls++;throw new Error();}) as typeof fetch,undefined,costs);
 const {Session}=await import('../src/session.js');const s=new Session();
 await assert.rejects(service.reply({nodeId:'n0',fen:s.snapshot().nodes[0]!.fen,question:'Plan?',legalMoves:s.legalMoves(),context:[]}),/Kostenbudget/);
 assert.equal(calls,0);assert.equal(costs.snapshot().requests,0);
});
test('uncertain failures remain charged conservatively and three attempts require explicit new period',()=>{
 const c=new CostControl();for(let i=0;i<3;i++){const n=c.reserve(100,800);c.settle(n,null);}
 assert.equal(c.snapshot().uncertainRequests,3);assert.throws(()=>c.reserve(100,800));
 assert.throws(()=>c.configure({action:'reset',confirm:false}));c.configure({action:'reset',confirm:true});
 assert.equal(c.snapshot().estimatedUsd,0);assert.equal(c.snapshot().requests,0);
});
test('invalid prices and budget settings cannot disable accounting',()=>{
 const c=new CostControl();for(const value of [-1,NaN,Infinity])assert.throws(()=>c.configure({action:'configure',budgetUsd:value,inputUsdPerMillion:1,outputUsdPerMillion:2}));
 assert.throws(()=>c.configure({action:'configure',budgetUsd:1,inputUsdPerMillion:0,outputUsdPerMillion:1}));
});
