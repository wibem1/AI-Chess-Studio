import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {createInterface} from 'node:readline';
import {preparePlayingPosition,playingReply} from '../src/playing-position.js';
import {ApiError} from './model.js';
const require=createRequire(import.meta.url);
export class PlayingEngineService {
 private busy=false;
 async move(raw:unknown):Promise<{san:string;engine:string;level:number}>{
  if(this.busy)throw new ApiError(429,'Die Spielengine ist beschäftigt.');
  const r=raw as {rootFen?:unknown;moves?:unknown;level?:unknown}|null;
  let request:ReturnType<typeof preparePlayingPosition>;
  try{if(!r)throw new Error('Ungültige Partie.');request=preparePlayingPosition(r.rootFen,r.moves,r.level);}
  catch(error){throw new ApiError(400,error instanceof Error?error.message:'Ungültige Partie.');}
  const {board,level,position}=request;
  this.busy=true;
  try{
   const path=(require('stockfish') as {findEngine:(flavor:string)=>string}).findEngine('lite-single');
   return await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path],{stdio:['pipe','pipe','pipe'],env:{}}),lines=createInterface({input:child.stdout});
    let settled=false,engine='',hasSkill=false,size=0;
    const finish=(error?:Error,result?:{san:string;engine:string;level:number})=>{if(settled)return;settled=true;clearTimeout(timer);lines.close();child.kill('SIGKILL');if(error)reject(error);else resolve(result!);};
    const timer=setTimeout(()=>finish(new ApiError(504,'Engine-Zeitlimit überschritten.')),8000);
    const send=(line:string)=>{if(!settled)child.stdin.write(line+'\n');};
    child.on('error',()=>finish(new ApiError(503,'Spielengine nicht verfügbar.')));
    child.on('exit',()=>{if(!settled)finish(new ApiError(502,'Spielengine beendet.'));});
    child.stdin.on('error',()=>finish(new ApiError(502,'Engine-Verbindung beendet.')));
    child.stderr.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>65536)finish(new ApiError(502,'Engine-Ausgabe zu groß.'));});
    lines.on('line',line=>{
     if(settled)return;size+=line.length;if(size>65536){finish(new ApiError(502,'Engine-Ausgabe zu groß.'));return;}
     if(line.startsWith('id name '))engine=line.slice(8);
     if(line.startsWith('option name Skill Level type spin'))hasSkill=true;
     if(line==='uciok'){
      if(!hasSkill){finish(new ApiError(503,'Spielstufen nicht unterstützt.'));return;}
      send('setoption name Hash value 16');send('setoption name UCI_LimitStrength value false');send(`setoption name Skill Level value ${level.skill}`);send('ucinewgame');send('isready');
     }
     if(line==='readyok'){send(position);send(`go depth 12 nodes 20000 movetime ${level.milliseconds}`);}
     if(line.startsWith('bestmove ')){
      try{finish(undefined,playingReply(board,line.split(' ')[1]!,engine,level.level));
      }catch{finish(new ApiError(502,'Illegale Engineantwort.'));}
     }
    });send('uci');
   });
  }catch(error){if(error instanceof ApiError)throw error;throw new ApiError(503,'Spielengine nicht verfügbar.');}
  finally{this.busy=false;}
 }
}
