import {openView} from './navigation-helper.js';
import { test, expect, type Page, type Locator } from '@playwright/test';
import { REVIEW_PGN, REPETITION_PGN } from '../test/fixtures/review-game.js';
import { APP_VERSION } from '../src/version.js';
import { Session } from '../src/session.js';


// Follow the new user navigation with real clicks; never force hidden controls open.
async function reveal(page: Page, target: Locator): Promise<Locator> {
 if(await target.evaluate(e=>!!e.closest('#scroll-help-actions'))&&!(await page.locator('#scroll-help-actions').isVisible()))await page.locator('#scroll-help-toggle').click();
 const location=await target.evaluate(element=>({panel:element.closest('#learning-chat,#learning-controls')?'panel-learn':element.closest('#panel-settings,#panel-variants,[role=tabpanel]')?.id,board:!!element.closest('#board-area')}));
 if(location.panel){
  await openView(page,location.panel.replace('panel-',''));
 }else if(location.board && !(await page.locator('#board-area').isVisible())){
  await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
 }
 for(const detail of await target.locator('xpath=ancestor::details').all()){
  if(await detail.getAttribute('open')===null)await detail.locator(':scope > summary').click();
 }
 return target;
}

async function play(page: Page, move: string) {
  await (await reveal(page, page.getByLabel('Zug (SAN)', { exact: true }))).fill(move);
  await (await reveal(page, page.getByRole('button', { name: 'Zug spielen', exact: true , includeHidden:true}))).click();
}
async function exportData(page: Page) {
  const active=page.locator('[role=tab][aria-selected=true]');const previous=await active.count()?await active.getAttribute('id'):null;
  const download = page.waitForEvent('download');
  await (await reveal(page, page.getByRole('button', { name: 'Sitzung als JSON exportieren' , includeHidden:true}))).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('schachlabor-sitzung.json');
  const stream = await file.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const data = await page.getByLabel('Sitzungsdaten (JSON)').inputValue();
  expect(Buffer.concat(chunks).toString('utf8')).toBe(data);
  if(previous)await page.locator('#'+previous).click();
  return data;
}
async function importData(page: Page, data: string) {
  const active=page.locator('[role=tab][aria-selected=true]');const previous=await active.count()?await active.getAttribute('id'):null;
  await (await reveal(page, page.getByLabel('Sitzungsdaten (JSON)'))).fill(data);
  await (await reveal(page, page.getByRole('button', { name: 'Sitzung aus JSON wiederherstellen' , includeHidden:true}))).click();
  if(previous)await page.locator('#'+previous).click();
}
async function simulation(page: Page, mode: string) {
  await (await reveal(page, page.getByText('Simulation prüfen', { exact: true }))).click();
  await (await reveal(page, page.getByLabel('Testverhalten'))).selectOption(mode);
}

test('board input, illegal moves, branches, memory and JSON restoration', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('group', { name: 'Schachbrett' , includeHidden:true}).getByRole('button', {includeHidden:true})).toHaveCount(64);
  await (await reveal(page, page.getByRole('button', { name: 'e2: Weiß Bauer', exact: true , includeHidden:true}))).click();
  await (await reveal(page, page.getByRole('button', { name: 'e4: leer', exact: true , includeHidden:true}))).click();
  await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
  await play(page, 'e4');
  await expect(page.locator('#move-feedback')).toContainText('nicht legal');
  await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
  await (await reveal(page, page.getByLabel('Deine Nachricht'))).fill('Wie kontrolliere ich das Zentrum?');
  await (await reveal(page, page.getByRole('button', { name: 'Nachricht senden (Simulation)' , includeHidden:true}))).click();
  await expect(page.locator('#dialogue')).toContainText('Hier antwortet keine KI');await expect(page.locator('#dialogue').getByRole('button',{name:/^Zug zeigen:/})).toHaveCount(0);
  await expect(page.locator('#dialogue')).toContainText('Simulation · Keine reale KI');
  await (await reveal(page, page.getByLabel('Eigene Notiz zur Stellung'))).fill('Zentrum beobachten');
  await (await reveal(page, page.getByLabel('Offene Frage (optional)'))).fill('Wann d4?');
  await (await reveal(page, page.getByRole('button', { name: 'Notiz merken' , includeHidden:true}))).click();
  await expect(page.locator('#memories')).toContainText('Wann d4?');
  await play(page, 'e5');
  await (await reveal(page, page.getByRole('button', { name: 'n1 · e4', exact: true , includeHidden:true}))).click();
  await play(page, 'c5');
  const data = await exportData(page);
  expect(JSON.parse(data).nodes).toHaveLength(4);
  await page.reload();
  await expect(page.locator('#position-status')).toContainText('n0');
  await (await reveal(page, page.getByLabel('JSON-Datei importieren'))).setInputFiles({ name: 'sitzung.json', mimeType: 'application/json', buffer: Buffer.from(data) });
  await expect(page.locator('#storage-feedback')).toContainText('aus Datei wiederhergestellt');
  await expect(page.locator('#position-status')).toContainText('n3 · Weiß');
  await (await reveal(page, page.getByRole('button', { name: 'n1 · e4', exact: true , includeHidden:true}))).click();
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
  await (await reveal(page, page.getByLabel('Deine Nachricht'))).fill('Plan der Ausgangsstellung?');
  await (await reveal(page, page.getByRole('button', { name: 'Nachricht senden (Simulation)' , includeHidden:true}))).click();
  await play(page, 'e4');
  await expect(page.locator('#dialogue-feedback')).toContainText('angefragten Stellung gespeichert');
  await expect(page.locator('#dialogue')).toContainText('n0 ·');
  await expect(page.getByRole('button',{name:'Stellung n0 ansehen', includeHidden:true}).first()).toBeVisible();
  await (await reveal(page, page.getByRole('button', { name: 'n0 · Ausgangsstellung', exact: true , includeHidden:true}))).click();
  await expect(page.locator('#dialogue')).toContainText('Plan der Ausgangsstellung?');
  const data = await exportData(page);
  await (await reveal(page, page.getByRole('button', { name: 'Nachricht senden (Simulation)' , includeHidden:true}))).click();
  await importData(page, data);
  await expect(page.locator('#dialogue-feedback')).toContainText('Veraltete Antwort');
  expect(await exportData(page)).toBe(data);
});

test('invalid replies and failures show errors, permit retry and never mutate dialogue', async ({ page }) => {
  await page.goto('/'); await simulation(page, 'invalid');
  await (await reveal(page, page.getByLabel('Deine Nachricht'))).fill('Plan?');
  await (await reveal(page, page.getByRole('button', { name: 'Nachricht senden (Simulation)' , includeHidden:true}))).click();
  await expect(page.locator('#dialogue-feedback')).toContainText('Ungültige Simulationsantwort');
  await expect(page.locator('#dialogue')).toBeEmpty();
  await (await reveal(page, page.getByLabel('Testverhalten'))).selectOption('failure');
  await (await reveal(page, page.getByRole('button', { name: 'Nachricht senden (Simulation)' , includeHidden:true}))).click();
  await expect(page.locator('#dialogue-feedback')).toContainText('Simulierter Anfragefehler');
  await expect(page.locator('#dialogue')).toBeEmpty();
  await (await reveal(page, page.getByLabel('Testverhalten'))).selectOption('normal');
  await (await reveal(page, page.getByRole('button', { name: 'Nachricht senden (Simulation)' , includeHidden:true}))).click();
  await expect(page.locator('#dialogue')).toContainText('Hier antwortet keine KI');
});

