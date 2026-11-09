import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {findKnightRoutes} from '../src/strategic-knight-routes.js';
import {strategicPlans} from '../src/strategic-plans.js';

const outpost='4k3/8/8/8/2P5/8/8/1N2K3 w - - 0 1';

test('knight route leads from b1 via c3 to pawn-supported d5, first hop legal',()=>{
 const routes=findKnightRoutes(outpost),r=routes.find(x=>x.side==='w'&&x.to==='d5');
 assert.ok(r);assert.deepEqual(r.path,['b1','c3','d5']);
 assert.equal(r.supportingPawn,'c4');
 assert.equal(r.hops,2);assert.equal(r.firstMove,'Nc3');
 assert.ok(new Chess(outpost).moves().includes(r.firstMove!));
 assert.equal(r.warning,'static_route_not_a_variation');
});
test('enemy pawn pressure on outpost disqualifies speculative knight maneuver',()=>{
 const blocked='4k3/8/2p5/8/2P5/8/8/1N2K3 w - - 0 1';
 assert.equal(findKnightRoutes(blocked).some(r=>r.side==='w'),false);
});
test('occupied target and intermediate squares cannot form a knight route',()=>{
 const occupied='4k3/8/8/8/2P5/2B5/8/1N2K3 w - - 0 1';
 assert.equal(findKnightRoutes(occupied).some(r=>r.path.join(',')==='b1,c3,d5'),false);
});
test('starting position must not invent long-range knight outpost plans',()=>{
 const fen=new Chess().fen();
 assert.deepEqual(findKnightRoutes(fen),[]);
 assert.equal(strategicPlans(fen).plans.some(p=>p.goal==='improve_knight_outpost'),false);
});
test('knight route is included in human plan as conditional stages, not guaranteed variation',()=>{
 const p=strategicPlans(outpost).plans.find(p=>p.goal==='improve_knight_outpost'&&p.side==='w');
 assert.ok(p);assert.equal(p.target,'d5');
 assert.ok(p.supportingObservations?.some(x=>x.includes('c4')));
 assert.ok(p.prerequisites.some(x=>x.includes('nicht')&&x.includes('geprüft')));
 assert.equal(p.status,'candidate_not_verified');
});
test('when opponent is to move the hypothetical knight route carries no claimed legal candidate SAN',()=>{
 const fen=outpost.replace(' w - - ',' b - - ');
 const r=findKnightRoutes(fen).find(x=>x.side==='w');
 assert.ok(r);assert.equal(r.firstMove,undefined);
});

test('enemy rook control of the proposed outpost invalidates the knight route',()=>{
 const fen='3rk3/8/8/8/2P5/8/8/1N2K3 w - - 0 1';
 assert.equal(findKnightRoutes(fen).some(r=>r.side==='w'&&r.to==='d5'),false);
});
test('enemy bishop controls c3 as a transit square, so b1-c3-d5 is rejected',()=>{
 const fen='4k3/8/5b2/8/2P5/8/8/1N2K3 w - - 0 1';
 assert.equal(findKnightRoutes(fen).some(r=>r.side==='w'&&r.path.join(',')==='b1,c3,d5'),false);
});

test('a contested transit square with two independent defenders remains conditional, not automatically discarded',()=>{
 const fen='4k3/8/p4b2/8/2P5/8/3P4/1NR1K3 w - - 0 1';
 const route=findKnightRoutes(fen).find(r=>r.side==='w'&&r.path.join(',')==='b1,c3,d5');
 assert.ok(route);
 assert.ok(route.contestedSquares.includes('c3'));
 assert.equal(route.warning,'static_route_not_a_variation');
 const plan=strategicPlans(fen).plans.find(p=>p.goal==='improve_knight_outpost'&&p.side==='w');
 assert.ok(plan);
 assert.ok(plan.prerequisites.some(p=>p.includes('Zählung allein')));
});
test('an equally contested transit square with only one independent defender is rejected',()=>{
 const fen='4k3/8/p4b2/8/2P5/8/8/1NR1K3 w - - 0 1';
 assert.equal(findKnightRoutes(fen).some(r=>r.path.join(',')==='b1,c3,d5'),false);
});
test('pawn attacks remain a veto for a long-term knight outpost despite support',()=>{
 const fen='4k3/8/2p5/8/2P5/8/3P4/1NR1K3 w - - 0 1';
 assert.equal(findKnightRoutes(fen).some(r=>r.side==='w'&&r.to==='d5'),false);
});

test('the first legal knight hop is screened against immediate captures and recaptures',()=>{
 const fen='4k3/8/p4b2/8/2P5/8/3P4/1NR1K3 w - - 0 1';
 const route=findKnightRoutes(fen).find(r=>r.side==='w'&&r.path.join(',')==='b1,c3,d5');
 assert.ok(route);
 assert.equal(route.firstMove,'Nc3');
 assert.ok(route.firstHopCaptureReplies?.some(move=>move.startsWith('Bxc3')));
 assert.equal(route.warning,'static_route_not_a_variation');
});
test('no first-hop capture line is invented when the side to move is the opponent',()=>{
 const fen='4k3/8/p4b2/8/2P5/8/3P4/1NR1K3 b - - 0 1';
 const route=findKnightRoutes(fen).find(r=>r.side==='w');
 assert.ok(route);
 assert.equal(route.firstMove,undefined);
 assert.equal(route.firstHopCaptureReplies,undefined);
});
