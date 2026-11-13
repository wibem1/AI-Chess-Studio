import {test,expect} from '@playwright/test';
import {Session} from '../src/session.js';

test('clean learning UI keeps essential play, chat and branch choices without legacy clutter',async({page})=>{
 const session=new Session();
 for(const san of ['e4','e5','Nf3','Nc6','Bb5'])session.play(san);
 const snapshot=session.snapshot();const root=snapshot.nodes[0]!.id;
 session.select(root);session.play('d4');session.play('d5');
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'branched.json',mimeType:'application/json',buffer:Buffer.from(session.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await expect(page.locator('.notation')).toBeHidden();
 await expect(page.locator('#tactical-form')).toBeHidden();
 await expect(page.locator('#ask')).toHaveText('Senden');
 await page.locator('#study-tools > summary').click();
 await page.locator('#panel-variants > summary').click();
 await expect(page.locator('#variations button')).toHaveCount(2);
 await expect(page.locator('#compare-a option')).toHaveCount(2);
 await expect(page.locator('#compare-b option')).toHaveCount(2);
 await page.locator('#compare-form button').click();
 await expect(page.locator('#comparison-view .comparison-card')).toHaveCount(2);
 await page.locator('#variations button').first().click();
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n5');
 await page.locator('#variations button').last().click();
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n7');
 await expect(page.locator('#game-file')).toHaveCount(1);
});

test('remembers last view on a fresh PWA launch, but explicit deep links take precedence',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await expect(page.getByRole('tab',{name:'Spielmodus',exact:true})).toHaveAttribute('aria-selected','true');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await expect(page.locator('#workspace')).toHaveAttribute('data-active-view','learn');
 // Installed PWAs commonly restart without the hash fragment.
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await expect(page.locator('#workspace')).toHaveAttribute('data-active-view','learn');
 await expect(page.getByRole('tab',{name:'Lernmodus',exact:true})).toHaveAttribute('aria-selected','true');
 // Explicit URLs remain navigable and become the new remembered preference.
 await page.goto('/?platform=web#partie');
 await expect(page.locator('#workspace')).toHaveAttribute('data-active-view','play');
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).toHaveAttribute('data-active-view','play');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.reload();
 await expect(page.locator('#workspace')).toHaveAttribute('data-active-view','learn');
});

test('position header and Stockfish variation use matching full-move numbers and German notation',async({page})=>{
 const root='8/6R1/4k2p/5n2/8/8/5K2/8 b - - 0 47';
 const s=new Session(root);s.play('Nxg7');
 const final=s.snapshot().nodes[1]!.fen;
 s.storePositionScore('n0',root,-500,12,['Nxg7']);
 s.storePositionScore('n1',final,-515,12,['Kg3']);
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'black-47.json',mimeType:'application/json',buffer:Buffer.from(s.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await expect(page.locator('#position-status')).toContainText('nach 47… Sxg7');
 await expect(page.locator('#position-status')).not.toContainText('n1');
 await expect(page.locator('#learning-line button').last()).toHaveText('47… Sxg7');
 await page.locator('#stockfish-assist-enabled').check();
 await expect(page.locator('#stockfish-assist-result')).toContainText('-5.15');
 await page.locator('#stockfish-assist-details > summary').click();
 await expect(page.locator('#stockfish-assist-line')).toContainText('Hauptvariante: 48. Kg3');
});
