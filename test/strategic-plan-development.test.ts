import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {strategicPlanDevelopment} from '../src/strategic-plan-development.js';

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
