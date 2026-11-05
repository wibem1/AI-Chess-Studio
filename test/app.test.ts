import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_VERSION } from '../src/version.js';
import { createStudioServer } from '../server/app.js';

test('built application server serves browser assets and rejects checkout paths and foreign origins', async () => {
  const folder=mkdtempSync(join(tmpdir(),'chess-app-test-'));
  const server = createStudioServer({credentialsPath:join(folder,'credentials.json'),env:{CHESS_ENABLE_PAID_API:'0'}});
  await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve));
  const addr=server.address(); assert.ok(addr && typeof addr !== 'string');
  const base=`http://127.0.0.1:${addr.port}`;
  try {
    const diagnostic=await (await fetch(base+'/api/diagnostics')).json();
    assert.equal(diagnostic.version,APP_VERSION);
    const index=await fetch(base);assert.equal(index.status,200);
    assert.match(index.headers.get('content-security-policy')!,/frame-ancestors 'none'/);
    const html=await index.text();assert.match(html,/AI-Chess-Studio/);
    const asset=html.match(/src="(\/assets\/[^\"]+\.js)"/);assert.ok(asset);
    const js=await fetch(base+asset[1]);assert.equal(js.status,200);
    assert.match(js.headers.get('content-type')!,/javascript/);
    const script=await js.text();assert.ok(!script.includes('CHESS_API_KEY'));
    for(const path of ['/src/session.ts','/server/model.ts','/.env','/package.json','/assets/../../server/model.ts','/api/unknown']) assert.equal((await fetch(base+path)).status,404);
    assert.equal((await fetch(base,{method:'HEAD'})).status,200);
    assert.equal((await fetch(base,{method:'POST'})).status,405);
    const denied=await fetch(base+'/api/dialogue',{method:'POST',headers:{Origin:'https://foreign.example','Content-Type':'application/json'},body:'{}'});
    assert.equal(denied.status,403);
    assert.deepEqual(await (await fetch(base+'/api/status')).json(),{available:false,remaining:3});
  } finally {await new Promise<void>((resolve,reject) => server.close(e => e ? reject(e) : resolve()));rmSync(folder,{recursive:true,force:true});}
});
