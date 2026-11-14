import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import type {EngineWorker} from '../src/browser-uci.js';

const require=createRequire(import.meta.url);
/** Node adapter for the same bounded, independently validated MultiPV process as the browser. */
export function createNodeReviewWorker():EngineWorker{
 const path=(require('stockfish') as {findEngine:(flavor:string)=>string}).findEngine('lite-single');
 const child=spawn(process.execPath,[path],{stdio:['pipe','pipe','pipe'],env:{}});
 let ended=false,stderrBytes=0;
 const worker:EngineWorker={
  onmessage:null,onerror:null,onmessageerror:null,
  postMessage(command:string){if(ended)return;try{child.stdin.write(command+'\n');}catch{fail();}},
  terminate(){if(ended)return;ended=true;child.kill('SIGKILL');}
 };
 const emit=(line:string)=>worker.onmessage?.(new MessageEvent('message',{data:line}));
 const fail=()=>{if(ended)return;worker.onerror?.({preventDefault(){}} as ErrorEvent);};
 let buffer='';
 child.stdout.on('data',(data:Buffer)=>{
  if(ended)return;
  buffer+=data.toString('utf8');
  if(buffer.length>300000){fail();return;}
  let at=buffer.indexOf('\n');
  while(at>=0){const line=buffer.slice(0,at).replace(/\r$/,'');buffer=buffer.slice(at+1);emit(line);at=buffer.indexOf('\n');}
 });
 child.stderr.on('data',(data:Buffer)=>{stderrBytes+=data.length;if(stderrBytes>65536)fail();});
 child.on('error',fail);
 child.on('exit',()=>{if(!ended)fail();});
 child.stdin.on('error',fail);
 return worker;
}
