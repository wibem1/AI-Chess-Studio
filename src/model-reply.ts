import {validateReply,type StrategicReply} from './dialogue.js';
const REMOVED_MOVES='Nicht regelkonforme Zugvorschläge wurden nicht übernommen.';
/** Free chat accepts completed prose; legacy structured replies still reject broken JSON. */
export function decodeModelContent(content:unknown,structuredExpected=true):unknown{
 if(typeof content!=='string'||!content.trim()||content.length>60000)throw new Error('Keine lesbare Modellantwort.');
 const text=content.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i,'$1').trim();
 try{const value=JSON.parse(text);if(!structuredExpected&&typeof value!=='string'&&!(value&&typeof value==='object'&&['message','answer','explanation'].some(k=>typeof value[k]==='string')))return {message:text};return typeof value==='string'?{message:value}:value;}catch{
  if(structuredExpected&&(/^[{\[]/.test(text)||text.startsWith('```')))throw new Error('Unvollständige strukturierte Antwort.');
  return {message:text};
 }
}
/** Require the actual explanation; optional presentation fields must not destroy it. */
export function normalizeModelReply(raw:unknown,legalMoves:string[]):StrategicReply{
 if(typeof raw!=='object'||raw===null||Array.isArray(raw))throw new Error('Keine Dialogantwort.');
 const r=raw as Record<string,unknown>,text=(v:unknown,max:number)=>typeof v==='string'&&v.trim()&&v.length<=max?v.trim():'';
 const review=r.gameReview as StrategicReply['gameReview'];
 const message=text(r.message,12000)||text(r.answer,12000)||text(r.explanation,12000)||text(review?.summary,1200);
 if(!message)throw new Error('Dialogantwort fehlt.');
 const candidates=Array.isArray(r.candidates)?[...new Set(r.candidates.filter((m):m is string=>typeof m==='string'&&legalMoves.includes(m)))].slice(0,8):[];
 const removed=Array.isArray(r.candidates)&&r.candidates.some(m=>typeof m!=='string'||!legalMoves.includes(m));
 const reply:StrategicReply={message,plan:text(r.plan,4000),opponent:text(r.opponent,4000),risks:text(r.risks,4000),playability:text(r.playability,4000),candidates,openQuestions:Array.isArray(r.openQuestions)?r.openQuestions.filter((q):q is string=>typeof q==='string'&&!!q.trim()&&q.length<=2000).slice(0,8):[]};
 // Reuse the strict validator for optional blocks without requiring them to exist.
 const scaffold={plan:'x',opponent:'x',risks:'x',playability:'x',candidates:[],openQuestions:[]};
 if(r.assessment!==undefined)try{const a=validateReply({...scaffold,assessment:r.assessment},legalMoves).assessment;if(a)reply.assessment=a;}catch{}
 if(r.humanFactors!==undefined)try{const h=validateReply({...scaffold,humanFactors:r.humanFactors},legalMoves).humanFactors;if(h)reply.humanFactors=h;}catch{}
 if(r.gameReview!==undefined)reply.gameReview=review!; // Historical validation is mandatory at the review boundary.
 if(removed||Array.isArray(r.formatNotes)&&r.formatNotes.includes(REMOVED_MOVES))reply.formatNotes=[REMOVED_MOVES];
 return reply;
}
