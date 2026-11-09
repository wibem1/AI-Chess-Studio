import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess,type Square} from 'chess.js';
import {strategicPlans} from '../src/strategic-plans.js';
import {strategicFeatures} from '../src/strategic-features.js';
import {findKnightRoutes} from '../src/strategic-knight-routes.js';
import {immediateReplyAlerts} from '../src/strategic-reply-alerts.js';

/**
 * Legal, reproducible opening-to-middlegame paths. These are representative
 * chess structures, not claimed historical games or model-quality verdicts.
 * FENs are generated from legal SAN by chess.js to prevent fabricated states.
 */
const corpus=[
 {id:'ruy-lopez-closed',description:'Spanische Partie, geschlossene Struktur',
  moves:['e4','e5','Nf3','Nc6','Bb5','a6','Ba4','Nf6','O-O','Be7','Re1','b5','Bb3','d6','c3','O-O','h3','Nb8','d4','Nbd7']},
 {id:'qgd-orthodox',description:'Abgelehntes Damengambit, Spannung im Zentrum',
  moves:['d4','d5','c4','e6','Nc3','Nf6','Bg5','Be7','e3','O-O','Nf3','h6','Bh4','b6','cxd5','exd5','Bd3','Bb7','O-O','Nbd7']},
 {id:'french-advance',description:'Französisch Vorstoß, Bauernketten',
  moves:['e4','e6','d4','d5','e5','c5','c3','Nc6','Nf3','Qb6','Bd3','cxd4','cxd4','Bd7','O-O','Nxd4','Nxd4','Qxd4','Nc3','Qb6']},
 {id:'sicilian-najdorf-setup',description:'Sizilianische Najdorf-Struktur, Gegenangriff',
  moves:['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6','Be2','e5','Nb3','Be7','O-O','O-O','Be3','Be6','f4','Qc7']},
 {id:'caro-kann-classical',description:'Caro-Kann, klassische Struktur',
  moves:['e4','c6','d4','d5','Nc3','dxe4','Nxe4','Bf5','Ng3','Bg6','h4','h6','Nf3','Nd7','h5','Bh7','Bd3','Bxd3','Qxd3','e6']},
 {id:'italian-guioco-piano',description:'Italienisch, langsame Entwicklung',
  moves:['e4','e5','Nf3','Nc6','Bc4','Bc5','c3','Nf6','d3','d6','O-O','O-O','Re1','a6','Bb3','Ba7','h3','h6','Nbd2','Re8']}
] as const;

const bench=()=>corpus.map(item=>{
 const chess=new Chess();
 for(const san of item.moves){assert.ok(chess.moves().includes(san),`${item.id}: illegal SAN ${san}`);chess.move(san);}
 return {id:item.id,description:item.description,fen:chess.fen(),turn:chess.turn(),moves:item.moves};
});

test('all six strategic teaching positions are reconstructed from real legal half-moves',()=>{
 const cases=bench();assert.equal(cases.length,6);
 for(const item of cases){
  assert.equal(item.moves.length,20,item.id);
  const c=new Chess(item.fen);
  assert.equal(c.isGameOver(),false,item.id);
  assert.equal(c.turn(),'w',item.id);
 }
});
test('real opening structures yield bounded, FEN-grounded, explicitly non-engine plan hypotheses',()=>{
 for(const item of bench()){
  const c=new Chess(item.fen);
  const plans=strategicPlans(item.fen);
  assert.equal(plans.fen,c.fen(),item.id);
  assert.equal(plans.engineUsed,false,item.id);
  assert.ok(plans.plans.length<=2,item.id);
  for(const p of plans.plans){
   assert.equal(p.status,'candidate_not_verified',item.id);
   assert.equal(p.stages.length,3,item.id);
   assert.ok(p.possibleDefense.length>0,item.id);
   assert.ok(p.prerequisites.length>0,item.id);
   assert.ok(p.evidence.length>0,item.id);
   if(p.candidateMove!==undefined){
    assert.equal(p.side,item.turn,`${item.id}: only current mover may receive a legal candidate`);
    assert.ok(c.moves().includes(p.candidateMove),`${item.id}: fabricated SAN ${p.candidateMove}`);
   }
   if(p.goal==='improve_knight_outpost'){
    assert.equal(p.evidence.length>=3,true,item.id);
    assert.equal(c.get(p.evidence[0] as Square)?.type,'n',item.id);
    assert.equal(c.get(p.evidence[p.evidence.length-1] as Square)?.type,'p',item.id);
   }
  }
 }
});
test('position evidence and optional tactical reply warnings never modify the actual game',()=>{
 for(const item of bench()){
  const board=new Chess(item.fen),before=board.fen();
  const f=strategicFeatures(before),plans=strategicPlans(before),routes=findKnightRoutes(before);
  assert.equal(f.fen,before,item.id);
  for(const route of routes){
   assert.equal(route.warning,'static_route_not_a_variation',item.id);
   if(route.firstMove){
    assert.equal(route.side,board.turn(),item.id);
    const replyAlerts=immediateReplyAlerts(before,route.firstMove);
    assert.deepEqual(route.firstHopForcingReplies??[],replyAlerts,item.id);
    for(const alert of replyAlerts){
     assert.ok(['check','valuable_capture','promotion'].includes(alert.kind),item.id);
    }
   }else{
    assert.equal(route.firstHopForcingReplies,undefined,item.id);
   }
  }
  assert.equal(board.fen(),before,item.id);
  assert.equal(plans.fen,before,item.id);
 }
});
