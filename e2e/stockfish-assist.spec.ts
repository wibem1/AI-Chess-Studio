import {test,expect} from '@playwright/test';

test('Stockfish result appears under learning board immediately and reaches the AI after a question',async({page})=>{
 test.setTimeout(60000);
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#api-model').fill('gpt-4.1-mini');
 await page.locator('#api-key').fill('fixture-not-a-real-key');
 await page.locator('#api-cost-consent').check();
 await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 let calls=0;
 await page.route('https://api.openai.com/v1/chat/completions',route=>{
  calls++;
  const payload=route.request().postDataJSON();
  const current=JSON.parse(payload.messages.find((m:any)=>m.role==='user').content);
  expect(current.context[0]).toContain('Stockfish-Faktencheck ausschließlich für FEN');
  expect(current.context[0]).toMatch(/Tiefe \d+/);
  expect(current.context[0]).toContain('Hauptvariante');
  return route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Die lokale Suche zeigt eine Hauptvariante; die Bewertung ist nicht endgültig.'}}],usage:{prompt_tokens:90,completion_tokens:25}}});
 });
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await expect(page.locator('#stockfish-assist-result')).toBeHidden();
 await expect(page.locator('#coach-match #stockfish-assist-settings')).toHaveCount(1);
 await page.locator('#stockfish-assist-enabled').check();
 await expect(page.locator('#stockfish-assist-result')).toBeVisible({timeout:30000});
 await expect(page.locator('#stockfish-assist-result')).toContainText('Stockfish:');
 await expect(page.locator('#stockfish-assist-details')).toBeVisible();
 await expect(page.locator('#stockfish-assist-details')).not.toHaveAttribute('open','');
 await expect(page.locator('#stockfish-assist-result')).not.toContainText('Hauptvariante:');
 await page.locator('#stockfish-assist-details > summary').click();
 await expect(page.locator('#stockfish-assist-line')).toContainText('Hauptvariante:');
 await expect(page.locator('#stockfish-assist-status')).toBeHidden();
 expect(calls).toBe(0);
 await page.locator('#question').fill('Bewerte die aktuelle Ausgangsstellung mit begrenzter Stockfish-Prüfung.');
 await page.locator('#ask').click();
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert',{timeout:45000});
 await expect(page.locator('#stockfish-assist-result')).toBeVisible();
 await expect(page.locator('#stockfish-assist-result')).toContainText('Stockfish:');
 expect(calls).toBe(1);
});

test('Stockfish board score is refreshed for the visible learning position, never for the play view',async({page})=>{
 test.setTimeout(60000);
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 const score=page.locator('#stockfish-assist-result');
 await page.locator('#stockfish-assist-enabled').check();
 await expect(score).toBeVisible({timeout:30000});
 const initial=await score.textContent();
 await page.locator('#board [data-square=e2]').click();
 await page.locator('#board [data-square=e4]').click();
 await expect(page.locator('#position-status')).toContainText('n1');
 await expect(score).toBeVisible({timeout:30000});
 await expect(score).not.toHaveText(initial!);
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
 await expect(page.locator('#stockfish-assist-settings')).toBeHidden();
});

test('Stockfish display shares the KI gegen Engine row and does not create an extra board row',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 const engine=page.locator('#coach-match > strong');
 const stockfish=page.locator('#coach-match #stockfish-assist-settings');
 await expect(stockfish).toBeVisible();
 const a=await engine.boundingBox(),b=await stockfish.boundingBox();
 expect(a&&b).toBeTruthy();
 expect(Math.abs(a!.y-b!.y)).toBeLessThan(20);
 await expect(page.locator('#board-area > #stockfish-assist-settings')).toHaveCount(0);
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
 await expect(stockfish).toBeHidden();
});

