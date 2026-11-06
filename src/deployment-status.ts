export interface PagesRun {id:string;status:string;conclusion:string|null}
/** Public GitHub HTML is treated as data; an unknown shape cannot prove success. */
export function parsePagesRuns(html:string):PagesRun[]{
 for(const match of html.matchAll(/<script\b[^>]*data-target="react-app\.embeddedData"[^>]*>([\s\S]*?)<\/script>/g)){
  let data:any;try{data=JSON.parse(match[1]!);}catch{continue;}
  const runs=data?.payload?.allWorkflowRunsRoute?.workflowRuns;if(!Array.isArray(runs))continue;
  return runs.filter((r:any)=>r?.workflowFilePath==='dynamic/pages/pages-build-deployment'&&r?.branch?.name==='refs/heads/gh-pages'&&/^\d+$/.test(String(r.id))&&typeof r.state?.status==='string').map((r:any)=>({id:String(r.id),status:r.state.status,conclusion:typeof r.state.conclusion==='string'?r.state.conclusion:null}));
 }
 throw new Error('GitHub-Buildstatus konnte nicht ausgewertet werden.');
}
export function pagesRunMatchesCommit(html:string,sha:string):boolean{
 if(!/^[a-f0-9]{40}$/.test(sha))return false;
 const title=/<title>([^<]*)<\/title>/.exec(html)?.[1]??'';
 return title.includes(`wibem1/AI-Chess-Studio@${sha.slice(0,7)}`)&&html.includes(`/wibem1/AI-Chess-Studio/commit/${sha}`);
}
export function pagesRunState(run:PagesRun):'pending'|'success'|'failure'|'unknown'{
 if(['WORKFLOW_RUN_STATUS_QUEUED','WORKFLOW_RUN_STATUS_PENDING','WORKFLOW_RUN_STATUS_IN_PROGRESS','WORKFLOW_RUN_STATUS_WAITING','WORKFLOW_RUN_STATUS_REQUESTED'].includes(run.status))return 'pending';
 if(run.status!=='WORKFLOW_RUN_STATUS_COMPLETED')return 'unknown';
 if(run.conclusion==='WORKFLOW_RUN_CONCLUSION_SUCCESS')return 'success';
 if(['WORKFLOW_RUN_CONCLUSION_FAILURE','WORKFLOW_RUN_CONCLUSION_CANCELLED','WORKFLOW_RUN_CONCLUSION_TIMED_OUT','WORKFLOW_RUN_CONCLUSION_ACTION_REQUIRED'].includes(run.conclusion??''))return 'failure';
 return 'unknown';
}
