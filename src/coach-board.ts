import {Chess} from 'chess.js';
import {pathTo,type PlayingEngine} from './game.js';
import type {Session} from './session.js';
import {parseCoachCall,type CoachCall,type CoachResult,type BoardDiagram} from './coach-tools.js';
import {reviewLocked} from './review.js';
/** Only the study cursor moves. The actual game cursor is never written here. */
export class CoachBoard{
 private guard:(()=>boolean)|undefined;
 checkSelection(){if(this.guard&&!this.guard()){this.cancel();return true;}return false;}
 private revision=0;private activeEngine:PlayingEngine|undefined;
 constructor(private current:()=>Session,private engine:()=>PlayingEngine,private changed:(node:string)=>void=()=>{},private delay=150,private illustrate:(diagram:BoardDiagram,node:string)=>void=()=>{}){}
 cancel(){this.guard=undefined;this.revision++;this.activeEngine?.cancel?.();this.activeEngine=undefined;}
 async execute(raw:CoachCall,expectedNode:string):Promise<CoachResult>{
  const call=parseCoachCall(raw),session=this.current(),snapshot=session.snapshot(),epoch=this.revision,chat=session.dialogueRevision();
  if(snapshot.activeNodeId!==expectedNode||snapshot.game&&!snapshot.game.paused||reviewLocked(snapshot))throw new Error('Stellung wurde gewechselt oder ist gesperrt.');
  if(call.function.name==='show_position'||call.function.name==='draw_board'){
   const origin=snapshot.nodes.find(n=>n.id===expectedNode)!,diagram=JSON.parse(call.function.arguments) as BoardDiagram;
   this.illustrate(diagram,expectedNode);
   return {ok:true,fromFen:origin.fen,fen:origin.fen,moves:[],nodeId:expectedNode,diagram};
  }
  const origin=snapshot.nodes.find(n=>n.id===expectedNode)!,planned=JSON.parse(call.function.arguments).moves as string[],board=new Chess(origin.fen);
  // Validate the entire model line before applying its first move.
  for(const san of planned){if(!board.moves().includes(san))throw new Error('Illegale Vorführung verworfen.');board.move(san);}
  let node=expectedNode;const moves:string[]=[];
  const valid=()=>this.current()===session&&this.revision===epoch&&session.dialogueRevision()===chat&&session.snapshot().activeNodeId===node&&(!session.snapshot().game||session.snapshot().game!.paused);
  this.guard=valid;
  const ensure=()=>{if(!valid())throw new Error('Vorführung abgebrochen oder Stellung gewechselt.');};
  const apply=async(san:string)=>{ensure();node=session.play(san);moves.push(san);this.changed(node);if(this.delay)await new Promise(r=>setTimeout(r,this.delay));ensure();};
  for(const san of planned)await apply(san);
  const result=(ok:boolean,extra:Partial<CoachResult>={}):CoachResult=>({ok,fromFen:origin.fen,fen:session.snapshot().nodes.find(n=>n.id===node)!.fen,moves,nodeId:node,...extra});
  if(call.function.name==='play_engine'&&!session.status().gameOver){
   const engine=this.engine(),path=pathTo(session.snapshot(),node),level=snapshot.game?.level??1;this.activeEngine=engine;
   let raw:unknown;try{raw=await engine.move(path[0]!.fen,path.slice(1).map(n=>n.san!),level);}catch{ensure();return result(false,{error:'Die Spielengine konnte nicht antworten; bereits gezeigte Züge bleiben als Lernvariante erhalten.'});}finally{if(this.activeEngine===engine)this.activeEngine=undefined;}
   ensure();const reply=raw as {san?:unknown;level?:unknown;engine?:unknown};
   if(!reply||typeof reply.san!=='string'||!session.legalMoves().includes(reply.san)||reply.level!==level||typeof reply.engine!=='string'||!reply.engine.startsWith(snapshot.game?.opponent==='maia'?'Maia-2':'Stockfish')||reply.engine.length>120)return result(false,{error:'Ungültige Engineantwort verworfen.'});
   await apply(reply.san);return result(true,{engine:reply.engine});
  }
  return result(true);
 }
}
