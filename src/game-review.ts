import type {Annotation,SessionData} from './session.js';
import {pathTo} from './game.js';
import {Chess} from 'chess.js';
import {parseMarks,type BoardMark} from './coach-tools.js';
import {germanSan,germanMoveFromFen} from './german-notation.js';

export interface GameReview {
 summary:string;
 moments:{ply:number;played:string;explanation:string;alternative:string;reason:string;marks?:BoardMark[]}[];
 lesson:string;
}
export function asksForKeyMoments(question:string):boolean{
 return /schl(?:ü|ue|u)ssel(?:stelle(?:n)?|stellung(?:en)?|position(?:en)?|moment(?:en?)?)|wendepunkt(?:en?)?/iu.test(question)&&(/\b(?:spiel(?:s|es)?|partie)\b/iu.test(question)||/\b(?:welche|was\s+waren|wo\s+waren|zeig\w*|nenn\w*|find\w*|analysier\w*)\b/iu.test(question));
}
export interface ReviewAnchor{nodeId:string;ply:number;label:string}
export function reviewAnchors(data:SessionData,annotation:Annotation):ReviewAnchor[]{
 if(annotation.kind!=='dialogue'||annotation.source!=='model'||!annotation.gameReview&&!annotation.text.startsWith('Partierückblick\n'))return [];
 const line=pathTo(data,annotation.nodeId);
 const label=(ply:number)=>{const before=line[ply-1]!,move=line[ply]!;return germanMoveFromFen(before.fen,move.san!);};
 const legacyLabel=(ply:number)=>{const before=line[ply-1]!,move=line[ply]!;return `${before.fen.split(' ')[5]}${before.fen.split(' ')[1]==='b'?'…':'.'} ${move.san}`;};
 if(annotation.gameReview)return annotation.gameReview.moments.map(m=>({nodeId:line[m.ply-1]!.id,ply:m.ply,label:label(m.ply)}));
 // Older saved analyses already contain checked move labels. Keep their navigation usable.
 if(!annotation.text.startsWith('Partierückblick\n'))return [];
 const result:ReviewAnchor[]=[];
 for(const match of annotation.text.matchAll(/^(\d+)(…|\.) (\S+)$/gm)){
  const ply=line.findIndex((n,i)=>i>0&&(legacyLabel(i)===match[0]||label(i)===match[0]));if(ply>0&&!result.some(a=>a.ply===ply))result.push({nodeId:line[ply-1]!.id,ply,label:label(ply)});
 }
 return result.sort((a,b)=>a.ply-b.ply);
}
/** Detect explicit whole-game requests; ordinary move questions keep their position scope. */
export function asksForGameReview(question:string):boolean {
 return asksForKeyMoments(question)||/\b(?:analysier\w*|besprich|untersuch\w*|beurteil\w*)\s+(?:(?:bitte|mir)\s+)*(?:(?:das|die|mein(?:e)?|dieses?|gesamte|ganze|bisherige)\s+)*(?:spiel|partie)\b/iu.test(question);
}
export class ReviewValidationError extends Error {}
export function validateGameReview(raw:unknown,history:{rootFen:string;moves:string[];truncated:boolean}|undefined,sanitizeInvalidAlternatives=false):GameReview {
 if(!history || history.truncated || !history.moves.length)throw new ReviewValidationError('Analyse verworfen: Die vollständige Zugfolge fehlt.');
 const r=raw as GameReview|undefined;
 const text=(s:unknown,max:number)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 if(!r||!text(r.summary,1200)||!text(r.lesson,800)||!Array.isArray(r.moments)||r.moments.length<Math.min(2,history.moves.length)||r.moments.length>6)throw new ReviewValidationError('Analyse verworfen: Erwartet werden ein Überblick, eine Lernfolgerung und zwei bis sechs Schlüsselstellungen (Lernmomente) mit Beschreibung.');
 const board=new Chess(history.rootFen),before:string[]=[];
 for(const san of history.moves){before.push(board.fen());board.move(san);}
 const problems:string[]=[];
 const safeMoments:GameReview['moments']=[];
 let previous=0;
 for(const m of r.moments){
  if(!m||!Number.isInteger(m.ply)||m.ply<=previous||m.ply>before.length||m.played!==history.moves[m.ply-1]||!text(m.explanation,1000)||!text(m.reason,700)||typeof m.alternative!=='string'){problems.push('Eine Schlüsselstellung enthält einen ungültigen Bezug zur Zugfolge oder eine fehlende Beschreibung.');continue;}
  // A diagram is only geometry bound to this exact historical position, never an engine proof.
  let marks:BoardMark[]|undefined;
  if(m.marks!==undefined){
   try{
    marks=parseMarks(m.marks);
    if(marks.length>4)throw new Error('Zu viele Erklärungspfeile.');
   }catch{
    if(!sanitizeInvalidAlternatives){problems.push('Eine Schlüsselstellung enthält ungültige Brettpfeile.');continue;}
    marks=undefined; // Keep the review, but never persist untrusted drawing instructions.
   }
  }
  const clean={...m,...(marks===undefined?{}:{marks})};
  if(marks===undefined)delete clean.marks;
  const position=new Chess(before[m.ply-1]!);
  if(m.alternative && (m.alternative===m.played||!position.moves().includes(m.alternative))){
   const label=germanMoveFromFen(position.fen(),m.played);
   if(sanitizeInvalidAlternatives){
    // Keep the checked historic move and its description, never a bogus alternative or its rationale.
    safeMoments.push({...clean,alternative:'',reason:'Der KI-Vorschlag für einen Alternativzug war in dieser Stellung nicht legal und wurde entfernt. Ein anderer Zug wurde nicht geprüft.'});
   }else problems.push(`Bei ${label}: Der Alternativzug ${/^[a-zA-Z0-9=+#-]{1,16}$/.test(m.alternative)?m.alternative:'(ungültige Schreibweise)'} ist nicht legal oder entspricht dem gespielten Zug.`);
  }else safeMoments.push(clean);
  previous=m.ply;
 }
 if(problems.length)throw new ReviewValidationError('Analyse verworfen: '+problems.join(' '));
 // A retrospective must discuss the path to the result, not only the last move.
 if(history.moves.length>=8 && r.moments.every(m=>m.ply>history.moves.length-2))throw new ReviewValidationError('Analyse verworfen: Alle Schlüsselstellungen betreffen nur die Schlusszüge (letzten beiden Halbzüge).');
 return sanitizeInvalidAlternatives?{...r,moments:safeMoments}:r;
}
export function formatGameReview(r:GameReview,history:{rootFen:string;moves:string[]}):string {
 const board=new Chess(history.rootFen),labels:string[]=[];
 for(const san of history.moves){labels.push(germanMoveFromFen(board.fen(),san));board.move(san);}
 return `Partierückblick\n${r.summary}\n\n${r.moments.map(m=>`${labels[m.ply-1]}\n${m.explanation}\n${m.alternative?`Alternative zum Prüfen: ${germanSan(m.alternative)}. `:''}${m.reason}`).join('\n\n')}\n\nFür deine nächste Partie: ${r.lesson}\n\nDie genannten Züge und Alternativen sind regelgeprüft. Ihre strategische Bewertung ist eine KI-Einschätzung; ohne gesonderten Faktencheck keine bestätigte Engineanalyse.`;
}
