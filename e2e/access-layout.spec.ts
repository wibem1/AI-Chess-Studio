import {test,expect} from '@playwright/test';

test('large Windows text keeps setup fields and buttons inside the right panel',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 for(const size of [{width:1066,height:600},{width:1280,height:720},{width:1440,height:900}])for(const font of [16,24]){
  await page.setViewportSize(size);await page.evaluate(font=>{document.documentElement.style.fontSize=font+'px';},font);
  const overflow=await page.locator('#game-form').evaluate(form=>{const outer=form.getBoundingClientRect();return [...form.querySelectorAll<HTMLElement>('select,button,input,label')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.right>outer.right+1||r.left<outer.left-1;}).map(e=>e.id||e.tagName);});
  expect(overflow,`${size.width}px, font ${font}`).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
