import { test, expect, type Page } from '@playwright/test';
import { Session } from '../src/session.js';

async function play(page: Page, move: string) {
  await page.getByLabel('Zug (SAN)', { exact: true }).fill(move);
  await page.getByRole('button', { name: 'Zug spielen', exact: true }).click();
}
async function exportData(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Sitzung als JSON exportieren' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('schachlabor-sitzung.json');
  const stream = await file.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const data = await page.getByLabel('Sitzungsdaten (JSON)').inputValue();
  expect(Buffer.concat(chunks).toString('utf8')).toBe(data);
  return data;
}
async function importData(page: Page, data: string) {
  await page.getByLabel('Sitzungsdaten (JSON)').fill(data);
  await page.getByRole('button', { name: 'Sitzung aus JSON wiederherstellen' }).click();
}
async function simulation(page: Page, mode: string) {
  await page.getByText('Simulation prüfen', { exact: true }).click();
  await page.getByLabel('Testverhalten').selectOption(mode);
}

test('board input, illegal moves, branches, memory and JSON restoration', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('group', { name: 'Schachbrett' }).getByRole('button')).toHaveCount(64);
  await page.getByRole('button', { name: 'e2: Weiß Bauer', exact: true }).click();
  await page.getByRole('button', { name: 'e4: leer', exact: true }).click();
  await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
  await play(page, 'e4');
  await expect(page.locator('#move-feedback')).toContainText('nicht legal');
  await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
  await page.getByLabel('Deine Nachricht').fill('Wie kontrolliere ich das Zentrum?');
  await page.getByRole('button', { name: 'Nachricht senden (Simulation)' }).click();
  await expect(page.locator('#dialogue')).toContainText('Kandidaten (ungeordnet)');
  await expect(page.locator('#dialogue')).toContainText('Simulation · Keine reale KI');
  await page.getByLabel('Eigene Notiz zur Stellung').fill('Zentrum beobachten');
  await page.getByLabel('Offene Frage (optional)').fill('Wann d4?');
  await page.getByRole('button', { name: 'Notiz merken' }).click();
  await expect(page.locator('#memories')).toContainText('Wann d4?');
  await play(page, 'e5');
  await page.getByRole('button', { name: 'n1 · e4', exact: true }).click();
  await play(page, 'c5');
  const data = await exportData(page);
  expect(JSON.parse(data).nodes).toHaveLength(4);
  await page.reload();
  await expect(page.locator('#position-status')).toContainText('n0');
  await page.getByLabel('JSON-Datei importieren').setInputFiles({ name: 'sitzung.json', mimeType: 'application/json', buffer: Buffer.from(data) });
  await expect(page.locator('#storage-feedback')).toContainText('aus Datei wiederhergestellt');
  await expect(page.locator('#position-status')).toContainText('n3 · Weiß');
  await page.getByRole('button', { name: 'n1 · e4', exact: true }).click();
  await expect(page.locator('#memories')).toContainText('Zentrum beobachten');
  await expect(page.locator('#dialogue')).toContainText('Wie kontrolliere ich das Zentrum?');
  const before = await exportData(page);
  await importData(page, '{broken');
  await expect(page.locator('#storage-feedback')).not.toHaveText('Sitzung wiederhergestellt.');
  expect(await exportData(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('delayed answer follows request position and is discarded after session import', async ({ page }) => {
  await page.goto('/'); await simulation(page, 'slow');
  await page.getByLabel('Deine Nachricht').fill('Plan der Ausgangsstellung?');
  await page.getByRole('button', { name: 'Nachricht senden (Simulation)' }).click();
  await play(page, 'e4');
  await expect(page.locator('#dialogue-feedback')).toContainText('angefragten Stellung gespeichert');
  await expect(page.locator('#dialogue')).toContainText('n0 ·');
  await expect(page.getByRole('button',{name:'Stellung n0 ansehen'}).first()).toBeVisible();
  await page.getByRole('button', { name: 'n0 · Ausgangsstellung', exact: true }).click();
  await expect(page.locator('#dialogue')).toContainText('Plan der Ausgangsstellung?');
  const data = await exportData(page);
  await page.getByRole('button', { name: 'Nachricht senden (Simulation)' }).click();
  await importData(page, data);
  await expect(page.locator('#dialogue-feedback')).toContainText('Veraltete Antwort');
  expect(await exportData(page)).toBe(data);
});

test('invalid replies and failures show errors, permit retry and never mutate dialogue', async ({ page }) => {
  await page.goto('/'); await simulation(page, 'invalid');
  await page.getByLabel('Deine Nachricht').fill('Plan?');
  await page.getByRole('button', { name: 'Nachricht senden (Simulation)' }).click();
  await expect(page.locator('#dialogue-feedback')).toContainText('Ungültige Simulationsantwort');
  await expect(page.locator('#dialogue')).toBeEmpty();
  await page.getByLabel('Testverhalten').selectOption('failure');
  await page.getByRole('button', { name: 'Nachricht senden (Simulation)' }).click();
  await expect(page.locator('#dialogue-feedback')).toContainText('Simulierter Anfragefehler');
  await expect(page.locator('#dialogue')).toBeEmpty();
  await page.getByLabel('Testverhalten').selectOption('normal');
  await page.getByRole('button', { name: 'Nachricht senden (Simulation)' }).click();
  await expect(page.locator('#dialogue')).toContainText('Gegenplan:');
});

test('special moves operate through the browser board', async ({ page }) => {
  await page.goto('/');
  await importData(page, new Session('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1').export());
  await page.getByRole('button', { name: 'e1: Weiß König', exact: true }).click();
  await page.getByRole('button', { name: 'g1: leer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'f1: Weiß Turm', exact: true })).toBeVisible();
  const enPassant = new Session(); for (const m of ['e4','a6','e5','d5']) enPassant.play(m);
  await importData(page, enPassant.export());
  await page.getByRole('button', { name: 'e5: Weiß Bauer', exact: true }).click();
  await page.getByRole('button', { name: 'd6: leer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'd5: leer', exact: true })).toBeVisible();
  await importData(page, new Session('7k/P7/8/8/8/8/8/7K w - - 0 1').export());
  await page.getByLabel('Umwandlung beim Brettzug').selectOption('n');
  await page.getByRole('button', { name: 'a7: Weiß Bauer', exact: true }).click();
  await page.getByRole('button', { name: 'a8: leer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'a8: Weiß Springer', exact: true })).toBeVisible();
});

test('imported text is displayed literally and mobile layout fits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const s = new Session(); s.annotate({ nodeId: 'n0', kind: 'memory', source: 'human',
    text: '<img src=x onerror="window.injected=true">', hypothesis: true, openQuestions: [] });
  await importData(page, s.export());
  await expect(page.locator('#memories')).toContainText('<img src=x');
  await expect(page.locator('#memories img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('real model is locked by default while simulation remains usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#model-status')).toContainText('Reale KI gesperrt');
  await page.getByLabel('Dialogmodus').selectOption('model');
  await expect(page.getByRole('button', { name:'Nachricht senden (reale KI)' })).toBeDisabled();
  await page.getByLabel('Dialogmodus').selectOption('simulation');
  await page.getByLabel('Deine Nachricht').fill('Plan?');
  await page.getByRole('button', { name:'Nachricht senden (Simulation)' }).click();
  await expect(page.locator('#dialogue')).toContainText('Simulation · Keine reale KI');
});

test('local model API fixture exercises UI transport and provenance without any provider call', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json:{ available:true, remaining:3 } }));
  let received: Record<string, unknown> | undefined;
  await page.route('**/api/dialogue', route => {
    received = route.request().postDataJSON();
    return route.fulfill({ json:{ message:'Lokale Dialog-Testantwort',plan:'Lokale Modell-Testantwort', opponent:'Hypothese: Zentrum angreifen', candidates:['e4'],
      risks:'Test-Risiko', playability:'Test-Spielbarkeit', humanFactors:{idea:'Testidee',calculation:'Testrechnung',pitfalls:'Testgefahr',continuation:'Testfortsetzung'}, openQuestions:['Testfrage?'] } });
  });
  await page.goto('/');
  await expect(page.locator('#model-status')).toContainText('KI-Zugang konfiguriert');
  await page.getByLabel('Dialogmodus').selectOption('model');
  await page.getByLabel('Deine Nachricht').fill('Was könnte Schwarz planen?');
  await page.getByRole('button', { name:'Nachricht senden (reale KI)' }).click();
  await expect(page.locator('#dialogue')).toContainText('Modell · Hypothese');
  expect(received?.nodeId).toBe('n0');
  expect(received).not.toHaveProperty('apiKey');
  const data = JSON.parse(await exportData(page));
  expect(data.annotations.at(-1).source).toBe('model');
  expect(data.annotations.at(-1).text).toContain('Lokale Modell-Testantwort');
});

test('real Stockfish runs only on demand and preserves its factcheck through export/import', async ({ page }) => {
  let calls = 0; page.on('request', r => { if (r.url().endsWith('/api/tactics')) calls++; });
  await page.goto('/');
  await play(page,'e4'); expect(calls).toBe(0);
  const mate = new Session('7k/8/5KQ1/8/8/8/8/8 w - - 0 1');
  await importData(page,mate.export());
  await page.getByLabel('Kandidatenzug prüfen (SAN, optional)').fill('Qg7#');
  await page.getByRole('button',{name:'Taktischen Faktencheck starten'}).click();
  await expect(page.locator('#tactical-results')).toContainText('Stockfish 19 Lite');
  await expect(page.locator('#tactical-results')).toContainText('Mattdistanz 1 für Weiß');
  await expect(page.locator('#tactical-results')).toContainText('Tiefe 12 / 20.000 Knoten');
  expect(calls).toBe(1);
  const data = await exportData(page);
  await play(page,'Qg7#');
  await expect(page.locator('#tactical-results')).toBeEmpty();
  await expect(page.getByRole('button',{name:'Taktischen Faktencheck starten'})).toBeDisabled();
  await importData(page,data);
  await expect(page.locator('#tactical-results')).toContainText('Qg7#');
  expect(calls).toBe(1);
  expect(JSON.parse(data).annotations[0].source).toBe('stockfish');
});

test('Stockfish failure leaves the session unchanged and allows retry', async ({ page }) => {
  await page.route('**/api/tactics',route => route.fulfill({status:503,json:{error:'Unavailable'}}));
  await page.goto('/');
  await page.getByRole('button',{name:'Taktischen Faktencheck starten'}).click();
  await expect(page.locator('#tactical-feedback')).toContainText('fehlgeschlagen');
  await expect(page.locator('#tactical-results')).toBeEmpty();
  await expect(page.getByRole('button',{name:'Taktischen Faktencheck starten'})).toBeEnabled();
  expect(JSON.parse(await exportData(page)).annotations).toHaveLength(0);
});

test('API key can be saved locally, stays out of browser storage/export and is removable', async ({page}) => {
  const sentinel='local-ui-test-key-not-a-real-credential';
  let modelCalls=0;
  page.on('request',r => {if(r.url().endsWith('/api/dialogue')) modelCalls++;});
  await page.goto('/');
  await page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}).click();
  await expect(page.getByLabel('OpenAI-API-Schlüssel',{exact:true})).toHaveAttribute('type','password');
  await page.getByLabel('OpenAI-API-Schlüssel',{exact:true}).fill(sentinel);
  await page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true}).click();
  await expect(page.locator('#api-feedback')).toBeEmpty(); // unchecked consent prevents submission
  await page.locator('#api-cost-consent').check();
  await page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true}).click();
  await expect(page.locator('#api-feedback')).toContainText('Noch keine Modellanfrage');
  await expect(page.getByLabel('OpenAI-API-Schlüssel',{exact:true})).toHaveValue('');
  await expect(page.getByLabel('Dialogmodus')).toHaveValue('model');
  expect(modelCalls).toBe(0);
  const stores=await page.evaluate(() => JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
  expect(stores).not.toContain(sentinel);
  expect(await exportData(page)).not.toContain(sentinel);
  await page.reload();
  await expect(page.locator('#model-status')).toContainText('KI-Zugang konfiguriert');
  await page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}).click();
  await page.getByRole('button',{name:'Gespeicherten Schlüssel löschen'}).click();
  await expect(page.locator('#api-feedback')).toContainText('Gespeicherter Schlüssel gelöscht');
  await expect(page.locator('#model-status')).toContainText('Reale KI gesperrt');
  expect(modelCalls).toBe(0);
});

