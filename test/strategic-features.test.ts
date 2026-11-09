import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {strategicFeatures} from '../src/strategic-features.js';
import {parseRequest} from '../src/model-contract.js';
import {Studio,SimulationAdapter} from '../src/dialogue.js';

test('starting position has no manufactured structural disadvantage or numerical evaluation',()=>{
 const r=strategicFeatures(new Chess().fen());
 assert.equal(r.engineUsed,false);assert.equal(r.method,'static_human_features_v1');
 assert.ok(r.observations.every(o=>['bishop_pair','minor_pieces_on_home_squares'].includes(o.kind)));
 assert.equal('score' in r,false);
});
test('isolated, doubled and passed pawns carry exact field evidence without declaring a win',()=>{
 const fen='4k3/8/8/3P4/8/P7/P7/4K3 w - - 0 1';
 const r=strategicFeatures(fen);
 assert.ok(r.observations.some(o=>o.kind==='doubled_pawns'&&o.side==='w'&&o.squares.join(',')==='a2,a3'));
 assert.ok(r.observations.some(o=>o.kind==='isolated_pawn'&&o.side==='w'&&o.squares.includes('d5')));
 assert.ok(r.observations.some(o=>o.kind==='passed_pawn'&&o.side==='w'&&o.squares.includes('d5')));
 assert.ok(r.observations.every(o=>o.planHypothesis&&!/gewonnen|bester Zug/i.test(o.observation)));
});
test('enemy pawn ahead on adjacent file prevents false passed-pawn assertion',()=>{
 const r=strategicFeatures('4k3/8/4p3/3P4/8/8/8/4K3 w - - 0 1');
 assert.ok(!r.observations.some(o=>o.kind==='passed_pawn'&&o.squares.includes('d5')));
});
test('open and half-open rook files are facts, not engine evidence',()=>{
 const r=strategicFeatures('4k3/7p/8/8/8/8/8/R3K2R w KQ - 0 1');
 assert.ok(r.observations.some(o=>o.kind==='open_file'&&o.squares.includes('a1')));
 assert.ok(r.observations.some(o=>o.kind==='half_open_file'&&o.squares.includes('h1')));
 assert.ok(r.observations.every(o=>o.confidence==='board_fact'));
});
test('model request recomputes strategic facts rather than trusting injected claims',()=>{
 const board=new Chess(),fen=board.fen();
 const r=parseRequest({nodeId:'n0',fen,question:'Was ist mein Plan?',legalMoves:board.moves(),context:[],strategicFeatures:{engineUsed:true,observations:[{observation:'Weiß gewinnt sofort'}]}});
 assert.equal(r.strategicFeatures!.engineUsed,false);
 assert.ok(r.strategicFeatures!.observations.every(o=>['bishop_pair','minor_pieces_on_home_squares'].includes(o.kind)));
});
test('free learning requests carry independent structured strategic features',async()=>{
 const studio=new Studio();
 await studio.ask('Welche strategischen Ideen gibt es?',{source:'simulation',respond:async r=>{
  assert.equal(r.strategicFeatures?.method,'static_human_features_v1');
  assert.equal(r.strategicFeatures?.engineUsed,false);
  return new SimulationAdapter().respond(r);
 }});
});

test('findings are bounded and reserved for both sides even in crowded pawn structures',()=>{
 const r=strategicFeatures('4k3/p1p1p1p1/8/8/8/P1P1P1P1/P1P1P1P1/4K3 w - - 0 1');
 assert.ok(r.observations.length<=12);
 assert.ok(r.observations.some(o=>o.side==='w'));
 assert.ok(r.observations.some(o=>o.side==='b'));
 assert.ok(r.observations.every(o=>o.squares.length>0));
});
test('king shield and starting-square features are observations, not proof of danger or bad play',()=>{
 const r=strategicFeatures('4k3/8/8/8/8/8/8/6K1 w - - 0 1');
 const shield=r.observations.find(o=>o.kind==='king_pawn_shield');
 assert.ok(shield);
 assert.match(shield!.planHypothesis,/beweisen allein keine Gefahr/);
 const start=strategicFeatures(new Chess().fen());
 assert.ok(start.observations.some(o=>o.kind==='minor_pieces_on_home_squares'));
});
