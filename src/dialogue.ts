import {normalizeModelReply} from './model-reply.js';
import {asksForGameReview,validateGameReview,formatGameReview,type GameReview} from './game-review.js';
import {Chess} from 'chess.js';
import {MAIA_PROFILES} from './maia-files.js';
import {positionFacts,describeFacts,historyFacts,type PositionFacts} from './position-facts.js';
import {reviewLocked,visibleReviewNodes,REVIEW_QUESTIONS} from './review.js';
import {validateHumanFactors,type HumanFactors,type HintMode} from './learning.js';
import { pathTo } from './game.js';
import { Session } from './session.js';

export type DialogueTopic='chat'|'position'|'comparison'|'review';
export interface DialogueTurn {role:'user'|'assistant';nodeId:string;text:string;fen?:string}
export interface DialogueRequest { nodeId: string; fen: string; question: string; legalMoves: string[]; positionFacts?:PositionFacts;historyFacts?:ReturnType<typeof historyFacts>;conversationTruncated?:boolean;gameHistory?:{rootFen:string;moves:string[];truncated:boolean;human:'w'|'b'|null};context?: string[];hintMode?:HintMode;topic?:DialogueTopic;turns?:DialogueTurn[];history?:{rootFen:string;moves:string[];truncated:boolean} }
export interface StrategicReply {
  message?:string;
  formatNotes?:string[];
  gameReview?:GameReview;
  assessment?:{verdict:'white_advantage'|'black_advantage'|'balanced'|'unclear';reason:string;dangers:string[]};
  plan: string; opponent: string; candidates: string[]; risks: string;
  playability: string; openQuestions: string[];humanFactors?:HumanFactors;
}
export interface DialogueAdapter { readonly source?: 'simulation' | 'model'; respond(request: DialogueRequest): Promise<unknown> }
export type SimulationMode = 'normal' | 'invalid' | 'failure' | 'slow';

/** No network access: deterministic fixtures, never a real model. */
export class SimulationAdapter implements DialogueAdapter {
  constructor(private mode: SimulationMode = 'normal') {}
  async respond(request: DialogueRequest): Promise<unknown> {
    await new Promise(resolve => setTimeout(resolve, this.mode === 'slow' ? 600 : 30));
    if (this.mode === 'failure') throw new Error('Simulierter Anfragefehler. Bitte erneut versuchen.');
    if (this.mode === 'invalid') return { plan: 'Ungültige Testantwort', candidates: ['illegal'] };
    return {
      message:'Demo-Modus: Hier antwortet keine KI. Ich kann nur die regelgeprüften Brettfakten anzeigen. Für eine Erklärung deiner Ideen und der Partie den eigenen KI-Zugang aktivieren.',
      assessment:{verdict:'unclear',reason:'Ohne Lern-KI keine strategische Stellungseinschätzung.',dangers:[]},
      plan:'Keine KI-Analyse im Demo-Modus.',opponent:'Keine gegnerische Absicht bekannt.',candidates:[],
      risks:'Nur die separat aufgeführten Brettfakten sind geprüft.',playability:'Keine ungeprüften Zugtipps.',
      humanFactors:{idea:'Keine KI-Analyse.',calculation:'Keine Variantenberechnung.',pitfalls:'Keine unbelegten Gefahrenbehauptungen.',continuation:'Eigenen KI-Zugang verwenden.'},
      openQuestions:request.hintMode==='question'?['Welche konkrete Stellung möchtest du mit deiner KI besprechen?']:[]
    } satisfies StrategicReply;
  }
}

export class Studio {
  constructor(public session = new Session()) {}
  restore(json: string): void { const next = Session.import(json); this.session = next; }

