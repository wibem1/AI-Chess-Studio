import {appPath} from '../src/app-path.js';
import type {PlayingEngine} from '../src/game.js';
import {preparePlayingPosition} from '../src/playing-position.js';
import {MAIA_ASSET_BASE,MAIA_PROFILES} from '../src/maia-files.js';
export class MaiaPlayingEngine implements PlayingEngine{
 private worker:Worker|undefined;
 private pending:{reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}|undefined;
 constructor(private progress:(value:string)=>void=()=>{}){}
 cancel(){const pending=this.pending;this.pending=undefined;this.worker?.terminate();this.worker=undefined;if(pending){clearTimeout(pending.timer);pending.reject(new Error('Maia-Berechnung abgebrochen.'));}}
 async move(rootFen:string,moves:string[],level:number){
  const request=preparePlayingPosition(rootFen,moves,level);if(this.pending)throw new Error('Maia rechnet bereits.');
  this.worker??=new Worker(new URL('./maia-worker.ts',import.meta.url),{type:'module'});
  const worker=this.worker;
  return new Promise<{san:string;level:number;engine:string}>((resolve,reject)=>{
   const fail=(error:Error)=>{if(this.pending)clearTimeout(this.pending.timer);this.pending=undefined;this.cancel();reject(error);};
   const timer=setTimeout(()=>fail(new Error('Maia-Zeitlimit erreicht. Partie pausiert; bewusst erneut fortsetzen.')),120000);
   this.pending={reject,timer};
   worker.onerror=()=>fail(new Error('Maia-Laufzeit nicht verfügbar. Partie pausiert.'));
   worker.onmessage=(event:MessageEvent<{uci?:string;status?:string;error?:string}>)=>{
    if(event.data.status){this.progress(event.data.status);return;}
    if(event.data.error){fail(new Error(event.data.error));return;}
    try{
     const uci=event.data.uci;if(typeof uci!=='string'||!/^([a-h][1-8]){2}[qrbn]?$/.test(uci))throw new Error();
     const result=request.board.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});
     clearTimeout(timer);this.pending=undefined;resolve({san:result.san,level,engine:'Maia-2 Blitz (ONNX, Browser)'});
    }catch{fail(new Error('Illegale Maia-Antwort verworfen.'));}
   };
   worker.postMessage({base:new URL(appPath(MAIA_ASSET_BASE),location.origin).href,fen:request.board.fen(),rating:MAIA_PROFILES[level-1]});
  });
 }
}
