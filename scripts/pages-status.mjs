import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {parsePagesRuns,pagesRunMatchesCommit,pagesRunState} from '../dist/src/deployment-status.js';
const exec=promisify(execFile),site='https://github.com/wibem1/AI-Chess-Studio';
const read=async url=>(await exec('curl',['--fail','--silent','--show-error','--location','--max-time','20','-H','Cache-Control: no-cache',url],{maxBuffer:2097152})).stdout;
try{
 const explicit=process.argv.indexOf('--commit');let sha=explicit>=0?process.argv[explicit+1]:null;
 if(!sha){const r=await exec('git',['ls-remote','--heads',site+'.git','refs/heads/gh-pages'],{env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});sha=r.stdout.split(/\s/)[0];}
 if(!/^[a-f0-9]{40}$/.test(sha??''))throw new Error('Kein gültiger gh-pages-Commit.');
 const until=Date.now()+(process.argv.includes('--wait')?12*60*1000:0);let previous='';
 while(true){
  const runs=parsePagesRuns(await read(site+'/actions?query=branch%3Agh-pages'));
  const pages=await Promise.allSettled(runs.slice(0,5).map(async run=>({run,html:await read(site+'/actions/runs/'+run.id)})));
  const match=pages.find(result=>result.status==='fulfilled'&&pagesRunMatchesCommit(result.value.html,sha));
  const run=match?.status==='fulfilled'?match.value.run:null,state=run?pagesRunState(run):'pending';
  const status={commit:sha,state,run:run?site+'/actions/runs/'+run.id:null};const serialized=JSON.stringify(status);
  if(serialized!==previous){console.log(serialized);previous=serialized;}
  if(state==='success'){console.log('GitHub bestätigt erfolgreiche Pages-Bereitstellung für diesen Commit. Eine zusätzliche Live-/Geräteprüfung bleibt getrennt.');break;}
  if(state==='failure')throw new Error('GitHub Pages hat diesen Commit nicht erfolgreich bereitgestellt. Siehe Buildlauf.');
  if(state==='unknown')throw new Error('Unbekannter Buildstatus; Veröffentlichung nicht bestätigt.');
  if(Date.now()>=until)throw new Error('Bereitstellung noch nicht bestätigt. Später erneut prüfen; kein weiterer Push wurde automatisch ausgelöst.');
  await new Promise(resolve=>setTimeout(resolve,15000));
 }
}catch(error){console.error(error instanceof Error?error.message:'Statusprüfung fehlgeschlagen.');process.exitCode=1;}
