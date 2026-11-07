import {CoachBoard} from '../src/coach-board.js';
import {TOOL_RECORD} from '../src/coach-tools.js';
import {renderLearningReplay,learningLine} from './learning-replay.js';
import {MaiaPlayingEngine} from './maia-engine.js';
import {MAIA_PROFILES} from '../src/maia-files.js';
import {platformFetch,platformReady,isWebPlatform,browserRuntime} from './platform.js';
import {AutoSave} from './autosave.js';
import {installPwa} from './pwa.js';
import { Chess, type Square } from 'chess.js';
import { Studio, SimulationAdapter, type SimulationMode,type DialogueTopic } from '../src/dialogue.js';
import { ServerModelAdapter } from '../src/model-client.js';
import { checkTactics, ServerTacticalAdapter } from '../src/tactics.js';
import { LearningGame, ServerPlayingEngine, pathTo } from '../src/game.js';
import type {HintMode} from '../src/learning.js';
import './style.css';
import {BrowserPlayingEngine} from '../src/browser-engine.js';
import { installReviewUI } from './review-ui.js';
import { reviewLocked,visibleReviewNodes } from '../src/review.js';
import { installNavigation } from './navigation.js';
import { installPagePan } from './page-pan.js';
import { installScrollHelp } from './scroll-help.js';
import { APP_VERSION } from '../src/version.js';
import { installBoardDrag } from './board-drag.js';
import {installGameLibrary} from './game-library.js';
import {installFontScale} from './font-scale.js';

document.getElementById('app-version')!.textContent = `Version ${APP_VERSION}`;
document.title = `AI-Chess-Studio ${APP_VERSION}`;
installFontScale();
const studio = new Studio();
let initialized=false;
const autosave=new AutoSave(browserRuntime.store,()=>({json:studio.session.export(),question:text('question').value}),value=>message('autosave-status',value));
const game=new LearningGame(()=>studio.session);
const browserEngine=new BrowserPlayingEngine();
const maiaEngine=new MaiaPlayingEngine(value=>message('game-feedback',value));
function updatePlayingChoice(){
 const maia=$<HTMLSelectElement>('game-opponent').value==='maia';
 message('playing-title',maia?'Gegen Maia spielen':'Gegen Stockfish spielen');
 document.querySelector('label[for=game-level]')!.textContent=maia?'Maia-Spielprofil':'Engine-Spielstärke';
 for(const [i,option] of [...$<HTMLSelectElement>('game-level').options].entries())option.textContent=maia?`Profil ${MAIA_PROFILES[i]}`:`Level ${i+1}${i===0?' · reduziert':i===4?' · stärkste Stufe hier':''}`;
 message('game-strength-hint',maia?'Maia-2 Blitz sagt menschliche Züge voraus. Profile sind Trainingsstärken, keine Elo-Zusage und keine Einschätzung deiner Stärke. Erster Einsatz: etwa 60 MB laden, danach lokal gespeichert. Die ersten Eröffnungszüge sind weniger verlässlich.':'Stockfish Lite, Skill Level 0/5/10/15/20; keine Elo-Zusage. Auch die reduzierte Stufe kann stark sein. Bisherige Varianten bleiben beim Start erhalten.');
 $('engine-options').hidden=maia||isWebPlatform();
}

