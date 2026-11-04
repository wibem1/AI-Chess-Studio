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
  await page.getByLabel('Deine Planfrage').fill('Wie kontrolliere ich das Zentrum?');
  await page.getByRole('button', { name: 'Plan diskutieren (Simulation)' }).click();
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
  await page.getByLabel('Deine Planfrage').fill('Plan der Ausgangsstellung?');
  await page.getByRole('button', { name: 'Plan diskutieren (Simulation)' }).click();
  await play(page, 'e4');
  await expect(page.locator('#dialogue-feedback')).toContainText('angefragten Stellung gespeichert');
  await expect(page.locator('#dialogue')).toBeEmpty();
  await page.getByRole('button', { name: 'n0 · Ausgangsstellung', exact: true }).click();
  await expect(page.locator('#dialogue')).toContainText('Plan der Ausgangsstellung?');
  const data = await exportData(page);
  await page.getByRole('button', { name: 'Plan diskutieren (Simulation)' }).click();
  await importData(page, data);
  await expect(page.locator('#dialogue-feedback')).toContainText('Veraltete Antwort');
  expect(await exportData(page)).toBe(data);
});

test('invalid replies and failures show errors, permit retry and never mutate dialogue', async ({ page }) => {
  await page.goto('/'); await simulation(page, 'invalid');
  await page.getByLabel('Deine Planfrage').fill('Plan?');
  await page.getByRole('button', { name: 'Plan diskutieren (Simulation)' }).click();
  await expect(page.locator('#dialogue-feedback')).toContainText('Ungültige Simulationsantwort');
  await expect(page.locator('#dialogue')).toBeEmpty();
  await page.getByLabel('Testverhalten').selectOption('failure');
  await page.getByRole('button', { name: 'Plan diskutieren (Simulation)' }).click();
  await expect(page.locator('#dialogue-feedback')).toContainText('Simulierter Anfragefehler');
  await expect(page.locator('#dialogue')).toBeEmpty();
  await page.getByLabel('Testverhalten').selectOption('normal');
  await page.getByRole('button', { name: 'Plan diskutieren (Simulation)' }).click();
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
  await expect(page.getByRole('button', { name:'Plan diskutieren (reale KI)' })).toBeDisabled();
  await page.getByLabel('Dialogmodus').selectOption('simulation');
  await page.getByLabel('Deine Planfrage').fill('Plan?');
  await page.getByRole('button', { name:'Plan diskutieren (Simulation)' }).click();
  await expect(page.locator('#dialogue')).toContainText('Simulation · Keine reale KI');
});

test('local model API fixture exercises UI transport and provenance without any provider call', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json:{ available:true, remaining:3 } }));
  let received: Record<string, unknown> | undefined;
  await page.route('**/api/dialogue', route => {
    received = route.request().postDataJSON();
    return route.fulfill({ json:{ plan:'Lokale Modell-Testantwort', opponent:'Hypothese: Zentrum angreifen', candidates:['e4'],
      risks:'Test-Risiko', playability:'Test-Spielbarkeit', openQuestions:['Testfrage?'] } });
  });
  await page.goto('/');
  await expect(page.locator('#model-status')).toContainText('KI-Zugang konfiguriert');
  await page.getByLabel('Dialogmodus').selectOption('model');
  await page.getByLabel('Deine Planfrage').fill('Was könnte Schwarz planen?');
  await page.getByRole('button', { name:'Plan diskutieren (reale KI)' }).click();
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
