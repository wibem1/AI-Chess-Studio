import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FREE_CHAT_PROMPT,SYSTEM_PROMPT} from '../src/model-contract.js';

test('free chat requires a ranked and actionable plan when strategy is requested',()=>{
 assert.match(FREE_CHAT_PROMPT,/priorisiere die praktisch relevanten Alternativen/);
 assert.match(FREE_CHAT_PROMPT,/genau einen vorläufig bevorzugten Plan/);
 assert.match(FREE_CHAT_PROMPT,/warum du sie momentan zurückstellst/);
 assert.match(FREE_CHAT_PROMPT,/umsetzbaren nächsten Schritt/);
 assert.match(FREE_CHAT_PROMPT,/Plan neu bewertet werden muss/);
 assert.match(FREE_CHAT_PROMPT,/keine redliche Rangfolge/);
});
test('structured explanations prioritize without weakening hint and review rules',()=>{
 assert.match(SYSTEM_PROMPT,/priorisiere:/);
 assert.match(SYSTEM_PROMPT,/menschlicher Spielbarkeit/);
 assert.match(SYSTEM_PROMPT,/Auslöser zum Umplanen/);
 assert.match(SYSTEM_PROMPT,/hintMode question\/hint/);
 assert.match(SYSTEM_PROMPT,/Partierückblicken/);
 assert.match(SYSTEM_PROMPT,/hintMode: question bedeutet nur eine weiterführende Leitfrage/);
});

test('partie review requires strategic interpretation before engine scores',()=>{
 assert.match(FREE_CHAT_PROMPT,/zuerst den tatsächlichen Partieverlauf strategisch/);
 assert.match(SYSTEM_PROMPT,/zuerst eigenständige strategische Interpretation/);
 assert.match(SYSTEM_PROMPT,/zwei bis sechs konkrete Lernmomente/);
});
