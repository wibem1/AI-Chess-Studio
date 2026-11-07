import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Studio,SimulationAdapter} from '../src/dialogue.js';
import {CoachBoard} from '../src/coach-board.js';
import {LearningGame} from '../src/game.js';
import {parseCoachCall,validateExchanges,TOOL_RECORD,type CoachCall} from '../src/coach-tools.js';
import {ModelService} from '../server/model.js';
const call=(name:'show_line'|'play_engine',moves:string[],id='call_1'):CoachCall=>({id,type:'function',function:{name,arguments:JSON.stringify({moves})}});
const start=()=>{const studio=new Studio(),game=new LearningGame(()=>studio.session);game.start('w',1,'browser');game.pause();return studio;};
const engine={move:async()=>({san:'e5',level:1,engine:'Stockfish fixture'})};
test('board tool validates a whole line before applying it and keeps actual game cursor unchanged',async()=>{
 const s=start(),board=new CoachBoard(()=>s.session,()=>engine,()=>{},0),before=s.session.export();await assert.rejects(board.execute(call('show_line',['e4','e4']),'n0'));assert.equal(s.session.export(),before);
 const result=await board.execute(call('play_engine',['e4']),'n0');assert.deepEqual(result.moves,['e4','e5']);assert.equal(s.session.snapshot().activeNodeId,'n2');assert.equal(s.session.snapshot().game!.cursor,'n0');assert.equal(validateExchanges([{call:call('play_engine',['e4']),content:'',result}],result.fromFen).length,1);
 assert.throws(()=>validateExchanges([{call:call('play_engine',['e4']),content:'',result:{...result,fen:result.fromFen}}],result.fromFen));
});
test('late engine reply after selection change is discarded and invalid calls never execute',async()=>{
 const s=start();let finish!:(r:unknown)=>void;const board=new CoachBoard(()=>s.session,()=>({move:async()=>new Promise(r=>{finish=r;})}),()=>{},0);const pending=board.execute(call('play_engine',[]),'n0');s.session.play('d4');finish({san:'e4',level:1,engine:'Stockfish fixture'});await assert.rejects(pending);assert.equal(s.session.snapshot().nodes.length,2);
 assert.throws(()=>parseCoachCall({...call('show_line',['e4']),function:{name:'run_code',arguments:'{}'}}));
});
test('cancel or chat clear prevents a running line from applying later moves',async()=>{
 for(const clear of [false,true]){const s=start(),board=new CoachBoard(()=>s.session,()=>engine,()=>{},10);const pending=board.execute(call('show_line',['e4','e5']),'n0');if(clear)s.session.clearDialogue();else board.cancel();await assert.rejects(pending);assert.equal(s.session.snapshot().nodes.length,2);}
});
test('tool loop returns verified board/engine results to the provider and stores explanation at resulting position',async()=>{
 const s=start(),board=new CoachBoard(()=>s.session,()=>engine,()=>{},0);let calls=0;
 const service=new ModelService({enabled:true,apiKey:'fixture-only-not-real',model:'fixture'},(async(_url,init)=>{calls++;const body=JSON.parse(String(init!.body));assert.equal(body.response_format,undefined);
 if(calls===1){assert.deepEqual(body.tools.map((t:any)=>t.function.name),['show_line','play_engine']);return new Response(JSON.stringify({choices:[{finish_reason:'tool_calls',message:{content:null,tool_calls:[call('play_engine',['e4'])]}}],usage:{prompt_tokens:20,completion_tokens:20}}));}
 assert.equal(body.messages.at(-2).role,'assistant');assert.equal(body.messages.at(-1).role,'tool');const actual=JSON.parse(body.messages.at(-1).content);assert.deepEqual(actual.moves,['e4','e5']);assert.equal(actual.fen,s.session.snapshot().nodes[2]!.fen);
 return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'Die Engine hat mit e5 das Zentrum besetzt.'}}],usage:{prompt_tokens:20,completion_tokens:20}}));}) as typeof fetch);
 await s.ask('Zeige e4 und lass die Engine antworten.',{source:'model',respond:r=>service.reply(r)},'chat',undefined,(c,n)=>board.execute(c,n));assert.equal(calls,2);const data=s.session.snapshot();assert.equal(data.game!.cursor,'n0');assert.equal(data.annotations.length,3);assert.match(data.annotations[1]!.text,new RegExp(TOOL_RECORD.replace(/[()]/g,'\\$&')));assert.equal(data.annotations[2]!.nodeId,'n2');
 s.session.select('n0');await s.ask('Was hast du gezeigt?',{respond:async r=>{assert.ok(r.turns!.some(t=>t.text.includes('Engine hat mit e5')));return new SimulationAdapter().respond(r);}},'chat');
});
test('clearing chat while the model requests a tool prevents execution',async()=>{
 const s=start();let finish!:(v:unknown)=>void,executed=0;const pending=s.ask('Zeige einen Zug',{source:'model',respond:async()=>new Promise(r=>{finish=r;})},'chat',undefined,async()=>{executed++;throw Error();});s.session.clearDialogue();finish({message:'Aktion',toolCall:call('show_line',['e4'])});assert.equal(await pending,'discarded');assert.equal(executed,0);
});