test('diagnosis and cost settings work without exposing credentials or generating text',async({page})=>{
 let calls=0;page.on('request',r=>{if(r.url().endsWith('/api/dialogue'))calls++;});
 await page.goto('/');await page.getByRole('button',{name:'Lokale Diagnose anzeigen'}).click();
 await expect(page.locator('#diagnostic-output')).toContainText('Node.js');
 await page.getByLabel('Budget pro Periode (USD)').fill('0.03');
 await page.getByRole('button',{name:'Kostenlimit speichern'}).click();
 await expect(page.locator('#cost-feedback')).toContainText('lokal gespeichert');
 await page.reload();await expect(page.getByLabel('Budget pro Periode (USD)')).toHaveValue('0.03');
 await page.getByRole('button',{name:'Neue Budgetperiode starten'}).click();
 await expect(page.locator('#cost-feedback')).toContainText('bestätigen');
 await page.getByRole('button',{name:'OpenAI-Zugang prüfen (ohne Textgenerierung)'}).click();
 await expect(page.locator('#diagnostic-output')).toContainText('Kein API-Schlüssel');
 expect(calls).toBe(0);
});
test('update UI checks target and requires explicit install consent',async({page})=>{
 let installs=0;
 await page.route('**/api/update',route=>{
  const r=route.request().postDataJSON();if(r.action==='install'){installs++;return route.fulfill({status:400,json:{error:'test failure'}});}
  return route.fulfill({json:{current:'a'.repeat(40),target:'b'.repeat(40),available:true,canInstall:true,dirty:false,branch:'work'}});
 });
 await page.goto('/');await page.getByRole('button',{name:'Nach Updates suchen'}).click();
 await expect(page.locator('#update-info')).toContainText('bbbbbbb');
 await page.getByRole('button',{name:'Update installieren'}).click();expect(installs).toBe(0);
 await expect(page.locator('#update-feedback')).toContainText('bestätigen');
 await page.locator('#update-consent').check();await page.getByRole('button',{name:'Update installieren'}).click();
 await expect(page.locator('#update-feedback')).toContainText('nicht abgeschlossen');expect(installs).toBe(1);
});

