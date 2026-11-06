import {test,expect} from '@playwright/test';

test('real Maia WASM plays both colors, preserves learning branches and can undo',async({page})=>{
 test.setTimeout(120000);
 let modelLoads=0;page.on('request',r=>{if(r.url().endsWith('maia2-blitz.fp16.onnx'))modelLoads++;});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 expect(modelLoads).toBe(0);await page.locator('#game-opponent').selectOption('maia');await expect(page.locator('#playing-title')).toContainText('Maia');
 await page.locator('#game-color').selectOption('b');await page.locator('#game-level').selectOption('3');await page.locator('#open-game-setup').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
 await expect(page.locator('#game-status')).toContainText('Maia-Profil 1500');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#board [data-square=e7]').click();await page.locator('#board [data-square=e5]').click();
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
 await page.locator('#game-color').selectOption('w');await page.locator('#open-game-setup').click();await page.locator('#board [data-square=e2]').click();await page.locator('#board [data-square=e4]').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});await page.locator('#game-undo').click();await expect(page.locator('#position-status')).toContainText('n0 · Weiß');
 expect(errors).toEqual([]);
});

test('pausing a Maia model download cancels the old turn and explicit resume creates a fresh worker',async({page})=>{
 let release!:()=>void,started!:()=>void,count=0;const waiting=new Promise<void>(r=>started=r),gate=new Promise<void>(r=>release=r);
 await page.route('**/maia2-blitz.fp16.onnx',async route=>{if(++count===1){started();await gate;}try{await route.continue();}catch{}});
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.locator('#game-opponent').selectOption('maia');await page.locator('#game-color').selectOption('b');await page.locator('#open-game-setup').click();await waiting;
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#position-status')).toContainText('n0 · Weiß');release();
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');expect(count).toBeGreaterThanOrEqual(2);
});

test('real Maia also plays from phone and tablet touch layouts without a backend or provider',async({browser})=>{
 for(const viewport of [{width:390,height:844},{width:820,height:1180}]){
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true});try{
   const page=await context.newPage();let provider=0;await page.route('https://api.openai.com/**',r=>{provider++;return r.abort();});
   await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.locator('#game-opponent').selectOption('maia');await page.locator('#game-color').selectOption('b');await page.locator('#open-game-setup').tap();
   await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});expect(provider).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }finally{await context.close();}
 }
});
