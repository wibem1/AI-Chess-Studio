import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Session} from '../src/session.js';
import {scanFullGame,makeFullGameAnalysis,fullGameSummary,fullGameContext,asksAboutGameQuality} from '../src/full-game-analysis.js';
import {TACTICAL_LIMITS,type TacticalAdapter} from '../src/tactics.js';

test('full game analysis computes separate, explicitly approximate White and Black error counts',()=>{
 const game=makeFullGameAnalysis(new Chess().fen(),['f3','e5','g4','Qh4#'],[0,-180,-160,-570,-1500],['n1','n2','n3','n4']);
 assert.deepEqual(game.records.map(r=>r.grade),['Fehler','gut','grober Fehler','gut']);
 assert.equal(game.players.white.mistakes,1);assert.equal(game.players.white.blunders,1);
 assert.equal(game.players.black.blunders,0);
 assert.match(fullGameSummary(game),/g4: grober Fehler/);
 assert.doesNotMatch(fullGameSummary(game),/Genauigkeit: [0-9]+%/);
});
test('real history is checked for all nonterminal Stockfish positions, full analysis survives JSON reload',async()=>{
 const root=new Chess().fen(),moves=['f3','e5','g4','Qh4#'];let calls=0;
 const adapter:TacticalAdapter={async check(fen,candidate,history){
  assert.equal(candidate,null);assert.deepEqual(history,{rootFen:root,moves:moves.slice(0,calls)});
  const chess=new Chess(fen);assert.equal(chess.isGameOver(),false);
  const line=[chess.moves()[0]!];const score=[0,-180,-160,-570][calls]!;
  calls++;return {fen,engine:'Stockfish 19 Lite',depth:12,nodes:20000,elapsedMs:123,
   score:{unit:'cp',value:score,perspective:'white'},line,candidate:null,limits:TACTICAL_LIMITS,history};
 }};
 const s=new Session();for(const move of moves)s.play(move);
 const report=await scanFullGame(root,moves,adapter,()=>{},undefined,['n1','n2','n3','n4']);
 assert.equal(calls,4,'final checkmate must not be passed to the Stockfish engine');
 s.storeFullGameAnalysis(report);
 const loaded=Session.import(s.export());
 assert.deepEqual(loaded.snapshot().fullGameAnalysis,report);
 assert.equal(loaded.snapshot().fullGameAnalysis?.records.length,4);
});
test('incomplete and aborted scans do not claim a complete player-quality report',async()=>{
 const root=new Chess().fen();
 await assert.rejects(scanFullGame(root,['f3','e5'],{async check(){throw new Error('Engine nicht erreichbar');}}),/Engine nicht erreichbar/);
 const c=new AbortController();c.abort();
 let calls=0;
 await assert.rejects(scanFullGame(root,['f3','e5'],{async check(){calls++;throw new Error();}},()=>{},c.signal),/abgebrochen/);
 assert.equal(calls,0);
});

test('KI context contains every move evaluation, with the largest swing explicitly prioritized',()=>{
 const report=makeFullGameAnalysis(new Chess().fen(),['f3','e5','g4','Qh4#'],[0,-180,-160,-570,-1500]);
 const summary=fullGameSummary(report,1);
 assert.match(summary,/Wichtigste Fehler nach Bewertungsverlust: 2\.g4: grober Fehler/);
 assert.match(summary,/Vollständiger chronologischer Verlauf aller 4 Halbzüge/);
 for(const move of ['1.f3','1…e5','2.g4','2…Qh4#'])assert.ok(summary.includes(move),move);
 assert.match(summary,/ANALYSEAUFTRAG: Identifiziere zuerst die größten/);
});

test('complete AI context is split within provider limits without dropping scored moves',()=>{
 const moves=['f3','e5','g4','Qh4#'];
 const analysis=makeFullGameAnalysis(new Chess().fen(),moves,[0,-180,-160,-570,-1500]);
 const fragments=fullGameContext(analysis);
 assert.ok(fragments.every(value=>value.length<=2700));
 assert.equal(fragments.join(''),fullGameSummary(analysis));
 assert.match(fragments.join(''),/2…Qh4#/);
});

test('real Maia-game move sequence: a hypothetical 6-pawn swing on 23…Nxd4 is the leading turning point',()=>{
 // SAN sequence comes from the user's exported Maia game. Scores here are deliberately
 // synthetic, because the old diagnosis did not contain per-position Stockfish scores.
 const moves=['d4','Nf6','e3','g6','f4','Bg7','Nf3','O-O','Be2','d6','O-O','Nbd7','c3','b6','b4','c5','bxc5','bxc5','dxc5','Nxc5','a4','Bb7','Ba3','Nfe4','Bxc5','Nxc5','Nd4','e5','fxe5','Bxe5','Bf3','Bxf3','Rxf3','Qh4','g3','Qh3','Qf1','Qg4','Kg2','Qe4','Nd2','Qd5','Kg1','Ne6','Qc4','Nxd4','Qxd5','Nxf3+','Qxf3'];
 const scores=Array<number>(moves.length+1).fill(0);
 for(let i=46;i<scores.length;i++)scores[i]=600;
 const report=makeFullGameAnalysis(new Chess().fen(),moves,scores);
 const mistake=report.records[45]!;
 assert.equal(mistake.ply,46);
 assert.equal(mistake.san,'Nxd4');
 assert.equal(mistake.side,'b');
 assert.equal(mistake.grade,'grober Fehler');
 assert.equal(mistake.lossCp,600);
 assert.equal(report.players.black.blunders,1);
 const context=fullGameContext(report).join('');
 assert.match(context,/Wichtigste Fehler nach Bewertungsverlust: 23…Nxd4: grober Fehler \(Verlust 600 cp/);
 assert.match(context,/Vollständiger chronologischer Verlauf aller 49 Halbzüge/);
 for(const move of ['23…Nxd4','24.Qxd5','24…Nxf3+','25.Qxf3'])assert.ok(context.includes(move),move);
});

test('game-wide intent recognizes natural decisive-mistake questions and excludes position-only or technical requests',()=>{
 for(const q of ['Was war der entscheidende Fehler von Schwarz?','Bewerte bitte die gesamte Partie.','Wie gut hat Maia gespielt?','Welche Züge waren Patzer von Weiß?','Nenne die wichtigsten Wendepunkte.'])
  assert.equal(asksAboutGameQuality(q),true,q);
 for(const q of ['Erkläre mir das Feld e4.','Wie ändere ich den API-Schlüssel?','Zeichne einen Pfeil auf dem Brett.'])
  assert.equal(asksAboutGameQuality(q),false,q);
});