test('real engine learning game pauses for chat, keeps analysis branches and saves comparisons',async({page})=>{
 let engineCalls=0;page.on('request',r=>{if(r.url().endsWith('/api/play'))engineCalls++;});
 await page.goto('/');await page.getByLabel('Engine-Spielstärke',{exact:true}).selectOption('1');
 await page.getByRole('button',{name:'Partie ab dieser Stellung starten'}).click();
 await play(page,'e4');await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 expect(engineCalls).toBe(1);
 const played=JSON.parse(await exportData(page)),cursor=played.game.cursor;
 await page.getByRole('button',{name:'Pausieren und analysieren',exact:true}).click();
 await page.getByRole('button',{name:'n0 · Ausgangsstellung · Partie',exact:true}).click();await play(page,'d4');
 await page.getByLabel('Name der ausgewählten Variante').fill('Mein d4-Plan');await page.getByRole('button',{name:'Variante benennen'}).click();
 await page.getByLabel('Variante A',{exact:true}).selectOption('n1');await page.getByLabel('Variante B',{exact:true}).selectOption('n3');
 await page.getByRole('button',{name:'Vergleich anzeigen'}).click();await expect(page.locator('#comparison-view')).toContainText('Mein d4-Plan');
 await expect(page.locator('.mini-board')).toHaveCount(2);
 await page.getByLabel('Deine Nachricht').fill('Was unterscheidet meinen Plan von e4?');
 await page.getByRole('button',{name:'Nachricht senden (Simulation)'}).click();await expect(page.locator('#dialogue')).toContainText('Was unterscheidet');
 const saved=await exportData(page);expect(JSON.parse(saved).game.cursor).toBe(cursor);expect(engineCalls).toBe(1);
 await page.reload();await importData(page,saved);await expect(page.locator('#game-status')).toContainText('Analysemodus');
 await expect(page.locator('#comparison-view')).toContainText('Mein d4-Plan');
 await page.getByRole('button',{name:'Zur Partie zurück und fortsetzen'}).click();await expect(page.locator('#position-status')).toContainText(cursor);
 expect(engineCalls).toBe(1);
});
test('black-side learning game receives the first real engine move automatically',async({page})=>{
 await page.goto('/');await page.getByLabel('Meine Farbe',{exact:true}).selectOption('b');await page.getByLabel('Engine-Spielstärke',{exact:true}).selectOption('5');
 await page.getByRole('button',{name:'Partie ab dieser Stellung starten'}).click();await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 await expect(page.locator('#game-status')).toContainText('Du spielst Schwarz');
 await expect(page.locator('#board button').first()).toHaveAttribute('aria-label','h1: Weiß Turm');
 await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
});
test('engine error pauses the learning game without an automatic retry loop',async({page})=>{
 let calls=0;await page.route('**/api/play',route=>{calls++;return route.fulfill({status:503,json:{error:'test'}});});
 await page.goto('/');await page.getByRole('button',{name:'Partie ab dieser Stellung starten'}).click();await play(page,'e4');
 await expect(page.locator('#game-status')).toContainText('Analysemodus');await expect(page.locator('#game-feedback')).toContainText('fehlgeschlagen');
 expect(calls).toBe(1);expect(JSON.parse(await exportData(page)).nodes).toHaveLength(2);
});

