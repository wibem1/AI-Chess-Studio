import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session, type Annotation } from '../src/session.js';

const play = (s: Session, moves: string[]) => moves.forEach(m => s.play(m));
test('legal moves and atomic rejection of illegal moves', () => {
  const s = new Session();
  assert.equal(s.legalMoves().length, 20);
  const before = s.export();
  assert.throws(() => s.play('e5'));
  assert.equal(s.export(), before);
  s.play({ from: 'e2', to: 'e4' });
  assert.match(s.snapshot().nodes[1]!.fen, /^rnbqkbnr\/pppppppp\/8\/8\/4P3/);
});
test('castling moves king and rook; castling through check is rejected', () => {
  const s = new Session('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  s.play('O-O');
  assert.match(s.snapshot().nodes[1]!.fen, /R4RK1 b/);
  const checked = new Session('r3kr1r/8/8/8/8/8/8/R3K2R w KQ - 0 1');
  assert.throws(() => checked.play('O-O'));
});
test('en passant removes the bypassed pawn', () => {
  const s = new Session();
  play(s, ['e4', 'a6', 'e5', 'd5', 'exd6']);
  assert.match(s.snapshot().nodes.at(-1)!.fen, /^rnbqkbnr\/1pp1pppp\/p2P4\/8\/8/);
});
test('promotion requires a piece and supports underpromotion', () => {
  const s = new Session('7k/P7/8/8/8/8/8/7K w - - 0 1');
  assert.throws(() => s.play({ from: 'a7', to: 'a8' }));
  s.play({ from: 'a7', to: 'a8', promotion: 'n' });
  assert.match(s.snapshot().nodes[1]!.fen, /^N6k/);
});
test('branches remain separate and repeated moves reuse the same child', () => {
  const s = new Session();
  const e4 = s.play('e4'); const e5 = s.play('e5');
  s.select(e4); const c5 = s.play('c5');
  assert.notEqual(e5, c5);
  assert.equal(s.snapshot().nodes[2]!.parentId, e4);
  s.select(e4); assert.equal(s.play('e5'), e5);
  assert.equal(s.snapshot().nodes.length, 4);
  assert.throws(() => s.select('missing'));
});
test('checkmate and stalemate stop further moves', () => {
  const s = new Session(); play(s, ['f3', 'e5', 'g4', 'Qh4#']);
  assert.equal(s.status().checkmate, true);
  assert.throws(() => s.play('a3'));
  const stale = new Session('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(stale.status().draw, true);
  assert.equal(stale.status().check, false);
});
test('repetition uses branch history, including after import', () => {
  const s = new Session(); play(s, ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']);
  assert.equal(s.status().repetition, true);
  assert.equal(Session.import(s.export()).status().repetition, true);
});
test('late dialogue and strategic memory retain provenance and request position', () => {
  const s = new Session(); const requestNode = s.play('e4'); s.select('n0'); s.play('d4');
  const a: Annotation = { nodeId: requestNode, kind: 'memory', source: 'simulation',
    text: 'Zentrum kontrollieren', hypothesis: true, openQuestions: ['Wie reagiert Schwarz?'] };
  s.annotate(a); s.annotate({ ...a, kind: 'dialogue' });
  a.openQuestions.push('external mutation');
  const saved = s.export(); const restored = Session.import(saved);
  assert.equal(restored.export(), saved);
  assert.equal(restored.snapshot().annotations[0]!.nodeId, requestNode);
  assert.equal(restored.snapshot().annotations[0]!.openQuestions.length, 1);
  const copy = restored.snapshot(); copy.nodes[0]!.fen = 'corrupt';
  assert.equal(restored.export(), saved);
});
test('invalid annotations are rejected without mutating state', () => {
  const s = new Session(); const before = s.export();
  assert.throws(() => s.annotate({ nodeId: 'n0', kind: 'memory', source: 'unknown' } as unknown as Annotation));
  assert.equal(s.export(), before);
});
test('import rejects malformed, unsupported, forged and disconnected data', () => {
  assert.throws(() => Session.import('{'));
  for (const raw of [null, [], {}, { schemaVersion: 99 }]) assert.throws(() => Session.import(JSON.stringify(raw)));
  const s = new Session(); s.play('e4');
  const mutations: Array<(d: ReturnType<Session['snapshot']>) => void> = [
    d => { d.schemaVersion = 2 as 1; },
    d => { d.activeNodeId = 'missing'; },
    d => { d.nodes[1]!.fen = d.nodes[0]!.fen; },
    d => { d.nodes[1]!.parentId = 'n1'; },
    d => { d.nodes[1]!.san = 'e5'; },
    d => { d.nodes[1]!.id = 'n0'; },
    d => { d.nodes.push({ ...d.nodes[1]!, id: 'n2' }); },
    d => { d.annotations.push({ nodeId: 'missing', kind: 'memory', source: 'human', text: '', hypothesis: false, openQuestions: [] }); }
  ];
  for (const mutate of mutations) { const d = s.snapshot(); mutate(d); assert.throws(() => Session.import(JSON.stringify(d))); }
});
