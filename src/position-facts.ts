import {Chess} from 'chess.js';
/** Rule facts, not a searched or overall positional evaluation. */
export function positionFacts(fen:string){
 const board=new Chess(fen),material={white:0,black:0},values={p:1,n:3,b:3,r:5,q:9,k:0};
 for(const row of board.board())for(const piece of row)if(piece)material[piece.color==='w'?'white':'black']+=values[piece.type];
 const legal=board.moves({verbose:true});
 return {pieces:board.board().flat().filter(p=>p!==null).map(p=>({square:p.square,type:p.type,color:p.color})),sideToMove:board.turn(),inCheck:board.inCheck(),checkmate:board.isCheckmate(),stalemate:board.isStalemate(),material:{...material,whiteMinusBlack:material.white-material.black},mateInOne:legal.filter(m=>m.san.endsWith('#')).map(m=>m.san),legalCaptures:legal.filter(m=>m.captured).map(m=>({san:m.san,from:m.from,to:m.to,captured:m.captured,enPassant:m.isEnPassant()}))};
}
export type PositionFacts=ReturnType<typeof positionFacts>;
export function describeFacts(f:PositionFacts):string{
 const side=f.sideToMove==='w'?'Weiß':'Schwarz';
 return `Brettfakten (Regelprüfung): ${side} am Zug${f.checkmate?' · schachmatt':f.inCheck?' · im Schach':f.stalemate?' · patt':''}. Material Weiß ${f.material.white}, Schwarz ${f.material.black} (Bauer 1, Springer/Läufer 3, Turm 5, Dame 9; keine Gesamtbewertung).${f.mateInOne.length?` Matt in einem für ${side}: ${f.mateInOne.join(', ')}.`:''}`;
}
/** Bounded rule events for a requested game discussion; captures alone are not mistakes. */
export function historyFacts(history:{rootFen:string;moves:string[]}){
 const board=new Chess(history.rootFen),events:{ply:number;san:string;fen:string;check:boolean;whiteMinusBlack:number;captured?:string}[]=[];
 for(const [index,san] of history.moves.entries()){
  const move=board.move(san);
  if(move.captured||move.promotion||board.inCheck()||move.isKingsideCastle()||move.isQueensideCastle()){
   let difference=0;const values={p:1,n:3,b:3,r:5,q:9,k:0};for(const row of board.board())for(const p of row)if(p)difference+=(p.color==='w'?1:-1)*values[p.type];
   events.push({ply:index+1,san,fen:board.fen(),check:board.inCheck(),whiteMinusBlack:difference,...(move.captured?{captured:move.captured}:{})});
  }
 }
 return events.length>8?Array.from({length:8},(_,i)=>events[Math.round(i*(events.length-1)/7)]!):events;
}
