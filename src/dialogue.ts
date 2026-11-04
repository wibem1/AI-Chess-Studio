import { Session } from './session.js';

export interface DialogueRequest { nodeId: string; fen: string; question: string; legalMoves: string[] }
export interface StrategicReply {
  plan: string; opponent: string; candidates: string[]; risks: string;
  playability: string; openQuestions: string[];
}
export interface DialogueAdapter { respond(request: DialogueRequest): Promise<unknown> }
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
    const request = { nodeId, fen, question: question.trim(), legalMoves: session.legalMoves() };
    const raw = await adapter.respond(request);
    // Replacing a session invalidates outstanding answers, even if node IDs coincide.
    if (this.session !== session) return 'discarded';
    const reply = validateReply(raw, request.legalMoves);
    session.annotate({ nodeId, kind: 'dialogue', source: 'human', text: request.question,
      hypothesis: false, openQuestions: [] });
    session.annotate({ nodeId, kind: 'dialogue', source: 'simulation', text: formatReply(reply),
      hypothesis: true, openQuestions: reply.openQuestions });
    return 'stored';
  }
}

function validateReply(raw: unknown, legalMoves: string[]): StrategicReply {
  if (typeof raw !== 'object' || raw === null) throw new Error('Ungültige Simulationsantwort.');
  const r = raw as Record<string, unknown>;
  const strings = ['plan', 'opponent', 'risks', 'playability'];
  if (!strings.every(key => typeof r[key] === 'string' && (r[key] as string).trim().length > 0) ||
      !Array.isArray(r.candidates) || !r.candidates.every(m => typeof m === 'string' && legalMoves.includes(m)) ||
      !Array.isArray(r.openQuestions) || !r.openQuestions.every(q => typeof q === 'string')) {
    throw new Error('Ungültige Simulationsantwort: Format oder Zugvorschläge verworfen.');
  }
  return r as unknown as StrategicReply;
}
function formatReply(r: StrategicReply): string {
  return `Plan: ${r.plan}\nGegenplan: ${r.opponent}\nKandidaten (ungeordnet): ${r.candidates.join(', ') || 'Keine legalen Züge'}\nRisiken: ${r.risks}\nSpielbarkeit: ${r.playability}`;
}
