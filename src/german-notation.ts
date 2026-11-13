import {Chess} from 'chess.js';
/** Presentation-only German algebraic notation.
 * Internal SAN, PGN, FEN, chess.js input and model contracts remain standard SAN.
 */
export function germanSan(san:string):string{
 return san.replace(/^[KQRBN]/,piece=>({K:'K',Q:'D',R:'T',B:'L',N:'S'}[piece]!))
  .replace(/=([QRBN])/g,(_match:string,piece:string)=>'='+({Q:'D',R:'T',B:'L',N:'S'}[piece]!));
}
/** A half-move number (ply) expressed with the standard full-move number. */
export function germanMoveLabel(ply:number,san:string):string{
 if(!Number.isSafeInteger(ply)||ply<1)throw new Error('Ungültige Halbzugnummer.');
 return `${Math.ceil(ply/2)}${ply%2===1?'.':'…'} ${germanSan(san)}`;
}
export function germanPositionLabel(ply:number,san:string|null):string{
 return ply===0?'Ausgangsstellung':`nach ${germanMoveLabel(ply,san!)}`;
}
export function germanLine(moves:readonly string[],offsetPly=0):string{
 return moves.map((san,i)=>germanMoveLabel(offsetPly+i+1,san)).join(' · ');
}

/** Number the visible move from its parent position (also supports PGNs
 * starting at a nonstandard move number or with Black to move). */
export function germanMoveFromFen(parentFen:string,san:string):string{
 const fields=parentFen.split(' ');
 const fullmove=Number(fields[5]);
 if(!Number.isSafeInteger(fullmove)||fullmove<1||!['w','b'].includes(fields[1]??''))throw new Error('Ungültige Stellungsnummer.');
 return `${fullmove}${fields[1]==='w'?'.':'…'} ${germanSan(san)}`;
}
export function germanPositionFromFen(parentFen:string|undefined,san:string|null):string{
 return parentFen&&san?`nach ${germanMoveFromFen(parentFen,san)}`:'Ausgangsstellung';
}

export function germanVariation(startFen:string,moves:readonly string[]):string{
 const board=new Chess(startFen),parts:string[]=[];
 for(const san of moves){
  parts.push(germanMoveFromFen(board.fen(),san));
  board.move(san);
 }
 return parts.join(' · ');
}
