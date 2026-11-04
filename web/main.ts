import { Chess, type Square } from 'chess.js';
import { Studio, SimulationAdapter, type SimulationMode } from '../src/dialogue.js';
import { ServerModelAdapter } from '../src/model-client.js';
import { checkTactics, ServerTacticalAdapter } from '../src/tactics.js';
import './style.css';

const studio = new Studio();
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => $<HTMLInputElement>(id);
const text = (id: string) => $<HTMLTextAreaElement>(id);
let selected: Square | null = null;
let pending = false;
let tacticalPending = false;
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
    message('model-status', modelAvailable ? `KI-Zugang konfiguriert, noch kein Verbindungsnachweis. Verbleibende Anfragen im Serverprozess: ${status.remaining}. Keine Kostengarantie.` : 'Reale KI gesperrt oder Anfragelimit erreicht. Simulation ist verfügbar.');
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
  $<HTMLButtonElement>('tactical-check').disabled = tacticalPending || status.gameOver;
  const reports = $('tactical-results'); reports.replaceChildren();
  for (const a of data.annotations.filter(a => a.nodeId === current.id && a.kind === 'factcheck')) {
    const r = a.engine!;
    const article = document.createElement('article'); article.className = 'entry';
    const meta = document.createElement('small'); meta.textContent = `${a.nodeId} · ${r.engine} · Lokaler Suchbefund`;
    const result = document.createElement('div');
    const score = r.score.unit === 'cp' ? `${r.score.value} Centipawns (positive Werte für Weiß)`
      : `Mattdistanz ${Math.abs(r.score.value)} für ${r.score.value > 0 ? 'Weiß' : 'Schwarz'}`;
    result.textContent = `Suchwert: ${score}\nUntersuchte Variante: ${r.line.join(' ')}\n${r.candidate ? `Geprüfter eigener Kandidat: ${r.candidate}` : 'Stellung untersucht, keine Zugvorgabe.'}\nErreicht: Tiefe ${r.depth}, ${r.nodes} Knoten, ${r.elapsedMs} ms einschließlich Engine-Start.\nGrenzen: Tiefe 12 / 20.000 Knoten / 1 Sekunde Suchzeit, 1 Thread, 16 MiB Hash.\nFEN ohne Wiederholungshistorie. Keine strategische Freigabe.`;
    article.append(meta,result); reports.append(article);
  }

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
  } finally { pending = false; updateMode(); if (real) {void refreshModelStatus();void refreshCosts();} }
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

$('tactical-form').addEventListener('submit', async event => {
  event.preventDefault(); if (tacticalPending) return;
  const session = studio.session;
  tacticalPending = true; render();
  message('tactical-feedback', 'Lokaler Faktencheck läuft … Stellungswechsel ist weiterhin möglich.');
  try {
    const result = await checkTactics(session, () => studio.session, new ServerTacticalAdapter(), input('tactical-candidate').value.trim() || null);
    message('tactical-feedback', result === 'stored' ? 'Suchbefund an der angefragten Stellung gespeichert.' : 'Veralteter Suchbefund nach Sitzungswechsel verworfen.');
  } catch (error) {
    message('tactical-feedback', studio.session !== session ? 'Veralteter Faktencheck verworfen.' : error instanceof Error ? error.message : 'Faktencheck fehlgeschlagen.');
  } finally { tacticalPending = false; render(); }
});

