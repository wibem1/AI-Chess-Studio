import type {PlayingEngine} from './game.js';
import {ENGINE_ASSET_BASE,ENGINE_FILES} from './engine-files.js';
import {preparePlayingPosition,playingReply} from './playing-position.js';

export interface EngineWorker {
 postMessage(message:string):void;
 terminate():void;
 onmessage:((event:MessageEvent)=>void)|null;
 onerror:((event:ErrorEvent)=>void)|null;
 onmessageerror:((event:MessageEvent)=>void)|null;
}

/** One bounded, single-threaded worker per explicit engine move. No API transport. */
export class BrowserPlayingEngine implements PlayingEngine {
 private pendingCancel:(()=>void)|undefined;
 constructor(private createWorker:()=>EngineWorker=()=>new Worker(ENGINE_ASSET_BASE+ENGINE_FILES.script),private timeoutMs=8000){
  if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>8000)throw new Error('Ungültiges Engine-Zeitlimit.');
 }
 cancel():void{this.pendingCancel?.();}
 async move(rootFen:string,moves:string[],level:number):Promise<{san:string;engine:string;level:number}>{
  if(this.pendingCancel)throw new Error('Die Browser-Spielengine ist beschäftigt.');
  const request=preparePlayingPosition(rootFen,moves,level);
  let worker:EngineWorker;
  try{worker=this.createWorker();}catch{throw new Error('Browser-Spielengine konnte nicht gestartet werden. WebAssembly und Web Worker prüfen.');}
  return new Promise((resolve,reject)=>{
   let done=false,engine='',hasSkill=false,bytes=0,phase:'uci'|'ready'|'thinking'='uci';
   const finish=(error?:Error,result?:{san:string;engine:string;level:number})=>{
    if(done)return;done=true;clearTimeout(timer);this.pendingCancel=undefined;
    worker.onmessage=worker.onerror=worker.onmessageerror=null;
    worker.terminate();
    if(error)reject(error);else resolve(result!);
   };
   const timer=setTimeout(()=>finish(new Error('Browser-Spielengine: Zeitlimit überschritten. Partie pausiert.')),this.timeoutMs);
   this.pendingCancel=()=>finish(new Error('Browser-Spielengine abgebrochen.'));
   const send=(command:string)=>{if(!done)try{worker.postMessage(command);}catch{finish(new Error('Browser-Spielengine: Verbindung beendet.'));}};
   worker.onerror=event=>{event.preventDefault?.();finish(new Error('Browser-Spielengine konnte nicht geladen werden. Engine-Dateien und WebAssembly prüfen.'));};
   worker.onmessageerror=()=>finish(new Error('Browser-Spielengine: unlesbare Nachricht.'));
   worker.onmessage=event=>{
    if(done)return;
    if(typeof event.data!=='string'){finish(new Error('Browser-Spielengine: ungültige Ausgabe.'));return;}
    bytes+=new TextEncoder().encode(event.data).length;
    if(bytes>65536){finish(new Error('Browser-Spielengine: Ausgabe zu groß.'));return;}
    for(const line of event.data.split(/\r?\n/)){
     if(done)return;
     if(line.startsWith('id name '))engine=line.slice(8).trim();
     if(line.startsWith('option name Skill Level type spin'))hasSkill=true;
     if(line==='uciok'&&phase==='uci'){
      if(!hasSkill){finish(new Error('Browser-Spielstufen werden nicht unterstützt.'));return;}
      phase='ready';send('setoption name Hash value 16');send('setoption name UCI_LimitStrength value false');
      send(`setoption name Skill Level value ${request.level.skill}`);send('ucinewgame');send('isready');
     }else if(line==='readyok'&&phase==='ready'){
      phase='thinking';send(request.position);send(`go depth 12 nodes 20000 movetime ${request.level.milliseconds}`);
     }else if(line.startsWith('bestmove ')){
      try{
       if(phase!=='thinking')throw new Error();
       finish(undefined,playingReply(request.board,line.split(' ')[1]!,engine,request.level.level));
      }catch{finish(new Error('Browser-Spielengine: illegale oder falsche Zugantwort.'));}
     }
    }
   };
   send('uci');
  });
 }
}
