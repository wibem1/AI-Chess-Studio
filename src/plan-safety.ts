import {Chess} from 'chess.js';
import {validateTacticalReport,type TacticalAdapter,type TacticalReport} from './tactics.js';
const cp=(r:TacticalReport)=>r.score.unit==='cp'?r.score.value:r.score.value>0?30000-Math.min(r.score.value,100)*10:r.score.value<0?-30000+Math.min(-r.score.value,100)*10:0;
/** Limited tactical veto. Passing is not proof of strategic quality. */
export async function checkProposedFirstMove(fen:string,san:string,engine:TacticalAdapter):Promise<{best:string;proposed:string;lossCp:number;depth:number}>{
 const board=new Chess(fen);
 if(board.isGameOver())throw new Error('Stockfish-Planprüfung: Stellung beendet; keine neue Zugvorführung freigegeben.');
 if(!board.moves().includes(san))throw new Error('Stockfish-Planprüfung: Erster Zug ist nicht legal; Vorführung gesperrt.');
 const baseline=validateTacticalReport(await engine.check(fen,null),fen);
 if(baseline.candidate!==null)throw new Error('Stockfish-Planprüfung: Ungültige Ausgangsbewertung.');
 const forced=baseline.line[0]===san?baseline:validateTacticalReport(await engine.check(fen,san),fen);
 if((forced.candidate!==null&&forced.candidate!==san)||forced.line[0]!==san)throw new Error('Stockfish-Planprüfung: Vorgeschlagener Zug wurde nicht korrekt geprüft.');
 const lossCp=(board.turn()==='w'?1:-1)*(cp(baseline)-cp(forced));
 if(!Number.isFinite(lossCp))throw new Error('Stockfish-Planprüfung: Bewertung nicht belastbar.');
 if(lossCp>=150)throw new Error(`Stockfish-Planprüfung: ${san} ist nach begrenzter Suche mindestens ${Math.round(lossCp)} Zentibauern schlechter als ${baseline.line[0]}. Die KI-Variante wird nicht vorgeführt; sie muss neu überdacht werden.`);
 return {best:baseline.line[0]!,proposed:san,lossCp:Math.round(lossCp),depth:Math.min(baseline.depth,forced.depth)};
}

/** Compare a short model-supplied list against one shared Stockfish baseline.
 * Never convert a tentative result to a best-move/strategic certificate.
 */
export async function verifyModelCandidates(fen:string,moves:readonly string[],engine:TacticalAdapter):Promise<{approved:string[];rejected:{san:string;reason:string}[];notes:string[]}>{
 if(moves.length>3||new Set(moves).size!==moves.length)throw new Error('Stockfish-Empfehlungsprüfung: zu viele oder doppelte Züge.');
 const base=validateTacticalReport(await engine.check(fen,null),fen);
 if(base.candidate!==null)throw new Error('Stockfish-Empfehlungsprüfung: Ausgangsbewertung fehlt.');
 const approved:string[]=[],rejected:{san:string;reason:string}[]=[],notes:string[]=[];
 const cached:TacticalAdapter={check:(position,candidate)=>{
   if(position!==fen)throw new Error('Stockfish-Empfehlungsprüfung: Stellung gewechselt.');
   return candidate===null?Promise.resolve(base):engine.check(position,candidate);
 }};
 for(const san of moves){
   try{
     const result=await checkProposedFirstMove(fen,san,cached);
     approved.push(san);
     notes.push(`${san}: begrenzter taktischer Check (Tiefe ${result.depth}, Abweichung etwa ${result.lossCp} cp). Keine Garantie für einen guten strategischen Plan.`);
   }catch(error){
     // Tactical rejection and unavailable engines both fail closed.
     rejected.push({san,reason:error instanceof Error?error.message:'Stockfish-Prüfung fehlgeschlagen.'});
   }
 }
 return {approved,rejected,notes};
}

/** Conservatively find legal SAN tokens in freely worded model advice.
 * Unexpected move mentions are blocked rather than trusted as a tactical plan.
 * A false positive may hide prose, but must never license an unsafe move.
 */
export function unverifiedProseMoves(fen:string,prose:string,approved:readonly string[]):string[]{
 const legal=new Set(new Chess(fen).moves());
 const accepted=new Set(approved);
 const detected=new Set<string>();
 for(const match of prose.matchAll(/(?<![\\p{L}\\p{N}])(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)(?![\\p{L}\\p{N}])/gu)){
   const san=match[0];
   if(legal.has(san)&&!accepted.has(san))detected.add(san);
 }
 return [...detected];
}
