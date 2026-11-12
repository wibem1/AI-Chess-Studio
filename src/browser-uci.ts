import {appPath} from './app-path.js';
import {ENGINE_ASSET_BASE,ENGINE_FILES} from './engine-files.js';
export interface EngineWorker {
 postMessage(message:string):void;terminate():void;
 onmessage:((event:MessageEvent)=>void)|null;onerror:((event:ErrorEvent)=>void)|null;onmessageerror:((event:MessageEvent)=>void)|null;
}
export interface BrowserSearch<T>{position:string;go:string;options:string[];requireSkill?:boolean;line?:(line:string)=>void;complete:(uci:string,engine:string)=>T}
/** One bounded UCI worker; used by both the opponent and explicit factcheck. */
export class BrowserUciProcess {
 private pendingCancel:(()=>void)|undefined;
 constructor(private createWorker:()=>EngineWorker=()=>new Worker(appPath(ENGINE_ASSET_BASE+ENGINE_FILES.script)),private timeoutMs=8000){if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>8000)throw new Error('Ungültiges Engine-Zeitlimit.');}
 cancel(){this.pendingCancel?.();}
 async search<T>(search:BrowserSearch<T>):Promise<T>{
  if(this.pendingCancel)throw new Error('Die Browser-Spielengine ist beschäftigt.');
  let worker:EngineWorker;try{worker=this.createWorker();}catch{throw new Error('Browser-Spielengine konnte nicht gestartet werden. WebAssembly und Web Worker prüfen.');}
  return new Promise((resolve,reject)=>{
   let done=false,engine='',hasSkill=false,bytes=0,phase:'uci'|'ready'|'thinking'='uci';
   const finish=(error?:Error,result?:T)=>{if(done)return;done=true;clearTimeout(timer);this.pendingCancel=undefined;worker.onmessage=worker.onerror=worker.onmessageerror=null;worker.terminate();if(error)reject(error);else resolve(result!);};
   const timer=setTimeout(()=>finish(new Error('Browser-Spielengine: Zeitlimit überschritten. Partie pausiert.')),this.timeoutMs);
   this.pendingCancel=()=>finish(new Error('Browser-Spielengine abgebrochen.'));
   const send=(command:string)=>{if(!done)try{worker.postMessage(command);}catch{finish(new Error('Browser-Spielengine: Verbindung beendet.'));}};
   worker.onerror=event=>{event.preventDefault?.();finish(new Error('Browser-Spielengine konnte nicht geladen werden. Engine-Dateien und WebAssembly prüfen.'));};
   worker.onmessageerror=()=>finish(new Error('Browser-Spielengine: unlesbare Nachricht.'));
   worker.onmessage=event=>{
    if(done)return;if(typeof event.data!=='string'){finish(new Error('Browser-Spielengine: ungültige Ausgabe.'));return;}
    bytes+=new TextEncoder().encode(event.data).length;if(bytes>65536){finish(new Error('Browser-Spielengine: Ausgabe zu groß.'));return;}
    for(const line of event.data.split(/\r?\n/)){
     if(done)return;
     try{
      search.line?.(line);
      if(line.startsWith('id name '))engine=line.slice(8).trim();
      if(line.startsWith('option name Skill Level type spin'))hasSkill=true;
      if(line==='uciok'&&phase==='uci'){
       if(search.requireSkill&&!hasSkill){finish(new Error('Browser-Spielstufen werden nicht unterstützt.'));return;}
       phase='ready';send('setoption name Hash value 16');for(const option of search.options)send(option);send('ucinewgame');send('isready');
      }else if(line==='readyok'&&phase==='ready'){phase='thinking';send(search.position);send(search.go);}
      else if(line.startsWith('bestmove ')){
       if(phase!=='thinking'||!engine.startsWith('Stockfish')||engine.length>120)throw new Error();
       finish(undefined,search.complete(line.split(' ')[1]!,engine));
      }
     }catch(error){
      // Only expose our own fixed, non-provider messages; never reflect raw
      // UCI output into the interface or downloaded diagnostics.
      const reason=error instanceof Error&&error.message.startsWith('Stockfish-Prüfung: ')?error.message:'Browser-Spielengine: illegale oder falsche Zugantwort.';
      finish(new Error(reason));
     }
    }
   };send('uci');
  });
 }
}