test('special moves operate through the browser board', async ({ page }) => {
  await page.goto('/');
  await importData(page, new Session('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1').export());
  await (await reveal(page, page.getByRole('button', { name: 'e1: Weiß König', exact: true , includeHidden:true}))).click();
  await (await reveal(page, page.getByRole('button', { name: 'g1: leer', exact: true , includeHidden:true}))).click();
  await expect(page.getByRole('button', { name: 'f1: Weiß Turm', exact: true , includeHidden:true})).toBeVisible();
  const enPassant = new Session(); for (const m of ['e4','a6','e5','d5']) enPassant.play(m);
  await importData(page, enPassant.export());
  await (await reveal(page, page.getByRole('button', { name: 'e5: Weiß Bauer', exact: true , includeHidden:true}))).click();
  await (await reveal(page, page.getByRole('button', { name: 'd6: leer', exact: true , includeHidden:true}))).click();
  await expect(page.getByRole('button', { name: 'd5: leer', exact: true , includeHidden:true})).toBeVisible();
  await importData(page, new Session('7k/P7/8/8/8/8/8/7K w - - 0 1').export());
  await (await reveal(page, page.getByLabel('Bauernumwandlung'))).selectOption('n');
  await (await reveal(page, page.getByRole('button', { name: 'a7: Weiß Bauer', exact: true , includeHidden:true}))).click();
  await (await reveal(page, page.getByRole('button', { name: 'a8: leer', exact: true , includeHidden:true}))).click();
  await expect(page.getByRole('button', { name: 'a8: Weiß Springer', exact: true , includeHidden:true})).toBeVisible();
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
  await expect(page.locator('#model-status')).toContainText('Kein aktiver KI-Zugang');
  await (await reveal(page, page.getByLabel('Dialogmodus'))).selectOption('model');
  await expect(page.getByRole('button', { name:'Nachricht senden (reale KI)' , includeHidden:true})).toBeDisabled();
  await (await reveal(page, page.getByLabel('Dialogmodus'))).selectOption('simulation');
  await (await reveal(page, page.getByLabel('Deine Nachricht'))).fill('Plan?');
  await (await reveal(page, page.getByRole('button', { name:'Nachricht senden (Simulation)' , includeHidden:true}))).click();
  await expect(page.locator('#dialogue')).toContainText('Simulation · Keine reale KI');
});

test('local model API fixture exercises UI transport and provenance without any provider call', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json:{ available:true, remaining:3 } }));
  let received: Record<string, unknown> | undefined;
  await page.route('**/api/dialogue', route => {
    received = route.request().postDataJSON();
    return route.fulfill({ json:{ message:'Lokale Dialog-Testantwort',plan:'Lokale Modell-Testantwort', opponent:'Hypothese: Zentrum angreifen', candidates:['e4'],
      risks:'Test-Risiko', playability:'Test-Spielbarkeit', assessment:{verdict:'unclear' as const,reason:'Testeinschätzung: keine geprüfte Gesamtbewertung.',dangers:[]},humanFactors:{idea:'Testidee',calculation:'Testrechnung',pitfalls:'Testgefahr',continuation:'Testfortsetzung'}, openQuestions:['Testfrage?'] } });
  });
  await page.goto('/');
  await expect(page.locator('#model-status')).toContainText('KI-Zugang konfiguriert');
  await (await reveal(page, page.getByLabel('Dialogmodus'))).selectOption('model');
  await (await reveal(page, page.getByLabel('Deine Nachricht'))).fill('Was könnte Schwarz planen?');
  await (await reveal(page, page.getByRole('button', { name:'Nachricht senden (reale KI)' , includeHidden:true}))).click();
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
  await (await reveal(page, page.getByLabel('Kandidatenzug prüfen (SAN, optional)'))).fill('Qg7#');
  await (await reveal(page, page.getByRole('button',{name:'Taktischen Faktencheck starten', includeHidden:true}))).click();
  await expect(page.locator('#tactical-results')).toContainText('Stockfish 19 Lite');
  await expect(page.locator('#tactical-results')).toContainText('Mattdistanz 1 für Weiß');
  await expect(page.locator('#tactical-results')).toContainText('Tiefe 12 / 20.000 Knoten');
  expect(calls).toBe(1);
  const data = await exportData(page);
  await play(page,'Qg7#');
  await expect(page.locator('#tactical-results')).toBeEmpty();
  await expect(page.getByRole('button',{name:'Taktischen Faktencheck starten', includeHidden:true})).toBeDisabled();
  await importData(page,data);
  await expect(page.locator('#tactical-results')).toContainText('Qg7#');
  expect(calls).toBe(1);
  expect(JSON.parse(data).annotations[0].source).toBe('stockfish');
});

test('Stockfish failure leaves the session unchanged and allows retry', async ({ page }) => {
  await page.route('**/api/tactics',route => route.fulfill({status:503,json:{error:'Unavailable'}}));
  await page.goto('/');
  await (await reveal(page, page.getByRole('button',{name:'Taktischen Faktencheck starten', includeHidden:true}))).click();
  await expect(page.locator('#tactical-feedback')).toContainText('fehlgeschlagen');
  await expect(page.locator('#tactical-results')).toBeEmpty();
  await expect(page.getByRole('button',{name:'Taktischen Faktencheck starten', includeHidden:true})).toBeEnabled();
  expect(JSON.parse(await exportData(page)).annotations).toHaveLength(0);
});

test('API key can be saved locally, stays out of browser storage/export and is removable', async ({page}) => {
  const sentinel='local-ui-test-key-not-a-real-credential';
  let modelCalls=0;
  page.on('request',r => {if(r.url().endsWith('/api/dialogue')) modelCalls++;});
  await page.goto('/');
  await (await reveal(page, page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}))).click();
  await expect(page.getByLabel('OpenAI-API-Schlüssel',{exact:true})).toHaveAttribute('type','password');
  await (await reveal(page, page.getByLabel('OpenAI-API-Schlüssel',{exact:true}))).fill(sentinel);
  await (await reveal(page, page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true, includeHidden:true}))).click();
  await expect(page.locator('#api-feedback')).toContainText('Freigabe für Modellanfragen'); // explicit feedback instead of a silent native form rejection
  await (await reveal(page, page.locator('#api-cost-consent'))).check();
  await (await reveal(page, page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true, includeHidden:true}))).click();
  await expect(page.locator('#api-feedback')).toContainText('Noch keine Modellanfrage');
  await expect(page.getByLabel('OpenAI-API-Schlüssel',{exact:true})).toHaveValue('');
  await expect(page.getByLabel('Dialogmodus')).toHaveValue('model');
  expect(modelCalls).toBe(0);
  const stores=await page.evaluate(() => JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
  expect(stores).not.toContain(sentinel);
  expect(await exportData(page)).not.toContain(sentinel);
  await page.reload();
  await expect(page.locator('#model-status')).toContainText('KI-Zugang konfiguriert');
  await (await reveal(page, page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}))).click();
  await (await reveal(page, page.getByRole('button',{name:'Gespeicherten Schlüssel löschen', includeHidden:true}))).click();
  await expect(page.locator('#api-feedback')).toContainText('Gespeicherter Schlüssel gelöscht');
  await expect(page.locator('#model-status')).toContainText('Kein aktiver KI-Zugang');
  expect(modelCalls).toBe(0);
});

