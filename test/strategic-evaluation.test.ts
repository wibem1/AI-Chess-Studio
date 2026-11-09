import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parsePgn} from '../src/review.js';
import {strategicEvaluationCase,recordStrategicEvaluation,STRATEGIC_EVALUATION_QUESTION,STRATEGIC_EVALUATION_DIMENSIONS} from '../src/strategic-evaluation.js';

const game=()=>parsePgn(readFileSync('test/fixtures/lichess-1Vh80QL2.pgn','utf8'));
const data=[
 [11,'e5','Nc3','dxe5'],
 [35,'Nd6','Rxf6','Re7'],
 [41,'Nxb7','Ne4','Rxb7'],
 [55,'Rd1','b4','Nxg3'],
 [93,'Rxg7','Ra7','Nxg7']
] as const;
const make=(i=0)=>{
 const [ply,played,annotatedAlternative,followingReply]=data[i]!;
 return strategicEvaluationCase(game().moves.map(m=>m.san),{
   caseId:`lichess-1Vh80QL2-ply-${ply}`,source:'test/fixtures/lichess-1Vh80QL2.pgn',
   ply,played,annotatedAlternative,followingReply
 });
};
test('five evaluation cases carry distinct real pre-move positions and identical questions',()=>{
 const cases=data.map((_,i)=>make(i));
 assert.equal(new Set(cases.map(c=>c.fen)).size,5);
 assert.equal(new Set(cases.map(c=>c.caseId)).size,5);
 assert.ok(cases.every(c=>c.question===STRATEGIC_EVALUATION_QUESTION));
 assert.ok(cases.every(c=>c.sourceType==='source_game_not_model'));
});
test('wrong ply, played move, following reply or source history are rejected',()=>{
 const moves=game().moves.map(m=>m.san);
 const base={caseId:'a',source:'actual game',ply:11,played:'e5',annotatedAlternative:'Nc3',followingReply:'dxe5'};
 for(const spec of [{...base,ply:300},{...base,played:'Nc3'},{...base,followingReply:'Nf6'},{...base,annotatedAlternative:'Qh8'}])
  assert.throws(()=>strategicEvaluationCase(moves,spec));
 assert.throws(()=>strategicEvaluationCase(['e4','illegal','e5','d4'],{...base,ply:3}));
});
test('manual human grading requires original FEN, actual model response and reasons on all dimensions',()=>{
 const item=make();
 const ratings=Object.fromEntries(STRATEGIC_EVALUATION_DIMENSIONS.map(key=>[key,{score:2,reason:`Beobachtung: ${key}`}])) as Parameters<typeof recordStrategicEvaluation>[1]['ratings'];
 const input={fen:item.fen,model:'local-test-placeholder',thinkingLevel:'manual',response:'Beispielantwort, keine reale KI-Antwort.',ratings};
 const result=recordStrategicEvaluation(item,input);
 assert.equal(result.total,10);
 assert.equal(result.assessmentType,'manual_not_engine');
 assert.equal(result.response,input.response);
 assert.throws(()=>recordStrategicEvaluation(item,{...input,fen:'invalid'}));
 assert.throws(()=>recordStrategicEvaluation(item,{...input,response:' '}));
 assert.throws(()=>recordStrategicEvaluation(item,{...input,ratings:{...ratings,boardAccuracy:{score:3,reason:' '}}}));
 assert.throws(()=>recordStrategicEvaluation(item,{...input,ratings:{...ratings,boardAccuracy:{score:4,reason:'Nicht erlaubt'}} as typeof ratings}));
});
