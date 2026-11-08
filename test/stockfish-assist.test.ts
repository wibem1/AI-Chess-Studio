import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {withStockfishAssessment} from '../src/stockfish-assist.js';
import {TACTICAL_LIMITS} from '../src/tactics.js';
import type {TacticalAdapter} from '../src/tactics.js';
import type {DialogueRequest} from '../src/dialogue.js';

const fen=new Chess().fen(),base:DialogueRequest={nodeId:'n0',fen,question:'Erkläre die Stellung',legalMoves:new Chess().moves(),topic:'chat',context:['Eigene Gedanken'],toolsEnabled:true};
const report={fen,engine:'Stockfish 19 Lite',depth:10,nodes:20000,elapsedMs:300,score:{unit:'cp' as const,value:42,perspective:'white' as const},line:['e4','e5'],candidate:null,limits:TACTICAL_LIMITS};
test('optional Stockfish evidence is validated, bounded and tied to exact position',async()=>{
 let calls=0;const adapter:TacticalAdapter={async check(actual,candidate){calls++;assert.equal(actual,fen);assert.equal(candidate,null);return report;}};
 const enriched=await withStockfishAssessment(base,adapter);
 assert.equal(calls,1);assert.equal(enriched.context?.length,2);
 assert.match(enriched.context![0]!,/\+0\.42/);
 assert.match(enriched.context![0]!,/Tiefe 10/);
 assert.match(enriched.context![0]!,/e4 e5/);
 assert.equal(base.context?.length,1);
});
test('Stockfish is not run for match play or tool continuation',async()=>{
 let calls=0;const adapter:TacticalAdapter={async check(){calls++;return report;}};
 await withStockfishAssessment({...base,matchTest:{runId:'fixture',turn:1,color:'w'}},adapter);
 await withStockfishAssessment({...base,toolExchanges:[{} as never]},adapter);
 assert.equal(calls,0);
});
test('invalid engine report blocks paid request rather than inventing a score',async()=>{
 const adapter:TacticalAdapter={async check(){return {...report,fen:'wrong'}}};
 await assert.rejects(withStockfishAssessment(base,adapter),/Ungültiger Stockfish-Befund/);
});

test('paid model transport receives verified Stockfish context only when enabled',async()=>{
 const {ServerModelAdapter}=await import('../src/model-client.js');
 let providerCalls=0;
 const transport=(async(_url,options)=>{providerCalls++;const payload=JSON.parse(String(options!.body));assert.match(payload.context[0],/Stockfish-Faktencheck/);return new Response(JSON.stringify({message:'Geprüft'}));}) as typeof fetch;
 const model=new ServerModelAdapter(transport,()=>'',request=>withStockfishAssessment(request,{async check(){return report;}}));
 await model.respond(base);assert.equal(providerCalls,1);
 const rejected=new ServerModelAdapter(transport,()=>'',request=>withStockfishAssessment(request,{async check(){return {...report,score:{...report.score,value:Number.NaN}};}}));
 await assert.rejects(rejected.respond(base),/Ungültiger Stockfish-Befund/);
 assert.equal(providerCalls,1);
});