test('diagnosis and cost settings work without exposing credentials or generating text',async({page})=>{
 let calls=0;page.on('request',r=>{if(r.url().endsWith('/api/dialogue'))calls++;});
 await page.goto('/');await (await reveal(page, page.getByRole('button',{name:'Lokale Diagnose anzeigen', includeHidden:true}))).click();
 await expect(page.locator('#diagnostic-output')).toContainText('Node.js');
 await (await reveal(page, page.getByLabel('Budget pro Periode (USD)'))).fill('0.03');
 await (await reveal(page, page.getByRole('button',{name:'Kostenlimit speichern', includeHidden:true}))).click();
 await expect(page.locator('#cost-feedback')).toContainText('lokal gespeichert');
 await page.reload();await expect(page.getByLabel('Budget pro Periode (USD)')).toHaveValue('0.03');
 await (await reveal(page, page.getByRole('button',{name:'Neue Budgetperiode starten', includeHidden:true}))).click();
 await expect(page.locator('#cost-feedback')).toContainText('bestätigen');
 await (await reveal(page, page.getByRole('button',{name:'OpenAI-Zugang prüfen (ohne Textgenerierung)', includeHidden:true}))).click();
 await expect(page.locator('#diagnostic-output')).toContainText('Kein API-Schlüssel');
 expect(calls).toBe(0);
});
test('update UI checks target and requires explicit install consent',async({page})=>{
 let installs=0;
 await page.route('**/api/update',route=>{
  const r=route.request().postDataJSON();if(r.action==='install'){installs++;return route.fulfill({status:400,json:{error:'test failure'}});}
  return route.fulfill({json:{current:'a'.repeat(40),target:'b'.repeat(40),available:true,canInstall:true,dirty:false,branch:'work'}});
 });
 await page.goto('/');await (await reveal(page, page.getByRole('button',{name:'Nach Updates suchen', includeHidden:true}))).click();
 await expect(page.locator('#update-info')).toContainText('bbbbbbb');
 await (await reveal(page, page.getByRole('button',{name:'Update installieren', includeHidden:true}))).click();expect(installs).toBe(0);
 await expect(page.locator('#update-feedback')).toContainText('bestätigen');
 await (await reveal(page, page.locator('#update-consent'))).check();await (await reveal(page, page.getByRole('button',{name:'Update installieren', includeHidden:true}))).click();
 await expect(page.locator('#update-feedback')).toContainText('nicht abgeschlossen');expect(installs).toBe(1);
});

test('real engine learning game pauses for chat, keeps analysis branches and saves comparisons',async({page})=>{
 let engineCalls=0;page.on('request',r=>{if(r.url().endsWith('/api/play'))engineCalls++;});
 await page.goto('/');await (await reveal(page, page.getByLabel('Engine-Spielstärke',{exact:true}))).selectOption('1');
 await (await reveal(page, page.getByRole('button',{name:'Partie starten', includeHidden:true}))).click();
 await play(page,'e4');await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 expect(engineCalls).toBe(1);
 const played=JSON.parse(await exportData(page)),cursor=played.game.cursor;
 await (await reveal(page, page.getByRole('button',{name:'Zum Lernmodus',exact:true, includeHidden:true}))).click();
 await (await reveal(page, page.getByRole('button',{name:'n0 · Ausgangsstellung · Partie',exact:true, includeHidden:true}))).click();await play(page,'d4');
 await (await reveal(page, page.getByLabel('Name der ausgewählten Variante'))).fill('Mein d4-Plan');await (await reveal(page, page.getByRole('button',{name:'Variante benennen', includeHidden:true}))).click();
 await (await reveal(page, page.getByLabel('Variante A',{exact:true}))).selectOption('n1');await (await reveal(page, page.getByLabel('Variante B',{exact:true}))).selectOption('n3');
 await (await reveal(page, page.getByRole('button',{name:'Vergleich anzeigen', includeHidden:true}))).click();await expect(page.locator('#comparison-view')).toContainText('Mein d4-Plan');
 await expect(page.locator('.mini-board')).toHaveCount(2);
 await (await reveal(page, page.getByLabel('Deine Nachricht'))).fill('Was unterscheidet meinen Plan von e4?');
 await (await reveal(page, page.getByRole('button',{name:'Nachricht senden (Simulation)', includeHidden:true}))).click();await expect(page.locator('#dialogue')).toContainText('Was unterscheidet');
 const saved=await exportData(page);expect(JSON.parse(saved).game.cursor).toBe(cursor);expect(engineCalls).toBe(1);
 await page.reload();await importData(page,saved);await expect(page.locator('#game-status')).toContainText('Analysemodus');
 await expect(page.locator('#comparison-view')).toContainText('Mein d4-Plan');
 await (await reveal(page, page.getByRole('button',{name:'Partie fortsetzen', includeHidden:true}))).click();await expect(page.locator('#position-status')).toContainText(cursor);
 expect(engineCalls).toBe(1);
});
test('black-side learning game receives the first real engine move automatically',async({page})=>{
 await page.goto('/');await (await reveal(page, page.getByLabel('Meine Farbe',{exact:true}))).selectOption('b');await (await reveal(page, page.getByLabel('Engine-Spielstärke',{exact:true}))).selectOption('5');
 await (await reveal(page, page.getByRole('button',{name:'Partie starten', includeHidden:true}))).click();await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 await expect(page.locator('#game-status')).toContainText('Du spielst Schwarz');
 await expect(page.locator('#board button').first()).toHaveAttribute('aria-label','h1: Weiß Turm');
 await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
});
test('engine error pauses the learning game without an automatic retry loop',async({page})=>{
 let calls=0;await page.route('**/api/play',route=>{calls++;return route.fulfill({status:503,json:{error:'test'}});});
 await page.goto('/');await (await reveal(page, page.getByRole('button',{name:'Partie starten', includeHidden:true}))).click();await play(page,'e4');
 await expect(page.locator('#game-status')).toContainText('Analysemodus');await expect(page.locator('#game-feedback')).toContainText('fehlgeschlagen');
 expect(calls).toBe(1);expect(JSON.parse(await exportData(page)).nodes).toHaveLength(2);
});

