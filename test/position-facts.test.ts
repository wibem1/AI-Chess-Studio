import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {positionFacts,describeFacts} from '../src/position-facts.js';
import {parseRequest} from '../src/model-contract.js';
import {Studio,SimulationAdapter,validateReply} from '../src/dialogue.js';

test('rule facts identify mate in one, current checkmate and material without an overall evaluation',()=>{
 const c=new Chess();for(const m of ['f3','e5','g4'])c.move(m);
 const f=positionFacts(c.fen());assert.deepEqual(f.mateInOne,['Qh4#']);assert.equal(f.material.whiteMinusBlack,0);assert.equal(f.inCheck,false);
 const ep=new Chess();for(const m of ['e4','a6','e5','d5'])ep.move(m);assert.deepEqual(positionFacts(ep.fen()).legalCaptures.find(m=>m.san==='exd6'),{san:'exd6',from:'e5',to:'d6',captured:'p',enPassant:true});
 assert.match(describeFacts(f),/Matt in einem für Schwarz: Qh4#/);c.move('Qh4#');assert.equal(positionFacts(c.fen()).checkmate,true);
 const queen=positionFacts('4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1');assert.equal(queen.material.whiteMinusBlack,9);assert.equal('verdict' in queen,false);
});
test('request facts are computed from FEN, not accepted from untrusted input',()=>{
 const c=new Chess(),r=parseRequest({nodeId:'n0',fen:c.fen(),question:'Warum?',legalMoves:c.moves(),context:[],positionFacts:{mateInOne:['Qh4#'],material:{white:100}}});
 assert.deepEqual(r.positionFacts!.mateInOne,[]);assert.equal(r.positionFacts!.material.white,39);
});
test('full real coach explanation must contain a bounded assessment and displays concrete dangers outside details',async()=>{
 const studio=new Studio(),base=await new SimulationAdapter().respond({nodeId:'n0',fen:new Chess().fen(),question:'Warum?',legalMoves:[]}) as Record<string,unknown>;
 await assert.rejects(studio.ask('Beurteilung?',{source:'model',respond:async()=>({...base,assessment:undefined})}),/Stellungsbeurteilung fehlt/);
 for(const assessment of [{verdict:'winning',reason:'Test',dangers:[]},{verdict:'unclear',reason:'',dangers:[]},{verdict:'unclear',reason:'Test',dangers:[5]}])assert.throws(()=>validateReply({...base,assessment},[]),/Stellungsbeurteilung/);
 for(const m of ['f3','e5','g4'])studio.session.play(m);
 await studio.ask('Gefahr?',{source:'model',respond:async r=>{assert.deepEqual(r.positionFacts!.mateInOne,['Qh4#']);return {...base,assessment:{verdict:'black_advantage',reason:'Weiß hat seinen König durch f3 und g4 geöffnet.',dangers:['Schwarz droht Qh4# auf der Diagonale h4–e1.']}};}});
 const visible=studio.session.snapshot().annotations.at(-1)!.text.split('\n\nAnalyse-Details:')[0]!;
 assert.match(visible,/Vorteil Schwarz/);assert.match(visible,/Konkrete Gefahren: Schwarz droht Qh4#/);assert.match(visible,/Brettfakten/);
});
