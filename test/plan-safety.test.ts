import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {checkProposedFirstMove} from '../src/plan-safety.js';
import {TACTICAL_LIMITS,type TacticalAdapter} from '../src/tactics.js';
const fen=new Chess().fen();
function adapter(best='e4',bestCp=50,forcedCp=-250):TacticalAdapter{
 return {async check(position,candidate){
  assert.equal(position,fen);
  const board=new Chess(fen),first=board.move(candidate??best),reply=board.moves()[0]!;
  return {fen,engine:'Stockfish 19 Lite',depth:12,nodes:20000,elapsedMs:900,
   score:{unit:'cp',value:candidate===null?bestCp:forcedCp,perspective:'white'},
   line:[first.san,reply],candidate,limits:TACTICAL_LIMITS};
 }};
}
test('losing proposed first move is vetoed before a board demonstration',async()=>{await assert.rejects(checkProposedFirstMove(fen,'a3',adapter()),/Stockfish-Planprüfung: a3.*nicht vorgeführt/);});
test('engine preferred first move is checked with a single result',async()=>{
 let calls=0,source=adapter();
 const result=await checkProposedFirstMove(fen,'e4',{async check(f,c){calls++;return source.check(f,c);}});
 assert.equal(calls,1);assert.equal(result.lossCp,0);
});
test('acceptable alternatives are not falsely described as strategically best',async()=>{assert.equal((await checkProposedFirstMove(fen,'d4',adapter('e4',50,10))).lossCp,40);});
test('illegal and mismatched results do not authorize a move',async()=>{
 await assert.rejects(checkProposedFirstMove(fen,'e5',adapter()),/nicht legal/);
 await assert.rejects(checkProposedFirstMove(fen,'d4',{async check(f,c){return {...await adapter().check(f,c) as object,fen:'wrong'};}}),/Ungültiger Stockfish-Befund/);
});
