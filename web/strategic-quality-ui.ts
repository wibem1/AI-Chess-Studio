import type {Session} from '../src/session.js';
import {parsePgn} from '../src/review.js';
import {recordedModelAnswer} from '../src/evaluation-provenance.js';
import {matchingStrategyAnswers} from '../src/strategic-answer-matching.js';
import {recordStrategicEvaluation,strategicEvaluationCase,
 STRATEGIC_EVALUATION_DIMENSIONS,type EvaluationRatings,type StrategicEvaluationCase,
 type StrategicEvaluationRecord} from '../src/strategic-evaluation.js';

const cases=[
 {ply:11,played:'e5',annotatedAlternative:'Nc3',followingReply:'dxe5'},
 {ply:35,played:'Nd6',annotatedAlternative:'Rxf6',followingReply:'Re7'},
 {ply:41,played:'Nxb7',annotatedAlternative:'Ne4',followingReply:'Rxb7'},
 {ply:55,played:'Rd1',annotatedAlternative:'b4',followingReply:'Nxg3'},
 {ply:93,played:'Rxg7',annotatedAlternative:'Ra7',followingReply:'Nxg7'}
] as const;
const names:Record<typeof STRATEGIC_EVALUATION_DIMENSIONS[number],string>={
 boardAccuracy:'Bretttreue',strategicContent:'Strategischer Gehalt',
 planExecution:'Plan und Umsetzung',opponentCounterplay:'Gegnerisches Gegenspiel',learningValue:'Lernwert'
};
const el=<T extends HTMLElement>(tag:string,txt?:string):T=>{
 const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e as T;
};
const add=(parent:HTMLElement,tag:string,value:string)=>{
 const p=el<HTMLElement>(tag,value);parent.append(p);return p;
};
const limit=120000;

