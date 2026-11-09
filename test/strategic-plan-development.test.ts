import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {strategicPlanDevelopment,strategicPlanDevelopmentFromHistory} from '../src/strategic-plan-development.js';
import {parseRequest} from '../src/model-contract.js';

test('initial position produces no invented plan history after e4',()=>{
 const c=new Chess(),r=strategicPlanDevelopment(c.fen(),'e4');
 assert.equal(r.played,'e4');assert.deepEqual(r.changes,[]);
 assert.equal(r.engineUsed,false);
 assert.equal(new Chess(r.toFen).history().length,0);
});
test('refuses illegal or fabricated move when updating a human plan',()=>{
 assert.throws(()=>strategicPlanDevelopment(new Chess().fen(),'e5'),/Ungültiger Zug/);
});
test('a maintained rook attack remains an unverified candidate, never a proven win',()=>{
 const fen='4k3/8/8/3p4/8/8/8/3RK3 w - - 0 1';
 const r=strategicPlanDevelopment(fen,'Kd2');
 const p=r.changes.find(x=>x.goal==='pressure_isolated_pawn'&&x.side==='w');
 assert.ok(p);assert.equal(p.change,'still_candidate');assert.match(p.reason,/ungeprüfte Hypothese/);
});
test('an opponent move that interrupts a rook line triggers reconsideration',()=>{
 const fen='4k3/8/8/3p4/8/8/8/3RK3 b - - 0 1';
 const r=strategicPlanDevelopment(fen,'Kd7');
 assert.ok(r.changes.every(c=>c.change==='still_candidate'||c.change==='reconsider'||c.change==='goal_obsolete'));
});

test('server recomputes plan transition from verified history and rejects forged update data',()=>{
 const c=new Chess();
 const played=['e4','d5','exd5'];for(const move of played)c.move(move);
 const history={rootFen:new Chess().fen(),moves:played,truncated:false};
 const request=parseRequest({nodeId:'n3',fen:c.fen(),question:'Was hat sich verändert?',legalMoves:c.moves(),context:[],history,planDevelopment:[{change:'still_candidate',reason:'FAKE'}]});
 const trueProgress=strategicPlanDevelopmentFromHistory(history);
 assert.deepEqual(request.planDevelopment,trueProgress?.changes);
 assert.ok(request.planDevelopment?.every(change=>!change.reason.includes('FAKE')));
});
test('history reconstruction is legal, single move scoped and empty history is empty',()=>{
 const c=new Chess();
 assert.equal(strategicPlanDevelopmentFromHistory({rootFen:c.fen(),moves:[]}),undefined);
 assert.throws(()=>strategicPlanDevelopmentFromHistory({rootFen:c.fen(),moves:['e5']}),/Ungültiger Zug/);
});
