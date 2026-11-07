import {Session} from './session.js';
import {parsePgn,type PlayerColor} from './review.js';
export function importGameFile(text:string,name:string,orientation:PlayerColor='w'):{session:Session;title?:string;format:'json'|'pgn'} {
 if(/\.(png|jpe?g|gif|webp)$/i.test(name))throw new Error('Bitte eine PGN-Partie laden, keine Bilddatei.');
 const content=text.replace(/^\uFEFF/,'').replace(/[\u2028\u2029\u0085]/g,'\n').trimStart();
 if(/\.json$/i.test(name)||content.startsWith('{'))return {session:Session.import(content),format:'json'};
 const parsed=parsePgn(content),session=Session.fromPgn(content,orientation,'','study');
 const title=parsed.headers.White||parsed.headers.Black?`${parsed.headers.White??'Weiß'} – ${parsed.headers.Black??'Schwarz'}`:name.replace(/\.[^.]+$/,'');
 return {session,title,format:'pgn'};
}
