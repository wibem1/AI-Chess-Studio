import {reviewLocked,visibleReviewNodes,REVIEW_QUESTIONS} from './review.js';
import {validateHumanFactors,type HumanFactors,type HintMode} from './learning.js';
import { pathTo } from './game.js';
import { Session } from './session.js';

export type DialogueTopic='position'|'comparison'|'review';
export interface DialogueTurn {role:'user'|'assistant';nodeId:string;text:string}
export interface DialogueRequest { nodeId: string; fen: string; question: string; legalMoves: string[]; context?: string[];hintMode?:HintMode;topic?:DialogueTopic;turns?:DialogueTurn[];history?:{rootFen:string;moves:string[];truncated:boolean} }
export interface StrategicReply {
  message?:string;
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
      message:`Simulation: Wir können deine Frage „${request.question.slice(0,200)}“ gemeinsam als Lernbeispiel betrachten. Das ist eine Testantwort, keine echte Stellungsanalyse.`,
      plan: 'Simulation: Prüfe Entwicklung und Zentrumskontrolle als möglichen Plan.',
      opponent: 'Hypothese: Die Gegenseite könnte das Zentrum angreifen; ihre Absicht ist unbekannt.',
      candidates: request.hintMode==='question'?[]:request.legalMoves.slice(0, 2),
      risks: 'Simulation: Vor jedem Zug auf ungedeckte Figuren und gegnerische Drohungen achten.',
      playability: 'Simulation: Bevorzuge einen Plan, dessen nächste Schritte du erklären kannst. Keine Rangfolge der Züge.',
      humanFactors:{idea:'Simulation: Welche Figuren und Felder sind für deine Idee wichtig?',calculation:'Simulation: Welche zwingenden Antworten würdest du zuerst prüfen?',pitfalls:'Simulation: Welche gegnerische Drohung könnte leicht übersehen werden?',continuation:'Simulation: Wie möchtest du nach einer Abweichung weiterspielen?'},
      openQuestions: ['Welche gegnerische Antwort würde deinen Plan verändern?']
    } satisfies StrategicReply;
  }
}

export class Studio {
  constructor(public session = new Session()) {}
  restore(json: string): void { const next = Session.import(json); this.session = next; }

