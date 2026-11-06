import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Session} from '../src/session.js';
import {Studio,SimulationAdapter} from '../src/dialogue.js';
import {LearningGame} from '../src/game.js';
import {parsePgn,visibleReviewNodes,reviewLocked,reviewSummary} from '../src/review.js';
import {checkTactics} from '../src/tactics.js';
import {StockfishService} from '../server/stockfish.js';
import {REVIEW_PGN,REPETITION_PGN} from './fixtures/review-game.js';

test('PGN preserves original moves, headers, comments, result and black perspective without starting a game',()=>{
 const parsed=parsePgn(REVIEW_PGN),s=Session.fromPgn(REVIEW_PGN,'auto','wibem'),data=s.snapshot();
 assert.equal(parsed.headers.Result,'1/2-1/2');assert.equal(parsed.moves.length,8);
 assert.ok(parsed.moves[1]!.comment.includes('<img'));
 assert.equal(data.schemaVersion,2);assert.equal(data.orientation,'b');assert.equal(data.review!.human,'b');assert.equal(data.activeNodeId,'n1');
 assert.equal(data.game,undefined);assert.equal(data.review!.pgn,REVIEW_PGN);
 assert.equal(reviewLocked(data),true);assert.deepEqual([...visibleReviewNodes(data)],['n0','n1']);
 assert.throws(()=>s.select('n2'),/verborgen/);assert.throws(()=>s.play('c5'),/Gedanken/);
 assert.throws(()=>new LearningGame(()=>s).start('b',1),/Rückblick/);
});

test('PGN clocks use adjacent same-player timestamps, base and increments without guessing missing time',()=>{
 const p=parsePgn(REVIEW_PGN);
 assert.deepEqual(p.moves.map(m=>m.clock),[595,580,585,575,null,555,570,540]);
 assert.deepEqual(p.moves.map(m=>m.spent),[5,20,10,5,null,20,null,15]);
 const increment=parsePgn('[TimeControl "180+2"]\n\n1. e4 {[%clk 0:03:01]} e5 {[%clk 0:02:59]} 2. Nf3 {[%clk 0:02:57]} *');
 assert.deepEqual(increment.moves.map(m=>m.spent),[1,3,6]);
 const unknown=parsePgn('1. e4 {[%clk 0:09:00]} e5 *');assert.equal(unknown.moves[0]!.spent,null);
 const corrected=parsePgn('[TimeControl "60"]\n\n1. e4 {[%clk 0:02:00]} e5 *');assert.equal(corrected.moves[0]!.spent,null);
});

test('malformed/oversized PGN, illegal moves and ambiguous perspective fail before replacing any session',()=>{
 for(const pgn of ['', '1. e4 e4 *','[FEN "invalid"]\n[SetUp "1"]\n\n1. e4 *','{'+ 'x'.repeat(262144)+'} 1. e4 *'])assert.throws(()=>parsePgn(pgn));
 assert.throws(()=>Session.fromPgn(REVIEW_PGN,'auto','missing'),/Farbe/);
 const studio=new Studio();studio.session.play('d4');const before=studio.session.export();
 assert.throws(()=>{studio.session=Session.fromPgn('1. e5 *','w');});assert.equal(studio.session.export(),before);
});

