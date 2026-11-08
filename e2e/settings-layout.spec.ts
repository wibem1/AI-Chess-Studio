import {test,expect} from '@playwright/test';

test('settings have separate functional sections and keep controls associated',async({page})=>{
 await page.setViewportSize({width:600,height:937});
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await expect(page.locator('#panel-settings')).toBeVisible();
 const items=page.locator('#panel-settings > details.panel > summary');
 await expect(items).toHaveText([
  'KI-Modell und Denkstufe',
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
