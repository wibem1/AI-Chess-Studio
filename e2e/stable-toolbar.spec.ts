import {test,expect} from '@playwright/test';
import {Session} from '../src/session.js';
for(const width of [820,1440])test(`board controls stay below the board and preserve scrolling at ${width}px`,async({page})=>{
 const s=new Session();for(const san of ['e4','e5','Nf3','Nc6'])s.play(san);
 await page.setViewportSize({width,height:1180});await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#games-menu > summary').click();await page.locator('#game-file').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(s.export())});await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await page.locator('#font-scale').selectOption('125');
 const board=await page.locator('#board').boundingBox(),bar=await page.locator('.board-heading').boundingBox();expect(bar!.y).toBeGreaterThanOrEqual(board!.y+board!.height);
 await page.locator('.board-heading').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-220));
 for(const id of ['learn-back','learn-next','board-flip','learn-first']){
  const before=await page.evaluate(()=>scrollY);await page.locator('#'+id).click();await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(before,0);
 }
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n0');await page.screenshot({path:`/tmp/chess-toolbar-${width}.png`,fullPage:true});
});

test('simplified learning has no legacy forms and diagnosis download is directly accessible',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 for(const id of ['memory-form','reflection-form','dialogue-begin','simulation-mode','dialogue-mode','session-json','session-file','analyse-game','analyse-position'])await expect(page.locator('#'+id)).toHaveCount(0);
 await expect(page.locator('#ask')).toBeDisabled();await page.locator('#open-settings').click();await page.locator('#settings-diagnosis > summary').click();await expect(page.locator('#ai-diagnose-export')).toBeVisible();
});
