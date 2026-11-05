import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readBank } from '../frontend/src/core/bank.js';
const bank = readBank(JSON.parse(await readFile('frontend/public/data/question-bank.json', 'utf8')));
const sql = value => "'" + String(value).replaceAll("'", "''") + "'";
const rows = [...bank.questions.values()].map(q => `(${sql(q.id)},${sql(q.subjectId)},${sql(q.examId)},array[${q.options.map(o => sql(o.id)).join(',')}]::text[],${Math.max(1, q.correctOptionIds.length)},${q.status === 'ready'})`);
await mkdir('backend/database/seeds', { recursive: true });
await writeFile('backend/database/seeds/question_catalog.sql', `-- Generated from question-bank.json; no personal data. Run after migration 001.\nbegin;\ninsert into public.question_catalog(id,subject_id,exam_id,option_ids,selection_count,eligible) values\n${rows.join(',\n')}\non conflict (id) do update set subject_id=excluded.subject_id,exam_id=excluded.exam_id,option_ids=excluded.option_ids,selection_count=excluded.selection_count,eligible=excluded.eligible;\ncommit;\n`);
console.log(`Generated catalog: ${rows.length} questions`);
