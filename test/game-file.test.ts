import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importGameFile} from '../src/game-file.js';
import {Session} from '../src/session.js';
import {parsePgn,visibleReviewNodes,reviewLocked} from '../src/review.js';
import {REVIEW_PGN} from './fixtures/review-game.js';
test('foreign PGN opens fully browsable without assigning a player and survives JSON saving',()=>{
 const imported=importGameFile('\uFEFF'+REVIEW_PGN,'foreign.pgn','b'),s=imported.session,d=s.snapshot();
 assert.equal(imported.title,'Ada – wibem');assert.equal(d.activeNodeId,'n0');assert.equal(d.orientation,'b');assert.equal(d.review!.browsing,true);assert.equal(d.review!.guiding,false);assert.equal(d.game,undefined);
 assert.equal(visibleReviewNodes(d).size,9);assert.equal(reviewLocked(d),false);s.select('n8');assert.throws(()=>s.guideReview(true));
 const round=importGameFile(s.export(),'saved.json').session.snapshot();assert.equal(round.review!.pgn,REVIEW_PGN);assert.equal(round.review!.browsing,true);assert.equal(round.activeNodeId,'n8');assert.ok(parsePgn(round.review!.pgn).moves[1]!.comment.includes('<img'));
});
test('one-ply foreign games support either orientation, while invalid files are rejected',()=>{
 assert.equal(importGameFile('1. e4 *','other.pgn','b').session.snapshot().review!.decision,0);
 for(const [content,name] of [['not chess','bad.pgn'],['1. e4 e5 2. Ke7','bad.pgn'],['{}','bad.json'],['1. e4 *','board.png']])assert.throws(()=>importGameFile(content!,name!));
 const d=importGameFile('1. e4 *','other.pgn').session.snapshot();d.review!.guiding=true;assert.throws(()=>Session.import(JSON.stringify(d)));
});

test('foreign PGN gives chat the whole recorded game without claiming a user side; analysis remains saved',async()=>{
 const {Studio,SimulationAdapter}=await import('../src/dialogue.js');
 const s=importGameFile(REVIEW_PGN,'foreign.pgn').session,studio=new Studio(s),moves=parsePgn(REVIEW_PGN).moves.map(m=>m.san);
 await studio.ask('Was fällt dir auf?',{respond:async request=>{assert.deepEqual(request.history!.moves,[]);assert.deepEqual(request.gameHistory!.moves,moves);assert.equal(request.gameHistory!.human,null);assert.ok(request.context!.some(t=>t.includes('Keine Seite')));return new SimulationAdapter().respond(request);}},'chat');
 await studio.ask('Zeige die Schlüsselstellungen des Spiels',{respond:async request=>{assert.equal(request.topic,'review');assert.deepEqual(request.history!.moves,moves);return new SimulationAdapter().respond(request);}},'chat');
 const saved=Session.import(s.export()).snapshot();assert.equal(saved.review!.browsing,true);assert.equal(saved.annotations.length,4);
});


test('iPad text-PGN accepts Unicode line separators and common file extensions',()=>{
 const pgn='[Event "Test"]\u2028[White "EgorSN"]\u2028[Black "wibem"]\u2028\u20281. e4 { [%clk 0:10:00] } e5 { [%clk 0:10:00] } 2. d4 exd4 1/2-1/2';
 for(const name of ['partie.pgn','partie.txt','partie.dat']){
  const imported=importGameFile(pgn,name,'b');
  assert.equal(imported.format,'pgn');
  assert.equal(imported.session.snapshot().orientation,'b');
  assert.equal(parsePgn(imported.session.snapshot().review!.pgn).moves.length,4);
 }
});
test('tolerant PGN parsing still rejects unrelated text and illegal moves',()=>{
 for(const invalid of ['This is not a chess game.','1. e4 e5 2. Ke7','[Event "Test"]\n\n1. e4 e5 2. Qh5 Nc6 3. Qxe5+??'])assert.throws(()=>importGameFile(invalid,'partie.txt'));
});
