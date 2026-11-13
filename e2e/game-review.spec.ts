import {test,expect} from '@playwright/test';
import {Studio} from '../src/dialogue.js';
import {LearningGame} from '../src/game.js';
test('free chat gets the actual game separately from the selected earlier position and shows a natural retrospective',async({page})=>{
 const studio=new Studio(),game=new LearningGame(()=>studio.session);game.start('w',1);game.play('f3');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});game.play('g4');await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});game.pause();let calls=0;
 await page.route('https://api.openai.com/**',async route=>{calls++;const body=route.request().postDataJSON(),r=JSON.parse(body.messages.at(-1).content);expect(r.topic).toBe('chat');expect(r.history.moves).toEqual([]);expect(r.gameHistory.moves).toEqual(['f3','e5','g4','Qh4#']);expect(body.response_format).toBeUndefined();expect(body.max_completion_tokens).toBe(1800);await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Bei 1. f3 öffnete Weiß die Diagonale zum König. Mit 2. g4 wurde Qh4# möglich. Prüfe vor Bauernzügen am König die gegnerischen Schachgebote.'}}],usage:{prompt_tokens:80,completion_tokens:80}}});});
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');await page.locator('#open-settings').click();await page.locator('#api-settings > summary').click();await page.locator('#api-provider').selectOption('openai');await page.locator('#settings-model-section > summary').click();await page.locator('#api-model').fill('gpt-4.1-mini');await page.locator('#api-key').fill('fixture-review-only-not-real');await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('gespeichert');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();await page.locator('#games-menu > summary').click();await page.locator('#game-file').setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});await expect(page.locator('#games-status')).toContainText('Partie geladen');await page.locator('#learn-first').click();await page.locator('#question').fill('Analysiere das Spiel');await page.locator('#ask').click();await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');await expect(page.locator('#dialogue')).toContainText('1. f3');await expect(page.locator('#dialogue')).toContainText('2. g4');await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n0');expect(calls).toBe(1);
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
  if(!payload.topic){
   expect(payload.history.moves).toEqual(['f3','e5','g4','Qh4#']);
   expect(payload.context).toBeUndefined();
   return route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Weiß schwächt durch die Bauernzüge f3 und g4 seinen König. Schwarz antwortet mit einem direkten Damenmatt auf h4.'}}],usage:{prompt_tokens:100,completion_tokens:100}}});
  }
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
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n0');
 await page.locator('#key-moment-next').click();
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n2');
 expect(calls).toBe(2);
 await page.reload();
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await expect(page.locator('#key-moment-links button')).toHaveCount(2);
 expect(calls).toBe(2);
});

test('two explicit analysis buttons: game review creates key moments, position analysis targets the visible FEN',async({page})=>{
 test.setTimeout(120000);
 const studio=new Studio(),game=new LearningGame(()=>studio.session);
 game.start('w',1);game.play('f3');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});
 game.play('g4');await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});game.pause();
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await expect(page.locator('#find-key-moments')).toHaveText('Analyse des Spiels');
 await expect(page.locator('#analyze-position')).toHaveText('Analyse der Stellung');
 await expect(page.locator('#analyze-position')).toBeVisible();
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'analysis-buttons.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await page.locator('#open-settings').click();
 await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');
 await page.locator('#settings-model-section > summary').click();
 await page.locator('#api-model').fill('gpt-4.1-mini');
 await page.locator('#api-key').fill('fixture-analysis-buttons-not-real');
 await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 let gameCalls=0,positionCalls=0,firstPassCalls=0;
 await page.route('https://api.openai.com/v1/chat/completions',async route=>{
  const data=route.request().postDataJSON(),payload=JSON.parse(data.messages.at(-1).content);
  if(!payload.topic){
   firstPassCalls++;
   expect(payload.history.moves).toEqual(['f3','e5','g4','Qh4#']);
   await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Weiß schwächt durch die Bauernzüge f3 und g4 seinen König. Schwarz antwortet mit einem direkten Damenmatt auf h4.'}}],usage:{prompt_tokens:100,completion_tokens:100}}});
  }else if(payload.topic==='review'){
   gameCalls++;
   expect(payload.history.moves).toEqual(['f3','e5','g4','Qh4#']);
   const response={message:'Die entscheidenden Fehler waren 1. f3 und 2. g4.',candidates:[],openQuestions:[],gameReview:{
    summary:'Weiß schwächte seine Königsstellung.',lesson:'Königssicherheit vor Bauernzügen prüfen.',
    moments:[{ply:1,played:'f3',explanation:'Die Diagonale wird geschwächt.',alternative:'e4',reason:'Entwicklungsplan prüfen.'},
     {ply:3,played:'g4',explanation:'Das Feld h4 wird schwach.',alternative:'g3',reason:'Königssicherheit prüfen.'}]}};
   await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(response)}}],usage:{prompt_tokens:160,completion_tokens:180}}});
  }else{
   positionCalls++;
   expect(payload.topic).toBe('chat');
   expect(payload.history.moves).toEqual(['f3']);
   expect(payload.question).toContain('aktuell angezeigte Stellung');
   await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Nach 1. f3 ist die weiße Königsstellung geschwächt.'}}],usage:{prompt_tokens:80,completion_tokens:40}}});
  }
 });
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#find-key-moments').click();
 // This is a new AI request, not only a prepared text.
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert',{timeout:60000});
 await expect(page.locator('#key-moment-links button')).toHaveCount(2);
 expect(gameCalls).toBe(1);expect(firstPassCalls).toBe(1);
 await page.locator('#learn-first').click();await page.locator('#learn-next').click();
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n1');
 await page.locator('#analyze-position').click();
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert',{timeout:45000});
 expect(positionCalls).toBe(1);
 await expect(page.locator('#dialogue')).toContainText('Nach 1. f3');
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();
 await expect(page.locator('#find-key-moments')).toBeHidden();
 await expect(page.locator('#analyze-position')).toBeHidden();
});

