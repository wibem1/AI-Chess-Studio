import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';

test('manual Pages publisher commits only web files, preserves update history and refuses an unrelated target',()=>{
 const folder=mkdtempSync(join(tmpdir(),'chess-publisher-fixture-')),project=join(folder,'project'),remote=join(folder,'site.git'),inspect=join(folder,'inspect');
 const script=resolve('scripts/publish-pages.mjs');
 const git=(args:string[],cwd=folder)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const commit=(cwd:string,message:string)=>git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m',message],cwd);
 try{
  mkdirSync(project);git(['init','--bare',remote]);git(['init','--initial-branch=main'],project);writeFileSync(join(project,'package.json'),JSON.stringify({version:'0.3.1'}));git(['add','.'],project);commit(project,'source fixture');git(['push',remote,'main'],project);const sourceHead=git(['rev-parse','main'],project);
  mkdirSync(join(project,'pages-dist'));writeFileSync(join(project,'pages-dist','index.html'),'<script src="/AI-Chess-Studio/assets/fixture.js"></script>');writeFileSync(join(project,'pages-dist','service-worker.js'),'const BASE="/AI-Chess-Studio/";');writeFileSync(join(project,'pages-dist','.nojekyll'),'');
  const environment={...process.env,GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:`url.file://${remote}.insteadOf`,GIT_CONFIG_VALUE_0:'https://github.com/wibem1/AI-Chess-Studio.git',GIT_ALLOW_PROTOCOL:'file'};
  const run=(args:string[]=[])=>spawnSync(process.execPath,[script,...args],{cwd:project,env:environment,encoding:'utf8'});
  let result=run();assert.equal(result.status,0,result.stderr);git(['clone','--branch','gh-pages',remote,inspect]);
  assert.equal(JSON.parse(readFileSync(join(inspect,'BUILD.json'),'utf8')).kind,'github-pages-static-site');assert.equal(existsSync(join(inspect,'package.json')),false);assert.equal(git(['rev-list','--count','gh-pages'],inspect),'1');
  writeFileSync(join(project,'pages-dist','index.html'),'<script src="/AI-Chess-Studio/assets/updated.js"></script>');result=run();assert.equal(result.status,0,result.stderr);git(['pull','--ff-only'],inspect);assert.equal(git(['rev-list','--count','gh-pages'],inspect),'2');assert.equal(git(['ls-remote',remote,'refs/heads/main']).split(/\s/)[0],sourceHead);assert.match(readFileSync(join(inspect,'index.html'),'utf8'),/updated/);
  writeFileSync(join(inspect,'personal.txt'),'must survive');git(['add','.'],inspect);commit(inspect,'unrelated user file');git(['push','origin','gh-pages'],inspect);const before=git(['rev-parse','gh-pages'],inspect);
  result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/Fremde Datei/);assert.equal(git(['ls-remote',remote,'refs/heads/gh-pages']).split(/\s/)[0],before);
  writeFileSync(join(project,'pages-dist','credentials.json'),'fixture must never publish');result=run(['--prepare-only']);assert.notEqual(result.status,0);assert.match(result.stderr,/Unerwartete Datei/);assert.equal(git(['ls-remote',remote,'refs/heads/gh-pages']).split(/\s/)[0],before);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