test('learner can save their thoughts and choose guiding questions without spoilers',async({page})=>{
 await page.goto('/');await (await reveal(page, page.getByText('Meine Gedanken und Lernwünsche (optional)',{exact:true}))).click();
 await (await reveal(page, page.getByLabel('Meine eigene Planidee',{exact:true}))).fill('Zentrum kontrollieren');
 await (await reveal(page, page.getByLabel('Warum halte ich das für sinnvoll?',{exact:true}))).fill('Aktivere Figuren');
 await (await reveal(page, page.getByLabel('Was möchte ich verstehen oder üben?',{exact:true}))).fill('Gegenpläne erkennen');
 await (await reveal(page, page.getByLabel('Wie viel Hilfe möchte ich?',{exact:true}))).selectOption('question');
 await (await reveal(page, page.getByRole('button',{name:'Gedankengang an dieser Stellung speichern', includeHidden:true}))).click();
 await (await reveal(page, page.getByLabel('Deine Nachricht'))).fill('Wo soll ich anfangen?');await (await reveal(page, page.getByRole('button',{name:'Nachricht senden (Simulation)', includeHidden:true}))).click();
 await expect(page.locator('#dialogue')).toContainText('Leitfrage:');await expect(page.locator('#dialogue')).not.toContainText('Kandidaten (ungeordnet)');
 const data=await exportData(page);expect(JSON.parse(data).reflections.n0.idea).toBe('Zentrum kontrollieren');
 await page.reload();await importData(page,data);await (await reveal(page, page.getByText('Meine Gedanken und Lernwünsche (optional)',{exact:true}))).click();
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
  await (await reveal(page, page.getByRole('button',{name:'e2: Weiß Bauer',exact:true, includeHidden:true}))).tap();await (await reveal(page, page.getByRole('button',{name:'e4: leer',exact:true, includeHidden:true}))).tap();await expect(page.locator('#position-status')).toContainText('n1');
  await (await reveal(page, page.getByText('Meine Gedanken und Lernwünsche (optional)',{exact:true}))).tap();await (await reveal(page, page.getByLabel('Meine eigene Planidee',{exact:true}))).fill('Mein Plan');
  await (await reveal(page, page.getByRole('button',{name:'Gedankengang an dieser Stellung speichern', includeHidden:true}))).tap();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
 }
});

test('learning dialogue integrates engine game, actual model-service transport and follow-up conversation',async({page})=>{
 const {ModelService}=await import('../server/model.js');let calls=0;
 const fixture={message:'Als Lernbeispiel greifen wir deine Zentrumsidee auf.',plan:'Zentrum',opponent:'Möglicher Gegenstoß',candidates:[],risks:'Ungedeckte Figuren',playability:'Klare nächste Schritte',assessment:{verdict:'unclear' as const,reason:'Testeinschätzung: keine geprüfte Gesamtbewertung.',dangers:[]},humanFactors:{idea:'Deine Begründung prüfen',calculation:'Zwingende Antworten',pitfalls:'Gegenstoß',continuation:'Figuren verbessern'},openQuestions:['Was möchtest du mit deinem Plan verhindern?']};
 const service=new ModelService({enabled:true,apiKey:'local-integration-test-key',model:'fixture'},(async(_url,init)=>{
  calls++;const body=JSON.parse(init!.body as string);if(calls===2){expect(body.messages.map((m:{role:string})=>m.role)).toEqual(['system','user','assistant','user']);expect(body.messages[2].content).toContain('Zentrumsidee');}
  if(calls===3){const current=JSON.parse(body.messages.at(-1).content);expect(current.topic).toBe('review');expect(current.history.moves).toHaveLength(2);}
  const current=JSON.parse(body.messages.at(-1).content);
  const retrospective=calls===3?{gameReview:{summary:'Test-Rückblick auf die beiden tatsächlichen Züge.',moments:current.history.moves.map((played:string,index:number)=>({ply:index+1,played,explanation:'Testbeleg zur tatsächlichen Zentrumsbesetzung.',alternative:'',reason:'Keine Alternative in dieser Transportfixture berechnet.'})),lesson:'Zentrumsbesetzung und Entwicklung gemeinsam betrachten.'}}:{};
  return new Response(JSON.stringify({usage:{prompt_tokens:200,completion_tokens:100},choices:[{finish_reason:'stop',message:{content:JSON.stringify({...fixture,...retrospective,message:calls===1?fixture.message:'Als zweite Testantwort betrachten wir deinen Gegenplan.'})}}]}));
 }) as typeof fetch);
 await page.route('**/api/status',route=>route.fulfill({json:service.status()}));
 await page.route('**/api/dialogue',async route=>{const result=await service.reply(route.request().postDataJSON());await route.fulfill({json:result});});
 await page.goto('/');await (await reveal(page, page.getByLabel('Engine-Spielstärke',{exact:true}))).selectOption('1');await (await reveal(page, page.getByRole('button',{name:'Partie starten', includeHidden:true}))).click();await play(page,'e4');await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 const cursor=JSON.parse(await exportData(page)).game.cursor;
 await (await reveal(page, page.getByLabel('Dialogmodus'))).selectOption('model');await (await reveal(page, page.getByRole('button',{name:'Lerngespräch vorbereiten', includeHidden:true}))).click();expect(calls).toBe(0);
 await (await reveal(page, page.getByLabel('Deine Nachricht'))).fill('Meine Idee ist Zentrumskontrolle. Warum ist das sinnvoll?');await (await reveal(page, page.getByRole('button',{name:'Nachricht senden (reale KI)', includeHidden:true}))).click();
 await expect(page.locator('#dialogue')).toContainText('Zentrumsidee');await expect(page.locator('#game-status')).toContainText('Analysemodus');
 await (await reveal(page, page.getByRole('button',{name:'Rückfrage aufgreifen: Was möchtest du mit deinem Plan verhindern?', includeHidden:true}))).click();expect(calls).toBe(1);
 await (await reveal(page, page.getByRole('button',{name:'Nachricht senden (reale KI)', includeHidden:true}))).click();await expect(page.locator('#dialogue')).toContainText('zweite Testantwort');expect(calls).toBe(2);
 await (await reveal(page, page.getByRole('button',{name:'n0 · Ausgangsstellung · Partie',exact:true, includeHidden:true}))).click();await play(page,'d4');
 await (await reveal(page, page.getByRole('button',{name:'Partie besprechen',exact:true,includeHidden:true}))).click();
 await expect(page.locator('#position-status')).toContainText(cursor);await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');expect(calls).toBe(3);
 const saved=JSON.parse(await exportData(page));expect(saved.game.cursor).toBe(cursor);expect(saved.annotations.filter((a:{source:string})=>a.source==='model')).toHaveLength(3);
});


