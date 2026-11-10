import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';
import {diagnosticGameHistory} from '../src/diagnostic-game-history.js';
import {ModelDiagnostics} from '../src/model-diagnostics.js';

test('diagnosis includes complete moves even with zero model requests',()=>{
 const game=new Session();
 const first=game.play('e4');
 game.play('e5');
 game.play('Nf3');
 const history=diagnosticGameHistory(game.snapshot());
 const report=new ModelDiagnostics().export({current:{gameHistory:history}});
 assert.equal(report.requests.length,0);
 assert.deepEqual(report.extra.current.gameHistory.activeLine.map((move:{san:string})=>move.san),['e4','e5','Nf3']);
 assert.equal(report.extra.current.gameHistory.nodes.length,4);
 assert.equal(report.extra.current.gameHistory.nodes[1].id,first);
 assert.equal(report.extra.current.gameHistory.nodes[3].parentId,report.extra.current.gameHistory.nodes[2].id);
});

test('diagnosis preserves branches without mistaking them for the active line',()=>{
 const game=new Session();
 const first=game.play('d4');
 game.play('d5');
 game.select(first);
 game.play('Nf3');
 const history=diagnosticGameHistory(game.snapshot());
 assert.deepEqual(history.activeLine.map(move=>move.san),['d4','Nf3']);
 assert.equal(history.nodes.length,4);
 assert.deepEqual(history.nodes.filter(node=>node.parentId===first).map(node=>node.san),['d5','Nf3']);
});
