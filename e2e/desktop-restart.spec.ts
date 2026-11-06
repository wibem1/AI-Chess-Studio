import {test,expect} from '@playwright/test';

test('desktop boards use window width even with a short Windows-style viewport',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 for(const size of [{width:1280,height:600},{width:1440,height:900},{width:1920,height:1080}]){
  await page.setViewportSize(size);const board=await page.locator('#board').boundingBox();expect(board!.width).toBeGreaterThan(size.height-165);expect(board!.y+board!.height).toBeLessThanOrEqual(size.height+1);
  const tabs=await page.locator('.app-navigation').boundingBox(),header=await page.locator('.app-header').boundingBox();expect(tabs!.y).toBeGreaterThanOrEqual(header!.height-1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});const phone=await page.locator('#board').boundingBox();expect(phone!.width).toBeGreaterThan(330);expect(phone!.width).toBeLessThan(390);
});

test('New Game resets the position, retains a recoverable copy and starts the chosen opponent',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.getByRole('button',{name:'e2: Weiß Bauer',exact:true}).click();await page.getByRole('button',{name:'e4: leer',exact:true}).click();
 await page.getByText('Kommentar zu dieser Stellung',{exact:true}).click();await page.locator('#memory').fill('Kommentar vor dem Neustart');await page.locator('#memory-form button').click();
 await page.locator('#open-game-setup').click();await expect(page.getByRole('tab',{name:'Spielmodus',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('#position-status')).toContainText('n0 · Weiß');await expect(page.locator('#game-feedback')).toContainText('Neue Partie gestartet');
 await expect(page.locator('#board [data-square=e2]')).toHaveAttribute('aria-label','e2: Weiß Bauer');await expect(page.locator('#board [data-square=e4]')).toHaveAttribute('aria-label','e4: leer');
 await page.locator('#games-menu > summary').click();await expect(page.locator('#saved-games option')).toHaveCount(1);await page.locator('#load-game').click();await expect(page.locator('#position-status')).toContainText('n1');await page.getByText('Kommentar zu dieser Stellung',{exact:true}).click();await expect(page.locator('#memories')).toContainText('Kommentar vor dem Neustart');
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await page.locator('#game-color').selectOption('b');await page.locator('#open-game-setup').click();await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen',{timeout:12000});await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
});