async function dragPiece(page: Page, from: string, to: string) {
  await (await reveal(page, page.locator('#board'))).scrollIntoViewIfNeeded();
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
  await (await reveal(page, page.getByRole('button',{name:'n0 · Ausgangsstellung',exact:true, includeHidden:true}))).click();
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
 await (await reveal(page, page.getByLabel('Bauernumwandlung'))).selectOption('n');await dragPiece(page,'a7','a8');
 await expect(page.locator('#board [data-square="a8"]')).toHaveAttribute('aria-label','a8: Weiß Springer');
 const capture=new Session();for(const m of ['e4','d5'])capture.play(m);
 await importData(page,capture.export());await dragPiece(page,'e4','d5');
 await expect(page.locator('#board [data-square="d5"]')).toHaveAttribute('aria-label','d5: Weiß Bauer');
});

test('dragging plays against real Stockfish and works on the flipped black board',async({page})=>{
 await page.goto('/');await (await reveal(page, page.getByLabel('Engine-Spielstärke',{exact:true}))).selectOption('1');
 await (await reveal(page, page.getByRole('button',{name:'Partie starten', includeHidden:true}))).click();
 await dragPiece(page,'e2','e4');await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 const first=JSON.parse(await exportData(page));expect(first.game.cursor).toBe('n2');expect(first.nodes).toHaveLength(3);
 await page.reload();await (await reveal(page, page.getByLabel('Meine Farbe',{exact:true}))).selectOption('b');
 await (await reveal(page, page.getByRole('button',{name:'Partie starten', includeHidden:true}))).click();
 await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 await dragPiece(page,'e7','e5');await expect(page.locator('#position-status')).toContainText('n3 · Schwarz');
 expect(JSON.parse(await exportData(page)).nodes).toHaveLength(4);
});

test('Escape and pointer cancellation abort dragging without a move',async({page})=>{
 await page.goto('/');
 const cell=page.locator('#board [data-square="e2"]');await (await reveal(page, page.locator('#board'))).scrollIntoViewIfNeeded();const box=await cell.boundingBox();
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
  await (await reveal(page, page.locator('#board'))).scrollIntoViewIfNeeded();
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
  await (await reveal(page, page.locator('#board'))).scrollIntoViewIfNeeded();
  await (await reveal(page, page.getByRole('button',{name:'e2: Weiß Bauer',exact:true, includeHidden:true}))).tap();
  await expect(page.locator('#board [data-square="e4"]')).toHaveClass(/target/);
  await (await reveal(page, page.getByRole('button',{name:'e4: leer',exact:true, includeHidden:true}))).tap();
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
  await page.goto('/');await (await reveal(page, page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}))).tap();
  await (await reveal(page, page.getByLabel('OpenAI-API-Schlüssel',{exact:true}))).fill('touch-save-test-key-not-real');
  await (await reveal(page, page.locator('#api-cost-consent'))).check();
  await (await reveal(page, page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true, includeHidden:true}))).tap();
  await expect(page.locator('#api-feedback')).toContainText('wird lokal gespeichert');
  await expect(page.locator('#api-feedback')).toBeInViewport();
  await expect(page.locator('#api-key')).toHaveValue('touch-save-test-key-not-real');
  expect(await page.evaluate(()=>document.activeElement?.id)).toBe('api-feedback');
  await fingerScroll(page,'down');
  release();await expect(page.locator('#api-feedback')).toContainText('nicht erneut eingeben');
  await expect(page.locator('#credential-status')).toContainText('lokal gespeichert');
  await expect(page.locator('#api-connect')).toBeEnabled();
  await fingerScroll(page,'up');
  await page.reload();await expect(page.locator('#credential-status')).toContainText('lokal gespeichert');
  await (await reveal(page, page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}))).tap();
  await expect(page.locator('#api-key')).toHaveValue('');
  await (await reveal(page, page.getByRole('button',{name:'Gespeicherten Schlüssel löschen', includeHidden:true}))).tap();
  await expect(page.locator('#credential-status')).toContainText('Kein API-Schlüssel');
  expect(errors).toEqual([]);await context.close();
 }
});

test('failed key save stays scrollable and never claims success',async({browser})=>{
 const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.route('**/api/model-config',route=>route.fulfill({status:500,json:{error:'Interner Fehler.'}}));
 await page.goto('/');await (await reveal(page, page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}))).tap();
 await (await reveal(page, page.getByLabel('OpenAI-API-Schlüssel',{exact:true}))).fill('failed-save-test-key-not-real');
 await (await reveal(page, page.locator('#api-cost-consent'))).check();
 await (await reveal(page, page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true, includeHidden:true}))).tap();
 await expect(page.locator('#api-feedback')).toContainText('Speicherung ist nicht bestätigt');
 await expect(page.locator('#credential-status')).toContainText('Kein API-Schlüssel');
 await expect(page.locator('#api-key')).toHaveValue('failed-save-test-key-not-real');
 await expect(page.locator('#api-connect')).toBeEnabled();
 await fingerScroll(page,'down');await fingerScroll(page,'up');
 await context.close();
});


test('visible UI version matches the running server and local diagnosis',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#app-version')).toHaveText(`Version ${APP_VERSION}`);
 await expect(page).toHaveTitle(`AI-Chess-Studio ${APP_VERSION}`);
 const diagnostic=await (await page.request.get('/api/diagnostics')).json();
 expect(diagnostic.version).toBe(APP_VERSION);
 await (await reveal(page, page.getByRole('button',{name:'Lokale Diagnose anzeigen', includeHidden:true}))).click();
 await expect(page.locator('#diagnostic-output')).toContainText(`App-Version: ${APP_VERSION} · Oberfläche: ${APP_VERSION}`);
});

test('fixed scroll help moves a page even when native scroll gestures are cancelled and exports text-free diagnosis',async({page})=>{
 await page.goto('/');
 // Simulate the reported failure; this is not proof of its cause on Windows.
 await page.evaluate(()=>{
  document.addEventListener('wheel',e=>e.preventDefault(),{passive:false});
  document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
  document.addEventListener('keydown',e=>{if(e.key==='PageDown')e.preventDefault();});
 });
 const top=await page.evaluate(()=>scrollY);
 await page.mouse.wheel(0,500);await page.keyboard.press('PageDown');
 expect(await page.evaluate(()=>scrollY)).toBe(top);
 await (await reveal(page, page.getByRole('button',{name:'↓ Runter',exact:true, includeHidden:true}))).click();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(top+100);
 await (await reveal(page, page.getByRole('button',{name:'↑ Hoch',exact:true, includeHidden:true}))).click();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(top);
 await (await reveal(page, page.getByRole('button',{name:'Bedienung prüfen',exact:true, includeHidden:true}))).click();
 const panel=page.getByRole('region',{name:'Bedienungsdiagnose', includeHidden:true});
 await expect(panel).toBeVisible();
 await expect(panel.getByRole('button',{name:'Diagnose als Text speichern', includeHidden:true})).toBeInViewport();
 await expect(panel.getByRole('button',{name:'Schließen',exact:true, includeHidden:true})).toBeInViewport();
 await expect.poll(async()=>JSON.parse(await panel.locator('pre').innerText()).serverVersion).toBe(APP_VERSION);
 const observation=JSON.parse(await panel.locator('pre').innerText());
 expect(observation.appVersion).toBe(APP_VERSION);
 expect(observation.page.height).toBeGreaterThan(observation.page.visible);
 expect(observation.recentEvents.some((e:{type:string;prevented:boolean})=>e.type==='wheel'&&e.prevented)).toBe(true);
 const download=page.waitForEvent('download');
 await (await reveal(page, panel.getByRole('button',{name:'Diagnose als Text speichern', includeHidden:true}))).click();
 expect((await download).suggestedFilename()).toBe(`AI-Chess-Studio-${APP_VERSION}-Bedienungsdiagnose.txt`);
 await (await reveal(page, panel.getByRole('button',{name:'Schließen',exact:true, includeHidden:true}))).click();await expect(panel).toBeHidden();
});

