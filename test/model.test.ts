import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Session } from '../src/session.js';
import { Studio, type DialogueRequest } from '../src/dialogue.js';
import { ApiError, ModelService, readConfig } from '../server/model.js';
import { modelMiddleware } from '../server/http.js';

const request = (): DialogueRequest => ({ nodeId: 'n0', fen: new Session().snapshot().nodes[0]!.fen,
  question: 'Plan?', legalMoves: new Session().legalMoves(), context: [] });
const reply = { message:'Prüfen wir deinen Plan gemeinsam.',plan: 'Zentrum prüfen', opponent: 'Möglicher Gegenplan', risks: 'Drohungen prüfen',
  playability: 'Plan erklären', humanFactors:{idea:'Idee',calculation:'Rechenaufwand',pitfalls:'Übersehbare Antwort',continuation:'Fortsetzung'}, candidates: ['e4'], openQuestions: ['Welche Antwort?'] };
const config = { enabled: true, apiKey: 'local-test-sentinel', model: 'explicit-test-model' };
const response = (content: unknown = reply, finish = 'stop') => new Response(JSON.stringify({ choices: [{ finish_reason: finish, message: { content: JSON.stringify(content) } }] }));
const fake = (fn: (input: string | URL | Request, init?: RequestInit) => Promise<Response>) => fn as typeof fetch;

test('default gate rejects without calling transport; status never exposes configuration', async () => {
  let calls = 0;
  for (const cfg of [readConfig({}), { ...config, enabled: false }, { ...config, apiKey: '' }, { ...config, model: '' }]) {
    const service = new ModelService(cfg, fake(async () => { calls++; return response(); }));
    await assert.rejects(service.reply(request()), (e: unknown) => e instanceof ApiError && e.status === 403);
    assert.deepEqual(service.status(), { available: false, remaining: 3 });
  }
  assert.equal(calls, 0);
});
test('provider contract has fixed TLS endpoint, bounded output, no redirects/retries and server-only auth', async () => {
  let calls = 0;
  const service = new ModelService(config, fake(async (url, init) => {
    calls++; assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(init!.redirect, 'error'); assert.ok(init!.signal);
    assert.equal((init!.headers as Record<string,string>).Authorization, 'Bearer local-test-sentinel');
    const body = JSON.parse(init!.body as string);
    assert.equal(body.max_completion_tokens, 800); assert.equal(body.model, config.model);
    assert.equal(body.messages.length, 2); assert.match(body.messages[0].content, /Hypothesen/);
    return response();
  }));
  assert.deepEqual(await service.reply(request()), reply); assert.equal(calls, 1);
});
test('input validation rejects excessive context, malformed FEN and forged moves before transport', async () => {
  let calls = 0; const service = new ModelService(config, fake(async () => { calls++; return response(); }));
  for (const value of [null, { ...request(), question: 'x'.repeat(1001) }, { ...request(), context: ['x'.repeat(801)] },
    { ...request(), context: Array(7).fill('x') }, { ...request(), fen: 'invalid' }, { ...request(), legalMoves: ['e5'] }]) {
    await assert.rejects(service.reply(value), (e: unknown) => e instanceof ApiError && e.status === 400);
  }
  assert.equal(calls, 0);
});
test('failures consume the three-attempt limit and never leak provider content or keys', async () => {
  let calls = 0; const service = new ModelService(config, fake(async () => { calls++; throw new Error('private provider detail local-test-sentinel'); }));
  for (let i = 0; i < 3; i++) await assert.rejects(service.reply(request()), (e: unknown) => e instanceof ApiError && e.status === 502 && !e.message.includes('sentinel'));
  await assert.rejects(service.reply(request()), (e: unknown) => e instanceof ApiError && e.status === 429);
  assert.equal(calls, 3); assert.equal(service.status().remaining, 0);
});
test('rejects illegal candidates, refusals, truncated and oversized responses', async () => {
  for (const result of [response({ ...reply, candidates: ['e5'] }), response(reply, 'length'), new Response('x'.repeat(70000)),
    new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { refusal: 'no' } }] })), new Response('secret failure', { status: 401 })]) {
    const service = new ModelService(config, fake(async () => result));
    await assert.rejects(service.reply(request()), (e: unknown) => e instanceof ApiError && e.status === 502);
  }
});
test('parallel calls cannot bypass the single-in-flight gate', async () => {
  let resolve!: (r: Response) => void;
  const service = new ModelService(config, fake(() => new Promise(r => { resolve = r; })));
  const pending = service.reply(request());
  await assert.rejects(service.reply(request()), (e: unknown) => e instanceof ApiError && e.status === 429);
  resolve(response()); await pending;
});
test('model provenance and bounded context survive session export without changing branch binding', async () => {
  const studio = new Studio();
  for (let i = 0; i < 9; i++) studio.session.annotate({ nodeId:'n0', kind:'memory', source:'human', text:'x'.repeat(900), hypothesis:true, openQuestions:[] });
  await studio.ask('Plan?', { source:'model', respond: async r => {
    assert.equal(r.context!.length, 6); assert.ok(r.context!.every(t => t.length <= 800)); return reply;
  } });
  const saved = Session.import(studio.session.export()).snapshot();
  assert.equal(saved.annotations.at(-1)!.source, 'model');
  assert.equal(saved.annotations.at(-1)!.hypothesis, true);
});
test('actual local HTTP boundary enforces origin, body size and default model lock', async () => {
  let calls = 0;
  const middleware = modelMiddleware(new ModelService(readConfig({}), fake(async () => { calls++; return response(); })));
  const server = createServer((req,res) => { void middleware(req,res,() => { res.writeHead(404);res.end(); }); });
  await new Promise<void>(r => server.listen(0,'127.0.0.1',r));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.deepEqual(await (await fetch(base+'/api/status')).json(), { available:false, remaining:3 });
    const post = (origin: string, body: string) => fetch(base+'/api/dialogue', { method:'POST', headers:{Origin:origin,'Content-Type':'application/json'}, body });
    assert.equal((await post('https://unrelated.example', JSON.stringify(request()))).status,403);
    assert.equal((await post(base, JSON.stringify(request()))).status,403);
    assert.equal((await post(base, '{broken')).status,400);
    assert.equal((await post(base, 'x'.repeat(17000))).status,413);
    assert.equal(calls,0);
  } finally { await new Promise<void>((resolve,reject) => server.close(e => e ? reject(e) : resolve())); }
});
test('enabled local HTTP service returns validated fixture with no secret exposure', async () => {
  let calls = 0;
  const service = new ModelService(config, fake(async () => { calls++; return response(); }));
  const middleware = modelMiddleware(service);
  const server = createServer((req,res) => { void middleware(req,res,() => { res.writeHead(404);res.end(); }); });
  await new Promise<void>(r => server.listen(0,'127.0.0.1',r));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const result = await fetch(base+'/api/dialogue', { method:'POST', headers:{Origin:base,'Content-Type':'application/json'}, body:JSON.stringify(request()) });
    assert.equal(result.status,200); assert.deepEqual(await result.json(),reply);
    const status = await (await fetch(base+'/api/status')).text();
    assert.equal(status.includes(config.apiKey),false); assert.equal(status.includes(config.model),false);
    assert.equal(calls,1);
  } finally { await new Promise<void>((resolve,reject) => server.close(e => e ? reject(e) : resolve())); }
});

