import {Session,type SessionData} from '../src/session.js';
import {germanSan} from '../src/german-notation.js';
import {parsePgn,reviewDecisions,reviewLocked,reviewSummary,REVIEW_QUESTIONS,type ParsedGame,type ReviewQuestion,type PlayerColor} from '../src/review.js';

export function installReviewUI(current:()=>Session,replace:(next:Session)=>void,render:()=>void) {
 const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 let cachedPgn='',parsed:ParsedGame|undefined;
 const drafts=new WeakMap<Session,Map<string,string>>();
 const draftKey=()=>{const r=current().snapshot().review;if(!r)return '';const answers=r.responses[r.original[r.decision]!]??{},question=REVIEW_QUESTIONS.find(q=>!answers[q.key]);return r.original[r.decision]+':'+(question?.key??'done');};
 $('review-answer').addEventListener('input',()=>{let values=drafts.get(current());if(!values){values=new Map();drafts.set(current(),values);}values.set(draftKey(),$<HTMLTextAreaElement>('review-answer').value);});
 const info=(message:string)=>{$('review-feedback').textContent=message;};
 const action=(run:()=>void)=>{try{run();render();info('');}catch(error){info(error instanceof Error?error.message:'Vorgang fehlgeschlagen.');}};
 $('pgn-import-form').addEventListener('submit',event=>{
  event.preventDefault();
  action(()=>{
   const existing=current().snapshot();
   if((existing.nodes.length>1||existing.annotations.length||existing.game)&&!$<HTMLInputElement>('review-replace').checked)throw new Error('Der Import öffnet eine neue Sitzung. Bitte vorher sichern und den Sitzungswechsel bestätigen.');
   const next=Session.fromPgn($<HTMLTextAreaElement>('pgn-input').value,$<HTMLSelectElement>('pgn-color').value as PlayerColor|'auto',$<HTMLInputElement>('pgn-player').value);
   replace(next);$<HTMLTextAreaElement>('pgn-input').value='';$<HTMLInputElement>('review-replace').checked=false;
   $<HTMLDetailsElement>('review-import').open=false;
  });
 });
 $('pgn-file').addEventListener('change',async()=>{
  const input=$<HTMLInputElement>('pgn-file'),file=input.files?.[0];if(!file)return;
  try{
   if(file.size>262144)throw new Error('PGN-Datei ist größer als 256 KiB.');
   $<HTMLTextAreaElement>('pgn-input').value=await file.text();
   info('PGN-Datei eingelesen. Farbe prüfen und „Partie zum Verstehen öffnen“ wählen.');
  }catch(error){info(error instanceof Error?error.message:'Datei konnte nicht gelesen werden.');}
  input.value='';
 });
 $('review-decision').addEventListener('change',()=>action(()=>current().reviewDecision(Number($<HTMLSelectElement>('review-decision').value))));
 for(const [id,direction] of [['review-prev',-1],['review-next',1]] as const)$(id).addEventListener('click',()=>action(()=>{
  const data=current().snapshot(),r=data.review!;const decisions=reviewDecisions(r,data),index=decisions.indexOf(r.decision);
  const next=decisions[index+direction];if(next!==undefined)current().reviewDecision(next);
 }));
 $('review-answer-form').addEventListener('submit',event=>{
  event.preventDefault();action(()=>{
   drafts.get(current())?.delete(draftKey());
   current().reviewAnswer($<HTMLInputElement>('review-question-key').value as ReviewQuestion,$<HTMLTextAreaElement>('review-answer').value);
   $<HTMLTextAreaElement>('review-answer').value='';
  });
 });
 $('review-unknown').addEventListener('click',()=>action(()=>{
  drafts.get(current())?.delete(draftKey());
   current().reviewAnswer($<HTMLInputElement>('review-question-key').value as ReviewQuestion,'Weiß ich nicht mehr.');
  $<HTMLTextAreaElement>('review-answer').value='';
 }));
 $('review-reveal').addEventListener('click',()=>action(()=>current().revealReview()));
 $('review-return').addEventListener('click',()=>action(()=>{const r=current().snapshot().review!;current().reviewDecision(r.decision);}));
 $('review-whole').addEventListener('click',()=>action(()=>current().guideReview(false)));
 $('review-resume').addEventListener('click',()=>action(()=>current().guideReview(true)));
 $('review-finish').addEventListener('click',()=>action(()=>current().finishReview()));
 $('review-summary-chat').addEventListener('click',()=>{
  $<HTMLSelectElement>('dialogue-topic').value='review';
  $<HTMLTextAreaElement>('question').value='Besprechen wir meine festgehaltenen Entscheidungen. Welche belegten Lernansätze und gelungenen Ideen ergeben sich daraus? Trenne eigene Angaben und unbekannte Motive und schlage eine passende nächste Übung vor.';
  $('question').focus();info('Zusammenfassung vorbereitet. Erst „Nachricht senden“ startet eine Anfrage.');
 });
 return {
  render(data:SessionData){
   if(data.review&&!data.review.browsing)document.querySelector<HTMLDetailsElement>('#learning-extras')!.open=true;
   const r=data.review;$('review-panel').hidden=!r||!!r.browsing;
   $('pgn-game-info').hidden=true;$('pgn-game-comments').hidden=true;
   document.body.dataset.reviewLocked=String(reviewLocked(data));
   $('review-replace-hint').hidden=!(data.nodes.length>1||data.annotations.length||data.game);
   if(!r)return;
   if(cachedPgn!==r.pgn){parsed=parsePgn(r.pgn);cachedPgn=r.pgn;}
   if(r.browsing){
    $('pgn-game-info').hidden=false;$('pgn-game-info').textContent=`${parsed!.headers.White??'Weiß'} – ${parsed!.headers.Black??'Schwarz'} · ${parsed!.headers.Result??'*'}`;
    const index=r.original.indexOf(data.activeNodeId),comment=index===0?parsed!.rootComment:index>0?parsed!.moves[index-1]!.comment:'';
    $('pgn-game-comment').textContent=comment;$('pgn-game-comments').hidden=!comment;return;
   }
   const game=parsed!,ply=game.moves[r.decision]!,decisions=reviewDecisions(r,data);
   $('review-meta').textContent=`${game.headers.White??'Weiß'} – ${game.headers.Black??'Schwarz'} · Ergebnis ${game.headers.Result??'*'} · Zeitkontrolle ${game.headers.TimeControl??'unbekannt'} · Deine Seite: ${r.human==='b'?'Schwarz':'Weiß'}`;
   const select=$<HTMLSelectElement>('review-decision');select.replaceChildren();
   for(const index of decisions){const option=document.createElement('option');option.value=String(index);option.textContent=`Vor ${game.moves[index]!.number}${r.human==='b'?'... Schwarz':'. Weiß'}`;select.append(option);}
   select.value=String(r.decision);
   $<HTMLButtonElement>('review-prev').disabled=decisions[0]===r.decision;
   $<HTMLButtonElement>('review-next').disabled=decisions.at(-1)===r.decision;
   $('review-status').textContent=`Vor deinem ${ply.number}. Zug · ${r.human==='b'?'Schwarz':'Weiß'} am Zug${data.activeNodeId!==r.original[r.decision]?' · Du untersuchst gerade eine andere Stellung/Variante.':''}`;
   $('review-time').textContent=ply.spent===null?'Bedenkzeit dieses Zugs unbekannt oder nicht sicher aus benachbarten Uhrenständen ableitbar.':`Damals verbrauchte Bedenkzeit: ${ply.spent} Sekunden (aus den Uhrenständen deiner Seite).`;
   const answers=r.responses[r.original[r.decision]!]??{};
   const question=REVIEW_QUESTIONS.find(q=>!answers[q.key]);
   $('review-answer-form').hidden=!question;
   if(question){$<HTMLTextAreaElement>('review-answer').value=drafts.get(current())?.get(draftKey())??'';$('review-question').textContent=question.text;$<HTMLInputElement>('review-question-key').value=question.key;}
   $('review-answers').replaceChildren();
   for(const q of REVIEW_QUESTIONS)if(answers[q.key]){const p=document.createElement('p');p.textContent=`${q.text} – Deine Angabe: ${answers[q.key]}`;$('review-answers').append(p);}
   const revealed=!r.guiding||r.revealed.includes(r.decision);
   $('review-played').hidden=!revealed;
   $('review-played').textContent=revealed?`Damals gespielt: ${ply.number}${r.human==='b'?'…':'.'} ${germanSan(ply.san)}. Das ist der historische Zug, keine Bewertung.`:'';
   $('review-concealed').hidden=revealed;
   $<HTMLButtonElement>('review-reveal').disabled=revealed;
   $('review-comment-output').textContent=revealed?ply.comment:'';
   $('review-comment').hidden=!revealed||!ply.comment;
   $('review-resume').hidden=r.guiding;$('review-whole').hidden=!r.guiding;
   $('review-guidance').textContent=r.guiding?'Originalzug zunächst verborgen. Eine eigene Angabe oder bewusstes Aufdecken öffnet die Auflösung. Es erfolgt keine automatische Analyse.':'Die vollständige Originalpartie ist ausdrücklich freigegeben. „Geführten Rückblick fortsetzen“ verbirgt die kommenden Züge wieder.';
   $('review-summary').hidden=!r.completed;
   if(r.completed){
    $('review-summary-entries').replaceChildren();
    for(const line of reviewSummary(data)){const item=document.createElement('li');item.textContent=line;$('review-summary-entries').append(item);}
   }
  }
 };
}
