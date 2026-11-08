import {test,expect} from '@playwright/test';

test('settings have separate functional sections and keep controls associated',async({page})=>{
 await page.setViewportSize({width:600,height:937});
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await expect(page.locator('#panel-settings')).toBeVisible();
 const items=page.locator('#panel-settings > details.panel:not([hidden]) > summary');
 await expect(items).toHaveText([
  'KI-Modell und Denkstufe',
  'Allgemeine KI-Anweisungen',
  'Stockfish-Stellungsprüfung für KI-Antworten',
  'KI-Kosten und Preisannahmen',
  'Sitzungsdaten und Sicherung',
  'Updates und Installation',
  'Diagnose und Fehlerberichte'
 ]);
 await expect(page.locator('#api-settings')).toBeVisible();
 await expect(page.locator('#settings-model-section')).toBeVisible();
 await expect(page.locator('#api-model')).toBeHidden();
 await page.locator('#settings-model-section > summary').click();
 await expect(page.locator('#api-model')).toBeVisible();
 expect(await page.locator('#api-model').evaluate((el:HTMLInputElement)=>el.form?.id)).toBe('api-form');
 await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openrouter');
 await expect(page.locator('#api-model')).toHaveValue('openai/gpt-6.1-sol');
 await page.locator('#api-provider').selectOption('openai');
 await expect(page.locator('#api-model')).toHaveValue('gpt-6.1-sol');
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#pwa-tools > summary').click();
 await expect(page.locator('#pwa-check')).toBeVisible();
 await expect(page.locator('#diagnostic-output')).toBeHidden();
 await page.locator('#settings-diagnosis > summary').click();
 await expect(page.locator('#ai-diagnose-export')).toBeVisible();
 await expect(page.locator('#diagnose')).toBeVisible();
 await expect(page.locator('#diagnose-access')).toBeVisible();
 await expect(page.locator('#pwa-tools summary')).toContainText('Updates und Installation');
 await expect(page.locator('#settings-diagnosis summary').first()).toContainText('Diagnose und Fehlerberichte');
});

test('Sol review output limit is selectable, persisted across reload, and can return to automatic',async({page})=>{
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');
 await page.locator('#api-key').fill('fixture-sol-review-key');
 await page.locator('#api-cost-consent').check();
 await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 await page.locator('#chat-model-controls > summary').click();
 await expect(page.locator('#review-output-controls')).toBeVisible();
 await page.locator('#review-output-tokens').selectOption('8192');
 await page.locator('#model-apply').click();
 await expect(page.locator('#model-choice-status')).toContainText('gespeichert');
 await expect(page.locator('#selected-model')).toContainText('8.192 Tokens');
 await page.reload();
 await page.locator('#open-settings').click();
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#chat-model-controls > summary').click();
 await expect(page.locator('#review-output-tokens')).toHaveValue('8192');
 await page.locator('#review-output-tokens').selectOption('');
 await page.locator('#model-apply').click();
 await expect(page.locator('#model-choice-status')).toContainText('gespeichert');
 await page.reload();
 await page.locator('#open-settings').click();
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#chat-model-controls > summary').click();
 await expect(page.locator('#review-output-tokens')).toHaveValue('');
});

test('general AI instructions persist independently and appear in future model requests',async({page})=>{
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await page.locator('#settings-ai-instructions > summary').click();
 const editor=page.locator('#general-ai-instructions');
 await editor.fill('Erkläre die Bauernstruktur in kurzen, verständlichen Sätzen.');
 await page.locator('#save-general-ai-instructions').click();
 await expect(page.locator('#general-ai-instructions-status')).toContainText('gespeichert');
 await page.reload();
 await page.locator('#open-settings').click();
 await page.locator('#settings-ai-instructions > summary').click();
 await expect(editor).toHaveValue('Erkläre die Bauernstruktur in kurzen, verständlichen Sätzen.');
 await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#api-model').fill('gpt-4.1-mini');
 await page.locator('#api-key').fill('fixture-no-real-key');
 await page.locator('#api-cost-consent').check();
 await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 let calls=0;
 await page.route('https://api.openai.com/v1/chat/completions',async route=>{
  calls++;
  const req=route.request().postDataJSON();
  expect(req.messages[0].role).toBe('system');
  expect(req.messages[0].content).toContain('Erkläre die Bauernstruktur in kurzen, verständlichen Sätzen.');
  await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Die Bauernstruktur bestimmt wichtige Felder.'}}],usage:{prompt_tokens:30,completion_tokens:20}}});
 });
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#question').fill('Was sollte ich beachten?');
 await page.locator('#ask').click();
 await expect(page.locator('#current-answer')).toContainText('Die Bauernstruktur bestimmt wichtige Felder.');
 expect(calls).toBe(1);
 await page.locator('#open-settings').click();
 if(!(await page.locator('#settings-ai-instructions').evaluate((el:HTMLDetailsElement)=>el.open)))await page.locator('#settings-ai-instructions > summary').click();
 await page.locator('#clear-general-ai-instructions').click();
 await expect(editor).toHaveValue('');
 await expect(page.locator('#general-ai-instructions-status')).toContainText('gelöscht');
});

test('opt-in Stockfish check is off initially and persists without triggering an AI request',async({page})=>{
 let modelCalls=0;
 await page.route('https://api.openai.com/**',async route=>{modelCalls++;await route.abort();});
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await page.locator('#stockfish-assist-settings > summary').click();
 const toggle=page.locator('#stockfish-assist-enabled');
 await expect(toggle).not.toBeChecked();
 await toggle.check();
 await expect(page.locator('#stockfish-assist-status')).toContainText('Aktiv');
 await page.reload();
 await page.locator('#open-settings').click();
 await page.locator('#stockfish-assist-settings > summary').click();
 await expect(toggle).toBeChecked();
 await toggle.uncheck();
 await expect(page.locator('#stockfish-assist-status')).toContainText('Aus');
 await page.reload();
 await page.locator('#open-settings').click();
 await page.locator('#stockfish-assist-settings > summary').click();
 await expect(toggle).not.toBeChecked();
 expect(modelCalls).toBe(0);
});
