import {test,expect} from '@playwright/test';
import {Studio} from '../src/dialogue.js';
import {LearningGame} from '../src/game.js';
const gameReview={summary:'Weiß öffnete seinen König; Schwarz nutzte die Diagonale h4–e1.',moments:[{ply:1,played:'f3',explanation:'Der f-Bauer öffnet die Diagonale zum König.',alternative:'e4',reason:'Zum Prüfen: Zentrum besetzen und Entwicklung vorbereiten.'},{ply:3,played:'g4',explanation:'Nach g4 folgt Qh4# auf der geöffneten Diagonale.',alternative:'g3',reason:'Zum Prüfen: die Diagonale h4–e1 unterbrechen.'}],lesson:'Vor einem Bauernzug vor dem König gegnerische Schachgebote prüfen.'};
test('typed retrospective shows historical learning moments and jumps to the position before a decision',async({page})=>{
 const studio=new Studio(),game=new LearningGame(()=>studio.session);game.start('w',1);game.play('f3');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});game.play('g4');await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});game.pause();
 let calls=0;
 await page.route('https://api.openai.com/**',async route=>{calls++;const body=route.request().postDataJSON(),r=JSON.parse(body.messages.at(-1).content);expect(r.topic).toBe('review');expect(r.history.moves).toEqual(['f3','e5','g4','Qh4#']);expect(body.max_completion_tokens).toBe(1800);
 await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify({message:'Wir betrachten den Weg zum Matt.',gameReview,plan:'Königssicherheit prüfen',opponent:'Schachgebote prüfen',risks:'Offene Diagonale',playability:'Einfacher Prüfschritt',candidates:[],openQuestions:[],humanFactors:{idea:'Bauernzüge prüfen',calculation:'Schachgebote',pitfalls:'Diagonale',continuation:'Entwicklung'}})}}],usage:{prompt_tokens:80,completion_tokens:80}}});});
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();await page.locator('#api-settings > summary').click();await page.locator('#api-key').fill('fixture-review-only-not-real');await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('gespeichert');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#games-menu > summary').click();await page.locator('#game-file').setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await page.locator('#learn-first').click();await page.locator('#question').fill('Analysiere das Spiel');await page.locator('#ask').click();await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');
 await expect(page.locator('#dialogue')).toContainText('1. f3');await expect(page.locator('#dialogue')).toContainText('2. g4');await expect(page.locator('#dialogue')).toContainText('Alternative zum Prüfen: e4');await expect(page.locator('#dialogue')).not.toContainText('Stellungsbeurteilung');
 await page.getByRole('button',{name:'Vor 2. g4 ansehen',exact:true}).click();await expect(page.locator('#position-status')).toContainText('n2');await expect(page.locator('#board [data-square=g2]')).toHaveAttribute('aria-label','g2: Weiß Bauer');
 expect(calls).toBe(1);
 await page.setViewportSize({width:810,height:1080});await page.locator('#dialogue').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/chess-review-ipad.png',fullPage:true});
});
