import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {APP_VERSION} from '../src/version.js';

test.use({serviceWorkers:'allow'});
test('Pages subdirectory serves the complete app, scoped manifest, real Stockfish and offline restore',async({page,context})=>{
 const prefix='/AI-Chess-Studio/',root=resolve('pages-dist');
 const server=createServer((req,res)=>{void(async()=>{
  const path=new URL(req.url??'/','http://localhost').pathname;
  if(path===prefix.slice(0,-1)){res.writeHead(302,{Location:prefix});res.end();return;}
  if(!path.startsWith(prefix)){res.writeHead(404);res.end('Outside app');return;}
  const file=resolve(root,decodeURIComponent(path.slice(prefix.length))||'index.html');
  if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
  try{const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.webmanifest':'application/manifest+json','.png':'image/png','.txt':'text/plain'} as Record<string,string>)[extname(file)]??'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(body);}catch{res.writeHead(404);res.end();}
 })();});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw new Error();const origin=`http://127.0.0.1:${address.port}`;
 const errors:string[]=[],outside:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{const url=new URL(request.url());if(url.origin===origin&&!url.pathname.startsWith(prefix)&&url.pathname!==prefix.slice(0,-1))outside.push(url.pathname);});
 try{
  await page.goto(origin+prefix.slice(0,-1));await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await expect(page.locator('#app-version')).toHaveText('Version '+APP_VERSION);await expect(page.locator('#platform-status')).toContainText('Eigenständige Web-App');
  const manifestURL=await page.locator('link[rel=manifest]').evaluate((link:HTMLLinkElement)=>link.href);expect(manifestURL).toBe(origin+prefix+'manifest.webmanifest');
  const manifest=await(await page.request.get(manifestURL)).json();expect(new URL(manifest.start_url,manifestURL).pathname).toBe(prefix);expect(new URL(manifest.scope,manifestURL).pathname).toBe(prefix);for(const icon of manifest.icons)expect(new URL(icon.src,manifestURL).pathname).toMatch(/^\/AI-Chess-Studio\/icons\//);
  await page.locator('#game-color').selectOption('b');await page.locator('#game-form button').click();await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen',{timeout:12000});await page.locator('#game-pause').click();
  await page.getByRole('tab',{name:'Lernen',exact:true}).click();await page.locator('#question').fill('Mein Entwurf für die Pages-Partie');await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.locator('#pwa-tools > summary').click();await expect(page.locator('#pwa-status')).toContainText('Offline-Start vorbereitet');
  expect(await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return new URL(r.scope).pathname;})).toBe(prefix);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  const cached=await page.evaluate(async()=>{const result:string[]=[];for(const key of await caches.keys())for(const r of await(await caches.open(key)).keys())result.push(new URL(r.url).pathname);return result;});expect(cached.every(path=>path.startsWith(prefix))).toBe(true);expect(cached.some(path=>path.endsWith('.wasm'))).toBe(true);expect(cached.some(path=>path.includes('/api/'))).toBe(false);
  await context.setOffline(true);await page.reload();await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.getByRole('tab',{name:'Partie',exact:true}).click();await expect(page.locator('#game-status')).toContainText('Analysemodus');await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
  await page.getByRole('tab',{name:'Lernen',exact:true}).click();await expect(page.locator('#question')).toHaveValue('Mein Entwurf für die Pages-Partie');
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();const licenses=page.locator('footer a');await expect(licenses).toHaveAttribute('href',prefix+'licenses.html');await licenses.click();await expect(page.getByRole('heading',{name:'Lizenzen und Enginequellen'})).toBeVisible();await page.getByRole('link',{name:'BSD-2-Clause-Lizenz'}).click();await expect(page.locator('body')).toContainText('Jeff Hlywa');
  expect(outside).toEqual([]);expect(errors).toEqual([]);
 }finally{await context.setOffline(false);await page.goto('about:blank');await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
