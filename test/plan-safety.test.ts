import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {checkProposedFirstMove,verifyModelCandidates,unverifiedProseMoves} from '../src/plan-safety.js';
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

// Regression from the user's real 70...Rb5?? proposal: a5-rook can capture b5.
test('real Stockfish vetoes the lost-rook move in the reported endgame',async()=>{
 const {StockfishService}=await import('../server/stockfish.js');
 const engine=new StockfishService();
 const position='8/8/7k/R6P/1r6/p4K2/8/8 b - - 9 70';
 await assert.rejects(checkProposedFirstMove(position,'Rb5',{check:(fen,candidate)=>engine.check({fen,candidate})}),/Stockfish-Planprüfung: Rb5.*nicht vorgeführt/);
});

test('two model candidates share one baseline; losing candidate is explicitly excluded',async()=>{
 const base=adapter(),calls:string[]=[];
 const engine:TacticalAdapter={check:(f,c)=>{calls.push(c??'best');return base.check(f,c);}};
 const result=await verifyModelCandidates(fen,['e4','a3'],engine);
 assert.deepEqual(calls,['best','a3']);
 assert.deepEqual(result.approved,['e4']);
 assert.equal(result.rejected[0]?.san,'a3');
 assert.match(result.rejected[0]!.reason,/nicht vorgeführt/);
});
test('engine outage never authorizes an unchecked candidate',async()=>{
 const result=await verifyModelCandidates(fen,['d4'],{
  async check(f,c){if(c!==null)throw new Error('Engine nicht erreichbar');return adapter().check(f,null);}
 });
 assert.equal(result.approved.length,0);
 assert.match(result.rejected[0]!.reason,/Engine nicht erreichbar/);
});

test('free prose recognizes illegal and legal SAN tokens, but not embedded ordinary words',()=>{
 assert.deepEqual(unverifiedProseMoves(fen,'Spiele a3, statt e4.',[]),['a3','e4']);
 assert.deepEqual(unverifiedProseMoves(fen,'Spiele e4, vermeide e5.', ['e4']),['e5']);
 assert.deepEqual(unverifiedProseMoves(fen,'Strategie, Bauernstruktur und Raumgewinn.',[]),[]);
});
test('German prose SAN matches Stockfish SAN and still catches unchecked moves',()=>{
 assert.deepEqual(unverifiedProseMoves(fen,'Tb3+ ist der Vorschlag; a2 wäre ein Vergleich.', ['Rb3+']),['a2']);
 assert.deepEqual(unverifiedProseMoves(fen,'Txa2 ist nicht geprüft.', ['Rxa2']),[]);
});
test('free prose permits verified historical game references but still blocks an unchecked suggestion',()=>{
 assert.deepEqual(unverifiedProseMoves(fen,'Nach 1. e4 wurde d4 als Alternative genannt.',[],['e4']),['d4']);
});
