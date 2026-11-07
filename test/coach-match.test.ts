import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';
import {CoachMatch} from '../src/coach-match.js';
import {LearningGame} from '../src/game.js';
const reply=(san:string)=>({toolCall:{id:'test',type:'function',function:{name:'show_line',arguments:JSON.stringify({moves:[san]})}}});
test('coach match plays alternating moves without modifying the actual game cursor and stops at requested turns',async()=>{
 const s=new Session(),game=new LearningGame(()=>s);game.start('w',1,'browser');game.pause();const original=s.snapshot().game!,match=new CoachMatch(()=>s,()=>{},0);let i=0;
 await match.start({color:'w',opponent:'stockfish',level:1,maxTurns:2},{respond:async r=>{assert.equal(r.matchTest!.turn,i+1);return reply(['e4','Nf3'][i++]!);}},{move:async(_fen,moves)=>({san:moves.length===1?'e5':'Nc6',level:1,engine:'Stockfish fixture'})});
 assert.deepEqual(match.report!.moves.map(m=>m.san),['e4','e5','Nf3','Nc6']);assert.equal(match.report!.status,'limit');assert.equal(s.snapshot().game!.cursor,original.cursor);assert.equal(match.report!.modelTurns,2);
});
test('illegal model move ends the match without correction, engine call or board mutation',async()=>{
 const s=new Session(),match=new CoachMatch(()=>s,()=>{},0);let calls=0;await match.start({color:'w',opponent:'stockfish',level:1,maxTurns:5},{respond:async()=>reply('e5')},{move:async()=>{calls++;throw Error();}});assert.equal(match.report!.status,'failed');assert.match(match.report!.message,/illegal/);assert.equal(calls,0);assert.equal(s.snapshot().nodes.length,1);
});
test('stop and selection changes discard late model responses',async()=>{
 for(const stop of [true,false]){const s=new Session(),match=new CoachMatch(()=>s,()=>{},0);let release!:(x:unknown)=>void;const pending=match.start({color:'w',opponent:'stockfish',level:1,maxTurns:5},{respond:async()=>new Promise(r=>release=r)},{move:async()=>{throw Error();}});if(stop)match.stop();else s.play('d4');release(reply('e4'));await pending;assert.equal(s.snapshot().nodes.length,stop?1:2);assert.equal(match.report!.status,'stopped');}
});
test('when the model plays Black the engine opens first',async()=>{
 const s=new Session(),match=new CoachMatch(()=>s,()=>{},0);await match.start({color:'b',opponent:'stockfish',level:1,maxTurns:1},{respond:async r=>{assert.equal(r.fen.split(' ')[1],'b');return reply('e5');}},{move:async(_fen,moves)=>({san:moves.length===0?'e4':'Nf3',level:1,engine:'Stockfish fixture'})});assert.deepEqual(match.report!.moves.map(m=>m.source),['engine','model','engine']);
});
