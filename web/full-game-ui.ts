import {scanFullGame,type FullGameAnalysis} from '../src/full-game-analysis.js';
import {pathTo} from '../src/game.js';
import {reviewLocked} from '../src/review.js';
import {BrowserTacticalAdapter} from '../src/browser-tactics.js';
import {ServerTacticalAdapter} from '../src/tactics.js';
import type {Session} from '../src/session.js';

export function currentGameLine(session:Session){
 const data=session.snapshot(),end=data.game?.cursor??data.review?.original.at(-1)??data.activeNodeId;
 return pathTo(data,end);
}
export function matchingFullGameAnalysis(session:Session):FullGameAnalysis|undefined{
 const path=currentGameLine(session),report=session.snapshot().fullGameAnalysis;
 return report&&report.rootFen===path[0]?.fen&&JSON.stringify(report.moves)===JSON.stringify(path.slice(1).map(n=>n.san))?report:undefined;
}
/** An explicit local scan: never spends AI tokens and never modifies the played moves. */
export function installFullGameUI(
 parent:HTMLElement,current:()=>Session,
 openPosition:(nodeId:string)=>void,
 prepareQuestion:(question:string)=>void,
 save:()=>Promise<void>,webPlatform:()=>boolean,transport:typeof fetch,
 busy:()=>boolean
){
 const panel=document.createElement('section');panel.id='full-game-analysis';panel.className='full-game-board-panel';panel.setAttribute('aria-label','Stockfish-Partieprüfung');
 panel.innerHTML='<div class="full-game-buttons"><button id="full-game-start" type="button">Partie prüfen (Stockfish)</button><button id="full-game-cancel" type="button" class="secondary" disabled>Abbrechen</button><button id="full-game-ask" type="button" class="secondary" hidden>KI zur Spielqualität befragen</button></div><p id="full-game-status" role="status" aria-live="polite">Gesamtpartieprüfung noch nicht gestartet.</p><details id="full-game-result-details" hidden><summary>Auswertung und kritische Züge</summary><p class="hint">Lokale Prüfung aller gespielten Züge für Weiß und Schwarz. Pro Stellung höchstens Tiefe 12, 20.000 Knoten oder 1 Sekunde; bei langen Partien dauert das einige Minuten. Keine KI-Kosten. Fehlerklassen sind Näherungen, keine Elo- oder Lichess-Genauigkeit.</p><div id="full-game-results"></div></details>';
 parent.after(panel);
 const get=<T extends HTMLElement>(id:string)=>panel.querySelector<T>('#'+id)!;
 const start=get<HTMLButtonElement>('full-game-start'),cancel=get<HTMLButtonElement>('full-game-cancel'),ask=get<HTMLButtonElement>('full-game-ask');
 const results=get<HTMLDivElement>('full-game-results'),status=get<HTMLParagraphElement>('full-game-status'),details=get<HTMLDetailsElement>('full-game-result-details');
 let controller:AbortController|undefined,engine:BrowserTacticalAdapter|ServerTacticalAdapter|undefined,scanning=false;
 function render(){
  const session=current(),report=matchingFullGameAnalysis(session),path=currentGameLine(session);
  results.replaceChildren();ask.hidden=!report;details.hidden=!report;
  if(!report)return;
  for(const player of [report.players.white,report.players.black]){
   const p=document.createElement('p');
   p.textContent=(player.side==='w'?'Weiß':'Schwarz')+': '+player.evaluated+' bewertete Züge; mittlerer Bewertungsverlust '+(player.averageLossCp??'–')+' cp; '+player.inaccuracies+' Ungenauigkeiten, '+player.mistakes+' Fehler, '+player.blunders+' grobe Fehler.';
   results.append(p);
  }
  const issues=report.records.filter(m=>m.lossCp!==null&&m.grade!=='gut').sort((a,b)=>b.lossCp!-a.lossCp!).slice(0,16);
  const heading=document.createElement('p');heading.textContent=issues.length?'Größte Auffälligkeiten (zum Zug springen):':'Nach diesen Grenzwerten keine auffälligen Züge.';results.append(heading);
  for(const item of issues){
   const b=document.createElement('button');b.type='button';b.className='secondary';
   b.textContent=Math.ceil(item.ply/2)+(item.side==='w'?'.':'…')+item.san+' · '+item.grade+' · '+item.lossCp+' cp';
   b.onclick=()=>{const position=path[item.ply-1];if(position)openPosition(position.id);};
   results.append(b);
  }
  const limitations=document.createElement('p');limitations.className='hint';
  limitations.textContent='Schwellen: 50/120/250 Centipawns; Mattwerte auf ±1500 cp begrenzt. Begrenzte Suchtiefe kann falsche Einstufungen bewirken. Analyse wird mit der Partie gespeichert.';
  results.append(limitations);
 }
 start.addEventListener('click',async()=>{
  if(scanning||busy())return;
  const session=current(),data=session.snapshot();
  if(reviewLocked(data)){status.textContent='Im geführten Rückblick erst die komplette Originalpartie freigeben.';return;}
  const path=currentGameLine(session),moves=path.slice(1).map(n=>n.san!);
  if(moves.length<2||moves.length>300){status.textContent='Für die vollständige Prüfung sind 2 bis 300 Halbzüge nötig.';return;}
  scanning=true;controller=new AbortController();engine=webPlatform()?new BrowserTacticalAdapter():new ServerTacticalAdapter(transport);
  start.disabled=true;cancel.disabled=false;
  try{
   const report=await scanFullGame(path[0]!.fen,moves,engine,(done,total)=>{
    if(current()===session)status.textContent='Stockfish prüft die Partie: '+done+' von '+total+' Stellungen.';
   },controller.signal,path.slice(1).map(n=>n.id));
   if(current()!==session)throw new Error('Sitzung gewechselt; Ergebnis verworfen.');
   session.storeFullGameAnalysis(report);
   status.textContent='Vollständige Prüfung gespeichert: '+report.records.length+' Züge. Der KI-Lernchat kann diese Befunde für die Spielqualität verwenden.';
   render();details.open=true;await save();
  }catch(error){status.textContent=error instanceof Error?error.message:'Stockfish-Prüfung fehlgeschlagen.';}
  finally{scanning=false;controller=undefined;engine=undefined;start.disabled=false;cancel.disabled=true;}
 });
 cancel.addEventListener('click',()=>{controller?.abort();if(engine instanceof BrowserTacticalAdapter)engine.cancel();status.textContent='Abbruch angefordert …';});
 ask.addEventListener('click',()=>prepareQuestion('Vergleiche die schachliche Qualität von Weiß und Schwarz in der gesamten Partie. Berücksichtige die gespeicherte Stockfish-Fehlerstatistik, gelungene Ideen, kritische Entscheidungen und die wichtigsten Lernpunkte. Trenne Enginebefunde von deiner strategischen Einschätzung.'));
 return {render,isRunning:()=>scanning};
}