  async ask(question: string, adapter: DialogueAdapter, topic:DialogueTopic='position'): Promise<'stored' | 'discarded'> {
    if (!question.trim()) throw new Error('Bitte eine Planfrage eingeben.');
    const session = this.session;
    const snapshot = session.snapshot();
    const nodeId = snapshot.activeNodeId;
    if(reviewLocked(snapshot))throw new Error('Zuerst eigene Gedanken festhalten oder den Originalzug ausdrücklich aufdecken.');
    const allowed=visibleReviewNodes(snapshot);
    if(snapshot.comparison && (!allowed.has(snapshot.comparison.a)||!allowed.has(snapshot.comparison.b)))throw new Error('Künftige Originalstellungen sind im geführten Vergleich verborgen.');
    if(!['position','comparison','review'].includes(topic))throw new Error('Ungültiges Gesprächsziel.');
    if(topic==='comparison' && !snapshot.comparison)throw new Error('Bitte zunächst zwei Varianten für den Vergleich wählen.');
    const fen = snapshot.nodes.find(n => n.id === nodeId)!.fen;
    if (question.length > 1000) throw new Error('Die Planfrage darf höchstens 1000 Zeichen enthalten.');
    const ancestors=new Set(pathTo(snapshot,nodeId).map(n=>n.id));
    const context = snapshot.annotations.filter(a => ancestors.has(a.nodeId) && a.kind!=='dialogue').slice(-6)
      .map(a => `${a.nodeId}/${a.source}/${a.kind}/${a.hypothesis ? 'Hypothese' : 'Eingabe'}: ${a.text}\nOffen: ${a.openQuestions.join(' / ')}`.slice(0, 800));
    if(snapshot.comparison){
      const describe=(id:string)=>{const p=pathTo(snapshot,id);const notes=snapshot.annotations.filter(a=>a.nodeId===id && a.kind==='memory').slice(-1).map(a=>`${a.source}/${a.hypothesis?'Hypothese':'Eingabe'}: ${a.text.slice(0,100)}`).join('');return `${(snapshot.labels?.[id]??id).slice(0,40)}: FEN ${p.at(-1)!.fen}; Notiz ${notes}; Züge ${p.slice(1).map(n=>n.san).join(' ').slice(-60)}`.slice(0,360);};
      context.push(`Ausdrücklich ausgewählter Variantenvergleich: A ${describe(snapshot.comparison.a)} / B ${describe(snapshot.comparison.b)}`.slice(0,800));
    }
    if(snapshot.game&&!snapshot.review?.guiding)context.push(`Lernpartie: Mensch ${snapshot.game.human==='w'?'Weiß':'Schwarz'}, Engine-Level ${snapshot.game.level}; aktuelle Partie ${snapshot.game.cursor}; Analyse ${nodeId}; ${snapshot.game.paused?'pausiert':'laufend'}.`);
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
    const hintMode=reflection?.hintMode??'explain';
    while(context.length>6)context.shift();
    const dialogue=snapshot.annotations.filter(a=>ancestors.has(a.nodeId) && a.kind==='dialogue');
    const turns:DialogueTurn[]=[];
    for(let i=1;i<dialogue.length;i++){
      const human=dialogue[i-1]!,answer=dialogue[i]!;
      if(human.source==='human' && answer.source==='model' && human.nodeId===answer.nodeId){
        turns.push({role:'user',nodeId:human.nodeId,text:human.text.slice(0,700)},
          {role:'assistant',nodeId:answer.nodeId,text:answer.text.split('\n\nAnalyse-Details:')[0]!.slice(0,700)});
      }
    }
    while(turns.length>4)turns.splice(0,2);
    const path=pathTo(snapshot,nodeId),start=Math.max(0,path.length-501);
    const history={rootFen:path[start]!.fen,moves:path.slice(start+1).map(n=>n.san!),truncated:start>0};
    const request = { nodeId, fen, question: question.trim(), legalMoves: session.legalMoves(), context,hintMode,topic,turns,history };
    while(new TextEncoder().encode(JSON.stringify(request)).byteLength>16000 && (turns.length || context.length)){
      if(turns.length)turns.splice(0,2);else context.shift();
    }
    const raw = await adapter.respond(request);
    // Replacing a session invalidates outstanding answers, even if node IDs coincide.
    if (this.session !== session) return 'discarded';
    const reply = validateReply(raw, request.legalMoves);
    if(adapter.source==='model' && !reply.message?.trim())throw new Error('Dialogantwort fehlt.');
    if(adapter.source==='model' && !reply.humanFactors)throw new Error('Menschliche Lernanalyse fehlt in der Modellantwort.');
    if(hintMode==='question' && !reply.openQuestions.length)throw new Error('Leitfrage fehlt.');
    if(hintMode==='question' && reply.candidates.length)throw new Error('Leitfragenmodus: direkte Zugvorschläge verworfen.');
    session.annotate({ nodeId, kind: 'dialogue', source: 'human', text: request.question,
      hypothesis: false, openQuestions: [] });
    session.annotate({ nodeId, kind: 'dialogue', source: adapter.source ?? 'simulation', text: hintMode==='question'?`Leitfrage: ${reply.openQuestions[0]}`:hintMode==='hint'?`Denkhinweis: ${reply.humanFactors?.idea??reply.playability}`:formatReply(reply),
      hypothesis: true, openQuestions: reply.openQuestions,...(hintMode==='explain'?{suggestions:reply.candidates}:{}) });
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
  if(r.humanFactors!==undefined)validateHumanFactors(r.humanFactors);
  return r as unknown as StrategicReply;
}
function formatReply(r: StrategicReply): string {
  return `${r.message?`${r.message}\n\nAnalyse-Details:\n`:''}Plan: ${r.plan}\nGegenplan: ${r.opponent}\nKandidaten (ungeordnet): ${r.candidates.join(', ') || 'Keine legalen Züge'}\nRisiken: ${r.risks}\nSpielbarkeit: ${r.playability}${r.humanFactors?`\nEigene Idee verstehen: ${r.humanFactors.idea}\nRechenarbeit und Genauigkeit: ${r.humanFactors.calculation}\nLeicht übersehbar: ${r.humanFactors.pitfalls}\nPlan weiterführen: ${r.humanFactors.continuation}`:''}`;
}
