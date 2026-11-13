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