$('api-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!input('api-cost-consent').checked) return;
  const button = $<HTMLButtonElement>('api-connect'); button.disabled = true;
  try {
    // The field is cleared immediately after transmission; no browser storage or session annotation.
    const responsePromise = fetch('/api/model-config', { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'connect',apiKey:input('api-key').value,model:input('api-model').value.trim(),allowPaid:true}),
      signal:AbortSignal.timeout(5000) });
    input('api-key').value = ''; input('api-cost-consent').checked = false;
    const response = await responsePromise;
    if (!response.ok) throw new Error('KI-Zugang konnte nicht eingerichtet werden. Schlüssel, Modell und laufende Anfragen prüfen.');
    await refreshModelStatus();
    $<HTMLSelectElement>('dialogue-mode').value = 'model'; updateMode();
    message('api-feedback','Schlüssel lokal gespeichert und für den nächsten Start hinterlegt. Noch keine Modellanfrage ausgeführt. Stelle jetzt eine Planfrage.');
  } catch (error) { message('api-feedback', error instanceof Error ? error.message : 'Lokaler Server nicht erreichbar.'); }
  finally { input('api-key').value = ''; button.disabled = false; }
});
$('api-disconnect').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/model-config', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'disconnect'}),signal:AbortSignal.timeout(5000)});
    if (!response.ok) throw new Error();
    input('api-key').value = ''; input('api-cost-consent').checked = false;
    $<HTMLSelectElement>('dialogue-mode').value = 'simulation';
    await refreshModelStatus();
    message('api-feedback','Gespeicherter Schlüssel gelöscht. Reale KI ist gesperrt.');
  } catch { message('api-feedback','Schlüssel konnte nicht entfernt werden. Eine laufende Anfrage abwarten und das Löschen erneut versuchen.'); }
});

async function localPost(path:string,body:unknown):Promise<any> {
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('Aktion fehlgeschlagen. Konfiguration, Projektänderungen und Zugriff prüfen.');
  return response.json();
}
async function diagnosticData() {
  const response=await fetch('/api/diagnostics');if(!response.ok)throw new Error('Diagnose nicht verfügbar.');return response.json();
}
async function refreshCosts(fill=false) {
  try{
    const d=await diagnosticData(), c=d.model.costs;
    message('cost-summary',`Geschätzter Verbrauch: ${Number(c.estimatedUsd).toFixed(6)} USD / ${c.budgetUsd} USD · ${c.requests}/3 Anfragen · ${c.promptTokens} Eingabe- und ${c.completionTokens} Ausgabe-Tokens bestätigt · ${c.uncertainRequests} Anfragen mit unsicherer Abrechnung.`);
    if(fill){input('cost-budget').value=String(c.budgetUsd);input('cost-input').value=String(c.inputUsdPerMillion);input('cost-output').value=String(c.outputUsdPerMillion);}
  }catch{message('cost-summary','Kostenstatus nicht verfügbar.');}
}
void refreshCosts(true);
$('cost-form').addEventListener('submit',async event=>{
  event.preventDefault();try{
    await localPost('/api/costs',{action:'configure',budgetUsd:Number(input('cost-budget').value),inputUsdPerMillion:Number(input('cost-input').value),outputUsdPerMillion:Number(input('cost-output').value)});
    await refreshCosts();message('cost-feedback','Budget und Preisannahmen lokal gespeichert.');
  }catch{message('cost-feedback','Kostenlimit konnte nicht gespeichert werden. Werte und laufende Anfrage prüfen.');}
});
$('cost-reset').addEventListener('click',async()=>{
  if(!input('cost-reset-consent').checked){message('cost-feedback','Bitte den Neustart der Budgetperiode bestätigen.');return;}
  try{await localPost('/api/costs',{action:'reset',confirm:true});input('cost-reset-consent').checked=false;await refreshCosts();await refreshModelStatus();message('cost-feedback','Neue Budgetperiode gespeichert. Das zusätzliche Limit pro Serverstart bleibt bestehen.');}
  catch{message('cost-feedback','Budgetperiode konnte nicht neu gestartet werden.');}
});
$('diagnose').addEventListener('click',async()=>{
  try{const d=await diagnosticData();message('diagnostic-output',`Node.js: ${d.node} · System: ${d.platform}\nKI-Zugang: ${d.model.configured?'konfiguriert (noch kein Verbindungsnachweis)':'nicht konfiguriert'}\nModell: ${d.model.model??'keines'}\nVerbleibende Anfragen: ${d.model.remaining}\nUpdate: ${d.update?.message??'nicht verfügbar'}\nKeine Schlüsselwerte oder Sitzungstexte in dieser Diagnose.`);await refreshCosts();}
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
