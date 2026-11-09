import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordedModelAnswer} from '../src/evaluation-provenance.js';

test('separate saved app receipt and provider model identity from user-visible explanation',()=>{
 const text='Modellnachweis (App): OpenRouter · google/gemini-4-argon · Denken medium · 2 Aufruf(e) · 0.004500 USD (Anbieterangabe).\n\nDer Springer wird von d5 aus das Zentrum kontrollieren.\n\nAnalyse-Details:\nInternes Diagnosematerial';
 const got=recordedModelAnswer(text);
 assert.deepEqual(got,{response:'Der Springer wird von d5 aus das Zentrum kontrollieren.',
  model:'google/gemini-4-argon',thinkingLevel:'medium',receiptPresent:true});
 assert.ok(!got.response.includes('Diagnosematerial'));
});
test('do not invent provenance for plain historical or malformed model replies',()=>{
 const text='Strategisch wichtig ist die d-Linie.\n\nAnalyse-Details:\nNur technische Daten.';
 assert.deepEqual(recordedModelAnswer(text),{response:'Strategisch wichtig ist die d-Linie.',receiptPresent:false});
 const malformed='Modellnachweis (App): nicht vertrauenswürdig\n\nAntwort';
 assert.equal(recordedModelAnswer(malformed).receiptPresent,false);
 assert.throws(()=>recordedModelAnswer('   '));
});
