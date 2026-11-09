import {STRATEGIC_EVALUATION_QUESTION} from './strategic-evaluation.js';
import {TOOL_RECORD} from './coach-tools.js';

/**
 * Preserve the session's chronological question-answer association.
 * Matching the board alone is insufficient: unrelated questions cannot enter
 * a controlled model-comparison dataset.
 */
export interface EvaluationDialogueEntry {
 nodeId:string;
 kind:string;
 source:string;
 text:string;
}
export function matchingStrategyAnswers(
 annotations:readonly EvaluationDialogueEntry[],nodeIds:ReadonlySet<string>
):EvaluationDialogueEntry[]{
 const matching:EvaluationDialogueEntry[]=[];
 let currentQuestion:{nodeId:string;eligible:boolean}|undefined;
 for(const annotation of annotations){
  if(annotation.kind!=='dialogue')continue;
  if(annotation.source==='human'){
   currentQuestion={nodeId:annotation.nodeId,
    eligible:nodeIds.has(annotation.nodeId)&&annotation.text.trim()===STRATEGIC_EVALUATION_QUESTION};
   continue;
  }
  if(annotation.source==='model'&&currentQuestion?.eligible&&annotation.nodeId===currentQuestion.nodeId&&
     annotation.text.trim()&&!annotation.text.startsWith(TOOL_RECORD))
   matching.push(annotation);
 }
 return matching;
}
