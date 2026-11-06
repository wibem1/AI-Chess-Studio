import { Chess } from 'chess.js';
export interface PositionHistory {rootFen:string;moves:string[]}
export function replayHistory(raw:unknown,fen:string):{history:PositionHistory;board:Chess;uci:string[]} {
 if(!raw||typeof raw!=='object')throw new Error('Vollständige Zuggeschichte fehlt.');
 const h=raw as PositionHistory;
 if(typeof h.rootFen!=='string'||h.rootFen.length>150||!Array.isArray(h.moves)||h.moves.length>1000)throw new Error('Zuggeschichte ist ungültig oder zu lang.');
 const board=new Chess(h.rootFen),uci:string[]=[];
 for(const san of h.moves){
  if(typeof san!=='string'||!board.moves().includes(san))throw new Error('Illegale Zuggeschichte.');
  const move=board.move(san);uci.push(move.from+move.to+(move.promotion??''));
 }
 if(board.fen()!==fen)throw new Error('Zuggeschichte passt nicht zur Stellung.');
 return {history:{rootFen:new Chess(h.rootFen).fen(),moves:[...h.moves]},board,uci};
}
