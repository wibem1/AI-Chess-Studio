import {installBoardToolbar} from './board-toolbar.js';
import {attachAnswerResize} from './answer-resize.js';
import {installKeyMoments} from './key-moments.js';
import {reviewAnchors} from '../src/game-review.js';
import {playablePosition} from '../src/position-transfer.js';
import {validModel} from '../src/model-provider.js';
import {CoachMatch} from '../src/coach-match.js';
import {installModelControls} from './model-controls.js';
import {CoachBoard} from '../src/coach-board.js';
import {drawBoardMarks} from './board-diagram.js';
import {type BoardDiagram,TOOL_RECORD} from '../src/coach-tools.js';
import {renderLearningReplay,learningLine} from './learning-replay.js';
import {MaiaPlayingEngine} from './maia-engine.js';
import {MAIA_PROFILES} from '../src/maia-files.js';
import {platformFetch,platformReady,isWebPlatform,browserRuntime} from './platform.js';
import {AutoSave} from './autosave.js';
import {installPwa} from './pwa.js';
import { Chess, type Square } from 'chess.js';
import { Studio, type DialogueTopic } from '../src/dialogue.js';
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
let replayTip:{session:typeof studio.session;node:string}|undefined;
let illustration:{diagram:BoardDiagram;session:typeof studio.session;node:string}|undefined;
let shownMove:{node:string;from:string;to:string}|undefined;
let coachAnchor:{session:typeof studio.session;node:string}|undefined,pendingCoachAnchor:typeof coachAnchor;
const boardActions:unknown[]=[];
let pending = false,chatStopped=false;let activeAdapter:ServerModelAdapter|undefined;
const coachBrowserEngine=new BrowserPlayingEngine(),coachMaiaEngine=new MaiaPlayingEngine(value=>{if(pending&&!chatStopped)message('dialogue-feedback',value);});
const coachBoard=new CoachBoard(()=>studio.session,()=>studio.session.snapshot().game?.opponent==='maia'?coachMaiaEngine:(studio.session.snapshot().game?.engine??$<HTMLSelectElement>('engine-location').value)==='browser'?coachBrowserEngine:desktopEngine,node=>{if(pendingCoachAnchor){coachAnchor=pendingCoachAnchor;pendingCoachAnchor=undefined;}const d=studio.session.snapshot(),n=d.nodes.find(n=>n.id===node)!,parent=d.nodes.find(p=>p.id===n.parentId)!;const move=new Chess(parent.fen).move(n.san!);shownMove={node,from:move.from,to:move.to};render();},150,(diagram,node)=>{
 const previousFen=illustration?.session===studio.session&&illustration.node===node?illustration.diagram.fen:undefined;
 const view={...diagram,...(!diagram.fen&&previousFen?{fen:previousFen}:{})};
 illustration=view.fen||view.marks.length?{diagram:view,session:studio.session,node}:undefined;
 selected=null;render();
});
let directAnalysisHint:'explain'|undefined;
let tacticalPending = false;
let modelAvailable = false;
let modelConfigured=false,modelSaved=false,modelBlocked='Kein KI-Zugang eingerichtet.';
let activeModelId='',activeProviderName='',activeReasoning='';
let accessRevision=0,accessReady=false,accessReadError=false;
function updateMode() {
 $('coach-stop').hidden=!pending;
 $('coach-origin').hidden=!coachAnchor||coachAnchor.session!==studio.session||coachAnchor.node===studio.session.snapshot().activeNodeId;
 $<HTMLButtonElement>('clear-dialogue').disabled=!pending&&!studio.session.snapshot().annotations.some(a=>a.kind==='dialogue');
 const locked=reviewLocked(studio.session.snapshot()),blocked=!modelAvailable||!accessReady||accessReadError;
 $<HTMLButtonElement>('ask').textContent='Senden';
 $('ask').setAttribute('aria-label','Nachricht senden (reale KI)');
 $<HTMLButtonElement>('ask').disabled=pending||match.running||locked||blocked;
 $<HTMLButtonElement>('coach-show-plan').disabled=pending||match.running||locked||blocked;
 for(const id of ['find-key-moments'])$<HTMLButtonElement>(id).disabled=pending||match.running||locked||blocked;
 $<HTMLButtonElement>('model-apply').disabled=pending||match.running;
 $<HTMLButtonElement>('match-start').disabled=pending||match.running||!modelAvailable||!accessReady||accessReadError;
 for(const id of ['api-connect','api-disconnect'])if(match.running)$<HTMLButtonElement>(id).disabled=true;
 $('learn-configure').hidden=modelAvailable;
 message('mode-badge',!accessReady?'Lernchat: Zugang wird geprüft':accessReadError?'Lernchat: Status unklar':(modelAvailable?'Lernchat: Eigene KI':'Lernchat: KI gesperrt'));
 message('active-ai',activeModelId?`${activeProviderName} · ${activeModelId}${activeReasoning?' · Denktiefe '+activeReasoning:''}`:'Keine KI ausgewählt');
 message('active-model-summary',!accessReady?'KI wird geprüft …':activeModelId+(pending?' · arbeitet':!modelAvailable?' · gesperrt':''));
 $('active-model-summary').title=$('active-ai').textContent??'';
 message('active-ai-state',!accessReady?'Zugang wird lokal geprüft …':accessReadError?modelBlocked:modelAvailable?(pending?'KI-Anfrage läuft …':match.running?'KI-Testpartie läuft …':'Bereit · Verbindung noch nicht geprüft.'):modelBlocked);
 message('chat-access',!accessReady?'Gespeicherter KI-Zugang wird lokal geprüft …':accessReadError?modelBlocked:(modelAvailable?'Eigener KI-Zugang aktiv · Kosten werden geschätzt.':modelBlocked));
 $('chat-open-access').hidden=modelAvailable;
 $('chat-open-access').textContent='KI-Zugang prüfen';
}
async function refreshModelStatus() {
 const revision=++accessRevision;
 try{
  const data=await diagnosticData();if(revision!==accessRevision)return;const status={...data.model,available:data.model.configured,saved:data.model.localKeySaved};
  activeModelId=data.model.model??'';activeProviderName=data.model.provider==='openrouter'?'OpenRouter':'OpenAI direkt';activeReasoning=data.model.reasoning??'';await modelControls.update(data);
  accessReady=true;accessReadError=false;
  modelConfigured=status.available===true;modelSaved=status.saved===true||modelConfigured;
  modelAvailable=modelConfigured;
  modelBlocked=status.locked?'Schlüssel gespeichert, aber gesperrt. In den Einstellungen entsperren.':'Kein aktiver KI-Zugang. In den Einstellungen den gespeicherten Schlüssel prüfen.';
  message('model-status',modelAvailable?'KI-Zugang konfiguriert, noch kein Verbindungsnachweis. Kosten werden als Schätzung angezeigt.':modelBlocked);
 }catch{if(revision!==accessRevision)return;accessReady=true;accessReadError=true;modelAvailable=false;modelBlocked='KI-Status konnte nicht gelesen werden. Zugang und Diagnose prüfen.';message('model-status',modelBlocked);}
 updateMode();
}
function message(id: string, value: string) { $(id).textContent = value; }
function attempt(action: () => void, target: string, success: string) {
  try { action(); selected = null; render(); message(target, success); }
  catch (error) { message(target, error instanceof Error ? error.message : 'Vorgang fehlgeschlagen.'); }
}
function move(value: string | { from: string; to: string; promotion: string }) {
  if(illustration?.diagram.fen)return;
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
  match.checkSelection();
  if(coachBoard.checkSelection()){studio.cancelAsk();activeAdapter?.cancel();}
  cancelBoardDrag();
  const data = studio.session.snapshot();
  const current = data.nodes.find(n => n.id === data.activeNodeId)!;
  const learningView=$('workspace').dataset.activeView==='learn';
  if(illustration&&(illustration.session!==studio.session||illustration.node!==current.id||!learningView))illustration=undefined;
  const chess = new Chess(illustration?.diagram.fen??current.fen);
  $('diagram-toolbar').hidden=!illustration;
  message('diagram-label',illustration?.diagram.fen?'Lehrstellung':'Brettmarkierungen');
  $('board').dataset.readonly=String(!!illustration?.diagram.fen);
  const status = studio.session.status();
  const live=data.review?.guiding?undefined:data.game;
  const allowed=visibleReviewNodes(data),locked=reviewLocked(data);
  $('game-undo').hidden=$('workspace').dataset.activeView!=='play';
  $<HTMLButtonElement>('game-undo').disabled=!game.canTakeBack();
  const learning=$('workspace').dataset.activeView==='learn';
  $('learning-controls').hidden=!learning;$('learning-chat').hidden=!learning;
  for(const id of ['learn-back','learn-next'])$(id).hidden=!learning;
  $('transfer-position').textContent=learning?'Stellung spielen':'Stellung lernen';
  $('transfer-position').setAttribute('aria-label',learning?'Im Spielmodus fortsetzen':'Im Lernmodus öffnen');
  $('transfer-position').title=learning?'Sichtbare Stellung im Spielmodus fortsetzen; bisherigen Stand sichern':'Sichtbare Stellung im Lernmodus öffnen';
  if(!replayTip||replayTip.session!==studio.session||!data.nodes.some(n=>n.id===replayTip!.node)||!pathTo(data,replayTip.node).some(n=>n.id===current.id))replayTip={session:studio.session,node:current.id};
  renderLearningReplay(data,game,()=>{selected=null;illustration=undefined;navigation.select('learn');render();},replayTip.node);
  if(illustration?.diagram.fen)for(const id of ['learn-first','learn-back','learn-next'])$<HTMLButtonElement>(id).disabled=true;
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
  const targets = learning && selected && !illustration?.diagram.fen && !status.gameOver ? chess.moves({ square: selected, verbose: true }).map(m => m.to) : [];
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
        if(illustration?.diagram.fen)return;
        if (selected === square) { selected = null; render(); }
        else if (selected && piece?.color !== chess.turn()) {
          move({ from: selected, to: square, promotion: $<HTMLSelectElement>('promotion').value });
        } else { selected = square; render(); }
      });
      board.append(button);
    }
  }
  if(illustration){drawBoardMarks(board,illustration.diagram.marks,flipped);if(illustration.diagram.fen)message('position-status',`Lehrstellung · ${chess.turn()==='w'?'Weiß':'Schwarz'} am Zug`);}
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
  // Present playable branches, not a long list of every half-move.
  const visibleNodes=data.nodes.filter(n=>allowed.has(n.id));
  const childrenCount=new Map<string,number>();
  for(const node of visibleNodes)if(node.parentId)childrenCount.set(node.parentId,(childrenCount.get(node.parentId)??0)+1);
  const tips=visibleNodes.filter(node=>node.parentId!==null&&(childrenCount.get(node.id)??0)===0);
  const meaningful=visibleNodes.filter(node=>node.parentId!==null&&!!data.labels?.[node.id]&&!tips.includes(node));
  const choices=[...tips,...meaningful];
  const summary=document.createElement('p');summary.className='hint';
  summary.textContent=choices.length>1?`${choices.length} Varianten oder benannte Stellungen. Tippe eine an, um sie auf dem großen Brett zu öffnen.`:'Noch keine eigene Abzweigung. Wähle mit Zurück eine frühere Stellung und ziehe dann eine andere Figur. Die Partie bleibt erhalten.';
  variants.append(summary);
  const branchList=document.createElement('div');branchList.className='variant-choices';variants.append(branchList);
  if(choices.length>1)for(const node of choices){
    const path=pathTo(data,node.id),label=data.labels?.[node.id];
    const name=label||`${node.san??'Stellung'} · ${path.length-1} Halbzüge`;
    const button=document.createElement('button');button.type='button';button.className='secondary';
    button.textContent=`${name}${mainIds.has(node.id)?' · Hauptpartie':' · Variante'}`;
    button.setAttribute('aria-current',String(node.id===current.id));
    button.addEventListener('click',()=>{game.analyse(node.id);selected=null;render();message('move-feedback','Variante auf dem Brett geöffnet.');});
    branchList.append(button);
  }
  input('variant-label').value=data.labels?.[current.id]??'';
  renderComparison();
  const dialoguePath=new Set(pathTo(data,current.id).map(n=>n.id));
  message('dialogue-anchor',`Gespräch zur Stellung ${current.id}${data.labels?.[current.id]?' · '+data.labels[current.id]:''}. Das bisherige Gespräch bleibt mit seinem jeweiligen Stellungsbezug sichtbar.`);
  const conversation=data.annotations.filter(a=>a.kind==='dialogue'&&allowed.has(a.nodeId));
  const lastQuestion=conversation.findLastIndex(a=>a.source==='human');
  const currentAnswer=conversation.slice(lastQuestion+1).findLast(a=>a.source!=='human');
  const conversationRoot=$('dialogue');conversationRoot.replaceChildren();
  const answerBody=document.createElement('div'),historyBody=document.createElement('div');
  answerBody.id='current-answer-body';historyBody.id='chat-history-body';
  for(const [id,title,body,hasEntries] of [['current-answer','Aktuelle Antwort',answerBody,!!currentAnswer],['chat-history','Chatverlauf',historyBody,conversation.some(a=>a!==currentAnswer)]] as const){
   if(!hasEntries)continue;const section=document.createElement('section'),heading=document.createElement('h3');section.id=id;section.setAttribute('aria-label',title);heading.textContent=title;section.append(heading,body);conversationRoot.append(section);if(id==='current-answer')section.append(attachAnswerResize(body));
  }
  for (const [kind, id] of [['dialogue', 'dialogue'], ['memory', 'memories']] as const) {
    const container = $(id); if(kind!=='dialogue')container.replaceChildren();
    for (const a of data.annotations.filter(a => a.kind===kind && (kind==='dialogue'?allowed.has(a.nodeId):a.nodeId===current.id))) {
      const entry = document.createElement('article'); entry.className = 'entry';
      const meta = document.createElement('small');
      meta.textContent = a.text.startsWith(TOOL_RECORD)?'App · Brettaktion':`${a.nodeId} · ${a.source === 'human' ? 'Mensch' : a.source === 'simulation' ? 'Simulation · Keine reale KI' : 'Modell'} · ${a.hypothesis ? 'Hypothese' : 'Eigene Eingabe'}`;
      const body = document.createElement('div');
      const [answer,details]=a.text.split('\n\nAnalyse-Details:');body.textContent=answer!.startsWith(TOOL_RECORD)?answer!.slice(TOOL_RECORD.length):answer!;
      if(answer?.startsWith('Modellnachweis (App): ')){const split=body.textContent!.indexOf('\n\n');if(split>=0){const receipt=document.createElement('small');receipt.textContent=body.textContent!.slice(0,split);body.textContent=body.textContent!.slice(split+2);entry.append(receipt);}}
      entry.append(meta,body);
      if(kind==='dialogue'&&a.source==='model'&&!locked)for(const san of a.suggestions??[]){
        const show=document.createElement('button');show.type='button';show.textContent=`Zug zeigen: ${san}`;
        show.addEventListener('click',()=>attempt(()=>{game.analyse(a.nodeId);const board=new Chess(data.nodes.find(n=>n.id===a.nodeId)!.fen),shown=board.move(san);const node=game.play(san);shownMove={node,from:shown.from,to:shown.to};},'move-feedback',`${san} im Lernzweig gezeigt. Die Partie bleibt unverändert.`));entry.append(show);
      }
      if(kind==='dialogue'&&a.source==='model'&&!locked){
        const anchors=reviewAnchors(data,a),analysis=data.annotations.indexOf(a);
        for(const [i,moment] of anchors.entries()){
          const button=document.createElement('button');button.type='button';button.textContent=`Vor ${moment.label} ansehen`;button.setAttribute('aria-current',String(current.id===moment.nodeId));button.onclick=()=>keyMoments.choose(analysis,i);entry.append(button);
        }
      }
      if(details){const disclosure=document.createElement('details'),summary=document.createElement('summary'),detail=document.createElement('div');summary.textContent='Denkwege und fachliche Einordnung';detail.textContent=details;disclosure.append(summary,detail);entry.append(disclosure);}
      if(kind==='dialogue' && a.nodeId!==current.id){const jump=document.createElement('button');jump.textContent=`Stellung ${a.nodeId} ansehen`;jump.addEventListener('click',()=>{game.analyse(a.nodeId);render();});entry.append(jump);}
      if (a.openQuestions.length) { const questions = document.createElement('p'); questions.textContent = `Offen: ${a.openQuestions.join(' / ')}`; entry.append(questions);if(kind==='dialogue' && a.source!=='human')for(const q of a.openQuestions.slice(0,2)){const follow=document.createElement('button');follow.textContent=`Rückfrage aufgreifen: ${q}`;follow.addEventListener('click',()=>{text('question').value=q;text('question').focus();});entry.append(follow);} }
      if(kind==='dialogue')(a===currentAnswer?answerBody:historyBody).append(entry);else container.append(entry);
    }
  }
  keyMoments.render();
  reviewUI.render(data);
  updateMode();
  if(initialized&&isWebPlatform())void autosave.save().catch(()=>{});
}
installBoardToolbar();
$('learn-back').textContent='Zurück';$('learn-next').textContent='Vor';
const studyTools=document.createElement('details');studyTools.id='study-tools';studyTools.className='tool-section';const studySummary=document.createElement('summary');studySummary.textContent='Weitere Werkzeuge';studyTools.append(studySummary);$('panel-learn').append(studyTools);studyTools.append($('tactical-form').closest('details')!,$('panel-variants'));
const match=new CoachMatch(()=>studio.session,()=>{render();$('match-status').textContent=match.report?.message??'';if(match.report)message('dialogue-feedback',match.running?'KI-Testpartie läuft.':'KI-Testpartie beendet. Details stehen unter dem Brett.');$<HTMLButtonElement>('match-start').disabled=!!match.running;$<HTMLButtonElement>('match-stop').disabled=!match.running;});
$('match-start').addEventListener('click',async()=>{
 if(pending||!modelAvailable){message('match-status','Aktiven eigenen KI-Zugang wählen; keine Simulation.');return;}
 game.pause();const snapshot=studio.session.snapshot(),saved=snapshot.game,fen=snapshot.nodes.find(n=>n.id===snapshot.activeNodeId)!.fen;const adapter=new ServerModelAdapter(platformFetch),opponent=saved?.opponent??$<HTMLSelectElement>('game-opponent').value as 'stockfish'|'maia';
 try{const identity=await diagnosticData();await match.start({model:identity.model.model,color:new Chess(fen).turn(),opponent,level:saved?.level??Number($<HTMLSelectElement>('game-level').value),maxTurns:100},adapter,opponent==='maia'?new MaiaPlayingEngine(value=>message('match-status',value)):new BrowserPlayingEngine());}catch(error){message('match-status',error instanceof Error?error.message:'Teststart fehlgeschlagen.');}finally{for(const id of ['model-apply','api-connect','api-disconnect'])$<HTMLButtonElement>(id).disabled=false;await refreshCosts();}
});
$('match-stop').onclick=()=>{match.stop();render();message('match-status',match.report?.message??'Angehalten.');};
$('api-settings').prepend($('ai-access-card'));
$('api-settings').append($('chat-model-controls'));
$('panel-settings').append($('learning-settings'));
$('diagram-close').onclick=()=>{chatStopped=true;studio.cancelAsk();coachBoard.cancel();activeAdapter?.cancel();illustration=undefined;render();};
const keyMoments=installKeyMoments(()=>studio.session,node=>{match.stop('Schlüsselstelle ansehen.');game.analyse(node);illustration=undefined;selected=null;navigation.select('learn',false,true,false);render();});
const modelControls=installModelControls(localPost,async()=>{updateMode();await refreshModelStatus();await refreshCosts();},()=>({nodeId:studio.session.snapshot().activeNodeId,fen:studio.session.snapshot().nodes.find(n=>n.id===studio.session.snapshot().activeNodeId)!.fen,testMatch:match.report,boardActions,environment:{userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},fontScale:$<HTMLSelectElement>('font-scale').value},feedback:$('dialogue-feedback').textContent}));
$('move-form').addEventListener('submit', event => { event.preventDefault(); move(input('move').value.trim()); });
$('coach-show-plan').addEventListener('click',()=>{
 if($<HTMLButtonElement>('coach-show-plan').disabled)return;
 const draft=text('question').value;
 text('question').value='Zeige deinen Plan für die aktuell sichtbare Stellung direkt auf dem Brett. Führe eine kurze legale Variante mit dem Brettwerkzeug vor und erkläre danach deine Idee und die mögliche gegnerische Antwort.';
 $<HTMLFormElement>('dialogue-form').requestSubmit();text('question').value=draft;
});
$('coach-origin').addEventListener('click',()=>{if(!coachAnchor||coachAnchor.session!==studio.session)return;chatStopped=true;studio.cancelAsk();coachBoard.cancel();activeAdapter?.cancel();game.analyse(coachAnchor.node);render();message('dialogue-feedback','Zum Ausgangspunkt der Vorführung zurückgekehrt. Die Variante bleibt erhalten.');});
$('coach-stop').addEventListener('click',()=>{match.stop();chatStopped=true;studio.cancelAsk();coachBoard.cancel();activeAdapter?.cancel();message('dialogue-feedback','Angehalten. Bereits gezeigte Züge bleiben als Lernvariante erhalten.');});
$('clear-dialogue').addEventListener('click',async()=>{
 if(!confirm('Chatverlauf dieser Partie auf allen Varianten löschen? Partie und eigene Notizen bleiben erhalten. Bereits gespeicherte Partiekopien bleiben unverändert.'))return;
 match.stop();illustration=undefined;boardActions.length=0;studio.session.clearDialogue();coachBoard.cancel();activeAdapter?.cancel();render();
 try{if(initialized&&isWebPlatform())await autosave.save();await localPost('/api/ai-diagnostics',{action:'clear'});message('dialogue-feedback','Chatverlauf dieser Partie gelöscht. Anfrageberichte ebenfalls gelöscht.');}
 catch{message('dialogue-feedback','Chatverlauf in dieser Sitzung gelöscht. Automatisches Speichern fehlgeschlagen; Sitzung als Datei sichern.');}
});
$('dialogue-form').addEventListener('submit', async event => {
  event.preventDefault(); if (pending || !modelAvailable) return;
  game.pause();
  const question = text('question').value,hintOverride=directAnalysisHint;directAnalysisHint=undefined;
  const session = studio.session,chatRevision=session.dialogueRevision();
  chatStopped=false;pending = true;updateMode();
  message('dialogue-feedback', 'Modellanfrage läuft … Stellungswechsel ist weiterhin möglich.');
  try {
    activeAdapter=new ServerModelAdapter(platformFetch);let toolStarted=false;
    const result = await studio.ask(question, activeAdapter!,'chat',hintOverride,async(call,node)=>{if(!toolStarted){pendingCoachAnchor={session,node};toolStarted=true;}message('dialogue-feedback',call.function.name==='play_engine'?'Spielengine antwortet …':call.function.name==='show_line'?'Variante wird vorgeführt …':'Brettdarstellung wird aufgebaut …');if(call.function.name==='show_line'||call.function.name==='play_engine')illustration=undefined;
      const result=await coachBoard.execute(call,node);boardActions.push({at:new Date().toISOString(),call,result});if(boardActions.length>20)boardActions.shift();if(!chatStopped)message('dialogue-feedback','Brettergebnis liegt vor; die Lernengine erläutert es …');return result;});
    message('dialogue-feedback', result === 'stored' ? 'Modellantwort an der angefragten Stellung gespeichert.' : chatStopped?'Angehalten. Gezeigte Züge bleiben als Lernvariante erhalten.':'Veraltete Antwort nach Sitzungs- oder Chatwechsel verworfen.');
    render();
  } catch (error) {
    message('dialogue-feedback', chatStopped?'Angehalten. Gezeigte Züge bleiben als Lernvariante erhalten.':studio.session !== session ? 'Veraltete Anfrage nach Sitzungswechsel verworfen.' : session.dialogueRevision()!==chatRevision ? 'Chatverlauf gelöscht; die frühere Anfrage wurde nicht übernommen.' : (error instanceof Error ? error.message : 'Anfrage fehlgeschlagen.')+' Die bisherigen Chatbeiträge stammen von früheren Anfragen.');
  } finally { pending = false;activeAdapter=undefined; updateMode(); void refreshModelStatus();void refreshCosts(); }
});
render();

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
  if(apiKey.length<8||apiKey.length>1024||/\s/.test(apiKey)){fail('Bitte den API-Schlüssel im Feld „API-Schlüssel“ eingeben. Ein Gerätepasswort ist dafür nicht nötig.');return;}
  if(!validModel(model,{provider:$<HTMLSelectElement>('api-provider').value as 'openai'|'openrouter'})){fail('Bitte ein gültiges Modell angeben, zum Beispiel gpt-4.1-mini.');return;}
  if (!input('api-cost-consent').checked){fail('Zum Speichern und Aktivieren bitte die Freigabe für Modellanfragen bestätigen. Das Speichern selbst startet keine KI-Anfrage.');return;}
  const password=$<HTMLDetailsElement>('vault-setup').open?input('vault-password').value:'';

  const button = $<HTMLButtonElement>('api-connect');
  if (button.disabled) return;
  button.disabled = true;
  $('api-form').setAttribute('aria-busy', 'true');
  accessRevision++;
  const payload = {action:'connect',apiKey,model,allowPaid:true,...{provider:$<HTMLSelectElement>('api-provider').value,...($<HTMLSelectElement>('chat-reasoning').value?{reasoning:$<HTMLSelectElement>('chat-reasoning').value}:{})},...(isWebPlatform()?{password}:{})};
  input('api-key').blur(); // Dismiss the touch keyboard before waiting for the local store.
  message('api-feedback','Schlüssel wird lokal gespeichert und die Speicherung geprüft … Du kannst die Seite weiterhin scrollen.');
  $('api-feedback').focus();
  try {
    await modelControls.beforeConnect();
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
    accessReady=true;accessReadError=false;modelConfigured=true;modelSaved=true;updateMode();
    message('credential-status',isWebPlatform()?'✓ Schlüsselfach verschlüsselt auf diesem Gerät gespeichert und entsperrt.':'✓ API-Schlüssel lokal gespeichert. Er wird beim nächsten App-Start wieder geladen.');
    message('api-feedback',isWebPlatform()?`Schlüssel verschlüsselt auf diesem Gerät gespeichert. ${payload.password?'Nach Neustart mit deinem zusätzlichen Passwort entsperren.':'Kein zusätzliches App-Passwort nötig. In diesem Browserprofil wird er beim nächsten Start wieder geladen.'} Keine Modellanfrage ausgeführt.`:'Schlüssel lokal gespeichert und für den nächsten Start hinterlegt. Das leere Feld ist beabsichtigt; du musst den Schlüssel nicht erneut eingeben. Noch keine Modellanfrage ausgeführt.');
    modelControls.connected();await refreshModelStatus();await refreshCosts();
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
    modelConfigured=false;modelSaved=false;updateMode();
    await refreshModelStatus();
    message('api-feedback','Gespeicherter Schlüssel gelöscht. Reale KI ist gesperrt.');
    message('credential-status','Kein API-Schlüssel lokal gespeichert.');await refreshCosts();
  } catch { message('api-feedback','Schlüssel konnte nicht entfernt werden. Eine laufende Anfrage abwarten und das Löschen erneut versuchen.'); }
});

