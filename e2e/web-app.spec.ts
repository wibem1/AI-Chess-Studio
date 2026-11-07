import {openView} from './navigation-helper.js';
import {createStudioServer} from '../server/app.js';
import {mkdtempSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test,expect,type Page} from '@playwright/test';
import {REVIEW_PGN} from '../test/fixtures/review-game.js';
import {APP_VERSION} from '../src/version.js';
const secret='fixture-web-local-api-secret',password='fixture-device-password';
const reply={message:'Lass uns zuerst deinen Plan verstehen.',plan:'Zentrum prüfen',opponent:'Möglicher Gegenplan',risks:'Antwort beachten',playability:'Verständlich spielen',assessment:{verdict:'unclear' as const,reason:'Testeinschätzung: keine geprüfte Gesamtbewertung.',dangers:[]},humanFactors:{idea:'Idee prüfen',calculation:'Rechnen',pitfalls:'Antwort beachten',continuation:'Plan fortsetzen'},candidates:[],openQuestions:['Was möchtest du erreichen?']};
async function start(page:Page){await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await expect(page.locator('#platform-status')).toContainText('Eigenständige Web-App');}
async function settings(page:Page){await openView(page,'settings');}
async function saveKey(page:Page){await settings(page);await page.locator('#api-settings > summary').click();await page.locator('#api-key').fill(secret);if(await page.locator('#vault-setup').getAttribute('open')===null)await page.locator('#vault-setup > summary').click();await page.locator('#vault-password').fill(password);await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('verschlüsselt auf diesem Gerät gespeichert');}
async function unlock(page:Page){await settings(page);await page.locator('#api-settings > summary').click();if(await page.locator('#vault-controls').getAttribute('open')===null)await page.locator('#vault-controls > summary').click();await page.locator('#vault-unlock-password').fill(password);await page.locator('#vault-unlock').click();await expect(page.locator('#api-feedback')).toContainText('Schlüsselfach entsperrt');}
async function ask(page:Page,question='Welche Idee habe ich?'){await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();if(await page.locator('#learning-settings').getAttribute('open')===null)await page.locator('#learning-settings > summary').click();if(await page.locator('#learning-extras').getAttribute('open')===null)await page.locator('#learning-extras > summary').click();await page.locator('#dialogue-mode').selectOption('model');await page.locator('#question').fill(question);await page.locator('#ask').click();}
async function readStore(page:Page,store:string){return page.evaluate(async store=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('ai-chess-studio',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const value=await new Promise<any>((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});db.close();return value;},store);}
async function mockedProvider(page:Page,calls:{count:number}){await page.route('https://api.openai.com/**',async route=>{calls.count++;expect(route.request().url()).toBe('https://api.openai.com/v1/chat/completions');expect(route.request().headers().authorization).toBe('Bearer '+secret);expect(route.request().postDataJSON().max_completion_tokens).toBe(800);await route.fulfill({contentType:'application/json',body:JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(reply)}}],usage:{prompt_tokens:45,completion_tokens:25}})});});}

