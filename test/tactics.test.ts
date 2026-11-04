import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.js';
import { checkTactics, TACTICAL_LIMITS, validateTacticalReport, type TacticalReport } from '../src/tactics.js';
import { StockfishService } from '../server/stockfish.js';

const mateFen = '7k/8/5KQ1/8/8/8/8/8 w - - 0 1';
const fixture = (): TacticalReport => ({ fen:mateFen,engine:'Stockfish Testfixture',depth:8,nodes:100,elapsedMs:10,
  score:{unit:'mate',value:1,perspective:'white'},line:['Qg7#'],candidate:'Qg7#',limits:TACTICAL_LIMITS });

test('real Stockfish Lite proves mate in one and returns a legal selected-candidate line', async () => {
  const service = new StockfishService();
  const report = await service.check({fen:mateFen,candidate:'Qg7#'});
  assert.match(report.engine,/Stockfish 19 Lite/);
  assert.deepEqual(report.score,{unit:'mate',value:1,perspective:'white'});
  assert.deepEqual(report.line,['Qg7#']);
  assert.deepEqual(report.limits,TACTICAL_LIMITS);
  assert.ok(report.depth > 0 && report.depth <= 12);
});
test('real Stockfish scores are converted to white perspective when black can mate', async () => {
  const report = await new StockfishService().check({fen:'8/8/8/8/8/5kq1/8/7K b - - 0 1',candidate:'Qg2#'});
  assert.deepEqual(report.score,{unit:'mate',value:-1,perspective:'white'});
  assert.deepEqual(report.line,['Qg2#']);
});
test('real Stockfish obeys single request gate and can analyse a regular position', async () => {
  const service = new StockfishService();
  const promise = service.check({fen:new Session().snapshot().nodes[0]!.fen,candidate:null});
  await assert.rejects(service.check({fen:mateFen,candidate:null}), /bereits/);
  const report = await promise;
  assert.ok(report.line.length > 0); assert.equal(report.candidate,null);
  assert.equal(report.score.unit,'cp');
});
test('invalid FEN, UCI injection, illegal candidate and ended position fail before engine work', async () => {
  const service = new StockfishService();
  for (const value of [null,{fen:'invalid',candidate:null},{fen:mateFen,candidate:'e4'},{fen:mateFen,candidate:'Qg7#\nquit'},
    {fen:'7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',candidate:null}]) await assert.rejects(service.check(value));
});
test('missing engine and timeout fail cleanly; service can be called again', async () => {
  await assert.rejects(new StockfishService(8000,'/nonexistent-stockfish.js').check({fen:mateFen,candidate:null}), /Stockfish/);
  const service = new StockfishService(1);
  for (let i=0;i<2;i++) await assert.rejects(service.check({fen:mateFen,candidate:null}), /Zeitlimit/);
});
test('factchecks stay on requested node and survive session export/import', async () => {
  let resolve!: (value:unknown) => void;
  const session = new Session(mateFen);
  const pending = checkTactics(session,() => session,{check:() => new Promise(r => {resolve=r;})},'Qg7#');
  session.play('Qg7#'); resolve(fixture());
  assert.equal(await pending,'stored');
  const restored = Session.import(session.export()).snapshot();
  assert.equal(restored.annotations[0]!.nodeId,'n0');
  assert.equal(restored.annotations[0]!.source,'stockfish');
  assert.deepEqual(restored.annotations[0]!.engine,fixture());
});
test('session replacement discards delayed engine reply without annotations', async () => {
  let resolve!: (value:unknown) => void;
  const session = new Session(mateFen); let current = session;
  const pending = checkTactics(session,() => current,{check:() => new Promise(r => {resolve=r;})},null);
  current = new Session(mateFen); resolve(fixture());
  assert.equal(await pending,'discarded'); assert.equal(current.snapshot().annotations.length,0);
});
test('import rejects tampered engine reports, illegal lines and mismatched provenance', () => {
  const session = new Session(mateFen);
  session.annotate({nodeId:'n0',kind:'factcheck',source:'stockfish',text:'Befund',hypothesis:false,openQuestions:[],engine:fixture()});
  for (const mutate of [
    (r:TacticalReport) => {r.fen = new Session().snapshot().nodes[0]!.fen;},
    (r:TacticalReport) => {r.line=['e4'];},
    (r:TacticalReport) => {r.candidate='Kh1';},
    (r:TacticalReport) => {r.depth=99;},
    (r:TacticalReport) => {r.score.perspective='black' as 'white';}
  ]) {
    const d=session.snapshot(); mutate(d.annotations[0]!.engine!);
    assert.throws(() => Session.import(JSON.stringify(d)));
  }
  assert.throws(() => session.annotate({nodeId:'n0',kind:'memory',source:'stockfish',text:'x',hypothesis:false,openQuestions:[]}));
  assert.throws(() => validateTacticalReport(null,mateFen));
});
test('reply for a different candidate is rejected without storing a factcheck', async () => {
  const session = new Session(mateFen);
  await assert.rejects(checkTactics(session,() => session,{check:async () => fixture()},null), /anderen Kandidaten/);
  assert.equal(session.snapshot().annotations.length,0);
});
