import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import type {EngineWorker} from '../src/browser-uci.js';
import {BrowserDeepStockfish,cleanStrategicDraft,deepReviewPlies,reviewDeepChecks,verifyDeepResult,validateDeepChecksForGame} from '../src/deep-stockfish.js';
import {Session} from '../src/session.js';
import {parseRequest} from '../src/model-contract.js';

const root=new Chess().fen();
test('strategic stage selects at most five validated historical halfmoves',()=>{
 const draft='Untersuche die Fesselung nach 2.Sf3.\nENGINE_CHECK_PLIES: 3, 4, 3';
 assert.deepEqual(deepReviewPlies(draft,['e4','e5','Nf3','Nc6']),[3,4]);
 assert.equal(cleanStrategicDraft(draft),'Untersuche die Fesselung nach 2.Sf3.');
 for(const line of ['ENGINE_CHECK_PLIES: 0','ENGINE_CHECK_PLIES: 9','ENGINE_CHECK_PLIES: -1','ENGINE_CHECK_PLIES: 1,2,3,4,5,6','ENGINE_CHECK_PLIES: 1; stop','ENGINE_CHECK_PLIES: 1\nENGINE_CHECK_PLIES: 2']){
  assert.deepEqual(deepReviewPlies(line,['e4','e5','Nf3','Nc6']),[]);
 }
});
test('verified deep lines reject illegal moves, mismatched FEN and duplicate candidates',()=>{
 const board=new Chess();board.move('e4');
 const fen=board.fen(),base={ply:2,fen,played:'e5',elapsedMs:40,lines:[{depth:19,score:{unit:'cp' as const,value:20},san:['e5','Nf3']}],playedLine:{depth:19,score:{unit:'cp' as const,value:20},san:['e5','Nf3']}};
 assert.deepEqual(verifyDeepResult(base,fen,'e5'),base);
 assert.throws(()=>verifyDeepResult({...base,fen:root},fen,'e5'));
 assert.throws(()=>verifyDeepResult({...base,lines:[{...base.lines[0]!,san:['Qh4']}]},fen,'e5'));
 assert.throws(()=>verifyDeepResult({...base,lines:[base.lines[0]!,base.lines[0]!] },fen,'e5'));
});
class WorkerFixture implements EngineWorker {
 onmessage:EngineWorker['onmessage']=null;onerror:EngineWorker['onerror']=null;onmessageerror:EngineWorker['onmessageerror']=null;
 commands:string[]=[];terminated=0;
 emit(text:string){this.onmessage?.(new MessageEvent('message',{data:text}));}
 postMessage(command:string){
  this.commands.push(command);
  if(command==='uci'){this.emit('id name Stockfish 19 fixture');this.emit('uciok');}
  if(command==='isready')this.emit('readyok');
  if(command.startsWith('go ')){
   this.emit('info depth 17 nodes 4000 multipv 1 score cp 45 pv e7e5 g1f3');
   this.emit('info depth 17 nodes 4000 multipv 2 score cp 25 pv c7c5 g1f3');
   this.emit('info depth 17 nodes 4000 multipv 3 score cp 18 pv e7e6 d2d4');
   this.emit('bestmove e7e5');
  }
 }
 terminate(){this.terminated++;}
}
test('deep browser Stockfish replays exact game history and supplies legal MultiPV with white-perspective scores',async()=>{
 const fixture=new WorkerFixture(),engine=new BrowserDeepStockfish(()=>fixture);
 const report=await engine.check(root,['e4','e5','Nf3'],2);
 const afterE4=new Chess(root);afterE4.move('e4');assert.equal(report.fen,afterE4.fen());
 assert.equal(report.played,'e5');
 assert.equal(report.lines.length,3);
 assert.equal(report.lines[0]?.score.value,-45);
 assert.deepEqual(report.lines[0]?.san,['e5','Nf3']);
 assert.deepEqual(report.lines[1]?.san,['c5','Nf3']);
 assert.ok(fixture.commands.includes('position fen '+root+' moves e2e4'));
 assert.ok(fixture.commands.includes('setoption name MultiPV value 3'));
 assert.ok(fixture.commands.includes('go depth 24 nodes 500000 movetime 4000'));
 assert.equal(fixture.terminated,1);
});
test('deep search refuses illegal historical targets before allocating engine worker',async()=>{
 let count=0;const engine=new BrowserDeepStockfish(()=>{count++;return new WorkerFixture();});
 await assert.rejects(engine.check(root,['e4','invalid'],2));
 await assert.rejects(engine.check(root,['e4'],5));
 assert.equal(count,0);
});
test('review check execution bounds requests and does not claim engine results after failures',async()=>{
 let calls=0;
 const fake={check:async()=>{calls++;throw Error('Engine fehlt');},cancel(){} } as unknown as BrowserDeepStockfish;
 assert.deepEqual(await reviewDeepChecks(root,['e4','e5'],[1,2],fake),[]);
 assert.equal(calls,2);
 await assert.rejects(reviewDeepChecks(root,['e4','e5'],[1,2,3],fake));
 assert.equal(calls,2);
});

test('deep engine evidence survives session export and import only for its exact legal game',()=>{
 const session=new Session();session.play('e4');session.play('e5');
 const before=new Chess(root);before.move('e4');
 const checked={ply:2,fen:before.fen(),played:'e5',elapsedMs:100,
   lines:[{depth:17,score:{unit:'cp' as const,value:-30},san:['e5','Nf3']}],playedLine:{depth:17,score:{unit:'cp' as const,value:-30},san:['e5','Nf3']}};
 assert.deepEqual(validateDeepChecksForGame(root,['e4','e5'],[checked]),[checked]);
 session.storeDeepReview('n2',root,['e4','e5'],[checked]);
 const recovered=Session.import(session.export());
 assert.deepEqual(recovered.snapshot().deepReview?.checks,[checked]);
 assert.throws(()=>session.storeDeepReview('n1',root,['e4','e5'],[checked]));
 const damaged=JSON.parse(session.export());damaged.deepReview.checks[0].lines[0].san[0]='Qh4';
 assert.throws(()=>Session.import(JSON.stringify(damaged)),/Illegale/);
 const good=Session.import(session.export()).snapshot();
 const request={nodeId:'n2',fen:good.nodes[2]!.fen,question:'Analysiere die Partie',legalMoves:new Chess(good.nodes[2]!.fen).moves(),context:[],topic:'review',hintMode:'explain',
   history:{rootFen:root,moves:['e4','e5'],truncated:false},cachedDeepChecks:[checked]};
 assert.deepEqual(parseRequest(request).cachedDeepChecks,[checked]);
 assert.throws(()=>parseRequest({...request,cachedDeepChecks:[{...checked,fen:root}]}));
});
