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
 context:{plies:number;recentOwnMoves?:readonly MaiaPriorMove[]|undefined},
 random:()=>number=Math.random
):string{
 const board=new Chess(fen);
 const legal=new Set(board.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion??'')));
 const ranked=predictions.filter(m=>legal.has(m.uci)&&Number.isFinite(m.p)&&m.p>0)
   .sort((a,b)=>b.p-a.p);
 if(!ranked.length)throw new Error('Maia hat keine gültigen Zugkandidaten geliefert.');
 const isEarly=context.plies<30;
 // Check the last move of the specific piece, not just Maia's last move:
 // a pawn move may occur between ...Na6 and ...Nb8.
 const opponent=board.turn()==='w'?'b':'w';
 const canFilter=!board.isCheck();
 const history=context.recentOwnMoves??[];
 const eligible=canFilter?ranked.filter(candidate=>{
  const from=candidate.uci.slice(0,2),to=candidate.uci.slice(2,4);
  const previous=[...history].reverse().find(move=>move.to===from);
  if(!previous||previous.from!==to)return true;
  // A retreat from an attacked square may be tactically necessary.
  return board.isAttacked(from as 'a1',opponent);
 }):ranked;
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
