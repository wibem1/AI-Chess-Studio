import {Chess} from 'chess.js';
/** Rule facts, not a searched or overall positional evaluation. */
export function positionFacts(fen:string){
 const board=new Chess(fen),material={white:0,black:0},values={p:1,n:3,b:3,r:5,q:9,k:0};
 for(const row of board.board())for(const piece of row)if(piece)material[piece.color==='w'?'white':'black']+=values[piece.type];
 const legal=board.moves({verbose:true});
 return {sideToMove:board.turn(),inCheck:board.inCheck(),checkmate:board.isCheckmate(),stalemate:board.isStalemate(),material:{...material,whiteMinusBlack:material.white-material.black},mateInOne:legal.filter(m=>m.san.endsWith('#')).map(m=>m.san),legalCaptures:legal.filter(m=>m.captured).map(m=>({san:m.san,from:m.from,to:m.to,captured:m.captured,enPassant:m.isEnPassant()}))};
}
export type PositionFacts=ReturnType<typeof positionFacts>;
export function describeFacts(f:PositionFacts):string{
 const side=f.sideToMove==='w'?'Weiß':'Schwarz';
 return `Brettfakten (Regelprüfung): ${side} am Zug${f.checkmate?' · schachmatt':f.inCheck?' · im Schach':f.stalemate?' · patt':''}. Material Weiß ${f.material.white}, Schwarz ${f.material.black} (Bauer 1, Springer/Läufer 3, Turm 5, Dame 9; keine Gesamtbewertung).${f.mateInOne.length?` Matt in einem für ${side}: ${f.mateInOne.join(', ')}.`:''}`;
}