test('learner can save their thoughts and choose guiding questions without spoilers',async({page})=>{
 await page.goto('/');await page.getByText('Meine Gedanken und Lernwünsche (optional)',{exact:true}).click();
 await page.getByLabel('Meine eigene Planidee',{exact:true}).fill('Zentrum kontrollieren');
 await page.getByLabel('Warum halte ich das für sinnvoll?',{exact:true}).fill('Aktivere Figuren');
 await page.getByLabel('Was möchte ich verstehen oder üben?',{exact:true}).fill('Gegenpläne erkennen');
 await page.getByLabel('Wie viel Hilfe möchte ich?',{exact:true}).selectOption('question');
 await page.getByRole('button',{name:'Gedankengang an dieser Stellung speichern'}).click();
 await page.getByLabel('Deine Nachricht').fill('Wo soll ich anfangen?');await page.getByRole('button',{name:'Nachricht senden (Simulation)'}).click();
 await expect(page.locator('#dialogue')).toContainText('Leitfrage:');await expect(page.locator('#dialogue')).not.toContainText('Kandidaten (ungeordnet)');
 const data=await exportData(page);expect(JSON.parse(data).reflections.n0.idea).toBe('Zentrum kontrollieren');
 await page.reload();await importData(page,data);await page.getByText('Meine Gedanken und Lernwünsche (optional)',{exact:true}).click();
 await expect(page.getByLabel('Meine eigene Planidee',{exact:true})).toHaveValue('Zentrum kontrollieren');await expect(page.getByLabel('Wie viel Hilfe möchte ich?',{exact:true})).toHaveValue('question');
});
test('manifest and icons are served without exposing server files',async({request})=>{
 const manifest=await request.get('/manifest.webmanifest');expect(manifest.ok()).toBe(true);expect(manifest.headers()['content-type']).toContain('manifest');
 const value=await manifest.json();expect(value.display).toBe('standalone');for(const icon of value.icons){const r=await request.get(icon.src);expect(r.ok()).toBe(true);expect(r.headers()['content-type']).toBe('image/png');}
 expect((await request.get('/icons/../../server/credentials.ts')).status()).toBe(404);
});
test('learning controls and board remain usable at Android and iPad-sized touch viewports',async({browser})=>{
 for(const size of [{width:412,height:915},{width:820,height:1180}]){
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true});const page=await context.newPage();await page.goto('/');
  await page.getByRole('button',{name:'e2: Weiß Bauer',exact:true}).tap();await page.getByRole('button',{name:'e4: leer',exact:true}).tap();await expect(page.locator('#position-status')).toContainText('n1');
  await page.getByText('Meine Gedanken und Lernwünsche (optional)',{exact:true}).tap();await page.getByLabel('Meine eigene Planidee',{exact:true}).fill('Mein Plan');
  await page.getByRole('button',{name:'Gedankengang an dieser Stellung speichern'}).tap();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
 }
});

