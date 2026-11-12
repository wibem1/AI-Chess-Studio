import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Session} from '../src/session.js';
import {makeFullGameAnalysis,fullGameContext} from '../src/full-game-analysis.js';
import {parseRequest} from '../src/model-contract.js';

// Full 109-half-move history from the actual user diagnostic, not a short
// synthetic opening. Only the scores are artificial; they test the pipeline,
// not an alleged Stockfish chess evaluation.
const moves=['d4','Nf6','e3','g6','f4','Bg7','Nf3','O-O','Be2','d6','O-O','Nbd7','c3','b6','b4','c5','bxc5','bxc5','dxc5','Nxc5','a4','Bb7','Ba3','Nfe4','Bxc5','Nxc5','Nd4','e5','fxe5','Bxe5','Bf3','Bxf3','Rxf3','Qh4','g3','Qh3','Qf1','Qg4','Kg2','Qe4','Nd2','Qd5','Kg1','Ne6','Qc4','Nxd4','Qxd5','Nxf3+','Qxf3','Bxc3','Qd1','Bxa1','Qxa1','Rab8','Qd4','Rfd8','Nc4','Rb1+','Kg2','Rc1','e4','Rc2+','Kh3','Re2','Qd3','Ra2','Qb3','Re2','Qd3','Ra2','a5','d5','exd5','Kg7','d6','Ra4','Qc3+','Kg8','Qb3','Ra1','Qb7','Rd1','Qxa7','h5','Qc7','Re8','a6','Rc1','a7','g5','Qc6','g4+','Kh4','Re2','a8=Q+','Kg7','Kxh5','Rxh2+','Kxg4','Rh8','Qab7','Rxc4+','Qxc4','Rd8','Qd4+','Kg6','Qbe4+','Kh6','Qf6#'];

test('actual 109-ply Maia game transports complete Stockfish review through provider request contract',()=>{
 const s=new Session();for(const san of moves)s.play(san);
 assert.equal(s.snapshot().nodes.length,110);
 assert.equal(s.status().checkmate,true);
 const scores=Array<number>(moves.length+1).fill(0);
 for(let i=46;i<scores.length;i++)scores[i]=599;
 const report=makeFullGameAnalysis(s.snapshot().nodes[0]!.fen,moves,scores,moves.map((_,i)=>`n${i+1}`));
 s.storeFullGameAnalysis(report);
 assert.deepEqual(Session.import(s.export()).snapshot().fullGameAnalysis,report);
 const context=fullGameContext(report);
 assert.ok(context.length>=1&&context.length<=5);
 assert.ok(context.every(chunk=>chunk.length<=2700));
 assert.ok(context.reduce((sum,chunk)=>sum+chunk.length,0)<=15000);
 const joined=context.join('');
 assert.match(joined,/Vollständiger chronologischer Verlauf aller 109 Halbzüge/);
 assert.match(joined,/23…Nxd4: grober Fehler/);
 assert.match(joined,/55.Qf6#/);
 const actual=s.snapshot(),last=actual.nodes.at(-1)!;
 const payload=parseRequest({nodeId:last.id,fen:last.fen,question:'Was war der entscheidende Fehler von Schwarz?',legalMoves:new Chess(last.fen).moves(),context,topic:'chat',
   gameHistory:{rootFen:actual.nodes[0]!.fen,moves,truncated:false,human:'w'},toolsEnabled:true});
 assert.equal(payload.context.join(''),joined);
 assert.equal(payload.gameHistory?.moves.length,109);
});
