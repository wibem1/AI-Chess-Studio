import type {ProviderOptions} from './model-provider.js';
import type {DialogueRequest, StrategicReply} from './dialogue.js';
import {ApiError} from './model-contract.js';
import {decodeModelContent} from './model-reply.js';
import type {DeepReviewResult} from './deep-stockfish.js';
export const STRATEGIC_PASS_PROMPT='Du bist ein deutschsprachiger Schachanalytiker. Dies ist STUFE 1 von 2. Du erhältst ausschließlich die tatsächliche Zugfolge, keine Stockfish-Bewertungen. Untersuche die Partie eigenständig: Ziele und Gegenpläne beider Seiten, Figurenkoordination, Bauernstruktur, Planwechsel, gelungene Entscheidungen und Übergänge. Begründe Aussagen durch Züge und Felder. Unterstelle Spielern keine unbekannten Gedanken. Benenne offene taktische Fragen ausdrücklich; erfinde weder Enginewerte noch als bewiesen bezeichnete Alternativen. Antworte als knappe, zusammenhängende strategische Arbeitshypothese auf Deutsch mit Zugbezügen, kein JSON. Diese Notiz wird anschließend anhand von Stockfish und Brettregeln kritisch geprüft. Gib als letzte eigene Zeile ENGINE_CHECK_PLIES: gefolgt von bis zu fünf durch Komma getrennten Halbzugnummern (1 = erster Zug von Weiß) an, bei denen du für deine konkreten taktischen Fragen eine tiefere Stockfish-Prüfung vor dem Schlussurteil benötigst. Beispiel: ENGINE_CHECK_PLIES: 51,60,108. Wähle nur begründete kritische Stellungen und keine Endstellung. Wenn du keine brauchst, schreibe ENGINE_CHECK_PLIES: 0.';
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
export function verifiedRequest<T extends object>(request:T,draft:string,checks:readonly DeepReviewResult[]=[]){const {cachedDeepChecks:_,...input}=request as T&{cachedDeepChecks?:unknown};return {...input,qualitativeDraft:draft,...(checks.length?{deepEngineChecks:checks.map(x=>({ply:x.ply,fen:x.fen,played:x.played,elapsedMs:x.elapsedMs,playedLine:x.playedLine,lines:x.lines.map(y=>({depth:y.depth,score:y.score,san:y.san}))}))}:{}),analysisPhases:'Stufe 1 (nur Züge) ist eine ungeprüfte Hypothese. Stufe 2: Vergleiche mit Stockfish, korrigiere Irrtümer anhand konkreter historischer Stellungen und stelle nur das überprüfbare Ergebnis dar. Extra nachgerechnete MultiPV-Alternativen und die separat mit searchmoves geprüfte tatsächlich gespielte Fortsetzung (playedLine) sind nach FEN und Zug geprüft, aber begrenzt. Vergleiche beide ausdrücklich, bevor du schachliche Ursachen behauptest. Keine Zahlenliste.'};}
export function combineReviewCost(reply:StrategicReply,costUsd:number|null,config:ProviderOptions&{model:string},traceId:number){
 if(!reply.provenance)reply.provenance={provider:config.provider==='openrouter'?'OpenRouter':'OpenAI',model:config.model,requestedModel:config.model,reasoning:config.reasoning??null,costUsd:null,traceId};
 if(reply.provenance){const current=reply.provenance.costUsd;reply.provenance={...reply.provenance,costUsd:current!==null&&costUsd!==null?current+costUsd:null,calls:2};}
 return reply;
}
