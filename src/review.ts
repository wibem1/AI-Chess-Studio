import { Chess, DEFAULT_POSITION } from 'chess.js';
import type { SessionData } from './session.js';

export type PlayerColor = 'w' | 'b';
export const REVIEW_QUESTIONS = [
  {key:'idea',text:'Was wolltest du in dieser Stellung erreichen?'},
  {key:'expected',text:'Welche Antwort des Gegners hast du erwartet?'},
  {key:'alternatives',text:'Welche Alternativen hast du erwogen?'},
  {key:'change',text:'Hat sich dein Plan im Verlauf verändert?'}
] as const;
export type ReviewQuestion = typeof REVIEW_QUESTIONS[number]['key'];
export type DecisionAnswers = Partial<Record<ReviewQuestion,string>>;
export interface ReviewState {
  pgn:string; original:string[]; human:PlayerColor; decision:number;
  revealed:number[]; responses:Record<string,DecisionAnswers>; guiding:boolean; completed:boolean;
}
export interface RecordedPly {
  san:string; before:string; after:string; color:PlayerColor; number:number;
  comment:string; clock:number|null; spent:number|null;
}
export interface ParsedGame {rootFen:string;headers:Record<string,string>;moves:RecordedPly[];rootComment:string}
const MAX_PGN = 262144;
const clockSeconds = (text:string):number|null => {
 const parts=text.trim().split(':').map(Number);
 if((parts.length!==2 && parts.length!==3) || parts.some(n=>!Number.isFinite(n)||n<0) || parts.at(-1)!>=60 || parts.length===3 && parts[1]!>=60)return null;
 const value=parts.length===3?parts[0]!*3600+parts[1]!*60+parts[2]!:parts[0]!*60+parts[1]!;
 return value<=2678400?value:null;
};
export function parsePgn(pgn:string):ParsedGame {
 if(typeof pgn!=='string'||!pgn.trim()||new TextEncoder().encode(pgn).length>MAX_PGN)throw new Error('Bitte eine PGN mit höchstens 256 KiB einfügen.');
 const chess=new Chess();
 try{chess.loadPgn(pgn,{strict:true});}catch{throw new Error('PGN konnte nicht gelesen werden. Zugfolge, SAN-Schreibweise und Startstellung prüfen.');}
 const history=chess.history({verbose:true});
 if(!history.length || history.length>1000)throw new Error('Die PGN muss zwischen 1 und 1000 Halbzüge enthalten.');
 const headers=chess.getHeaders();
 if(Object.keys(headers).length>100 || Object.entries(headers).some(([k,v])=>k.length>80 || v.length>1000))throw new Error('PGN-Kopfdaten sind zu groß.');
 const rootFen=history[0]!.before;
 const comments=new Map(chess.getComments().map(c=>[c.fen,c.comment]));
 const control=/^(\d+)(?:\+(\d+))?$/.exec(headers.TimeControl??'');
 const base=control&&rootFen===DEFAULT_POSITION?Number(control[1]):null;
 const increment=control?Number(control[2]??0):null;
 const previous:Record<PlayerColor,number|null>={w:base,b:base};
 const moves=history.map(move=>{
  const comment=comments.get(move.after)??'';
  const clk=/\[%clk\s+([^\]]+)\]/.exec(comment);
  const clock=clk?clockSeconds(clk[1]!):null;
  const prior=previous[move.color];
  const elapsed=clock!==null && prior!==null && increment!==null?prior+increment-clock:null;
  const spent=elapsed!==null && elapsed>=-0.01?Math.max(0,Math.round(elapsed*1000)/1000):null;
  // Missing clocks break the adjacent same-side pair; never attribute two moves to one.
  previous[move.color]=clock;
  return {san:move.san,before:move.before,after:move.after,color:move.color,number:Number(move.before.split(' ')[5]),comment,clock,spent};
 });
 return {rootFen,headers,moves,rootComment:comments.get(rootFen)??''};
}
export function identifyPlayer(game:ParsedGame,choice:PlayerColor|'auto',name:string):PlayerColor {
 if(choice==='w'||choice==='b')return choice;
 const target=name.trim().toLocaleLowerCase();
 const white=!!target&&game.headers.White?.toLocaleLowerCase()===target;
 const black=!!target&&game.headers.Black?.toLocaleLowerCase()===target;
 if(white===black)throw new Error('Deine Farbe ist nicht eindeutig. Bitte Weiß oder Schwarz wählen.');
 return white?'w':'b';
}
export function reviewDecisions(review:ReviewState,data:SessionData):number[] {
 return review.original.slice(0,-1).flatMap((id,index)=>data.nodes.find(n=>n.id===id)!.fen.split(' ')[1]===review.human?[index]:[]);
}
export function reviewLocked(data:SessionData):boolean {
 const r=data.review;return !!r && r.guiding && !r.revealed.includes(r.decision);
}
export function visibleReviewNodes(data:SessionData):Set<string> {
 const r=data.review;if(!r||!r.guiding)return new Set(data.nodes.map(n=>n.id));
 const limit=r.decision+(r.revealed.includes(r.decision)?1:0);
 const original=new Map(r.original.map((id,index)=>[id,index]));
 const visible=new Set<string>();
 for(const node of data.nodes){
  const index=original.get(node.id);
  if((node.parentId===null||visible.has(node.parentId))&&(index===undefined||index<=limit))visible.add(node.id);
 }
 return visible;
}
export function validateReview(raw:unknown,data:SessionData):ReviewState {
 if(!raw||typeof raw!=='object')throw new Error('Ungültiger Partierückblick.');
 const r=raw as ReviewState,game=parsePgn(r.pgn);
 if(!Array.isArray(r.original)||r.original.length!==game.moves.length+1||new Set(r.original).size!==r.original.length||r.original[0]!=='n0'||!['w','b'].includes(r.human)||typeof r.guiding!=='boolean'||typeof r.completed!=='boolean'||!r.responses||typeof r.responses!=='object'||Array.isArray(r.responses))throw new Error('Ungültige Originalpartie.');
 for(const [i,id] of r.original.entries()){
  const node=data.nodes.find(n=>n.id===id);
  if(!node || node.fen!==(i===0?game.rootFen:game.moves[i-1]!.after)||node.san!==(i===0?null:game.moves[i-1]!.san)||node.parentId!==(i===0?null:r.original[i-1]))throw new Error('PGN und Originalpartie widersprechen sich.');
 }
 const decisions=reviewDecisions(r,data);
 if(!decisions.includes(r.decision)||!Array.isArray(r.revealed)||r.revealed.some(i=>!decisions.includes(i))||new Set(r.revealed).size!==r.revealed.length)throw new Error('Ungültige Rückblickposition.');
 const responses:Record<string,DecisionAnswers>={};
 for(const [id,answers] of Object.entries(r.responses)){
  if(!decisions.some(i=>r.original[i]===id)||!answers||typeof answers!=='object'||Array.isArray(answers))throw new Error('Ungültige eigene Angaben.');
  const clean:DecisionAnswers={};
  for(const {key} of REVIEW_QUESTIONS)if(answers[key]!==undefined){
   if(typeof answers[key]!=='string'||!answers[key]!.trim()||answers[key]!.length>600)throw new Error('Eigene Angaben: maximal 600 Zeichen je Antwort.');
   clean[key]=answers[key]!.trim();
  }
  if(Object.keys(answers).some(k=>!REVIEW_QUESTIONS.some(q=>q.key===k)))throw new Error('Unbekannte Rückblickfrage.');
  responses[id]=clean;
 }
 return {pgn:r.pgn,original:[...r.original],human:r.human,decision:r.decision,revealed:[...r.revealed],responses,guiding:r.guiding,completed:r.completed};
}
export function repetitionCount(data:SessionData,id:string):number {
 const node=data.nodes.find(n=>n.id===id);if(!node)throw new Error('Unbekannte Stellung.');
 const key=node.fen.split(' ').slice(0,4).join(' ');let count=0,current:typeof node|undefined=node;
 while(current){if(current.fen.split(' ').slice(0,4).join(' ')===key)count++;const parentId:string|null=current.parentId;current=parentId===null?undefined:data.nodes.find(n=>n.id===parentId);}
 return count;
}
/** Evidence-only local summary; no diagnosis or invented motive. */
export function reviewSummary(data:SessionData):string[] {
 const r=data.review;if(!r)return [];
 const rows:string[]=[];
 for(const index of reviewDecisions(r,data)){
  const id=r.original[index]!,answers=r.responses[id];if(!answers)continue;
  const number=data.nodes.find(n=>n.id===id)!.fen.split(' ')[5];
  rows.push(`Vor ${number}${r.human==='b'?'...':'.'}: ${REVIEW_QUESTIONS.filter(q=>answers[q.key]).map(q=>`${q.text} – Deine Angabe: ${answers[q.key]}`).join(' / ')}`);
 }
 return rows.length?rows:['Noch keine eigenen Erklärungen gespeichert. Daraus lassen sich keine persönlichen Muster ableiten.'];
}