/** Optional, user-operated evaluation panel. Never starts an AI or engine request. */
export function installStrategicQualityUI(getSession:()=>Session,prepareQuestion:(fen:string,question:string)=>void):void {
 const host=document.getElementById('settings-diagnosis');
 if(!host)return;
 const details=el<HTMLDetailsElement>('details'),summary=el<HTMLElement>('summary','Schachliche KI-Qualität vergleichen (manuell)');
 details.id='strategic-quality';details.className='tool-section';details.append(summary);
 add(details,'p','Bewerte tatsächliche KI-Antworten auf fünf belegte Schlüsselstellungen der importierten Lichess-Partie 1Vh80QL2. Kein automatischer Modellaufruf oder Engineurteil.');
 const status=add(details,'p','Bitte zuerst die Referenz-PGN als Partie öffnen.');status.id='strategic-quality-status';status.setAttribute('role','status');
 const refresh=el<HTMLButtonElement>('button','Prüfungsfälle aus geöffneter Partie laden');refresh.type='button';details.append(refresh);
 const caseLabel=add(details,'label','Schlüsselstellung');caseLabel.setAttribute('for','strategic-quality-case');
 const caseSelect=el<HTMLSelectElement>('select');caseSelect.id='strategic-quality-case';details.append(caseSelect);
 const question=add(details,'p','');question.className='hint';question.id='strategic-quality-question';
 const evidence=add(details,'p','');evidence.className='hint';
 const prepare=el<HTMLButtonElement>('button','Stellung und Prüffrage vorbereiten');prepare.type='button';prepare.id='strategic-quality-prepare';details.append(prepare);
 const modelLabel=add(details,'label','Modellbezeichnung');modelLabel.setAttribute('for','strategic-quality-model');
 const model=el<HTMLInputElement>('input');model.id='strategic-quality-model';model.maxLength=160;details.append(model);
 const thinkingLabel=add(details,'label','Denkstufe');thinkingLabel.setAttribute('for','strategic-quality-thinking');
 const thinking=el<HTMLInputElement>('input');thinking.id='strategic-quality-thinking';thinking.maxLength=80;details.append(thinking);
 const sourceLabel=add(details,'label','Vorhandene Modellantwort aus der Partie');sourceLabel.setAttribute('for','strategic-quality-source');
 const sourceSelect=el<HTMLSelectElement>('select');sourceSelect.id='strategic-quality-source';details.append(sourceSelect);
 const responseLabel=add(details,'label','Tatsächliche Antwort (aus Chat übernehmen oder einfügen)');responseLabel.setAttribute('for','strategic-quality-response');
 const response=el<HTMLTextAreaElement>('textarea');response.id='strategic-quality-response';response.rows=6;response.maxLength=20000;details.append(response);
 const controls=new Map<string,{score:HTMLSelectElement;reason:HTMLTextAreaElement}>();
 for(const key of STRATEGIC_EVALUATION_DIMENSIONS){
  const l=add(details,'label',names[key]);l.setAttribute('for','strategic-quality-score-'+key);
  const score=el<HTMLSelectElement>('select');score.id='strategic-quality-score-'+key;
  for(const [v,label] of [['','Bewertung wählen'],['0','0 – mangelhaft'],['1','1 – schwach'],['2','2 – gut'],['3','3 – sehr gut']] as const){
   const o=el<HTMLOptionElement>('option',label);o.value=v;score.append(o);
  }
  details.append(score);
  const reason=el<HTMLTextAreaElement>('textarea');reason.rows=2;reason.maxLength=1500;reason.placeholder='Begründung mit Bezug auf die konkrete Stellung';reason.setAttribute('aria-label','Begründung: '+names[key]);details.append(reason);
  controls.set(key,{score,reason});
 }
 const save=el<HTMLButtonElement>('button','Bewertung übernehmen');save.type='button';save.id='strategic-quality-save';details.append(save);
 const download=el<HTMLButtonElement>('button','Vergleich als JSON herunterladen');download.type='button';download.id='strategic-quality-export';details.append(download);
 const uploadLabel=add(details,'label','Früheren Vergleich aus JSON-Datei importieren');uploadLabel.setAttribute('for','strategic-quality-import');
 const upload=el<HTMLInputElement>('input');upload.type='file';upload.accept='.json,application/json';upload.id='strategic-quality-import';details.append(upload);
 const results=el<HTMLDivElement>('div');results.id='strategic-quality-results';details.append(results);
 host.append(details);
 let current:StrategicEvaluationCase[]=[];
 let records:StrategicEvaluationRecord[]=[];
 const selected=()=>current[Number(caseSelect.value)];
 const present=()=>{
  results.replaceChildren();
  add(results,'p',records.length?records.length+' manuell bewertete Antworten · nach Stellung und Modell':'Noch keine bewertete KI-Antwort.');
  if(!records.length)return;
  const table=el<HTMLTableElement>('table');const header=el<HTMLTableRowElement>('tr');
  for(const title of ['Stellung','Modell','Denkstufe','Punkte','Antwort'])header.append(el<HTMLTableCellElement>('th',title));
  table.append(header);
  for(const item of records){
   const tr=el<HTMLTableRowElement>('tr');
   for(const text of [item.caseId,item.model,item.thinkingLevel,item.total+' / 15']){
    tr.append(el<HTMLTableCellElement>('td',text));
   }
   const td=el<HTMLTableCellElement>('td'),d=el<HTMLDetailsElement>('details');
   d.append(el<HTMLElement>('summary','Antwort und fünf Begründungen'));
   add(d,'p',item.response);
   for(const key of STRATEGIC_EVALUATION_DIMENSIONS)add(d,'p',names[key]+': '+item.ratings[key].score+' / 3 – '+item.ratings[key].reason);
   td.append(d);tr.append(td);table.append(tr);
  }
  results.append(table);
 };
 const fillResponses=()=>{
  sourceSelect.replaceChildren();
  const none=el<HTMLOptionElement>('option','Manuell einfügen');none.value='';sourceSelect.append(none);
  const point=selected();if(!point)return;
  const snap=getSession().snapshot();
  const match=snap.nodes.filter(n=>n.fen===point.fen);
  const names=new Set(match.map(n=>n.id));
  const entries=matchingStrategyAnswers(snap.annotations,names);
  entries.forEach((a,i)=>{const opt=el<HTMLOptionElement>('option','Modellantwort '+(i+1)+' · '+a.nodeId);opt.value=String(i);sourceSelect.append(opt);});
  sourceSelect.onchange=()=>{
   const n=Number(sourceSelect.value);
   if(sourceSelect.value!==''&&entries[n]){
    const parsed=recordedModelAnswer(entries[n]!.text);
    response.value=parsed.response.slice(0,20000);
    if(parsed.receiptPresent){model.value=parsed.model!;thinking.value=parsed.thinkingLevel!;
     status.textContent='Modell und Denkstufe aus dem gespeicherten App-Nachweis übernommen; Angaben vor dem Vergleich prüfen.';
    }else{
     model.value='';thinking.value='';
     status.textContent='Antwort übernommen, aber ohne zuordenbaren App-Modellnachweis. Modell und Denkstufe bitte selbst prüfen und eintragen.';
    }
   }
  };
 };
 const showSelected=()=>{
  const item=selected();question.textContent=item?item.question:'';
  evidence.textContent=item?'Vor Halbzug '+item.ply+' · '+item.fen+' · gespielt: '+item.played+
   ' · PGN-Alternative: '+item.annotatedAlternative+' · tatsächliche Antwort: '+item.followingReply:'';
  fillResponses();
 };
 const reload=()=>{
  try{
   const snap=getSession().snapshot();
   if(!snap.review?.pgn)throw Error('Bitte die belegte Lichess-PGN als Partie importieren.');
   const game=parsePgn(snap.review.pgn);
   if(game.headers.Site!=='https://lichess.org/game/1Vh80QL2'||game.moves.length!==137)
    throw Error('Die geöffnete Partie ist nicht die Referenzpartie 1Vh80QL2.');
   const moves=game.moves.map(m=>m.san);
   const loaded=cases.map(c=>strategicEvaluationCase(moves,{
    ...c,caseId:'lichess-1Vh80QL2-ply-'+c.ply,source:'https://lichess.org/game/1Vh80QL2'
   }));
   // Verify against saved source positions, not only against SAN legality.
   for(const item of loaded)if(game.moves[item.ply-1]!.before!==item.fen)
    throw Error('Die Schlüsselstellung stimmt nicht mit der PGN überein.');
   current=loaded;caseSelect.replaceChildren();
   for(const [i,c] of loaded.entries()){const o=el<HTMLOptionElement>('option','Vor Halbzug '+c.ply+' · '+c.played);o.value=String(i);caseSelect.append(o);}
   showSelected();status.textContent='Fünf Originalstellungen geladen. Es werden keine KI-Anfragen gestartet.';
  }catch(e){current=[];caseSelect.replaceChildren();question.textContent='';evidence.textContent='';sourceSelect.replaceChildren();status.textContent=e instanceof Error?e.message:'Partie nicht lesbar.';}
 };
 refresh.onclick=reload;caseSelect.onchange=showSelected;
 prepare.onclick=()=>{
  try{
   const item=selected();if(!item)throw Error('Bitte zuerst eine geprüfte Schlüsselstellung laden.');
   prepareQuestion(item.fen,item.question);
   status.textContent='Stellung und Frage sind im Lernmodus vorbereitet. Erst „Senden“ startet eine kostenpflichtige KI-Anfrage.';
  }catch(error){status.textContent=error instanceof Error?error.message:'Stellung konnte nicht vorbereitet werden.';}
 };
 save.onclick=()=>{
  try{
   const item=selected();if(!item)throw Error('Zuerst eine geprüfte Schlüsselstellung laden.');
   const ratings={} as EvaluationRatings;
   for(const key of STRATEGIC_EVALUATION_DIMENSIONS){
    const ctrl=controls.get(key)!;
    ratings[key]={score:Number(ctrl.score.value) as 0|1|2|3,reason:ctrl.reason.value};
    if(ctrl.score.value==='')throw Error('Bewertung fehlt: '+names[key]);
   }
   const record=recordStrategicEvaluation(item,{fen:item.fen,model:model.value,
    thinkingLevel:thinking.value,response:response.value,ratings});
   records=[...records.filter(r=>!(r.caseId===record.caseId&&r.model===record.model&&r.thinkingLevel===record.thinkingLevel)),record];
   present();status.textContent='Bewertung in dieser App-Sitzung übernommen. Für dauerhafte Sicherung bitte JSON herunterladen.';
  }catch(e){status.textContent=e instanceof Error?e.message:'Bewertung konnte nicht gespeichert werden.';}
 };
 download.onclick=()=>{
  if(!records.length){status.textContent='Es sind noch keine Bewertungen vorhanden.';return;}
  const payload=JSON.stringify({schemaVersion:1,source:'manual_chess_strategy_quality',records},null,2);
  const blob=new Blob([payload],{type:'application/json'}),url=URL.createObjectURL(blob);
  const a=el<HTMLAnchorElement>('a');a.href=url;a.download='chess-strategie-qualitaetsvergleich.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='JSON-Download gestartet. Achtung: Enthält die vollständigen privaten Modellantworten.';
 };
 upload.onchange=async()=>{
  try{
   const file=upload.files?.[0];if(!file)return;
   if(file.size>limit)throw Error('Vergleichsdatei zu groß.');
   const raw=JSON.parse(await file.text()) as {schemaVersion?:unknown;source?:unknown;records?:unknown};
   if(raw.schemaVersion!==1||raw.source!=='manual_chess_strategy_quality'||!Array.isArray(raw.records)||raw.records.length>100)
    throw Error('Unbekanntes Vergleichsformat.');
   // Revalidate EVERY record against a currently loaded, source-verified case.
   if(!current.length)throw Error('Vor dem Import zuerst die Referenzpartie laden.');
   const checked=raw.records.map((r:unknown)=>{
    if(!r||typeof r!=='object')throw Error('Ungültiger Datensatz.');
    const v=r as Partial<StrategicEvaluationRecord>;
    const c=current.find(c=>c.caseId===v.caseId&&c.fen===v.fen);
    if(!c)throw Error('Bewertung gehört nicht zur geladenen Partie.');
    return recordStrategicEvaluation(c,{fen:c.fen,model:v.model??'',thinkingLevel:v.thinkingLevel??'',response:v.response??'',ratings:v.ratings!});
   });
   records=checked;present();status.textContent=checked.length+' Bewertungen aus Datei geprüft und geladen.';
  }catch(e){status.textContent=e instanceof Error?e.message:'Vergleich konnte nicht geladen werden.';}
  finally{upload.value='';}
 };
 present();
}
