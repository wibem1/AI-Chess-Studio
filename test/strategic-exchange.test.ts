import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localExchange} from '../src/strategic-exchange.js';

test('unprotected knight can be captured for a real 320 material loss',()=>{
 const result=localExchange('4k3/8/5b2/8/8/2N5/8/4K3 b - - 0 1','c3','w');
 assert.equal(result.materialSwing,-320);
 assert.ok(result.line[0]?.startsWith('Bxc3'));
});
test('legal recapture is not enough: bishop trades and rook recaptures the defender',()=>{
 const result=localExchange('2r1k3/8/5b2/8/8/2N5/3B4/4K3 b - - 0 1','c3','w');
 assert.equal(result.materialSwing,-320);
 // The defending player rationally declines Bxc3 when the rook would
 // then recapture; a legal recapture is NOT a profitable forced sequence.
 assert.deepEqual(result.line.length,1);
 assert.ok(result.line[0]?.startsWith('Bxc3'));
});
test('a pinned rook is not counted as a legal recapturer',()=>{
 const result=localExchange('4r1k1/8/8/5b2/8/8/2N1R3/4K3 b - - 0 1','c2','w');
 assert.equal(result.materialSwing,-320);
 assert.equal(result.line.length,1);
});
test('without capture the material exchange result is neutral, not a tactical recommendation',()=>{
 const result=localExchange('4k3/8/8/8/8/2N5/8/4K3 b - - 0 1','c3','w');
 assert.equal(result.materialSwing,0);
 assert.deepEqual(result.line,[]);
 assert.equal(result.status,'limited_legal_captures_only');
});
