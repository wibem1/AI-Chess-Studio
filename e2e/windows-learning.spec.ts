import {test,expect} from '@playwright/test';
import {Chess} from 'chess.js';
import {Session} from '../src/session.js';
test('learning layout keeps board, input, latest response and older history in that order',async({page})=>{
 let session=new Session();
 for(let seed=1;seed<30;seed++){const candidate=new Session(),board=new Chess();for(let i=0;i<80&&!board.isGameOver();i++){const moves=board.moves(),san=moves[(i*13+seed*7)%moves.length]!;board.move(san);candidate.play(san);}if(candidate.snapshot().nodes.length>=65){session=candidate;break;}}
 expect(session.snapshot().nodes.length).toBeGreaterThan(64);
 for(let i=0;i<12;i++)for(const source of ['human','model'] as const)session.annotate({nodeId:session.snapshot().activeNodeId,kind:'dialogue',source,text:source==='human'?`Frage ${i}`:`Antwort ${i}. `+'Eine ausführliche Erklärung der Stellung. '.repeat(40),hypothesis:source==='model',openQuestions:[]});
 await page.setViewportSize({width:1600,height:900});await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#games-menu > summary').click();await page.locator('#game-file').setInputFiles({name:'long-synthetic.json',mimeType:'application/json',buffer:Buffer.from(session.export())});await expect(page.locator('#games-status')).toContainText('Partie geladen');
 for(const size of [{width:1600,height:900},{width:1440,height:900},{width:1280,height:900},{width:810,height:1080},{width:390,height:844},{width:1280,height:600}]){
  await page.setViewportSize(size);await page.evaluate(()=>scrollTo(0,0));if(size.width>=901){await page.locator('#question').blur();await page.locator('#question').focus();await page.waitForTimeout(50);}
  const r=await page.evaluate(()=>{const rect=(id:string)=>{const r=document.getElementById(id)!.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height};};return {board:rect('board'),plan:rect('coach-show-plan'),input:rect('question'),answer:rect('current-answer'),history:rect('chat-history')};});
  expect(r.plan.bottom).toBeLessThanOrEqual(r.board.y);expect(r.input.y).toBeGreaterThanOrEqual(r.board.bottom);expect(r.answer.y).toBeGreaterThanOrEqual(r.input.bottom);expect(r.history.y).toBeGreaterThanOrEqual(r.answer.bottom);
  expect(r.board.bottom).toBeLessThanOrEqual(size.height);expect(r.input.bottom).toBeLessThanOrEqual(size.height);expect(r.answer.bottom,JSON.stringify({size,r})).toBeLessThanOrEqual(size.height);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.locator('#current-answer')).toContainText('Antwort 11.');await expect(page.locator('#chat-history')).not.toContainText('Antwort 11.');await expect(page.locator('#chat-history .entry')).toHaveCount(23);
  const scroll=await page.evaluate(()=>scrollY);await page.locator('#current-answer-body').evaluate(e=>{e.scrollTop=e.scrollHeight;});expect(await page.evaluate(()=>scrollY)).toBe(scroll);if(size.width===390)await page.screenshot({path:'/tmp/chess-vertical-learning-phone.png',fullPage:false});
 }
 await page.setViewportSize({width:1600,height:900});await page.getByLabel('Schriftgröße',{exact:true}).selectOption('150');await page.locator('#question').focus();await page.waitForTimeout(50);const answer=await page.locator('#current-answer').boundingBox();expect(answer!.y+answer!.height).toBeLessThanOrEqual(900);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'/tmp/chess-vertical-learning-150.png',fullPage:false});
 await page.getByLabel('Schriftgröße',{exact:true}).selectOption('100');await page.screenshot({path:'/tmp/chess-vertical-learning.png',fullPage:false});
});

test('Windows scaling keeps readable squares in a 1032 by 552 logical viewport',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1032,height:552},deviceScaleFactor:1.667});const page=await context.newPage();
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#question').fill('Besprich diese Stellung.');await page.locator('#ask').click();await expect(page.locator('#dialogue-feedback')).toContainText('Beispielantwort');
 await expect.poll(async()=>{const r=await page.locator('#board').boundingBox();return r!.width;}).toBeGreaterThanOrEqual(280);
 await expect.poll(async()=>{const r=await page.locator('#current-answer').boundingBox();return r!.y+r!.height;}).toBeLessThanOrEqual(552);
 const rects=await page.locator('#board').evaluate(e=>({board:e.getBoundingClientRect().toJSON(),cells:[...e.children].map(c=>c.getBoundingClientRect().toJSON())}));expect(rects.cells).toHaveLength(64);for(const r of rects.cells){expect(r.width).toBeGreaterThanOrEqual(33);expect(Math.abs(r.width-r.height)).toBeLessThan(1);}
 expect(rects.board.y).toBeGreaterThanOrEqual(0);expect(rects.board.bottom).toBeLessThan(552);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'/tmp/chess-windows-readable-scaled.png',fullPage:false});await context.close();
});