test('app credential input configures memory only, makes no provider call, and can be cleared', async () => {
  let calls=0;
  const service=new ModelService(readConfig({}),fake(async (_url,init) => {
    calls++;assert.equal((init!.headers as Record<string,string>).Authorization,'Bearer local-ui-test-key');
    return response();
  }));
  assert.throws(() => service.configure({action:'connect',apiKey:'local-ui-test-key',model:'gpt-4.1-mini',allowPaid:false}));
  assert.deepEqual(service.configure({action:'connect',apiKey:'local-ui-test-key',model:'gpt-4.1-mini',allowPaid:true}),{available:true,remaining:3});
  assert.equal(calls,0);assert.ok(!JSON.stringify(service.status()).includes('local-ui-test-key'));
  await service.reply(request());assert.equal(calls,1);
  assert.deepEqual(service.configure({action:'disconnect'}),{available:false,remaining:2});
  await assert.rejects(service.reply(request()),(e:unknown) => e instanceof ApiError && e.status===403);
  assert.deepEqual(service.configure({action:'connect',apiKey:'replacement-test-key',model:'gpt-4.1-mini',allowPaid:true}),{available:true,remaining:2});
  assert.equal(new ModelService(readConfig({})).status().available,false);
});
test('actual credential endpoint requires local origin and never returns entered key', async () => {
  let calls=0;
  const middleware=modelMiddleware(new ModelService(readConfig({}),fake(async () => {calls++;return response();})));
  const server=createServer((req,res) => {void middleware(req,res,() => {res.writeHead(404);res.end();});});
  await new Promise<void>(r => server.listen(0,'127.0.0.1',r));
  const address=server.address();assert.ok(address && typeof address!=='string');
  const base=`http://127.0.0.1:${address.port}`;
  const body={action:'connect',apiKey:'local-ui-test-key',model:'gpt-4.1-mini',allowPaid:true};
  try {
    const post=(origin:string,value:unknown) => fetch(base+'/api/model-config',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(value)});
    assert.equal((await post('https://foreign.example',body)).status,403);
    const connected=await post(base,body);assert.equal(connected.status,200);
    assert.deepEqual(await connected.json(),{available:true,remaining:3});
    const status=await (await fetch(base+'/api/status')).text();assert.ok(!status.includes(body.apiKey));
    assert.equal((await post(base,{action:'disconnect'})).status,200);
    assert.equal((await (await fetch(base+'/api/status')).json()).available,false);
    assert.equal(calls,0);
  } finally {await new Promise<void>((resolve,reject) => server.close(e => e ? reject(e) : resolve()));}
});
test('access diagnosis checks model metadata without generation or consuming paid request budget',async()=>{
 let calls=0;
 const service=new ModelService(config,fake(async(url,init)=>{calls++;assert.match(String(url),/\/v1\/models\/explicit-test-model$/);assert.equal(init!.method,'GET');return new Response('{}');}));
 assert.equal((await service.probeAccess()).ok,true);assert.equal(calls,1);assert.equal(service.status().remaining,3);
 assert.equal(service.diagnostics().costs.requests,0);
});
