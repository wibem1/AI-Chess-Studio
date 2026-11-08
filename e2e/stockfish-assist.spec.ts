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
 await page.locator('#stockfish-assist-enabled').check();
 await expect(page.locator('#stockfish-assist-result')).toBeVisible({timeout:30000});
 await expect(page.locator('#stockfish-assist-result')).toContainText('Stockfish:');
 await expect(page.locator('#stockfish-assist-result')).toContainText('Hauptvariante:');
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
