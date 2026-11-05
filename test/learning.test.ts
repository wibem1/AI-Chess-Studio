import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';
import {Studio,SimulationAdapter} from '../src/dialogue.js';
const reflection={idea:'Zentrum kontrollieren',reasoning:'Meine Figuren brauchen aktive Felder',uncertainty:'Gegnerischer Gegenstoß',goal:'Pläne statt Züge lernen',hintMode:'question' as const};
const reply={plan:'LÖSUNG NICHT ANZEIGEN',opponent:'Hypothese',candidates:[],risks:'Risiko',playability:'Praxis',humanFactors:{idea:'Ein kleiner Hinweis',calculation:'Genau rechnen',pitfalls:'Gegenstoß',continuation:'Plan weiterführen'},openQuestions:['Welche Figur steht noch ungünstig?']};
test('own thoughts remain position-bound and survive session export',()=>{
 const s=new Session();s.play('e4');s.reflect('n1',reflection);s.select('n0');s.play('d4');
 const restored=Session.import(s.export());assert.deepEqual(restored.snapshot().reflections?.n1,reflection);assert.equal(restored.snapshot().reflections?.n2,undefined);
 const d=s.snapshot();d.reflections!.missing=reflection;assert.throws(()=>Session.import(JSON.stringify(d)));
 assert.throws(()=>s.reflect('n1',{...reflection,hintMode:'invalid' as 'question'}));
});
test('guiding-question mode transports learner intent and hides direct solutions',async()=>{
 const studio=new Studio();studio.session.reflect('n0',reflection);
 await studio.ask('Hilf mir beim Denken',{source:'model',respond:async r=>{assert.equal(r.hintMode,'question');assert.ok(r.context!.some(c=>c.includes('Zentrum kontrollieren') && c.includes('Pläne statt Züge lernen')));return reply;}});
 const answer=studio.session.snapshot().annotations.at(-1)!;assert.match(answer.text,/Leitfrage/);assert.ok(!answer.text.includes('LÖSUNG'));assert.ok(!answer.text.includes('Rechnen'));
});
test('hint and explanation expose different amounts of help',async()=>{
 for(const mode of ['hint','explain'] as const){const studio=new Studio();studio.session.reflect('n0',{...reflection,hintMode:mode});await studio.ask('Warum?',{source:'model',respond:async()=>reply});const answer=studio.session.snapshot().annotations.at(-1)!.text;
  assert.equal(answer.includes('LÖSUNG'),mode==='explain');assert.equal(answer.includes('Rechenarbeit'),mode==='explain');}
});
test('invalid human analysis or unwanted candidate in question mode is not stored',async()=>{
 const studio=new Studio();studio.session.reflect('n0',reflection);
 for(const raw of [{...reply,humanFactors:{idea:5}},{...reply,candidates:['e4']},{...reply,humanFactors:undefined}]){
  await assert.rejects(studio.ask('Warum?',{source:'model',respond:async()=>raw}));assert.equal(studio.session.snapshot().annotations.length,0);
 }
 const sim=await new SimulationAdapter().respond({nodeId:'n0',fen:'',question:'Warum?',legalMoves:['e4'],hintMode:'question'}) as {candidates:string[]};assert.deepEqual(sim.candidates,[]);
});