  async ask(question: string, adapter: DialogueAdapter, topic:DialogueTopic='position',hintOverride?:HintMode): Promise<'stored' | 'discarded'> {
    if (!question.trim()) throw new Error('Bitte eine Planfrage eingeben.');
    if(topic!=='chat'&&asksForGameReview(question)){topic='review';hintOverride='explain';}
    const session = this.session;
    const chatRevision=session.dialogueRevision();
    const snapshot = session.snapshot();
    const reviewEnd=topic==='review'&&!snapshot.review?.guiding?(snapshot.game?.cursor??snapshot.review?.original.at(-1)):undefined;
    const nodeId = reviewEnd??snapshot.activeNodeId;
    if(reviewLocked(snapshot))throw new Error('Zuerst eigene Gedanken festhalten oder den Originalzug ausdrücklich aufdecken.');
    const allowed=visibleReviewNodes(snapshot);
    if(snapshot.comparison && (!allowed.has(snapshot.comparison.a)||!allowed.has(snapshot.comparison.b)))throw new Error('Künftige Originalstellungen sind im geführten Vergleich verborgen.');
    if(!['chat','position','comparison','review'].includes(topic))throw new Error('Ungültiges Gesprächsziel.');
    if(topic==='comparison' && !snapshot.comparison)throw new Error('Bitte zunächst zwei Varianten für den Vergleich wählen.');
    const fen = snapshot.nodes.find(n => n.id === nodeId)!.fen;
    if (question.length > 1000) throw new Error('Die Planfrage darf höchstens 1000 Zeichen enthalten.');
    const ancestors=new Set(pathTo(snapshot,nodeId).map(n=>n.id));
    const context = snapshot.annotations.filter(a => ancestors.has(a.nodeId) && a.kind!=='dialogue').slice(-6)
      .map(a => `${a.nodeId}/${a.source}/${a.kind}/${a.hypothesis ? 'Hypothese' : 'Eingabe'}: ${a.engine?JSON.stringify({fen:a.engine.fen,score:a.engine.score,line:a.engine.line.slice(0,10),depth:a.engine.depth,nodes:a.engine.nodes,limits:a.engine.limits,meaning:'Begrenzter Suchbefund nur an dieser FEN, keine strategische Wahrheit'}):a.text}\nOffen: ${a.openQuestions.join(' / ')}`.slice(0, 800));
    if(snapshot.comparison){
      const describe=(id:string)=>{const p=pathTo(snapshot,id);const notes=snapshot.annotations.filter(a=>a.nodeId===id && a.kind==='memory').slice(-1).map(a=>`${a.source}/${a.hypothesis?'Hypothese':'Eingabe'}: ${a.text.slice(0,100)}`).join('');return `${(snapshot.labels?.[id]??id).slice(0,40)}: FEN ${p.at(-1)!.fen}; Notiz ${notes}; Züge ${p.slice(1).map(n=>n.san).join(' ').slice(-60)}`.slice(0,360);};
      context.push(`Ausdrücklich ausgewählter Variantenvergleich: A ${describe(snapshot.comparison.a)} / B ${describe(snapshot.comparison.b)}`.slice(0,800));
    }
    if(snapshot.game&&!snapshot.review?.guiding)context.push(`Lernpartie: Mensch ${snapshot.game.human==='w'?'Weiß':'Schwarz'}, ${snapshot.game.opponent==='maia'?`Maia-2 Trainingsprofil ${MAIA_PROFILES[snapshot.game.level-1]}`:`Stockfish-Level ${snapshot.game.level}`}; aktuelle Partie ${snapshot.game.cursor}; Analyse ${nodeId}; ${snapshot.game.paused?'pausiert':'laufend'}.`);
    const reflection=snapshot.reflections?.[nodeId];
    if(reflection)context.push(`Eigene Angaben des Lernenden (keine Bewertung): ${JSON.stringify(reflection)}`.slice(0,800));
    if(snapshot.review){
      const r=snapshot.review,id=r.original[r.decision]!,answers=r.responses[id]??{};
      context.push(`Geführter Rückblick auf eine menschliche Partie, eigene Seite ${r.human==='b'?'Schwarz':'Weiß'}. Eigene Angaben, keine gesicherten Motive: ${JSON.stringify(answers)}. Nur die vorliegende Stellung und Geschichte besprechen; keine künftigen tatsächlichen Züge behaupten.`.slice(0,800));
      if(r.revealed.includes(r.decision))context.push(`Ausdrücklich aufgedeckter damaliger Zug: ${snapshot.nodes.find(n=>n.id===r.original[r.decision+1])!.san}. Dies ist ein historischer Zug, keine Empfehlung oder Enginewertung.`);
      if(topic==='review')for(const [node,values] of Object.entries(r.responses)){
        const index=r.original.indexOf(node);if(index<0||index>r.decision||!r.revealed.includes(index))continue;
        context.push(`Belegte Selbstangaben zur Entscheidung ${node}: ${REVIEW_QUESTIONS.filter(q=>values[q.key]).map(q=>q.text+' '+values[q.key]).join(' / ')}`.slice(0,800));
      }
    }
    const hintMode=topic==='chat'?'explain':hintOverride??reflection?.hintMode??'explain';
    if(hintOverride)context.push('Ausdrücklicher Analyseaufruf: aktuelle hintMode-Vorgabe hat Vorrang vor einer gespeicherten Lernpräferenz.');
    while(context.length>6)context.shift();
    const conversationNodes=new Set(ancestors);
    if(snapshot.game&&!snapshot.review)for(const node of pathTo(snapshot,snapshot.game.cursor))conversationNodes.add(node.id);
    const dialogue=snapshot.annotations.filter(a=>conversationNodes.has(a.nodeId) && a.kind==='dialogue');
    const turns:DialogueTurn[]=[];
    for(let i=1;i<dialogue.length;i++){
      const human=dialogue[i-1]!,answer=dialogue[i]!;
      if(human.source==='human' && answer.source==='model' && human.nodeId===answer.nodeId){
        turns.push({role:'user',nodeId:human.nodeId,fen:snapshot.nodes.find(n=>n.id===human.nodeId)!.fen,text:human.text.slice(0,topic==='chat'?4000:700)},
          {role:'assistant',nodeId:answer.nodeId,fen:snapshot.nodes.find(n=>n.id===answer.nodeId)!.fen,text:answer.text.split('\n\nAnalyse-Details:')[0]!.slice(0,topic==='chat'?4000:700)});
      }
    }
    const availableTurns=turns.length;
    while(turns.length>(topic==='chat'?40:4))turns.splice(0,2);
    const path=pathTo(snapshot,nodeId),start=Math.max(0,path.length-501);
    const history={rootFen:path[start]!.fen,moves:path.slice(start+1).map(n=>n.san!),truncated:start>0};
    const gameEnd=snapshot.game?.cursor??snapshot.review?.original.at(-1)??nodeId;
    const gamePath=pathTo(snapshot,gameEnd).filter(n=>allowed.has(n.id)),gameStart=Math.max(0,gamePath.length-501);
    const gameHistory={rootFen:gamePath[gameStart]!.fen,moves:gamePath.slice(gameStart+1).map(n=>n.san!),truncated:gameStart>0,human:snapshot.game?.human??snapshot.review?.human??null};
    const request = { nodeId, fen, question: question.trim(), legalMoves: new Chess(fen).moves(), positionFacts:positionFacts(fen),...(topic==='chat'?{gameHistory,conversationTruncated:availableTurns>turns.length}:{}), context,hintMode,topic,turns,history,...(topic==='review'?{historyFacts:historyFacts(history)}:{}) };
    while(new TextEncoder().encode(JSON.stringify(request)).byteLength>16000 && (turns.length || context.length)){
      if(turns.length)turns.splice(0,2);else context.shift();
    }
    if(topic==='chat')request.conversationTruncated=availableTurns>turns.length;
    if(topic==='review' && (history.truncated||!history.moves.length))throw new Error('Für eine Partieanalyse ist eine vollständige gespielte Zugfolge nötig.');
    if(new TextEncoder().encode(JSON.stringify(request)).byteLength>16000)throw new Error('Partieverlauf überschreitet das Kontextlimit. Bitte eine kürzere Partie untersuchen. Keine Anfrage gesendet.');
    const raw = await adapter.respond(request);
    // Replacing a session or clearing its chat invalidates outstanding answers.
    if (this.session !== session || session.dialogueRevision()!==chatRevision) return 'discarded';
    const reply = adapter.source==='model'?normalizeModelReply(raw,request.legalMoves):validateReply(raw, request.legalMoves);
    if(adapter.source==='model' && !reply.message?.trim())throw new Error('Dialogantwort fehlt.');
    const retrospective=adapter.source==='model'&&topic==='review'&&hintMode==='explain'?validateGameReview(reply.gameReview,history):undefined;
    if(adapter.source==='model' && topic!=='review' && hintMode==='explain' && reply.assessment){
      const f=request.positionFacts,winner=f.checkmate?(f.sideToMove==='w'?'black_advantage':'white_advantage'):f.mateInOne.length?(f.sideToMove==='w'?'white_advantage':'black_advantage'):undefined;
      if(winner&&reply.assessment.verdict!==winner)throw new Error('KI-Beurteilung widerspricht der regelgeprüften Mattsituation. Antwort nicht gespeichert.');
    }
    if(hintMode==='question' && !reply.openQuestions.length)throw new Error('Leitfrage fehlt.');
    if(hintMode==='question' && reply.candidates.length)throw new Error('Leitfragenmodus: direkte Zugvorschläge verworfen.');
    session.annotate({ nodeId, kind: 'dialogue', source: 'human', text: request.question,
      hypothesis: false, openQuestions: [] });
    session.annotate({ nodeId, kind: 'dialogue', source: adapter.source ?? 'simulation', text: retrospective?formatGameReview(retrospective,history):hintMode==='question'?`Leitfrage: ${reply.openQuestions[0]}`:hintMode==='hint'?`Denkhinweis: ${reply.humanFactors?.idea||reply.playability||reply.message}`:adapter instanceof SimulationAdapter?`${reply.message}\n\nAnalyse-Details:\n${describeFacts(request.positionFacts)}`:`${formatReply(reply)}\n${describeFacts(request.positionFacts)}`,
      hypothesis: true, openQuestions: retrospective?[]:reply.openQuestions,...(hintMode==='explain'?{suggestions:retrospective?[]:reply.candidates}:{}) });
    return 'stored';
  }
}

