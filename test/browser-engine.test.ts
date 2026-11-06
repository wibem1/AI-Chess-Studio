import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BrowserPlayingEngine,type EngineWorker} from '../src/browser-engine.js';
import {Session} from '../src/session.js';
import {LearningGame,PLAY_LEVELS} from '../src/game.js';
import {ENGINE_ASSET_BASE,ENGINE_FILES} from '../src/engine-files.js';
import {createStudioServer} from '../server/app.js';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

class FixtureWorker implements EngineWorker {
 onmessage:EngineWorker['onmessage']=null;onerror:EngineWorker['onerror']=null;onmessageerror:EngineWorker['onmessageerror']=null;
 commands:string[]=[];terminated=0;
 constructor(private respond?:(command:string,worker:FixtureWorker)=>void){}
 postMessage(command:string){this.commands.push(command);this.respond?.(command,this);}
 terminate(){this.terminated++;}
 line(data:unknown){this.onmessage?.(new MessageEvent('message',{data}));}
}
function responds(uci='e7e5') {
 return (command:string,worker:FixtureWorker)=>{
  if(command==='uci'){worker.line('id name Stockfish 19 Lite fixture');worker.line('option name Skill Level type spin default 20 min 0 max 20');worker.line('uciok');}
  if(command==='isready')worker.line('readyok');
  if(command.startsWith('go '))worker.line('bestmove '+uci);
 };
}
const root=new Session().snapshot().nodes[0]!.fen;

test('browser adapter sets all five bounded levels and validates the history and returned SAN',async()=>{
 const workers:FixtureWorker[]=[];
 const engine=new BrowserPlayingEngine(()=>{const w=new FixtureWorker(responds());workers.push(w);return w;});
 for(const level of PLAY_LEVELS){
  const result=await engine.move(root,['e4'],level.level);
  assert.equal(result.san,'e5');assert.equal(result.level,level.level);
  const worker=workers.at(-1)!;
  assert.ok(worker.commands.includes('setoption name Hash value 16'));
  assert.ok(worker.commands.includes(`setoption name Skill Level value ${level.skill}`));
  assert.ok(worker.commands.includes(`position fen ${root} moves e2e4`));
  assert.ok(worker.commands.includes(`go depth 12 nodes 20000 movetime ${level.milliseconds}`));
  assert.equal(worker.terminated,1);assert.equal(worker.onmessage,null);
 }
});

test('browser adapter rejects invalid/injected/ended histories and levels before allocating a worker',async()=>{
 let created=0;const engine=new BrowserPlayingEngine(()=>{created++;return new FixtureWorker();});
 for(const [fen,moves,level] of [
  ['bad',[],1],[root,['e5'],1],[root,['e4\nquit'],1],[root,[],99],
  [root,['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8'],1]
 ] as [string,string[],number][])await assert.rejects(engine.move(fen,moves,level));
 assert.equal(created,0);
});

test('browser worker failures, malformed output, missing levels and illegal replies terminate without fallback',async()=>{
 for(const mode of ['load','message','oversized','skill','illegal']){
  const worker=new FixtureWorker(mode==='illegal'?responds('e2e4'):undefined);
  const engine=new BrowserPlayingEngine(()=>worker);
  const pending=engine.move(root,['e4'],1);
  if(mode==='load')worker.onerror?.({preventDefault(){}} as ErrorEvent);
  if(mode==='message')worker.line({unexpected:true});
  if(mode==='oversized')worker.line('x'.repeat(65537));
  if(mode==='skill')worker.line('uciok');
  await assert.rejects(pending);assert.equal(worker.terminated,1);assert.equal(worker.onmessage,null);
 }
});

