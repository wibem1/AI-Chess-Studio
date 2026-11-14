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
 const draft='Weiß schwächt mit f3 und g4 den König; Schwarz nutzt mit der Dame die offene Diagonale h4–e1.';
 const service=new ModelService({enabled:true,apiKey:'fixture-only-secret',model:'fixture'},(async(_url,init)=>{
   calls++;const payload=JSON.parse(String(init!.body));
   assert.equal(payload.max_completion_tokens,calls%2===1?1100:2600);
   if(calls%2===1){
     assert.equal(payload.messages.length,2);
     assert.doesNotMatch(JSON.stringify(payload.messages[1]),/Stockfish|centipawn|lossCp|beforeCp|afterCp/);
   }else{
     assert.match(JSON.stringify(payload.messages),/qualitativeDraft/);
     assert.match(JSON.stringify(payload.messages),/Weiß schwächt/);
   }
   return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:calls%2===1?draft:JSON.stringify(calls===2?{...base,gameReview:review}:base)}}],usage:{prompt_tokens:10,completion_tokens:20}}));
 }) as typeof fetch);
 await assert.rejects(service.reply({...req,history:undefined}));assert.equal(calls,0);
 await service.reply(req);assert.equal(calls,2);
 await assert.rejects(service.reply(req));assert.equal(calls,4);
});

test('explicit key-moment requests in free chat store checked analysis and navigable anchors with the game',async()=>{
 const {Session}=await import('../src/session.js');const {reviewAnchors,asksForKeyMoments}=await import('../src/game-review.js');
 for(const q of ['Welche Schlüsselstellen hatte das Spiel?','Zeige die Schlüsselmomente der Partie','Nenne mir Wendepunkte','Was waren die Schlüsselstellen?','Zeige die Schlüsselstellungen des Spiels','Zeige die Schlüsselstellung','Zeige die Schlüsselpositionen der Partie','Zeige die Schluesselstellungen des Spiels'])assert.equal(asksForKeyMoments(q),true);
 assert.equal(asksForKeyMoments('Was bedeutet das Wort Schlüsselstelle?'),false);
 const studio=new Studio(),game=new LearningGame(()=>studio.session);game.start('w',1);game.pause();for(const move of history.moves)studio.session.play(move);studio.session.setGame({...studio.session.snapshot().game!,cursor:'n4'});studio.session.select('n1');
 await studio.ask('Welche Schlüsselstellen hatte das Spiel?',{source:'model',respond:async r=>{assert.equal(r.topic,'review');assert.deepEqual(r.history!.moves,history.moves);return {message:review.summary,gameReview:review};}},'chat');
 const saved=Session.import(studio.session.export()),a=saved.snapshot().annotations.at(-1)!;assert.deepEqual(a.gameReview,review);assert.deepEqual(reviewAnchors(saved.snapshot(),a).map(m=>m.nodeId),['n0','n2']);assert.equal(saved.snapshot().activeNodeId,'n1');
 const d=saved.snapshot();d.annotations.at(-1)!.gameReview!.moments[0]!.played='d4';assert.throws(()=>Session.import(JSON.stringify(d)),/Zugfolge/);
});
test('previously saved text-only reviews retain their checked move anchors',async()=>{
 const {Session}=await import('../src/session.js');const {reviewAnchors}=await import('../src/game-review.js');const s=new Session();for(const move of history.moves)s.play(move);
 s.annotate({nodeId:'n4',kind:'dialogue',source:'model',text:formatGameReview(review,history),hypothesis:true,openQuestions:[]});const loaded=Session.import(s.export()),a=loaded.snapshot().annotations[0]!;
 assert.equal(a.gameReview,undefined);assert.deepEqual(reviewAnchors(loaded.snapshot(),a).map(x=>x.label),['1. f3','2. g4']);
});