test('learning dialogue integrates engine game, actual model-service transport and follow-up conversation',async({page})=>{
 const {ModelService}=await import('../server/model.js');let calls=0;
 const fixture={message:'Als Lernbeispiel greifen wir deine Zentrumsidee auf.',plan:'Zentrum',opponent:'Möglicher Gegenstoß',candidates:[],risks:'Ungedeckte Figuren',playability:'Klare nächste Schritte',humanFactors:{idea:'Deine Begründung prüfen',calculation:'Zwingende Antworten',pitfalls:'Gegenstoß',continuation:'Figuren verbessern'},openQuestions:['Was möchtest du mit deinem Plan verhindern?']};
 const service=new ModelService({enabled:true,apiKey:'local-integration-test-key',model:'fixture'},(async(_url,init)=>{
  calls++;const body=JSON.parse(init!.body as string);if(calls===2){expect(body.messages.map((m:{role:string})=>m.role)).toEqual(['system','user','assistant','user']);expect(body.messages[2].content).toContain('Zentrumsidee');}
  if(calls===3){const current=JSON.parse(body.messages.at(-1).content);expect(current.topic).toBe('review');expect(current.history.moves).toHaveLength(2);}
  return new Response(JSON.stringify({usage:{prompt_tokens:200,completion_tokens:100},choices:[{finish_reason:'stop',message:{content:JSON.stringify({...fixture,message:calls===1?fixture.message:'Als zweite Testantwort betrachten wir deinen Gegenplan.'})}}]}));
 }) as typeof fetch);
 await page.route('**/api/status',route=>route.fulfill({json:service.status()}));
 await page.route('**/api/dialogue',async route=>{const result=await service.reply(route.request().postDataJSON());await route.fulfill({json:result});});
 await page.goto('/');await page.getByLabel('Engine-Spielstärke',{exact:true}).selectOption('1');await page.getByRole('button',{name:'Partie ab dieser Stellung starten'}).click();await play(page,'e4');await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 const cursor=JSON.parse(await exportData(page)).game.cursor;
 await page.getByLabel('Dialogmodus').selectOption('model');await page.getByRole('button',{name:'Lerngespräch vorbereiten'}).click();expect(calls).toBe(0);
 await page.getByLabel('Deine Nachricht').fill('Meine Idee ist Zentrumskontrolle. Warum ist das sinnvoll?');await page.getByRole('button',{name:'Nachricht senden (reale KI)'}).click();
 await expect(page.locator('#dialogue')).toContainText('Zentrumsidee');await expect(page.locator('#game-status')).toContainText('Analysemodus');
 await page.getByRole('button',{name:'Rückfrage aufgreifen: Was möchtest du mit deinem Plan verhindern?'}).click();expect(calls).toBe(1);
 await page.getByRole('button',{name:'Nachricht senden (reale KI)'}).click();await expect(page.locator('#dialogue')).toContainText('zweite Testantwort');expect(calls).toBe(2);
 await page.getByRole('button',{name:'n0 · Ausgangsstellung · Partie',exact:true}).click();await play(page,'d4');
 await page.getByLabel('Worüber sprechen wir?').selectOption('review');await page.getByLabel('Deine Nachricht').fill('Besprechen wir die wirkliche Partie.');await page.getByRole('button',{name:'Nachricht senden (reale KI)'}).click();
 await expect(page.locator('#position-status')).toContainText(cursor);await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');expect(calls).toBe(3);
 const saved=JSON.parse(await exportData(page));expect(saved.game.cursor).toBe(cursor);expect(saved.annotations.filter((a:{source:string})=>a.source==='model')).toHaveLength(3);
});


