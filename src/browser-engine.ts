import type {PlayingEngine} from './game.js';
import {preparePlayingPosition,playingReply} from './playing-position.js';
import {BrowserUciProcess,type EngineWorker} from './browser-uci.js';
export type {EngineWorker} from './browser-uci.js';
export class BrowserPlayingEngine implements PlayingEngine {
 private process:BrowserUciProcess;
 constructor(factory?:()=>EngineWorker,timeoutMs=8000){this.process=new BrowserUciProcess(factory,timeoutMs);}
 cancel(){this.process.cancel();}
 async move(rootFen:string,moves:string[],level:number){
  const r=preparePlayingPosition(rootFen,moves,level);
  return this.process.search({position:r.position,go:`go depth 12 nodes 20000 movetime ${r.level.milliseconds}`,requireSkill:true,options:['setoption name UCI_LimitStrength value false',`setoption name Skill Level value ${r.level.skill}`],complete:(uci,engine)=>playingReply(r.board,uci,engine,r.level.level)});
 }
}
