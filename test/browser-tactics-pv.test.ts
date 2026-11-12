import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {BrowserTacticalAdapter} from '../src/browser-tactics.js';
import type {EngineWorker} from '../src/browser-uci.js';

class FakeWorker implements EngineWorker {
 onmessage:EngineWorker['onmessage']=null;
 onerror:EngineWorker['onerror']=null;
 onmessageerror:EngineWorker['onmessageerror']=null;
 terminated=false;
 constructor(private bestmove:string,private pv:string){}
 postMessage(command:string){
  const line=(value:string)=>this.onmessage?.(new MessageEvent('message',{data:value}));
  if(command==='uci'){line('id name Stockfish 19 Lite fixture');line('uciok');}
  if(command==='isready')line('readyok');
  if(command.startsWith('go ')){
   line('info depth 8 nodes 500 score cp 31 pv '+this.pv);
   line('bestmove '+this.bestmove);
  }
 }
 terminate(){this.terminated=true;}
}

test('position scan accepts legal final bestmove distinct from a valid scored PV',async()=>{
 const board=new Chess();board.move('d4');const fen=board.fen();
 const workers:FakeWorker[]=[];
 const adapter=new BrowserTacticalAdapter(()=>{const w=new FakeWorker('d7d5','g8f6');workers.push(w);return w;});
 const result=await adapter.check(fen,null,{rootFen:new Chess().fen(),moves:['d4']});
 assert.equal(result.fen,fen);
 assert.deepEqual(result.line,['Nf6']);
 assert.deepEqual(result.score,{unit:'cp',value:-31,perspective:'white'});
 assert.equal(workers[0]?.terminated,true);
});

test('position scan still rejects genuinely illegal final bestmove',async()=>{
 const board=new Chess();board.move('d4');const fen=board.fen();
 const adapter=new BrowserTacticalAdapter(()=>new FakeWorker('e7e8','g8f6'));
 await assert.rejects(adapter.check(fen,null),/Stockfish-Prüfung: Illegaler abschließender Zug/);
});

test('position scan rejects invalid interim variation without trusting its score',async()=>{
 const board=new Chess();board.move('d4');const fen=board.fen();
 const adapter=new BrowserTacticalAdapter(()=>new FakeWorker('d7d5','e7e8'));
 await assert.rejects(adapter.check(fen,null),/Stockfish-Prüfung: Keine gültige Hauptvariante/);
});
