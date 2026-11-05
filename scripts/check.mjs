import { readFile, access } from 'node:fs/promises';
import { readBank } from '../frontend/src/core/bank.js';
const bank = readBank(JSON.parse(await readFile('frontend/public/data/question-bank.json', 'utf8')));
const all = [...bank.questions.values()];
if (all.length !== 1126 || bank.exams.size !== 30) throw new Error('Question-bank counts differ from source.');
for (const q of all) {
  if (!q.explanation || !q.source || !q.source.page || !Number.isInteger(q.number)) throw new Error(`Missing provenance: ${q.id}`);
  if (q.status === 'excluded' && !q.issues?.length) throw new Error(`Excluded without reason: ${q.id}`);
  if (q.image) {
    if (!/^\/data\/images\/[a-zA-Z0-9_.-]+\.png$/.test(q.image)) throw new Error(`Unsafe image path: ${q.id}`);
    await access('frontend/public' + q.image);
  }
}
console.log(`Bank valid: ${all.length} questions, ${all.filter(q => q.status === 'ready').length} eligible, ${all.filter(q => q.status === 'excluded').length} excluded; ${bank.exams.size} exams.`);