test('model review with an illegal alternative preserves valid moments and never presents the illegal move',()=>{
 const raw={...review,moments:[
  {...review.moments[0]!,alternative:'Qh4#',reason:'Der alternative Damenangriff wäre angeblich gut.'},
  review.moments[1]!
 ]};
 assert.throws(()=>validateGameReview(raw,history),/Alternativzug/); // Imported sessions remain strict.
 const repaired=validateGameReview(raw,history,true);
 assert.equal(repaired.moments.length,2);
 assert.equal(repaired.moments[0]!.played,'f3');
 assert.equal(repaired.moments[0]!.alternative,'');
 assert.doesNotMatch(repaired.moments[0]!.reason,/Damenangriff/);
 assert.equal(repaired.moments[1]!.alternative,'g3');
 const formatted=formatGameReview(repaired,history);
 assert.match(formatted,/Partierückblick/);
 assert.doesNotMatch(formatted,/Alternative zum Prüfen: Qh4#/);
 assert.match(formatted,/nicht legal und wurde entfernt/);
 assert.match(formatted,/Alternative zum Prüfen: g3/);
 assert.equal(raw.moments[0]!.alternative,'Qh4#'); // No mutation of provider data.
 const duplicate={...review,moments:[{...review.moments[0]!,alternative:'f3'},review.moments[1]!]};
 assert.equal(validateGameReview(duplicate,history,true).moments[0]!.alternative,'');
 const broken={...review,moments:[{...review.moments[0]!,played:'e4'},review.moments[1]!]};
 assert.throws(()=>validateGameReview(broken,history,true),/Analyse verworfen/);
});

test('paid-model review with one illegal alternative is saved, navigable and exportable without retry',async()=>{
 const {Session}=await import('../src/session.js');
 const {reviewAnchors}=await import('../src/game-review.js');
 const studio=new Studio(),game=new LearningGame(()=>studio.session);
 game.start('w',1);game.pause();
 for(const san of history.moves)studio.session.play(san);
 studio.session.setGame({...studio.session.snapshot().game!,cursor:'n4'});
 const candidate={...review,moments:[
  {...review.moments[0]!,alternative:'Qh4#',reason:'Falsche Empfehlung der KI, obwohl noch nicht legal.'},
  review.moments[1]!
 ]};
 let providerRequests=0;
 const result=await studio.ask('Zeige die Schlüsselstellungen der Partie',{
  source:'model',
  respond:async()=>{
   providerRequests++;
   return {message:'Zwei Wendepunkte',gameReview:candidate};
  }
 },'chat');
 assert.equal(result,'stored');
 assert.equal(providerRequests,1); // No costly retry to repair one bad SAN.
 const original=studio.session.snapshot();
 const report=original.annotations.findLast(a=>a.source==='model')!;
 assert.ok(report.gameReview);
 assert.equal(report.gameReview!.moments[0]!.alternative,'');
 assert.match(report.text,/Alternativzug war in dieser Stellung nicht legal/);
 assert.match(report.text,/2\. g4/);
 assert.doesNotMatch(report.text,/Falsche Empfehlung der KI/);
 assert.deepEqual(reviewAnchors(original,report).map(m=>m.nodeId),['n0','n2']);
 const reloaded=Session.import(studio.session.export()),persisted=reloaded.snapshot();
 const saved=persisted.annotations.findLast(a=>a.source==='model')!;
 assert.deepEqual(reviewAnchors(persisted,saved).map(m=>m.nodeId),['n0','n2']);
 assert.equal(saved.gameReview!.moments[0]!.alternative,'');
 // The provider's original response object was not overwritten.
 assert.equal(candidate.moments[0]!.alternative,'Qh4#');
});

test('six chronological strategic moments are permitted without weakening legal move checks',()=>{
 const moves=['e4','e5','Nf3','Nc6','Bb5','a6','Ba4','Nf6'];
 const data={rootFen:new Chess().fen(),moves,truncated:false};
 const moments=[1,2,3,4,5,6].map(ply=>({ply,played:moves[ply-1]!,explanation:'Plan oder Gegenplan an diesem konkreten Zug prüfen.',alternative:'',reason:'Eine geprüfte taktische Alternative fehlt.'}));
 assert.equal(validateGameReview({summary:'Weiß und Schwarz entwickeln ihre Figuren und ringen um Raum.',moments,lesson:'Pläne beider Seiten vor der Enginebewertung untersuchen.'},data).moments.length,6);
 assert.throws(()=>validateGameReview({summary:'Überblick',moments:[...moments,{...moments[0]!,ply:7,played:moves[6]!}],lesson:'Lernpunkt'},data));
});

test('failed qualitative first pass is not mistaken for a completed review or silently retried',async()=>{
 const {ModelService}=await import('../server/model.js');
 const board=new Chess();for(const move of history.moves)board.move(move);
 let calls=0;
 const service=new ModelService({enabled:true,apiKey:'fixture-only-secret',model:'fixture'},(async(_url,init)=>{
  calls++;const payload=JSON.parse(String(init!.body));
  assert.equal(payload.max_completion_tokens,1100);
  return new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'Unvollständige Deutung'}}],usage:{prompt_tokens:60,completion_tokens:1100}}));
 }) as typeof fetch);
 await assert.rejects(service.reply({nodeId:'n4',fen:board.fen(),question:'Analysiere die Partie',legalMoves:[],context:[],topic:'review',hintMode:'explain',history}),/Strategische Voranalyse fehlgeschlagen/);
 assert.equal(calls,1,'no paid second-stage call after an incomplete draft');
});