test('scroll help remains touch accessible after key entry and diagnosis excludes all input values',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true});
 const page=await context.newPage();await page.goto('/');
 await (await reveal(page, page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}))).tap();
 await (await reveal(page, page.locator('#api-key'))).fill('private-input-sentinel-not-a-real-key');
 await (await reveal(page, page.locator('#api-model'))).fill('private-model-sentinel');
 await (await reveal(page, page.getByRole('button',{name:'↓ Runter',exact:true, includeHidden:true}))).tap();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
 await (await reveal(page, page.getByRole('button',{name:'Bedienung prüfen',exact:true, includeHidden:true}))).tap();
 const panel=page.getByRole('region',{name:'Bedienungsdiagnose', includeHidden:true});
 const report=await panel.locator('pre').innerText();
 expect(report).not.toContain('private-input-sentinel');expect(report).not.toContain('private-model-sentinel');
 expect(JSON.parse(report).appVersion).toBe(APP_VERSION);
 await context.close();
});

test('dragging ordinary text pans the page instead of selecting it after saving a key',async({page})=>{
 await page.goto('/');
 await (await reveal(page, page.getByText('Eigenen API-Schlüssel eingeben',{exact:true}))).click();
 await (await reveal(page, page.locator('#api-key'))).fill('page-pan-test-key-not-real');
 await (await reveal(page, page.locator('#api-cost-consent'))).check();
 await (await reveal(page, page.getByRole('button',{name:'Schlüssel lokal speichern und KI aktivieren',exact:true, includeHidden:true}))).click();
 await expect(page.locator('#api-feedback')).toContainText('nicht erneut eingeben');
 await (await reveal(page, page.locator('#api-feedback'))).scrollIntoViewIfNeeded();
 const box=await page.locator('#api-feedback').boundingBox();
 const before=await page.evaluate(()=>scrollY);
 const x=box!.x+30,y=box!.y+Math.min(20,box!.height/2);
 await page.mouse.move(x,y);await page.mouse.down();
 await page.mouse.move(x,y-120,{steps:10});await page.mouse.up();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+80);
 expect(await page.evaluate(()=>getSelection()?.toString())).toBe('');
 await expect(page.locator('body')).not.toHaveClass(/page-panning/);
 const middle=await page.evaluate(()=>scrollY);
 // Drag blank page background down to move back up, without selecting text.
 await page.mouse.move(5,200);await page.mouse.down();await page.mouse.move(5,320,{steps:10});await page.mouse.up();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(middle-80);
 await (await reveal(page, page.getByRole('button',{name:'Gespeicherten Schlüssel löschen', includeHidden:true}))).click();
});

test('page panning preserves editable selection, links, board gestures and Escape cancellation',async({page})=>{
 await page.goto('/');
 await (await reveal(page, page.getByLabel('Zug (SAN)',{exact:true}))).fill('Nf3');
 await (await reveal(page, page.getByLabel('Zug (SAN)',{exact:true}))).selectText();
 expect(await page.locator('#move').evaluate((element:HTMLInputElement)=>element.selectionEnd!-element.selectionStart!)).toBe(3);
 await (await reveal(page, page.getByRole('button',{name:'Zug spielen',exact:true, includeHidden:true}))).click();
 await expect(page.locator('#position-status')).toContainText('n1');
 await (await reveal(page, page.locator('#board'))).scrollIntoViewIfNeeded();
 const before=await page.evaluate(()=>scrollY);
 await page.mouse.move(5,300);await page.mouse.down();await page.mouse.move(5,200,{steps:5});
 await expect(page.locator('body')).toHaveClass(/page-panning/);
 await page.keyboard.press('Escape');
 const stopped=await page.evaluate(()=>scrollY);
 expect(stopped).toBeGreaterThan(before);
 await page.mouse.move(5,100,{steps:5});await page.mouse.up();
 expect(await page.evaluate(()=>scrollY)).toBe(stopped);
 await expect(page.locator('body')).not.toHaveClass(/page-panning/);
});

test('tabs keep the same board, position and learning draft without starting any model request',async({page})=>{
 let modelCalls=0;page.on('request',request=>{if(request.url().endsWith('/api/dialogue'))modelCalls++;});
 await page.goto('/');
 await expect(page.getByRole('tab')).toHaveCount(2);
 await expect(page.getByRole('tab',{name:'Spielmodus',exact:true})).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:'e2: Weiß Bauer',exact:true}).click();
 await page.getByRole('button',{name:'e4: leer',exact:true}).click();
 const board=await page.locator('#board').elementHandle();
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await expect(page.getByRole('tabpanel',{name:'Lernmodus',exact:true})).toBeVisible();
 await expect(page.getByRole('tabpanel',{name:'Spielmodus',exact:true})).toBeHidden();
 await page.getByLabel('Deine Nachricht').fill('Mein eigener Zentrumsgedanke');
 await openView(page,'variants');
 await expect(page.locator('#variations')).toBeVisible();
 await expect(page.locator('#position-status')).toContainText('n1');
 expect(await board!.evaluate(element=>element===document.getElementById('board'))).toBe(true);
 await openView(page,'settings');
 await expect(page.locator('#board-area')).toBeHidden();
 await expect(page.locator('#credential-status')).toBeVisible();
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await expect(page.getByLabel('Deine Nachricht')).toHaveValue('Mein eigener Zentrumsgedanke');
 await expect(page.locator('#board-area')).toBeVisible();expect(modelCalls).toBe(0);
 await page.getByRole('button',{name:'Neue Partie',exact:true}).click();
 await expect(page.getByRole('tab',{name:'Spielmodus',exact:true})).toHaveAttribute('aria-selected','true');
 await expect(page.locator('#game-feedback')).toContainText('Neue Partie gestartet');await expect(page.locator('#position-status')).toContainText('n0');
 expect(modelCalls).toBe(0);
});

test('tabs support keyboard navigation, direct links and browser back',async({page})=>{
 await page.goto('/#partie');
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).focus();
 await page.keyboard.press('ArrowRight');
 await expect(page.getByRole('tab',{name:'Lernmodus',exact:true})).toBeFocused();
 await expect(page.getByRole('tab',{name:'Lernmodus',exact:true})).toHaveAttribute('aria-selected','true');
 await page.keyboard.press('Home');await expect(page.getByRole('tab',{name:'Spielmodus',exact:true})).toBeFocused();await openView(page,'settings');
 await page.reload();await expect(page.locator('#panel-settings')).toBeVisible();
 await openView(page,'variants');await page.goBack();
 await expect(page.locator('#panel-settings')).toBeVisible();
});

