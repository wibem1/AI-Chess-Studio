import {Chess} from 'chess.js';

export interface MaiaCandidate {uci:string;p:number}
export interface MaiaPriorMove {from:string;to:string;color:'w'|'b'}
/** Maia-2 Blitz is a move-prediction model, not a tactical chess engine.
 * Keep its human move probabilities, but limit low-probability opening noise
 * and avoid harmless two-ply piece shuttles which the model can rank first.
 */
export function selectMaiaMove(
 fen:string,
 predictions:readonly MaiaCandidate[],
 context:{plies:number;lastOwnMove?:MaiaPriorMove|undefined},
 random:()=>number=Math.random
):string{
 const board=new Chess(fen);
 const legal=new Set(board.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion??'')));
 const ranked=predictions.filter(m=>legal.has(m.uci)&&Number.isFinite(m.p)&&m.p>0)
   .sort((a,b)=>b.p-a.p);
 if(!ranked.length)throw new Error('Maia hat keine gültigen Zugkandidaten geliefert.');
 const isEarly=context.plies<30;
 const previous=context.lastOwnMove;
 // A non-forced reversal is dubious when the moving piece is not under attack.
 // Never suppress a retreat from check, an attacked piece, or the sole option.
 const opponent=board.turn()==='w'?'b':'w';
 const reverse=previous&&!board.isCheck()&&!board.isAttacked(previous.to as 'a1',opponent)
  ?previous:undefined;
 const eligible=reverse?ranked.filter(m=>!(m.uci.slice(0,2)===reverse.to&&m.uci.slice(2,4)===reverse.from)):ranked;
 // If every other move is unusable, keep the model's original legal choices.
 const alternatives=eligible.length&&eligible[0]!.p>=0.015?eligible:ranked;
 const best=alternatives[0]!.p;
 const threshold=isEarly?0.18:0.08;
 const limit=isEarly?4:8;
 const shortlist=alternatives.filter(m=>m.p>=best*threshold).slice(0,limit);
 const total=shortlist.reduce((sum,m)=>sum+m.p,0);
 const value=random();
 const roll=Math.max(0,Math.min(Number.isFinite(value)?value:0,1-Number.EPSILON))*total;
 let cumulative=0;
 for(const move of shortlist){cumulative+=move.p;if(roll<cumulative)return move.uci;}
 return shortlist[shortlist.length-1]!.uci;
}
