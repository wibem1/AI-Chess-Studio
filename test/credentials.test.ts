import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,statSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {FileCredentialsStore} from '../server/credentials.js';
import {ModelService,readConfig} from '../server/model.js';

test('local key persists across service restart, has private permissions and is deleted on request', () => {
 const folder=mkdtempSync(join(tmpdir(),'chess-credentials-'));const path=join(folder,'private','credentials.json');
 try {
  const first=new ModelService(readConfig({}),fetch,new FileCredentialsStore(path));
  first.configure({action:'connect',apiKey:'test-local-key-not-real',model:'gpt-4.1-mini',allowPaid:true});
  assert.equal(first.status().available,true);assert.equal(first.diagnostics().localKeySaved,true);
  if(process.platform!=='win32'){assert.equal(statSync(path).mode&0o777,0o600);assert.equal(statSync(join(folder,'private')).mode&0o777,0o700);}
  const second=new ModelService(readConfig({}),fetch,new FileCredentialsStore(path));assert.equal(second.status().available,true);assert.equal(second.diagnostics().localKeySaved,true);
  assert.ok(!JSON.stringify(second.status()).includes('test-local-key-not-real'));
  second.configure({action:'disconnect'});
  const empty=new ModelService(readConfig({}),fetch,new FileCredentialsStore(path));
  assert.equal(empty.status().available,false);assert.equal(empty.diagnostics().localKeySaved,false);
 } finally{rmSync(folder,{recursive:true,force:true});}
});
test('malformed local credential files fail closed without returning their contents', () => {
 const folder=mkdtempSync(join(tmpdir(),'chess-credentials-'));const path=join(folder,'credentials.json');
 try {writeFileSync(path,'test-sensitive-garbage',{mode:0o600});
  assert.throws(() => new FileCredentialsStore(path).load(),e => e instanceof Error && !e.message.includes(readFileSync(path,'utf8')));
 } finally{rmSync(folder,{recursive:true,force:true});}
});
