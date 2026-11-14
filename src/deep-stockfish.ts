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
export interface DeepReviewResult{ply:number;fen:string;played:string;elapsedMs:number;lines:DeepReviewLine[];playedLine:DeepReviewLine}
function validateDeepLine(line:DeepReviewLine,fen:string):void{
 if(!Number.isInteger(line?.depth)||line.depth<1||line.depth>24||
  !['cp','mate'].includes(line.score?.unit)||!Number.isSafeInteger(line.score.value)||
  !Array.isArray(line.san)||line.san.length<1||line.san.length>32)throw new Error('Ungültige Stockfish-Hauptvariante.');
 const board=new Chess(fen);
 for(const san of line.san){
  if(typeof san!=='string'||!board.moves().includes(san))throw new Error('Illegale vertiefte Stockfish-Variante.');
  board.move(san);
 }
}
export function verifyDeepResult(raw:DeepReviewResult,fen:string,played:string):DeepReviewResult{
 if(raw.fen!==fen||raw.played!==played||!Number.isSafeInteger(raw.ply)||raw.ply<1||
 !Number.isFinite(raw.elapsedMs)||raw.elapsedMs<0||raw.elapsedMs>30000||
 !Array.isArray(raw.lines)||raw.lines.length<1||raw.lines.length>3)throw new Error('Ungültiger vertiefter Stockfish-Befund.');
 const signatures=new Set<string>();
 for(const line of raw.lines){
  validateDeepLine(line,fen);
  if(signatures.has(line.san[0]!))throw new Error('Doppelte Stockfish-Kandidatenvariante.');
  signatures.add(line.san[0]!);
 }
 validateDeepLine(raw.playedLine,fen);
 if(raw.playedLine.san[0]!==played)throw new Error('Erzwungene Stockfish-Prüfung gehört nicht zum gespielten Zug.');
 return structuredClone(raw);
}
/** Deep search does not modify the automatic 1-second position scores or game state. */
export class BrowserDeepStockfish {
 private process:BrowserUciProcess;
 constructor(factory?:()=>EngineWorker){this.process=new BrowserUciProcess(factory,15000);}
 cancel(){this.process.cancel();}
 private async search(position:string,fen:string,turn:'w'|'b',forcedUci?:string):Promise<DeepReviewLine[]>{
  const lines=new Map<number,{depth:number;score:{unit:'cp'|'mate';value:number};pv:string[]}>();
  const go='go depth 24 nodes 500000 movetime 4000'+(forcedUci?' searchmoves '+forcedUci:'');
  return this.process.search({position,go,maxOutputBytes:262144,
   options:['setoption name MultiPV value '+(forcedUci?'1':'3')],line:message=>{
    if(!message.startsWith('info ')||/lowerbound|upperbound/.test(message))return;
    const idx=/\bmultipv (\d+)/.exec(message),dep=/\bdepth (\d+)/.exec(message),
     score=/\bscore (cp|mate) (-?\d+)/.exec(message),pv=/\bpv (.+)$/.exec(message);
    if(!dep||!score||!pv)return;
    const number=idx?Number(idx[1]):1,depth=Number(dep[1]);
    if(number<1||number>(forcedUci?1:3)||depth<1||depth>24)return;
    const sequence=pv[1]!.trim().split(/\s+/).slice(0,32),probe=new Chess(fen);
    try{
     if(forcedUci&&sequence[0]!==forcedUci)return;
     for(const uci of sequence){
      if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))throw Error();
      probe.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});
     }
    }catch{return;}
    lines.set(number,{depth,score:{unit:score[1] as 'cp'|'mate',value:Number(score[2])*(turn==='w'?1:-1)},pv:sequence});
   },complete:(bestmove,engine)=>{
    if(!engine.startsWith('Stockfish')||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(bestmove))throw new Error('Stockfish-Prüfung: Ungültiger abschließender Zug.');
    if(forcedUci&&bestmove!==forcedUci)throw new Error('Stockfish-Prüfung: Ergebnis weicht vom erzwungenen Partiezug ab.');
    const probe=new Chess(fen);
    try{probe.move({from:bestmove.slice(0,2),to:bestmove.slice(2,4),...(bestmove[4]?{promotion:bestmove[4]}:{})});}
    catch{throw new Error('Stockfish-Prüfung: Illegaler abschließender Zug.');}
    const output:DeepReviewLine[]=[];
    for(const [,value] of [...lines.entries()].sort((a,b)=>a[0]-b[0])){
     const board=new Chess(fen),san:string[]=[];
     for(const uci of value.pv){
      const move=board.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});
      san.push(move.san);
     }
     if(!output.some(other=>other.san[0]===san[0]))output.push({depth:value.depth,score:value.score,san});
    }
    if(!output.length)throw new Error('Stockfish-Prüfung: Keine gültige Hauptvariante im Suchergebnis.');
    if(forcedUci&&output.length!==1)throw new Error('Stockfish-Prüfung: Ungültige Prüfung des gespielten Zuges.');
    return output;
   }});
 }
 async check(rootFen:string,moves:readonly string[],ply:number):Promise<DeepReviewResult>{
  if(!Number.isInteger(ply)||ply<1||ply>moves.length)throw new Error('Ungültige Analyseposition.');
  const prefix=moves.slice(0,ply-1);
  const board=new Chess(rootFen),uci:string[]=[];
  for(const san of prefix){
   if(!board.moves().includes(san))throw new Error('Ungültige Partiegeschichte.');
   const move=board.move(san);uci.push(move.from+move.to+(move.promotion??''));
  }
  if(board.isGameOver())throw new Error('Bereits beendete Stellung kann nicht vertieft geprüft werden.');
  const fen=board.fen(),played=moves[ply-1]!;
  if(!board.moves().includes(played))throw new Error('Historischer Zug ist illegal.');
  const actual=board.move(played);
  const forcedUci=actual.from+actual.to+(actual.promotion??'');
  const position='position fen '+rootFen+(uci.length?' moves '+uci.join(' '):'');
  const started=performance.now(),turn=fen.split(' ')[1] as 'w'|'b';
  const lines=await this.search(position,fen,turn);
  const forced=await this.search(position,fen,turn,forcedUci);
  return verifyDeepResult({ply,fen,played,elapsedMs:Math.round(performance.now()-started),lines,playedLine:forced[0]!},fen,played);
 }
}
/** Revalidate persisted or client-provided engine evidence against the exact played game. */
export function validateDeepChecksForGame(rootFen:string,moves:readonly string[],raw:unknown):DeepReviewResult[]{
 if(!Array.isArray(raw)||raw.length>5||moves.length>500)throw new Error('Ungültige gespeicherte Engine-Nachprüfungen.');
 const board=new Chess(rootFen),positions=[board.fen()];
 for(const san of moves){
  if(typeof san!=='string'||!board.moves().includes(san))throw new Error('Ungültige Partie für die Engine-Nachprüfung.');
  board.move(san);positions.push(board.fen());
 }
 const found=new Set<number>();
 return raw.map(value=>{
  const r=value as DeepReviewResult;
  if(!r||!Number.isInteger(r.ply)||r.ply<1||r.ply>moves.length||found.has(r.ply))throw new Error('Ungültige oder doppelte vertiefte Partiestellung.');
  found.add(r.ply);
  return verifyDeepResult(r,positions[r.ply-1]!,moves[r.ply-1]!);
 });
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
