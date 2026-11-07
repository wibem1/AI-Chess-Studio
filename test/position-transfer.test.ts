import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';
import {LearningGame} from '../src/game.js';
import {playablePosition} from '../src/position-transfer.js';
import {variationLine} from '../web/learning-replay.js';
const options={human:'w' as const,level:1,engine:'browser' as const,opponent:'stockfish' as const};
test('an off-game study branch retains backward and forward navigation through its own tip',()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',1,'browser');g.play('e4');g.pause();s.play('e5');g.analyse('n0');s.play('d4');s.play('d5');const tip=s.snapshot().activeNodeId;s.select('n3');
 assert.deepEqual(variationLine(s.snapshot(),tip).map(n=>n.san),[null,'d4','d5']);s.select('n0');assert.equal(variationLine(s.snapshot(),tip).at(-1)!.id,tip);
});
test('playing copy starts at selected study node and preserves source, history, annotations and orientation',()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',1,'browser');g.play('e4');g.pause();s.play('e5');g.analyse('n0');s.play('d4');s.orient('b');const before=s.export();const next=playablePosition(s,options);
 assert.equal(s.export(),before);assert.equal(next.snapshot().game!.cursor,'n3');assert.equal(next.snapshot().game!.start,'n3');assert.equal(next.snapshot().orientation,'b');assert.deepEqual(next.snapshot().nodes,s.snapshot().nodes);
 const play=new LearningGame(()=>next);assert.equal(play.needsEngine(),true);assert.equal(Session.import(next.export()).snapshot().game!.cursor,'n3');
});
test('a teaching position becomes an independent playable root without overwriting the original session',()=>{
 const s=new Session();s.play('e4');const before=s.export(),fen='4k3/8/8/8/8/8/4P3/4K3 w - - 0 1';const next=playablePosition(s,options,fen);
 assert.equal(s.export(),before);assert.equal(next.snapshot().nodes.length,1);assert.equal(next.snapshot().nodes[0]!.fen,fen);assert.equal(next.snapshot().game!.cursor,'n0');
 assert.throws(()=>playablePosition(s,options,'broken'));assert.equal(s.export(),before);
});
test('a guided review position can be played in a free copy while the source remains guided',()=>{
 const s=Session.fromPgn('[White "A"]\n[Black "B"]\n\n1. e4 e5 *','w'),before=s.export();
 const next=playablePosition(s,options);assert.equal(next.snapshot().review!.guiding,false);assert.equal(next.snapshot().game!.cursor,s.snapshot().activeNodeId);assert.equal(s.export(),before);assert.equal(s.snapshot().review!.guiding,true);
});
