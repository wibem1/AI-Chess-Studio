import {Chess} from 'chess.js';
import {BrowserUciProcess,type EngineWorker} from './browser-uci.js';
import {replayHistory,type PositionHistory} from './history.js';
import {validateTacticalReport,TACTICAL_LIMITS,type TacticalAdapter} from './tactics.js';
export class BrowserTacticalAdapter implements TacticalAdapter {
 private process:BrowserUciProcess;
 constructor(factory?:()=>EngineWorker){this.process=new BrowserUciProcess(factory);}
 cancel(){this.process.cancel();}
 async check(fen:string,candidate:string|null,history?:PositionHistory){
  let board=new Chess(fen),position=`position fen ${board.fen()}`;
  if(history){const replay=replayHistory(history,fen);board=replay.board;position=`position fen ${replay.history.rootFen}${replay.uci.length?' moves '+replay.uci.join(' '):''}`;}
  if(board.isGameOver())throw new Error('Stellung mit dieser Historie bereits beendet.');
  let selected='';if(candidate!==null){if(typeof candidate!=='string'||!board.moves().includes(candidate))throw new Error('Illegaler Kandidatenzug.');const move=new Chess(fen).move(candidate);selected=' searchmoves '+move.from+move.to+(move.promotion??'');}
  let info:{depth:number;nodes:number;unit:'cp'|'mate';value:number;pv:string[]}|undefined;
  const start=performance.now();
  return this.process.search({position,go:'go depth 12 nodes 20000 movetime 1000'+selected,options:['setoption name MultiPV value 1'],line:line=>{
   if(!line.startsWith('info ')||/lowerbound|upperbound/.test(line))return;
   const depth=/\bdepth (\d+)/.exec(line),nodes=/\bnodes (\d+)/.exec(line),score=/\bscore (cp|mate) (-?\d+)/.exec(line),pv=/\bpv (.+)$/.exec(line);
   if(depth&&nodes&&score&&pv){
    const sequence=pv[1]!.trim().split(/\s+/),probe=new Chess(fen);
    // UCI can report incomplete or stale interim PV lines. Discard them
    // instead of letting one transient line poison the final engine response.
    try{
     for(const uci of sequence.slice(0,64)){
      if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))throw new Error('invalid UCI');
      probe.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});
     }
     info={depth:Number(depth[1]),nodes:Number(nodes[1]),unit:score[1] as 'cp'|'mate',value:Number(score[2]),pv:sequence};
    }catch{/* Ignore incomplete interim search lines. */}
   }
  },complete:(uci,engine)=>{
   if(!info)throw new Error('Stockfish-Prüfung: Keine gültige Hauptvariante im Suchergebnis.');
   // The final bestmove may differ from the last valid info PV on bounded
   // searches (time/node stop). This is not an illegal engine response:
   // retain the validated PV together with its own score and independently
   // verify that the final bestmove is legal for the requested FEN.
   if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))throw new Error('Stockfish-Prüfung: Ungültiger abschließender Zug.');
   const finalBoard=new Chess(fen);
   try{finalBoard.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});}
   catch{throw new Error('Stockfish-Prüfung: Illegaler abschließender Zug.');}
   const replay=new Chess(fen),line:string[]=[];
   for(const uci of info.pv.slice(0,64)){if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))throw new Error('Stockfish-Prüfung: Ungültiger Zug in der Hauptvariante.');const move=replay.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});line.push(move.san);}
   return validateTacticalReport({fen,engine,...(history?{history}:{}),depth:info.depth,nodes:info.nodes,elapsedMs:Math.round(performance.now()-start),score:{unit:info.unit,value:info.value*(board.turn()==='w'?1:-1),perspective:'white'},line,candidate,limits:TACTICAL_LIMITS},fen);
  }});
 }
}
