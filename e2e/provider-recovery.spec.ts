import {test,expect} from '@playwright/test';

test('provider remains explicit when device key is unreadable, and OpenRouter can be selected',async({page})=>{
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.evaluate(async()=>{
  await new Promise<void>((resolve,reject)=>{
   const open=indexedDB.open('ai-chess-studio',1);
   open.onerror=()=>reject(open.error);
   open.onsuccess=()=>{
    const db=open.result,tx=db.transaction('vault','readwrite');
    tx.objectStore('vault').put({version:2,key:'invalid',iv:new Uint8Array(12),ciphertext:new ArrayBuffer(12)},'current');
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>reject(tx.error);
   };
  });
 });
 await page.reload();
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await expect(page.locator('#credential-status')).toContainText('Gespeicherter Schlüssel gefunden');
 await page.locator('#api-settings > summary').click();
 await expect(page.locator('#api-provider')).toBeVisible();
 await expect(page.locator('#api-provider')).toHaveValue('');
 await expect(page.locator('label[for=api-key]')).toHaveText('API-Schlüssel des ausgewählten Anbieters');
 await expect(page.locator('#api-provider-warning')).toContainText('bisherige Anbieter ist unbekannt');
 await page.locator('#api-provider').selectOption('openrouter');
 await expect(page.locator('label[for=api-key]')).toHaveText('OpenRouter-API-Schlüssel');
 await expect(page.locator('#api-model')).toHaveValue('openai/gpt-6.1-sol');
 await expect(page.locator('#api-provider-warning')).toBeHidden();
 await page.locator('#api-provider').selectOption('openai');
 await expect(page.locator('#api-model')).toHaveValue('gpt-6.1-sol');
 await expect(page.locator('label[for=api-key]')).toHaveText('OpenAI-API-Schlüssel');
 await page.locator('#api-provider').selectOption('openrouter');
 await expect(page.locator('#api-model')).toHaveValue('openai/gpt-6.1-sol');
 const saved=await page.evaluate(async()=>new Promise<unknown>((resolve,reject)=>{
  const open=indexedDB.open('ai-chess-studio',1);open.onsuccess=()=>{const db=open.result,r=db.transaction('vault','readonly').objectStore('vault').get('current');r.onsuccess=()=>{resolve(r.result);db.close();};r.onerror=()=>reject(r.error);};open.onerror=()=>reject(open.error);
 }));
 expect(saved).toMatchObject({version:2,key:'invalid'});
});
