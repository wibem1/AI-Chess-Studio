import type {ProviderOptions} from './model-provider.js';
import type {DialogueRequest, StrategicReply} from './dialogue.js';
import {ApiError} from './model-contract.js';
import {decodeModelContent} from './model-reply.js';
import type {DeepReviewResult} from './deep-stockfish.js';
export const STRATEGIC_PASS_PROMPT='Du bist ein deutschsprachiger Schachanalytiker, Stufe 1 von 2. Prüfe die vollständige Partie anhand der begrenzten Stockfish-Befunde. Skizziere knapp (höchstens etwa 1.000 Zeichen) Pläne, Planwechsel und gelungene Entscheidungen beider Seiten mit konkreten Zugbezügen. Keine erfundenen Gedanken oder taktischen Behauptungen. Nenne bis zu fünf Halbzüge für eine nötige Tiefenprüfung, nicht die Endstellung. Antworte als kurze deutsche Arbeitshypothese, kein JSON. Letzte Zeile: ENGINE_CHECK_PLIES: Halbzugnummern, durch Komma getrennt; oder 0.';
/** Explicit allowlist: no stored annotations, engine facts, chat or imported comments. */
export function strategicPayload(request:DialogueRequest){
 if(!request.history||request.history.truncated)throw new ApiError(400,'Vollständige Partie für die strategische Voranalyse erforderlich.');
 const {rootFen,moves,truncated}=request.history;
 return {question:request.question,history:{rootFen,moves,truncated},human:request.gameHistory?.human??null,stockfishEvidence:(()=>{const ctx=request.context??[],index=ctx.findIndex(c=>c.startsWith('ANALYSEAUFTRAG – STOCKFISH ALS GRUNDLAGE'));return index>=0?ctx.slice(index,index+5):ctx.filter(c=>/Stockfish|STOCKFISH|Zentibauern|Bewertung/.test(c)).slice(0,6);})()};
}
export function strategicDraft(content:unknown):string{
 const decoded=decodeModelContent(content,false) as {message?:unknown};
 const draft=decoded.message;
 if(typeof draft!=='string'||draft.trim().length<50||draft.length>6500)throw new Error('Ungültige strategische Voranalyse');
 return draft.trim();
}
export function verifiedRequest<T extends object>(request:T,draft:string,checks:readonly DeepReviewResult[]=[]){const {cachedDeepChecks:_,...input}=request as T&{cachedDeepChecks?:unknown};return {...input,qualitativeDraft:draft,...(checks.length?{deepEngineChecks:checks.map(x=>({ply:x.ply,fen:x.fen,played:x.played,elapsedMs:x.elapsedMs,playedLine:x.playedLine,lines:x.lines.map(y=>({depth:y.depth,score:y.score,san:y.san}))}))}:{}),analysisPhases:'Prüfe die Voranalyse an konkreten historischen Stockfish-Befunden. Vergleiche geprüfte Alternativen mit der gespielten Fortsetzung, korrigiere unbelegte Ursachen und fasse das Ergebnis ohne Zahlenliste knapp zusammen.'};}
export function combineReviewCost(reply:StrategicReply,costUsd:number|null,config:ProviderOptions&{model:string},traceId:number){
 if(!reply.provenance)reply.provenance={provider:config.provider==='openrouter'?'OpenRouter':'OpenAI',model:config.model,requestedModel:config.model,reasoning:config.reasoning??null,costUsd:null,traceId};
 if(reply.provenance){const current=reply.provenance.costUsd;reply.provenance={...reply.provenance,costUsd:current!==null&&costUsd!==null?current+costUsd:null,calls:2};}
 return reply;
}