const desktopEngine=new ServerPlayingEngine();
let enginePending=false;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => $<HTMLInputElement>(id);
const text = (id: string) => $<HTMLTextAreaElement>(id);
let selected: Square | null = null;
let shownMove:{node:string;from:string;to:string}|undefined;
let coachAnchor:{session:typeof studio.session;node:string}|undefined,pendingCoachAnchor:typeof coachAnchor;
let pending = false,chatStopped=false;let activeAdapter:ServerModelAdapter|undefined;
const coachBrowserEngine=new BrowserPlayingEngine(),coachMaiaEngine=new MaiaPlayingEngine(value=>{if(pending&&!chatStopped)message('dialogue-feedback',value);});
const coachBoard=new CoachBoard(()=>studio.session,()=>studio.session.snapshot().game?.opponent==='maia'?coachMaiaEngine:(studio.session.snapshot().game?.engine??$<HTMLSelectElement>('engine-location').value)==='browser'?coachBrowserEngine:desktopEngine,node=>{if(pendingCoachAnchor){coachAnchor=pendingCoachAnchor;pendingCoachAnchor=undefined;}const d=studio.session.snapshot(),n=d.nodes.find(n=>n.id===node)!,parent=d.nodes.find(p=>p.id===n.parentId)!;const move=new Chess(parent.fen).move(n.san!);shownMove={node,from:move.from,to:move.to};render();});
let directAnalysisHint:'explain'|undefined;
let tacticalPending = false;
let modelAvailable = false;
let modelConfigured=false,modelSaved=false,modelBlocked='Kein KI-Zugang eingerichtet.';
let dialogueChosen=false,accessRevision=0,accessReady=false,accessReadError=false;
const modelMode = () => $<HTMLSelectElement>('dialogue-mode').value === 'model';
try{const choice=localStorage.getItem('chess-studio-dialogue-mode');if(choice==='model'||choice==='simulation'){$<HTMLSelectElement>('dialogue-mode').value=choice;dialogueChosen=true;}}catch{}
function chooseModelMode(value:'model'|'simulation'){
 $<HTMLSelectElement>('dialogue-mode').value=value;dialogueChosen=true;
 try{localStorage.setItem('chess-studio-dialogue-mode',value);}catch{}
 updateMode();
}
function updateMode() {
 $('coach-stop').hidden=!pending;
 $('coach-origin').hidden=!coachAnchor||coachAnchor.session!==studio.session||coachAnchor.node===studio.session.snapshot().activeNodeId;
 $<HTMLButtonElement>('clear-dialogue').disabled=!pending&&!studio.session.snapshot().annotations.some(a=>a.kind==='dialogue');
 const real=modelMode(),locked=reviewLocked(studio.session.snapshot()),blocked=real&&!modelAvailable||!accessReady||accessReadError;
 $<HTMLButtonElement>('ask').textContent=real?'Nachricht senden (reale KI)':'Nachricht senden (Simulation)';
 $<HTMLButtonElement>('ask').disabled=pending||locked||blocked;
 for(const id of ['analyse-position','analyse-game'])$<HTMLButtonElement>(id).disabled=pending||locked||blocked;
 $<HTMLButtonElement>('comment-move').disabled=$<HTMLButtonElement>('ask').disabled||!studio.session.snapshot().nodes.find(n=>n.id===studio.session.snapshot().activeNodeId)?.san;
 $('comment-move').textContent=real?'Zug kommentieren':'Zug kommentieren (Simulation)';
 $('simulation-hint').hidden=real||!accessReady||accessReadError;
 $('learn-configure').hidden=modelAvailable;
 message('mode-badge',!accessReady?'Lernchat: Zugang wird geprüft':accessReadError?'Lernchat: Status unklar':real?(modelAvailable?'Lernchat: Eigene KI':'Lernchat: KI gesperrt'):'Lernchat: Demo');
 message('chat-access',!accessReady?'Gespeicherter KI-Zugang wird lokal geprüft …':accessReadError?modelBlocked:real?(modelAvailable?'Eigener KI-Zugang aktiv · bis zu 3 kostenpflichtige Anfragen je Nachricht · Kostenlimits gelten.':modelBlocked):modelSaved||modelConfigured?'Demo ist ausdrücklich gewählt. Dein gespeicherter KI-Zugang bleibt erhalten.':'Demo: nur lokale Brettfakten, keine KI-Analyse.');
 $('chat-use-model').hidden=real||!(modelSaved||modelConfigured);
 $('chat-open-access').hidden=!real||modelAvailable;
 $('chat-open-access').textContent='KI-Zugang prüfen';
}
async function refreshModelStatus() {
 const revision=++accessRevision;
 try{
  const response=await platformFetch('/api/status',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();
  const status=await response.json();if(revision!==accessRevision)return;
  accessReady=true;accessReadError=false;
  modelConfigured=status.available===true;modelSaved=status.saved===true||modelConfigured;
  modelAvailable=modelConfigured;
  modelBlocked=status.locked?'Schlüssel gespeichert, aber gesperrt. In den Einstellungen entsperren.':'Kein aktiver KI-Zugang. In den Einstellungen den gespeicherten Schlüssel prüfen.';
  message('model-status',modelAvailable?'KI-Zugang konfiguriert, noch kein Verbindungsnachweis. Kosten werden als Schätzung angezeigt.':modelBlocked);
  if((modelConfigured||modelSaved)&&!dialogueChosen)$<HTMLSelectElement>('dialogue-mode').value='model';
 }catch{if(revision!==accessRevision)return;accessReady=true;accessReadError=true;modelAvailable=false;modelBlocked='KI-Status konnte nicht gelesen werden. Zugang und Diagnose prüfen.';message('model-status',modelBlocked);}
 updateMode();
}
$('dialogue-mode').addEventListener('change',()=>chooseModelMode(modelMode()?'model':'simulation'));
$('chat-use-model').addEventListener('click',()=>{chooseModelMode('model');void refreshModelStatus();});
function message(id: string, value: string) { $(id).textContent = value; }
function attempt(action: () => void, target: string, success: string) {
  try { action(); selected = null; render(); message(target, success); }
  catch (error) { message(target, error instanceof Error ? error.message : 'Vorgang fehlgeschlagen.'); }
}
function move(value: string | { from: string; to: string; promotion: string }) {
  attempt(() => {
    if(reviewLocked(studio.session.snapshot()))throw new Error('Zuerst deine Gedanken festhalten oder den Originalzug ausdrücklich aufdecken.');
    if (studio.session.status().gameOver) throw new Error('Partie beendet. Wähle eine frühere Stellung für eine neue Variante.');
    try{game.play(value);}catch(error){if(error instanceof Error && /^(Stockfish|Maia) ist am Zug/.test(error.message))throw error;throw new Error('Dieser Zug ist hier nicht legal. Prüfe Eingabe und Stellung.');}
    input('move').value = '';
  }, 'move-feedback', 'Zug gespielt.');
  void engineTurn();
}
const cancelBoardDrag = installBoardDrag($('board'), () => {
  const data = studio.session.snapshot();
  return data.nodes.find(node => node.id === data.activeNodeId)!.fen;
}, (from, to) => move({ from, to, promotion: $<HTMLSelectElement>('promotion').value }));
installScrollHelp(cancelBoardDrag);
installPagePan();
const reviewUI=installReviewUI(()=>studio.session,next=>{game.pause();studio.session=next;selected=null;},render);
$('board-flip').addEventListener('click',()=>{const data=studio.session.snapshot();studio.session.orient((data.orientation??data.game?.human??'w')==='w'?'b':'w');render();});
function render() {
  if(coachBoard.checkSelection()){studio.cancelAsk();activeAdapter?.cancel();}
  cancelBoardDrag();
  const data = studio.session.snapshot();
  const current = data.nodes.find(n => n.id === data.activeNodeId)!;
  const chess = new Chess(current.fen);
  const status = studio.session.status();
  const live=data.review?.guiding?undefined:data.game;
  const allowed=visibleReviewNodes(data),locked=reviewLocked(data);
  $('game-undo').hidden=$('workspace').dataset.activeView!=='play';
  $<HTMLButtonElement>('game-undo').disabled=!game.canTakeBack();
  const learning=$('workspace').dataset.activeView==='learn';
  $('learning-controls').hidden=!learning;$('learning-chat').hidden=!learning;
  renderLearningReplay(data,game,()=>{selected=null;render();});
  message('workbench-status',learning?'Lernmodus · Züge ausprobieren und mit der Lernengine besprechen. Die Partie bleibt unverändert.':live?(live.paused?'Partie pausiert · Zum Fortsetzen Spielmodus wählen.':'Spielmodus · Schachengine ist dein Gegner.'):'Spielmodus · Starte rechts eine Partie gegen die Schachengine.');
  $<HTMLButtonElement>('learn-back').disabled=!current.parentId||locked;
  $<HTMLButtonElement>('learn-origin').disabled=locked;
  if(data.game)$<HTMLSelectElement>('game-opponent').value=data.game.opponent??'stockfish';
  updatePlayingChoice();
  if(live){
    const opponent=live.opponent==='maia'?'Maia-2':'Stockfish';
    const end=studio.session.status(live.cursor);
    message('game-status',`Du spielst ${live.human==='w'?'Weiß':'Schwarz'} · ${live.opponent==='maia'?`Maia-Profil ${MAIA_PROFILES[live.level-1]}`:`Level ${live.level}`} · ${live.engine==='browser'?'Browser-Engine':'Desktop-Engine'} · ${end.checkmate?'Partie beendet: Schachmatt':end.draw?'Partie beendet: Remis':live.paused?'Analysemodus · Partie pausiert':enginePending?`${opponent} denkt …`:'Partie läuft'} · Partiestellung ${live.cursor}`);
  }else message('game-status',data.review?'Importierte menschliche Partie. Kein Enginegegner gestartet.':'Noch keine Enginepartie gestartet. Das Brett kann frei untersucht werden.');
  $<HTMLButtonElement>('game-pause').disabled=!live || live.paused;
  $<HTMLSelectElement>('engine-location').disabled=enginePending;$<HTMLSelectElement>('game-opponent').disabled=enginePending;
  if(data.game?.engine)$<HTMLSelectElement>('engine-location').value=data.game.engine;
  $<HTMLButtonElement>('game-resume').disabled=!live;
  message('game-line',live ? pathTo(data,live.cursor).filter(n=>n.san).map(n=>n.san).join(' · ') || 'Die Anfangsstellung ist bereit.' : data.review?'Importierte Originalpartie · geführter Rückblick im Tab Lernen.':'Deine Partie beginnt hier.');
  const mainIds=new Set(live?pathTo(data,live.cursor).slice(pathTo(data,live.cursor).findIndex(n=>n.id===live.start)).map(n=>n.id):[]);
  message('position-status', `${current.id} · ${chess.turn() === 'w' ? 'Weiß' : 'Schwarz'} am Zug${status.checkmate ? ' · Schachmatt' : status.draw ? ' · Remis' : status.check ? ' · Schach' : ''}`);
  const pieces: Record<string, string> = { wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟' };
  const names: Record<string, string> = { k:'König',q:'Dame',r:'Turm',b:'Läufer',n:'Springer',p:'Bauer' };
  const targets = selected && !status.gameOver ? chess.moves({ square: selected, verbose: true }).map(m => m.to) : [];
  const board = $('board'); board.replaceChildren();
  const flipped=(data.orientation??live?.human)==='b';
  message('position-status',$('position-status').textContent+` · ${flipped?'Schwarz':'Weiß'} unten${data.review&&status.repetition?' · '+status.repetitionCount+'-fache Wiederholung'+(status.fivefold?' · automatisches Remis':' · Remisanspruch möglich'):''}`);
  const ranks=flipped?chess.board().slice().reverse().map(row=>row.slice().reverse()):chess.board();
  for (const [rankIndex, rank] of ranks.entries()) {
    for (let file = 0; file < 8; file++) {
      const square = `${'abcdefgh'[flipped?7-file:file]}${flipped?rankIndex+1:8-rankIndex}` as Square;
      const piece = rank[file];
      const button = document.createElement('button'); button.type = 'button';
      button.className = `${(rankIndex + file) % 2 ? 'dark' : ''} ${targets.includes(square) ? 'target' : ''}`;
      if(shownMove?.node===current.id&&(square===shownMove.from||square===shownMove.to))button.classList.add('coach-move');
      button.setAttribute('aria-label', `${square}: ${piece ? `${piece.color === 'w' ? 'Weiß' : 'Schwarz'} ${names[piece.type]}` : 'leer'}`);
      button.setAttribute('aria-pressed', String(selected === square));
      button.dataset.square = square;
      button.textContent = piece ? pieces[piece.color + piece.type]! + '\uFE0E' : '';
      const coordinate = document.createElement('small'); coordinate.textContent = square; button.append(coordinate);
      button.addEventListener('click', () => {
        if (selected === square) { selected = null; render(); }
        else if (selected && piece?.color !== chess.turn()) {
          move({ from: selected, to: square, promotion: $<HTMLSelectElement>('promotion').value });
        } else { selected = square; render(); }
      });
      board.append(button);
    }
  }
  message('legal-moves', status.gameOver ? 'Partie beendet.' : studio.session.legalMoves().join(', '));
  $<HTMLButtonElement>('tactical-check').disabled = tacticalPending || status.gameOver || locked || !!data.review&&status.repetition;
  message('tactical-limits-hint',data.review?'Stockfish 19 Lite · begrenzter Faktencheck auf Aufruf mit vollständiger Zuggeschichte. Wiederholungen werden historisch geprüft; bei Remisanspruch keine isolierte Endspielbewertung.':'Stockfish 19 Lite · 1 Thread · 16 MiB Hash · höchstens Tiefe 12, 20.000 Knoten oder 1 Sekunde Suchzeit. Aktuelle FEN, ohne Wiederholungshistorie.');
  const reports = $('tactical-results'); reports.replaceChildren();
  for (const a of data.annotations.filter(a => !locked && a.nodeId === current.id && a.kind === 'factcheck')) {
    const r = a.engine!;
    const article = document.createElement('article'); article.className = 'entry';
    const meta = document.createElement('small'); meta.textContent = a.text.startsWith(TOOL_RECORD)?'App · Brettaktion':`${a.nodeId} · ${r.engine} · Lokaler Suchbefund`;
    const result = document.createElement('div');
    const score = r.score.unit === 'cp' ? `${r.score.value} Centipawns (positive Werte für Weiß)`
      : `Mattdistanz ${Math.abs(r.score.value)} für ${r.score.value > 0 ? 'Weiß' : 'Schwarz'}`;
    result.textContent = `Suchwert: ${score}\nUntersuchte Variante: ${r.line.join(' ')}\n${r.candidate ? `Geprüfter eigener Kandidat: ${r.candidate}` : 'Stellung untersucht, keine Zugvorgabe.'}\nErreicht: Tiefe ${r.depth}, ${r.nodes} Knoten, ${r.elapsedMs} ms einschließlich Engine-Start.\nGrenzen: Tiefe 12 / 20.000 Knoten / 1 Sekunde Suchzeit, 1 Thread, 16 MiB Hash.\n${r.history?'Vollständige Zuggeschichte berücksichtigt ('+r.history.moves.length+' Halbzüge).':'FEN ohne Wiederholungshistorie.'} Keine strategische Freigabe.`;
    article.append(meta,result); reports.append(article);
  }

  const variants = $('variations'); variants.replaceChildren();
  // Build iteratively so deeply imported lines do not overflow the render stack.
  const lists = new Map<string | null, HTMLUListElement>();
  const rootList = document.createElement('ul'); lists.set(null, rootList); variants.append(rootList);
  for (const node of data.nodes.filter(n=>allowed.has(n.id))) {
    const li = document.createElement('li'); const button = document.createElement('button');
    button.textContent = `${node.id} · ${data.labels?.[node.id] ?? node.san ?? 'Ausgangsstellung'}${mainIds.has(node.id)?' · Partie':data.review?.original.includes(node.id)?' · Original':''}`;
    button.setAttribute('aria-current', String(node.id === current.id));
    button.addEventListener('click', () => { game.analyse(node.id); selected = null; render(); message('move-feedback', 'Stellung gewechselt.'); });
    li.append(button); lists.get(node.parentId)!.append(li);
    const children = document.createElement('ul'); li.append(children); lists.set(node.id, children);
  }
  const reflection=data.reflections?.[current.id];
  text('learning-idea').value=reflection?.idea??'';text('learning-reasoning').value=reflection?.reasoning??'';
  input('learning-uncertainty').value=reflection?.uncertainty??'';input('learning-goal').value=reflection?.goal??'';$<HTMLSelectElement>('learning-hint').value=reflection?.hintMode??'explain';
  input('variant-label').value=data.labels?.[current.id]??'';
  renderComparison();
  const dialoguePath=new Set(pathTo(data,current.id).map(n=>n.id));
  message('dialogue-anchor',`Gespräch zur Stellung ${current.id}${data.labels?.[current.id]?' · '+data.labels[current.id]:''}. Das bisherige Gespräch bleibt mit seinem jeweiligen Stellungsbezug sichtbar.`);
  for (const [kind, id] of [['dialogue', 'dialogue'], ['memory', 'memories']] as const) {
    const container = $(id); container.replaceChildren();
    for (const a of data.annotations.filter(a => a.kind===kind && (kind==='dialogue'?allowed.has(a.nodeId):a.nodeId===current.id))) {
      const entry = document.createElement('article'); entry.className = 'entry';
      const meta = document.createElement('small');
      meta.textContent = a.text.startsWith(TOOL_RECORD)?'App · Brettaktion':`${a.nodeId} · ${a.source === 'human' ? 'Mensch' : a.source === 'simulation' ? 'Simulation · Keine reale KI' : 'Modell'} · ${a.hypothesis ? 'Hypothese' : 'Eigene Eingabe'}`;
      const body = document.createElement('div');
      const [answer,details]=a.text.split('\n\nAnalyse-Details:');body.textContent=answer!.startsWith(TOOL_RECORD)?answer!.slice(TOOL_RECORD.length):answer!;
      entry.append(meta,body);
      if(kind==='dialogue'&&a.source==='model'&&!locked)for(const san of a.suggestions??[]){
        const show=document.createElement('button');show.type='button';show.textContent=`Zug zeigen: ${san}`;
        show.addEventListener('click',()=>attempt(()=>{game.analyse(a.nodeId);const board=new Chess(data.nodes.find(n=>n.id===a.nodeId)!.fen),shown=board.move(san);const node=game.play(san);shownMove={node,from:shown.from,to:shown.to};},'move-feedback',`${san} im Lernzweig gezeigt. Die Partie bleibt unverändert.`));entry.append(show);
      }
      if(kind==='dialogue'&&a.source==='model'&&a.text.startsWith('Partierückblick\n')&&!locked){
        const line=pathTo(data,a.nodeId);
        for(const match of a.text.matchAll(/^(\d+)(…|\.) (\S+)$/gm)){
          const node=line.find(n=>{const parent=line.find(p=>p.id===n.parentId);return parent&&parent.fen.split(' ')[5]===match[1]&&(parent.fen.split(' ')[1]==='b'?'…':'.')===match[2]&&n.san===match[3];});
          if(node?.parentId){const before=node.parentId,button=document.createElement('button');button.type='button';button.textContent=`Vor ${match[0]} ansehen`;button.onclick=()=>{game.analyse(before);render();$('board').scrollIntoView({block:'start'});};entry.append(button);}
        }
      }
      if(details){const disclosure=document.createElement('details'),summary=document.createElement('summary'),detail=document.createElement('div');summary.textContent='Denkwege und fachliche Einordnung';detail.textContent=details;disclosure.append(summary,detail);entry.append(disclosure);}
      if(kind==='dialogue' && a.nodeId!==current.id){const jump=document.createElement('button');jump.textContent=`Stellung ${a.nodeId} ansehen`;jump.addEventListener('click',()=>{game.analyse(a.nodeId);render();});entry.append(jump);}
      if (a.openQuestions.length) { const questions = document.createElement('p'); questions.textContent = `Offen: ${a.openQuestions.join(' / ')}`; entry.append(questions);if(kind==='dialogue' && a.source!=='human')for(const q of a.openQuestions.slice(0,2)){const follow=document.createElement('button');follow.textContent=`Rückfrage aufgreifen: ${q}`;follow.addEventListener('click',()=>{text('question').value=q;text('question').focus();});entry.append(follow);} }
      container.append(entry);
    }
  }
  reviewUI.render(data);
  updateMode();
  if(initialized&&isWebPlatform())void autosave.save().catch(()=>{});
}
$('move-form').addEventListener('submit', event => { event.preventDefault(); move(input('move').value.trim()); });
$('memory-form').addEventListener('submit', event => {
  event.preventDefault();
  attempt(() => {
    if (!text('memory').value.trim()) throw new Error('Bitte eine Notiz eingeben.');
    studio.session.annotate({ nodeId: studio.session.snapshot().activeNodeId, kind: 'memory', source: 'human',
      text: text('memory').value.trim(), hypothesis: input('hypothesis').checked,
      openQuestions: input('open-question').value.trim() ? [input('open-question').value.trim()] : [] });
    text('memory').value = ''; input('open-question').value = '';
  }, 'dialogue-feedback', 'Notiz an dieser Stellung gespeichert.');
});
$('coach-origin').addEventListener('click',()=>{if(!coachAnchor||coachAnchor.session!==studio.session)return;chatStopped=true;studio.cancelAsk();coachBoard.cancel();activeAdapter?.cancel();game.analyse(coachAnchor.node);render();message('dialogue-feedback','Zum Ausgangspunkt der Vorführung zurückgekehrt. Die Variante bleibt erhalten.');});
$('coach-stop').addEventListener('click',()=>{chatStopped=true;studio.cancelAsk();coachBoard.cancel();activeAdapter?.cancel();message('dialogue-feedback','Angehalten. Bereits gezeigte Züge bleiben als Lernvariante erhalten.');});
$('clear-dialogue').addEventListener('click',async()=>{
 if(!confirm('Chatverlauf dieser Partie auf allen Varianten löschen? Partie und eigene Notizen bleiben erhalten. Bereits gespeicherte Partiekopien bleiben unverändert.'))return;
 studio.session.clearDialogue();coachBoard.cancel();activeAdapter?.cancel();render();
 try{if(initialized&&isWebPlatform())await autosave.save();message('dialogue-feedback','Chatverlauf dieser Partie gelöscht.');}
 catch{message('dialogue-feedback','Chatverlauf in dieser Sitzung gelöscht. Automatisches Speichern fehlgeschlagen; Sitzung als Datei sichern.');}
});
$('dialogue-form').addEventListener('submit', async event => {
  event.preventDefault(); if (pending || (modelMode() && !modelAvailable)) return;
  const real = modelMode();
  game.pause();
  const question = text('question').value,hintOverride=directAnalysisHint;directAnalysisHint=undefined;
  const session = studio.session,chatRevision=session.dialogueRevision();
  chatStopped=false;pending = true;updateMode();
  message('dialogue-feedback', `${real ? 'Modellanfrage' : 'Simulation'} läuft … Stellungswechsel ist weiterhin möglich.`);
  try {
    activeAdapter=real?new ServerModelAdapter(platformFetch):undefined;let toolStarted=false;
    const result = await studio.ask(question, activeAdapter??new SimulationAdapter($<HTMLSelectElement>('simulation-mode').value as SimulationMode),'chat',hintOverride,real?async(call,node)=>{if(!toolStarted){pendingCoachAnchor={session,node};toolStarted=true;}message('dialogue-feedback',call.function.name==='play_engine'?'Vorführung läuft; die Spielengine antwortet …':'Zugfolge wird am Brett vorgeführt …');const result=await coachBoard.execute(call,node);if(!chatStopped)message('dialogue-feedback','Brettergebnis liegt vor; die Lernengine erläutert es …');return result;}:undefined);
    message('dialogue-feedback', result === 'stored' ? `${real ? 'Modellantwort' : 'Beispielantwort'} an der angefragten Stellung gespeichert.` : chatStopped?'Angehalten. Gezeigte Züge bleiben als Lernvariante erhalten.':'Veraltete Antwort nach Sitzungs- oder Chatwechsel verworfen.');
    render();
  } catch (error) {
    message('dialogue-feedback', chatStopped?'Angehalten. Gezeigte Züge bleiben als Lernvariante erhalten.':studio.session !== session ? 'Veraltete Anfrage nach Sitzungswechsel verworfen.' : session.dialogueRevision()!==chatRevision ? 'Chatverlauf gelöscht; die frühere Anfrage wurde nicht übernommen.' : (error instanceof Error ? error.message : 'Anfrage fehlgeschlagen.')+' Die bisherigen Chatbeiträge stammen von früheren Anfragen.');
  } finally { pending = false;activeAdapter=undefined; updateMode(); if (real) {void refreshModelStatus();void refreshCosts();} }
});
$('export').addEventListener('click', () => {
  text('session-json').value = studio.session.export();
  const blob = new Blob([studio.session.export()], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = 'schachlabor-sitzung.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('storage-feedback', 'JSON bereitgestellt und als Datei exportiert.');
});
$('import').addEventListener('click', () => attempt(() => restoreSession(text('session-json').value), 'storage-feedback', 'Sitzung wiederhergestellt.'));
render();

$('session-file').addEventListener('change', async () => {
  const file = $<HTMLInputElement>('session-file').files?.[0];
  if (!file) return;
  try {
    const json = await file.text();
    attempt(() => { restoreSession(json); text('session-json').value = json; }, 'storage-feedback', 'Sitzung aus Datei wiederhergestellt.');
  } catch { message('storage-feedback', 'Datei konnte nicht gelesen werden.'); }
  $<HTMLInputElement>('session-file').value = '';
});

$('tactical-form').addEventListener('submit', async event => {
  event.preventDefault(); if (tacticalPending) return;
  const session = studio.session;
  tacticalPending = true; render();
  message('tactical-feedback', 'Lokaler Faktencheck läuft … Stellungswechsel ist weiterhin möglich.');
  try {
    const result = await checkTactics(session, () => studio.session, new ServerTacticalAdapter(platformFetch), input('tactical-candidate').value.trim() || null);
    message('tactical-feedback', result === 'stored' ? 'Suchbefund an der angefragten Stellung gespeichert.' : 'Veralteter Suchbefund nach Sitzungswechsel verworfen.');
  } catch (error) {
    message('tactical-feedback', studio.session !== session ? 'Veralteter Faktencheck verworfen.' : error instanceof Error ? error.message : 'Faktencheck fehlgeschlagen.');
  } finally { tacticalPending = false; render(); }
});

$<HTMLDetailsElement>('vault-setup').addEventListener('toggle',()=>{
 const active=$<HTMLDetailsElement>('vault-setup').open;input('vault-password').disabled=!active;if(!active)input('vault-password').value='';
});
$('api-form').addEventListener('submit', async event => {
  event.preventDefault();
  const fail=(value:string)=>{message('api-feedback',value);$('api-feedback').focus({preventScroll:false});};
  const apiKey=input('api-key').value.trim(),model=input('api-model').value.trim();
  if(apiKey.length<8||apiKey.length>1024||/\s/.test(apiKey)){fail('Bitte den API-Schlüssel im Feld „OpenAI-API-Schlüssel“ eingeben. Ein Gerätepasswort ist dafür nicht nötig.');return;}
  if(!/^[a-zA-Z0-9._:-]{1,100}$/.test(model)){fail('Bitte ein gültiges Modell angeben, zum Beispiel gpt-4.1-mini.');return;}
  if (!input('api-cost-consent').checked){fail('Zum Speichern und Aktivieren bitte die Freigabe für Modellanfragen bestätigen. Das Speichern selbst startet keine KI-Anfrage.');return;}
  const password=$<HTMLDetailsElement>('vault-setup').open?input('vault-password').value:'';

  const button = $<HTMLButtonElement>('api-connect');
  if (button.disabled) return;
  button.disabled = true;
  $('api-form').setAttribute('aria-busy', 'true');
  accessRevision++;
  const payload = {action:'connect',apiKey,model,allowPaid:true,...(isWebPlatform()?{password}:{})};
  input('api-key').blur(); // Dismiss the touch keyboard before waiting for the local store.
  message('api-feedback','Schlüssel wird lokal gespeichert und die Speicherung geprüft … Du kannst die Seite weiterhin scrollen.');
  $('api-feedback').focus();
  try {
    const response = await platformFetch('/api/model-config', { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload), signal:AbortSignal.timeout(15000) });
    if (!response.ok && isWebPlatform()) throw new Error((await response.json()).error);
    if (!response.ok) throw new Error(response.status === 429
      ? 'Eine Modellanfrage läuft. Bitte nach deren Ende erneut speichern.'
      : response.status === 500
        ? 'Der lokale Schlüsselspeicher konnte nicht schreiben. Die Speicherung ist nicht bestätigt.'
        : 'Schlüssel oder Modell ungültig; die Speicherung ist nicht bestätigt.');
    const status = await response.json();
    if (status.available !== true) throw new Error('Die Speicherung ist nicht bestätigt. Bitte die lokale Diagnose öffnen.');
    input('api-key').value='';input('vault-password').value='';input('api-cost-consent').checked=false;
    modelAvailable = status.available === true;
    accessReady=true;accessReadError=false;modelConfigured=true;modelSaved=true;chooseModelMode('model');
    message('credential-status',isWebPlatform()?'✓ Schlüsselfach verschlüsselt auf diesem Gerät gespeichert und entsperrt.':'✓ API-Schlüssel lokal gespeichert. Er wird beim nächsten App-Start wieder geladen.');
    message('api-feedback',isWebPlatform()?`Schlüssel verschlüsselt auf diesem Gerät gespeichert. ${payload.password?'Nach Neustart mit deinem zusätzlichen Passwort entsperren.':'Kein zusätzliches App-Passwort nötig. In diesem Browserprofil wird er beim nächsten Start wieder geladen.'} Keine Modellanfrage ausgeführt.`:'Schlüssel lokal gespeichert und für den nächsten Start hinterlegt. Das leere Feld ist beabsichtigt; du musst den Schlüssel nicht erneut eingeben. Noch keine Modellanfrage ausgeführt.');
    void refreshModelStatus();void refreshCosts();
  } catch (error) {
    message('api-feedback',error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
      ? 'Keine rechtzeitige Speicherbestätigung. Der Schlüssel könnte gespeichert sein. Prüfe „Lokale Diagnose anzeigen“, bevor du ihn erneut eingibst.'
      : error instanceof TypeError ? 'Lokaler App-Server nicht erreichbar. Die Speicherung ist nicht bestätigt.'
      : error instanceof Error ? error.message : 'Die Speicherung ist nicht bestätigt.');
  } finally {
    payload.apiKey = ''; if('password' in payload)payload.password=''; button.disabled = false; $('api-form').removeAttribute('aria-busy');
    $('api-feedback').focus({preventScroll:true});
  }
});
$('api-disconnect').addEventListener('click', async () => {
  try {
    const response = await platformFetch('/api/model-config', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'disconnect'}),signal:AbortSignal.timeout(5000)});
    if (!response.ok) throw new Error();
    input('api-key').value = ''; input('api-cost-consent').checked = false;
    modelConfigured=false;modelSaved=false;chooseModelMode('simulation');
    await refreshModelStatus();
    message('api-feedback','Gespeicherter Schlüssel gelöscht. Reale KI ist gesperrt.');
    message('credential-status','Kein API-Schlüssel lokal gespeichert.');await refreshCosts();
  } catch { message('api-feedback','Schlüssel konnte nicht entfernt werden. Eine laufende Anfrage abwarten und das Löschen erneut versuchen.'); }
});