async function dragPiece(page: Page, from: string, to: string) {
  await page.locator('#board').scrollIntoViewIfNeeded();
  const source = await page.locator(`#board [data-square="${from}"]`).boundingBox();
  const target = await page.locator(`#board [data-square="${to}"]`).boundingBox();
  await page.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2);
  await page.mouse.down();
  await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height / 2, { steps: 10 });
  await expect(page.locator('.drag-piece')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('.drag-piece')).toHaveCount(0);
}

test('mouse dragging validates moves, cancels outside the board and preserves analysis branches', async ({page}) => {
  await page.goto('/');
  await dragPiece(page, 'e2', 'e5');
  await expect(page.locator('#move-feedback')).toContainText('nicht legal');
  await expect(page.locator('#position-status')).toContainText('n0');
  await dragPiece(page, 'e2', 'e4');
  await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
  await dragPiece(page, 'd7', 'e4'); // Illegal capture leaves both pieces in place.
  await expect(page.locator('#board [data-square="d7"]')).toHaveAttribute('aria-label', 'd7: Schwarz Bauer');
  const source = await page.locator('#board [data-square="e7"]').boundingBox();
  await page.mouse.move(source!.x + source!.width/2, source!.y + source!.height/2);
  await page.mouse.down(); await page.mouse.move(5,5,{steps:10}); await page.mouse.up();
  await expect(page.locator('.drag-piece')).toHaveCount(0);
  await expect(page.locator('#position-status')).toContainText('n1');
  await dragPiece(page, 'e7', 'e5');
  await page.getByRole('button',{name:'n0 · Ausgangsstellung',exact:true}).click();
  await dragPiece(page, 'd2', 'd4');
  const data=JSON.parse(await exportData(page));
  expect(data.nodes.map((n:{san:string|null})=>n.san)).toEqual([null,'e4','e5','d4']);
});

