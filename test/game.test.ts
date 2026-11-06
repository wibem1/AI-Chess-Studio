import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Session} from '../src/session.js';
import {LearningGame,type PlayingEngine} from '../src/game.js';
import {Studio} from '../src/dialogue.js';
import {PlayingEngineService} from '../server/playing-engine.js';
const fake=(san:string,level=1):PlayingEngine=>({move:async()=>({san,level,engine:'Stockfish fixture'})});

test('engine game and analysis branches stay separate; original game can resume',async()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',1);g.play('e4');
 assert.equal(await g.reply(fake('e5')),'stored');const cursor=s.snapshot().game!.cursor;
 g.analyse('n0');g.play('d4');assert.equal(s.snapshot().game!.cursor,cursor);
 assert.notEqual(s.snapshot().activeNodeId,cursor);assert.equal(g.needsEngine(),false);
 g.resume();assert.equal(s.snapshot().activeNodeId,cursor);assert.equal(s.snapshot().nodes.length,4);
});
test('human can choose black; engine moves first and wrong-side human moves are blocked',async()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('b',1);assert.equal(g.needsEngine(),true);
 assert.throws(()=>g.play('e4'),/Stockfish/);await g.reply(fake('e4'));g.play('e5');assert.equal(g.needsEngine(),true);
});
test('pause and resume invalidate a pending engine answer even at the same position',async()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',1);g.play('e4');let resolve!:(v:unknown)=>void;
 const pending=g.reply({move:()=>new Promise(r=>{resolve=r;})});g.pause();g.resume();resolve({san:'e5',level:1,engine:'Stockfish fixture'});
 assert.equal(await pending,'discarded');assert.equal(s.snapshot().nodes.length,2);
 await g.reply(fake('c5'));assert.equal(s.snapshot().nodes.at(-1)!.san,'c5');
});
test('session replacement discards pending engine answers',async()=>{
 let current=new Session();const g=new LearningGame(()=>current);g.start('w',1);g.play('e4');let resolve!:(v:unknown)=>void;
 const pending=g.reply({move:()=>new Promise(r=>{resolve=r;})});current=Session.import(current.export());
 resolve({san:'e5',level:1,engine:'Stockfish fixture'});assert.equal(await pending,'discarded');assert.equal(current.snapshot().nodes.length,2);
});
test('illegal engine reply pauses without mutation and can be retried explicitly',async()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',1);g.play('e4');await assert.rejects(g.reply(fake('e4')));
 assert.equal(s.snapshot().game!.paused,true);assert.equal(s.snapshot().nodes.length,2);
 g.resume();await g.reply(fake('e5'));assert.equal(s.snapshot().nodes.length,3);
});
test('game, named variants and comparison survive validated export/import',()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',2);g.play('e4');g.analyse('n0');g.play('d4');
 s.label('n1','Offenes Zentrum');s.label('n2','Damenbauernplan');s.compare('n1','n2');
 assert.equal(Session.import(s.export()).export(),s.export());
 for(const mutate of [
  (d:ReturnType<Session['snapshot']>)=>{d.game!.cursor='missing';},
  (d:ReturnType<Session['snapshot']>)=>{d.game!.level=99;},
  (d:ReturnType<Session['snapshot']>)=>{d.game!.start='n2';},
  (d:ReturnType<Session['snapshot']>)=>{d.comparison!.b='n1';},
  (d:ReturnType<Session['snapshot']>)=>{d.labels!.missing='fake';}
 ]){const d=s.snapshot();mutate(d);assert.throws(()=>Session.import(JSON.stringify(d)));}
});
test('dialogue includes explicitly selected variants and learning game context without changing the game',async()=>{
 const studio=new Studio(),g=new LearningGame(()=>studio.session);g.start('w',1);g.play('e4');g.analyse('n0');g.play('d4');studio.session.compare('n1','n2');
 studio.session.annotate({nodeId:'n1',kind:'memory',source:'human',text:'Offenes Zentrum',hypothesis:true,openQuestions:[]});
 studio.session.annotate({nodeId:'n2',kind:'memory',source:'human',text:'Damenbauernplan',hypothesis:true,openQuestions:[]});
 const before=studio.session.snapshot().game;
 await studio.ask('Vergleiche beide Pläne',{respond:async r=>{
  assert.ok(r.context!.some(c=>c.includes('Variantenvergleich')));assert.ok(r.context!.some(c=>c.includes('Lernpartie')));assert.ok(r.context!.some(c=>c.includes('Offenes Zentrum') && c.includes('Damenbauernplan')));
  return {plan:'Testplan',opponent:'Hypothese',candidates:[],risks:'Testrisiko',playability:'Test',openQuestions:[]};
 }});assert.deepEqual(studio.session.snapshot().game,before);
});
test('real Stockfish playing engine accepts all five skill levels and produces legal replies',async()=>{
 const root=new Chess();for(let level=1;level<=5;level++){
  const result=await new PlayingEngineService().move({rootFen:root.fen(),moves:['e4'],level});
  const board=new Chess();board.move('e4');assert.ok(board.moves().includes(result.san));assert.equal(result.level,level);assert.match(result.engine,/Stockfish 19/);
 }
});
test('playing engine rejects forged history, invalid levels and completed repetition games',async()=>{
 const s=new PlayingEngineService(),fen=new Chess().fen();
 for(const raw of [{rootFen:fen,moves:['e5'],level:1},{rootFen:fen,moves:[],level:99},{rootFen:fen,moves:['e4\nquit'],level:1},
  {rootFen:fen,moves:['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8'],level:1}])await assert.rejects(s.move(raw));
});

