import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Chess} from 'chess.js';
import {parsePgn} from '../src/review.js';
import {strategicPlans} from '../src/strategic-plans.js';
import {strategicFeatures} from '../src/strategic-features.js';
import {findKnightRoutes} from '../src/strategic-knight-routes.js';

const fixture='test/fixtures/lichess-1Vh80QL2.pgn';
const critical=[
 {ply:11,played:'e5',alternative:'Nc3',next:'dxe5',topic:'Vorstoß im Zentrum vor ausreichender Entwicklung'},
 {ply:35,played:'Nd6',alternative:'Rxf6',next:'Re7',topic:'Taktische Möglichkeit statt Springer-Vorposten'},
 {ply:41,played:'Nxb7',alternative:'Ne4',next:'Rxb7',topic:'Bauerngewinn und taktische Antwort'},
 {ply:55,played:'Rd1',alternative:'b4',next:'Nxg3',topic:'Turmzug und gegnerische Taktik'},
 {ply:93,played:'Rxg7',alternative:'Ra7',next:'Nxg7',topic:'Turmverlust statt sicherem Abtausch'}
] as const;

function sourceGame(){
 const text=readFileSync(fixture,'utf8'),game=parsePgn(text);
 assert.equal(game.moves.length,137);
 assert.equal(game.headers.Site,'https://lichess.org/game/1Vh80QL2');
 return game;
}
function beforePly(ply:number){
 const game=sourceGame(),chess=new Chess(game.rootFen);
 for(const turn of game.moves.slice(0,ply-1))chess.move(turn.san);
 return {game,chess};
}
test('five real annotated key positions reconstruct exactly and contain legal alternative moves',()=>{
 for(const item of critical){
  const {game,chess}=beforePly(item.ply),fen=chess.fen(),record=game.moves[item.ply-1]!;
  assert.equal(record.san,item.played,`ply ${item.ply}`);
  assert.ok(chess.moves().includes(item.played),`played illegal at ply ${item.ply}`);
  assert.ok(chess.moves().includes(item.alternative),`annotated alternative illegal at ply ${item.ply}`);
  // The alternative is the Lichess annotation, not an independently verified
  // best move or our own engine verdict.
  assert.match(record.comment,/was best/,item.topic);
  const afterReal=new Chess(fen);afterReal.move(item.played);
  assert.equal(afterReal.fen(),record.after,`original actual position at ply ${item.ply}`);
  assert.equal(game.moves[item.ply]!.san,item.next,`actual immediate reply after ply ${item.ply}`);
  assert.ok(afterReal.moves().includes(item.next),`actual reply illegal at ply ${item.ply}`);
  const afterAlternative=new Chess(fen);afterAlternative.move(item.alternative);
  assert.notEqual(afterAlternative.fen(),afterReal.fen());
  assert.equal(chess.fen(),fen,'scenario analysis may not change original position');
 }
});
test('at real key positions plans remain non-engine hypotheses with legal first moves',()=>{
 for(const item of critical){
  const {chess}=beforePly(item.ply),fen=chess.fen();
  const report=strategicPlans(fen);
  assert.equal(report.fen,fen,item.topic);
  assert.equal(report.engineUsed,false,item.topic);
  assert.ok(report.plans.length<=2,item.topic);
  for(const plan of report.plans){
   assert.equal(plan.status,'candidate_not_verified',item.topic);
   assert.ok(plan.prerequisites.length>0,item.topic);
   assert.ok(plan.possibleDefense.length>0,item.topic);
   if(plan.candidateMove){
    assert.equal(plan.side,chess.turn(),item.topic);
    assert.ok(chess.moves().includes(plan.candidateMove),item.topic);
   }
  }
  const features=strategicFeatures(fen);
  const routes=findKnightRoutes(fen);
  assert.equal(features.fen,fen,item.topic);
  for(const route of routes){
   assert.equal(route.warning,'static_route_not_a_variation',item.topic);
   if(route.firstMove)assert.ok(chess.moves().includes(route.firstMove),item.topic);
  }
  assert.equal(chess.fen(),fen,item.topic);
 }
});
test('recorded game draw and source commentary are not turned into made-up model outcomes',()=>{
 const g=sourceGame();
 assert.equal(g.headers.Result,'1/2-1/2');
 const {game}=beforePly(93);
 assert.equal(game.moves[93]!.san,'Nxg7');
 assert.match(game.moves[92]!.comment,/Blunder/);
 assert.equal(game.moves.at(-1)!.san,'Kh2');
});
