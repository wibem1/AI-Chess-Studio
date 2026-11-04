import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
export type UpdateRunner=(program:string,args:string[],cwd:string)=>Promise<string>;
const runner:UpdateRunner=async(program,args,cwd)=>{
 const result=await exec(program,args,{cwd,timeout:120000,maxBuffer:262144,windowsHide:true,env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});
 return result.stdout.trim();
};
export class UpdateService {
 private busy=false;
 private state:{stage:string;message:string;restartRequired:boolean}={stage:'idle',message:'Noch nicht nach Updates gesucht.',restartRequired:false};
 constructor(private root:string,private run:UpdateRunner=runner){}
 status(){return {...this.state};}
 async check(){
  if(this.busy)throw new Error('Aktualisierung läuft bereits.');
  const identity=await this.run('git',['remote','get-url','origin'],this.root);
  if(!/^(https:\/\/github\.com\/|git@github\.com:)wibem1\/AI-Chess-Studio(?:\.git)?$/.test(identity))throw new Error('Updatequelle stimmt nicht mit diesem Projekt überein.');
  const current=await this.run('git',['rev-parse','HEAD'],this.root);
  const remote=await this.run('git',['ls-remote','origin','refs/heads/work'],this.root);
  const target=remote.split(/\s/)[0]??'';
  if(!/^[a-f0-9]{40}$/.test(target) || !/^[a-f0-9]{40}$/.test(current))throw new Error('Updatequelle nicht verfügbar.');
  const dirty=(await this.run('git',['status','--porcelain'],this.root))!=='';
  return {current,target,available:current!==target,canInstall:!dirty && current!==target,dirty,branch:'work'};
 }
 async install(target:string){
  if(!/^[a-f0-9]{40}$/.test(target))throw new Error('Ungültiges Updateziel.');
  const info=await this.check();
  if(!info.canInstall || info.target!==target)throw new Error('Update nicht installierbar: eigene Änderungen oder geändertes Ziel.');
  if(this.busy)throw new Error('Aktualisierung läuft bereits.');
  this.busy=true;this.state={stage:'installing',message:'Update wird geladen und gebaut. App danach neu starten.',restartRequired:false};
  void this.perform(target);
  return this.status();
 }
 private async perform(target:string){
  try{
   await this.run('git',['fetch','origin','work'],this.root);
   if((await this.run('git',['rev-parse','FETCH_HEAD'],this.root))!==target)throw new Error();
   if(await this.run('git',['status','--porcelain'],this.root))throw new Error();
   const current=await this.run('git',['rev-parse','HEAD'],this.root);
   await this.run('git',['merge-base','--is-ancestor',current,target],this.root);
   await this.run('git',['merge','--ff-only',target],this.root);
   const npmCli=process.env.npm_execpath;
   if(!npmCli)throw new Error('App mit npm start starten.');
   await this.run(process.execPath,[npmCli,'ci','--no-audit','--no-fund'],this.root);
   await this.run(process.execPath,[npmCli,'test'],this.root);
   this.state={stage:'complete',message:'Update installiert. App beenden und neu starten, damit der neue Servercode läuft.',restartRequired:true};
  }catch{this.state={stage:'failed',message:'Update nicht abgeschlossen. Keine Änderungen wurden erzwungen. Quellstand und Installation prüfen; die bisherigen Commits bleiben in Git erhalten.',restartRequired:false};}
  finally{this.busy=false;}
 }
}
