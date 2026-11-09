import {Chess,type Square} from 'chess.js';
import type {StrategicSide} from './strategic-features.js';

/** Static knight regrouping only. Future moves are NOT a legal variation against resistance. */
export interface KnightRoute {
 side:StrategicSide;
 from:string;
 to:string;
 path:string[];
 supportingPawn:string;
 hops:number;
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
 const occupied=new Set(pieces.map(p=>p.square));
 const output:KnightRoute[]=[];
 for(const side of ['w','b'] as const){
  const pawns=pieces.filter(p=>p.type==='p'&&p.color===side);
  const opposingPawns=pieces.filter(p=>p.type==='p'&&p.color===enemy(side));
  const direction=side==='w'?1:-1;
  const attackedByEnemyPawn=(sq:string)=>opposingPawns.some(p=>
    Math.abs(file(p.square)-file(sq))===1&&rank(sq)===rank(p.square)-direction);
  const targets=new Map<string,string>();
  for(const pawn of pawns){
   for(const delta of [-1,1]){
    const f=file(pawn.square)+delta,r=rank(pawn.square)+direction;
    if(f<0||f>7||r<1||r>8)continue;
    if(side==='w'?r<5:r>4)continue;
    const sq=square(f,r);
    if(!occupied.has(sq)&&!attackedByEnemyPawn(sq))targets.set(sq,pawn.square);
   }
  }
  const knights=pieces.filter(p=>p.type==='n'&&p.color===side);
  const candidates:KnightRoute[]=[];
  for(const knight of knights){
   const frontier=[{path:[knight.square]}];
   const visited=new Set([knight.square]);
   for(let head=0;head<frontier.length;head++){
    const path=frontier[head]!.path,here=path[path.length-1]!;
    if(path.length>3)continue; // <=2 moves; no long static fantasy routes
    for(const next of knightSteps(here)){
     if(visited.has(next)||occupied.has(next)||attackedByEnemyPawn(next))continue;
     const first=path.length===1?next:path[1]!;
     let firstMove:string|undefined;
     if(board.turn()===side){
      const legal=board.moves({verbose:true}).find(m=>m.piece==='n'&&m.from===knight.square&&m.to===first);
      if(!legal)continue;
      firstMove=legal.san;
     }
     const nextPath=[...path,next];
     if(targets.has(next)&&nextPath.length>=2){
      const candidate:KnightRoute={side,from:knight.square,to:next,path:nextPath,supportingPawn:targets.get(next)!,hops:nextPath.length-1,warning:'static_route_not_a_variation'};
      if(firstMove!==undefined)candidate.firstMove=firstMove;
      candidates.push(candidate);
     }
     visited.add(next);
     if(nextPath.length<3)frontier.push({path:nextPath});
    }
   }
  }
  // Longer routes are not stronger; favor an immediate and supported maneuver.
  candidates.sort((a,b)=>a.hops-b.hops||a.to.localeCompare(b.to)||a.from.localeCompare(b.from));
  if(candidates.length)output.push(candidates[0]!);
 }
 return output;
}
