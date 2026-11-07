import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {asksForGameReview,validateGameReview,formatGameReview} from '../src/game-review.js';
import {Studio,SimulationAdapter} from '../src/dialogue.js';
import {LearningGame} from '../src/game.js';
const history={rootFen:new Chess().fen(),moves:['f3','e5','g4','Qh4#'],truncated:false};
export const review={summary:'Weiß öffnete seinen König; Schwarz nutzte die Diagonale h4–e1.',moments:[
 {ply:1,played:'f3',explanation:'Der f-Bauer räumt f2 und öffnet die Diagonale zum König.',alternative:'e4',reason:'Zum Prüfen: Zentrum besetzen und Entwicklung vorbereiten.'},
 {ply:3,played:'g4',explanation:'Nach g4 kann die Dame mit Qh4# mattsetzen.',alternative:'g3',reason:'Zum Prüfen: g3 unterbricht die Diagonale h4–e1. Die weitere Entwicklung bleibt zu untersuchen.'}],lesson:'Vor einem Bauernzug vor dem König gegnerische Schachgebote prüfen.'};
test('whole-game language is recognized without turning a move question into a review',()=>{
 for(const q of ['Analysiere das Spiel','Analysiere bitte meine Partie','Besprich die bisherige Partie','Beurteile dieses Spiel'])assert.equal(asksForGameReview(q),true,q);
 for(const q of ['Analysiere diese Stellung','Warum habe ich das Spiel verloren?','Wie funktioniert die Partieanalyse?'])assert.equal(asksForGameReview(q),false,q);
});
test('review anchors and alternatives are checked at the historical position, including black move numbering',()=>{
 assert.equal(validateGameReview(review,history),review);assert.match(formatGameReview(review,history),/1\. f3/);
 const black={...review,moments:[review.moments[0]!,{...review.moments[1]!,ply:2,played:'e5',alternative:'d5'}]};
 assert.match(formatGameReview(validateGameReview(black,history),history),/1… e5/);
 for(const bad of [{...review,moments:[]},{...review,moments:[{...review.moments[0]!,played:'e4'},review.moments[1]!]},{...review,moments:[{...review.moments[0]!,alternative:'Qh4#'},review.moments[1]!]}])assert.throws(()=>validateGameReview(bad,history));
 assert.throws(()=>validateGameReview(review,{...history,truncated:true}));
 const long={rootFen:history.rootFen,moves:['e4','e5','Nf3','Nc6','Bb5','a6','Ba4','Nf6','O-O','Be7'],truncated:false};
 assert.throws(()=>validateGameReview({...review,moments:[9,10].map(ply=>({ply,played:long.moves[ply-1]!,explanation:'Nur Schlusszug',alternative:'',reason:'Keine Alternative'}))},long),/Schlusszüge/);
});
test('typed game analysis uses the actual game line even from an earlier study branch and overrides hints',async()=>{
 const studio=new Studio(),game=new LearningGame(()=>studio.session);game.start('w',1);game.play('f3');await game.reply({move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})});game.play('g4');await game.reply({move:async()=>({san:'Qh4#',level:1,engine:'Stockfish fixture'})});game.learn();game.analyse('n1');
 const base=await new SimulationAdapter().respond({nodeId:'n0',fen:history.rootFen,question:'',legalMoves:[]}) as Record<string,unknown>;
 await studio.ask('Analysiere das Spiel',{source:'model',respond:async r=>{assert.equal(r.topic,'review');assert.equal(r.hintMode,'explain');assert.deepEqual(r.history!.moves,history.moves);assert.equal(r.positionFacts!.checkmate,true);return {...base,assessment:undefined,gameReview:review};}},'position','question');
 assert.equal(studio.session.snapshot().activeNodeId,'n1');const a=studio.session.snapshot().annotations.at(-1)!;assert.equal(a.nodeId,'n4');assert.match(a.text,/Partierückblick/);assert.match(a.text,/Alternative zum Prüfen: e4/);assert.doesNotMatch(a.text,/Stellungsbeurteilung/);assert.deepEqual(a.suggestions,[]);
 await assert.rejects(studio.ask('Analysiere das Spiel',{source:'model',respond:async()=>base}),/Lernmomente/);
});

test('server transport requires a retrospective and reserves its larger output within the existing budget',async()=>{
 const {ModelService}=await import('../server/model.js');
 const board=new Chess();for(const move of history.moves)board.move(move);
 const req={nodeId:'n4',fen:board.fen(),question:'Partie besprechen',legalMoves:[],context:[],topic:'review',hintMode:'explain',history};
 let calls=0;
 const base=await new SimulationAdapter().respond({nodeId:'n0',fen:history.rootFen,question:'',legalMoves:[]}) as Record<string,unknown>;
 const service=new ModelService({enabled:true,apiKey:'fixture-only-secret',model:'fixture'},(async(_url,init)=>{calls++;assert.equal(JSON.parse(String(init!.body)).max_completion_tokens,1800);return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?{...base,gameReview:review}:base)}}],usage:{prompt_tokens:10,completion_tokens:20}}));}) as typeof fetch);
 await assert.rejects(service.reply({...req,history:undefined}));assert.equal(calls,0);
 await service.reply(req);await assert.rejects(service.reply(req));assert.equal(calls,2);
});