test('web vault confirms save, preserves scrolling, stores ciphertext only and locks after reload',async({page})=>{
 const calls={count:0};await mockedProvider(page,calls);await start(page);await saveKey(page);expect(calls.count).toBe(0);await expect(page.locator('#api-key')).toHaveValue('');await expect(page.locator('#vault-password')).toHaveValue('');
 const value=await readStore(page,'vault');expect(value.version).toBe(1);expect(value.apiKey).toBeUndefined();
 const plaintext=await page.evaluate(async()=>{const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open('ai-chess-studio',1);r.onsuccess=()=>resolve(r.result);});const r=db.transaction('vault').objectStore('vault').get('current');return await new Promise<string>(resolve=>{r.onsuccess=()=>{db.close();resolve(new TextDecoder().decode(r.result.ciphertext));};});});expect(plaintext).not.toContain(secret);expect(plaintext).not.toContain(password);
 expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).not.toContain(secret);
 await page.evaluate(()=>scrollTo(0,0));const before=await page.evaluate(()=>scrollY);await page.mouse.move(1000,350);await page.mouse.wheel(0,700);await expect.poll(()=>page.evaluate(()=>scrollY)).not.toBe(before);
 await page.reload();await expect(page.locator('#credential-status')).toContainText('gesperrt');await settings(page);await page.locator('#api-settings > summary').click();await page.locator('#vault-controls > summary').click();await page.locator('#vault-unlock-password').fill('wrong-device-password');await page.locator('#vault-unlock').click();await expect(page.locator('#api-feedback')).toContainText('nicht entsperrt');if(await page.locator('#vault-controls').getAttribute('open')===null)await page.locator('#vault-controls > summary').click();await page.locator('#vault-unlock-password').fill(password);await page.locator('#vault-unlock').click();await expect(page.locator('#credential-status')).toContainText('entsperrt');expect(calls.count).toBe(0);
 await ask(page);await expect(page.locator('#dialogue')).toContainText(reply.message);expect(calls.count).toBe(1);await settings(page);await page.locator('#export').locator('xpath=ancestor::details').locator('summary').click();await page.locator('#export').click();expect(await page.locator('#session-json').inputValue()).not.toContain(secret);expect(await page.locator('#session-json').inputValue()).not.toContain(password);
 await page.reload();await expect(page.locator('#credential-status')).toContainText('gesperrt');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#dialogue')).toContainText(reply.message);await expect(page.locator('#question')).toHaveValue('Welche Idee habe ich?');
});

test('web budget is shared atomically across windows and persists through reload',async({page,context})=>{
 const calls={count:0};await mockedProvider(page,calls);await start(page);await saveKey(page);
 const second=await context.newPage();await mockedProvider(second,calls);await start(second);await unlock(second);
 await Promise.all([ask(page,'Erste Frage?'),ask(second,'Zweite Frage?')]);await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');await expect(second.locator('#dialogue-feedback')).toContainText('Modellantwort');
 await Promise.all([ask(page,'Dritte Frage?'),ask(second,'Vierte Frage?')]);await expect.poll(()=>calls.count).toBe(3);await expect.poll(async()=>Number((await readStore(page,'budget')).requests)).toBe(3);
 await page.reload();await expect(page.locator('#model-status')).toContainText('Anfragelimit');await unlock(page);await expect(page.locator('#model-status')).toContainText('Anfragelimit');expect(calls.count).toBe(3);
});

test('web browser factcheck runs real Stockfish and restores local session without API backend',async({page})=>{
 let apiCalls=0;await page.route('**/api/**',route=>{apiCalls++;return route.abort();});await start(page);
 await page.getByRole('button',{name:'e2: Weiß Bauer',exact:true}).click();await page.getByRole('button',{name:'e4: leer',exact:true}).click();
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.getByText('Taktischer Faktencheck · optional',{exact:true}).click();await page.locator('#tactical-check').click();await expect(page.locator('#tactical-feedback')).toContainText('Suchbefund an der angefragten Stellung gespeichert',{timeout:12000});await expect(page.locator('#tactical-results')).toContainText('Stockfish');expect(apiCalls).toBe(0);
 await expect.poll(async()=>JSON.parse((await readStore(page,'session')).json).annotations.length).toBe(1);await page.reload();await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.getByText('Taktischer Faktencheck · optional',{exact:true}).click();await expect(page.locator('#tactical-results')).toContainText('Stockfish');
});


test('web key saving keeps native finger scrolling usable at Windows, phone and tablet sizes',async({browser})=>{
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:820,height:1180}]){
  const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();await start(page);await saveKey(page);
  await page.evaluate(()=>scrollTo(0,0));const cdp=await context.newCDPSession(page),x=viewport.width-20,y=Math.round(viewport.height*0.7);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let distance=40;distance<=280;distance+=40)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-distance}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(50);
  expect(await page.evaluate(()=>String(getSelection()??''))).toBe('');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
 }
});

