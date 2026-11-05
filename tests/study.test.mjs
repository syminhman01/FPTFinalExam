import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readBank } from '../frontend/src/core/bank.js';
import { isCorrect, replay, mergeEvents, latestResponses, score, remainingMs } from '../frontend/src/core/study.js';
import { loadEvents, saveEvents } from '../frontend/src/lib/storage.js';
import { escape } from '../frontend/src/lib/html.js';

const bank = readBank(JSON.parse(await readFile('frontend/public/data/question-bank.json', 'utf8')));
const eligible = [...bank.questions.values()].filter(q => q.status === 'ready');
const single = eligible.find(q => q.correctOptionIds.length === 1);
const multi = eligible.find(q => q.correctOptionIds.length > 1);
const sid = crypto.randomUUID();
const at = offset => new Date(Date.parse('2026-11-05T08:00:00Z') + offset).toISOString();
const event = (kind, data = {}, offset = 0, sessionId = sid) => ({ id: crypto.randomUUID(), sessionId, kind, at: at(offset), data });
const start = (q, mode = 'practice', offset = 0, sessionId = sid) => event('start', { mode, subjectId: q.subjectId, examId: q.examId, questionIds: [q.id] }, offset, sessionId);

test('multi-answer requires exactly the right set, regardless of order', () => {
  assert.equal(isCorrect(multi, [...multi.correctOptionIds].reverse()), true);
  assert.equal(isCorrect(multi, multi.correctOptionIds.slice(0, -1)), false);
  assert.equal(isCorrect(multi, [...multi.correctOptionIds, 'Z']), false);
  assert.equal(isCorrect(multi, [...multi.correctOptionIds, multi.correctOptionIds[0]]), false);
});

test('checking locks the practice answer and reload replays it faithfully', () => {
  const events = [start(single), event('answer', { questionId: single.id, optionIds: single.correctOptionIds }, 1), event('check', { questionId: single.id }, 2), event('answer', { questionId: single.id, optionIds: [] }, 3)];
  const [s] = replay(JSON.parse(JSON.stringify(events)), bank);
  assert.deepEqual(s.answers[single.id], single.correctOptionIds);
  assert.equal(score(s, bank).correct, 1);
  assert.equal(s.submittedAt, null); // Final explanation stays visible until the user finishes.
});

test('exam keeps a fixed deadline across reloads, rejects late answers, and scores blanks', () => {
  const events = [start(single, 'exam'), event('answer', { questionId: single.id, optionIds: single.correctOptionIds }, 50 * 60000 + 1), event('submit', {}, 80 * 60000)];
  const [s] = replay(events, bank);
  assert.equal(s.deadline, Date.parse(at(50 * 60000)));
  assert.equal(s.submittedAt, at(50 * 60000));
  assert.equal(remainingMs(s, Date.parse(at(45 * 60000))), 5 * 60000);
  assert.equal(remainingMs(s, Date.parse(at(90 * 60000))), 0);
  assert.deepEqual(score(s, bank), { total: 1, correct: 0, answered: 0, wrong: 0, skipped: 1, percent: 0, points: '0.0' });
});

test('an exam cannot reveal feedback or change the wrong list before submission', () => {
  const events = [start(single, 'exam'), event('answer', { questionId: single.id, optionIds: single.correctOptionIds }, 1), event('check', { questionId: single.id }, 2)];
  const sessions = replay(events, bank);
  assert.deepEqual(sessions[0].checkedAt, {});
  assert.equal(latestResponses(sessions, bank).size, 0);
  assert.equal(latestResponses(replay([...events, event('submit', {}, 3)], bank), bank).get(single.id).correct, true);
});

