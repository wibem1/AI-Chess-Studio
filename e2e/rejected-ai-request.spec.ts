import {test,expect} from '@playwright/test';

test('failed provider request cannot present old demo or model answer as current response',async({page})=>{
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');
 await page.locator('#api-model').fill('gpt-4.1-mini');
 await page.locator('#api-key').fill('fixture-no-real-key');
 await page.locator('#api-cost-consent').check();
 await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 let count=0;
 await page.route('https://api.openai.com/v1/chat/completions',route=>{
  count++;
  if(count===2)return route.fulfill({status:400,json:{error:{message:'SECRET_PROVIDER_BODY_NOT_FOR_DISPLAY'}}});
  return route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Ältere erfolgreiche KI-Antwort.'}}],usage:{prompt_tokens:20,completion_tokens:10}}});
 });
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#question').fill('Erkläre diese Stellung');
 await page.locator('#ask').click();
 await expect(page.locator('#current-answer')).toContainText('Ältere erfolgreiche KI-Antwort.');
 await page.locator('#question').fill('Bitte analysiere die ganze Partie');
 await page.locator('#ask').click();
 await expect(page.locator('#dialogue-feedback')).toContainText('HTTP 400');
 await expect(page.locator('#dialogue-feedback')).not.toContainText('SECRET_PROVIDER_BODY_NOT_FOR_DISPLAY');
 await expect(page.locator('#current-answer h3')).toContainText('Letzte gespeicherte Antwort');
 await expect(page.locator('#current-answer h3')).toContainText('fehlgeschlagen');
 await expect(page.locator('#current-answer')).toContainText('Ältere erfolgreiche KI-Antwort.');
 expect(count).toBe(2);
});
