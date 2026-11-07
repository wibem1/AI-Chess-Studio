import {validateGameReview,type GameReview} from './game-review.js';
import {parsePgn,identifyPlayer,validateReview,reviewDecisions,reviewLocked,visibleReviewNodes,repetitionCount,type ReviewState,type ReviewQuestion,type PlayerColor} from './review.js';
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
  suggestions?: string[];
  gameReview?:GameReview;
}
export interface SessionData {
  schemaVersion: 1 | 2;
  activeNodeId: string;
  nodes: PositionNode[];
  annotations: Annotation[];
  reflections?:Record<string,Reflection>;
  orientation?:PlayerColor;
  review?:ReviewState;
  game?: GameState;
  labels?: Record<string,string>;
  comparison?: {a:string;b:string};
}

/** Branch identity is retained even when two nodes share the same FEN. */
export class Session {
  private data: SessionData;
  private chatRevision=0;

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
  select(id: string): void { this.node(id); if(this.data.review?.guiding && !visibleReviewNodes(this.data).has(id))throw new Error('Künftige Originalzüge sind im geführten Rückblick verborgen.');this.data.activeNodeId = id; }
  private board(id = this.data.activeNodeId): Chess {
    const path: PositionNode[] = [];
    let node = this.node(id);
    while (node.parentId !== null) { path.unshift(node); node = this.node(node.parentId); }
    const board = new Chess(node.fen);
    for (const child of path) board.move(child.san!);
    return board;
  }
  legalMoves(): string[] { return this.board().moves(); }
  status(id = this.data.activeNodeId) {
    const b = this.board(id),count=repetitionCount(this.data,id);
    const automaticDraw=!b.isCheckmate()&&(b.isStalemate()||b.isInsufficientMaterial()||count>=5||Number(b.fen().split(' ')[4])>=150);
    const recorded=!!this.data.review&&(this.data.review.guiding||!this.data.game);
    const gameOver=recorded?b.isCheckmate()||automaticDraw:b.isGameOver();
    return { check:b.isCheck(),checkmate:b.isCheckmate(),draw:recorded?automaticDraw:b.isDraw(),
      repetition:count>=3,repetitionCount:count,fivefold:count>=5,claimableDraw:count>=3||b.isDrawByFiftyMoves(),automaticDraw,gameOver };
  }
  play(input: MoveInput): string {
    if(reviewLocked(this.data))throw new Error('Zuerst eigene Gedanken festhalten oder den Originalzug ausdrücklich aufdecken.');
    return this.append(input,false);
  }
  private append(input:MoveInput,historical:boolean,forceNew=false):string {
    const board = this.board();
    if (!historical && this.status().gameOver) throw new Error('Partie beendet');
    const move = board.move(input);
    const parentId = this.data.activeNodeId;
    const visible=visibleReviewNodes(this.data);
    const existing = !forceNew&&this.data.nodes.find(n => n.parentId===parentId&&n.san===move.san&&visible.has(n.id));
    if(existing){this.select(existing.id);return existing.id;}
    const id=`n${this.data.nodes.length}`;
    this.data.nodes.push({id,parentId,san:move.san,fen:board.fen()});
    this.data.activeNodeId=id;return id;
  }
  orient(color:PlayerColor):void{if(!['w','b'].includes(color))throw new Error('Ungültige Brettorientierung.');this.data.orientation=color;}
  static fromPgn(pgn:string,choice:PlayerColor|'auto'='auto',name=''):Session {
    const parsed=parsePgn(pgn),human=identifyPlayer(parsed,choice,name),session=new Session(parsed.rootFen);
    for(const [index,move] of parsed.moves.entries())session.data.nodes.push({id:`n${index+1}`,parentId:`n${index}`,san:move.san,fen:move.after});
    const review:ReviewState={pgn,original:session.data.nodes.map(n=>n.id),human,decision:0,revealed:[],responses:{},guiding:true,completed:false};
    const decisions=reviewDecisions(review,session.data);
    if(!decisions.length)throw new Error('Die PGN enthält keinen Zug deiner gewählten Seite.');
    review.decision=decisions[0]!;session.data.schemaVersion=2;session.data.review=review;session.orient(human);
    session.select(review.original[review.decision]!);return session;
  }
  reviewDecision(index:number):void {
    const r=this.data.review;if(!r||!reviewDecisions(r,this.data).includes(index))throw new Error('Keine eigene Entscheidung an dieser Stelle.');
    if(this.data.game&&!this.data.game.paused)this.data.game={...this.data.game,paused:true,revision:this.data.game.revision+1};
    r.decision=index;r.guiding=true;this.select(r.original[index]!);
  }
  reviewAnswer(field:ReviewQuestion,value:string):void {
    const r=this.data.review;if(!r||!['idea','expected','alternatives','change'].includes(field)||typeof value!=='string'||!value.trim()||value.length>600)throw new Error('Bitte eine eigene Angabe mit höchstens 600 Zeichen festhalten.');
    const id=r.original[r.decision]!;r.responses[id]??={};r.responses[id][field]=value.trim();this.revealReview();
  }
  revealReview():void{const r=this.data.review;if(!r)throw new Error('Keine importierte Partie.');if(!r.revealed.includes(r.decision))r.revealed.push(r.decision);}
  guideReview(active:boolean):void{const r=this.data.review;if(!r)throw new Error('Keine importierte Partie.');r.guiding=active;if(active)this.reviewDecision(r.decision);}
  finishReview():void{if(!this.data.review)throw new Error('Keine importierte Partie.');this.data.review.completed=true;}
  /** Caller captures the request's node ID; delayed replies never follow the current selection. */
  annotate(annotation: Annotation): void {
    const node = this.node(annotation.nodeId);
    validateAnnotation(annotation);
    if(annotation.gameReview){
      const path=pathTo(this.data,node.id);
      validateGameReview(annotation.gameReview,{rootFen:path[0]!.fen,moves:path.slice(1).map(n=>n.san!),truncated:false});
    }
    if(annotation.suggestions?.some(san=>!new Chess(node.fen).moves().includes(san)))throw new Error('Illegale Zugvorführung.');
    if (annotation.kind === 'factcheck') {
      validateTacticalReport(annotation.engine, node.fen);
      if(this.data.review){const path=pathTo(this.data,node.id),expected={rootFen:path[0]!.fen,moves:path.slice(1).map(n=>n.san!)};if(JSON.stringify(annotation.engine!.history)!==JSON.stringify(expected))throw new Error('Befund ohne passende vollständige Partievergangenheit.');}
    }
    this.data.annotations.push(structuredClone(annotation));
  }
  dialogueRevision():number{return this.chatRevision;}
  /** Clear only the current session's conversations, including other branches. */
  clearDialogue():void{
    this.data.annotations=this.data.annotations.filter(a=>a.kind!=='dialogue');
    this.chatRevision++;
  }
  setGame(raw:GameState):void {
    const g=raw;
    if(this.data.review?.guiding&&g?.paused===false)throw new Error('Der geführte Rückblick startet keine aktive Enginepartie.');
    if(!g || typeof g.id!=='string' || !g.id || g.id.length>100 || !['w','b'].includes(g.human) ||
       (g.engine!==undefined&&!['server','browser'].includes(g.engine)) || (g.opponent!==undefined&&!['stockfish','maia'].includes(g.opponent)) || (g.opponent==='maia'&&g.engine!=='browser') || !Number.isInteger(g.level) || g.level<1 || g.level>5 || typeof g.paused!=='boolean' || !Number.isSafeInteger(g.revision) || g.revision<0 ||
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
    const {schemaVersion,activeNodeId,nodes,annotations,game,labels,comparison,reflections,orientation,review}=this.data;
    return JSON.stringify({schemaVersion,activeNodeId,nodes,annotations,game,labels,comparison,reflections,orientation,review},null,2);
  }

  static import(json: string): Session {
    if(new TextEncoder().encode(json).length>8388608)throw new Error('Sitzung ist größer als 8 MiB.');
    const raw: unknown = JSON.parse(json);
    const d = record(raw);
    if ((d.schemaVersion!==1&&d.schemaVersion!==2) || (d.schemaVersion===2&&d.review===undefined) || (d.schemaVersion===1&&d.review!==undefined) || !Array.isArray(d.nodes) || d.nodes.length === 0 || d.nodes.length>5000 ||
        !Array.isArray(d.annotations) || d.annotations.length>20000 || typeof d.activeNodeId !== 'string') throw new Error('Ungültiges Sitzungsformat');
    const root = record(d.nodes[0]);
    if (root.id !== 'n0' || root.parentId !== null || root.san !== null || typeof root.fen !== 'string') throw new Error('Ungültige Wurzel');
    const session = new Session(root.fen);
    session.data.schemaVersion=d.schemaVersion as 1|2;
    if (session.node('n0').fen !== root.fen) throw new Error('Nicht kanonische FEN');
    for (let i = 1; i < d.nodes.length; i++) {
      const n = record(d.nodes[i]);
      if (n.id !== `n${i}` || typeof n.parentId !== 'string' || typeof n.san !== 'string' || typeof n.fen !== 'string') throw new Error('Ungültiger Knoten');
      session.select(n.parentId);
      const id = d.review!==undefined?session.append(n.san,true,true):session.play(n.san);
      if (id !== n.id || session.node(id).san !== n.san || session.node(id).fen !== n.fen) throw new Error('Inkonsistente Variante');
    }
    if(d.review!==undefined)session.data.review=validateReview(d.review,session.data);
    for (const a of d.annotations) {
      validateAnnotation(a);
      session.annotate(a);
    }
    if(d.labels!==undefined){const labels=record(d.labels);session.data.labels={};for(const [id,label] of Object.entries(labels)){if(typeof label!=='string')throw new Error('Ungültiger Variantenname.');session.label(id,label);}}
    if(d.comparison!==undefined){const c=record(d.comparison);if(typeof c.a!=='string' || typeof c.b!=='string')throw new Error('Ungültiger Vergleich.');session.compare(c.a,c.b);}
    if(d.reflections!==undefined){const values=record(d.reflections);session.data.reflections={};for(const [id,value] of Object.entries(values))session.reflect(id,validateReflection(value));}
    if(d.game!==undefined)session.setGame(d.game as GameState);
    if(d.orientation!==undefined)session.orient(d.orientation as PlayerColor);else if(session.data.review)session.orient(session.data.review.human);
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
  if(a.gameReview!==undefined&&(a.kind!=='dialogue'||a.source!=='model'))throw new Error('Ungültige Analyseherkunft.');
  if(a.suggestions!==undefined && (a.kind!=='dialogue'||!['model','simulation'].includes(a.source as string)||!Array.isArray(a.suggestions)||a.suggestions.length>8||!a.suggestions.every(s=>typeof s==='string')))throw new Error('Ungültige Zugvorführung.');
}