test('59-move diagnostic game is complete in the isolated strategic payload and retains historical anchors',async()=>{
 const {readFileSync}=await import('node:fs');const {strategicPayload}=await import('../src/strategic-pass.js');
 const moves=JSON.parse(readFileSync('test/fixtures/strategy-59-moves.json','utf8')) as string[];
 const board=new Chess();for(const san of moves)board.move(san);assert.equal(moves.length,117);assert.equal(board.isCheckmate(),true);
 const data={rootFen:new Chess().fen(),moves,truncated:false};
 const payload=strategicPayload({nodeId:'n117',fen:board.fen(),legalMoves:[],question:'Analysiere die Partie',history:{...data,engineScore:999} as any,context:['Stockfish beforeCp 530'],turns:[{role:'assistant',nodeId:'n70',text:'ENGINE_SENTINEL'}]});
 assert.deepEqual(payload.history,data);assert.doesNotMatch(JSON.stringify(payload),/Stockfish|engineScore|ENGINE_SENTINEL|beforeCp/);
 const moments=[13,42,70,91,99,113].map(ply=>({ply,played:moves[ply-1]!,explanation:'Konkrete Figurenkoordination und Gegenplan an dieser Stellung prüfen.',alternative:'',reason:'Keine berechnete Alternative vorhanden.'}));
 assert.equal(moves[69],'Rc8');assert.equal(moves[98],'Qf3');
 assert.equal(validateGameReview({summary:'Raumgewinn, Zentrumsabtausch, Freibauernrennen und Königsangriff.',moments,lesson:'Nach der Umwandlung die Priorität von Freibauernkontrolle zu Königssicherheit neu prüfen.'},data).moments.length,6);
});

test('two-stage model receipt survives game export together with the validated review',async()=>{
 const {Session}=await import('../src/session.js');const studio=new Studio();for(const san of history.moves)studio.session.play(san);
 await studio.ask('Analysiere die Partie',{source:'model',respond:async()=>({message:review.summary,gameReview:review,provenance:{provider:'OpenRouter',model:'fixture/model',requestedModel:'fixture/model',reasoning:null,costUsd:0.03,traceId:2,calls:2}})},'review','explain');
 const saved=Session.import(studio.session.export()).snapshot().annotations.at(-1)!;
 assert.deepEqual(saved.gameReview,review);assert.match(saved.text,/2 Aufruf\(e\)/);assert.match(saved.text,/0\.030000 USD/);
});

test('review teaching arrows stay tied to the position before a key move and survive export/import',async()=>{
 const {Session}=await import('../src/session.js');
 const {reviewAnchors}=await import('../src/game-review.js');
 const annotated={...review,moments:review.moments.map((m,i)=>({...m,marks:i===0?[{from:'f2',to:'f3',kind:'arrow' as const,color:'green' as const},{from:'d8',to:'h4',kind:'arrow' as const,color:'red' as const}]:[]}))};
 const checked=validateGameReview(annotated,history);
 const session=new Session();for(const m of history.moves)session.play(m);
 session.annotate({nodeId:'n4',kind:'dialogue',source:'model',text:formatGameReview(checked,history),hypothesis:true,openQuestions:[],gameReview:checked});
 const restored=Session.import(session.export());
 assert.deepEqual(restored.snapshot().annotations[0]!.gameReview!.moments[0]!.marks,annotated.moments[0]!.marks);
 assert.deepEqual(reviewAnchors(restored.snapshot(),restored.snapshot().annotations[0]!).map(a=>a.nodeId),['n0','n2']);
 const malformed={...annotated,moments:[{...annotated.moments[0]!,marks:[{from:'a9',to:'h8',kind:'arrow',color:'red'}]},annotated.moments[1]!]};
 assert.throws(()=>validateGameReview(malformed,history),/Brettpfeile/);
 const cleaned=validateGameReview(malformed,history,true);
 assert.equal(cleaned.moments[0]!.marks,undefined);
 assert.equal(checked.moments[0]!.marks!.length,2);
});

test('teaching steps are position-scoped, validated and stripped when invalid',()=>{
 const staged={...review,moments:review.moments.map((m,i)=>i?m:{...m,steps:[
 {text:'Weiß zeigt den Bauernplan.',marks:[{from:'f2',to:'f3',kind:'arrow' as const,color:'green' as const}]},
 {text:'Schwarz antwortet auf der Diagonale.',marks:[{from:'d8',to:'h4',kind:'arrow' as const,color:'red' as const}]}
 ]})};
 assert.equal(validateGameReview(staged,history).moments[0]!.steps?.length,2);
 const invalid={...staged,moments:[{...staged.moments[0]!,steps:[{text:'Ungültig',marks:[{from:'a9',to:'b1',kind:'arrow',color:'red'}]}]},staged.moments[1]!]};
 assert.throws(()=>validateGameReview(invalid,history),/Lernschritte/);
 const salvaged=validateGameReview(invalid,history,true);
 assert.equal(salvaged.moments[0]!.steps,undefined);
 assert.equal(salvaged.moments[0]!.played,'f3');
});
