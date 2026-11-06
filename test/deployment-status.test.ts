import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePagesRuns,pagesRunMatchesCommit,pagesRunState} from '../src/deployment-status.js';
const run=(id:string,branch='refs/heads/gh-pages',conclusion='WORKFLOW_RUN_CONCLUSION_SUCCESS')=>({id,workflowFilePath:'dynamic/pages/pages-build-deployment',branch:{name:branch},state:{status:'WORKFLOW_RUN_STATUS_COMPLETED',conclusion}});
const html=(runs:unknown[])=>'<script type="application/json" data-target="react-app.embeddedData">'+JSON.stringify({payload:{allWorkflowRunsRoute:{workflowRuns:runs}}})+'</script>';
test('deployment status accepts only Pages runs for gh-pages and validated numeric identifiers',()=>{
 assert.deepEqual(parsePagesRuns(html([run('1'),run('2','refs/heads/work'),run('https://untrusted.example/'),{...run('3'),workflowFilePath:'unrelated'}])),[{id:'1',status:'WORKFLOW_RUN_STATUS_COMPLETED',conclusion:'WORKFLOW_RUN_CONCLUSION_SUCCESS'}]);
});
test('deployment success requires the exact publication commit rather than another successful run',()=>{
 const sha='a'.repeat(40),title='<title>pages build and deployment · wibem1/AI-Chess-Studio@aaaaaaa · GitHub</title>';assert.equal(pagesRunMatchesCommit(title+'<a href="/wibem1/AI-Chess-Studio/commit/'+sha+'">',sha),true);assert.equal(pagesRunMatchesCommit(title+'<a href="/wibem1/AI-Chess-Studio/commit/'+'b'.repeat(40)+'">',sha),false);assert.equal(pagesRunMatchesCommit(sha,'not-a-commit'),false);assert.equal(pagesRunMatchesCommit('<title>other commit</title><a href="/wibem1/AI-Chess-Studio/commit/'+sha+'">',sha),false);
});
test('failed, cancelled, pending and unknown deployment states never count as success',()=>{
 for(const state of ['FAILURE','CANCELLED','TIMED_OUT','ACTION_REQUIRED'])assert.equal(pagesRunState(parsePagesRuns(html([run('1','refs/heads/gh-pages','WORKFLOW_RUN_CONCLUSION_'+state)]))[0]!), 'failure');
 assert.equal(pagesRunState({id:'1',status:'WORKFLOW_RUN_STATUS_IN_PROGRESS',conclusion:null}),'pending');assert.equal(pagesRunState({id:'1',status:'WORKFLOW_RUN_STATUS_COMPLETED',conclusion:null}),'unknown');assert.equal(pagesRunState({id:'1',status:'new-format',conclusion:'WORKFLOW_RUN_CONCLUSION_SUCCESS'}),'unknown');assert.equal(pagesRunState(parsePagesRuns(html([run('1')]))[0]!),'success');
});
test('missing or changed public response fails closed instead of announcing an update',()=>{
 for(const response of ['Forbidden','<html>Sign in</html>','<script data-target="react-app.embeddedData">bad json</script>'])assert.throws(()=>parsePagesRuns(response));
});
