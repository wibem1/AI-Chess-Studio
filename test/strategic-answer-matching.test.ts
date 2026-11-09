import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchingStrategyAnswers} from '../src/strategic-answer-matching.js';
import {STRATEGIC_EVALUATION_QUESTION as Q} from '../src/strategic-evaluation.js';

const human=(nodeId:string,text:string)=>({nodeId,kind:'dialogue',source:'human',text});
const model=(nodeId:string,text:string)=>({nodeId,kind:'dialogue',source:'model',text});
const nodes=new Set(['n10','n34']);
test('only answers immediately associated with the identical strategic question enter comparisons',()=>{
 const annotations=[
  human('n10','Wie steht meine Dame?'),model('n10','Unrelated answer'),
  human('n10',Q),model('n10','Strategy answer A'),
  human('n10','Bitte kürzer'),model('n10','Unrelated follow-up'),
  human('n34',Q),model('n34','Strategy answer B'),
  human('n12',Q),model('n12','Other position, should not count')
 ];
 assert.deepEqual(matchingStrategyAnswers(annotations,nodes).map(a=>a.text),['Strategy answer A','Strategy answer B']);
});
test('model answers must share the question node and exclude tool transactions and simulations',()=>{
 const annotations=[
  model('n10','Model reply without a matching human prompt'),
  human('n10',Q),
  model('n34','Answer from wrong position'),
  model('n10','Brettwerkzeug (App): Ausgeführt.'),
  {nodeId:'n10',kind:'dialogue',source:'simulation',text:'Simulated, not real'},
  model('n10','Valid explanation'),
  {nodeId:'n10',kind:'memory',source:'human',text:'Note'},
  model('n10','Second actual answer on same still-current question')
 ];
 assert.deepEqual(matchingStrategyAnswers(annotations,nodes).map(a=>a.text),
  ['Valid explanation','Second actual answer on same still-current question']);
});
test('intervening question from another branch invalidates a stale strategy reply',()=>{
 assert.deepEqual(matchingStrategyAnswers([
  human('n10',Q),human('n34','Andere Frage'),model('n10','Stale'),human('n10',Q+' '),model('n10','Whitespace normalized')
 ],nodes).map(a=>a.text),['Whitespace normalized']);
});
