import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline';
import { Chess } from 'chess.js';
import { ApiError } from './model.js';
import { TACTICAL_LIMITS, validateTacticalReport, type TacticalReport } from '../src/tactics.js';

const require = createRequire(import.meta.url);
/** A fresh, isolated engine per explicit request; never started by status or board changes. */
export class StockfishService {
  private busy = false;
  constructor(private timeoutMs = 8000, private enginePath?: string) {}
  async check(raw: unknown): Promise<TacticalReport> {
    if (this.busy) throw new ApiError(429, 'Stockfish prüft bereits.');
    const r = raw as { fen?: unknown; candidate?: unknown } | null;
    if (!r || typeof r.fen !== 'string' || r.fen.length > 150 || (r.candidate !== null && typeof r.candidate !== 'string')) throw new ApiError(400, 'Ungültige Stellung oder Kandidat.');
    let board: Chess;
    try { board = new Chess(r.fen); } catch { throw new ApiError(400, 'Ungültige Stellung.'); }
    if (board.isGameOver()) throw new ApiError(400, 'Stellung bereits beendet.');
    let searchMove = '';
    if (r.candidate !== null) {
      if (!board.moves().includes(r.candidate as string)) throw new ApiError(400, 'Illegaler Kandidatenzug.');
      const copy = new Chess(board.fen()); const move = copy.move(r.candidate as string);
      searchMove = ` searchmoves ${move.from}${move.to}${move.promotion ?? ''}`;
    }
    const fen = board.fen(); const candidate = r.candidate as string | null;
    this.busy = true;
    const start = performance.now();
    try {
      const path = this.enginePath ?? (require('stockfish') as { findEngine: (flavor:string) => string }).findEngine('lite-single');
      return await new Promise<TacticalReport>((resolve,reject) => {
        const child = spawn(process.execPath,[path],{stdio:['pipe','pipe','pipe'],env:{}});
        const lines = createInterface({input:child.stdout});
        let settled = false; let engine = ''; let size = 0; let stderrSize = 0;
        let info: { depth:number; nodes:number; unit:'cp'|'mate'; value:number; pv:string[] } | undefined;
        const finish = (error?: Error, result?: TacticalReport) => {
          if (settled) return; settled = true; clearTimeout(timer); lines.close();
          child.kill('SIGKILL');
          if (error) reject(error); else resolve(result!);
        };
        const timer = setTimeout(() => finish(new ApiError(504,'Stockfish-Zeitlimit überschritten.')),this.timeoutMs);
        child.on('error',() => finish(new ApiError(503,'Stockfish nicht verfügbar.')));
        child.on('exit',() => { if (!settled) finish(new ApiError(502,'Stockfish unerwartet beendet.')); });
        child.stdin.on('error',() => finish(new ApiError(502,'Stockfish-Verbindung beendet.')));
        child.stderr.on('data',(chunk:Buffer) => { stderrSize += chunk.length; if (stderrSize > 65536) finish(new ApiError(502,'Stockfish-Ausgabe zu groß.')); });
        const send = (command:string) => { if (!settled) child.stdin.write(command+'\n'); };
        lines.on('line',line => {
          if (settled) return;
          size += line.length;
          if (size > 65536) { finish(new ApiError(502,'Stockfish-Ausgabe zu groß.')); return; }
          if (line.startsWith('id name ')) engine = line.slice(8);
          if (line === 'uciok') {
            send('setoption name Hash value 16'); send('setoption name MultiPV value 1'); send('ucinewgame'); send('isready');
          }
          if (line === 'readyok') {
            send(`position fen ${fen}`);
            send(`go depth 12 nodes 20000 movetime 1000${searchMove}`);
          }
          if (line.startsWith('info ') && !/lowerbound|upperbound/.test(line)) {
            const depth = /\bdepth (\d+)/.exec(line); const nodes = /\bnodes (\d+)/.exec(line);
            const score = /\bscore (cp|mate) (-?\d+)/.exec(line); const pv = /\bpv (.+)$/.exec(line);
            if (depth && nodes && score && pv) info = {depth:Number(depth[1]),nodes:Number(nodes[1]),unit:score[1] as 'cp'|'mate',value:Number(score[2]),pv:pv[1]!.trim().split(/\s+/)};
          }
          if (line.startsWith('bestmove ')) {
            try {
              if (!info || !engine.startsWith('Stockfish')) throw new Error('Missing search report');
              const replay = new Chess(fen); const san:string[] = [];
              for (const uci of info.pv.slice(0,64)) {
                if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) throw new Error('Invalid UCI move');
                const move = replay.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4] ? {promotion:uci[4]} : {})}); san.push(move.san);
              }
              const result = validateTacticalReport({fen,engine,depth:info.depth,nodes:info.nodes,
                elapsedMs:Math.round(performance.now()-start),score:{unit:info.unit,value:info.value*(board.turn()==='w'?1:-1),perspective:'white'},
                line:san,candidate,limits:TACTICAL_LIMITS},fen);
              finish(undefined,result);
            } catch { finish(new ApiError(502,'Ungültiger Stockfish-Befund.')); }
          }
        });
        send('uci');
      });
    } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(503,'Stockfish nicht verfügbar.'); }
    finally { this.busy = false; }
  }
}
