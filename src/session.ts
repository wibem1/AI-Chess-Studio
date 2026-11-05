import {validateReflection,type Reflection} from './learning.js';
import { pathTo, type GameState } from './game.js';
import { Chess, DEFAULT_POSITION } from 'chess.js';
import { validateTacticalReport, type TacticalReport } from './tactics.js';

export type MoveInput = string | { from: string; to: string; promotion?: string };
export interface PositionNode { id: string; parentId: string | null; san: string | null; fen: string }
export interface Annotation {
  nodeId: string;
  kind: 'dialogue' | 'memory' | 'factcheck';
  source: 'human' | 'simulation' | 'model' | 'stockfish';
  text: string;
  hypothesis: boolean;
  openQuestions: string[];
  engine?: TacticalReport;
}
export interface SessionData {
  schemaVersion: 1;
  activeNodeId: string;
  nodes: PositionNode[];
  annotations: Annotation[];
  reflections?:Record<string,Reflection>;
  game?: GameState;
  labels?: Record<string,string>;
  comparison?: {a:string;b:string};
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
  status(id = this.data.activeNodeId): { check: boolean; checkmate: boolean; draw: boolean; repetition: boolean; gameOver: boolean } {
    const b = this.board(id);
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
    const node = this.node(annotation.nodeId);
    validateAnnotation(annotation);
    if (annotation.kind === 'factcheck') validateTacticalReport(annotation.engine, node.fen);
    this.data.annotations.push(structuredClone(annotation));
  }
  setGame(raw:GameState):void {
    const g=raw;
    if(!g || typeof g.id!=='string' || !g.id || g.id.length>100 || !['w','b'].includes(g.human) ||
       !Number.isInteger(g.level) || g.level<1 || g.level>5 || typeof g.paused!=='boolean' || !Number.isSafeInteger(g.revision) || g.revision<0 ||
       !pathTo(this.data,g.cursor).some(n=>n.id===g.start))throw new Error('Ungültiger Partiestand.');
    this.data.game=structuredClone(g);
  }
  reflect(id:string,raw:Reflection):void {this.node(id);const value=validateReflection(raw);this.data.reflections??={};this.data.reflections[id]=value;}
  label(id:string,value:string):void {
    this.node(id);if(typeof value!=='string' || value.trim().length>80)throw new Error('Variantenname: maximal 80 Zeichen.');
    this.data.labels ??= {};if(value.trim())this.data.labels[id]=value.trim();else delete this.data.labels[id];
  }
  compare(a:string,b:string):void {this.node(a);this.node(b);if(a===b)throw new Error('Zwei unterschiedliche Stellungen wählen.');this.data.comparison={a,b};}
  export(): string {
    const {schemaVersion,activeNodeId,nodes,annotations,game,labels,comparison,reflections}=this.data;
    return JSON.stringify({schemaVersion,activeNodeId,nodes,annotations,game,labels,comparison,reflections},null,2);
  }

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
    if(d.labels!==undefined){const labels=record(d.labels);session.data.labels={};for(const [id,label] of Object.entries(labels)){if(typeof label!=='string')throw new Error('Ungültiger Variantenname.');session.label(id,label);}}
    if(d.comparison!==undefined){const c=record(d.comparison);if(typeof c.a!=='string' || typeof c.b!=='string')throw new Error('Ungültiger Vergleich.');session.compare(c.a,c.b);}
    if(d.reflections!==undefined){const values=record(d.reflections);session.data.reflections={};for(const [id,value] of Object.entries(values))session.reflect(id,validateReflection(value));}
    if(d.game!==undefined)session.setGame(d.game as GameState);
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
  if (typeof a.nodeId !== 'string' || typeof a.kind !== 'string' || !['dialogue', 'memory', 'factcheck'].includes(a.kind) ||
      typeof a.source !== 'string' || !['human', 'simulation', 'model', 'stockfish'].includes(a.source) || typeof a.text !== 'string' ||
      typeof a.hypothesis !== 'boolean' || !Array.isArray(a.openQuestions) ||
      !a.openQuestions.every(q => typeof q === 'string')) throw new Error('Ungültige Annotation');
  if (a.kind === 'factcheck' ? a.source !== 'stockfish' || a.hypothesis !== false || !a.engine : a.source === 'stockfish' || a.engine !== undefined) throw new Error('Ungültige Befundherkunft');
}