export function validateReply(raw: unknown, legalMoves: string[]): StrategicReply {
  if (typeof raw !== 'object' || raw === null) throw new Error('Ungültige Simulationsantwort.');
  const r = raw as Record<string, unknown>;
  const strings = ['plan', 'opponent', 'risks', 'playability'];
  if (!strings.every(key => typeof r[key] === 'string' && (r[key] as string).trim().length > 0 && (r[key] as string).length <= 4000) ||
      !Array.isArray(r.candidates) || r.candidates.length > 8 || !r.candidates.every(m => typeof m === 'string' && legalMoves.includes(m)) ||
      !Array.isArray(r.openQuestions) || r.openQuestions.length > 8 || !r.openQuestions.every(q => typeof q === 'string' && q.length <= 2000)) {
    throw new Error('Ungültige Simulationsantwort: Format oder Zugvorschläge verworfen.');
  }
  if(r.message!==undefined && (typeof r.message!=='string' || !r.message.trim() || r.message.length>3000))throw new Error('Ungültige Dialogantwort.');
  if(r.assessment!==undefined){
    const a=r.assessment as StrategicReply['assessment'];
    if(!a || !['white_advantage','black_advantage','balanced','unclear'].includes(a.verdict) || typeof a.reason!=='string' || !a.reason.trim() || a.reason.length>2000 || !Array.isArray(a.dangers) || a.dangers.length>8 || !a.dangers.every(d=>typeof d==='string' && d.trim().length>0 && d.length<=1000))throw new Error('Ungültige Stellungsbeurteilung.');
  }
  if(r.humanFactors!==undefined)validateHumanFactors(r.humanFactors);
  return r as unknown as StrategicReply;
}
function formatReply(r: StrategicReply): string {
  const labels={white_advantage:'Vorteil Weiß',black_advantage:'Vorteil Schwarz',balanced:'Ausgeglichen',unclear:'Unklar'};
  const assessment=r.assessment?`\n\nStellungsbeurteilung (KI-Einschätzung): ${labels[r.assessment.verdict]}. ${r.assessment.reason}\nKonkrete Gefahren: ${r.assessment.dangers.join(' / ') || 'Keine benannt; keine Sicherheitsgarantie.'}`:'';
  const details=[r.plan?`Plan: ${r.plan}`:'',r.opponent?`Gegenplan: ${r.opponent}`:'',r.candidates.length?`Kandidaten (ungeordnet): ${r.candidates.join(', ')}`:'',r.risks?`Risiken: ${r.risks}`:'',r.playability?`Spielbarkeit: ${r.playability}`:'',...(r.humanFactors?[`Eigene Idee verstehen: ${r.humanFactors.idea}`,`Rechenarbeit und Genauigkeit: ${r.humanFactors.calculation}`,`Leicht übersehbar: ${r.humanFactors.pitfalls}`,`Plan weiterführen: ${r.humanFactors.continuation}`]:[])].filter(Boolean).join('\n');
  return `${r.message??''}${assessment}${r.formatNotes?.length?'\n\nHinweis der App: '+r.formatNotes.join(' '):''}\n\nAnalyse-Details:\n${details}`;
}