test('mouse dragging supports castling, en passant, capture and underpromotion',async({page})=>{
 await page.goto('/');
 await importData(page,new Session('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1').export());
 await dragPiece(page,'e1','g1');
 await expect(page.locator('#board [data-square="f1"]')).toHaveAttribute('aria-label','f1: Weiß Turm');
 const s=new Session();for(const m of ['e4','a6','e5','d5'])s.play(m);
 await importData(page,s.export());await dragPiece(page,'e5','d6');
 await expect(page.locator('#board [data-square="d5"]')).toHaveAttribute('aria-label','d5: leer');
 await importData(page,new Session('7k/P7/8/8/8/8/8/7K w - - 0 1').export());
 await page.getByLabel('Umwandlung beim Brettzug').selectOption('n');await dragPiece(page,'a7','a8');
 await expect(page.locator('#board [data-square="a8"]')).toHaveAttribute('aria-label','a8: Weiß Springer');
 const capture=new Session();for(const m of ['e4','d5'])capture.play(m);
 await importData(page,capture.export());await dragPiece(page,'e4','d5');
 await expect(page.locator('#board [data-square="d5"]')).toHaveAttribute('aria-label','d5: Weiß Bauer');
});

test('dragging plays against real Stockfish and works on the flipped black board',async({page})=>{
 await page.goto('/');await page.getByLabel('Engine-Spielstärke',{exact:true}).selectOption('1');
 await page.getByRole('button',{name:'Partie ab dieser Stellung starten'}).click();
 await dragPiece(page,'e2','e4');await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 const first=JSON.parse(await exportData(page));expect(first.game.cursor).toBe('n2');expect(first.nodes).toHaveLength(3);
 await page.reload();await page.getByLabel('Meine Farbe',{exact:true}).selectOption('b');
 await page.getByRole('button',{name:'Partie ab dieser Stellung starten'}).click();
 await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 await dragPiece(page,'e7','e5');await expect(page.locator('#position-status')).toContainText('n3 · Schwarz');
 expect(JSON.parse(await exportData(page)).nodes).toHaveLength(4);
});

test('Escape and pointer cancellation abort dragging without a move',async({page})=>{
 await page.goto('/');
 const cell=page.locator('#board [data-square="e2"]');await page.locator('#board').scrollIntoViewIfNeeded();const box=await cell.boundingBox();
 for(const cancel of ['escape','pointercancel']){
  await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();
  await page.mouse.move(box!.x+box!.width/2,box!.y-box!.height,{steps:5});
  await expect(page.locator('.drag-piece')).toHaveCount(1);
  if(cancel==='escape')await page.keyboard.press('Escape');else await cell.dispatchEvent('pointercancel');
  await page.mouse.up();await expect(page.locator('.drag-piece')).toHaveCount(0);
  await expect(page.locator('#position-status')).toContainText('n0');
 }
});