test('Stockfish navigation has no calculating message or height jump',async({page})=>{
 test.setTimeout(60000);
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#stockfish-assist-enabled').check();
 const score=page.locator('#stockfish-assist-result');
 const status=page.locator('#stockfish-assist-status');
 const row=page.locator('#coach-match');
 await expect(score).toBeVisible({timeout:30000});
 const height=await row.evaluate(el=>el.getBoundingClientRect().height);
 await page.locator('#board [data-square=e2]').click();
 await page.locator('#board [data-square=e4]').click();
 await expect(page.locator('#position-status')).toContainText('n1');
 await expect(status).toBeHidden();
 await expect(page.locator('#stockfish-assist-settings')).not.toContainText('Stockfish berechnet');
 expect(Math.abs((await row.evaluate(el=>el.getBoundingClientRect().height))-height)).toBeLessThan(2);
 await expect(score).toBeVisible({timeout:30000});
 await page.locator('#learn-back').click();
 await expect(page.locator('#position-status')).toContainText('n0');
 await expect(status).toBeHidden();
 expect(Math.abs((await row.evaluate(el=>el.getBoundingClientRect().height))-height)).toBeLessThan(2);
 await page.locator('#learn-next').click();
 await expect(page.locator('#position-status')).toContainText('n1');
 await expect(status).toBeHidden();
 await expect(score).toBeVisible({timeout:30000});
 expect(Math.abs((await row.evaluate(el=>el.getBoundingClientRect().height))-height)).toBeLessThan(2);
});

test('Stockfish Variante disclosure stays visible while navigating between positions',async({page})=>{
 test.setTimeout(60000);
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#stockfish-assist-enabled').check();
 const details=page.locator('#stockfish-assist-details');
 const summary=page.locator('#stockfish-assist-details > summary');
 await expect(details).toBeVisible({timeout:30000});
 await expect(summary).toHaveText('Variante');
 await summary.click();
 await expect(details).toHaveAttribute('open','');
 await expect(page.locator('#stockfish-assist-line')).toContainText('Hauptvariante:');
 const positionInRow=async()=>page.locator('#coach-match').evaluate(el=>{
   const item=el.querySelector('#stockfish-assist-details > summary')!.getBoundingClientRect();
   return item.top-el.getBoundingClientRect().top;
 });
 const before=await positionInRow();
 await page.locator('#board [data-square=e2]').click();
 await page.locator('#board [data-square=e4]').click();
 await expect(page.locator('#position-status')).toContainText('n1');
 await expect(details).toBeVisible();
 await expect(summary).toHaveText('Variante');
 await expect(details).toHaveCSS('visibility','visible');
 await expect(details).toHaveAttribute('open','');
 await expect(page.locator('#stockfish-assist-result')).toBeVisible({timeout:30000});
 const after=await positionInRow();
 expect(Math.abs(after-before)).toBeLessThan(2);
 await page.locator('#learn-back').click();
 await expect(page.locator('#position-status')).toContainText('n0');
 await expect(details).toBeVisible();
 await expect(details).toHaveCSS('visibility','visible');
 await expect(details).toHaveAttribute('open','');
 await page.locator('#learn-next').click();
 await expect(page.locator('#position-status')).toContainText('n1');
 await expect(details).toBeVisible();
 await expect(details).toHaveCSS('visibility','visible');
 await expect(details).toHaveAttribute('open','');
 await expect(page.locator('#stockfish-assist-line')).toContainText('Hauptvariante:',{timeout:30000});
 await summary.click();
 await expect(details).not.toHaveAttribute('open','');
 await page.locator('#learn-back').click();
 await expect(details).not.toHaveAttribute('open','');
});

test('Variante remains on its own fixed row even when the Stockfish score changes length',async({page})=>{
 test.setTimeout(60000);
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#stockfish-assist-enabled').check();
 const score=page.locator('#stockfish-assist-result');
 const details=page.locator('#stockfish-assist-details');
 const summary=page.locator('#stockfish-assist-details > summary');
 await expect(score).toBeVisible({timeout:30000});
 await expect(details).toBeVisible();
 await summary.click();
 await expect(details).toHaveAttribute('open','');
 const position=()=>page.locator('#stockfish-assist-settings').evaluate(el=>{
  const root=el.getBoundingClientRect(),summary=el.querySelector('details > summary')!.getBoundingClientRect();
  return {top:summary.top-root.top,height:root.height,summaryHeight:summary.height};
 });
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  const before=await position();
  for(const sample of ['Stockfish: +0.03 (Weiß) · T12','Stockfish: Matt für Schwarz in 123456789 · T12','Stockfish: +123.45 (Weiß) · T12']){
   await score.evaluate((el,value)=>{el.textContent=value;},sample);
   const after=await position();
   expect(Math.abs(after.top-before.top)).toBeLessThan(2);
   expect(Math.abs(after.height-before.height)).toBeLessThan(2);
   expect(after.summaryHeight).toBe(before.summaryHeight);
   await expect(details).toHaveAttribute('open','');
  }
 }
 await page.locator('#learn-back').click();
 await expect(details).toHaveAttribute('open','');
});
