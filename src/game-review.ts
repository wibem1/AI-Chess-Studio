import type {Annotation,SessionData} from './session.js';
import {pathTo} from './game.js';
import {Chess} from 'chess.js';
import {parseMarks,type BoardMark} from './coach-tools.js';
import {germanSan,germanMoveFromFen} from './german-notation.js';

export interface GameReview {
 summary:string;
 /** Local note when prose is shortened or an unsafe key moment is omitted. */
 notice?:'invalid-moments-omitted'|'text-shortened'|'text-shortened-and-invalid-moments-omitted';
 moments:{ply:number;played:string;explanation:string;alternative:string;reason:string;marks?:BoardMark[];steps?:{text:string;marks:BoardMark[]}[]}[];
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
function compactReviewText(value:string,limit:number):{text:string;shortened:boolean}{
 const text=value.trim();
 if(text.length<=limit)return {text,shortened:false};
 const candidate=text.slice(0,limit);
 const sentence=Math.max(candidate.lastIndexOf('. '),candidate.lastIndexOf('! '),candidate.lastIndexOf('? '));
 const boundary=sentence>=limit*0.55?sentence+1:candidate.lastIndexOf(' ');
 return {text:candidate.slice(0,boundary>0?boundary:limit).trimEnd()+'…',shortened:true};
}
export function validateGameReview(raw:unknown,history:{rootFen:string;moves:string[];truncated:boolean}|undefined,sanitizeInvalidAlternatives=false):GameReview {
 if(!history || history.truncated || !history.moves.length)throw new ReviewValidationError('Analyse verworfen: Die vollständige Zugfolge fehlt.');
 let r=raw as GameReview|undefined;
  let textShortened=false;
  if(sanitizeInvalidAlternatives&&r&&typeof r==='object'){
   const summary=typeof r.summary==='string'?compactReviewText(r.summary,600):undefined;
   const lesson=typeof r.lesson==='string'?compactReviewText(r.lesson,220):undefined;
   const moments=Array.isArray(r.moments)?r.moments.map(m=>{
    if(!m||typeof m!=='object')return m;
    const explanation=typeof m.explanation==='string'?compactReviewText(m.explanation,320):undefined;
    const reason=typeof m.reason==='string'?compactReviewText(m.reason,180):undefined;
    textShortened=textShortened||!!explanation?.shortened||!!reason?.shortened;
    return {...m,...(explanation?{explanation:explanation.text}:{}),...(reason?{reason:reason.text}:{})};
   }):r.moments;
   textShortened=!!summary?.shortened||!!lesson?.shortened||textShortened;
   r={...r,...(summary?{summary:summary.text}:{}),...(lesson?{lesson:lesson.text}:{}),moments};
  }
 const text=(s:unknown,max:number)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 if(!r||!text(r.summary,2000)||!text(r.lesson,800)||!Array.isArray(r.moments)||r.moments.length<Math.min(2,history.moves.length)||r.moments.length>6)throw new ReviewValidationError('Analyse verworfen: Erwartet werden ein Überblick, eine Lernfolgerung und zwei bis sechs Schlüsselstellungen (Lernmomente) mit Beschreibung.');
 if(r.notice!==undefined&&!['invalid-moments-omitted','text-shortened','text-shortened-and-invalid-moments-omitted'].includes(r.notice))throw new ReviewValidationError('Analyse verworfen: Unbekannter Prüfhinweis.');
 const board=new Chess(history.rootFen),before:string[]=[];
 for(const san of history.moves){before.push(board.fen());board.move(san);}
 const problems:string[]=[];
 const safeMoments:GameReview['moments']=[];
 let previous=0;
 for(const m of r.moments){
  if(!m||!Number.isInteger(m.ply)||m.ply<=previous||m.ply>before.length||m.played!==history.moves[m.ply-1]||!text(m.explanation,1000)||!text(m.reason,700)||typeof m.alternative!=='string'){problems.push('Eine Schlüsselstellung enthält einen ungültigen Bezug zur Zugfolge oder eine fehlende Beschreibung.');continue;}
  // Illustrative arrows originate at an occupied square in the historical position.
  // Use lines for connections without a source piece; neither implies a legal move.
  const position=new Chess(before[m.ply-1]!);
  const checkedMarks=(value:unknown):BoardMark[]=>{
   const checked=parseMarks(value);
   if(checked.some(mark=>mark.kind==='arrow'&&!position.get(mark.from as import('chess.js').Square)))
    throw new Error('Ein Pfeil hat keine Ausgangsfigur.');
   return checked;
  };
  let marks:BoardMark[]|undefined;
  if(m.marks!==undefined){
   try{
    marks=checkedMarks(m.marks);
    if(marks.length>4)throw new Error('Zu viele Erklärungspfeile.');
   }catch{
    if(!sanitizeInvalidAlternatives){problems.push('Eine Schlüsselstellung enthält ungültige Brettpfeile.');continue;}
    marks=undefined; // Keep the review, but never persist untrusted drawing instructions.
   }
  }
  let steps:NonNullable<typeof m.steps>|undefined;
  if(m.steps!==undefined){
   try{
    if(!Array.isArray(m.steps)||m.steps.length<1||m.steps.length>3)throw new Error('Ungültige Lernschritte.');
    steps=m.steps.map(s=>{
     if(!s||typeof s.text!=='string'||!s.text.trim()||s.text.length>180)throw new Error('Ungültiger Lernschritt.');
     const checked=checkedMarks(s.marks);
     if(checked.length<1||checked.length>3)throw new Error('Ungültige Lernpfeile.');
     return {text:s.text.trim(),marks:checked};
    });
   }catch{
    if(!sanitizeInvalidAlternatives){problems.push('Eine Schlüsselstellung enthält ungültige Lernschritte.');continue;}
    steps=undefined;
   }
  }
  const clean={...m};
  if(marks===undefined)delete clean.marks;else clean.marks=marks;
  if(steps===undefined)delete clean.steps;else clean.steps=steps;
  if(m.alternative && (m.alternative===m.played||!position.moves().includes(m.alternative))){
   const label=germanMoveFromFen(position.fen(),m.played);
   if(sanitizeInvalidAlternatives){
    // Keep the checked historic move and its description, never a bogus alternative or its rationale.
    safeMoments.push({...clean,alternative:'',reason:'Der KI-Vorschlag für einen Alternativzug war in dieser Stellung nicht legal und wurde entfernt. Ein anderer Zug wurde nicht geprüft.'});
   }else problems.push(`Bei ${label}: Der Alternativzug ${/^[a-zA-Z0-9=+#-]{1,16}$/.test(m.alternative)?m.alternative:'(ungültige Schreibweise)'} ist nicht legal oder entspricht dem gespielten Zug.`);
  }else safeMoments.push(clean);
  previous=m.ply;
 }
 if(problems.length&&(!sanitizeInvalidAlternatives||safeMoments.length<Math.min(2,history.moves.length)))throw new ReviewValidationError('Analyse verworfen: '+problems.join(' '));
 // A retrospective must discuss the path to the result, not only the last move.
 if(history.moves.length>=8 && safeMoments.every(m=>m.ply>history.moves.length-2))throw new ReviewValidationError('Analyse verworfen: Alle Schlüsselstellungen betreffen nur die Schlusszüge (letzten beiden Halbzüge).');
 if(!sanitizeInvalidAlternatives)return r;
 const sanitized:GameReview={...r,moments:safeMoments};
 const hadOmission=problems.length>0||r.notice==='invalid-moments-omitted'||r.notice==='text-shortened-and-invalid-moments-omitted';
 const hadShortening=textShortened||r.notice==='text-shortened'||r.notice==='text-shortened-and-invalid-moments-omitted';
 if(hadOmission&&hadShortening)sanitized.notice='text-shortened-and-invalid-moments-omitted';
 else if(hadOmission)sanitized.notice='invalid-moments-omitted';
 else if(hadShortening)sanitized.notice='text-shortened';
 else delete sanitized.notice;
 return sanitized;
}
export function formatGameReview(r:GameReview,history:{rootFen:string;moves:string[]}):string {
 const board=new Chess(history.rootFen),labels:string[]=[];
 for(const san of history.moves){labels.push(germanMoveFromFen(board.fen(),san));board.move(san);}
 const notice=r.notice==='invalid-moments-omitted'?'\n\nHinweis: Eine oder mehrere unvollständige KI-Schlüsselstellungen wurden ausgelassen. Keine zusätzliche Reparaturanfrage.':r.notice==='text-shortened-and-invalid-moments-omitted'?'\n\nHinweis: Eine oder mehrere unvollständige KI-Schlüsselstellungen wurden ausgelassen; lange Abschnitte wurden gekürzt. Keine zusätzliche Anfrage.':r.notice==='text-shortened'?'\n\nHinweis: Zu lange Abschnitte wurden für die kompakte Anzeige gekürzt.':'';
 return `Partierückblick\n${r.summary}${notice}\n\n${r.moments.map(m=>`${labels[m.ply-1]}\n${m.explanation}\n${m.alternative?`Alternative zum Prüfen: ${germanSan(m.alternative)}. `:''}${m.reason}`).join('\n\n')}\n\nFür deine nächste Partie: ${r.lesson}\n\nZüge und Alternativen sind regelgeprüft; strategische Einschätzungen bleiben vorläufig.`;
}