async function localPost(path:string,body:unknown):Promise<any> {
  const response=await platformFetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(typeof error?.error==='string'?error.error:'Aktion fehlgeschlagen. Konfiguration und Zugriff prüfen.');}
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
    message('cost-summary',`Geschätzter Verbrauch: ${Number(c.estimatedUsd).toFixed(6)} USD (davon ${Number(c.providerReportedUsd??0).toFixed(6)} USD vom Anbieter gemeldet) · ${c.requests} Anfragen · ${c.promptTokens} Eingabe- und ${c.completionTokens} Ausgabe-Tokens bestätigt · ${c.uncertainRequests} Anfragen mit unsicherer Abrechnung.`);
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
$('ai-access-check').addEventListener('click',()=>{ $<HTMLButtonElement>('diagnose-access').click(); });
$('diagnose-access').addEventListener('click',async()=>{
  const button=$<HTMLButtonElement>('diagnose-access');button.disabled=true;$<HTMLButtonElement>('ai-access-check').disabled=true;message('ai-access-feedback','Anbieterzugang wird geprüft – keine Textgenerierung …');
  try{const d=await localPost('/api/diagnostics',{});const result=`${d.message}${d.httpStatus?` (HTTP ${d.httpStatus})`:''}`;message('diagnostic-output',result);message('ai-access-feedback',result);}
  catch{message('diagnostic-output','Zugangsdiagnose nicht verfügbar.');message('ai-access-feedback','Verbindung konnte nicht geprüft werden.');}finally{button.disabled=false;$<HTMLButtonElement>('ai-access-check').disabled=false;}
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
 const count=new Map<string,number>();for(const node of visible)if(node.parentId)count.set(node.parentId,(count.get(node.parentId)??0)+1);
 const options=visible.filter(n=>n.parentId!==null&&((count.get(n.id)??0)===0||!!d.labels?.[n.id]));
 for(const [id,saved] of [['compare-a',d.comparison?.a],['compare-b',d.comparison?.b]] as const){
  const select=$<HTMLSelectElement>(id),previous=saved??select.value;select.replaceChildren();
  for(const node of options){const option=document.createElement('option');option.value=node.id;option.textContent=d.labels?.[node.id]??`${node.san??'Stellung'} · ${pathTo(d,node.id).length-1} Halbzüge`;select.append(option);}
  if(options.some(n=>n.id===previous))select.value=previous;
  else if(id==='compare-b'&&options.length>1)select.selectedIndex=1;
 }
 $<HTMLButtonElement>('compare-form').querySelector('button')!.disabled=options.length<2;
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
 if(view!=='learn')match.stop('Lernmodus verlassen. Test angehalten.');
 if(view==='learn')game.learn();
 else if(view==='settings')game.pause();
 else if(studio.session.snapshot().game?.paused&&!studio.session.snapshot().review?.guiding)game.resume();
 selected=null;render();if(view==='play')void engineTurn();
});
function beginAnalysis(wholeGame:boolean,keyOnly=false){
 const data=studio.session.snapshot();
 if(reviewLocked(data)){message('dialogue-feedback','Zuerst den aktuellen Rückblick-Schritt beantworten oder aufdecken.');return;}
 game.learn();if(wholeGame&&!keyOnly){const end=learningLine(studio.session.snapshot()).at(-1);if(end)game.analyse(end.id);}
 text('question').value=keyOnly?'Finde und beschreibe die Schlüsselstellungen der gesamten Partie. Erkläre zu jeder Stellung, warum sie entscheidend ist und welche verständliche Lehre daraus folgt.':wholeGame?'Bitte besprich die bisherige Partie: Welche konkreten Wendepunkte, Gefahren und gelungenen Ideen sind aus dem Verlauf belegbar? Erkläre verständlich, was ich daraus lernen kann. Behaupte keine ungeprüften Fehler oder besten Züge.':'Bitte analysiere die aktuelle Brettstellung: Wer steht besser und warum? Welche konkreten Gefahren gibt es, welche verständlichen Pläne und möglichen Antworten sollte ich prüfen?';
 render();directAnalysisHint='explain';$<HTMLFormElement>('dialogue-form').requestSubmit();
}
$('find-key-moments').addEventListener('click',()=>beginAnalysis(true,true));
$('ai-access-edit').addEventListener('click',()=>{navigation.select('settings');$<HTMLDetailsElement>('api-settings').open=true;$('api-settings').scrollIntoView({block:'start'});});
$('chat-open-access').addEventListener('click',()=>{navigation.select('settings');const section=$('api-settings');(section as HTMLDetailsElement).open=true;section.scrollIntoView({block:'start'});});
$('learn-back').addEventListener('click',()=>attempt(()=>{const d=studio.session.snapshot(),node=d.nodes.find(n=>n.id===d.activeNodeId)!;if(node.parentId)game.analyse(node.parentId);},'move-feedback','Einen Lernzug zurück.'));
let transferring=false;
$('transfer-position').addEventListener('click',async()=>{
 if(transferring)return;
 const learning=$('workspace').dataset.activeView==='learn';
 match.stop('Stellung an anderen Modus übergeben.');chatStopped=true;studio.cancelAsk();coachBoard.cancel();activeAdapter?.cancel();game.pause();
 if(!learning){const node=studio.session.snapshot().activeNodeId;navigation.select('learn',false,true,false);game.analyse(node);selected=null;render();return;}
 const source=studio.session,fen=illustration?.diagram.fen;
 transferring=true;$<HTMLButtonElement>('transfer-position').disabled=true;
 try{
  const saved=source.snapshot().game,options={human:saved?.human??$<HTMLSelectElement>('game-color').value as 'w'|'b',level:saved?.level??Number($<HTMLSelectElement>('game-level').value),engine:saved?.engine??$<HTMLSelectElement>('engine-location').value as 'server'|'browser',opponent:saved?.opponent??$<HTMLSelectElement>('game-opponent').value as 'stockfish'|'maia'};
  const sourceJson=source.export(),next=playablePosition(source,options,fen);
  await browserRuntime.store.savedGames({id:crypto.randomUUID(),title:'Sicherung vor Stellungsübergabe',date:new Date().toISOString(),json:sourceJson});
  if(studio.session!==source||source.export()!==sourceJson)throw new Error('Stellung wurde während der Übergabe gewechselt.');
  studio.session=next;illustration=undefined;selected=null;replayTip=undefined;
  window.dispatchEvent(new Event('chess-games-change'));navigation.select('play',false,true,false);render();void engineTurn();
 }catch(error){message('move-feedback',error instanceof Error?error.message:'Stellung konnte nicht übergeben werden.');}
 finally{transferring=false;$<HTMLButtonElement>('transfer-position').disabled=false;}
});
$('learn-origin').addEventListener('click',()=>attempt(()=>{const d=studio.session.snapshot();game.analyse(d.game?.cursor??d.nodes[0]!.id);},'move-feedback','Zur Ausgangsstellung der Analyse zurück.'));
installGameLibrary(browserRuntime.store,()=>studio.session.export(),json=>{restoreSession(json);navigation.select('learn');render();},()=>{match.stop('Partie laden.');studio.cancelAsk();coachBoard.cancel();activeAdapter?.cancel();game.pause();});
void(async()=>{
 let loaded=false;
 try{
  const mode=await platformReady;
  message('platform-status',mode==='web'?'Eigenständige Web-App · Daten bleiben in diesem Browser auf diesem Gerät.':'Desktopbetrieb · Schlüssel und Kosten liegen im lokalen App-Server.');
  if(mode==='web'){
   $('web-mode-link').hidden=true;$('vault-setup').hidden=false;$('desktop-update').hidden=true;$('autosave-controls').hidden=false;
   input('vault-password').required=false;
   message('key-storage-explanation','Dein Schlüssel wird verschlüsselt in diesem Browserprofil gespeichert und beim nächsten Start wieder geladen. Kein zusätzliches App-Passwort nötig. Wer dieses Browserprofil benutzt, kann den Schlüssel in der App verwenden. Nur ausdrücklich gestartete KI-Anfragen oder Zugangsprüfungen verbinden sich mit OpenAI. Der Schlüssel gehört nicht zum Partieexport.');
   $<HTMLSelectElement>('engine-location').value='browser';$<HTMLSelectElement>('engine-location').options[0]!.disabled=true;
   $('engine-options').hidden=true;
   const saved=await browserRuntime.store.get<import('../src/browser-store.js').BrowserSession>('session');
   if(saved){restoreSession(saved.json);text('question').value=typeof saved.question==='string'?saved.question.slice(0,16000):'';message('storage-feedback','Letzte Sitzung auf diesem Gerät wiederhergestellt. Eine Enginepartie bleibt zunächst pausiert.');}
  }
  loaded=true;
 }catch{message('platform-status','Lokale Daten konnten nicht vollständig geladen werden. Vor Änderungen vorhandene Sitzungsdaten sichern. Partiedateien können weiterhin geladen werden.');}
 finally{initialized=loaded;render();$('workspace').inert=false;await refreshModelStatus();await refreshCosts(true);installPwa(async()=>{if(!initialized)throw new Error('Lokale Sitzung nicht bereit.');await autosave.save();});}
})();

window.addEventListener('chess-vault-change',()=>{void refreshModelStatus();void refreshCosts();});
