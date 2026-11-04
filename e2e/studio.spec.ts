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
