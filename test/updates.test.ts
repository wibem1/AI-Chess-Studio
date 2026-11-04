import {test} from 'node:test';
import assert from 'node:assert/strict';
import {UpdateService,type UpdateRunner} from '../server/updates.js';
const current='a'.repeat(40),target='b'.repeat(40);
function fake(dirty=false,failBuild=false){
 const calls:string[][]=[];
 const run:UpdateRunner=async(program,args)=>{
  calls.push([program,...args]);
  if(args.join(' ')==='remote get-url origin')return 'https://github.com/wibem1/AI-Chess-Studio.git';
  if(args.join(' ')==='rev-parse HEAD')return current;
  if(args[0]==='ls-remote')return `${target}\trefs/heads/work`;
  if(args[0]==='status')return dirty?' M user-file.ts':'';
  if(args.join(' ')==='rev-parse FETCH_HEAD')return target;
  if(failBuild && args.includes('test'))throw new Error('simulated build failure');
  return '';
 };return {run,calls};
}
test('update check identifies target without mutating the project',async()=>{
 const f=fake(),s=new UpdateService('/project',f.run);const r=await s.check();
 assert.equal(r.target,target);assert.equal(r.canInstall,true);
 assert.ok(!f.calls.some(c=>c.includes('fetch')||c.includes('merge')));
});
test('dirty checkout and changed target block installation before fetch',async()=>{
 const f=fake(true),s=new UpdateService('/project',f.run);await assert.rejects(s.install(target));
 assert.ok(!f.calls.some(c=>c.includes('fetch')));
 const g=fake();await assert.rejects(new UpdateService('/project',g.run).install('c'.repeat(40)));
 assert.ok(!g.calls.some(c=>c.includes('fetch')));
});
test('update installation uses fast-forward only and reports required restart',async()=>{
 const f=fake(),s=new UpdateService('/project',f.run);await s.install(target);
 for(let i=0;i<30&&s.status().stage==='installing';i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(s.status().stage,'complete');assert.equal(s.status().restartRequired,true);
 assert.ok(f.calls.some(c=>c.includes('--ff-only')));assert.ok(!f.calls.some(c=>c.includes('--force')||c.includes('reset')));
});
test('update failure is reported and never forces resets or overwrites',async()=>{
 const f=fake(false,true),s=new UpdateService('/project',f.run);await s.install(target);
 for(let i=0;i<30&&s.status().stage==='installing';i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(s.status().stage,'failed');assert.ok(!f.calls.some(c=>c.includes('reset')));
});
test('foreign update origin is rejected',async()=>{
 const s=new UpdateService('/project',async()=> 'https://foreign.example/repo');await assert.rejects(s.check());
});
