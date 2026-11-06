import {Chess} from 'chess.js';
import {PLAY_LEVELS} from './game.js';

/** The same history/level/terminal-position checks for desktop and browser. */
export function preparePlayingPosition(root:unknown,moves:unknown,requestedLevel:unknown) {
 if(typeof root!=='string'||root.length>150||!Array.isArray(moves)||moves.length>500)throw new Error('Ungültige Partiehistorie.');
 const level=PLAY_LEVELS.find(item=>item.level===requestedLevel);
 if(!level)throw new Error('Ungültige Spielstärke.');
 let board:Chess;const uci:string[]=[];
 try{
  board=new Chess(root);
  for(const san of moves){
   if(typeof san!=='string'||!board.moves().includes(san))throw new Error();
   const move=board.move(san);uci.push(move.from+move.to+(move.promotion??''));
  }
 }catch{throw new Error('Ungültige Partiehistorie.');}
 if(board.isGameOver())throw new Error('Partie beendet.');
 const rootFen=new Chess(root).fen();
 return {board,level,position:`position fen ${rootFen}${uci.length?' moves '+uci.join(' '):''}`};
}
export function playingReply(board:Chess,uci:string,engine:string,level:number) {
 if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)||!engine.startsWith('Stockfish')||engine.length>120)throw new Error('Illegale Engineantwort.');
 const move=board.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});
 return {san:move.san,engine,level};
}
