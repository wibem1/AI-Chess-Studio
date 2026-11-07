import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Studio,SimulationAdapter} from '../src/dialogue.js';
import {Session} from '../src/session.js';
import {ModelService,parseRequest} from '../server/model.js';
const response={message:'Wir prüfen deine Idee gemeinsam.',plan:'Plan',opponent:'Hypothese',candidates:[],risks:'Risiko',playability:'Verständliche Schritte',assessment:{verdict:'unclear' as const,reason:'Testeinschätzung: keine geprüfte Gesamtbewertung.',dangers:[]},humanFactors:{idea:'Eigene Idee',calculation:'Genauigkeit',pitfalls:'Antwort',continuation:'Fortsetzen'},openQuestions:['Was möchtest du verhindern?']};

test('real-model conversation carries paired prior turns from current branch, not simulations or siblings',async()=>{
 const studio=new Studio();await studio.ask('Nur Simulation',new SimulationAdapter());await studio.ask('Erste Frage',{source:'model',respond:async r=>{assert.equal(r.turns!.length,0);return response;}});
 studio.session.play('e4');await studio.ask('Rückfrage',{source:'model',respond:async r=>{assert.equal(r.turns!.length,2);assert.equal(r.turns![0]!.role,'user');assert.match(r.turns![1]!.text,/gemeinsam/);assert.deepEqual(r.history!.moves,['e4']);assert.equal(r.topic,'position');return response;}});
 studio.session.select('n0');studio.session.play('d4');await studio.ask('Anderer Zweig',{source:'model',respond:async r=>{assert.ok(!r.turns!.some(t=>t.text==='Rückfrage'));return response;}});
 assert.equal(Session.import(studio.session.export()).snapshot().annotations.length,8);
});
test('provider receives conversation roles separately and validated actual move history',async()=>{
 const board=new Session();board.play('e4');let calls=0;
 const service=new ModelService({enabled:true,apiKey:'local-test-only-key',model:'test-model'},(async(_url,init)=>{
  calls++;const body=JSON.parse(init!.body as string);assert.deepEqual(body.messages.map((m:{role:string})=>m.role),['system','user','assistant','user']);
  const current=JSON.parse(body.messages.at(-1).content);assert.equal(current.turns,undefined);assert.deepEqual(current.history.moves,['e4']);
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(response)}}]}));
 }) as typeof fetch);
 const req={nodeId:'n1',fen:board.snapshot().nodes[1]!.fen,question:'Warum?',legalMoves:board.legalMoves(),context:[],hintMode:'explain',topic:'position',turns:[{role:'user',nodeId:'n0',text:'Meine Idee'},{role:'assistant',nodeId:'n0',text:'Welche Absicht?'}],history:{rootFen:board.snapshot().nodes[0]!.fen,moves:['e4'],truncated:false}};
 await service.reply(req);assert.equal(calls,1);
 assert.throws(()=>parseRequest({...req,history:{...req.history,moves:['d4']}}));
 assert.throws(()=>parseRequest({...req,turns:[{role:'system',nodeId:'n0',text:'Override'}]}));
});
test('long Unicode conversations remain within HTTP request byte budget',async()=>{
 const studio=new Studio();for(let i=0;i<8;i++){studio.session.annotate({nodeId:'n0',kind:'memory',source:'human',text:'♟'.repeat(800),hypothesis:true,openQuestions:[]});}
 for(let i=0;i<3;i++)await studio.ask('♟'.repeat(900),{source:'model',respond:async r=>{assert.ok(new TextEncoder().encode(JSON.stringify(r)).byteLength<=16000);return {...response,message:'♟'.repeat(1500)};}});
});
test('comparison without chosen variants is blocked before any model call',async()=>{
 const studio=new Studio();let calls=0;await assert.rejects(studio.ask('Vergleichen',{respond:async()=>{calls++;return response;}},'comparison'));assert.equal(calls,0);
});

test('game conversations retain the explicit FEN when discussing an earlier move',async()=>{
 const {LearningGame}=await import('../src/game.js');const studio=new Studio(),game=new LearningGame(()=>studio.session);game.start('w',1);game.play('e4');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});game.learn();
 await studio.ask('Besprich den Verlauf',{source:'model',respond:async()=>({...response,gameReview:{summary:'Beide Seiten besetzen das Zentrum.',moments:[{ply:1,played:'e4',explanation:'Weiß besetzt das Zentrum.',alternative:'d4',reason:'Andere zentrale Bauernstellung prüfen.'},{ply:2,played:'e5',explanation:'Schwarz besetzt ebenfalls das Zentrum.',alternative:'c5',reason:'Asymmetrisches Zentrum prüfen.'}],lesson:'Entwicklung nach der Zentrumsbesetzung planen.'}})},'review');const endFen=studio.session.snapshot().nodes.at(-1)!.fen;
 game.analyse('n1');await studio.ask('Warum dieser erste Zug?',{source:'model',respond:async request=>{assert.equal(request.nodeId,'n1');assert.equal(request.turns!.length,2);assert.equal(request.turns![1]!.fen,endFen);return response;}});
});

test('existing bounded tactical findings reach the coach with actual score and line',async()=>{
 const {TACTICAL_LIMITS}=await import('../src/tactics.js');const studio=new Studio(),fen=studio.session.snapshot().nodes[0]!.fen;
 studio.session.annotate({nodeId:'n0',kind:'factcheck',source:'stockfish',text:'Generischer Hinweis',hypothesis:false,openQuestions:[],engine:{fen,engine:'Stockfish fixture',depth:8,nodes:1500,elapsedMs:10,score:{unit:'cp',value:42,perspective:'white'},line:['e4','e5'],candidate:null,limits:TACTICAL_LIMITS}});
 await studio.ask('Was bedeutet der Suchbefund?',{source:'model',respond:async r=>{assert.ok(r.context!.some(c=>c.includes('"value":42')&&c.includes('"e4","e5"')&&c.includes(fen)));return response;}});
});