test('two modes and their tools fit phone, iPad and desktop and touch navigation stays visible',async({browser})=>{
 for(const viewport of [{width:390,height:844},{width:820,height:1180},{width:1440,height:900}]){
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<1000});
  const page=await context.newPage();await page.goto('/');
  for(const name of ['Spielmodus','Lernmodus','Varianten','Einstellungen']){
   await openView(page,name);await expect(page.locator('#board-area')).toBeVisible({visible:name!=='Einstellungen'});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.getByRole('tab',{name:'Spielmodus',exact:true}).tap();
  await page.getByRole('button',{name:'e2: Weiß Bauer',exact:true}).tap();
  await page.getByRole('button',{name:'e4: leer',exact:true}).tap();
  await expect(page.locator('#position-status')).toContainText('n1');
  if(viewport.width<1000){await (await reveal(page,page.getByRole('button',{name:'↓ Runter',exact:true,includeHidden:true}))).tap();await expect(page.getByRole('tab',{name:'Lernmodus',exact:true})).toBeInViewport();}
  await context.close();
 }
});

async function openReviewImport(page:Page,pgn=REVIEW_PGN,color='auto'){
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await reveal(page,page.locator('#review-import > summary'));
 const details=page.locator('#review-import');
 if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();
 await page.getByLabel('PGN der gespielten Partie',{exact:true}).fill(pgn);
 await page.getByLabel('Meine Farbe in der importierten Partie',{exact:true}).selectOption(color);
}

test('guided PGN review starts black below, conceals future moves, saves own evidence and branches without mutating the original',async({page})=>{
 let calls=0;page.on('request',r=>{if(/\/api\/(play|tactics|dialogue)$/.test(r.url()))calls++;});
 await page.goto('/');await openReviewImport(page);
 await page.getByRole('button',{name:'Partie zum Verstehen öffnen',exact:true}).click();
 await expect(page.getByRole('region',{name:'Partie verstehen',exact:true})).toBeVisible();
 await expect(page.locator('#board button').first()).toHaveAttribute('aria-label','h1: Weiß Turm');
 await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
 await expect(page.locator('#review-time')).toContainText('20 Sekunden');
 await expect(page.locator('#review-played')).toBeHidden();
 await expect(page.locator('#pgn-input')).toHaveValue('');
 await expect(page.locator('#variations')).not.toContainText('Nc6');
 expect(await page.locator('#compare-a option').allTextContents()).not.toContain('n4 · Nc6');
 await expect(page.locator('#ask')).toBeDisabled();expect(calls).toBe(0);
 await page.locator('#review-answer').fill('Ich wollte das Zentrum kontrollieren.');
 await page.getByRole('button',{name:'Gedanken festhalten',exact:true}).click();
 await expect(page.locator('#review-played')).toContainText('1... e5');
 await expect(page.locator('#review-question')).toContainText('Welche Antwort');
 await expect(page.locator('#review-comment-output img')).toHaveCount(0);
 await page.getByRole('button',{name:'Weiß ich nicht mehr',exact:true}).click();
 await expect(page.locator('#review-answers')).toContainText('Weiß ich nicht mehr');
 await expect(page.locator('#ask')).toBeEnabled();expect(calls).toBe(0);
 await play(page,'c5'); // Independent alternative at the pre-move position.
 const data=JSON.parse(await exportData(page));
 const branch=data.activeNodeId;expect(data.review.original).toHaveLength(9);expect(data.game).toBeUndefined();
 expect(data.nodes[2].san).toBe('e5');expect(data.nodes.find((n:{id:string})=>n.id===branch).san).toBe('c5');
 await (await reveal(page,page.getByLabel('Variante A',{exact:true}))).selectOption('n2');
 await (await reveal(page,page.getByLabel('Variante B',{exact:true}))).selectOption(branch);
 await page.getByRole('button',{name:'Vergleich anzeigen',exact:true}).click();
 await expect(page.locator('.mini-board').first().locator('span').first()).toHaveAttribute('data-square','h1');
 await page.getByRole('button',{name:'Brett drehen',exact:true}).click();
 await expect(page.locator('.mini-board').first().locator('span').first()).toHaveAttribute('data-square','a8');
 const saved=await exportData(page);await page.reload();await importData(page,saved);
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await expect(page.locator('#review-answers')).toContainText('Zentrum kontrollieren');
 await expect(page.locator('#board button').first()).toHaveAttribute('aria-label','a8: Schwarz Turm');
 await page.getByLabel('Eigene Entscheidung auswählen',{exact:true}).selectOption('3');
 await expect(page.locator('#review-played')).toBeHidden();
 await expect(page.locator('#review-comment-output')).toHaveText('');
 await expect(page.locator('#variations')).not.toContainText('Nc6');
 await expect(page.locator('#ask')).toBeDisabled();expect(calls).toBe(0);
 await page.locator('#review-answer').fill('Entwicklung ermöglichen');
 await page.getByRole('button',{name:'Gedanken festhalten',exact:true}).click();
 await page.getByRole('button',{name:'Eigene Lernzusammenfassung',exact:true}).click();
 await expect(page.locator('#review-summary')).toContainText('Entwicklung ermöglichen');
 await expect(page.locator('#review-summary')).toContainText('keine Bewertung deiner Persönlichkeit');
});

test('PGN file import and failed/replacement imports preserve the existing session until explicit valid import',async({page})=>{
 let calls=0;page.on('request',r=>{if(/\/api\/(play|tactics|dialogue)$/.test(r.url()))calls++;});
 await page.goto('/');await play(page,'d4');await openReviewImport(page,'1. e5 *','b');
 await page.locator('#review-replace').check();
 await page.getByRole('button',{name:'Partie zum Verstehen öffnen',exact:true}).click();
 await expect(page.locator('#review-feedback')).toContainText('PGN konnte nicht gelesen');
 await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');
 await page.locator('#review-replace').uncheck();
 await page.getByLabel('PGN-Datei einlesen',{exact:true}).setInputFiles({name:'menschliche-partie.pgn',mimeType:'application/x-chess-pgn',buffer:Buffer.from(REVIEW_PGN)});
 await expect(page.locator('#pgn-input')).toHaveValue(REVIEW_PGN);
 await page.getByLabel('Meine Farbe in der importierten Partie',{exact:true}).selectOption('auto');
 await page.getByRole('button',{name:'Partie zum Verstehen öffnen',exact:true}).click();
 await expect(page.locator('#review-feedback')).toContainText('Sitzungswechsel bestätigen');
 await expect(page.locator('#review-panel')).toBeHidden();
 await page.locator('#review-replace').check();await page.getByRole('button',{name:'Partie zum Verstehen öffnen',exact:true}).click();
 await expect(page.locator('#review-panel')).toBeVisible();expect(calls).toBe(0);
});

