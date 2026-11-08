import {test,expect} from '@playwright/test';
import {REVIEW_PGN} from '../test/fixtures/review-game.js';
import {Session} from '../src/session.js';
test('normal file loader imports a foreign PGN, browses comments safely, exports and restores the backup',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#games-menu > summary').click();
 const original=new Session();original.play('d4');
 await page.locator('#game-file').setInputFiles({name:'source.json',mimeType:'application/json',buffer:Buffer.from(original.export())});await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await page.locator('#game-file').setInputFiles({name:'foreign.pgn',mimeType:'application/x-chess-pgn',buffer:Buffer.from(REVIEW_PGN)});await expect(page.locator('#games-status')).toContainText('PGN-Partie geladen');await expect(page.locator('#pgn-game-info')).toContainText('Ada – wibem');await expect(page.locator('#position-status')).toContainText('n0');await expect(page.locator('#review-panel')).toBeHidden();const backup=await page.locator('#saved-games option').first().getAttribute('value');
 await page.locator('#learn-next').click();await page.locator('#learn-next').click();await expect(page.locator('#position-status')).toContainText('n2');await page.locator('#pgn-game-comments > summary').click();await expect(page.locator('#pgn-game-comment')).toContainText('<img');await expect(page.locator('#pgn-game-comment img')).toHaveCount(0);
 const pending=page.waitForEvent('download');await page.locator('#download-game').click();const download=await pending,fs=await import('node:fs/promises'),saved=JSON.parse(await fs.readFile((await download.path())!,'utf8'));expect(saved.review.browsing).toBe(true);expect(saved.review.pgn).toBe(REVIEW_PGN);
 await page.locator('#game-file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await expect(page.locator('#games-status')).toContainText('Partie geladen');await expect(page.locator('#pgn-game-info')).toContainText('Ada – wibem');await expect(page.locator('#position-status')).toContainText('n2');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/chess-pgn-import.png',fullPage:true});
 await page.locator('#game-file').setInputFiles({name:'broken.pgn',mimeType:'text/plain',buffer:Buffer.from('not chess')});await expect(page.locator('#games-status')).toContainText('PGN konnte nicht gelesen werden');await expect(page.locator('#position-status')).toContainText('n2');
 await page.locator('#saved-games').selectOption(backup!);await page.locator('#load-game').click();await expect(page.locator('#games-status')).toContainText('Partie geladen');await expect(page.locator('#position-status')).toContainText('n1');await expect(page.locator('#pgn-game-info')).toBeHidden();
});

test('iPad-sized reference import with unknown MIME and text fallback preserves the previous session',async({page})=>{
 const {readFileSync}=await import('node:fs'),pgn=readFileSync('test/fixtures/lichess-1Vh80QL2.pgn','utf8');
 await page.setViewportSize({width:820,height:1180});
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#games-menu > summary').click();
 expect(await page.locator('#game-file').getAttribute('accept')).toBeNull();
 await page.locator('#game-file').setInputFiles({name:'lichess.pgn',mimeType:'application/octet-stream',buffer:Buffer.from(pgn)});
 await expect(page.locator('#games-status')).toContainText('PGN-Partie geladen');await expect(page.locator('#pgn-game-info')).toContainText('EgorSN – wibem');
 for(let i=0;i<6;i++)await page.locator('#learn-next').click();
 await page.locator('#pgn-game-comments > summary').click();await expect(page.locator('#pgn-game-comment')).toContainText('0:09:52');await expect(page.locator('#pgn-game-comment')).toContainText('Inaccuracy');
 await page.getByText('PGN-Text einfügen',{exact:true}).click();
 await page.locator('#game-pgn-text').fill('Analysiere das folgende Schachspiel.\n'+pgn);await page.locator('#load-pgn-text').click();
 await expect(page.locator('#games-status')).toContainText('ohne Einleitungstext');await expect(page.locator('#position-status')).toContainText('n6');
 await expect(page.locator('#game-pgn-text')).not.toHaveValue('');
 await page.locator('#game-pgn-text').fill('1. d4 d5 *');await page.locator('#load-pgn-text').click();
 await expect(page.locator('#games-status')).toContainText('PGN-Partie geladen');await expect(page.locator('#game-pgn-text')).toHaveValue('');
 await page.locator('#saved-games').selectOption({index:0});await page.locator('#load-game').click();
 await expect(page.locator('#position-status')).toContainText('n6');await expect(page.locator('#pgn-game-info')).toContainText('EgorSN – wibem');
 await page.locator('#game-file').setInputFiles({name:'lichess.txt',mimeType:'text/plain',buffer:Buffer.from(pgn)});await expect(page.locator('#position-status')).toContainText('n0');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/chess-ipad-pgn.png',fullPage:true});
});

test('failed pre-import backup keeps the complete session and pasted PGN',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#games-menu > summary').click();
 const original=new Session();original.play('e4');original.annotate({nodeId:'n1',source:'human',kind:'memory',hypothesis:false,text:'Vorhandene Notiz',openQuestions:[]});
 await page.locator('#game-file').setInputFiles({name:'source.json',mimeType:'application/json',buffer:Buffer.from(original.export())});await expect(page.locator('#position-status')).toContainText('n1');
 await page.evaluate(async(json)=>{await new Promise<void>((resolve,reject)=>{const request=indexedDB.open('ai-chess-studio',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('session','readwrite');tx.objectStore('session').put(Array.from({length:100},(_,i)=>({id:String(i),title:'Bestehende Partie',date:new Date().toISOString(),json})),'saved-games');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);});},original.export());
 await page.getByText('PGN-Text einfügen',{exact:true}).click();await page.locator('#game-pgn-text').fill('1. d4 d5 *');await page.locator('#load-pgn-text').click();
 await expect(page.locator('#games-status')).toContainText('100 Partien');await expect(page.locator('#game-pgn-text')).toHaveValue('1. d4 d5 *');await expect(page.locator('#position-status')).toContainText('n1');
 const pending=page.waitForEvent('download');await page.locator('#download-game').click();const download=await pending,fs=await import('node:fs/promises');
 expect(JSON.parse(await fs.readFile((await download.path())!,'utf8'))).toEqual(JSON.parse(original.export()));
});
