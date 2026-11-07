import {test,expect} from '@playwright/test';

test('play and learning switch on one board, preserve both branches and show coach moves',async({page})=>{
 await page.route('https://api.openai.com/**',r=>{const request=JSON.parse(r.request().postDataJSON().messages.at(-1).content);return r.fulfill({json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify({message:'Wir prüfen deine konkrete Stellung.',plan:'Idee prüfen',opponent:'Gegenplan prüfen',candidates:request.legalMoves.slice(0,1),risks:'Antwort prüfen',playability:'Nächsten Schritt erklären',assessment:{verdict:'unclear',reason:'Antwortfixture, keine reale Bewertung.',dangers:[]},humanFactors:{idea:'Plan',calculation:'Rechnen',pitfalls:'Antwort',continuation:'Weiterdenken'},openQuestions:[]})}}],usage:{prompt_tokens:45,completion_tokens:30}}});});
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();await page.locator('#api-settings > summary').click();await page.locator('#api-key').fill('fixture-coach-only-not-a-real-key');await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('gespeichert');await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
 await expect(page.getByRole('tab')).toHaveCount(2);await page.locator('#game-level').selectOption('1');await page.locator('#game-form button').click();
 await page.getByRole('button',{name:'e2: Weiß Bauer',exact:true}).click();await page.getByRole('button',{name:'e4: leer',exact:true}).click();await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen',{timeout:12000});
 const before=await page.locator('#position-status').textContent();const board=await page.locator('#board').elementHandle();
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#workbench-status')).toContainText('Lernmodus');
 await page.locator('#question').fill('Zeige eine verständliche Idee');await page.locator('#ask').click();await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');
 const suggestion=page.getByRole('button',{name:/^Zug zeigen:/}).first();await suggestion.click();await expect(page.locator('#board .coach-move')).toHaveCount(2);
 const study=await page.locator('#position-status').textContent();expect(study).not.toBe(before);
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await expect(page.locator('#position-status')).toHaveText(before!);
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await expect(page.locator('#position-status')).toHaveText(study!);
 expect(await board!.evaluate(e=>e===document.getElementById('board'))).toBe(true);
 await page.locator('#comment-move').click();await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');await expect(page.locator('#dialogue')).toContainText('gerade ausprobierten Zug');
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await page.reload();await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await expect(page.locator('#game-status')).toContainText('Analysemodus');
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await expect(page.locator('#game-status')).toContainText('Partie läuft');
});

test('named games and file exports restore comments, branches and dialogue without touching credentials',async({page})=>{
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.getByRole('button',{name:'e2: Weiß Bauer',exact:true}).click();await page.getByRole('button',{name:'e4: leer',exact:true}).click();
 await page.getByText('Kommentar zu dieser Stellung',{exact:true}).click();await page.locator('#memory').fill('Bauernzentrum beobachten');await page.locator('#memory-form button').click();await page.locator('#question').fill('Mein Kommentar zur Zentrumsidee');await page.locator('#ask').click();await expect(page.locator('#dialogue-feedback')).toContainText('Beispielantwort');
 await page.locator('#learn-back').click();await page.getByRole('button',{name:'d2: Weiß Bauer',exact:true}).click();await page.getByRole('button',{name:'d4: leer',exact:true}).click();
 await page.locator('#games-menu > summary').click();await page.locator('#game-title').fill('Zentrumspläne');await page.locator('#save-game').click();await expect(page.locator('#games-status')).toContainText('auf diesem Gerät gespeichert');
 const download=page.waitForEvent('download');await page.locator('#download-game').click();const file=await download;expect(file.suggestedFilename()).toBe('Zentrumspläne.json');const stream=await file.createReadStream(),chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(Buffer.from(chunk));const json=Buffer.concat(chunks).toString('utf8'),saved=JSON.parse(json);
 expect(saved.nodes).toHaveLength(3);expect(saved.annotations.some((a:{kind:string;text:string})=>a.kind==='memory'&&a.text==='Bauernzentrum beobachten')).toBe(true);expect(saved.annotations.some((a:{text:string})=>a.text.includes('Mein Kommentar'))).toBe(true);expect(json).not.toMatch(/apiKey|ciphertext|password/);
 await page.reload();await page.locator('#games-menu > summary').click();await expect(page.locator('#saved-games option')).toHaveCount(1);await page.locator('#load-game').click();await expect(page.locator('#games-status')).toContainText('Partie geladen');await expect(page.locator('#position-status')).toContainText('n2');
 await page.locator('#learn-back').click();await page.locator('#game-file').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(json)});await expect(page.locator('#games-status')).toContainText('Partie geladen');await expect(page.locator('#position-status')).toContainText('n2');
 await page.locator('#game-file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"nodes":[]}')});await expect(page.locator('#games-status')).toContainText('Datei ungültig');await expect(page.locator('#position-status')).toContainText('n2');
 await page.locator('#panel-variants > summary').click();await page.locator('#variations button').filter({hasText:'n1 · e4'}).click();await expect(page.locator('#dialogue')).toContainText('Mein Kommentar');
});
