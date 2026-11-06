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
test('Maia game identity persists and cannot silently accept a Stockfish substitute',async()=>{
 const s=new Session(),game=new LearningGame(()=>s);game.start('b',3,'browser','maia');
 assert.equal(Session.import(s.export()).snapshot().game!.opponent,'maia');
 await assert.rejects(game.reply({move:async()=>({san:'e4',level:3,engine:'Stockfish fixture'})}),/falsche Engineantwort/);assert.equal(s.snapshot().nodes.length,1);
 game.resume();await game.reply({move:async()=>({san:'e4',level:3,engine:'Maia-2 fixture'})});assert.equal(s.snapshot().nodes.length,2);
 const invalid=JSON.parse(s.export());invalid.game.opponent='other';assert.throws(()=>Session.import(JSON.stringify(invalid)));
});
