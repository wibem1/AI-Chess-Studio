import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Studio, SimulationAdapter, type DialogueAdapter } from '../src/dialogue.js';

test('simulation reply and question remain on the requested branch', async () => {
  const studio = new Studio(); const id = studio.session.play('e4');
  const reply = studio.ask('Was ist mein Plan?', new SimulationAdapter('slow'));
  studio.session.select('n0'); studio.session.play('d4');
  assert.equal(await reply, 'stored');
  const data = studio.session.snapshot();
  assert.equal(data.annotations.length, 2);
  assert.ok(data.annotations.every(a => a.nodeId === id));
  assert.equal(data.annotations[1]!.source, 'simulation');
  assert.equal(data.annotations[1]!.hypothesis, true);
});
test('session replacement discards delayed answers even with matching node IDs', async () => {
  const studio = new Studio(); const json = studio.session.export();
  const reply = studio.ask('Plan?', new SimulationAdapter('slow'));
  studio.restore(json);
  assert.equal(await reply, 'discarded');
  assert.equal(studio.session.snapshot().annotations.length, 0);
});
test('malformed responses and failed requests leave session unchanged', async () => {
  const studio = new Studio(); const before = studio.session.export();
  for (const mode of ['invalid', 'failure'] as const) {
    await assert.rejects(studio.ask('Plan?', new SimulationAdapter(mode)));
    assert.equal(studio.session.export(), before);
  }
  await assert.rejects(studio.ask('  ', new SimulationAdapter()));
});
test('well-shaped responses with illegal candidates are rejected', async () => {
  const studio = new Studio();
  const normal = await new SimulationAdapter().respond({ nodeId: 'n0', fen: '', question: '', legalMoves: ['e4'] }) as Record<string, unknown>;
  const adapter: DialogueAdapter = { respond: async () => ({ ...normal, candidates: ['e5'] }) };
  await assert.rejects(studio.ask('Plan?', adapter), /Zugvorschläge/);
  assert.equal(studio.session.snapshot().annotations.length, 0);
});

test('demo provides no arbitrary legal-move tips or generic opening strategy',async()=>{
 const studio=new Studio();await studio.ask('Analysiere die Stellung',new SimulationAdapter());
 const answer=studio.session.snapshot().annotations.at(-1)!;
 assert.deepEqual(answer.suggestions,[]);assert.match(answer.text,/Hier antwortet keine KI/);assert.doesNotMatch(answer.text,/Zentrumskontrolle|Keine legalen Züge/);
});