test('two tool rounds are bounded, each consumes one normal provider attempt and final request offers no more tools',async()=>{
 const s=start(),board=new CoachBoard(()=>s.session,()=>({move:async()=>({san:'Nf3',level:1,engine:'Stockfish fixture'})}),()=>{},0);let calls=0;
 const service=new ModelService({enabled:true,apiKey:'fixture-only-not-real',model:'fixture'},(async(_url,init)=>{calls++;const body=JSON.parse(String(init!.body));
 if(calls<=2)return new Response(JSON.stringify({choices:[{finish_reason:'tool_calls',message:{content:null,tool_calls:[call(calls===1?'show_line':'play_engine',calls===1?['e4']:['e5'],'call_'+calls)]}}],usage:{prompt_tokens:20,completion_tokens:20}}));
 assert.equal(body.tools,undefined);assert.deepEqual(body.messages.slice(-4).map((m:any)=>m.role),['assistant','tool','assistant','tool']);return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'Gezeigt wurden e4, e5 und Nf3.'}}],usage:{prompt_tokens:20,completion_tokens:20}}));}) as typeof fetch);
 await s.ask('Zeige zwei Schritte und eine Engineantwort',{source:'model',respond:r=>service.reply(r)},'chat',undefined,(c,n)=>board.execute(c,n));assert.equal(calls,3);assert.equal(service.status().remaining,0);assert.equal(s.session.snapshot().activeNodeId,'n3');assert.equal(s.session.snapshot().game!.cursor,'n0');
});
test('when continuation budget is exhausted the executed study move and honest app record are retained',async()=>{
 const s=start(),board=new CoachBoard(()=>s.session,()=>engine,()=>{},0);let calls=0;
 const service=new ModelService({enabled:true,apiKey:'fixture-only-not-real',model:'fixture'},(async()=>{calls++;return new Response(JSON.stringify({choices:[calls<=2?{finish_reason:'stop',message:{content:'Antwort'}}:{finish_reason:'tool_calls',message:{content:null,tool_calls:[call('show_line',['e4'])]}}],usage:{prompt_tokens:20,completion_tokens:20}}));}) as typeof fetch);
 const base={nodeId:'n0',fen:s.session.snapshot().nodes[0]!.fen,legalMoves:s.session.legalMoves(),question:'Frage',context:[],topic:'chat'};await service.reply(base);await service.reply(base);
 await assert.rejects(s.ask('Zeige e4',{source:'model',respond:r=>service.reply(r)},'chat',undefined,(c,n)=>board.execute(c,n)));assert.equal(calls,3);assert.equal(s.session.snapshot().activeNodeId,'n1');assert.equal(s.session.snapshot().game!.cursor,'n0');assert.equal(s.session.snapshot().annotations.length,2);assert.ok(s.session.snapshot().annotations[1]!.text.startsWith(TOOL_RECORD));
});

test('a toolCall mentioned in ordinary model text is never executed as an API tool request',async()=>{
 const s=start();let executed=0;const service=new ModelService({enabled:true,apiKey:'fixture-only-not-real',model:'fixture'},(async()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({message:'Dies ist nur ein Beispiel.',toolCall:call('show_line',['e4'])})}}],usage:{prompt_tokens:20,completion_tokens:20}}))) as typeof fetch);
 await s.ask('Erkläre ein Beispiel',{source:'model',respond:r=>service.reply(r)},'chat',undefined,async()=>{executed++;throw Error();});assert.equal(executed,0);assert.equal(s.session.snapshot().nodes.length,1);assert.match(s.session.snapshot().annotations.at(-1)!.text,/nur ein Beispiel/);
});
