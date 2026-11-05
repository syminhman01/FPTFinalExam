import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

let db;
const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const qid = 'SSG104::SSG104_FA2023-RE-1161::1';
const sid = crypto.randomUUID();
const make = (kind, data, sessionId = sid) => ({ id: crypto.randomUUID(), sessionId, kind, at: new Date().toISOString(), data });
const append = items => db.query('select public.append_study_events($1::jsonb) as count', [JSON.stringify(items)]);

before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; insert into auth.users values ('${userA}'),('${userB}');`);
  await db.exec(await readFile('backend/database/migrations/001_study_events.sql', 'utf8'));
  await db.exec(await readFile('backend/database/seeds/question_catalog.sql', 'utf8'));
});
after(async () => { await db?.close(); });

test('SQL accepts valid events, rejects invalid options and isolates accounts', async () => {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${userA}';`);
  const start = make('start', { mode: 'practice', subjectId: 'SSG104', examId: 'SSG104_FA2023-RE-1161', questionIds: [qid] });
  assert.equal((await append([start])).rows[0].count, 1);
  assert.equal((await append([start])).rows[0].count, 0);
  await assert.rejects(append([make('answer', { questionId: qid, optionIds: ['Z'] })]), /Invalid answer options/);
  await append([make('answer', { questionId: qid, optionIds: ['A'] })]);
  assert.equal((await db.query('select * from public.study_events')).rows.length, 2);
  await assert.rejects(db.query('insert into public.study_events(id,user_id,session_id,kind,happened_at,data) values($1,$2,$3,\'submit\',now(),\'{}\')', [crypto.randomUUID(), userA, sid]), /permission denied/);
  await db.exec(`set request.jwt.claim.sub = '${userB}';`);
  assert.equal((await db.query('select * from public.study_events')).rows.length, 0);
  await assert.rejects(append([make('answer', { questionId: qid, optionIds: ['A'] })]), /Unknown session/);
  await assert.rejects(append([start]), /Event identity conflict/);
});

test('SQL rejects excluded questions, malformed sessions and pre-submit exam checks', async () => {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${userA}';`);
  const invalidSession = make('start', { mode: 'practice', subjectId: 'SWT301', examId: 'SSG104_FA2023-RE-1161', questionIds: [qid] }, crypto.randomUUID());
  await assert.rejects(append([invalidSession]), /not eligible/);
  await assert.rejects(append([make('start', { mode: null, subjectId: 'SSG104', examId: 'SSG104_FA2023-RE-1161', questionIds: [qid] }, crypto.randomUUID())]), /Invalid session/);
  const excluded = make('start', { mode: 'practice', subjectId: 'SWT301', examId: 'SWT301_FE_SP2025-FE-3561', questionIds: ['SWT301::SWT301_FE_SP2025-FE-3561::14'] }, crypto.randomUUID());
  await assert.rejects(append([excluded]), /not eligible/);
  const examSid = crypto.randomUUID();
  await append([make('start', { mode: 'exam', subjectId: 'SSG104', examId: 'SSG104_FA2023-RE-1161', questionIds: [qid] }, examSid)]);
  await assert.rejects(append([make('check', { questionId: qid }, examSid)]), /Cannot check an exam/);
  await db.exec('set request.jwt.claim.sub = \'\';');
  await assert.rejects(append([]), /Authentication required/);
  await db.exec('reset role; set role anon;');
  await assert.rejects(append([]), /permission denied/);
});