test('browser timeout and explicit cancellation clean up, and a later explicit request can run',async()=>{
 const first=new FixtureWorker(),second=new FixtureWorker(responds());let index=0;
 const engine=new BrowserPlayingEngine(()=>index++===0?first:second,20);
 await assert.rejects(engine.move(root,['e4'],1),/Zeitlimit/);assert.equal(first.terminated,1);
 assert.equal((await engine.move(root,['e4'],1)).san,'e5');
 const worker=new FixtureWorker(),cancelled=new BrowserPlayingEngine(()=>worker);
 const pending=cancelled.move(root,['e4'],1);cancelled.cancel();await assert.rejects(pending,/abgebrochen/);
 assert.equal(worker.terminated,1);cancelled.cancel();assert.equal(worker.terminated,1);
});

test('a browser adapter cannot overlap requests and game pause invalidates and terminates its pending worker',async()=>{
 const first=new FixtureWorker(),second=new FixtureWorker(responds('e2e4'));let count=0;
 const engine=new BrowserPlayingEngine(()=>count++===0?first:second);
 const s=new Session(),game=new LearningGame(()=>s);game.start('b',1,'browser');
 const pending=game.reply(engine);
 await assert.rejects(engine.move(root,[],1),/beschäftigt/);
 game.pause();assert.equal(await pending,'discarded');assert.equal(first.terminated,1);assert.equal(s.snapshot().nodes.length,1);
 game.resume();assert.equal(await game.reply(engine),'stored');assert.equal(s.snapshot().nodes[1]!.san,'e4');
 assert.equal(s.snapshot().game!.engine,'browser');assert.equal(Session.import(s.export()).snapshot().game!.engine,'browser');
 const raw=s.snapshot();raw.game!.engine='unknown' as 'browser';assert.throws(()=>Session.import(JSON.stringify(raw)));
});

test('browser asset routes deliver unchanged WASM/JS with exact allowlist, MIME, CSP and upstream notices',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'chess-browser-assets-'));
 const server=createStudioServer({env:{CHESS_ENABLE_PAID_API:'0'},credentialsPath:join(dir,'credentials.json')});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`;
 try{
  const wasm=await fetch(base+ENGINE_ASSET_BASE+ENGINE_FILES.wasm);assert.equal(wasm.status,200);
  assert.equal(wasm.headers.get('content-type'),'application/wasm');
  assert.match(wasm.headers.get('cache-control')!,/immutable/);
  assert.deepEqual(Buffer.from(await wasm.arrayBuffer()),readFileSync('node_modules/stockfish/bin/'+ENGINE_FILES.wasm));
  const js=await fetch(base+ENGINE_ASSET_BASE+ENGINE_FILES.script);assert.equal(js.status,200);
  assert.deepEqual(Buffer.from(await js.arrayBuffer()),readFileSync('node_modules/stockfish/bin/'+ENGINE_FILES.script));
  const csp=js.headers.get('content-security-policy')!;assert.match(csp,/worker-src 'self'/);assert.match(csp,/'wasm-unsafe-eval'/);assert.ok(!csp.includes("'unsafe-eval'"));
  assert.match(await (await fetch(base+ENGINE_ASSET_BASE+ENGINE_FILES.license)).text(),/GNU GENERAL PUBLIC LICENSE/);
  assert.match(await (await fetch(base+'/licenses.html')).text(),/chess.js 1.4.0/);
  const chessLicense=await fetch(base+'/licenses/chess.js-LICENSE.txt');assert.match(chessLicense.headers.get('content-type')!,/text\/plain/);assert.deepEqual(Buffer.from(await chessLicense.arrayBuffer()),readFileSync('node_modules/chess.js/LICENSE'));
  assert.match(await (await fetch(base+ENGINE_ASSET_BASE+ENGINE_FILES.source)).text(),/v19\.0\.1/);
  for(const file of ['stockfish-19.js','stockfish-19.wasm','package.json','../package.json','%2e%2e/server/model.ts'])assert.equal((await fetch(base+ENGINE_ASSET_BASE+file)).status,404);
  assert.match((await fetch(base+'/api/status')).headers.get('cache-control')!,/no-store/);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(dir,{recursive:true,force:true});}
});
