import {reviewLocked} from './review.js';
import {pathTo} from './game.js';
import {replayHistory,type PositionHistory} from './history.js';
import { Chess } from 'chess.js';
import type { Session } from './session.js';

export interface TacticalReport {
  history?:PositionHistory;
  fen: string; engine: string; depth: number; nodes: number; elapsedMs: number;
  score: { unit: 'cp' | 'mate'; value: number; perspective: 'white' };
  line: string[]; candidate: string | null;
  limits: { depth: 12; nodes: 20000; milliseconds: 1000; threads: 1; hashMB: 16 };
}
export const TACTICAL_LIMITS = { depth: 12, nodes: 20000, milliseconds: 1000, threads: 1, hashMB: 16 } as const;
export interface TacticalAdapter { check(fen: string, candidate: string | null,history?:PositionHistory): Promise<unknown> }
export function validateTacticalReport(raw: unknown, fen: string): TacticalReport {
  if (!raw || typeof raw !== 'object') throw new Error('Ungültiger Stockfish-Befund.');
  const r = raw as TacticalReport;
  if (r.fen !== fen || typeof r.engine !== 'string' || !r.engine.startsWith('Stockfish') || r.engine.length > 120 ||
      !Number.isInteger(r.depth) || r.depth < 0 || r.depth > 12 || !Number.isSafeInteger(r.nodes) || r.nodes < 0 ||
      !Number.isFinite(r.elapsedMs) || r.elapsedMs < 0 || !r.score || !['cp','mate'].includes(r.score.unit) ||
      !Number.isSafeInteger(r.score.value) || r.score.perspective !== 'white' ||
      !Array.isArray(r.line) || r.line.length > 64 || !r.line.length ||
      !r.limits || Object.entries(TACTICAL_LIMITS).some(([k,v]) => r.limits[k as keyof typeof TACTICAL_LIMITS] !== v) ||
      (r.candidate !== null && typeof r.candidate !== 'string')) throw new Error('Ungültiger Stockfish-Befund.');
  if(r.history!==undefined)replayHistory(r.history,fen);
  const board = new Chess(fen);
  for (const san of r.line) {
    if (typeof san !== 'string' || !board.moves().includes(san)) throw new Error('Illegale Stockfish-Variante.');
    board.move(san);
  }
  if (r.candidate !== null && r.line[0] !== r.candidate) throw new Error('Falscher geprüfter Kandidatenzug.');
  return structuredClone(r);
}
export async function checkTactics(session: Session, current: () => Session, adapter: TacticalAdapter, candidate: string | null): Promise<'stored' | 'discarded'> {
  const data = session.snapshot();
  const nodeId = data.activeNodeId;
  const fen = data.nodes.find(n => n.id === nodeId)!.fen;
  if(reviewLocked(data))throw new Error('Zuerst eigene Gedanken festhalten oder den Zug ausdrücklich aufdecken.');
  if(data.review && session.status().repetition)throw new Error('Stellung bereits mindestens dreimal wiederholt. Remisanspruch aus der vollständigen Historie beachten; kein isolierter FEN-Faktencheck.');
  if (session.status().gameOver) throw new Error('Die Partie ist in dieser Variante beendet.');
  const path=pathTo(data,nodeId);
  const history=data.review?{rootFen:path[0]!.fen,moves:path.slice(1).map(n=>n.san!)}:undefined;
  if(history)replayHistory(history,fen);
  const raw = await adapter.check(fen, candidate,history);
  if (current() !== session) return 'discarded';
  const report = validateTacticalReport(raw, fen);
  if(history && JSON.stringify(report.history)!==JSON.stringify(history))throw new Error('Stockfish-Befund bestätigt die vollständige Zuggeschichte nicht.');
  if (report.candidate !== candidate) throw new Error('Stockfish-Befund gehört zu einem anderen Kandidaten.');
  session.annotate({ nodeId, kind:'factcheck', source:'stockfish', text:'Taktischer Suchbefund unter begrenzten Suchbedingungen; keine strategische Wahrheit.',
    hypothesis:false, openQuestions:[], engine:report });
  return 'stored';
}
export class ServerTacticalAdapter implements TacticalAdapter {
  constructor(private transport:typeof fetch=(input,init)=>fetch(input,init)){}
  async check(fen: string, candidate: string | null,history?:PositionHistory): Promise<unknown> {
    let response: Response;
    try { response = await this.transport('/api/tactics', { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({fen,candidate,...(history?{history}:{})}), signal:AbortSignal.timeout(12000) }); }
    catch { throw new Error('Stockfish nicht erreichbar oder Zeitlimit überschritten.'); }
    if (!response.ok) throw new Error(response.status === 429 ? 'Stockfish prüft bereits eine Stellung.' : 'Stockfish-Prüfung fehlgeschlagen. Stellung und Eingabe prüfen.');
    return response.json();
  }
}