test('mode switches remember a study branch only while the actual game position stays the same',async()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',1);g.play('e4');await g.reply(fake('e5'));const cursor=s.snapshot().game!.cursor;
 g.learn();g.play('Nf3');const study=s.snapshot().activeNodeId;g.resume();assert.equal(s.snapshot().activeNodeId,cursor);
 g.learn();assert.equal(s.snapshot().activeNodeId,study);assert.equal(s.snapshot().game!.cursor,cursor);g.resume();g.play('Bc4');await g.reply(fake('Nc6'));
 const later=s.snapshot().game!.cursor;g.learn();assert.equal(s.snapshot().activeNodeId,later);assert.notEqual(later,study);
});

test('stored coach suggestions must be legal at their own position and survive export',()=>{
 const s=new Session();s.annotate({nodeId:'n0',kind:'dialogue',source:'model',text:'Entwicklung betrachten',hypothesis:true,openQuestions:[],suggestions:['Nf3']});
 assert.deepEqual(Session.import(s.export()).snapshot().annotations[0]!.suggestions,['Nf3']);
 const valid=s.snapshot().annotations[0]!;
 assert.throws(()=>s.annotate({...valid,suggestions:['e5']}),/Illegale/);
 assert.throws(()=>s.annotate({...valid,source:'human'}),/Ungültige/);
 const raw=JSON.parse(s.export());raw.annotations[0].suggestions=['e5'];assert.throws(()=>Session.import(JSON.stringify(raw)),/Illegale/);
});

test('take back own move and engine reply, keeping the annotated branch, then play another move',async()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',1);assert.equal(g.canTakeBack(),false);
 g.play('e4');await g.reply(fake('e5'));s.annotate({nodeId:s.snapshot().activeNodeId,kind:'memory',source:'human',text:'Alte Idee',hypothesis:false,openQuestions:[]});
 g.takeBack();assert.equal(s.snapshot().activeNodeId,'n0');assert.equal(s.snapshot().game!.cursor,'n0');assert.equal(g.needsEngine(),false);assert.equal(g.canTakeBack(),false);
 g.play('d4');await g.reply(fake('d5'));assert.equal(s.snapshot().nodes.length,5);assert.equal(s.snapshot().annotations[0]!.text,'Alte Idee');
 assert.equal(Session.import(s.export()).snapshot().nodes.length,5);
});
test('take back cancels a pending engine move and discards its late answer',async()=>{
 const s=new Session(),g=new LearningGame(()=>s);g.start('w',1);g.play('e4');let resolve!:(v:unknown)=>void,canceled=0;
 const pending=g.reply({move:()=>new Promise(r=>{resolve=r;}),cancel:()=>{canceled++;}});g.takeBack();assert.equal(canceled,1);g.play('d4');
 resolve({san:'e5',level:1,engine:'Stockfish fixture'});assert.equal(await pending,'discarded');assert.equal(s.snapshot().nodes.length,3);
 await g.reply(fake('d5'));assert.equal(s.snapshot().nodes.at(-1)!.san,'d5');
});
test('black take back stops after engine opening; game starting from a study position stays within that game',async()=>{
 const s=new Session(),g=new LearningGame(()=>s);s.play('d4');g.start('b',1);assert.equal(g.canTakeBack(),false);
 g.play('d5');await g.reply(fake('c4'));g.takeBack();assert.equal(s.snapshot().activeNodeId,'n1');assert.equal(g.canTakeBack(),false);assert.throws(()=>g.takeBack(),/Noch kein eigener/);
 const s2=new Session(),g2=new LearningGame(()=>s2);g2.start('b',1);await g2.reply(fake('e4'));assert.equal(g2.canTakeBack(),false);
 g2.play('e5');await g2.reply(fake('Nf3'));g2.takeBack();assert.equal(s2.snapshot().activeNodeId,'n1');assert.equal(new Chess(s2.snapshot().nodes.find(n=>n.id===s2.snapshot().activeNodeId)!.fen).turn(),'b');
});
