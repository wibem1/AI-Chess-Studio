import {Chess,type Square} from 'chess.js';
import type {StrategicSide} from './strategic-features.js';
import {localExchange} from './strategic-exchange.js';

/** Static knight regrouping only. Future moves are NOT a legal variation against resistance. */
export interface KnightRoute {
 side:StrategicSide;
 from:string;
 to:string;
 path:string[];
 supportingPawn:string;
 hops:number;
 contestedSquares:string[]; // numerically covered, NOT tactically certified
 firstHopCaptureReplies?:string[]; // concrete legal capture moves on first hop
 firstHopExchange?:{materialSwing:number;line:string[];maxCaptures:number}; // capture-only material bound, NOT position eval
 firstMove?:string; // legal SAN ONLY when this side is actually to move
 warning:'static_route_not_a_variation';
}
const file=(s:string)=>s.charCodeAt(0)-97;
const rank=(s:string)=>Number(s[1]);
const enemy=(side:StrategicSide):StrategicSide=>side==='w'?'b':'w';
const square=(f:number,r:number)=>String.fromCharCode(97+f)+r;
const knightSteps=(s:string)=>[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]
 .map(([df,dr])=>square(file(s)+df!,rank(s)+dr!))
 .filter(t=>file(t)>=0&&file(t)<=7&&rank(t)>=1&&rank(t)<=8);

/** Find at most one short, pawn-supported regrouping per player. */
export function findKnightRoutes(fen:string):KnightRoute[] {
 const board=new Chess(fen);
 if(board.isGameOver()||board.inCheck())return [];
 const pieces=board.board().flat().filter((p):p is NonNullable<typeof p>=>p!==null);
 const occupied=new Set<string>(pieces.map(p=>p.square));
 const output:KnightRoute[]=[];
 for(const side of ['w','b'] as const){
  const pawns=pieces.filter(p=>p.type==='p'&&p.color===side);
  const direction=side==='w'?1:-1;
  // Count all attackers and defenders (chess.js uses pseudo-attacks, including
  // pinned pieces). A contested field is admitted only with CLEARLY more
  // independent defenders, excluding the knight that is itself traveling.
  // Pawn attacks stay vetoes for a long-term knight home regardless of counts.
  const pawnAttack=(sq:string)=>pieces.some(p=>p.color===enemy(side)&&p.type==='p'&&
    Math.abs(file(p.square)-file(sq))===1&&rank(sq)===rank(p.square)-direction);
  const contest=(sq:string,travellingKnight:string)=>{
   const attackers=board.attackers(sq as Square,enemy(side));
   const defenders=board.attackers(sq as Square,side).filter(from=>from!==travellingKnight);
   return {attackers:attackers.length,defenders:defenders.length,enemyPawn:pawnAttack(sq)};
  };
  const eligible=(sq:string,travellingKnight:string)=>{
   const c=contest(sq,travellingKnight);
   return !c.enemyPawn&&(c.attackers===0||c.defenders>c.attackers);
  };
  // A one-ply legal-move check can reject an obviously hanging first hop.
  // It is deliberately NOT a multi-ply SEE, minimax or Stockfish analysis.
  const firstHopCaptureCheck=(knightFrom:string,to:string)=>{
   if(board.turn()!==side)return {safe:true,captureReplies:[] as string[]};
   const trial=new Chess(board.fen());
   const first=trial.moves({verbose:true}).find(m=>m.piece==='n'&&m.from===knightFrom&&m.to===to);
   if(!first)return {safe:false,captureReplies:[] as string[]};
   trial.move(first.san);
   const result=localExchange(trial.fen(),to as Square,side,4);
   // Negative means the opponent has a concrete sequence of legal captures
   // yielding material advantage, even if an intermediate recapture exists.
   return {safe:result.materialSwing>=0,
     captureReplies:result.line.length?[result.line[0]!]:[],
     exchange:result};
  };
  const targets=new Map<string,string>();
  for(const pawn of pawns){
   for(const delta of [-1,1]){
    const f=file(pawn.square)+delta,r=rank(pawn.square)+direction;
    if(f<0||f>7||r<1||r>8)continue;
    if(side==='w'?r<5:r>4)continue;
    const sq=square(f,r);
    if(!occupied.has(sq))targets.set(sq,pawn.square);
   }
  }
  const knights=pieces.filter(p=>p.type==='n'&&p.color===side);
  const candidates:KnightRoute[]=[];
  for(const knight of knights){
   const frontier:Array<{path:string[]}>= [{path:[knight.square]}];
   for(let head=0;head<frontier.length;head++){
    const path=frontier[head]!.path,here=path[path.length-1]!;
    if(path.length>3)continue; // <=2 moves; no long static fantasy routes
    for(const next of knightSteps(here)){
     if(path.includes(next)||occupied.has(next)||!eligible(next,knight.square))continue;
     const first=path.length===1?next:path[1]!;
     const captureCheck=firstHopCaptureCheck(knight.square,first);
     if(!captureCheck.safe)continue;
     let firstMove:string|undefined;
     if(board.turn()===side){
      const legal=board.moves({verbose:true}).find(m=>m.piece==='n'&&m.from===knight.square&&m.to===first);
      if(!legal)continue;
      firstMove=legal.san;
     }
     const nextPath=[...path,next];
     if(targets.has(next)&&nextPath.length>=2){
      const contestedSquares=nextPath.slice(1).filter(sq=>contest(sq,knight.square).attackers>0);
      const candidate:KnightRoute={side,from:knight.square,to:next,path:nextPath,supportingPawn:targets.get(next)!,hops:nextPath.length-1,contestedSquares,warning:'static_route_not_a_variation'};
      if(firstMove!==undefined)candidate.firstMove=firstMove;
      if(captureCheck.captureReplies.length)candidate.firstHopCaptureReplies=captureCheck.captureReplies;
      if('exchange' in captureCheck&&captureCheck.exchange)candidate.firstHopExchange={materialSwing:captureCheck.exchange.materialSwing,line:captureCheck.exchange.line,maxCaptures:captureCheck.exchange.maxCaptures};
      candidates.push(candidate);
     }
     if(nextPath.length<3)frontier.push({path:nextPath});
    }
   }
  }
  // Prefer uncontested routes. An extra defender is not an exchange proof:
  // defenders may be pinned, or an opponent may begin a tactical sequence.
  candidates.sort((a,b)=>a.contestedSquares.length-b.contestedSquares.length||a.hops-b.hops||Math.abs(file(a.to)-3.5)-Math.abs(file(b.to)-3.5)||a.to.localeCompare(b.to)||a.from.localeCompare(b.from));
  if(candidates.length)output.push(candidates[0]!);
 }
 return output;
}
