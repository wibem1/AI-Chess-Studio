import {Chess,type Square,type PieceSymbol,type Color} from 'chess.js';

/**
 * A deliberately bounded, legal capture-only minimax on ONE occupied square.
 * Values are material deltas for protectedSide, NOT position evaluations.
 * At any turn the player may decline to exchange; only legal captures count.
 * Pins and checks are handled by chess.js; quiet threats and sacrifices elsewhere
 * are outside this narrow screen. Never describe a nonnegative result as "safe".
 */
const value:Record<PieceSymbol,number>={p:100,n:320,b:330,r:500,q:900,k:20000};
export interface LocalExchangeResult {
 materialSwing:number;
 line:string[];
 capturesExamined:number;
 maxCaptures:number;
 status:'limited_legal_captures_only';
}
export function localExchange(
 fen:string,target:Square,protectedSide:Color,maxCaptures=4
):LocalExchangeResult {
 const board=new Chess(fen);
 if(!board.get(target)||maxCaptures<1||maxCaptures>6)throw new Error('Ungültige Schlagfolgenanfrage.');
 let nodes=0;
 const walk=(position:Chess,depth:number):{score:number;line:string[]}=>{
  if(depth===0)return {score:0,line:[]};
  // Stopping the exchange is always an option for the player to move.
  let best={score:0,line:[] as string[]};
  const maximizing=position.turn()===protectedSide;
  for(const move of position.moves({verbose:true})){
   if(move.to!==target||!move.captured)continue;
   nodes++;
   const child=new Chess(position.fen());
   child.move(move.san);
   const continuation=walk(child,depth-1);
   const signedValue=value[move.captured]*(maximizing?1:-1);
   const candidate={score:signedValue+continuation.score,line:[move.san,...continuation.line]};
   if(maximizing?candidate.score>best.score:candidate.score<best.score)best=candidate;
  }
  return best;
 };
 const outcome=walk(board,maxCaptures);
 return {materialSwing:outcome.score,line:outcome.line,capturesExamined:nodes,maxCaptures,status:'limited_legal_captures_only'};
}
