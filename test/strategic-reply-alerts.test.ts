import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {immediateReplyAlerts} from '../src/strategic-reply-alerts.js';
import {findKnightRoutes} from '../src/strategic-knight-routes.js';
import {strategicPlans} from '../src/strategic-plans.js';

const checkFen='4k2r/8/8/8/2P5/8/8/1N2K3 w - - 0 1';
test('quiet knight move exposes legal opponent rook check on another square',()=>{
 const before=new Chess(checkFen).fen();
 const warnings=immediateReplyAlerts(checkFen,'Nc3');
 assert.ok(warnings.some(w=>w.san==='Rh1+'&&w.kind==='check'));
 assert.equal(new Chess(checkFen).fen(),before);
});
test('possible check on another square is an alert, not automatically a plan refutation',()=>{
 const route=findKnightRoutes(checkFen).find(r=>r.side==='w'&&r.path.join(',')==='b1,c3,d5');
 assert.ok(route);
 assert.ok(route.firstHopForcingReplies?.some(r=>r.san==='Rh1+'));
 const plan=strategicPlans(checkFen).plans.find(p=>p.goal==='improve_knight_outpost'&&p.side==='w');
 assert.ok(plan);
 assert.ok(plan.supportingObservations?.some(v=>v.includes('Rh1+')));
});
test('major-piece capture by opponent after knight move is detected beyond target square',()=>{
 const fen='4k2r/8/8/8/2P5/8/8/1N2K2R w - - 0 1';
 const alerts=immediateReplyAlerts(fen,'Nc3');
 assert.ok(alerts.some(a=>a.san.startsWith('Rxh1')&&(a.kind==='check'||a.kind==='valuable_capture')));
});
test('illegal candidate is refused rather than providing invented forcing replies',()=>{
 assert.throws(()=>immediateReplyAlerts(checkFen,'Nf3'),/legal/);
});
test('ordinary starting move does not invent immediate checks or major captures',()=>{
 const fen=new Chess().fen();
 assert.deepEqual(immediateReplyAlerts(fen,'Nf3'),[]);
});
