import {Session} from './session.js';
import {LearningGame} from './game.js';
/** Build a playable copy; callers save the source before switching sessions. */
export function playablePosition(source:Session,options:{human:'w'|'b';level:number;engine:'server'|'browser';opponent:'stockfish'|'maia'},diagramFen?:string):Session{
 const snapshot=source.snapshot(),next=diagramFen?new Session(diagramFen):Session.import(source.export());
 if(next.snapshot().review?.guiding)next.guideReview(false);
 const game=new LearningGame(()=>next);game.start(options.human,options.level,options.engine,options.opponent);
 next.orient(snapshot.orientation??options.human);
 return next;
}
