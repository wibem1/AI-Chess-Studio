import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Session} from '../src/session.js';
import {TACTICAL_LIMITS,type TacticalAdapter} from '../src/tactics.js';
import {AutomaticStockfish} from '../web/automatic-stockfish.js';

const mock=(onCall?:(fen:string)=>void):TacticalAdapter=>({async check(fen,candidate){
 assert.equal(candidate,null);onCall?.(fen);
 const chess=new Chess(fen);
 return {fen,engine:'Stockfish 19 Lite fixture',depth:12,nodes:10,elapsedMs:20,
 score:{unit:'cp',value:chess.turn()==='w'?20:-20,perspective:'white'},
 line:[chess.moves()[0]!],candidate:null,limits:TACTICAL_LIMITS};
}});

test('automatic scores are stored without UI visibility and survive session export/import',async()=>{
 const s=new Session();s.play('e4');s.play('e5');let calls=0,saves=0;
 const queue=new AutomaticStockfish(()=>s,()=>mock(()=>calls++),()=>false,async()=>{saves++;});
 assert.equal(await queue.ensure(),true);
 assert.equal(calls,3);
 assert.ok(saves>=3);
 assert.equal(s.snapshot().fullGameAnalysis?.records.length,2);
 assert.equal(Object.keys(s.snapshot().positionScores??{}).length,3);
 const restored=Session.import(s.export());
 assert.equal(restored.snapshot().fullGameAnalysis?.records.length,2);
 assert.equal(Object.keys(restored.snapshot().positionScores??{}).length,3);
 assert.ok(restored.snapshot().positionScores?.n1?.line?.length, 'main variation survives reload and can be displayed without another calculation');
 const newQueue=new AutomaticStockfish(()=>restored,()=>mock(()=>calls++),()=>false,async()=>{});
 assert.equal(await newQueue.ensure(),true);
 assert.equal(calls,3,'reloading must not repeat completed engine calculations');
});

test('auto queue only evaluates missing newly played nodes and preserves prior results after branching',async()=>{
 const s=new Session();s.play('e4');s.play('e5');let calls=0;
 const queue=new AutomaticStockfish(()=>s,()=>mock(()=>calls++),()=>false,async()=>{});
 await queue.ensure();assert.equal(calls,3);
 s.play('Nf3');await queue.ensure();
 assert.equal(calls,4);
 assert.equal(s.snapshot().fullGameAnalysis?.records.length,3);
 s.select('n1');s.play('c5');await queue.ensure();
 assert.equal(calls,5);
 assert.equal(s.snapshot().positionScores?.n2?.fen,new Chess().move('e4')&&s.snapshot().nodes.find(n=>n.id==='n2')!.fen);
 assert.equal(s.snapshot().fullGameAnalysis?.records.at(-1)?.san,'c5');
});

test('auto scanner does not evaluate while playing engine is busy; error remains diagnostic',async()=>{
 const s=new Session();s.play('e4');let busy=true,calls=0;
 const queue=new AutomaticStockfish(()=>s,()=>mock(()=>calls++),()=>busy,async()=>{});
 // Immediate ensure is an explicit AI priority, ordinary scheduled tasks defer.
 // Missing score can still be explicitly prepared for the AI.
 busy=false;assert.equal(await queue.ensure(),false);
 assert.equal(calls,2);
 const failed=new Session();failed.play('d4');
 const problem=new AutomaticStockfish(()=>failed,()=>({async check(){throw new Error('Testfehler Engine');}}),()=>false,async()=>{});
 assert.equal(await problem.ensure(),false);
 assert.match(problem.error,/Testfehler Engine/);
});
