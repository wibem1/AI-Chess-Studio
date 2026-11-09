import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {strategicPlans} from '../src/strategic-plans.js';
import {parseRequest} from '../src/model-contract.js';

test('initial position produces no fabricated strategic conquest or pawn lever',()=>{
 const r=strategicPlans(new Chess().fen());
 assert.deepEqual(r.plans,[]);
 assert.equal(r.engineUsed,false);
});
test('a clear rook file and isolated enemy pawn create a conditional, evidenced plan',()=>{
 const r=strategicPlans('4k3/8/8/3p4/8/8/8/3RK3 w - - 0 1');
 const p=r.plans.find(p=>p.goal==='pressure_isolated_pawn'&&p.side==='w');
 assert.ok(p);
 assert.equal(p.target,'d5');
 assert.deepEqual(p.evidence,['d1','d5']);
 assert.equal(p.stages.length,3);
 assert.equal(p.status,'candidate_not_verified');
 assert.ok(p.possibleDefense.length);
 assert.ok(p.supportingObservations!.length>=2);
});
test('a blocker interrupts rook pressure and must suppress the misleading plan',()=>{
 const r=strategicPlans('4k3/8/8/3p4/8/3N4/8/3RK3 w - - 0 1');
 assert.equal(r.plans.some(p=>p.goal==='pressure_isolated_pawn'&&p.side==='w'),false);
});
test('passed pawn blocked by an enemy piece is not sold as a won pawn',()=>{
 const r=strategicPlans('4k3/3r4/8/3P4/8/8/8/4K3 w - - 0 1');
 const p=r.plans.find(p=>p.goal==='support_passed_pawn'&&p.side==='w');
 assert.ok(p);
 assert.equal(p.target,'d5');
 assert.ok(p.prerequisites.some(t=>t.includes('d6')===false)||p.stages.length===3);
 assert.ok(p.practicalDifficulty.includes('beweist allein'));
});
test('a pawn-break proposal contains only a legal, unverified first move',()=>{
 const fen='4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1',r=strategicPlans(fen);
 const p=r.plans.find(p=>p.goal==='prepare_pawn_break'&&p.side==='w');
 assert.ok(p);
 assert.equal(p.candidateMove,'e4');
 assert.ok(new Chess(fen).moves().includes(p.candidateMove!));
 assert.equal(p.status,'candidate_not_verified');
 assert.match(p.prerequisites.join(' '),/nicht.*taktische Haltbarkeit/);
});
test('a plan remains symmetric and bounded for both players',()=>{
 const fen='4k2r/8/8/3p4/8/8/8/3RK3 w - - 0 1';
 const report=strategicPlans(fen);
 assert.ok(report.plans.length<=4);
 assert.ok(report.plans.every(p=>p.evidence.length>0&&p.possibleDefense.length>0));
});
test('model transport computes plans anew instead of trusting the sender',()=>{
 const c=new Chess();
 const r=parseRequest({nodeId:'n0',fen:c.fen(),question:'Plan?',legalMoves:c.moves(),context:[],strategicPlans:{plans:[{goal:'win_at_once'}]}});
 assert.deepEqual(r.strategicPlans?.plans,[]);
 assert.equal(r.strategicPlans?.engineUsed,false);
});
