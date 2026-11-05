import test from 'node:test';
import assert from 'node:assert/strict';
import { exchangeEvents } from '../frontend/src/lib/cloud.js';

const start = () => ({ id: crypto.randomUUID(), sessionId: crypto.randomUUID(), kind: 'start', at: new Date().toISOString(), data: { mode: 'practice', subjectId: 'SSG104', examId: 'test', questionIds: ['test-q'] } });
const row = event => ({ id: event.id, session_id: event.sessionId, kind: event.kind, happened_at: event.at, data: event.data });
function mockClient(remote, rpcError = null) {
  const uploads = []; const users = [];
  return {
    uploads, users,
    from() { return { select() { return this; }, eq(_key, user) { users.push(user); return this; }, order() { return this; }, async range(from, to) { return { data: remote.slice(from, to + 1).map(row), error: null }; } }; },
    async rpc(name, { items }) { assert.equal(name, 'append_study_events'); uploads.push(items); return { error: rpcError }; }
  };
}

test('sync paginates remote events and only uploads missing UUIDs in batches', async () => {
  const remote = Array.from({ length: 1001 }, start);
  const localOnly = Array.from({ length: 201 }, start);
  const client = mockClient(remote);
  const merged = await exchangeEvents(client, 'user-a', [remote[0], ...localOnly]);
  assert.equal(merged.length, 1202);
  assert.deepEqual(client.uploads.map(x => x.length), [100, 100, 1]);
  assert.deepEqual(client.users, ['user-a', 'user-a']);
});

test('failed uploads remain retryable without mutating local progress', async () => {
  const local = [start()]; const copy = JSON.stringify(local);
  await assert.rejects(exchangeEvents(mockClient([], new Error('offline')), 'user-a', local), /offline/);
  assert.equal(JSON.stringify(local), copy);
});
