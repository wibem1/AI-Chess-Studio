import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { EventEmitter } from 'node:events';
import { listenLocally, startupError } from '../server/listen.js';
const close = (server: Server) => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));

test('occupied default port falls back to a real free loopback port serving this app', async () => {
 const occupied=createServer(),app=createServer((_req,res)=>res.end('new app'));
 const port=await listenLocally(occupied,0,false);
 const messages:string[]=[];
 try {
  const actual=await listenLocally(app,port,true,message=>messages.push(message));
  assert.notEqual(actual,port);assert.match(messages[0]!,/bereits belegt/);
  assert.equal(await (await fetch(`http://127.0.0.1:${actual}`)).text(),'new app');
  assert.equal((app.address() as {address:string}).address,'127.0.0.1');
 } finally {await close(app);await close(occupied);}
});

test('explicit occupied port fails without silently changing port or closing the other server',async()=>{
 const occupied=createServer(),app=createServer();const port=await listenLocally(occupied,0,false);
 try {await assert.rejects(listenLocally(app,port,false),{code:'EADDRINUSE'});assert.ok(occupied.listening);assert.ok(!app.listening);}
 finally {await close(occupied);}
});

test('OS-denied default port retries once with OS-selected port; other errors never retry',async()=>{
 for(const code of ['EACCES','EADDRNOTAVAIL']){
  const app=new EventEmitter() as Server;const attempts:number[]=[];
  app.listen=((port:number)=>{attempts.push(port);queueMicrotask(()=>{
   if(attempts.length===1)app.emit('error',Object.assign(new Error('test'),{code}));else app.emit('listening');
  });return app;}) as Server['listen'];
  app.address=()=>({address:'127.0.0.1',family:'IPv4',port:53210});
  if(code==='EACCES')assert.equal(await listenLocally(app,5173,true,()=>{}),53210);
  else await assert.rejects(listenLocally(app,5173,true),{code});
  assert.deepEqual(attempts,code==='EACCES'?[5173,0]:[5173]);
  assert.equal(app.listenerCount('error'),0);assert.equal(app.listenerCount('listening'),0);
 }
});

test('startup diagnostics show safe OS codes and distinguish occupied and denied ports',()=>{
 assert.match(startupError({code:'EADDRINUSE'},5173),/bereits belegt \(EADDRINUSE\)/);
 assert.match(startupError({code:'EACCES'},5173),/erlaubt.*5173.*EACCES/);
 assert.match(startupError({code:'ENOTFOUND'},5173),/ENOTFOUND/);
 assert.ok(!startupError(new Error('sensitive content'),5173).includes('sensitive content'));
});
