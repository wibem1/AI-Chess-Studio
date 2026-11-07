import {Chess} from 'chess.js';

export interface GameReview {
 summary:string;
 moments:{ply:number;played:string;explanation:string;alternative:string;reason:string}[];
 lesson:string;
}
/** Detect explicit whole-game requests; ordinary move questions keep their position scope. */
export function asksForGameReview(question:string):boolean {
 return /\b(?:analysier\w*|besprich|untersuch\w*|beurteil\w*)\s+(?:(?:bitte|mir)\s+)*(?:(?:das|die|mein(?:e)?|dieses?|gesamte|ganze|bisherige)\s+)*(?:spiel|partie)\b/iu.test(question);
}
export function validateGameReview(raw:unknown,history:{rootFen:string;moves:string[];truncated:boolean}|undefined):GameReview {
 if(!history || history.truncated || !history.moves.length)throw new Error('Für den Partierückblick fehlt die vollständige Zugfolge.');
 const r=raw as GameReview|undefined;
 const text=(s:unknown,max:number)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 if(!r||!text(r.summary,1200)||!text(r.lesson,800)||!Array.isArray(r.moments)||r.moments.length<Math.min(2,history.moves.length)||r.moments.length>4)throw new Error('Partieanalyse ohne konkrete Lernmomente verworfen.');
 const board=new Chess(history.rootFen),before:string[]=[];
 for(const san of history.moves){before.push(board.fen());board.move(san);}
 let previous=0;
 for(const m of r.moments){
  if(!m||!Number.isInteger(m.ply)||m.ply<=previous||m.ply>before.length||m.played!==history.moves[m.ply-1]||!text(m.explanation,1000)||!text(m.reason,700)||typeof m.alternative!=='string')throw new Error('Lernmoment passt nicht zur tatsächlichen Zugfolge.');
  const position=new Chess(before[m.ply-1]!);
  if(m.alternative && (m.alternative===m.played||!position.moves().includes(m.alternative)))throw new Error('Alternative ist in der historischen Stellung nicht legal oder kein anderer Zug.');
  previous=m.ply;
 }
 // A retrospective must discuss the path to the result, not only the last move.
 if(history.moves.length>=8 && r.moments.every(m=>m.ply>history.moves.length-2))throw new Error('Partieanalyse beschreibt nur die Schlusszüge.');
 return r;
}
export function formatGameReview(r:GameReview,history:{rootFen:string;moves:string[]}):string {
 const board=new Chess(history.rootFen),labels:string[]=[];
 for(const san of history.moves){labels.push(`${board.fen().split(' ')[5]}${board.turn()==='b'?'…':'.'} ${san}`);board.move(san);}
 return `Partierückblick\n${r.summary}\n\n${r.moments.map(m=>`${labels[m.ply-1]}\n${m.explanation}\n${m.alternative?`Alternative zum Prüfen: ${m.alternative}. `:''}${m.reason}`).join('\n\n')}\n\nFür deine nächste Partie: ${r.lesson}\n\nDie genannten Züge und Alternativen sind regelgeprüft. Ihre strategische Bewertung ist eine KI-Einschätzung; ohne gesonderten Faktencheck keine bestätigte Engineanalyse.`;
}
