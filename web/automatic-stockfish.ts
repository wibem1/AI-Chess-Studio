import {Chess} from 'chess.js';
import type {Session} from '../src/session.js';
import {pathTo} from '../src/game.js';
import {gameResultCp,scoreToCp} from '../src/full-game-analysis.js';
import {validateTacticalReport,type TacticalAdapter} from '../src/tactics.js';

/** Independent, paced Stockfish queue. Computation never depends on the display toggle.
 * One position is stored immediately after each successful engine result and persists
 * across reloads. This is not a paid AI request.
 */
export class AutomaticStockfish {
 private running:Promise<void>|undefined;
 private retryTimer:ReturnType<typeof setTimeout>|undefined;
 private failures=new WeakMap<Session,Set<string>>();
 private lastError='';
 private suspended=false;
 /** Freeze session writes during imports/backups. In-flight evaluations are
  * discarded after their awaited worker response, never saved to stale data. */
 suspend():void{
  this.suspended=true;
  if(this.retryTimer){clearTimeout(this.retryTimer);this.retryTimer=undefined;}
 }
 resume():void{
  if(!this.suspended)return;
  this.suspended=false;
  this.sync();
 }
 constructor(
  private current:()=>Session,
  private adapter:()=>TacticalAdapter,
  private engineBusy:()=>boolean,
  private saved:()=>Promise<void>,
  private changed:()=>void=()=>{}
 ){}
 get error(){return this.lastError;}
 private pending():boolean{
  const session=this.current(),data=session.snapshot();
  const end=data.game?.cursor??data.review?.original.at(-1)??data.activeNodeId;
  const path=pathTo(data,end),failed=this.failures.get(session);
  return path.length>=2&&path.length<=301&&path.some(node=>!data.positionScores?.[node.id]&&!failed?.has(node.id));
 }
 /** Invoked after moves, imports, page reload or entering learning view. */
 sync():void{
  if(this.suspended||this.running||this.retryTimer)return;
  this.retryTimer=setTimeout(()=>{
   this.retryTimer=undefined;
   if(this.suspended||this.running)return;
   const task=this.scan();
   this.running=task;
   void task.finally(()=>{
    if(this.running===task){this.running=undefined;if(this.pending())this.sync();}
   });
  },350);
 }
 /** Await any missing scores before a full-game KI question. */
 async ensure():Promise<boolean>{
  if(this.suspended)return false;
  if(this.retryTimer){clearTimeout(this.retryTimer);this.retryTimer=undefined;}
  if(this.running)await this.running;
  else{const task=this.scan(true);this.running=task;try{await task;}finally{if(this.running===task)this.running=undefined;}}
  const s=this.current(),d=s.snapshot();
  const end=d.game?.cursor??d.review?.original.at(-1)??d.activeNodeId;
  const path=pathTo(d,end);
  return path.length>=3&&path.every(n=>d.positionScores?.[n.id]?.fen===n.fen)||!!d.fullGameAnalysis&&
    d.fullGameAnalysis.rootFen===path[0]?.fen&&JSON.stringify(d.fullGameAnalysis.moves)===JSON.stringify(path.slice(1).map(n=>n.san));
 }
 private async scan(priority=false):Promise<void>{
  if(this.suspended)return;
  const session=this.current();
  if(!priority&&this.engineBusy()){this.sync();return;}
  const data=session.snapshot(),end=data.game?.cursor??data.review?.original.at(-1)??(data.nodes.length>1?data.activeNodeId:undefined);
  if(!end)return;
  const path=pathTo(data,end);
  if(path.length<2||path.length>301)return;
  const failed=this.failures.get(session)??new Set<string>();
  this.failures.set(session,failed);
  // FEN alone cannot detect threefold repetition: replay the actual mainline
  // to preserve repetition counts, while still storing one score per node.
  const historyBoard=new Chess(path[0]!.fen);
  for(const [index,node] of path.entries()){
   if(this.suspended||this.current()!==session)return;
   if(!priority&&this.engineBusy()){this.sync();return;}
   if(session.snapshot().positionScores?.[node.id]?.fen===node.fen)continue;
   if(failed.has(node.id))return;
   try{
    if(index>0)historyBoard.move(node.san!);
    if(historyBoard.fen()!==node.fen)throw new Error('Partiegeschichte stimmt nicht mit der gespeicherten Stellung überein.');
    const terminal=gameResultCp(historyBoard);
    let cp:number,depth:number,line:string[]|undefined;
    if(terminal!==null){cp=terminal;depth=0;}
    else{
     const raw=await this.adapter().check(node.fen,null,{rootFen:path[0]!.fen,moves:path.slice(1,index+1).map(n=>n.san!)});
     const report=validateTacticalReport(raw,node.fen);
     cp=scoreToCp(report);depth=report.depth;line=report.line;
    }
    if(this.suspended||this.current()!==session)return;
    session.storePositionScore(node.id,node.fen,cp,depth,line);
    const latest=session.snapshot(),currentEnd=latest.game?.cursor??latest.review?.original.at(-1)??latest.activeNodeId;
    const currentPath=pathTo(latest,currentEnd);
    if(currentPath.length>=3&&currentPath.length<=301)session.refreshFullGameFromScores(currentEnd);
    this.lastError='';
    try{await this.saved();}catch{this.lastError='Automatische Stockfish-Bewertungen konnten nicht dauerhaft gespeichert werden.';}
    this.changed();
   }catch(error){
    failed.add(node.id);
    this.lastError='Automatische Stockfish-Bewertung für '+node.id+' fehlgeschlagen: '+(error instanceof Error?error.message:'Engine nicht verfügbar.');
    this.changed();
    return;
   }
  }
  // A new position may have been added while the previous queue was working.
  if(!this.suspended&&this.current()===session){
   const now=session.snapshot(),currentEnd=now.game?.cursor??now.review?.original.at(-1)??now.activeNodeId;
   const currentPath=pathTo(now,currentEnd);
   if(currentPath.some(n=>!now.positionScores?.[n.id]&&!failed.has(n.id))){/* next pass scheduled after running task settles */}
  }
 }
}
