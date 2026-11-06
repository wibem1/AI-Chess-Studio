import { Chess } from 'chess.js';
import type { Session, MoveInput, SessionData } from './session.js';
export interface GameState { id:string; start:string; cursor:string; human:'w'|'b'; level:number; paused:boolean; revision:number;engine?:'server'|'browser';opponent?:'stockfish'|'maia' }
export const PLAY_LEVELS=[{level:1,skill:0,milliseconds:200},{level:2,skill:5,milliseconds:350},{level:3,skill:10,milliseconds:500},{level:4,skill:15,milliseconds:750},{level:5,skill:20,milliseconds:1000}] as const;
export function pathTo(data:SessionData,id:string) {
 const path:SessionData['nodes']=[];let node=data.nodes.find(n=>n.id===id);
 if(!node)throw new Error('Unbekannte Stellung.');
 while(node){path.unshift(node);node=node.parentId===null?undefined:data.nodes.find(n=>n.id===node!.parentId);}
 return path;
}
export interface PlayingEngine { move(rootFen:string,moves:string[],level:number):Promise<unknown>;cancel?():void }
export class LearningGame {
 private inFlight:PlayingEngine|undefined;
 private study:{session:Session;gameId:string;cursor:string;node:string}|undefined;
 constructor(private current:()=>Session){}
 start(human:'w'|'b',level:number,engine?:'server'|'browser',opponent?:'stockfish'|'maia'):void {
  const s=this.current(),d=s.snapshot();
  if(d.review?.guiding)throw new Error('Der geführte Rückblick startet keinen Enginegegner. Zum freien Spiel den Rückblick ausdrücklich verlassen.');
  this.inFlight?.cancel?.();
  this.study=undefined;
  s.orient(human);
  s.setGame({id:crypto.randomUUID(),start:d.activeNodeId,cursor:d.activeNodeId,human,level,paused:false,revision:0,...(engine?{engine}:{}),...(opponent?{opponent}:{})});
 }
 pause():void{this.inFlight?.cancel?.();const s=this.current(),g=s.snapshot().game;if(g && !g.paused)s.setGame({...g,paused:true,revision:g.revision+1});}
 resume():void{this.inFlight?.cancel?.();const s=this.current(),d=s.snapshot(),g=d.game;if(!g)throw new Error('Keine Lernpartie gestartet.');if(g.paused)this.study={session:s,gameId:g.id,cursor:g.cursor,node:d.activeNodeId};s.select(g.cursor);s.setGame({...g,paused:false,revision:g.revision+1});}
 learn():void{const s=this.current(),g=s.snapshot().game;if(!g)return;const running=!g.paused;this.pause();if(running&&this.study?.session===s&&this.study.gameId===g.id&&this.study.cursor===g.cursor)s.select(this.study.node);}
 analyse(id:string):void{this.pause();this.current().select(id);}
 private takeBackTarget():string|undefined{
  const d=this.current().snapshot(),g=d.game;if(!g || d.review?.guiding)return;
  const path=pathTo(d,g.cursor),start=path.findIndex(n=>n.id===g.start);
  for(let i=path.length-1;i>start;i--)if(new Chess(path[i-1]!.fen).turn()===g.human)return path[i-1]!.id;
 }
 canTakeBack():boolean{return this.takeBackTarget()!==undefined;}
 takeBack():void{
  const target=this.takeBackTarget();if(!target)throw new Error('Noch kein eigener Zug zum Zurücknehmen.');
  this.pause();this.study=undefined;const s=this.current(),g=s.snapshot().game!;
  s.select(target);s.setGame({...g,cursor:target,paused:false,revision:g.revision+1});
 }
 play(input:MoveInput):string {
  const s=this.current(),d=s.snapshot(),g=d.game;
  if(g && !g.paused && (d.activeNodeId!==g.cursor || new Chess(d.nodes.find(n=>n.id===g.cursor)!.fen).turn()!==g.human))throw new Error(`${g.opponent==='maia'?'Maia':'Stockfish'} ist am Zug. Zum Ausprobieren die Partie pausieren.`);
  const id=s.play(input);if(g && !g.paused)s.setGame({...g,cursor:id,revision:g.revision+1});return id;
 }
 needsEngine():boolean {
  const s=this.current(),d=s.snapshot(),g=d.game;
  return !!g && !g.paused && d.activeNodeId===g.cursor && !s.status().gameOver && new Chess(d.nodes.find(n=>n.id===g.cursor)!.fen).turn()!==g.human;
 }
 async reply(engine:PlayingEngine):Promise<'stored'|'discarded'|'idle'> {
  if(!this.needsEngine())return 'idle';
  if(this.inFlight)throw new Error('Eine Engineanfrage läuft bereits.');
  this.inFlight=engine;
  const s=this.current(),d=s.snapshot(),g=d.game!,path=pathTo(d,g.cursor);
  const stillCurrent=()=>{const now=this.current().snapshot();return this.current()===s && now.game?.id===g.id && now.game.revision===g.revision && !now.game.paused && now.activeNodeId===g.cursor;};
  try{
   const raw=await engine.move(path[0]!.fen,path.slice(1).map(n=>n.san!),g.level);
   if(!stillCurrent())return 'discarded';
   const r=raw as {san?:unknown;level?:unknown;engine?:unknown};
   if(!r || typeof r.san!=='string' || r.level!==g.level || typeof r.engine!=='string' || !r.engine.startsWith(g.opponent==='maia'?'Maia-2':'Stockfish') || !s.legalMoves().includes(r.san))throw new Error('Illegale oder falsche Engineantwort verworfen.');
   const cursor=s.play(r.san);s.setGame({...g,cursor,revision:g.revision+1});return 'stored';
  }catch(error){if(!stillCurrent())return 'discarded';this.pause();throw error;}
  finally{if(this.inFlight===engine)this.inFlight=undefined;}
 }
}
export class ServerPlayingEngine implements PlayingEngine {
 async move(rootFen:string,moves:string[],level:number):Promise<unknown>{
  const response=await fetch('/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rootFen,moves,level}),signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('Enginezug fehlgeschlagen. Partie pausiert; erneut fortsetzen möglich.');return response.json();
 }
}
