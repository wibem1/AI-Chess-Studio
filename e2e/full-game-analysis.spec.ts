import {test,expect} from '@playwright/test';
import {Studio} from '../src/dialogue.js';
import {LearningGame} from '../src/game.js';

test('real Stockfish whole-game report is stored, restored and can be given to a free KI question after checkmate',async({page})=>{
 test.setTimeout(120000);
 const studio=new Studio(),game=new LearningGame(()=>studio.session);
 game.start('w',1);game.play('f3');
 await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});
 game.play('g4');
 await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});
 game.pause();
 await page.goto('/?platform=web#lernen');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'whole-game.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await expect(page.locator('#full-game-start')).toBeVisible();
 await page.locator('#full-game-start').click();
 await expect(page.locator('#full-game-status')).toContainText('Vollständige Prüfung gespeichert',{timeout:60000});
 await expect(page.locator('#full-game-results')).toContainText('Weiß:');
 await expect(page.locator('#full-game-results')).toContainText('Schwarz:');
 await expect(page.locator('#full-game-ask')).toBeVisible();
 await page.reload();await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#full-game-result-details > summary').click();
 await expect(page.locator('#full-game-results')).toContainText('bewertete Züge');
 await expect(page.locator('#full-game-ask')).toBeVisible();
 await page.locator('#open-settings').click();await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');await page.locator('#settings-model-section > summary').click();
 await page.locator('#api-model').fill('gpt-4.1-mini');await page.locator('#api-key').fill('fixture-not-real-for-review');
 await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 let calls=0;
 await page.route('https://api.openai.com/v1/chat/completions',route=>{
  calls++;
  const data=route.request().postDataJSON();
  const user=JSON.parse(data.messages.filter((m:{role:string})=>m.role==='user').at(-1).content);
  const context=user.context.join('');
  expect(context).toContain('Lokal geprüfte Stockfish-Partieanalyse');
  expect(context).toContain('Vollständiger chronologischer Verlauf aller 4 Halbzüge');
  for(const move of ['1.f3','1…e5','2.g4','2…Qh4#'])expect(context).toContain(move);
  expect(context).toContain('Wichtigste Fehler nach Bewertungsverlust:');
  return route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Weiß machte kritische Fehler; Schwarz nutzte die offenen Diagonalen.'}}],usage:{prompt_tokens:100,completion_tokens:25}}});
 });
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#stockfish-assist-enabled').check();
 await page.locator('#full-game-ask').click();
 await expect(page.locator('#question')).toHaveValue(/Vergleiche die schachliche Qualität/);
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert',{timeout:45000});
 expect(calls).toBe(1);
 // A natural German question about Black's decisive mistake must not bypass
 // the complete evaluations just because it lacks "gesamte Partie".
 await page.locator('#question').fill('Was war der entscheidende Fehler von Schwarz?');
 await page.locator('#ask').click();
 await expect.poll(()=>calls).toBe(2);
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert',{timeout:45000});
 // The saved game report must also reach the model for an ordinary, non-keyword
 // follow-up, rather than depending on the wording of the user's message.
 await page.locator('#question').fill('Kannst du das genauer erklären?');
 await page.locator('#ask').click();
 await expect.poll(()=>calls).toBe(3);
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert',{timeout:45000});
});

test('Stockfish Partie prüfen button is directly under the board and requires no disclosure on small and wide screens',async({page})=>{
 for(const width of [390,820,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('/?platform=web');
  await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
  await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
  const button=page.locator('#full-game-start'),panel=page.locator('#full-game-analysis'),board=page.locator('#board'),chat=page.locator('#learning-chat');
  await expect(button).toBeVisible();
  expect(await panel.evaluate(el=>el.parentElement?.id)).toBe('board-area');
  expect(await panel.evaluate(el=>el.previousElementSibling?.classList.contains('board-heading'))).toBe(true);
  const b=await board.boundingBox(),p=await panel.boundingBox(),q=await chat.boundingBox();
  expect(p!.y).toBeGreaterThan(b!.y+b!.height);
  expect(p!.y+p!.height).toBeLessThan(q!.y);
  await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
  await expect(button).toBeHidden();
 }
});

test('real Maia-game history over critical Black move can be scanned while live Stockfish display is enabled',async({page})=>{
 test.setTimeout(240000);
 const studio=new Studio();
 // User's actual SAN game prefix, not synthetic scores. All evaluations here
 // are performed by the pinned browser Stockfish, not by the test fixture.
 const moves=['d4','Nf6','e3','g6','f4','Bg7','Nf3','O-O','Be2','d6','O-O','Nbd7','c3','b6','b4','c5','bxc5','bxc5','dxc5','Nxc5','a4','Bb7','Ba3','Nfe4','Bxc5','Nxc5','Nd4','e5','fxe5','Bxe5','Bf3','Bxf3','Rxf3','Qh4','g3','Qh3','Qf1','Qg4','Kg2','Qe4','Nd2','Qd5','Kg1','Ne6','Qc4','Nxd4','Qxd5','Nxf3+','Qxf3'];
 for(const san of moves)studio.session.play(san);
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'maia-prefix.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await page.locator('#stockfish-assist-enabled').check();
 await page.locator('#full-game-start').click();
 await expect(page.locator('#full-game-status')).toContainText('Vollständige Prüfung gespeichert: 49 Züge',{timeout:210000});
 await expect(page.locator('#full-game-results')).toContainText('Schwarz:');
 await expect(page.locator('#full-game-ask')).toBeVisible();
});
