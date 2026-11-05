import { pathTo } from './game.js';
import { Session } from './session.js';

export interface DialogueRequest { nodeId: string; fen: string; question: string; legalMoves: string[]; context?: string[] }
export interface StrategicReply {
  plan: string; opponent: string; candidates: string[]; risks: string;
  playability: string; openQuestions: string[];
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
      plan: 'Simulation: Prüfe Entwicklung und Zentrumskontrolle als möglichen Plan.',
      opponent: 'Hypothese: Die Gegenseite könnte das Zentrum angreifen; ihre Absicht ist unbekannt.',
      candidates: request.legalMoves.slice(0, 2),
      risks: 'Simulation: Vor jedem Zug auf ungedeckte Figuren und gegnerische Drohungen achten.',
      playability: 'Simulation: Bevorzuge einen Plan, dessen nächste Schritte du erklären kannst. Keine Rangfolge der Züge.',
      openQuestions: ['Welche gegnerische Antwort würde deinen Plan verändern?']
    } satisfies StrategicReply;
  }
}

export class Studio {
  constructor(public session = new Session()) {}
  restore(json: string): void { const next = Session.import(json); this.session = next; }

  async ask(question: string, adapter: DialogueAdapter): Promise<'stored' | 'discarded'> {
    if (!question.trim()) throw new Error('Bitte eine Planfrage eingeben.');
    const session = this.session;
    const snapshot = session.snapshot();
    const nodeId = snapshot.activeNodeId;
    const fen = snapshot.nodes.find(n => n.id === nodeId)!.fen;
    if (question.length > 1000) throw new Error('Die Planfrage darf höchstens 1000 Zeichen enthalten.');
    const ancestors=new Set(pathTo(snapshot,nodeId).map(n=>n.id));
    const context = snapshot.annotations.filter(a => ancestors.has(a.nodeId)).slice(-6)
      .map(a => `${a.nodeId}/${a.source}/${a.kind}/${a.hypothesis ? 'Hypothese' : 'Eingabe'}: ${a.text}\nOffen: ${a.openQuestions.join(' / ')}`.slice(0, 800));
    if(snapshot.comparison){
      const describe=(id:string)=>{const p=pathTo(snapshot,id);const notes=snapshot.annotations.filter(a=>a.nodeId===id && a.kind==='memory').slice(-1).map(a=>`${a.source}/${a.hypothesis?'Hypothese':'Eingabe'}: ${a.text.slice(0,100)}`).join('');return `${(snapshot.labels?.[id]??id).slice(0,40)}: FEN ${p.at(-1)!.fen}; Notiz ${notes}; Züge ${p.slice(1).map(n=>n.san).join(' ').slice(-60)}`.slice(0,360);};
      context.push(`Ausdrücklich ausgewählter Variantenvergleich: A ${describe(snapshot.comparison.a)} / B ${describe(snapshot.comparison.b)}`.slice(0,800));
    }
    if(snapshot.game)context.push(`Lernpartie: Mensch ${snapshot.game.human==='w'?'Weiß':'Schwarz'}, Engine-Level ${snapshot.game.level}; aktuelle Partie ${snapshot.game.cursor}; Analyse ${nodeId}; ${snapshot.game.paused?'pausiert':'laufend'}.`);
    while(context.length>6)context.shift();
    const request = { nodeId, fen, question: question.trim(), legalMoves: session.legalMoves(), context };
    const raw = await adapter.respond(request);
    // Replacing a session invalidates outstanding answers, even if node IDs coincide.
    if (this.session !== session) return 'discarded';
    const reply = validateReply(raw, request.legalMoves);
    session.annotate({ nodeId, kind: 'dialogue', source: 'human', text: request.question,
      hypothesis: false, openQuestions: [] });
    session.annotate({ nodeId, kind: 'dialogue', source: adapter.source ?? 'simulation', text: formatReply(reply),
      hypothesis: true, openQuestions: reply.openQuestions });
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
  return r as unknown as StrategicReply;
}
function formatReply(r: StrategicReply): string {
  return `Plan: ${r.plan}\nGegenplan: ${r.opponent}\nKandidaten (ungeordnet): ${r.candidates.join(', ') || 'Keine legalen Züge'}\nRisiken: ${r.risks}\nSpielbarkeit: ${r.playability}`;
}
