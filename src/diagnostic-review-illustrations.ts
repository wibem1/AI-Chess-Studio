import type {SessionData} from './session.js';
import {pathTo} from './game.js';

/** Exportable evidence for reviewing the actual AI-generated drawings after reload.
 * All geometry is paired with the FEN before the associated historical move.
 * Does not infer chess quality, trigger model requests, or generate new arrows.
 */
export function diagnosticReviewIllustrations(data:SessionData){
 const analyses=data.annotations.filter(a=>a.source==='model'&&a.kind==='dialogue'&&a.gameReview).slice(-3);
 return analyses.map(annotation=>{
  const line=pathTo(data,annotation.nodeId);
  return {
   analysisNodeId:annotation.nodeId,
   momentCount:annotation.gameReview!.moments.length,
   moments:annotation.gameReview!.moments.map(moment=>({
    ply:moment.ply,
    played:moment.played,
    beforeNodeId:line[moment.ply-1]!.id,
    beforeFen:line[moment.ply-1]!.fen,
    explanation:moment.explanation,
    alternative:moment.alternative,
    reason:moment.reason,
    marks:moment.marks??[],
    steps:moment.steps??[]
   }))
  };
 });
}