test('game analysis retains its original game position if user navigates during the Stockfish preparation',async({page})=>{
 test.setTimeout(120000);
 const studio=new Studio(),game=new LearningGame(()=>studio.session);
 game.start('w',1);game.play('f3');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});
 game.play('g4');await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});game.pause();
 await page.goto('/?platform=web#lernen');
 await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#games-menu > summary').click();
 await page.locator('#game-file').setInputFiles({name:'short-scan.json',mimeType:'application/json',buffer:Buffer.from(studio.session.export())});
 await expect(page.locator('#games-status')).toContainText('Partie geladen');
 await page.locator('#open-settings').click();await page.locator('#api-settings > summary').click();
 await page.locator('#api-provider').selectOption('openai');await page.locator('#settings-model-section > summary').click();
 await page.locator('#api-model').fill('gpt-4.1-mini');await page.locator('#api-key').fill('fixture-navigation-not-real');
 await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();
 await expect(page.locator('#api-feedback')).toContainText('gespeichert');
 let calls=0;
 await page.route('https://api.openai.com/v1/chat/completions',async route=>{
  calls++;
  const payload=JSON.parse(route.request().postDataJSON().messages.at(-1).content);
  if(!payload.topic){
   expect(payload.history.moves).toEqual(['f3','e5','g4','Qh4#']);
   await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Weiß schwächt durch die Bauernzüge f3 und g4 seinen König. Schwarz antwortet mit einem direkten Damenmatt auf h4.'}}],usage:{prompt_tokens:100,completion_tokens:100}}});
   return;
  }
  expect(payload.topic).toBe('review');expect(payload.history.moves).toEqual(['f3','e5','g4','Qh4#']);
  expect(payload.context.join('')).toContain('Lokal geprüfte Stockfish-Partieanalyse');
  const response={message:'Partie überprüft.',candidates:[],openQuestions:[],gameReview:{
   summary:'Weißs König wurde geschwächt.',lesson:'Schachs vor Bauernzügen prüfen.',
   moments:[{ply:1,played:'f3',explanation:'Schwächt die Königsstellung.',alternative:'e4',reason:'Entwicklung fördern.'},{ply:3,played:'g4',explanation:'Ermöglicht Matt auf h4.',alternative:'g3',reason:'Weniger Schwächen.'}]}};
  await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(response)}}],usage:{prompt_tokens:120,completion_tokens:120}}});
 });
 await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
 await page.locator('#find-key-moments').click();
 await page.locator('#learn-first').click();
 await expect(page.locator('#position-status')).toHaveAttribute('data-node-id','n0');
 await expect(page.locator('#dialogue-feedback')).toContainText('gespeichert',{timeout:60000});
 expect(calls).toBe(2);
 await expect(page.locator('#key-moment-links button')).toHaveCount(2);
 await expect(page.locator('#dialogue-feedback')).not.toContainText('Stellung während der Stockfish-Prüfung gewechselt');
});
