import { Chess, type Square } from 'chess.js';
import { Studio, SimulationAdapter, type SimulationMode } from '../src/dialogue.js';
import { ServerModelAdapter } from '../src/model-client.js';
import './style.css';

const studio = new Studio();
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => $<HTMLInputElement>(id);
const text = (id: string) => $<HTMLTextAreaElement>(id);
let selected: Square | null = null;
let pending = false;
let modelAvailable = false;
const modelMode = () => $<HTMLSelectElement>('dialogue-mode').value === 'model';
function updateMode() {
  const real = modelMode();
  $<HTMLButtonElement>('ask').textContent = real ? 'Plan diskutieren (reale KI)' : 'Plan diskutieren (Simulation)';
  $<HTMLButtonElement>('ask').disabled = pending || (real && !modelAvailable);
  $('simulation-hint').hidden = real;
  message('mode-badge', real ? 'Reale KI · Hypothesen · Kann API-Kosten verursachen' : 'Simulation · Keine reale KI · Keine Modellanfragen');
}
async function refreshModelStatus() {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error();
    const status = await response.json();
    modelAvailable = status.available === true && status.remaining > 0;
    message('model-status', modelAvailable ? `Reale KI freigegeben. Verbleibende Anfragen im Serverprozess: ${status.remaining}. Keine Kostengarantie.` : 'Reale KI gesperrt oder Anfragelimit erreicht. Simulation ist verfügbar.');
  } catch { modelAvailable = false; message('model-status', 'Modellserver nicht verfügbar. Simulation ist verfügbar.'); }
  updateMode();
}
$('dialogue-mode').addEventListener('change', updateMode);
void refreshModelStatus();
function message(id: string, value: string) { $(id).textContent = value; }
function attempt(action: () => void, target: string, success: string) {
  try { action(); selected = null; render(); message(target, success); }
  catch (error) { message(target, error instanceof Error ? error.message : 'Vorgang fehlgeschlagen.'); }
}
function move(value: string | { from: string; to: string; promotion: string }) {
  attempt(() => {
    if (studio.session.status().gameOver) throw new Error('Partie beendet. Wähle eine frühere Stellung für eine neue Variante.');
    try { studio.session.play(value); } catch { throw new Error('Dieser Zug ist hier nicht legal. Prüfe Eingabe und Stellung.'); }
    input('move').value = '';
  }, 'move-feedback', 'Zug gespielt.');
}
function render() {
  const data = studio.session.snapshot();
  const current = data.nodes.find(n => n.id === data.activeNodeId)!;
  const chess = new Chess(current.fen);
  const status = studio.session.status();
  message('position-status', `${current.id} · ${chess.turn() === 'w' ? 'Weiß' : 'Schwarz'} am Zug${status.checkmate ? ' · Schachmatt' : status.draw ? ' · Remis' : status.check ? ' · Schach' : ''}`);
  const pieces: Record<string, string> = { wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟' };
  const names: Record<string, string> = { k:'König',q:'Dame',r:'Turm',b:'Läufer',n:'Springer',p:'Bauer' };
  const targets = selected && !status.gameOver ? chess.moves({ square: selected, verbose: true }).map(m => m.to) : [];
  const board = $('board'); board.replaceChildren();
  for (const [rankIndex, rank] of chess.board().entries()) {
    for (let file = 0; file < 8; file++) {
      const square = `${'abcdefgh'[file]}${8-rankIndex}` as Square;
      const piece = rank[file];
      const button = document.createElement('button'); button.type = 'button';
      button.className = `${(rankIndex + file) % 2 ? 'dark' : ''} ${targets.includes(square) ? 'target' : ''}`;
      button.setAttribute('aria-label', `${square}: ${piece ? `${piece.color === 'w' ? 'Weiß' : 'Schwarz'} ${names[piece.type]}` : 'leer'}`);
      button.setAttribute('aria-pressed', String(selected === square));
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
  const variants = $('variations'); variants.replaceChildren();
  // Build iteratively so deeply imported lines do not overflow the render stack.
  const lists = new Map<string | null, HTMLUListElement>();
  const rootList = document.createElement('ul'); lists.set(null, rootList); variants.append(rootList);
  for (const node of data.nodes) {
    const li = document.createElement('li'); const button = document.createElement('button');
    button.textContent = `${node.id} · ${node.san ?? 'Ausgangsstellung'}`;
    button.setAttribute('aria-current', String(node.id === current.id));
    button.addEventListener('click', () => { studio.session.select(node.id); selected = null; render(); message('move-feedback', 'Stellung gewechselt.'); });
    li.append(button); lists.get(node.parentId)!.append(li);
    const children = document.createElement('ul'); li.append(children); lists.set(node.id, children);
  }
  for (const [kind, id] of [['dialogue', 'dialogue'], ['memory', 'memories']] as const) {
    const container = $(id); container.replaceChildren();
    for (const a of data.annotations.filter(a => a.nodeId === current.id && a.kind === kind)) {
      const entry = document.createElement('article'); entry.className = 'entry';
      const meta = document.createElement('small');
      meta.textContent = `${a.nodeId} · ${a.source === 'human' ? 'Mensch' : a.source === 'simulation' ? 'Simulation · Keine reale KI' : 'Modell'} · ${a.hypothesis ? 'Hypothese' : 'Eigene Eingabe'}`;
      const body = document.createElement('div'); body.textContent = a.text;
      entry.append(meta, body);
      if (a.openQuestions.length) { const questions = document.createElement('p'); questions.textContent = `Offen: ${a.openQuestions.join(' / ')}`; entry.append(questions); }
      container.append(entry);
    }
  }
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
$('dialogue-form').addEventListener('submit', async event => {
  event.preventDefault(); if (pending || (modelMode() && !modelAvailable)) return;
  const real = modelMode();
  const question = text('question').value;
  const session = studio.session;
  pending = true; $<HTMLButtonElement>('ask').disabled = true;
  message('dialogue-feedback', `${real ? 'Modellanfrage' : 'Simulation'} läuft … Stellungswechsel ist weiterhin möglich.`);
  try {
    const result = await studio.ask(question, real ? new ServerModelAdapter() : new SimulationAdapter($<HTMLSelectElement>('simulation-mode').value as SimulationMode));
    message('dialogue-feedback', result === 'stored' ? `${real ? 'Modellantwort' : 'Beispielantwort'} an der angefragten Stellung gespeichert.` : 'Veraltete Antwort nach Sitzungswechsel verworfen.');
    render();
  } catch (error) {
    message('dialogue-feedback', studio.session !== session ? 'Veraltete Anfrage nach Sitzungswechsel verworfen.' : error instanceof Error ? error.message : 'Anfrage fehlgeschlagen.');
  } finally { pending = false; updateMode(); if (real) void refreshModelStatus(); }
});
$('export').addEventListener('click', () => {
  text('session-json').value = studio.session.export();
  const blob = new Blob([studio.session.export()], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = 'schachlabor-sitzung.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('storage-feedback', 'JSON bereitgestellt und als Datei exportiert.');
});
$('import').addEventListener('click', () => attempt(() => studio.restore(text('session-json').value), 'storage-feedback', 'Sitzung wiederhergestellt.'));
render();

$('session-file').addEventListener('change', async () => {
  const file = $<HTMLInputElement>('session-file').files?.[0];
  if (!file) return;
  try {
    const json = await file.text();
    attempt(() => { studio.restore(json); text('session-json').value = json; }, 'storage-feedback', 'Sitzung aus Datei wiederhergestellt.');
  } catch { message('storage-feedback', 'Datei konnte nicht gelesen werden.'); }
  $<HTMLInputElement>('session-file').value = '';
});