test('historical repetition stays visible and prevents isolated automatic engine interpretation',async({page})=>{
 let calls=0;page.on('request',r=>{if(/\/api\/(play|tactics|dialogue)$/.test(r.url()))calls++;});
 await page.goto('/');await openReviewImport(page,REPETITION_PGN,'w');
 await page.getByRole('button',{name:'Partie zum Verstehen öffnen',exact:true}).click();
 await page.getByLabel('Eigene Entscheidung auswählen',{exact:true}).selectOption('8');
 await expect(page.locator('#position-status')).toContainText('3-fache Wiederholung');
 await expect(page.locator('#position-status')).toContainText('Remisanspruch möglich');
 await page.getByRole('button',{name:'Gespielten Zug ausdrücklich aufdecken',exact:true}).click();
 await expect(page.locator('#tactical-check')).toBeDisabled();
 await page.getByRole('button',{name:'Originalpartie vollständig ansehen',exact:true}).click();
 await (await reveal(page,page.getByRole('button',{name:'n16 · Ng8 · Original',exact:true,includeHidden:true}))).click();
 await expect(page.locator('#position-status')).toContainText('5-fache Wiederholung');
 await expect(page.locator('#position-status')).toContainText('automatisches Remis');expect(calls).toBe(0);
});

test('imported black perspective and turn controls work on phone and iPad without hidden spoilers',async({browser})=>{
 for(const viewport of [{width:390,height:844},{width:820,height:1180}]){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});const page=await context.newPage();
  await page.goto('/');await openReviewImport(page);
  await page.getByRole('button',{name:'Partie zum Verstehen öffnen',exact:true}).tap();
  for(const name of ['Spielmodus','Lernmodus','Varianten']){
   await openView(page,name);
   await expect(page.locator('#board button').first()).toHaveAttribute('aria-label','h1: Weiß Turm');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.getByRole('button',{name:'Brett drehen',exact:true}).tap();
  await expect(page.locator('#board button').first()).toHaveAttribute('aria-label','a8: Schwarz Turm');
  await page.getByRole('tab',{name:'Lernmodus',exact:true}).tap();
  await expect(page.locator('#review-played')).toBeHidden();await context.close();
 }
});

test('real Stockfish browser worker plays all five levels without a desktop engine API',async({browser})=>{
 let apiCalls=0;const errors:string[]=[];
 for(const level of ['1','2','3','4','5']){
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',r=>{if(r.url().endsWith('/api/play'))apiCalls++;});
  await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'Backend deliberately unavailable'}}));
  await page.goto('/');
  expect(await page.evaluate(()=>crossOriginIsolated)).toBe(false);
  await expect(page.getByLabel('Spielengine',{exact:true})).toHaveValue('browser');await expect(page.locator('#engine-options')).toBeHidden();
  await page.getByLabel('Engine-Spielstärke',{exact:true}).selectOption(level);
  await page.getByRole('button',{name:'Partie starten',exact:true}).click();await play(page,'e4');
  await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
  const data=JSON.parse(await exportData(page));expect(data.nodes).toHaveLength(3);expect(data.game.engine).toBe('browser');expect(data.game.level).toBe(Number(level));
  await context.close();
 }
 expect(apiCalls).toBe(0);expect(errors).toEqual([]);
});

test('real browser engine starts as Black at phone and iPad sizes and survives session export/import',async({browser})=>{
 for(const viewport of [{width:390,height:844},{width:820,height:1180}]){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});const page=await context.newPage();
  let calls=0;page.on('request',r=>{if(r.url().endsWith('/api/play'))calls++;});
  await page.goto('/');await (await reveal(page,page.getByLabel('Spielengine',{exact:true}))).selectOption('browser');
  await page.getByLabel('Meine Farbe',{exact:true}).selectOption('b');
  await page.getByRole('button',{name:'Partie starten',exact:true}).tap();
  await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
  await expect(page.locator('#board button').first()).toHaveAttribute('aria-label','h1: Weiß Turm');
  const data=await exportData(page);await page.reload();await importData(page,data);
  await expect(page.getByLabel('Spielengine',{exact:true})).toHaveValue('browser');
  await expect(page.locator('#game-status')).toContainText('Partie läuft');expect(calls).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
 }
});

test('pausing a loading browser worker cancels it and explicit resume creates a fresh real worker',async({page})=>{
 let release!:()=>void;const ready=new Promise<void>(resolve=>{release=resolve;});let requests=0;
 await page.route('**/engine/stockfish-19.0.1/stockfish-19-lite-single.js',async route=>{
  requests++;await ready;try{await route.continue();}catch{}
 });
 await page.goto('/');await (await reveal(page,page.getByLabel('Spielengine',{exact:true}))).selectOption('browser');
 await page.getByLabel('Meine Farbe',{exact:true}).selectOption('b');
 await page.getByRole('button',{name:'Partie starten',exact:true}).click();
 await expect.poll(()=>requests).toBe(1);
 await page.getByRole('button',{name:'Zum Lernmodus',exact:true}).click();
 await expect(page.locator('#game-status')).toContainText('Analysemodus');
 expect(JSON.parse(await exportData(page)).nodes).toHaveLength(1);
 release();await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
 await expect(page.locator('#game-feedback')).toContainText('Stockfish hat gezogen');
 expect(requests).toBe(2);expect(JSON.parse(await exportData(page)).nodes).toHaveLength(2);
});

test('browser engine load failure pauses without automatic retry or server fallback',async({page})=>{
 let apiCalls=0,wasmRequests=0;page.on('request',r=>{if(r.url().endsWith('/api/play'))apiCalls++;});
 await page.route('**/engine/stockfish-19.0.1/*.wasm',route=>{wasmRequests++;return route.fulfill({status:503,body:'Unavailable'});});
 await page.goto('/');await (await reveal(page,page.getByLabel('Spielengine',{exact:true}))).selectOption('browser');
 await page.getByLabel('Meine Farbe',{exact:true}).selectOption('b');
 await page.getByRole('button',{name:'Partie starten',exact:true}).click();
 await expect(page.locator('#game-status')).toContainText('Analysemodus',{timeout:10000});
 await expect(page.locator('#game-feedback')).toContainText('Browser-Spielengine');
 expect(wasmRequests).toBe(1);expect(apiCalls).toBe(0);
 expect(JSON.parse(await exportData(page)).nodes).toHaveLength(1);
});

test('browser engine is never allocated by tab changes or guided PGN import',async({page})=>{
 let workers=0;page.on('worker',()=>workers++);
 await page.goto('/');await (await reveal(page,page.getByLabel('Spielengine',{exact:true}))).selectOption('browser');
 for(const name of ['Lernmodus','Varianten','Einstellungen','Spielmodus'])await openView(page,name);
 await openReviewImport(page);await page.getByRole('button',{name:'Partie zum Verstehen öffnen',exact:true}).click();
 await expect(page.locator('#review-panel')).toBeVisible();expect(workers).toBe(0);
});