test.describe('offline shell',()=>{
 test.use({serviceWorkers:'allow'});
 test('installed public shell starts offline, restores PGN and plays with real WASM without caching secrets',async({page,context})=>{
  await start(page);await saveKey(page);
  await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();if(await page.locator('#learning-settings').getAttribute('open')===null)await page.locator('#learning-settings > summary').click();await page.locator('#learning-extras > summary').click();await page.locator('#review-import > summary').click();await page.locator('#pgn-input').fill(REVIEW_PGN);await page.locator('#pgn-player').fill('wibem');await page.locator('#pgn-import-form button').click();await expect(page.locator('#review-panel')).toBeVisible();await page.locator('#review-unknown').click();
  await settings(page);await page.locator('#pwa-tools > summary').click();await expect(page.locator('#pwa-status')).toContainText('Offline-Start vorbereitet',{timeout:15000});await expect.poll(async()=>!!await page.evaluate(()=>navigator.serviceWorker.controller)).toBe(true);
  await expect.poll(async()=>JSON.parse((await readStore(page,'session')).json).review!==undefined).toBe(true);
  const cached=await page.evaluate(async()=>{const values=[];for(const key of await caches.keys()){for(const r of await(await caches.open(key)).keys())values.push(r.url);}return values;});expect(cached.some(url=>url.includes('.wasm'))).toBe(true);expect(cached.some(url=>url.includes('/api/')||url.includes('openai'))).toBe(false);
  await context.setOffline(true);await page.reload();await expect(page.locator('#platform-status')).toContainText('Eigenständige Web-App');await expect(page.locator('#credential-status')).toContainText('gesperrt');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#review-panel')).toBeVisible();
  await page.locator('#review-whole').click();await openView(page,'variants');await page.locator('#variations button').first().click();await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await page.locator('#game-color').selectOption('b');await page.locator('#game-form button').click();await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen',{timeout:12000});await expect(page.locator('#position-status')).toContainText('Schwarz unten');
 });
 test('a real waiting worker updates only after confirmation and preserves the saved draft',async({page})=>{
  const folder=mkdtempSync(join(tmpdir(),'chess-pwa-update-'));cpSync('web-dist',join(folder,'web'),{recursive:true});
  const server=createStudioServer({webRoot:join(folder,'web'),credentialsPath:join(folder,'credentials.json'),env:{CHESS_ENABLE_PAID_API:'0'}});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw new Error('Testserver fehlt.');
  try{
   await page.goto(`http://127.0.0.1:${address.port}/?platform=web`);await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
   await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#question').fill('Mein noch ungesendeter Plan');
   await settings(page);await page.locator('#pwa-tools > summary').click();await expect(page.locator('#pwa-status')).toContainText('Offline-Start vorbereitet');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
   await page.locator('#pwa-check').click();await expect(page.locator('#pwa-status')).toContainText(`Version ${APP_VERSION} ist aktuell`);await expect(page.locator('#pwa-apply')).toBeDisabled();
   const sw=join(folder,'web','service-worker.js'),html=join(folder,'web','index.html');writeFileSync(sw,readFileSync(sw,'utf8').replace('chess-studio-shell-','chess-studio-shell-update-fixture-')+"\nself.addEventListener('install',event=>event.waitUntil(new Promise(resolve=>setTimeout(resolve,1500))));");writeFileSync(html,readFileSync(html,'utf8').replace('</head>','<meta name="test-build" content="2"></head>'));
   await page.locator('#pwa-check').click();await expect(page.locator('#pwa-status')).toContainText('Web-Update wird heruntergeladen');await expect(page.locator('#pwa-apply')).toBeEnabled({timeout:10000});await expect(page.locator('meta[name=test-build]')).toHaveCount(0);
   await page.locator('#pwa-apply').click();await expect(page.locator('#pwa-status')).toContainText('Neuladen bestätigen');await expect(page.locator('meta[name=test-build]')).toHaveCount(0);
   await page.locator('#pwa-update-consent').check();await Promise.all([page.waitForEvent('load'),page.locator('#pwa-apply').click()]);await expect(page.locator('meta[name=test-build]')).toHaveAttribute('content','2');
   await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#question')).toHaveValue('Mein noch ungesendeter Plan');
  }finally{await page.goto('about:blank');await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(folder,{recursive:true,force:true});}
 });

 test('failed update download keeps the existing app and allows a later successful check',async({page,context})=>{
  const folder=mkdtempSync(join(tmpdir(),'chess-pwa-failure-'));cpSync('web-dist',join(folder,'web'),{recursive:true});
  const server=createStudioServer({webRoot:join(folder,'web'),credentialsPath:join(folder,'credentials.json'),env:{CHESS_ENABLE_PAID_API:'0'}});
  let rejectWorker=false;const serve=server.listeners('request')[0]!;server.removeAllListeners('request');server.on('request',(req,res)=>{if(rejectWorker&&req.url==='/service-worker.js'){res.writeHead(503);res.end();}else serve.call(server,req,res);});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw new Error('Testserver fehlt.');
  try{
   await page.goto(`http://127.0.0.1:${address.port}/?platform=web`);await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
   await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#question').fill('Mein Plan bleibt erhalten');
   await settings(page);await page.locator('#pwa-tools > summary').click();await expect(page.locator('#pwa-status')).toContainText('Offline-Start vorbereitet');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
   const sw=join(folder,'web','service-worker.js'),original=readFileSync(sw,'utf8');
   writeFileSync(sw,original+"\nself.addEventListener('install',event=>event.waitUntil(Promise.reject(new Error('fixture install failure'))));");
   await page.locator('#pwa-check').click();await expect(page.locator('#pwa-status')).toContainText('Herunterladen fehlgeschlagen');await expect(page.locator('#pwa-apply')).toBeDisabled();
   rejectWorker=true;await page.locator('#pwa-check').click();await expect(page.locator('#pwa-status')).toContainText('Updateprüfung fehlgeschlagen');await expect(page.locator('#pwa-check')).toBeEnabled();
   rejectWorker=false;writeFileSync(sw,original);await page.locator('#pwa-check').click();await expect(page.locator('#pwa-status')).toContainText(`Version ${APP_VERSION} ist aktuell`);
   await page.reload();await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#question')).toHaveValue('Mein Plan bleibt erhalten');
  }finally{await context.setOffline(false);await page.goto('about:blank');await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(folder,{recursive:true,force:true});}
 });

});

