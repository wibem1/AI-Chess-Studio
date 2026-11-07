import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeModelContent,normalizeModelReply} from '../src/model-reply.js';
import {Studio} from '../src/dialogue.js';
import {ModelService} from '../server/model.js';
const message='Weiß sollte zunächst die Figuren entwickeln und die Königssicherheit prüfen.';
test('completed explanations survive missing optional blocks, fenced JSON and prose without fabricated assessments',()=>{
 for(const raw of [JSON.stringify({message}),'```json\n'+JSON.stringify({message})+'\n```',message,JSON.stringify(message),JSON.stringify({answer:message})]){
  const r=normalizeModelReply(decodeModelContent(raw),['e4']);assert.equal(r.message,message);assert.equal(r.assessment,undefined);assert.equal(r.humanFactors,undefined);assert.equal(r.plan,'');assert.deepEqual(r.candidates,[]);
 }
 for(const raw of ['{"message":"abgebrochen"',undefined,'',JSON.stringify({plan:'Plan ohne eigentliche Antwort'})])assert.throws(()=>normalizeModelReply(decodeModelContent(raw),['e4']));
});
test('bad optional blocks and illegal suggestions never become executable moves or erase the explanation',()=>{
 const r=normalizeModelReply({message,assessment:{verdict:'winning'},humanFactors:{idea:5},candidates:['e4','illegal','e4',null],openQuestions:['Warum?',55]},['e4']);assert.equal(r.message,message);assert.deepEqual(r.candidates,['e4']);assert.equal(r.assessment,undefined);assert.equal(r.humanFactors,undefined);assert.deepEqual(r.openQuestions,['Warum?']);assert.match(r.formatNotes![0]!,/Nicht regelkonforme/);assert.deepEqual(normalizeModelReply(r,['e4']),r);
});
test('actual provider-service-client storage path accepts message-only answers while discarding illegal suggestions',async()=>{
 const studio=new Studio();let calls=0;
 const service=new ModelService({enabled:true,apiKey:'fixture-only-not-real',model:'fixture'},(async()=>{calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({message,candidates:['e4','illegal']})}}],usage:{prompt_tokens:30,completion_tokens:30}}));}) as typeof fetch);
 await studio.ask('Erläutere die Situation auf dem Schachbrett.',{source:'model',respond:r=>service.reply(r)});const a=studio.session.snapshot().annotations.at(-1)!;assert.match(a.text,/Weiß sollte/);assert.doesNotMatch(a.text,/Stellungsbeurteilung|Plan: /);assert.deepEqual(a.suggestions,['e4']);assert.equal(calls,1);
});

test('free chat has no answer schema and carries actual game, current study position and older conversation independently',async()=>{
 const {LearningGame}=await import('../src/game.js');const studio=new Studio(),game=new LearningGame(()=>studio.session);game.start('w',1);game.play('e4');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});game.learn();game.analyse('n0');let calls=0;
 const service=new ModelService({enabled:true,apiKey:'fixture-only-not-real',model:'fixture'},(async(_url,init)=>{calls++;const body=JSON.parse(String(init!.body)),r=JSON.parse(body.messages.at(-1).content);assert.equal(body.response_format,undefined);assert.match(body.messages[0].content,/freien Gespräch/);assert.equal(r.topic,'chat');assert.deepEqual(r.history.moves,[]);assert.deepEqual(r.gameHistory.moves,['e4','e5']);assert.equal(r.gameHistory.human,'w');return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:message}}],usage:{prompt_tokens:30,completion_tokens:30}}));}) as typeof fetch);
 await studio.ask('Meine eigene Frage ohne Vorlage',{source:'model',respond:r=>service.reply(r)},'chat');assert.equal(studio.session.snapshot().activeNodeId,'n0');assert.equal(calls,1);
 for(let i=0;i<4;i++)await studio.ask('Erinnerst du dich?',{source:'model',respond:async()=>({message})},'chat');
 await studio.ask('Was war unsere erste Idee?',{respond:async r=>{assert.equal(r.turns!.length,10);assert.equal(r.turns![0]!.text,'Meine eigene Frage ohne Vorlage');return {plan:'x',opponent:'x',risks:'x',playability:'x',candidates:[],openQuestions:[]};}},'chat');
});

test('free prose is not required to parse as JSON even when it begins with brackets',()=>{
 const text='[Hinweis] Wir untersuchen zuerst deinen Plan.';assert.equal(normalizeModelReply(decodeModelContent(text,false),[]).message,text);assert.equal(normalizeModelReply(decodeModelContent('[1,2]',false),[]).message,'[1,2]');
});
