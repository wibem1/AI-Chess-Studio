import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Session} from '../src/session.js';
import {scanFullGame,makeFullGameAnalysis,fullGameSummary} from '../src/full-game-analysis.js';
import {TACTICAL_LIMITS,type TacticalAdapter} from '../src/tactics.js';

test('full game analysis computes separate, explicitly approximate White and Black error counts',()=>{
 const game=makeFullGameAnalysis(new Chess().fen(),['f3','e5','g4','Qh4#'],[0,-180,-160,-570,-1500],['n1','n2','n3','n4']);
 assert.deepEqual(game.records.map(r=>r.grade),['Fehler','gut','grober Fehler','gut']);
 assert.equal(game.players.white.mistakes,1);assert.equal(game.players.white.blunders,1);
 assert.equal(game.players.black.blunders,0);
 assert.match(fullGameSummary(game),/g4: grober Fehler/);
 assert.doesNotMatch(fullGameSummary(game),/Genauigkeit: [0-9]+%/);
});
test('real history is checked for all nonterminal Stockfish positions, full analysis survives JSON reload',async()=>{
 const root=new Chess().fen(),moves=['f3','e5','g4','Qh4#'];let calls=0;
 const adapter:TacticalAdapter={async check(fen,candidate,history){
  assert.equal(candidate,null);assert.deepEqual(history,{rootFen:root,moves:moves.slice(0,calls)});
  const chess=new Chess(fen);assert.equal(chess.isGameOver(),false);
  const line=[chess.moves()[0]!];const score=[0,-180,-160,-570][calls]!;
  calls++;return {fen,engine:'Stockfish 19 Lite',depth:12,nodes:20000,elapsedMs:123,
   score:{unit:'cp',value:score,perspective:'white'},line,candidate:null,limits:TACTICAL_LIMITS,history};
 }};
 const s=new Session();for(const move of moves)s.play(move);
 const report=await scanFullGame(root,moves,adapter,()=>{},undefined,['n1','n2','n3','n4']);
 assert.equal(calls,4,'final checkmate must not be passed to the Stockfish engine');
 s.storeFullGameAnalysis(report);
 const loaded=Session.import(s.export());
 assert.deepEqual(loaded.snapshot().fullGameAnalysis,report);
 assert.equal(loaded.snapshot().fullGameAnalysis?.records.length,4);
});
test('incomplete and aborted scans do not claim a complete player-quality report',async()=>{
 const root=new Chess().fen();
 await assert.rejects(scanFullGame(root,['f3','e5'],{async check(){throw new Error('Engine nicht erreichbar');}}),/Engine nicht erreichbar/);
 const c=new AbortController();c.abort();
 let calls=0;
 await assert.rejects(scanFullGame(root,['f3','e5'],{async check(){calls++;throw new Error();}},()=>{},c.signal),/abgebrochen/);
 assert.equal(calls,0);
});
