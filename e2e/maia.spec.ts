import {test,expect} from '@playwright/test';

test('real Maia WASM plays both colors, preserves learning branches and can undo',async({page})=>{
 test.setTimeout(120000);
 let modelLoads=0;page.on('request',r=>{if(r.url().endsWith('maia2-blitz.fp16.onnx'))modelLoads++;});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 expect(modelLoads).toBe(0);await page.locator('#game-opponent').selectOption('maia');await expect(page.locator('#playing-title')).toContainText('Maia');
 await page.locator('#game-color').selectOption('b');await page.locator('#game-level').selectOption('3');await page.locator('#open-game-setup').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n1');
 await expect(page.locator('#game-status')).toContainText('Maia-Profil 1500');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#board [data-square=e7]').click();await page.locator('#board [data-square=e5]').click();
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n1');
 await page.locator('#game-color').selectOption('w');await page.locator('#open-game-setup').click();await page.locator('#board [data-square=e2]').click();await page.locator('#board [data-square=e4]').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});await page.locator('#game-undo').click();await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n0');
 expect(errors).toEqual([]);
});

test('pausing a Maia model download cancels the old turn and explicit resume creates a fresh worker',async({page})=>{
 let release!:()=>void,started!:()=>void,count=0;const waiting=new Promise<void>(r=>started=r),gate=new Promise<void>(r=>release=r);
 await page.route('**/maia2-blitz.fp16.onnx',async route=>{if(++count===1){started();await gate;}try{await route.continue();}catch{}});
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.locator('#game-opponent').selectOption('maia');await page.locator('#game-color').selectOption('b');await page.locator('#open-game-setup').click();await waiting;
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n0');release();
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n1');expect(count).toBeGreaterThanOrEqual(2);
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


test('diagnostic download contains the real Maia move even without an AI provider request',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#game-opponent').selectOption('maia');
 await page.locator('#game-color').selectOption('b');
 await page.locator('#game-level').selectOption('3');
 await page.locator('#open-game-setup').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n1');
 await page.locator('#open-settings').click();
 await page.locator('#settings-diagnosis > summary').click();
 if(await page.locator('#ai-diagnosis').getAttribute('open')===null)await page.locator('#ai-diagnosis > summary').click();
 const downloading=page.waitForEvent('download');
 await page.locator('#ai-diagnose-export').click();
 const download=await downloading;
 const fs=await import('node:fs/promises');
 const report=JSON.parse(await fs.readFile((await download.path())!,'utf8'));
 const history=report.extra.current.gameHistory;
 expect(report.requests).toEqual([]);
 expect(history.nodes).toHaveLength(2);
 expect(history.activeLine).toHaveLength(1);
 expect(history.activeNodeId).toBe('n1');
 expect(history.activeLine[0].ply).toBe(1);
 expect(history.activeLine[0].san).toBe(history.nodes[1].san);
 expect(history.activeLine[0].fenAfter).toBe(history.nodes[1].fen);
 expect(report.extra.current.maiaMoves).toHaveLength(1);
 const recorded=report.extra.current.maiaMoves[0];
 expect(recorded.gameId).toBeTruthy();
 expect(recorded.opponent).toBe('maia');
 expect(recorded.modelUci).toBe(recorded.uci);
 expect(recorded.modelFen).toBe(history.rootFen);
 expect(recorded.san).toBe(history.activeLine[0].san);
 expect(recorded.fenAfter).toBe(history.activeLine[0].fenAfter);
 const {Chess}=await import('chess.js');
 const board=new Chess(history.rootFen);
 board.move(history.activeLine[0].san);
 expect(board.fen()).toBe(history.activeLine[0].fenAfter);
});

test('real Maia-2 opening move after 1.d4 excludes the reported 1-percent ...Na6 outlier',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#game-opponent').selectOption('maia');
 await page.locator('#game-color').selectOption('w');
 await page.locator('#game-level').selectOption('3');
 await page.locator('#open-game-setup').click();
 await page.locator('#board [data-square=d2]').click();
 await page.locator('#board [data-square=d4]').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:30000});
 await page.locator('#open-settings').click();
 await page.locator('#settings-diagnosis > summary').click();
 if(await page.locator('#ai-diagnosis').getAttribute('open')===null)await page.locator('#ai-diagnosis > summary').click();
 const downloading=page.waitForEvent('download');
 await page.locator('#ai-diagnose-export').click();
 const download=await downloading;
 const fs=await import('node:fs/promises');
 const report=JSON.parse(await fs.readFile((await download.path())!,'utf8'));
 const history=report.extra.current.gameHistory.activeLine;
 expect(history.slice(0,2).map((m:{san:string})=>m.san)[0]).toBe('d4');
 expect(history.slice(0,2)).toHaveLength(2);
 const maia=report.extra.current.maiaMoves.at(-1);
 expect(maia.modelFen).toBe(history[0].fenAfter);
 expect(maia.modelUci).toBe(maia.uci);
 expect(maia.uci).not.toBe('b8a6');
});

test('a second Maia game starts after reviewing the first without inheriting paused analysis or a stale worker',async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#game-opponent').selectOption('maia');
 await page.locator('#game-color').selectOption('w');
 await page.locator('#game-level').selectOption('1');
 await page.locator('#open-game-setup').click();
 await page.locator('#board [data-square=d2]').click();
 await page.locator('#board [data-square=d4]').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:45000});
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#learn-first').click();
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n0');
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
 await page.locator('#open-game-setup').click();
 await expect(page.locator('#game-feedback')).toContainText('Neue Partie gestartet');
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n0');
 await page.locator('#board [data-square=d2]').click();
 await page.locator('#board [data-square=d4]').click();
 await expect(page.locator('#game-feedback')).toContainText('Maia hat gezogen',{timeout:45000});
 await expect(page.locator('#game-status')).not.toContainText('Analysemodus');
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n2');
 expect(errors).toEqual([]);
});
