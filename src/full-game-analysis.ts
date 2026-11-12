import {Chess} from 'chess.js';
import type {TacticalAdapter,TacticalReport} from './tactics.js';
import {validateTacticalReport} from './tactics.js';

export type MoveGrade='gut'|'Ungenauigkeit'|'Fehler'|'grober Fehler'|'nicht bewertet';
export interface ScoredMove {
 ply:number;san:string;side:'w'|'b';before:string;after:string;grade:MoveGrade;
 lossCp:number|null;beforeCp:number|null;afterCp:number|null;nodeId:string|null;
}
export interface PlayerQuality {
 side:'w'|'b';evaluated:number;averageLossCp:number|null;
 inaccuracies:number;mistakes:number;blunders:number;
}
/** Pure scoring model, not Lichess accuracy or a player Elo estimate. */
export interface FullGameAnalysis {
 rootFen:string;moves:string[];records:ScoredMove[];players:{white:PlayerQuality;black:PlayerQuality};
 limits:{depth:12;nodes:20000;milliseconds:1000};completed:boolean;
}

export function gameResultCp(board:Chess):number|null{
 if(board.isCheckmate())return board.turn()==='w'?-1500:1500;
 if(board.isDraw())return 0;
 return null;
}
export function scoreToCp(report:TacticalReport):number{
 return report.score.unit==='cp'?Math.max(-1500,Math.min(1500,report.score.value)):
 report.score.value>0?1500:report.score.value<0?-1500:0;
}
export function classifyLoss(loss:number):MoveGrade{
 if(loss>=250)return 'grober Fehler';
 if(loss>=120)return 'Fehler';
 if(loss>=50)return 'Ungenauigkeit';
 return 'gut';
}
export function summarizePlayer(records:readonly ScoredMove[],side:'w'|'b'):PlayerQuality{
 const items=records.filter(m=>m.side===side&&m.lossCp!==null);
 return {side,evaluated:items.length,averageLossCp:items.length?Math.round(items.reduce((sum,m)=>sum+m.lossCp!,0)/items.length):null,
  inaccuracies:items.filter(m=>m.grade==='Ungenauigkeit').length,
  mistakes:items.filter(m=>m.grade==='Fehler').length,
  blunders:items.filter(m=>m.grade==='grober Fehler').length};
}
export function makeFullGameAnalysis(rootFen:string,moves:string[],scores:(number|null)[],nodeIds:string[]=[]):FullGameAnalysis{
 if(!Array.isArray(moves)||moves.length<1||moves.length>500||scores.length!==moves.length+1)throw new Error('Unvollständige Partieanalyse.');
 const board=new Chess(rootFen),records:ScoredMove[]=[];
 for(const [index,san] of moves.entries()){
  const before=board.fen(),side=board.turn();
  if(!board.moves().includes(san))throw new Error('Ungültiger historischer Zug.');
  board.move(san);const after=board.fen();
  const beforeCp=scores[index]??null,afterCp=scores[index+1]??null;
  const lossCp=beforeCp===null||afterCp===null?null:Math.max(0,Math.min(3000,Math.round((beforeCp-afterCp)*(side==='w'?1:-1))));
  records.push({ply:index+1,san,side,before,after,grade:lossCp===null?'nicht bewertet':classifyLoss(lossCp),lossCp,beforeCp,afterCp,nodeId:nodeIds[index]??null});
 }
 return {rootFen,moves:[...moves],records,players:{white:summarizePlayer(records,'w'),black:summarizePlayer(records,'b')},
 limits:{depth:12,nodes:20000,milliseconds:1000},completed:true};
}
/** Explicit user-triggered local full-game scan; no provider calls. Abort never returns partial statistics. */
export async function scanFullGame(
 rootFen:string,moves:string[],adapter:TacticalAdapter,
 update:(done:number,total:number)=>void=()=>{},
 signal?:AbortSignal,nodeIds:string[]=[]
):Promise<FullGameAnalysis>{
 if(!Array.isArray(moves)||moves.length<2||moves.length>300)throw new Error('Für die vollständige Prüfung sind 2 bis 300 Halbzüge nötig.');
 const board=new Chess(rootFen),positions=[board.fen()];
 for(const san of moves){if(!board.moves().includes(san))throw new Error('Ungültiger Partieverlauf.');board.move(san);positions.push(board.fen());}
 const scores:(number|null)[]=[];
 for(const [i,fen] of positions.entries()){
  if(signal?.aborted)throw new Error('Partieanalyse abgebrochen.');
  const position=new Chess(fen),terminal=gameResultCp(position);
  if(terminal!==null){scores.push(terminal);update(i+1,positions.length);continue;}
  const report=validateTacticalReport(await adapter.check(fen,null,{rootFen,moves:moves.slice(0,i)}),fen);
  if(signal?.aborted)throw new Error('Partieanalyse abgebrochen.');
  if(report.candidate!==null)throw new Error('Unerwartete Kandidatenprüfung.');
  scores.push(scoreToCp(report));update(i+1,positions.length);
 }
 return makeFullGameAnalysis(rootFen,moves,scores,nodeIds);
}
/** Compact, factual context for the learning KI; deliberately no fabricated accuracy percentages. */
export function fullGameSummary(report:FullGameAnalysis,maxIssues=8):string{
 const line=(p:PlayerQuality)=>`${p.side==='w'?'Weiß':'Schwarz'}: ${p.evaluated} bewertete Züge; mittlerer geschätzter Bewertungsverlust ${p.averageLossCp??'–'} cp; Ungenauigkeiten ${p.inaccuracies}; Fehler ${p.mistakes}; grobe Fehler ${p.blunders}.`;
 const issues=report.records.filter(r=>r.lossCp!==null&&r.grade!=='gut').sort((a,b)=>b.lossCp!-a.lossCp!).slice(0,maxIssues)
 .map(r=>`${Math.ceil(r.ply/2)}${r.side==='w'?'.':'…'}${r.san}: ${r.grade} (Verlust ${r.lossCp} cp, FEN davor ${r.before})`).join(' | ');
 return `Lokal geprüfte Stockfish-Partieanalyse (keine Lichess-Genauigkeit/Elo): ${line(report.players.white)} ${line(report.players.black)} Auffällige Züge: ${issues||'keine'}. Grenzen je Stellung: Tiefe 12, 20.000 Knoten, 1 s. Die Klassifikation ist näherungsweise, Mattbewertungen sind auf ±1500 cp abgebildet; die Bewertung allein beweist keine menschliche Spielstärke. Bitte Qualität beider Spieler anhand dieser konkreten Befunde und der Pläne beurteilen; Fehler nicht erfinden.`;
}