test('default key storage needs no password, survives reload and synchronizes deletion',async({page,context})=>{
 const calls={count:0};await mockedProvider(page,calls);await start(page);await settings(page);await page.locator('#api-settings > summary').click();
 await expect(page.locator('#vault-password')).toBeHidden();await page.locator('#api-key').fill(secret);await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('Kein zusätzliches App-Passwort');
 const sealed=await readStore(page,'vault');expect(sealed.version).toBe(2);
 const protectedKey=await page.evaluate(async()=>{const r=indexedDB.open('ai-chess-studio',1);const db=await new Promise<IDBDatabase>(resolve=>{r.onsuccess=()=>resolve(r.result);});const request=db.transaction('vault').objectStore('vault').get('current');return new Promise<boolean>(resolve=>{request.onsuccess=()=>{const v=request.result;db.close();resolve(v.key instanceof CryptoKey&&!v.key.extractable&&!new TextDecoder().decode(v.ciphertext).includes('fixture-web-local-api-secret'));};});});expect(protectedKey).toBe(true);
 await page.reload();await expect(page.locator('#credential-status')).toContainText('Kein zusätzliches App-Passwort');await settings(page);await page.locator('#api-settings > summary').click();await expect(page.locator('#vault-controls')).toBeHidden();expect(calls.count).toBe(0);
 const other=await context.newPage();await start(other);await expect(other.locator('#credential-status')).toContainText('gespeichert und bereit');
 await page.locator('#api-disconnect').click();await expect(other.locator('#credential-status')).toContainText('Kein API-Schlüssel');await other.close();expect(calls.count).toBe(0);
});

test('existing password storage can be converted without re-entering the API key',async({page})=>{
 await start(page);await saveKey(page);await page.reload();await unlock(page);await page.locator('#vault-use-device').click();await expect(page.locator('#api-feedback')).toContainText('Kein zusätzliches App-Passwort mehr');await page.reload();await expect(page.locator('#credential-status')).toContainText('gespeichert und bereit');expect((await readStore(page,'vault')).version).toBe(2);
});

