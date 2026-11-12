import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Chess} from 'chess.js';
import * as ort from 'onnxruntime-web/wasm';
import {createMaia} from '@indiefoundry/maia2-onnx';
import {MAIA_SHA256,MAIA_BYTES} from '../src/maia-files.js';
import {selectMaiaMove} from '../src/maia-move-policy.js';
import {LearningGame} from '../src/game.js';
import {Session} from '../src/session.js';
ort.env.wasm.numThreads=1;
test('actual pinned Maia WASM model matches independent Blitz reference predictions for both colors and three ratings',async()=>{
 const bytes=readFileSync('vendor/maia2/maia2-blitz.fp16.onnx');assert.equal(bytes.length,MAIA_BYTES);assert.equal(createHash('sha256').update(bytes).digest('hex'),MAIA_SHA256);
 const session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm']});
 try{
 const model=createMaia({Tensor:ort.Tensor,session:{run:async({boards,...feeds})=>{const r=await session.run({board:boards as ort.Tensor,...feeds as Record<string,ort.Tensor>});return{logits_move:r.policy!,logits_value:r.value!};}}});
 const fixtures=JSON.parse(readFileSync('test/fixtures/maia-blitz-reference.json','utf8')) as {fen:string;eloSelf:number;eloOppo:number;top10:{uci:string;p:number}[]}[];
 for(const f of fixtures){const p=await model.predict(f.fen,f.eloSelf,f.eloOppo);assert.equal(p.moves[0]!.uci,f.top10[0]!.uci,`${f.fen} / ${f.eloSelf}`);assert.ok(Math.abs(p.moves[0]!.p-f.top10[0]!.p)<0.005);assert.ok(Math.abs(p.moves.reduce((sum,m)=>sum+m.p,0)-1)<1e-5);}
 }finally{await session.release();}
});
test('Maia game identity persists and cannot silently accept a Stockfish substitute',async()=>{
 const s=new Session(),game=new LearningGame(()=>s);game.start('b',3,'browser','maia');
 assert.equal(Session.import(s.export()).snapshot().game!.opponent,'maia');
 await assert.rejects(game.reply({move:async()=>({san:'e4',level:3,engine:'Stockfish fixture'})}),/falsche Engineantwort/);assert.equal(s.snapshot().nodes.length,1);
 game.resume();await game.reply({move:async()=>({san:'e4',level:3,engine:'Maia-2 fixture',uci:'e2e4',modelFen:s.snapshot().nodes[0]!.fen})});assert.equal(s.snapshot().nodes.length,2);
 const invalid=JSON.parse(s.export());invalid.game.opponent='other';assert.throws(()=>Session.import(JSON.stringify(invalid)));
});

test('Maia mismatch is rejected before a board move and diagnostic event',async()=>{
 const s=new Session(),events:unknown[]=[],game=new LearningGame(()=>s,event=>events.push(event));
 game.start('b',3,'browser','maia');
 const before=s.snapshot().nodes[0]!.fen;
 await assert.rejects(game.reply({move:async()=>({san:'e4',level:3,engine:'Maia-2 fixture',uci:'d2d4',modelFen:before})}),/Maia-Zug stimmt nicht/);
 assert.equal(s.snapshot().nodes.length,1);
 assert.equal(events.length,0);
 assert.equal(s.snapshot().game?.paused,true);
 game.resume();
 await assert.rejects(game.reply({move:async()=>({san:'e4',level:3,engine:'Maia-2 fixture',uci:'e2e4',modelFen:'incorrect'})}),/Maia-Zug stimmt nicht/);
 assert.equal(s.snapshot().nodes.length,1);
 assert.equal(events.length,0);
});

test('Maia opening candidates exclude very rare first moves while retaining human choice',()=>{
 const fen='rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1';
 const moves=[{uci:'g8f6',p:0.461576},{uci:'b8c6',p:0.124565},{uci:'d7d5',p:0.092104},{uci:'b8a6',p:0.012652}];
 for(const random of [0,0.2,0.5,0.99,0.99999])
  assert.notEqual(selectMaiaMove(fen,moves,{plies:1},()=>random),'b8a6');
 assert.equal(selectMaiaMove(fen,moves,{plies:1},()=>0),'g8f6');
 assert.equal(selectMaiaMove(fen,moves,{plies:1},()=>0.999),'d7d5');
});
test('Maia pawn and knight returns: unforced reverse is filtered but forced or threatened retreats remain legal',()=>{
 const fen='r1bqkbnr/pppppppp/2n5/8/3P4/4P3/PPP2PPP/RNBQKBNR b KQkq - 0 2';
 const moves=[{uci:'c6b8',p:0.87},{uci:'g8f6',p:0.053},{uci:'d7d5',p:0.032},{uci:'e7e6',p:0.007}];
 const ctx={plies:3,recentOwnMoves:[{from:'b8',to:'c6',color:'b' as const}]};
 assert.equal(selectMaiaMove(fen,moves,ctx,()=>0),'g8f6');
 assert.equal(selectMaiaMove(fen,moves,{plies:5,recentOwnMoves:[{from:'b8',to:'c6',color:'b'},{from:'d7',to:'d6',color:'b'}]},()=>0),'g8f6');
 assert.equal(selectMaiaMove(fen,moves,ctx,()=>0.99),'d7d5');
 assert.equal(selectMaiaMove(fen,moves,{plies:3},()=>0),'c6b8');
 const threatened=new Chess();
 threatened.move('e4');threatened.move('Nc6');threatened.move('Bb5');
 assert.equal(selectMaiaMove(threatened.fen(),[{uci:'c6b8',p:0.9},{uci:'g8f6',p:0.1}],ctx,()=>0),'c6b8');
});
test('Maia-2 real ONNX predictions no longer produce reported opening shuttles',async()=>{
 const bytes=readFileSync('vendor/maia2/maia2-blitz.fp16.onnx');
 const session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm']});
 try{
  const model=createMaia({Tensor:ort.Tensor,session:{run:async({boards,...feeds})=>{
   const r=await session.run({board:boards as ort.Tensor,...feeds as Record<string,ort.Tensor>});
   return {logits_move:r.policy!,logits_value:r.value!};
  }}});
  const scenarios=[
   {fen:'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',plies:1,prior:[] as {from:string;to:string;color:'b'}[],bad:'b8a6'},
   {fen:'r1bqkbnr/ppp1pppp/n2p4/8/3P1P2/4P3/PPP3PP/RNBQKBNR b KQkq - 0 3',plies:5,prior:[{from:'b8',to:'a6',color:'b' as const},{from:'d7',to:'d6',color:'b' as const}],bad:'a6b8'},
   {fen:'r1bqkbnr/pppppppp/2n5/8/3P4/4P3/PPP2PPP/RNBQKBNR b KQkq - 0 2',plies:3,prior:[{from:'b8',to:'c6',color:'b' as const}],bad:'c6b8'}
  ];
  for(const item of scenarios){
   const prediction=await model.predict(item.fen,1500,1500);
   for(const random of [0,0.25,0.5,0.75,0.9999]){
    const selected=selectMaiaMove(item.fen,prediction.moves,{plies:item.plies,recentOwnMoves:item.prior},()=>random);
    assert.notEqual(selected,item.bad,item.fen);
   }
  }
 }finally{await session.release();}
});
