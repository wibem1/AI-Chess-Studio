import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as ort from 'onnxruntime-web/wasm';
import {createMaia} from '@indiefoundry/maia2-onnx';
import {MAIA_SHA256,MAIA_BYTES} from '../src/maia-files.js';
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

test('diagnose Maia-2 Blitz move probabilities for real reported opening FENs (1500)',async()=>{
 const bytes=readFileSync('vendor/maia2/maia2-blitz.fp16.onnx');
 const session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm']});
 try{
  const model=createMaia({Tensor:ort.Tensor,session:{run:async({boards,...feeds})=>{
   const r=await session.run({board:boards as ort.Tensor,...feeds as Record<string,ort.Tensor>});
   return {logits_move:r.policy!,logits_value:r.value!};
  }}});
  const cases=[
   {name:'after 1.d4',fen:'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',played:'b8a6'},
   {name:'after 1.d4 Na6 2.f4 d6 3.e3',fen:'r1bqkbnr/ppp1pppp/n2p4/8/3P1P2/4P3/PPP3PP/RNBQKBNR b KQkq - 0 3',played:'a6b8'},
   {name:'after 1.d4 Nc6 2.e3',fen:'r1bqkbnr/pppppppp/2n5/8/3P4/4P3/PPP2PPP/RNBQKBNR b KQkq - 0 2',played:'c6b8'},
  ];
  for(const item of cases){
   const p=await model.predict(item.fen,1500,1500);
   const played=p.moves.find(move=>move.uci===item.played);
   console.log('MAIA_OPENING_DIAG',JSON.stringify({name:item.name,played:item.played,playedProbability:played?.p??null,top10:p.moves.slice(0,10)}));
   assert.ok(p.moves.length>0);
   assert.ok(Math.abs(p.moves.reduce((sum,m)=>sum+m.p,0)-1)<1e-4);
  }
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
