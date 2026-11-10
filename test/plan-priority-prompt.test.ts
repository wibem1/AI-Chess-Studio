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

test('free chat compares distinct strategic concepts instead of superficial capture alternatives',()=>{
 assert.match(FREE_CHAT_PROMPT,/unterschiedliche strategische Konzepte/);
 assert.match(FREE_CHAT_PROMPT,/positionelle Figurenverbesserung\/Vorposten/);
 assert.match(FREE_CHAT_PROMPT,/nicht bloß eine zweite Abtauschreihenfolge/);
 assert.match(FREE_CHAT_PROMPT,/nach dessen Abwicklung/);
 assert.match(FREE_CHAT_PROMPT,/taktischer Gewinn hat Vorrang/);
 assert.match(FREE_CHAT_PROMPT,/mitgegebenen Stockfish-Faktencheck/);
 assert.match(FREE_CHAT_PROMPT,/ohne zu behaupten, der Zug sei unabhängig entdeckt/);
});
test('structured mode preserves tactic priority while comparing different plans',()=>{
 assert.match(SYSTEM_PROMPT,/andersartigen strategischen Ziel/);
 assert.match(SYSTEM_PROMPT,/nicht lediglich zwei ähnliche Schlagfolgen/);
 assert.match(SYSTEM_PROMPT,/über den ersten Zug hinaus/);
 assert.match(SYSTEM_PROMPT,/Unmittelbare taktische Zwänge haben Vorrang/);
 assert.match(SYSTEM_PROMPT,/externer, begrenzter Befund/);
});
