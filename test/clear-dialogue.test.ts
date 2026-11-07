import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';
import {Studio,SimulationAdapter} from '../src/dialogue.js';
test('clearing conversations removes all branches and model history while preserving game and notes',async()=>{
 const studio=new Studio();await studio.ask('Erste Frage',new SimulationAdapter());studio.session.play('e4');await studio.ask('Zweite Frage',new SimulationAdapter());studio.session.annotate({nodeId:'n1',kind:'memory',source:'human',text:'Meine Notiz',hypothesis:false,openQuestions:[]});studio.session.select('n0');studio.session.play('d4');await studio.ask('Anderer Zweig',new SimulationAdapter());
 const before=studio.session.snapshot(),oldCopy=studio.session.export();studio.session.clearDialogue();const after=studio.session.snapshot();assert.deepEqual(after.nodes,before.nodes);assert.equal(after.activeNodeId,before.activeNodeId);assert.equal(after.annotations.length,1);assert.equal(after.annotations[0]!.text,'Meine Notiz');assert.equal(Session.import(studio.session.export()).snapshot().annotations.length,1);assert.equal(Session.import(oldCopy).snapshot().annotations.length,7);
 await studio.ask('Neu anfangen',{respond:async r=>{assert.deepEqual(r.turns,[]);return new SimulationAdapter().respond(r);}});
});
test('clearing the chat invalidates an already running response even when the session and node remain the same',async()=>{
 const studio=new Studio();let release!:(value:unknown)=>void;const response=await new SimulationAdapter().respond({nodeId:'n0',fen:studio.session.snapshot().nodes[0]!.fen,question:'Test',legalMoves:[]});const waiting=studio.ask('Unterwegs',{respond:async()=>new Promise(resolve=>{release=resolve;})});studio.session.clearDialogue();release(response);assert.equal(await waiting,'discarded');assert.equal(studio.session.snapshot().annotations.length,0);
});
