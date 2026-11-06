import {test,expect} from '@playwright/test';

test('font scale persists, keeps all squares and avoids horizontal overflow on desktop and phone',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 for(const width of [1440,1066,390]){
  await page.setViewportSize({width,height:900});
  for(const scale of ['80','150','200']){
   await page.getByLabel('Schriftgröße',{exact:true}).selectOption(scale);
   await expect(page.locator('html')).toHaveCSS('font-size',`${16*Number(scale)/100}px`);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await expect(page.locator('#board button')).toHaveCount(64);
   const cells=await page.locator('#board button').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y})));
   expect(new Set(cells.map(c=>Math.round(c.x))).size).toBe(8);expect(new Set(cells.map(c=>Math.round(c.y))).size).toBe(8);
  }
 }
 await page.reload();await expect(page.getByLabel('Schriftgröße',{exact:true})).toHaveValue('200');await expect(page.locator('html')).toHaveCSS('font-size','32px');
});
test('game undo returns the turn to the human, preserves old variation and supports a new move',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await expect(page.getByRole('button',{name:'Schritt zurück',exact:true})).toBeDisabled();await page.locator('#game-level').selectOption('1');await page.locator('#open-game-setup').click();
 await page.locator('#board [data-square=e2]').click();await page.locator('#board [data-square=e4]').click();await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen',{timeout:12000});
 await expect(page.getByRole('button',{name:'Schritt zurück',exact:true})).toBeInViewport();await page.getByRole('button',{name:'Schritt zurück',exact:true}).click();await expect(page.locator('#position-status')).toContainText('n0 · Weiß');await expect(page.locator('#board [data-square=e2]')).toHaveAttribute('aria-label','e2: Weiß Bauer');
 await expect(page.getByRole('button',{name:'Schritt zurück',exact:true})).toBeDisabled();
 await page.locator('#board [data-square=d2]').click();await page.locator('#board [data-square=d4]').click();await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen',{timeout:12000});
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.getByRole('button',{name:'Schritt zurück',exact:true})).toBeHidden();await page.locator('#panel-variants > summary').click();await expect(page.locator('#variations')).toContainText('e4');await expect(page.locator('#variations')).toContainText('d4');
});