async function localPost(path:string,body:unknown):Promise<any> {
  const response=await platformFetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('Aktion fehlgeschlagen. Konfiguration, Projektänderungen und Zugriff prüfen.');
  return response.json();
}
async function diagnosticData() {
  const response=await platformFetch('/api/diagnostics',{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Diagnose nicht verfügbar.');
  const data=await response.json();
  if(isWebPlatform()){$('vault-controls').hidden=!data.model.localKeySaved||data.model.storageMode==='device';$('vault-unlock-fields').hidden=!data.model.locked;$('vault-lock').hidden=data.model.locked;$('vault-use-device').hidden=data.model.locked;}
  message('credential-status',data.model.localKeySaved === true
    ? isWebPlatform()?data.model.storageMode==='device'?data.model.locked?'Lokaler Schlüssel derzeit nicht lesbar. Bitte erneut speichern.':'✓ API-Schlüssel in diesem Browserprofil gespeichert und bereit. Kein zusätzliches App-Passwort nötig.':`✓ Verschlüsseltes Schlüsselfach auf diesem Gerät · ${data.model.locked?'gesperrt: mit bisherigem Gerätepasswort entsperren':'entsperrt'}.`:'✓ API-Schlüssel lokal gespeichert. Du musst ihn nicht erneut eingeben.'
    : 'Kein API-Schlüssel lokal gespeichert.');
  return data;
}
async function refreshCosts(fill=false) {
  try{
    const d=await diagnosticData(), c=d.model.costs;
    message('cost-summary',`Geschätzter Verbrauch: ${Number(c.estimatedUsd).toFixed(6)} USD · ${c.requests} Anfragen · ${c.promptTokens} Eingabe- und ${c.completionTokens} Ausgabe-Tokens bestätigt · ${c.uncertainRequests} Anfragen mit unsicherer Abrechnung.`);
    if(fill){input('cost-input').value=String(c.inputUsdPerMillion);input('cost-output').value=String(c.outputUsdPerMillion);}
  }catch{message('cost-summary','Kostenstatus nicht verfügbar.');}
}

$('cost-form').addEventListener('submit',async event=>{
  event.preventDefault();try{
    await localPost('/api/costs',{action:'configure',inputUsdPerMillion:Number(input('cost-input').value),outputUsdPerMillion:Number(input('cost-output').value)});
    await refreshCosts();message('cost-feedback','Preisannahmen lokal gespeichert.');
  }catch{message('cost-feedback','Preisannahmen konnten nicht gespeichert werden. Werte und laufende Anfrage prüfen.');}
});
$('diagnose').addEventListener('click',async()=>{
  try{const d=await diagnosticData();message('diagnostic-output',`App-Version: ${d.version ?? 'unbekannt'} · Oberfläche: ${APP_VERSION}\nNode.js: ${d.node} · System: ${d.platform}\nKI-Zugang: ${d.model.configured?'konfiguriert (noch kein Verbindungsnachweis)':'nicht konfiguriert'}\nModell: ${d.model.model??'keines'}\nAnfragen: ohne lokales Kontingent\nUpdate: ${d.update?.message??'nicht verfügbar'}\nKeine Schlüsselwerte oder Sitzungstexte in dieser Diagnose.`);await refreshCosts();}
  catch{message('diagnostic-output','Lokaler Server nicht erreichbar.');}
});
$('diagnose-access').addEventListener('click',async()=>{
  const button=$<HTMLButtonElement>('diagnose-access');button.disabled=true;
  try{const d=await localPost('/api/diagnostics',{});message('diagnostic-output',`${d.message}${d.httpStatus?` (HTTP ${d.httpStatus})`:''}`);}
  catch{message('diagnostic-output','Zugangsdiagnose nicht verfügbar.');}finally{button.disabled=false;}
});
let updateTarget:string|null=null;
$('update-check').addEventListener('click',async()=>{
  const button=$<HTMLButtonElement>('update-check');button.disabled=true;updateTarget=null;$<HTMLButtonElement>('update-install').disabled=true;
  try{const d=await localPost('/api/update',{action:'check'});updateTarget=d.canInstall?d.target:null;
    message('update-info',d.dirty?'Eigene Codeänderungen vorhanden. Keine Installation möglich.':d.available?`Update auf ${d.target.slice(0,7)} verfügbar (Branch ${d.branch}).`:'Die lokale App ist auf dem aktuellen Stand.');
    $<HTMLButtonElement>('update-install').disabled=!updateTarget;
  }catch{message('update-info','Updateprüfung fehlgeschlagen. GitHub-Zugriff und Git-Installation prüfen.');}finally{button.disabled=false;}
});
$('update-install').addEventListener('click',async()=>{
  if(!updateTarget || !input('update-consent').checked){message('update-feedback','Bitte die Updateinstallation bestätigen.');return;}
  $<HTMLButtonElement>('update-install').disabled=true;
  try{await localPost('/api/update',{action:'install',target:updateTarget});
    for(let i=0;i<360;i++){
      await new Promise(resolve=>setTimeout(resolve,1000));const d=await diagnosticData();message('update-feedback',d.update.message);
      if(d.update.stage!=='installing')return;
    }
    message('update-feedback','Installation läuft länger. Diagnose erneut öffnen; nicht mehrfach installieren.');
  }catch{message('update-feedback','Update nicht abgeschlossen. Diagnose und lokalen Projektstand prüfen.');}
});

function restoreSession(json:string){studio.restore(json);game.pause();const g=studio.session.snapshot().game;if(isWebPlatform()&&g)studio.session.setGame({...g,engine:'browser',paused:true,revision:g.revision+1});}
async function engineTurn(){
  if(enginePending || !game.needsEngine())return;
  enginePending=true;render();
  try{const result=await game.reply(studio.session.snapshot().game?.opponent==='maia'?maiaEngine:(studio.session.snapshot().game?.engine??$<HTMLSelectElement>('engine-location').value)==='browser'?browserEngine:desktopEngine);if(result==='stored')message('game-feedback',`${studio.session.snapshot().game?.opponent==='maia'?'Maia':'Stockfish'} hat gezogen. Du bist am Zug.`);}
  catch(error){message('game-feedback',error instanceof Error?error.message:'Enginezug fehlgeschlagen. Partie pausiert.');}
  finally{enginePending=false;render();if(game.needsEngine())void engineTurn();}
}
let startingGame=false;
async function startNewGame(){
 if(startingGame||!initialized)return;
 startingGame=true;$('workspace').inert=true;
 try{
  game.pause();
  const current=studio.session.snapshot();
  if(current.nodes.length>1||current.annotations.length||current.game||current.review){
   await browserRuntime.store.savedGames({id:crypto.randomUUID(),title:'Sicherung vor neuer Partie',date:new Date().toISOString(),json:studio.session.export()});
   window.dispatchEvent(new Event('chess-games-change'));
  }
  studio.session=new Studio().session;selected=null;shownMove=undefined;text('question').value='';
  const opponent=$<HTMLSelectElement>('game-opponent').value as 'stockfish'|'maia';
  game.start($<HTMLSelectElement>('game-color').value as 'w'|'b',Number($<HTMLSelectElement>('game-level').value),opponent==='maia'?'browser':$<HTMLSelectElement>('engine-location').value as 'server'|'browser',opponent);
  navigation.select('play');render();message('game-feedback','Neue Partie gestartet.');
 }catch{render();message('move-feedback','Neue Partie nicht gestartet: Die bisherige Partie konnte nicht gesichert werden. Bitte zuerst als Datei speichern.');}
 finally{startingGame=false;$('workspace').inert=false;}
 void engineTurn();
}
$('game-form').addEventListener('submit',event=>{event.preventDefault();void startNewGame();});
$('open-game-setup').addEventListener('click',()=>{void startNewGame();});
$('game-undo').addEventListener('click',()=>attempt(()=>game.takeBack(),'move-feedback','Dein letzter Zug wurde samt möglicher Engineantwort zurückgenommen. Der bisherige Verlauf bleibt als Variante erhalten.'));
// Keep the desktop action visible above the full-height board; on touch, beside board controls.
const desktopControls=matchMedia('(min-width:901px)');
const dockUndo=()=>{const button=$('game-undo');if(desktopControls.matches)document.querySelector('.app-navigation')!.append(button);else document.querySelector('.board-actions')!.insertBefore(button,$('open-game-setup'));};
desktopControls.addEventListener('change',dockUndo);dockUndo();
$('game-opponent').addEventListener('change',()=>{
 game.pause();maiaEngine.cancel();const saved=studio.session.snapshot().game,opponent=$<HTMLSelectElement>('game-opponent').value as 'stockfish'|'maia';
 if(saved)studio.session.setGame({...saved,opponent,...(opponent==='maia'?{engine:'browser' as const}:{}),revision:saved.revision+1});
 render();message('game-feedback','Spielgegner gewählt. Eine bestehende Partie bleibt pausiert; zum Wechsel bewusst fortsetzen.');
});
$('engine-location').addEventListener('change',()=>{
 const selectedEngine=$<HTMLSelectElement>('engine-location').value as 'server'|'browser';
 game.pause();const saved=studio.session.snapshot().game;if(saved)studio.session.setGame({...saved,engine:selectedEngine,revision:saved.revision+1});render();
 message('game-feedback','Spielengine gewählt. Eine bestehende Partie bleibt pausiert; Fortsetzen startet sie bewusst.');
});
$('game-pause').addEventListener('click',()=>{navigation.select('learn');message('game-feedback','Partie pausiert. Probiere Varianten oder bespreche deine Ideen.');});
$('game-resume').addEventListener('click',()=>{attempt(()=>game.resume(),'game-feedback','Zur tatsächlichen Partie zurückgekehrt.');void engineTurn();});
text('question').addEventListener('focus',()=>{if(studio.session.snapshot().game){game.pause();render();}});
$('label-form').addEventListener('submit',event=>{event.preventDefault();attempt(()=>studio.session.label(studio.session.snapshot().activeNodeId,input('variant-label').value),'compare-feedback','Variantenname gespeichert.');});
$('compare-form').addEventListener('submit',event=>{event.preventDefault();attempt(()=>studio.session.compare($<HTMLSelectElement>('compare-a').value,$<HTMLSelectElement>('compare-b').value),'compare-feedback','Vergleich gespeichert und im Dialogkontext verfügbar.');});
function renderComparison(){
 const d=studio.session.snapshot(),allowed=visibleReviewNodes(d);
 const visible=d.nodes.filter(n=>allowed.has(n.id));
 for(const [id,saved] of [['compare-a',d.comparison?.a],['compare-b',d.comparison?.b]] as const){
  const select=$<HTMLSelectElement>(id),previous=saved??select.value;select.replaceChildren();
  for(const node of visible){const option=document.createElement('option');option.value=node.id;option.textContent=`${node.id} · ${d.labels?.[node.id]??node.san??'Ausgangsstellung'}`;select.append(option);}
  if(visible.some(n=>n.id===previous))select.value=previous;
 }
 const container=$('comparison-view');container.replaceChildren();if(!d.comparison||!allowed.has(d.comparison.a)||!allowed.has(d.comparison.b))return;
 const a=pathTo(d,d.comparison.a),b=pathTo(d,d.comparison.b);
 const common=a.filter((node,i)=>b[i]?.id===node.id).at(-1)!;
 const heading=document.createElement('p');heading.textContent=`Gemeinsamer Ausgangspunkt: ${common.id} · ${d.labels?.[common.id]??common.san??'Ausgangsstellung'}`;container.append(heading);
 for(const [name,id] of [['A',d.comparison.a],['B',d.comparison.b]]){
  const path=pathTo(d,id!),node=path.at(-1)!;const card=document.createElement('article');card.className='comparison-card';
  const title=document.createElement('h3');title.textContent=`${name}: ${d.labels?.[node.id]??node.san??node.id}`;card.append(title);
  const mini=document.createElement('div');mini.className='mini-board';mini.setAttribute('role','img');mini.setAttribute('aria-label',`Stellung ${name}: ${node.fen}`);
  const glyphs:Record<string,string>={wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'};
  const flipped=(d.orientation??d.game?.human)==='b',rows=new Chess(node.fen).board();
  const ranks=flipped?rows.slice().reverse().map(row=>row.slice().reverse()):rows;
  for(const [rank,row] of ranks.entries())for(let file=0;file<8;file++){const cell=document.createElement('span');cell.dataset.square=`${'abcdefgh'[flipped?7-file:file]}${flipped?rank+1:8-rank}`;cell.className=(rank+file)%2?'dark':'';const piece=row[file];cell.textContent=piece?glyphs[piece.color+piece.type]!+'\uFE0E':'';mini.append(cell);}
  card.append(mini);const line=document.createElement('p');line.textContent=`Zugfolge: ${path.slice(1).map(n=>n.san).join(' ')||'Ausgangsstellung'}`;card.append(line);
  const notes=document.createElement('p');notes.textContent=d.annotations.filter(n=>n.nodeId===node.id && n.kind!=='factcheck').map(n=>`${n.source}: ${n.text}`).join('\n')||'Noch keine Notiz oder Diskussion an dieser Stellung.';card.append(notes);container.append(card);
 }
}

$('reflection-form').addEventListener('submit',event=>{
 event.preventDefault();
 const value={idea:text('learning-idea').value,reasoning:text('learning-reasoning').value,uncertainty:input('learning-uncertainty').value,goal:input('learning-goal').value,hintMode:$<HTMLSelectElement>('learning-hint').value as HintMode};
 attempt(()=>studio.session.reflect(studio.session.snapshot().activeNodeId,value),'reflection-feedback','Dein Gedankengang und gewünschter Hinweisumfang sind an dieser Stellung gespeichert.');
});
for(const id of ['learning-idea','learning-reasoning','learning-uncertainty','learning-goal'])$(id).addEventListener('focus',()=>{const g=studio.session.snapshot().game;if(g && !g.paused){game.pause();render();}});

$('dialogue-begin').addEventListener('click',()=>{
 game.pause();const topic=$<HTMLSelectElement>('dialogue-topic').value;
 if(topic==='review'){const g=studio.session.snapshot().game;if(g)studio.session.select(g.cursor);}
 render();
 const d=studio.session.snapshot(),r=d.reflections?.[d.activeNodeId];
 text('question').value=topic==='comparison'?'Hilf mir, meine Varianten A und B nach Plan, Risiken und menschlicher Spielbarkeit zu vergleichen.':topic==='review'?'Lass uns die Partie durchgehen: Welche Entscheidungen sollte ich zum Lernen genauer betrachten?':r?.idea?`Meine Idee ist: ${r.idea}. ${r.reasoning?'Meine Begründung: '+r.reasoning+'. ':''}Hilf mir, diesen Plan zu prüfen und weiterzudenken.`:'Hilf mir, aus dieser Stellung einen verständlichen Plan zu entwickeln. Frag mich zuerst nach meinen Gedanken.';
 text('question').focus();message('dialogue-feedback','Gespräch vorbereitet. Erst „Nachricht senden“ startet eine Anfrage.');
});

text('question').addEventListener('input',()=>{if(initialized&&isWebPlatform())void autosave.save().catch(()=>{});});
for(const action of ['unlock','lock','use-device'] as const)$('vault-'+action).addEventListener('click',async()=>{
 const password=input('vault-unlock-password').value;input('vault-unlock-password').value='';
 try{const response=await platformFetch('/api/vault',{method:'POST',body:JSON.stringify({action,password})});
  if(!response.ok)throw new Error((await response.json()).error);
  await refreshModelStatus();await refreshCosts();
  message('api-feedback',action==='unlock'?'Schlüsselfach entsperrt. Keine Modellanfrage ausgeführt.':action==='use-device'?'Schlüssel auf diesem Gerät gespeichert. Kein zusätzliches App-Passwort mehr nötig. Keine Modellanfrage ausgeführt.':'Schlüsselfach gesperrt.');
 }catch(error){message('api-feedback',error instanceof Error?error.message:'Schlüsselaktion fehlgeschlagen.');}
});
$('session-clear').addEventListener('click',async()=>{
 if(!input('session-clear-consent').checked){message('autosave-status','Bitte das Löschen bestätigen.');return;}
 try{game.pause();await autosave.clear();initialized=false;input('session-clear-consent').checked=false;message('autosave-status','Automatische Sitzung gelöscht. Sie wird nach dem nächsten Neuladen wieder aktiviert. Die aktuelle Sitzung kannst du weiterhin exportieren.');}
 catch{message('autosave-status','Löschen fehlgeschlagen.');}
});
const navigation=installNavigation(cancelBoardDrag,view=>{
 if(view==='learn')game.learn();
 else if(view==='settings')game.pause();
 else if(studio.session.snapshot().game?.paused&&!studio.session.snapshot().review?.guiding)game.resume();
 selected=null;render();if(view==='play')void engineTurn();
});
function beginAnalysis(wholeGame:boolean){
 const data=studio.session.snapshot();
 if(reviewLocked(data)){message('dialogue-feedback','Zuerst den aktuellen Rückblick-Schritt beantworten oder aufdecken.');return;}
 game.learn();if(wholeGame){const end=learningLine(studio.session.snapshot()).at(-1);if(end)game.analyse(end.id);}
 $<HTMLSelectElement>('dialogue-topic').value=wholeGame?'review':'position';
 text('question').value=wholeGame?'Bitte besprich die bisherige Partie: Welche konkreten Wendepunkte, Gefahren und gelungenen Ideen sind aus dem Verlauf belegbar? Erkläre verständlich, was ich daraus lernen kann. Behaupte keine ungeprüften Fehler oder besten Züge.':'Bitte analysiere die aktuelle Brettstellung: Wer steht besser und warum? Welche konkreten Gefahren gibt es, welche verständlichen Pläne und möglichen Antworten sollte ich prüfen?';
 render();directAnalysisHint='explain';$<HTMLFormElement>('dialogue-form').requestSubmit();
}
$('analyse-position').addEventListener('click',()=>beginAnalysis(false));
$('analyse-game').addEventListener('click',()=>beginAnalysis(true));
$('chat-open-access').addEventListener('click',()=>{navigation.select('settings');const section=$('api-settings');(section as HTMLDetailsElement).open=true;section.scrollIntoView({block:'start'});});
$('learn-back').addEventListener('click',()=>attempt(()=>{const d=studio.session.snapshot(),node=d.nodes.find(n=>n.id===d.activeNodeId)!;if(node.parentId)game.analyse(node.parentId);},'move-feedback','Einen Lernzug zurück.'));
$('learn-origin').addEventListener('click',()=>attempt(()=>{const d=studio.session.snapshot();game.analyse(d.game?.cursor??d.nodes[0]!.id);},'move-feedback','Zur Ausgangsstellung der Analyse zurück.'));
$('comment-move').addEventListener('click',()=>{text('question').value='Bitte besprich meinen gerade ausprobierten Zug. Welche Idee steckt dahinter, welche gegnerischen Antworten sollte ich beachten und wie könnte mein Plan weitergehen?';$<HTMLSelectElement>('dialogue-topic').value='position';$<HTMLFormElement>('dialogue-form').requestSubmit();});
installGameLibrary(browserRuntime.store,()=>studio.session.export(),json=>{restoreSession(json);navigation.select('learn');render();});
void(async()=>{
 let loaded=false;
 try{
  const mode=await platformReady;
  message('platform-status',mode==='web'?'Eigenständige Web-App · Daten bleiben in diesem Browser auf diesem Gerät.':'Desktopbetrieb · Schlüssel und Kosten liegen im lokalen App-Server.');
  if(mode==='web'){
   $('web-mode-link').hidden=true;$('vault-setup').hidden=false;$('desktop-update').hidden=true;$('autosave-controls').hidden=false;
   input('vault-password').required=false;
   message('key-storage-explanation','Dein Schlüssel wird verschlüsselt in diesem Browserprofil gespeichert und beim nächsten Start wieder geladen. Kein zusätzliches App-Passwort nötig. Wer dieses Browserprofil benutzt, kann den Schlüssel in der App verwenden. Nur ausdrücklich gestartete KI-Anfragen oder Zugangsprüfungen verbinden sich mit OpenAI. Der Schlüssel gehört nicht zum Partieexport.');
   message('session-storage-explanation','Sitzung und Nachrichtenentwurf werden automatisch in diesem Browser gespeichert, ohne Schlüssel oder Gerätepasswort. Pro Browseradresse gilt die zuletzt gespeicherte Sitzung; zum unabhängigen Sichern oder Übertragen JSON exportieren.');
   $<HTMLSelectElement>('engine-location').value='browser';$<HTMLSelectElement>('engine-location').options[0]!.disabled=true;
   $('engine-options').hidden=true;
   const saved=await browserRuntime.store.get<import('../src/browser-store.js').BrowserSession>('session');
   if(saved){restoreSession(saved.json);text('question').value=typeof saved.question==='string'?saved.question.slice(0,16000):'';message('storage-feedback','Letzte Sitzung auf diesem Gerät wiederhergestellt. Eine Enginepartie bleibt zunächst pausiert.');}
  }
  loaded=true;
 }catch{message('platform-status','Lokale Daten konnten nicht vollständig geladen werden. Vor Änderungen vorhandene Sitzungsdaten sichern. JSON-Import und Simulation bleiben verfügbar.');}
 finally{initialized=loaded;render();$('workspace').inert=false;await refreshModelStatus();await refreshCosts(true);installPwa(async()=>{if(!initialized)throw new Error('Lokale Sitzung nicht bereit.');await autosave.save();});}
})();

window.addEventListener('chess-vault-change',()=>{void refreshModelStatus();void refreshCosts();});
