import {test,expect} from '@playwright/test';
import {Studio} from '../src/dialogue.js';
import {LearningGame} from '../src/game.js';
test('free chat gets the actual game separately from the selected earlier position and shows a natural retrospective',async({page})=>{
 const studio=new Studio(),game=new LearningGame(()=>studio.session);game.start('w',1);game.play('f3');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});game.play('g4');await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});game.pause();let calls=0;
 await page.route('https://api.openai.com/**',async route=>{calls++;const body=route.request().postDataJSON(),r=JSON.parse(body.messages.at(-1).content);expect(r.topic).toBe('chat');expect(r.history.moves).toEqual([]);expect(r.gameHistory.moves).toEqual(['f3','e5','g4','Qh4#']);expect(body.response_format).toBeUndefined();expect(body.max_completion_tokens).toBe(1800);await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Bei 1. f3 öffnete Weiß die Diagonale zum König. Mit 2. g4 wurde Qh4# möglich. Prüfe vor Bauernzügen am König die gegnerischen Schachgebote.'}}],usage:{prompt_tokens:80,completion_tokens:80}}});});
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.locator('#open-settings').click();await page.locator('#api-settings > summary').click();await page.locator('#api-provider').selectOption('openai');await page.locator('#settings-model-section > summary').click();await page.locator('#api-model').fill('gpt-4.1-mini');await page.locator('#api-key').fill('fixture-review-only-not-real');await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('gespeichert');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#games-menu > summary').click();await page.locator('#game-file').setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});await expect(page.locator('#games-status')).toContainText('Partie geladen');await page.locator('#learn-first').click();await page.locator('#question').fill('Analysiere das Spiel');await page.locator('#ask').click();await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');await expect(page.locator('#dialogue')).toContainText('1. f3');await expect(page.locator('#dialogue')).toContainText('2. g4');await expect(page.locator('#position-status')).toContainText('n0');expect(calls).toBe(1);
});

test('key-position browser flow salvages one illegal alternative and keeps navigation after reload',async({page})=>{
 const studio=new Studio(),game=new LearningGame(()=>studio.session);
 game.start('w',1);game.play('f3');
 await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});
 game.play('g4');
 await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});
 game.pause();
 let calls=0;
 const modelReply={
  message:'Zwei Schlüsselstellungen sind entscheidend.',
  candidates:[],openQuestions:[],
  gameReview:{summary:'Weiß öffnete seinen König; Schwarz setzte matt.',lesson:'Vor Bauernzügen die gegnerischen Drohungen prüfen.',
   moments:[
    {ply:1,played:'f3',explanation:'Der erste Bauernvorstoß öffnete die Königsstellung.',alternative:'Qh4#',reason:'Dieser erfundene Alternativzug ist in der ersten Stellung nicht möglich.'},
    {ply:3,played:'g4',explanation:'Der zweite Bauernzug ließ die Diagonale ungeschützt.',alternative:'g3',reason:'Dieser andere Bauernzug wäre legal und würde die Diagonale blockieren.'}
   ]
  }
 };
 await page.route('https://api.openai.com/v1/chat/completions',route=>{
  calls++;
  const body=route.request().postDataJSON(),payload=JSON.parse(body.messages.at(-1).content);
  expect(payload.topic).toBe('review');
  expect(payload.history.moves).toEqual(['f3','e5','g4','Qh4#']);
  return route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(modelReply)}}],usage:{prompt_tokens:140,completion_tokens:160}}});
 });
 await page.goto('/?platform=web');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();
 await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#api-model').fill('gpt-4.1-mini');
 await page.locator('#api-key').fill('fixture-review-only-not-real');
 await page.locator('#api-cost-consent').check();
 await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await page.locator('#find-key-moments').click();
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert');
 await expect(page.locator('#dialogue')).toContainText('Alternativzug war in dieser Stellung nicht legal und wurde entfernt');
 await expect(page.locator('#dialogue')).not.toContainText('Dieser erfundene Alternativzug');
 await expect(page.locator('#dialogue')).toContainText('Alternative zum Prüfen: g3');
 await expect(page.locator('#key-moment-links button')).toHaveCount(2);
 await page.locator('#key-moment-links button').nth(0).click();
 await expect(page.locator('#position-status')).toContainText('n0');
 await page.locator('#key-moment-next').click();
 await expect(page.locator('#position-status')).toContainText('n2');
 expect(calls).toBe(1);
 await page.reload();
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await expect(page.locator('#key-moment-links button')).toHaveCount(2);
 expect(calls).toBe(1);
});