test('finger swipes over pieces scroll the page while two taps still play a move',async({browser})=>{
 for(const viewport of [{width:412,height:915},{width:820,height:1180}]){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('/');
  await page.locator('#board').scrollIntoViewIfNeeded();
  const box=await page.locator('#board').boundingBox();
  const before=await page.evaluate(()=>scrollY);
  const cdp=await context.newCDPSession(page);
  // Start over a white pawn, not just a blank margin: this used to start dragging.
  const pawn=await page.locator('#board [data-square="e2"]').boundingBox();
  const x=pawn!.x+pawn!.width/2,y=pawn!.y+pawn!.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let step=1;step<=10;step++)await cdp.send('Input.dispatchTouchEvent',{
   type:'touchMove',touchPoints:[{x,y:y-step*box!.height*0.06}]
  });
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+30);
  await expect(page.locator('.drag-piece')).toHaveCount(0);
  await expect(page.locator('#position-status')).toContainText('n0');
  // Wait for native momentum to settle before precise taps.
  await page.locator('#board').scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'e2: Weiß Bauer',exact:true}).tap();
  await expect(page.locator('#board [data-square="e4"]')).toHaveClass(/target/);
  await page.getByRole('button',{name:'e4: leer',exact:true}).tap();
  await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
  expect(JSON.parse(await exportData(page)).nodes).toHaveLength(2);
  await context.close();
 }
});


async function fingerScroll(page: Page, direction: 'down' | 'up') {
 const cdp=await page.context().newCDPSession(page);
 const viewport=page.viewportSize()!;
 const before=await page.evaluate(()=>scrollY);
 const x=viewport.width/2;
 const start=direction==='down'?viewport.height*0.8:viewport.height*0.25;
 const distance=viewport.height*0.45*(direction==='down'?-1:1);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});
 for(let step=1;step<=10;step++)await cdp.send('Input.dispatchTouchEvent',{
  type:'touchMove',touchPoints:[{x,y:start+distance*step/10}]
 });
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 if(direction==='down')await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+20);
 else await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(before-20);
 await cdp.detach();
}

test('touch key save reports progress and persistence while scrolling stays usable before and after save',async({browser})=>{
 for(const viewport of [{width:412,height:915},{width:820,height:1180},{width:1280,height:720}]){
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<1000});
  const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  let release!:()=>void;const ready=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/model-config',async route=>{
   if(route.request().postDataJSON().action==='connect')await ready;
   await route.continue();
  });
  await page.goto('/');await page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}).tap();
  await page.getByLabel('OpenAI-API-Schlüssel',{exact:true}).fill('touch-save-test-key-not-real');
  await page.locator('#api-cost-consent').check();
  await page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true}).tap();
  await expect(page.locator('#api-feedback')).toContainText('wird lokal gespeichert');
  await expect(page.locator('#api-feedback')).toBeInViewport();
  await expect(page.locator('#api-key')).toHaveValue('');
  expect(await page.evaluate(()=>document.activeElement?.id)).toBe('api-feedback');
  await fingerScroll(page,'down');
  release();await expect(page.locator('#api-feedback')).toContainText('nicht erneut eingeben');
  await expect(page.locator('#credential-status')).toContainText('lokal gespeichert');
  await expect(page.locator('#api-connect')).toBeEnabled();
  await fingerScroll(page,'up');
  await page.reload();await expect(page.locator('#credential-status')).toContainText('lokal gespeichert');
  await page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}).tap();
  await expect(page.locator('#api-key')).toHaveValue('');
  await page.getByRole('button',{name:'Gespeicherten Schlüssel löschen'}).tap();
  await expect(page.locator('#credential-status')).toContainText('Kein API-Schlüssel');
  expect(errors).toEqual([]);await context.close();
 }
});

test('failed key save stays scrollable and never claims success',async({browser})=>{
 const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.route('**/api/model-config',route=>route.fulfill({status:500,json:{error:'Interner Fehler.'}}));
 await page.goto('/');await page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}).tap();
 await page.getByLabel('OpenAI-API-Schlüssel',{exact:true}).fill('failed-save-test-key-not-real');
 await page.locator('#api-cost-consent').check();
 await page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true}).tap();
 await expect(page.locator('#api-feedback')).toContainText('Speicherung ist nicht bestätigt');
 await expect(page.locator('#credential-status')).toContainText('Kein API-Schlüssel');
 await expect(page.locator('#api-connect')).toBeEnabled();
 await fingerScroll(page,'down');await fingerScroll(page,'up');
 await context.close();
});