test('new key save bypasses old password storage and ignores a closed optional password field',async({page})=>{
 await start(page);await saveKey(page);await page.reload();await settings(page);await page.locator('#api-settings > summary').click();
 await expect(page.locator('#vault-unlock-password')).toBeHidden();await expect(page.locator('#api-key')).toBeVisible();
 await page.locator('#api-key').fill('replacement-profile-key-fixture');await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('Freigabe für Modellanfragen');await expect(page.locator('#api-key')).toHaveValue('replacement-profile-key-fixture');
 await page.locator('#vault-password').evaluate((field:HTMLInputElement)=>{field.value='x';});
 await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('Kein zusätzliches App-Passwort');await expect(page.locator('#api-key')).toHaveValue('');
 expect((await readStore(page,'vault')).version).toBe(2);await page.reload();await expect(page.locator('#credential-status')).toContainText('gespeichert und bereit');
});

test('optional password has no ten-character minimum',async({page})=>{
 await start(page);await settings(page);await page.locator('#api-settings > summary').click();await page.locator('#api-key').fill(secret);await page.locator('#vault-setup > summary').click();await page.locator('#vault-password').fill('ab');await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('verschlüsselt auf diesem Gerät gespeichert');
 await page.reload();await settings(page);await page.locator('#api-settings > summary').click();await page.locator('#vault-controls > summary').click();await page.locator('#vault-unlock-password').fill('ab');await page.locator('#vault-unlock').click();await expect(page.locator('#api-feedback')).toContainText('Schlüsselfach entsperrt');
});

test('coach receives verified mating threat and shows assessment and danger without opening analysis details',async({page})=>{
 let calls=0;
 await page.route('https://api.openai.com/**',async route=>{
  calls++;const data=route.request().postDataJSON(),current=JSON.parse(data.messages.at(-1).content);
  expect(current.positionFacts.sideToMove).toBe('b');expect(current.positionFacts.mateInOne).toEqual(['Qh4#']);expect(current.positionFacts.material.whiteMinusBlack).toBe(0);
  await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify({...reply,message:'Der weiße König ist akut gefährdet.',assessment:{verdict:'black_advantage',reason:'Die offene Diagonale h4–e1 ermöglicht Matt.',dangers:['Qh4# setzt Weiß unmittelbar matt.']}})}}],usage:{prompt_tokens:80,completion_tokens:90}}});
 });
 await start(page);await saveKey(page);await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 for(const [from,to] of [['f2','f3'],['e7','e5'],['g2','g4']]){await page.locator(`#board [data-square=${from}]`).click();await page.locator(`#board [data-square=${to}]`).click();}
 await ask(page,'Was droht hier?');await expect(page.locator('#dialogue')).toContainText('Vorteil Schwarz');
 await expect(page.getByText('Konkrete Gefahren: Qh4# setzt Weiß unmittelbar matt.',{exact:false})).toBeVisible();
 await expect(page.locator('#dialogue')).toContainText('Matt in einem für Schwarz: Qh4#');expect(calls).toBe(1);
});

test('saving a key overrides an explicitly chosen demo and restores real mode after reload without generation',async({page})=>{
 const calls={count:0};await mockedProvider(page,calls);await start(page);
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#learning-settings > summary').click();await page.locator('#learning-extras > summary').click();await page.locator('#dialogue-mode').selectOption('simulation');
 await settings(page);await page.locator('#api-settings > summary').click();await page.locator('#api-key').fill(secret);await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 await expect(page.locator('#mode-badge')).toContainText('Eigene KI');await page.reload();await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#mode-badge')).toContainText('Eigene KI');await expect(page.locator('#ask')).toBeEnabled();expect(calls.count).toBe(0);
});

test('a saved key with exhausted period stays real and blocked instead of silently falling back to demo',async({page})=>{
 const calls={count:0};await mockedProvider(page,calls);await start(page);
 await settings(page);await page.locator('#api-settings > summary').click();await page.locator('#api-key').fill(secret);await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 for(let i=0;i<3;i++){await ask(page,`Frage ${i}`);await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');}
 await page.reload();await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#mode-badge')).toContainText('KI gesperrt');await expect(page.locator('#chat-access')).toContainText('Budgetperiode');await expect(page.locator('#ask')).toBeDisabled();await expect(page.locator('#simulation-hint')).toBeHidden();await page.locator('#chat-open-access').click();await expect(page.locator('#cost-form')).toBeVisible();await expect(page.locator('#cost-reset-consent')).not.toBeChecked();expect(calls.count).toBe(3);
});
