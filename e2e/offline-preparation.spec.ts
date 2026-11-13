import {test,expect} from '@playwright/test';

test.use({serviceWorkers:'allow'});

test('fresh install explicitly prepares Maia and plays a real move after restart without network',async({page,context})=>{
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
 await page.locator('#pwa-tools > summary').click();
 await expect(page.locator('#pwa-status')).toContainText('Offline-Start vorbereitet',{timeout:20000});
 await expect(page.locator('#pwa-offline-status')).toContainText('noch nicht vollständig lokal gespeichert');
 await page.locator('#pwa-offline-prepare').click();
 await expect(page.locator('#pwa-offline-status')).toContainText('Maia ist lokal gespeichert',{timeout:120000});
 const saved=await page.evaluate(async()=>{
  const cache=await caches.open('chess-studio-maia2-blitz-ort1.31.1');
  return (await cache.keys()).map(item=>item.url);
 });
 expect(saved.some(url=>url.endsWith('/maia2-blitz.fp16.onnx'))).toBe(true);
 expect(saved.some(url=>url.endsWith('/ort-wasm-simd-threaded.wasm'))).toBe(true);
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);
 await page.reload();
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
 await page.locator('#game-opponent').selectOption('maia');
 await page.locator('#game-color').selectOption('b');
 await page.locator('#game-form button').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:45000});
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n1');
 await context.setOffline(false);
});
