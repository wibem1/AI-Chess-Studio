import {test,expect} from '@playwright/test';
test('learning and play have equal readable board sizes at desktop, scaled Windows and mobile sizes',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 for(const size of [{width:1920,height:1080},{width:1600,height:900},{width:1280,height:900},{width:1032,height:552},{width:980,height:900},{width:901,height:900},{width:810,height:1080},{width:390,height:844}]){
  await page.setViewportSize(size);
  await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
  const play=await page.locator('#board').boundingBox();
  await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
  const learn=await page.locator('#board').boundingBox();
  const launcher=await page.locator('#open-coach-match').boundingBox();expect(launcher!.y+launcher!.height).toBeLessThanOrEqual(learn!.y);
  await page.locator('#open-coach-match').click();await expect(page.locator('#coach-match')).toHaveAttribute('open','');await expect(page.locator('#coach-match')).toContainText('aktuell auf dem Brett angezeigten Stellung');await page.locator('#open-coach-match').click();
  expect(Math.abs(learn!.width-play!.width),JSON.stringify({size,play,learn})).toBeLessThanOrEqual(1);
  expect(Math.abs(learn!.width-learn!.height)).toBeLessThan(1);
  const input=await page.locator('#question').boundingBox();expect(input!.y).toBeGreaterThanOrEqual(learn!.y+learn!.height);
  await expect(page.locator('#board button')).toHaveCount(64);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(size.width===1032)await page.screenshot({path:'/tmp/chess-equal-windows-board.png'});
 }
});
