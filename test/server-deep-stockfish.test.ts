import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {BrowserDeepStockfish} from '../src/deep-stockfish.js';
import {createNodeReviewWorker} from '../server/deep-stockfish.js';

test('real local Stockfish calculates verified MultiPV with longer bounded search',async()=>{
 const engine=new BrowserDeepStockfish(createNodeReviewWorker);
 const root=new Chess().fen(),moves=['e4','e5','Nf3'];
 const expected=new Chess(root);expected.move('e4');
 const report=await engine.check(root,moves,2);
 assert.equal(report.fen,expected.fen());
 assert.equal(report.played,'e5');
 assert.ok(report.lines.length>=1&&report.lines.length<=3);
 assert.ok(report.lines.every(line=>line.depth>=1&&line.depth<=24));
 const first=new Chess(report.fen);
 for(const san of report.lines[0]!.san){assert.ok(first.moves().includes(san));first.move(san);}
 assert.equal(report.playedLine.san[0],'e5');
 assert.ok(report.playedLine.depth>=1);
 assert.ok(report.elapsedMs<=30000);
});
