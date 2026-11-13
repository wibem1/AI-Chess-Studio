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
 for(const invalid of ['This is not a chess game.','1. e4 e5 2. Ke7'])assert.throws(()=>importGameFile(invalid,'partie.txt'));
});

test('real EgorSN – wibem Lichess reference preserves 137 plies, clocks, comments and raw PGN',async()=>{
 const {readFileSync}=await import('node:fs');
 const pgn=readFileSync('test/fixtures/lichess-1Vh80QL2.pgn','utf8');
 const game=parsePgn(pgn);
 assert.equal(game.headers.Site,'https://lichess.org/game/1Vh80QL2');
 assert.equal(game.headers.Date,'2026.11.06');assert.equal(game.headers.Result,'1/2-1/2');
 assert.equal(game.moves.length,137);assert.equal(game.moves[80]!.san,'c8=Q');
 assert.equal(game.moves[5]!.clock,592);assert.equal(game.moves[5]!.spent,7);
 assert.match(game.moves[5]!.comment,/Inaccuracy/);assert.match(game.moves[4]!.comment,/C21 Center Game/);
 assert.equal(game.moves.at(-1)!.after,'8/8/8/8/6k1/6np/7K/8 b - - 17 69');
 assert.equal(game.moves.at(-1)!.clock,237);assert.match(game.moves.at(-1)!.comment,/The game is a draw/);
 for(const name of ['reference.pgn','reference.pgn.txt','reference.dat']){
  const imported=importGameFile(pgn,name,'b');assert.equal(imported.title,'EgorSN – wibem');
  const saved=Session.import(imported.session.export()).snapshot();
  assert.equal(saved.review!.pgn,pgn);assert.equal(saved.nodes.length,138);
  assert.deepEqual(saved.nodes.slice(1).map(n=>n.san),game.moves.map(m=>m.san));
 }
 assert.throws(()=>parsePgn('Analysiere das folgende Schachspiel.\n'+pgn));
});

test('PGN normalization handles separators, adjacent comments and nested variations without changing raw data',()=>{
 const pgn='[Event "Literal } { text"]\n\n1. e4 $1 {first} {[%clk 0:10:00]} (1. d4 {a} {b} d5 (1... Nf6)) e5 2. Nf3 Nc6 *';
 for(const newline of ['\n','\r\n','\r','\u2028','\u2029','\u0085']){
  const raw=pgn.replaceAll('\n',newline),s=importGameFile(raw,'file.pgn').session;
  assert.equal(s.snapshot().review!.pgn,raw);
  const g=parsePgn(raw);assert.deepEqual(g.moves.map(m=>m.san),['e4','e5','Nf3','Nc6']);
  assert.equal(g.headers.Event,'Literal } { text');assert.equal(g.moves[0]!.clock,600);
  assert.match(g.moves[0]!.comment,/first/);
 }
 assert.equal(importGameFile('{root comment} 1. e4 *','file.txt').format,'pgn');
 assert.equal(parsePgn('1. e2-e4 e7-e5 *').moves[0]!.san,'e4');
 // Qxe5+ is legal here; a blunder annotation never makes a move illegal.
 assert.equal(parsePgn('1. e4 e5 2. Qh5 Nc6 3. Qxe5+??').moves.length,5);
});

test('PGN compatibility rejects malformed input, extra games and size overflow',()=>{
 for(const pgn of ['1. e4 {unfinished','1. e4 (1. d4 d5','1. e4 *\n1. d4 *','[Event "A"]\n\n1. e4 *\n[Event "B"]\n\n1. d4 *','1. e4 e5 2. Ke7','{'+ 'x'.repeat(262144)+'} 1. e4 *'])assert.throws(()=>parsePgn(pgn));
 const original=new Session();original.annotate({nodeId:'n0',source:'human',kind:'memory',hypothesis:false,text:'Unicode\u2028bleibt',openQuestions:[]});
 assert.equal(importGameFile(original.export(),'file.json').session.snapshot().annotations[0]!.text,'Unicode\u2028bleibt');
});

test('rejected real review reports each illegal alternative with its historical move',async()=>{
 const {readFileSync}=await import('node:fs'),{validateGameReview}=await import('../src/game-review.js');
 const game=parsePgn(readFileSync('test/fixtures/lichess-1Vh80QL2.pgn','utf8'));
 const moments=[[18,'Qxe5+','Qxe7+'],[56,'Nxg3','Nf5'],[85,'Rc7+','Rf7'],[136,'Ng3+','Nh5']].map(([ply,played,alternative])=>({ply,played,alternative,explanation:'Erklärung',reason:'Begründung'}));
 assert.throws(()=>validateGameReview({summary:'Überblick',lesson:'Lernfolgerung',moments},{rootFen:game.rootFen,moves:game.moves.map(m=>m.san),truncated:false}),error=>{assert.ok(error instanceof Error);for(const label of ['9… Dxe5+','28… Sxg3','43. Tc7+','68… Sg3+'])assert.ok(error.message.includes(label));return true;});
});

test('diagnosis retains the precise validation reason without leaking credentials',async()=>{
 const {ModelDiagnostics}=await import('../src/model-diagnostics.js');const d=new ModelDiagnostics();
 d.start({}, {},'private-fixture-key').finish('failed','review_format',200,'Analyse verworfen: Bei 1. e4 ist Qh8 nicht legal. private-fixture-key');
 const report=JSON.stringify(d.export());assert.match(report,/Bei 1. e4/);assert.match(report,/Qh8/);assert.ok(!report.includes('private-fixture-key'));
});
