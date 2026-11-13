import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Session} from '../src/session.js';
import {TACTICAL_LIMITS,type TacticalAdapter} from '../src/tactics.js';
import {scanFullGame,gameResultCp} from '../src/full-game-analysis.js';
import {AutomaticStockfish} from '../web/automatic-stockfish.js';

// Exact final 17 moves and initial FEN of the user's diagnostic, nodes
// n120..n137. The same position occurs after 61.Kh2, 65.Kh2 and 69.Kh2.
const root='8/8/8/8/6k1/6np/6K1/8 w - - 0 61';
const moves=['Kh2','Nf1+','Kg1','Ne3','Kh2','Nf5','Kh1','Ng3+','Kh2','Kh4','Kg1','Ne2+','Kh2','Kg4','Kh1','Ng3+','Kh2'];
const fixture=()=>{
 const board=new Chess(root),positions=[board.fen()];
 for(const san of moves){board.move(san);positions.push(board.fen());}
 return {board,positions};
};
const adapter=(onCall:(fen:string)=>void):TacticalAdapter=>({
 async check(fen,candidate){
  assert.equal(candidate,null);
  onCall(fen);
  const position=new Chess(fen);
  return {fen,engine:'Stockfish 19 Lite fixture',depth:12,nodes:20,elapsedMs:1,
   score:{unit:'cp' as const,value:-400,perspective:'white' as const},
   line:[position.moves()[0]!],candidate:null,limits:TACTICAL_LIMITS};
 }
});

test('real 69.Kh2 third repetition is detected by history, not isolated FEN',()=>{
 const {board,positions}=fixture();
 assert.equal(moves.length,17);
 assert.equal(positions[1]!.split(' ').slice(0,4).join(' '),positions[9]!.split(' ').slice(0,4).join(' '));
 assert.equal(positions[9]!.split(' ').slice(0,4).join(' '),positions[17]!.split(' ').slice(0,4).join(' '));
 assert.equal(board.isThreefoldRepetition(),true);
 assert.equal(board.fen(),'8/8/8/8/6k1/6np/7K/8 b - - 17 69');
 assert.equal(gameResultCp(board),0);
 assert.equal(gameResultCp(new Chess(board.fen())),null,'bare FEN loses repetition history');
});

test('automatic queue stores third repetition as history-backed zero and completes game report',async()=>{
 const s=new Session(root);
 for(const san of moves)s.play(san);
 const {positions}=fixture();
 let calls=0,saves=0;
 const queue=new AutomaticStockfish(()=>s,()=>adapter(()=>calls++),()=>false,async()=>{saves++;});
 assert.equal(await queue.ensure(),true);
 assert.equal(calls,17,'the repeated terminal position must not be sent to Stockfish');
 assert.equal(s.snapshot().positionScores?.n17?.cp,0);
 assert.equal(s.snapshot().positionScores?.n17?.depth,0);
 assert.equal(s.snapshot().fullGameAnalysis?.records.length,17);
 assert.equal(s.snapshot().fullGameAnalysis?.records.at(-1)?.afterCp,0);
 assert.ok(saves>=18);
 assert.equal(queue.error,'');
 const restored=Session.import(s.export());
 assert.equal(restored.snapshot().positionScores?.n17?.cp,0);
 assert.equal(restored.snapshot().fullGameAnalysis?.records.length,17);
});

test('whole game scanner also respects third repetition and does not call engine there',async()=>{
 const {positions}=fixture();let calls=0;
 const result=await scanFullGame(root,moves,adapter(fen=>{
  assert.notEqual(fen,positions[17]);
  calls++;
 }));
 assert.equal(calls,17);
 assert.equal(result.records.length,17);
 assert.equal(result.records.at(-1)?.afterCp,0);
});

test('the original complete 137-ply Lichess PGN now finishes background scoring and survives export',async()=>{
 const {readFileSync}=await import('node:fs');
 const pgn=readFileSync('test/fixtures/lichess-1Vh80QL2.pgn','utf8');
 const session=Session.fromPgn(pgn,'b','wibem','study');
 assert.equal(session.snapshot().review?.original.length,138);
 let calls=0;
 const queue=new AutomaticStockfish(()=>session,()=>adapter(()=>calls++),()=>false,async()=>{});
 assert.equal(await queue.ensure(),true,queue.error);
 const data=session.snapshot();
 assert.equal(Object.keys(data.positionScores??{}).length,138);
 assert.equal(data.positionScores?.n137?.cp,0);
 assert.equal(data.positionScores?.n137?.depth,0);
 assert.equal(data.fullGameAnalysis?.records.length,137);
 assert.equal(data.fullGameAnalysis?.completed,true);
 assert.ok(calls<=137,'history-backed draw must bypass normal Stockfish search');
 const restored=Session.import(session.export());
 assert.equal(restored.snapshot().fullGameAnalysis?.records.length,137);
});
