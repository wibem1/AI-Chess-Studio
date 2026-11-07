import {Chess} from 'chess.js';
import {Session} from './session.js';
import {pathTo,type PlayingEngine} from './game.js';
import {parseCoachCall} from './coach-tools.js';
import {positionFacts} from './position-facts.js';
import type {DialogueAdapter,DialogueRequest} from './dialogue.js';
export class CoachMatch {
 private run=0;private engine:PlayingEngine|undefined;private cancelModel:(()=>void)|undefined;
 private expected='';private session:Session|undefined;
 report:{id:string;status:string;origin:string;rootFen:string;color:'w'|'b';opponent:string;level:number;maxTurns:number;modelTurns:number;moves:{san:string;source:'model'|'engine';fromFen:string;fen:string;explanation?:string}[];message:string}|undefined;
 constructor(private current:()=>Session,private change:()=>void,private delay=250){}
 get canReturn(){return !!this.report&&this.current()===this.session&&this.current().snapshot().nodes.some(n=>n.id===this.report!.origin);}
 get running(){return this.report?.status==='running';}
 stop(message='Vom Nutzer angehalten.') {this.run++;this.engine?.cancel?.();this.cancelModel?.();if(this.running){this.report!.status='stopped';this.report!.message=message;}}
 checkSelection(){if(this.running&&(this.current()!==this.session||this.current().snapshot().activeNodeId!==this.expected||this.current().snapshot().game?.paused===false)){this.stop('Stellung oder Sitzung gewechselt.');return true;}return false;}
 async start(options:{color:'w'|'b';opponent:'stockfish'|'maia';level:number;maxTurns:number;model?:string},adapter:DialogueAdapter&{cancel?:()=>void},engine:PlayingEngine){
  if(this.running)throw new Error('Testpartie läuft bereits.');
  if(!['w','b'].includes(options.color)||!['stockfish','maia'].includes(options.opponent)||!Number.isInteger(options.maxTurns)||options.maxTurns<1||options.maxTurns>100||!Number.isInteger(options.level)||options.level<1||options.level>5)throw new Error('Testoptionen prüfen.');
  const session=this.current(),snapshot=session.snapshot(),revision=session.dialogueRevision();if(session.status().gameOver)throw new Error('Die Ausgangsstellung ist bereits beendet.');if(snapshot.review?.guiding||snapshot.game?.paused===false)throw new Error('Zum Testen zuerst die Partie pausieren und geführten Rückblick verlassen.');
  this.session=session;this.expected=snapshot.activeNodeId;this.engine=engine;this.cancelModel=()=>adapter.cancel?.();const run=++this.run;
  const current=()=>run===this.run&&this.current()===session&&session.snapshot().activeNodeId===this.expected&&session.dialogueRevision()===revision&&session.snapshot().game?.paused!==false;
  const origin=pathTo(snapshot,snapshot.activeNodeId).at(-1)!;
  this.report={id:crypto.randomUUID(),status:'running',origin:origin.id,rootFen:origin.fen,...options,modelTurns:0,moves:[],message:'Testpartie läuft im Lernzweig.'};this.change();
  try{
   while(current()&&!session.status().gameOver){
    const data=session.snapshot(),node=data.nodes.find(n=>n.id===this.expected)!,board=new Chess(node.fen),path=pathTo(data,node.id);
    if(path.length>501)throw new Error('Zuggeschichte für diesen Test zu lang.');
    let san:string,source:'model'|'engine',explanation='';
    if(board.turn()===options.color){
     if(this.report.modelTurns>=options.maxTurns)break;
     this.report.message=`Lernengine berechnet Modellzug ${this.report.modelTurns+1} von höchstens ${options.maxTurns} …`;this.change();
     const request:DialogueRequest={...(options.model?{expectedModel:options.model}:{}),nodeId:node.id,fen:node.fen,question:'Spiele genau einen eigenen legalen Zug gegen die Spielengine. Verwende show_line mit genau einem SAN-Zug. Gib, falls möglich, eine kurze öffentliche Begründung. Keine weiteren Brettaktionen.',legalMoves:board.moves(),positionFacts:positionFacts(node.fen),history:{rootFen:path[0]!.fen,moves:path.slice(1).map(n=>n.san!),truncated:false},context:[],topic:'chat',hintMode:'explain',toolsEnabled:true,matchTest:{runId:this.report.id,color:options.color,turn:this.report.modelTurns+1}};
     const raw=await adapter.respond(request);if(!current())return;
     const reply=raw as {toolCall?:unknown;message?:unknown},call=parseCoachCall(reply.toolCall),moves=JSON.parse(call.function.arguments).moves;
     if(call.function.name!=='show_line'||moves.length!==1)throw new Error('Modell hat keinen einzelnen Testzug geliefert. Kein automatischer Wiederholungsversuch.');
     san=moves[0];source='model';explanation=typeof reply.message==='string'?reply.message.slice(0,1000):'';
     if(!session.legalMoves().includes(san))throw new Error('Modellzug ist illegal. Test beendet; keine automatische Korrektur.');
     this.report.modelTurns++;
    }else{
     this.report.message=`${options.opponent==='maia'?'Maia-2':'Stockfish'} antwortet …`;this.change();
     const raw=await engine.move(path[0]!.fen,path.slice(1).map(n=>n.san!),options.level);if(!current())return;
     const r=raw as {san?:unknown;level?:unknown;engine?:unknown};if(typeof r?.san!=='string'||r.level!==options.level||typeof r.engine!=='string'||!r.engine.startsWith(options.opponent==='maia'?'Maia-2':'Stockfish')||!session.legalMoves().includes(r.san))throw new Error('Spielengine lieferte keinen geprüften Zug.');san=r.san;source='engine';
    }
    const fromFen=node.fen;this.expected=session.play(san);this.report.moves.push({san,source,fromFen,fen:session.snapshot().nodes.find(n=>n.id===this.expected)!.fen,...(explanation?{explanation}:{})});this.change();
    if(this.delay)await new Promise(resolve=>setTimeout(resolve,this.delay));
   }
   if(current()){this.report.status=session.status().gameOver?'finished':'limit';this.report.message=session.status().checkmate?`Schachmatt: ${new Chess(session.snapshot().nodes.find(n=>n.id===this.expected)!.fen).turn()===options.color?'Lernengine verliert':'Lernengine gewinnt'}.`:session.status().gameOver?'Partie beendet (Remis oder Regelende).':'Gewählte Anzahl Modellzüge erreicht; keine Aussage über einen Sieger.';}
  }catch(error){if(current()){this.report.status='failed';this.report.message=error instanceof Error?error.message:'Testfehler.';}}
  finally{if(this.report?.status==='running'){this.report.status='stopped';this.report.message='Test nach Zustandswechsel angehalten.';}this.change();}
 }
}
