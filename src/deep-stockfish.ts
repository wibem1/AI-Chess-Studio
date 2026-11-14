import {Chess} from 'chess.js';
import {BrowserUciProcess,type EngineWorker} from './browser-uci.js';

/** Machine-readable requests appended by the first, engine-blind strategic pass. */
export function deepReviewPlies(draft:string,moves:readonly string[]):number[]{
 const marker=/^ENGINE_CHECK_PLIES:\s*([\d,\s]+)\s*$/gmi;
 const matches=[...draft.matchAll(marker)];
 if(matches.length!==1)return [];
 const values=matches[0]![1]!.split(',').map(s=>Number(s.trim()));
 if(values.length>5||values.some(n=>!Number.isSafeInteger(n)||n<1||n>moves.length))return [];
 return [...new Set(values)];
}
export function cleanStrategicDraft(draft:string):string{
 return draft.replace(/^ENGINE_CHECK_PLIES:\s*[\d,\s]+\s*$/gmi,'').trim();
}
export interface DeepReviewLine{score:{unit:'cp'|'mate';value:number};depth:number;san:string[]}
export interface DeepReviewResult{ply:number;fen:string;played:string;elapsedMs:number;lines:DeepReviewLine[]}
export function verifyDeepResult(raw:DeepReviewResult,fen:string,played:string):DeepReviewResult{
 if(raw.fen!==fen||raw.played!==played||!Number.isSafeInteger(raw.ply)||raw.ply<1||
 !Number.isFinite(raw.elapsedMs)||raw.elapsedMs<0||raw.elapsedMs>20000||
 !Array.isArray(raw.lines)||raw.lines.length<1||raw.lines.length>3)throw new Error('Ungültiger vertiefter Stockfish-Befund.');
 const signatures=new Set<string>();
 for(const line of raw.lines){
  if(!Number.isInteger(line.depth)||line.depth<1||line.depth>24||
  !['cp','mate'].includes(line.score?.unit)||!Number.isSafeInteger(line.score.value)||
  !Array.isArray(line.san)||line.san.length<1||line.san.length>32)throw new Error('Ungültige Stockfish-Hauptvariante.');
  const board=new Chess(fen);
  for(const san of line.san){if(typeof san!=='string'||!board.moves().includes(san))throw new Error('Illegale vertiefte Stockfish-Variante.');board.move(san);}
  if(signatures.has(line.san[0]!))throw new Error('Doppelte Stockfish-Kandidatenvariante.');
  signatures.add(line.san[0]!);
 }
 return structuredClone(raw);
}
/** Isolated from the 1-second automatic scan, so existing position evaluations stay unchanged. */
export class BrowserDeepStockfish {
 private process:BrowserUciProcess;
 constructor(factory?:()=>EngineWorker){this.process=new BrowserUciProcess(factory,15000);}
 cancel(){this.process.cancel();}
 async check(rootFen:string,moves:readonly string[],ply:number):Promise<DeepReviewResult>{
  if(!Number.isInteger(ply)||ply<1||ply>moves.length)throw new Error('Ungültige Analyseposition.');
  const prefix=moves.slice(0,ply-1);
  const board=new Chess(rootFen),uci:string[]=[];
  for(const san of prefix){if(!board.moves().includes(san))throw new Error('Ungültige Partiegeschichte.');const m=board.move(san);uci.push(m.from+m.to+(m.promotion??''));}
  if(board.isGameOver())throw new Error('Bereits beendete Stellung kann nicht vertieft geprüft werden.');
  const fen=board.fen(),played=moves[ply-1]!;
  if(!board.moves().includes(played))throw new Error('Historischer Zug ist illegal.');
  const position='position fen '+rootFen+(uci.length?' moves '+uci.join(' '):'');
  const lines=new Map<number,{depth:number;score:{unit:'cp'|'mate';value:number};pv:string[]}>();
  const started=performance.now(),turn=board.turn();
  return this.process.search({position,go:'go depth 24 nodes 500000 movetime 4000',maxOutputBytes:262144,
   options:['setoption name MultiPV value 3'],line:message=>{
    if(!message.startsWith('info ')||/lowerbound|upperbound/.test(message))return;
    const idx=/\bmultipv (\d+)/.exec(message),dep=/\bdepth (\d+)/.exec(message),
     score=/\bscore (cp|mate) (-?\d+)/.exec(message),pv=/\bpv (.+)$/.exec(message);
    if(!idx||!dep||!score||!pv)return;
    const number=Number(idx[1]),depth=Number(dep[1]);
    if(number<1||number>3||depth<1||depth>24)return;
    const moves=pv[1]!.trim().split(/\s+/).slice(0,32),probe=new Chess(fen);
    try{for(const u of moves){if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u))throw Error();probe.move({from:u.slice(0,2),to:u.slice(2,4),...(u[4]?{promotion:u[4]}:{})});}}
    catch{return;}
    lines.set(number,{depth,score:{unit:score[1] as 'cp'|'mate',value:Number(score[2])*(turn==='w'?1:-1)},pv:moves});
   },complete:(bestmove,engine)=>{
    if(!engine.startsWith('Stockfish')||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(bestmove))throw new Error('Stockfish-Prüfung: Ungültiger abschließender Zug.');
    const best=new Chess(fen);try{best.move({from:bestmove.slice(0,2),to:bestmove.slice(2,4),...(bestmove[4]?{promotion:bestmove[4]}:{})});}catch{throw new Error('Stockfish-Prüfung: Illegaler abschließender Zug.');}
    const result:DeepReviewLine[]=[];
    for(const [,value] of [...lines.entries()].sort((a,b)=>a[0]-b[0])){
     const replay=new Chess(fen),san:string[]=[];
     for(const u of value.pv){const m=replay.move({from:u.slice(0,2),to:u.slice(2,4),...(u[4]?{promotion:u[4]}:{})});san.push(m.san);}
     if(!result.some(x=>x.san[0]===san[0]))result.push({depth:value.depth,score:value.score,san});
    }
    return verifyDeepResult({ply,fen,played,elapsedMs:Math.round(performance.now()-started),lines:result},fen,played);
   }});
 }
}
export async function reviewDeepChecks(rootFen:string,moves:readonly string[],plies:readonly number[],engine:BrowserDeepStockfish,signal?:AbortSignal):Promise<DeepReviewResult[]>{
 const selected=[...new Set(plies)];
 if(selected.length>5||selected.some(n=>!Number.isSafeInteger(n)||n<1||n>moves.length))throw new Error('Ungültige Engine-Nachprüfungen.');
 const results:DeepReviewResult[]=[];
 for(const ply of selected){
  signal?.throwIfAborted();
  try{results.push(await engine.check(rootFen,moves,ply));}
  catch(error){if(signal?.aborted)throw error;/* A failed local search is omitted, never presented as an established fact. */}
 }
 signal?.throwIfAborted();
 return results;
}
