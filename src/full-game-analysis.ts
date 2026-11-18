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
 const scores:(number|null)[]=[],historyBoard=new Chess(rootFen);
 for(const [i,fen] of positions.entries()){
  if(signal?.aborted)throw new Error('Partieanalyse abgebrochen.');
  if(i>0)historyBoard.move(moves[i-1]!);
  // A FEN-only Chess instance loses repetition history; the complete
  // game record detects the third occurrence before asking the UCI engine.
  const terminal=gameResultCp(historyBoard);
  if(terminal!==null){scores.push(terminal);update(i+1,positions.length);continue;}
  let report:TacticalReport|undefined;
  for(let attempt=0;attempt<2;attempt++){
   try {
    report=validateTacticalReport(await adapter.check(fen,null,{rootFen,moves:moves.slice(0,i)}),fen);
    break;
   }catch(error){
    if(signal?.aborted)throw new Error('Partieanalyse abgebrochen.');
    const reason=error instanceof Error?error.message:'Unbekannter Stockfish-Fehler';
    const transient=/Stockfish-Prüfung: (Keine gültige Hauptvariante|Abschließender Zug)|Browser-Spielengine: illegale oder falsche Zugantwort/u.test(reason);
    if(attempt===0&&transient)continue; // Exactly one new-worker attempt for a malformed search response.
    const at=i===0?'Ausgangsstellung':`${Math.ceil(i/2)}${i%2===0?'…':'.'}${moves[i-1]}`;
    throw new Error(`Stockfish-Gesamtprüfung bei Stellung ${i+1}/${positions.length} (nach ${at}) fehlgeschlagen: ${reason}. FEN: ${fen}`);
   }
  }
  if(signal?.aborted)throw new Error('Partieanalyse abgebrochen.');
  if(report?.candidate!==null||!report)throw new Error('Unerwartete Kandidatenprüfung.');
  scores.push(scoreToCp(report));update(i+1,positions.length);
 }
 return makeFullGameAnalysis(rootFen,moves,scores,nodeIds);
}
/** Compact Stockfish evidence for a human-readable game review.
 * The complete SAN history is sent separately; repeating every score and FEN
 * here adds cost without improving the narrative.
 */
export function fullGameSummary(report:FullGameAnalysis,maxIssues=4):string{
 const line=(p:PlayerQuality)=>`${p.averageLossCp??'–'} cp mittlerer Bewertungsverlust, ${p.mistakes} Fehler, ${p.blunders} grobe Fehler`;
 const label=(r:ScoredMove)=>`${Math.ceil(r.ply/2)}${r.side==='w'?'.':'…'}${r.san}`;
 const score=(cp:number|null)=>cp===null?'?':`${cp>=0?'+':''}${(cp/100).toFixed(2)}`;
 const issues=report.records.filter(r=>r.lossCp!==null&&r.grade!=='gut')
  .sort((a,b)=>b.lossCp!-a.lossCp!).slice(0,maxIssues)
  .map(r=>`${label(r)} (${r.grade}, Verlust ${r.lossCp} cp; ${score(r.beforeCp)} → ${score(r.afterCp)})`).join('; ');
 return `Stockfish-Kurzbefund: Weiß ${line(report.players.white)}; Schwarz ${line(report.players.black)}. Auffällige Züge: ${issues||'keine klaren Ausschläge'}. Prüfung je Stellung: Tiefe 12, 20.000 Knoten, 1 s; grobe Orientierung, keine bestätigte Fehlerursache.`;
}

/** One compact evidence block; the full SAN move history remains intact elsewhere. */
export function fullGameContext(report:FullGameAnalysis):string[]{
 return [fullGameSummary(report)];
}

/** Intent gate for factual whole-game reviews. Do not depend on one exact
 * phrasing; otherwise even a saved report can be silently omitted.
 */
export function asksAboutGameQuality(question:string):boolean{
 const q=question.toLocaleLowerCase('de-DE');
 if(/partie|spielverlauf|spielqualität|spielstärke|schlüsselstell|wendepunkt|partieanalyse|partiebewert/u.test(q))return true;
 const issue=/fehler|patzer|blunder|verlust|schlecht|entscheid|kritisch|bewert|analyse|analys|stärke|qualität|leistung|zug|züge|gespielt|spielte|spielt|gut/u.test(q);
 return issue&&/schwarz|weiß|weiss|maia|spiel|züge|zug|fehler/u.test(q);
}
