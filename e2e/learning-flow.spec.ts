import {test,expect} from '@playwright/test';

test('learning keeps chat directly below the visible board on desktop and phone with settings further down',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  const {board,chat,settings}=await page.evaluate(()=>{const rect=(id:string)=>{const r=document.getElementById(id)!.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,height:r.height};};return {board:rect('board'),chat:rect('learning-chat'),settings:rect('learning-settings')};});
  expect(chat!.y).toBeGreaterThanOrEqual(board!.y+board!.height);expect(chat!.y-(board!.y+board!.height)).toBeLessThan(30);expect(settings!.y).toBeGreaterThan(chat!.y+chat!.height);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#learning-settings')).not.toHaveAttribute('open','');
 }
});

test('a completed game can be replayed, discussed and branched without resetting the real game',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 // Play an actual legal finished line, then attach its game cursor through the normal JSON import.
 const {Session}=await import('../src/session.js');const {LearningGame}=await import('../src/game.js');const session=new Session(),game=new LearningGame(()=>session);game.start('w',1,'browser');game.play('f3');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});game.play('g4');await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});
 session.reflect(session.snapshot().activeNodeId,{idea:'',reasoning:'',uncertainty:'',goal:'',hintMode:'question'});
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#games-menu > summary').click();await page.locator('#game-file').setInputFiles({name:'finished.json',mimeType:'application/json',buffer:Buffer.from(session.export())});
 await expect(page.locator('#position-status')).toContainText('Schachmatt');await page.locator('#analyse-game').click();await expect(page.locator('#dialogue-feedback')).toContainText('Beispielantwort');await expect(page.locator('#dialogue')).toContainText('keine KI');
 await page.getByRole('button',{name:'1. f3 ansehen',exact:true}).click();await expect(page.locator('#position-status')).toContainText('n1');
 await page.locator('#question').fill('Warum war dieser Zug problematisch?');await page.locator('#ask').click();await expect(page.locator('#dialogue-feedback')).toContainText('Beispielantwort');await expect(page.locator('#position-status')).toContainText('n1');
 await page.locator('#learn-next').click();await expect(page.locator('#position-status')).toContainText('n2');await page.locator('#board [data-square=e2]').click();await page.locator('#board [data-square=e4]').click();await expect(page.locator('#position-status')).not.toContainText('n2');
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await expect(page.locator('#position-status')).toContainText('Schachmatt');
});