test('own responses reveal only the current historical move, preserve original and make duplicate-SAN branches independent',()=>{
 const s=Session.fromPgn(REVIEW_PGN,'b');const original=s.snapshot().nodes;
 s.reviewAnswer('idea','Zentrum kontrollieren');assert.equal(reviewLocked(s.snapshot()),false);
 assert.deepEqual([...visibleReviewNodes(s.snapshot())],['n0','n1','n2']);
 s.play('e5'); // Known current move can reuse the original node.
 const branch=s.play('Nf3'); // A guessed future move is an independent analysis branch.
 assert.notEqual(branch,'n3');assert.equal(s.snapshot().nodes.find(n=>n.id===branch)!.san,'Nf3');
 s.label(branch,'Meine Rechenprobe');
 s.annotate({nodeId:branch,kind:'memory',source:'human',text:'Druck auf e5 prüfen',hypothesis:true,openQuestions:['Wie reagiert Schwarz?']});
 s.reviewDecision(3);assert.equal(reviewLocked(s.snapshot()),true);assert.equal(s.snapshot().activeNodeId,'n3');
 assert.deepEqual(s.snapshot().nodes.slice(0,original.length),original);
 s.reviewAnswer('idea','Weiß ich nicht mehr.');s.finishReview();
 assert.ok(reviewSummary(s.snapshot()).some(line=>line.includes('Weiß ich nicht mehr')));
 const restored=Session.import(s.export());assert.equal(restored.export(),s.export());
 assert.equal(restored.snapshot().annotations[0]!.text,'Druck auf e5 prüfen');
 s.orient('w');assert.equal(Session.import(s.export()).snapshot().orientation,'w');
});

test('review serialization rejects forged original PGN, future selections, invalid answers and orientation',()=>{
 const s=Session.fromPgn(REVIEW_PGN,'b');
 const mutations:Array<(d:ReturnType<Session['snapshot']>)=>void>=[
  d=>{d.review!.pgn='1. d4 d5 *';},d=>{d.review!.original[2]='n3';},
  d=>{d.review!.revealed=[0];},d=>{d.review!.decision=2;},d=>{d.activeNodeId='n7';},
  d=>{d.review!.responses={missing:{idea:'x'}};},d=>{d.review!.responses.n1={idea:'x'.repeat(601)};},
  d=>{d.orientation='x' as 'w';},d=>{d.schemaVersion=1;}
 ];
 for(const mutate of mutations){const d=s.snapshot();mutate(d);assert.throws(()=>Session.import(JSON.stringify(d)));}
});

test('threefold is claimable and fivefold automatic in a recorded game, including JSON restoration',()=>{
 const s=Session.fromPgn(REPETITION_PGN,'w');s.guideReview(false);
 s.select('n8');assert.equal(s.status().repetitionCount,3);assert.equal(s.status().claimableDraw,true);
 assert.equal(s.status().gameOver,false);assert.equal(s.status().draw,false);
 s.select('n16');assert.equal(s.status().repetitionCount,5);assert.equal(s.status().fivefold,true);assert.equal(s.status().automaticDraw,true);assert.equal(s.status().gameOver,true);
 const restored=Session.import(s.export());assert.equal(restored.status().repetitionCount,5);
 assert.equal(new Chess(restored.snapshot().nodes.at(-1)!.fen).isThreefoldRepetition(),false); // FEN alone loses this fact.
});

test('repetition distinguishes castling rights and uses the selected branch rather than future original moves',()=>{
 const pgn='[SetUp "1"]\n[FEN "4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1"]\n\n1. Rh2 Ke7 2. Rh1 Ke8 3. Rh2 Ke7 4. Rh1 Ke8 5. Rh2 Ke7 6. Rh1 Ke8 *';
 const s=Session.fromPgn(pgn,'w');s.guideReview(false);
 s.select('n4');assert.equal(s.status().repetitionCount,1);
 s.select('n8');assert.equal(s.status().repetitionCount,2);
 s.select('n12');assert.equal(s.status().repetitionCount,3);
 s.reviewDecision(0);assert.equal(s.status().repetitionCount,1);
});

