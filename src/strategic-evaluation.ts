import {Chess} from 'chess.js';

export const STRATEGIC_EVALUATION_QUESTION =
 'Erkläre mir die Stellung aus menschlich-strategischer Sicht. Was sind die wichtigsten Pläne beider Seiten, warum, und welche konkreten Gegenmaßnahmen sind denkbar?';

export const STRATEGIC_EVALUATION_DIMENSIONS = [
 'boardAccuracy','strategicContent','planExecution','opponentCounterplay','learningValue'
] as const;
export type EvaluationDimension=typeof STRATEGIC_EVALUATION_DIMENSIONS[number];
export type EvaluationRatings=Record<EvaluationDimension,{score:0|1|2|3;reason:string}>;

export interface StrategicEvaluationCase {
 caseId:string;
 source:string;
 ply:number;
 fen:string;
 played:string;
 annotatedAlternative:string;
 followingReply:string;
 question:string;
 sourceType:'source_game_not_model';
}
export interface StrategicEvaluationRecord {
 caseId:string;
 fen:string;
 model:string;
 thinkingLevel:string;
 response:string;
 ratings:EvaluationRatings;
 total:number;
 assessmentType:'manual_not_engine';
}

/** Reconstruct the exact pre-move position, never re-label an annotation as truth. */
export function strategicEvaluationCase(
 moves:readonly string[],spec:{caseId:string;source:string;ply:number;played:string;annotatedAlternative:string;followingReply:string}
):StrategicEvaluationCase {
 if(!spec.caseId.trim()||!spec.source.trim()||!Number.isInteger(spec.ply)||spec.ply<1||spec.ply>=moves.length)
  throw new Error('Ungültige Qualitätsprüfungsstelle.');
 const position=new Chess();
 for(let i=0;i<spec.ply-1;i++){
  if(!position.moves().includes(moves[i]!))throw new Error('Ungültige Partievorgeschichte.');
  position.move(moves[i]!);
 }
 const fen=position.fen();
 if(moves[spec.ply-1]!==spec.played||moves[spec.ply]!==spec.followingReply||
    !position.moves().includes(spec.played)||!position.moves().includes(spec.annotatedAlternative))
  throw new Error('Schlüsselstelle stimmt nicht mit der Originalpartie überein.');
 const actual=new Chess(fen);actual.move(spec.played);
 if(!actual.moves().includes(spec.followingReply))throw new Error('Unzulässige tatsächliche Folgeantwort.');
 return {caseId:spec.caseId,source:spec.source,ply:spec.ply,fen,played:spec.played,
  annotatedAlternative:spec.annotatedAlternative,followingReply:spec.followingReply,
  question:STRATEGIC_EVALUATION_QUESTION,sourceType:'source_game_not_model'};
}

/** Does not call an LLM or assign scores. Only validates an explicit human appraisal. */
export function recordStrategicEvaluation(
 evaluation:StrategicEvaluationCase,
 submitted:{fen:string;model:string;thinkingLevel:string;response:string;ratings:EvaluationRatings}
):StrategicEvaluationRecord {
 if(submitted.fen!==evaluation.fen)throw new Error('Bewertung gehört zu einer anderen Stellung.');
 if(!submitted.model.trim()||!submitted.thinkingLevel.trim()||!submitted.response.trim())
  throw new Error('Modell, Denkstufe und tatsächliche Antwort sind erforderlich.');
 if(!submitted.ratings||typeof submitted.ratings!=='object'||
    Object.keys(submitted.ratings).length!==STRATEGIC_EVALUATION_DIMENSIONS.length)
  throw new Error('Fünf begründete Bewertungsdimensionen erforderlich.');
 let total=0;
 for(const dimension of STRATEGIC_EVALUATION_DIMENSIONS){
  const value=submitted.ratings[dimension];
  if(!value||!Number.isInteger(value.score)||value.score<0||value.score>3||
     typeof value.reason!=='string'||!value.reason.trim())
   throw new Error(`Bewertung für ${dimension} benötigt eine Note 0–3 und Begründung.`);
  total+=value.score;
 }
 return {caseId:evaluation.caseId,fen:evaluation.fen,model:submitted.model,thinkingLevel:submitted.thinkingLevel,
  response:submitted.response,ratings:submitted.ratings,total,assessmentType:'manual_not_engine'};
}
