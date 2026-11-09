import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {strategicPlans} from '../src/strategic-plans.js';
import {parseRequest} from '../src/model-contract.js';

test('starting position invents no long-range capture plan',()=>{
 const p=strategicPlans(new Chess().fen());
 assert.deepEqual(p.plans,[]);assert.equal(p.engineUsed,false);
});
test('isolated enemy pawn with own rook on the file creates a conditional multi-stage pressure plan',()=>{
 const fen='4k3/8/8/3p4/8/8/8/3RK3 w - - 0 1';
 const report=strategicPlans(fen);
 const p=report.plans.find(p=>p.goal==='pressure_isolated_pawn'&&p.side==='w');
 assert.ok(p);assert.equal(p.target,'d5');
 assert.deepEqual(p.evidence,['d1','d5']);
 assert.equal(p.stages.length,3);assert.equal(p.status,'candidate_not_verified');
 assert.ok(p.possibleDefense.length);
});
test('a passed pawn leads to a preparatory plan, not a promise of promotion',()=>{
 const report=strategicPlans('4k3/8/8/3P4/8/8/8/4K3 w - - 0 1');
 const p=report.plans.find(p=>p.goal==='support_passed_pawn'&&p.side==='w');
 assert.ok(p);assert.equal(p.target,'d5');
 assert.match(p.practicalDifficulty,/beweist keinen Vorteil/);
});
test('no arbitrary piece capture or guaranteed tactical line is asserted',()=>{
 const r=strategicPlans('4k3/8/8/3p4/8/8/8/3RK3 w - - 0 1');
 assert.ok(r.plans.every(p=>p.status==='candidate_not_verified'&&p.prerequisites.length&&p.possibleDefense.length));
 assert.ok(r.plans.length<=4);
});
test('transport ignores attacker-provided human strategic plans and recomputes from FEN',()=>{
 const c=new Chess(),report=parseRequest({nodeId:'n0',fen:c.fen(),question:'Strategie?',legalMoves:c.moves(),context:[],strategicPlans:{plans:[{goal:'capture_queen',target:'e8'}]}});
 assert.deepEqual(report.strategicPlans?.plans,[]);
 assert.equal(report.strategicPlans?.engineUsed,false);
});