for (const mode of ['practice', 'review']) {
  test(`${mode}: unconfirmed selections count as skipped after finishing and reopening`, () => {
    const events = [start(single, mode), event('answer', { questionId: single.id, optionIds: single.correctOptionIds }, 1), event('submit', {}, 2)];
    const [s] = replay(JSON.parse(JSON.stringify(events)), bank);
    assert.equal(score(s, bank).correct, 0);
    assert.equal(score(s, bank).skipped, 1);
    const latest = latestResponses([s], bank).get(single.id);
    assert.equal(latest.correct, false);
    assert.deepEqual(latest.selected, []);
    // The immutable event log still retains the original choice.
    assert.deepEqual(events[1].data.optionIds, single.correctOptionIds);
  });
}

test('finishing practice retains checked answers and counts only unchecked ones as skipped', () => {
  const q2 = eligible.find(q => q.examId === single.examId && q.id !== single.id);
  const begin = event('start', { mode: 'practice', subjectId: single.subjectId, examId: single.examId, questionIds: [single.id, q2.id] });
  const [s] = replay([begin, event('answer', { questionId: single.id, optionIds: single.correctOptionIds }, 1), event('check', { questionId: single.id }, 2), event('answer', { questionId: q2.id, optionIds: q2.correctOptionIds }, 3), event('submit', {}, 4)], bank);
  assert.deepEqual(score(s, bank), { total: 2, correct: 1, answered: 1, wrong: 0, skipped: 1, percent: 50, points: '5.0' });
  assert.deepEqual(s.answers[single.id], single.correctOptionIds);
});

test('a later correct review removes a previously wrong question', () => {
  const first = [start(single), event('answer', { questionId: single.id, optionIds: [single.options.find(o => !single.correctOptionIds.includes(o.id)).id] }, 1), event('check', { questionId: single.id }, 2)];
  assert.equal(latestResponses(replay(first, bank), bank).get(single.id).correct, false);
  const secondId = crypto.randomUUID();
  const second = [start(single, 'review', 1000, secondId), event('answer', { questionId: single.id, optionIds: single.correctOptionIds }, 1001, secondId), event('check', { questionId: single.id }, 1002, secondId)];
  assert.equal(latestResponses(replay([...second, ...first], bank), bank).get(single.id).correct, true);
  assert.equal(latestResponses(replay([...first, ...second, event('submit', {}, 2000)], bank), bank).get(single.id).correct, true);
});

test('two devices merge immutable events without losing different answers or duplicating retries', () => {
  const q2 = eligible.find(q => q.examId === single.examId && q.id !== single.id);
  const begin = event('start', { mode: 'practice', subjectId: single.subjectId, examId: single.examId, questionIds: [single.id, q2.id] });
  const a = event('answer', { questionId: single.id, optionIds: single.correctOptionIds }, 1);
  const b = event('answer', { questionId: q2.id, optionIds: q2.correctOptionIds }, 2);
  const merged = mergeEvents([begin, a], [begin, b, a]);
  assert.equal(merged.length, 3);
  const [s] = replay(merged, bank);
  assert.deepEqual(s.answers[single.id], single.correctOptionIds);
  assert.deepEqual(s.answers[q2.id], q2.correctOptionIds);
});

test('excluded questions cannot enter a scored session', () => {
  const excluded = [...bank.questions.values()].find(q => q.status === 'excluded');
  assert.equal(replay([start(excluded)], bank).length, 0);
});

test('account storage stays separate and corrupted data is preserved', () => {
  const map = new Map();
  const storage = { getItem: k => map.get(k) || null, setItem: (k, v) => map.set(k, v) };
  const events = [start(single)];
  saveEvents('guest', events, storage);
  assert.equal(loadEvents('user-a', storage).length, 0);
  assert.equal(loadEvents('guest', storage).length, 1);
  map.set('fe-study:v1:user-a', 'broken');
  assert.throws(() => loadEvents('user-a', storage), /không đọc được/);
  assert.equal(map.get('fe-study:v1:user-a'), 'broken');
});

test('source question and account text are escaped before HTML rendering', () => {
  assert.equal(escape('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
