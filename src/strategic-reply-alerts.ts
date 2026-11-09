import {Chess} from 'chess.js';

/**
 * Look at legal immediate replies to one already-legal move. This is a
 * factual warning, not a ranking, tactical refutation or best-move search.
 * The opponent can choose any other move, and the moving side can respond.
 */
export interface ImmediateReplyAlert {
 san:string;
 kind:'check'|'valuable_capture'|'promotion';
}
export function immediateReplyAlerts(fen:string,firstMoveSan:string):ImmediateReplyAlert[] {
 const board=new Chess(fen);
 if(!board.moves().includes(firstMoveSan))throw new Error('Der erste Zug muss legal sein.');
 board.move(firstMoveSan);
 const alerts:ImmediateReplyAlert[]=[];
 for(const move of board.moves({verbose:true})){
  let kind:ImmediateReplyAlert['kind']|undefined;
  if(move.san.includes('#')||move.san.includes('+'))kind='check';
  else if(move.promotion)kind='promotion';
  else if(move.captured==='q'||move.captured==='r')kind='valuable_capture';
  if(kind)alerts.push({san:move.san,kind});
 }
 // Checks first, then major-piece captures, with deterministic stable order.
 alerts.sort((a,b)=>({check:0,valuable_capture:1,promotion:2}[a.kind]-
                       {check:0,valuable_capture:1,promotion:2}[b.kind])||a.san.localeCompare(b.san));
 return alerts.slice(0,4);
}
