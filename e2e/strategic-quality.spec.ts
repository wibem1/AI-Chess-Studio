import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('manual strategic-quality comparison loads original game, validates grades and exports private JSON without model calls',async({page})=>{
 let modelRequests=0;
 page.on('request',request=>{if(/chat\/completions/.test(request.url()))modelRequests++;});
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#games-menu > summary').click();
 const pgn=readFileSync('test/fixtures/lichess-1Vh80QL2.pgn');
 await page.locator('#game-file').setInputFiles({name:'referenz.pgn',mimeType:'text/plain',buffer:pgn});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await page.locator('#open-settings').click();
 await page.locator('#settings-diagnosis > summary').click();
 await page.locator('#strategic-quality > summary').click();
 await page.getByRole('button',{name:'Prüfungsfälle aus geöffneter Partie laden'}).click();
 await expect(page.locator('#strategic-quality-status')).toContainText('Fünf Originalstellungen geladen');
 await expect(page.locator('#strategic-quality-case option')).toHaveCount(5);
 await expect(page.locator('#strategic-quality-question')).toContainText('menschlich-strategischer Sicht');
 await page.locator('#strategic-quality-prepare').click();
 await expect(page.locator('#question')).toHaveValue('Erkläre mir die Stellung aus menschlich-strategischer Sicht. Was sind die wichtigsten Pläne beider Seiten, warum, und welche konkreten Gegenmaßnahmen sind denkbar?');
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n10');
 expect(modelRequests).toBe(0);
 await page.locator('#open-settings').click();
 if(await page.locator('#settings-diagnosis').getAttribute('open')===null)await page.locator('#settings-diagnosis > summary').click();
 await page.locator('#strategic-quality-model').fill('Testmodell (keine echte KI)');
 await page.locator('#strategic-quality-thinking').fill('Test');
 await page.locator('#strategic-quality-response').fill('Testantwort ohne Modellanfrage.');
 for(const key of ['boardAccuracy','strategicContent','planExecution','opponentCounterplay','learningValue']){
  await page.locator('#strategic-quality-score-'+key).selectOption('2');
  await page.getByRole('textbox',{name:'Begründung: '+({
    boardAccuracy:'Bretttreue',strategicContent:'Strategischer Gehalt',planExecution:'Plan und Umsetzung',
    opponentCounterplay:'Gegnerisches Gegenspiel',learningValue:'Lernwert'} as Record<string,string>)[key]}).fill('Manuell begründete Testbewertung '+key);
 }
 await page.locator('#strategic-quality-save').click();
 await expect(page.locator('#strategic-quality-results')).toContainText('10 / 15');
 const saving=page.waitForEvent('download');await page.locator('#strategic-quality-export').click();
 const download=await saving;
 const data=JSON.parse(readFileSync((await download.path())!,'utf8'));
 expect(data.schemaVersion).toBe(1);expect(data.records).toHaveLength(1);
 expect(data.records[0].assessmentType).toBe('manual_not_engine');
 expect(data.records[0].caseId).toBe('lichess-1Vh80QL2-ply-11');
 expect(data.records[0].total).toBe(10);expect(modelRequests).toBe(0);
 await page.locator('#strategic-quality-import').setInputFiles({name:'quality.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 await expect(page.locator('#strategic-quality-status')).toContainText('aus Datei geprüft und geladen');
});
