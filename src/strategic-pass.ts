import type {ProviderOptions} from './model-provider.js';
import type {DialogueRequest, StrategicReply} from './dialogue.js';
import {ApiError} from './model-contract.js';
import {decodeModelContent} from './model-reply.js';
export const STRATEGIC_PASS_PROMPT='Du bist ein deutschsprachiger Schachanalytiker. Dies ist STUFE 1 von 2. Du erhältst ausschließlich die tatsächliche Zugfolge, keine Stockfish-Bewertungen. Untersuche die Partie eigenständig: Ziele und Gegenpläne beider Seiten, Figurenkoordination, Bauernstruktur, Planwechsel, gelungene Entscheidungen und Übergänge. Begründe Aussagen durch Züge und Felder. Unterstelle Spielern keine unbekannten Gedanken. Benenne offene taktische Fragen ausdrücklich; erfinde weder Enginewerte noch als bewiesen bezeichnete Alternativen. Antworte als knappe, zusammenhängende strategische Arbeitshypothese auf Deutsch mit Zugbezügen, kein JSON. Diese Notiz wird anschließend anhand von Stockfish und Brettregeln kritisch geprüft.';
/** Explicit allowlist: no stored annotations, engine facts, chat or imported comments. */
export function strategicPayload(request:DialogueRequest){
 if(!request.history||request.history.truncated)throw new ApiError(400,'Vollständige Partie für die strategische Voranalyse erforderlich.');
 const {rootFen,moves,truncated}=request.history;
 return {question:request.question,history:{rootFen,moves,truncated},human:request.gameHistory?.human??null};
}
export function strategicDraft(content:unknown):string{
 const decoded=decodeModelContent(content,false) as {message?:unknown};
 const draft=decoded.message;
 if(typeof draft!=='string'||draft.trim().length<50||draft.length>6500)throw new Error('Ungültige strategische Voranalyse');
 return draft.trim();
}
export function verifiedRequest<T>(request:T,draft:string){return {...request,qualitativeDraft:draft,analysisPhases:'Stufe 1 (nur Züge) ist eine ungeprüfte Hypothese. Stufe 2: Vergleiche mit Stockfish, korrigiere Irrtümer anhand konkreter historischer Stellungen und stelle nur das überprüfbare Ergebnis dar. Keine Zahlenliste.'};}
export function combineReviewCost(reply:StrategicReply,costUsd:number|null,config:ProviderOptions&{model:string},traceId:number){
 if(!reply.provenance)reply.provenance={provider:config.provider==='openrouter'?'OpenRouter':'OpenAI',model:config.model,requestedModel:config.model,reasoning:config.reasoning??null,costUsd:null,traceId};
 if(reply.provenance){const current=reply.provenance.costUsd;reply.provenance={...reply.provenance,costUsd:current!==null&&costUsd!==null?current+costUsd:null,calls:2};}
 return reply;
}
