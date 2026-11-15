import {Session} from './session.js';
import {parsePgn,type PlayerColor} from './review.js';
import {Chess,DEFAULT_POSITION} from 'chess.js';
import {pathTo,type SessionData} from './session.js';
export function importGameFile(text:string,name:string,orientation:PlayerColor='w'):{session:Session;title?:string;format:'json'|'pgn'} {
 if(/\.(png|jpe?g|gif|webp)$/i.test(name))throw new Error('Bitte eine PGN-Partie laden, keine Bilddatei.');
 const content=text.replace(/^\uFEFF/,'').trimStart();
 if(/\.json$/i.test(name)||/^\{\s*(?:"|\})/.test(content))return {session:Session.import(content),format:'json'};
 const parsed=parsePgn(content),session=Session.fromPgn(content,orientation,'','study');
 const title=parsed.headers.White||parsed.headers.Black?`${parsed.headers.White??'Weiß'} – ${parsed.headers.Black??'Schwarz'}`:name.replace(/\.[^.]+$/,'');
 return {session,title,format:'pgn'};
}


/** Export the complete imported game or the current played line as a standards-compliant PGN. */
export function exportSessionPgn(data:SessionData,title='Chess Studio'):string {
 const originalEnd=data.review?.original.at(-1);
 if(!data.game&&data.review?.pgn&&originalEnd){
  const parsed=parsePgn(data.review.pgn),path=pathTo(data,originalEnd);
  if(parsed.moves.length===path.length-1&&parsed.moves.every((move,index)=>move.san===path[index+1]?.san))
   return data.review.pgn.replace(/^\uFEFF/,'').trimEnd()+'\n';
 }
 const end=data.game?.cursor??originalEnd??data.activeNodeId,path=pathTo(data,end);
 const rootFen=path[0]?.fen??DEFAULT_POSITION,board=new Chess(rootFen);
 const sourceHeaders=data.review?.pgn?parsePgn(data.review.pgn).headers:{};
 const opponent=data.game?.opponent==='maia'?'Maia-2':'Stockfish';
 const white=data.game?(data.game.human==='w'?'Mensch':opponent):sourceHeaders.White??'Weiß';
 const black=data.game?(data.game.human==='b'?'Mensch':opponent):sourceHeaders.Black??'Schwarz';
 const headers=[
  'Event',title.trim()||sourceHeaders.Event||'Chess Studio',
  'Site',sourceHeaders.Site??'?',
  'Date',sourceHeaders.Date??'????.??.??',
  'Round',sourceHeaders.Round??'-',
  'White',white,
  'Black',black,
 ];
 if(rootFen!==DEFAULT_POSITION)headers.push('SetUp','1','FEN',rootFen);
 board.header(...headers);
 for(const node of path.slice(1))board.move(node.san!);
 const result=board.isCheckmate()?(board.turn()==='w'?'0-1':'1-0'):board.isDraw()?'1/2-1/2':'*';
 board.header('Result',result);
 return board.pgn({maxWidth:80})+'\n';
}
