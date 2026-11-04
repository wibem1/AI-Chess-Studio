import { Chess, DEFAULT_POSITION } from 'chess.js';

export type MoveInput = string | { from: string; to: string; promotion?: string };
export interface PositionNode { id: string; parentId: string | null; san: string | null; fen: string }
export interface Annotation {
  nodeId: string;
  kind: 'dialogue' | 'memory';
  source: 'human' | 'simulation' | 'model';
  text: string;
  hypothesis: boolean;
  openQuestions: string[];
}
export interface SessionData {
  schemaVersion: 1;
  activeNodeId: string;
  nodes: PositionNode[];
  annotations: Annotation[];
}

/** Branch identity is retained even when two nodes share the same FEN. */
export class Session {
  private data: SessionData;

  constructor(fen = DEFAULT_POSITION) {
    this.data = { schemaVersion: 1, activeNodeId: 'n0',
      nodes: [{ id: 'n0', parentId: null, san: null, fen: new Chess(fen).fen() }], annotations: [] };
  }

  snapshot(): SessionData { return structuredClone(this.data); }
  private node(id: string): PositionNode {
    const node = this.data.nodes.find(n => n.id === id);
    if (!node) throw new Error('Unbekannte Stellung');
    return node;
  }
  select(id: string): void { this.node(id); this.data.activeNodeId = id; }
  private board(id = this.data.activeNodeId): Chess {
    const path: PositionNode[] = [];
    let node = this.node(id);
    while (node.parentId !== null) { path.unshift(node); node = this.node(node.parentId); }
    const board = new Chess(node.fen);
    for (const child of path) board.move(child.san!);
    return board;
  }
  legalMoves(): string[] { return this.board().moves(); }
  status(): { check: boolean; checkmate: boolean; draw: boolean; repetition: boolean; gameOver: boolean } {
    const b = this.board();
    return { check: b.isCheck(), checkmate: b.isCheckmate(), draw: b.isDraw(),
      repetition: b.isThreefoldRepetition(), gameOver: b.isGameOver() };
  }
  play(input: MoveInput): string {
    const board = this.board();
    if (board.isGameOver()) throw new Error('Partie beendet');
    const move = board.move(input); // chess.js rejects illegal moves before state is changed.
    const parentId = this.data.activeNodeId;
    const existing = this.data.nodes.find(n => n.parentId === parentId && n.san === move.san);
    if (existing) { this.select(existing.id); return existing.id; }
    const id = `n${this.data.nodes.length}`;
    this.data.nodes.push({ id, parentId, san: move.san, fen: board.fen() });
    this.data.activeNodeId = id;
    return id;
  }
  /** Caller captures the request's node ID; delayed replies never follow the current selection. */
  annotate(annotation: Annotation): void {
    this.node(annotation.nodeId);
    validateAnnotation(annotation);
    this.data.annotations.push(structuredClone(annotation));
  }
  export(): string { return JSON.stringify(this.data, null, 2); }

  static import(json: string): Session {
    const raw: unknown = JSON.parse(json);
    const d = record(raw);
    if (d.schemaVersion !== 1 || !Array.isArray(d.nodes) || d.nodes.length === 0 ||
        !Array.isArray(d.annotations) || typeof d.activeNodeId !== 'string') throw new Error('Ungültiges Sitzungsformat');
    const root = record(d.nodes[0]);
    if (root.id !== 'n0' || root.parentId !== null || root.san !== null || typeof root.fen !== 'string') throw new Error('Ungültige Wurzel');
    const session = new Session(root.fen);
    if (session.node('n0').fen !== root.fen) throw new Error('Nicht kanonische FEN');
    for (let i = 1; i < d.nodes.length; i++) {
      const n = record(d.nodes[i]);
      if (n.id !== `n${i}` || typeof n.parentId !== 'string' || typeof n.san !== 'string' || typeof n.fen !== 'string') throw new Error('Ungültiger Knoten');
      session.select(n.parentId);
      const id = session.play(n.san);
      if (id !== n.id || session.node(id).san !== n.san || session.node(id).fen !== n.fen) throw new Error('Inkonsistente Variante');
    }
    for (const a of d.annotations) {
      validateAnnotation(a);
      session.annotate(a);
    }
    session.select(d.activeNodeId);
    return session;
  }
}
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Objekt erwartet');
  return value as Record<string, unknown>;
}
function validateAnnotation(value: unknown): asserts value is Annotation {
  const a = record(value);
  if (typeof a.nodeId !== 'string' || !['dialogue', 'memory'].includes(String(a.kind)) ||
      !['human', 'simulation', 'model'].includes(String(a.source)) || typeof a.text !== 'string' ||
      typeof a.hypothesis !== 'boolean' || !Array.isArray(a.openQuestions) ||
      !a.openQuestions.every(q => typeof q === 'string')) throw new Error('Ungültige Annotation');
}