test('concealed review blocks all model/engine adapters; revealed dialogue sends only known history and learner evidence',async()=>{
 const studio=new Studio(Session.fromPgn(REVIEW_PGN,'b'));let calls=0;
 await assert.rejects(studio.ask('Warum?',{respond:async()=>{calls++;return {};}}),/Gedanken/);
 await assert.rejects(checkTactics(studio.session,()=>studio.session,{check:async()=>{calls++;return {}; }},null),/Gedanken/);
 assert.equal(calls,0);
 studio.session.reviewAnswer('idea','Ich wollte das Zentrum halten');
 await studio.ask('Welche Antworten sind plausibel?',{respond:async request=>{
  calls++;assert.deepEqual(request.history!.moves,['e4']);
  assert.ok(request.context!.some(text=>text.includes('Zentrum halten')));
  assert.ok(!JSON.stringify({context:request.context,history:request.history,turns:request.turns}).includes('Nc6'));assert.ok(!JSON.stringify(request).includes('img src'));
  return new SimulationAdapter().respond(request);
 }});assert.equal(calls,1);
 studio.session.reviewDecision(3);await assert.rejects(studio.ask('Noch eine Frage',new SimulationAdapter()),/Gedanken/);
});

test('optional real Stockfish check preserves verified full history and rejects repetition/mismatched paths',async()=>{
 const s=Session.fromPgn(REVIEW_PGN,'b');s.revealReview();const service=new StockfishService();
 await checkTactics(s,()=>s,{check:(fen,candidate,history)=>service.check({fen,candidate,history})},null);
 const report=s.snapshot().annotations[0]!.engine!;assert.deepEqual(report.history!.moves,['e4']);
 assert.equal(Session.import(s.export()).snapshot().annotations[0]!.engine!.history!.moves[0],'e4');
 await assert.rejects(service.check({fen:report.fen,candidate:null,history:{rootFen:report.history!.rootFen,moves:['d4']}}),/Zuggeschichte/);
 const repeated=Session.fromPgn(REPETITION_PGN,'w');repeated.reviewDecision(8);repeated.revealReview();let calls=0;
 await assert.rejects(checkTactics(repeated,()=>repeated,{check:async()=>{calls++;return {}; }},null),/dreimal/);assert.equal(calls,0);
});

test('recorded fifty-move claim and automatic seventy-five-move draw use historical halfmove clocks',()=>{
 for(const halfmoves of [99,149]){
  const pgn=`[SetUp "1"]\n[FEN "8/8/8/8/8/4k3/6r1/4K3 w - - ${halfmoves} 80"]\n\n80. Kd1 *`;
  const s=Session.fromPgn(pgn,'w');s.guideReview(false);s.select('n1');
  assert.equal(s.status().claimableDraw,true);assert.equal(s.status().automaticDraw,halfmoves===149);
 }
});

test('returning from explicit free engine play to guided review pauses and invalidates pending replies',async()=>{
 const s=Session.fromPgn(REVIEW_PGN,'b'),g=new LearningGame(()=>s);
 s.guideReview(false);g.start('w',1); // Current position is Black to move, so engine may reply.
 let finish!:(value:unknown)=>void;
 const pending=g.reply({move:()=>new Promise(resolve=>{finish=resolve;})});
 s.guideReview(true);finish({san:'e5',level:1,engine:'Stockfish fixture'});
 assert.equal(await pending,'discarded');assert.equal(g.needsEngine(),false);
 assert.equal(s.snapshot().game!.paused,true);assert.equal(s.snapshot().activeNodeId,'n1');
 const data=s.snapshot();data.game!.paused=false;
 assert.throws(()=>Session.import(JSON.stringify(data)),/aktive Enginepartie/);
});


test('legacy sessions stay schema 1 and imported reviews use a distinct schema that old apps reject',()=>{
 const legacy=new Session();legacy.play('e4');assert.equal(JSON.parse(legacy.export()).schemaVersion,1);
 assert.equal(Session.import(legacy.export()).snapshot().schemaVersion,1);
 const review=Session.fromPgn(REVIEW_PGN,'b');const saved=JSON.parse(review.export());
 assert.equal(saved.schemaVersion,2);delete saved.orientation;
 assert.equal(Session.import(JSON.stringify(saved)).snapshot().orientation,'b');
 delete saved.review;assert.throws(()=>Session.import(JSON.stringify(saved)));
});
