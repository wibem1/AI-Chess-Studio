import {test,expect} from '@playwright/test';
import {Studio} from '../src/dialogue.js';
import {LearningGame} from '../src/game.js';

async function savedReport(page:import('@playwright/test').Page){
 return page.evaluate(async()=>{
  const db:IDBDatabase=await new Promise((resolve,reject)=>{
   const req=indexedDB.open('ai-chess-studio',1);
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  try{return await new Promise<{count:number;positions:number}>((resolve,reject)=>{
   const req=db.transaction('session','readonly').objectStore('session').get('current');
   req.onsuccess=()=>{const s=req.result?.json?JSON.parse(req.result.json):{};
    resolve({count:s.fullGameAnalysis?.records?.length??0,positions:Object.keys(s.positionScores??{}).length});};
   req.onerror=()=>reject(req.error);
  });}finally{db.close();}
 });
}

test('Stockfish scores the whole game automatically, without display switch or separate button; AI gets the saved chronology',async({page})=>{
 test.setTimeout(120000);
 const studio=new Studio(),game=new LearningGame(()=>studio.session);
 game.start('w',1);game.play('f3');
 await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});
 game.play('g4');await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});game.pause();
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'whole-game.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await expect(page.locator('#full-game-start')).toHaveCount(0);
 await expect(page.locator('#full-game-analysis')).toHaveCount(0);
 await expect(page.locator('#stockfish-assist-enabled')).not.toBeChecked();
 await expect.poll(async()=>(await savedReport(page)).count,{timeout:60000}).toBe(4);
 expect((await savedReport(page)).positions).toBe(5);
 await page.reload();await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 expect((await savedReport(page)).count).toBe(4);
 await page.locator('#open-settings').click();
 await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#api-model').fill('gpt-4.1-mini');
 await page.locator('#api-key').fill('fixture-not-real-for-review');
 await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 let calls=0;
 await page.route('https://api.openai.com/v1/chat/completions',route=>{
  calls++;
  const data=route.request().postDataJSON();
  const user=JSON.parse(data.messages.filter((m:{role:string})=>m.role==='user').at(-1).content);
  const context=user.context.join('');
  expect(context).toContain('Lokal geprüfte Stockfish-Partieanalyse');
  expect(context).toContain('Vollständiger chronologischer Verlauf aller 4 Halbzüge');
  for(const move of ['1.f3','1…e5','2.g4','2…Qh4#'])expect(context).toContain(move);
  return route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Weiß machte kritische Fehler; Schwarz nutzte die offenen Diagonalen.'}}],usage:{prompt_tokens:100,completion_tokens:25}}});
 });
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#question').fill('Was war der entscheidende Fehler von Weiß?');
 await page.locator('#ask').click();
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert',{timeout:45000});
 expect(calls).toBe(1);
 await page.locator('#question').fill('Kannst du das genauer erklären?');await page.locator('#ask').click();
 await expect.poll(()=>calls).toBe(2);
});

test('manual scan row disappears under board at three viewport sizes',async({page})=>{
 for(const width of [390,820,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/?platform=web#lernen');
  await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
  await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
  await expect(page.locator('#full-game-start')).toHaveCount(0);
  await expect(page.locator('#full-game-analysis')).toHaveCount(0);
  await expect(page.locator('#stockfish-assist-settings')).toBeVisible();
  await expect(page.locator('#learning-chat')).toBeVisible();
 }
});

test('real Maia 49-half-move history is automatically evaluated while Stockfish display stays off',async({page})=>{
 test.setTimeout(180000);
 const studio=new Studio();
 const moves=['d4','Nf6','e3','g6','f4','Bg7','Nf3','O-O','Be2','d6','O-O','Nbd7','c3','b6','b4','c5','bxc5','bxc5','dxc5','Nxc5','a4','Bb7','Ba3','Nfe4','Bxc5','Nxc5','Nd4','e5','fxe5','Bxe5','Bf3','Bxf3','Rxf3','Qh4','g3','Qh3','Qf1','Qg4','Kg2','Qe4','Nd2','Qd5','Kg1','Ne6','Qc4','Nxd4','Qxd5','Nxf3+','Qxf3'];
 for(const san of moves)studio.session.play(san);
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'maia-prefix.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await expect(page.locator('#stockfish-assist-enabled')).not.toBeChecked();
 await expect.poll(async()=>(await savedReport(page)).count,{timeout:150000}).toBe(49);
 expect((await savedReport(page)).positions).toBe(50);
 await page.locator('#stockfish-assist-enabled').check();
 await expect(page.locator('#stockfish-assist-result')).toBeVisible();
 await expect(page.locator('#stockfish-assist-result')).toContainText('Stockfish:');
});
