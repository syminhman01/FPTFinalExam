export const EXAM_DURATION_MS = 50 * 60 * 1000;
const kinds = new Set(['start', 'answer', 'check', 'move', 'submit']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validEvent(e) {
  if (!object(e) || !uuid.test(e.id) || !uuid.test(e.sessionId) || !kinds.has(e.kind) || typeof e.at !== 'string' || !Number.isFinite(Date.parse(e.at)) || !object(e.data)) return false;
  const d = e.data;
  if (e.kind === 'start') return ['practice', 'exam', 'review'].includes(d.mode) && typeof d.subjectId === 'string' && typeof d.examId === 'string' && Array.isArray(d.questionIds) && d.questionIds.length > 0 && d.questionIds.length <= 2000 && d.questionIds.every(id => typeof id === 'string') && new Set(d.questionIds).size === d.questionIds.length;
  if (e.kind === 'answer') return typeof d.questionId === 'string' && Array.isArray(d.optionIds) && d.optionIds.length <= 26 && d.optionIds.every(id => typeof id === 'string' && /^[A-Z]$/.test(id)) && new Set(d.optionIds).size === d.optionIds.length;
  if (e.kind === 'check') return typeof d.questionId === 'string';
  if (e.kind === 'move') return Number.isInteger(d.cursor) && d.cursor >= 0;
  return true;
}

// Events are immutable. Union by UUID prevents re-upload/retry from duplicating answers.
export function mergeEvents(...groups) {
  const map = new Map();
  for (const group of groups) for (const event of group) if (validEvent(event)) map.set(event.id, event);
  const rank = { start: 0, answer: 1, check: 2, move: 3, submit: 4 };
  return [...map.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || rank[a.kind] - rank[b.kind] || a.id.localeCompare(b.id));
}

export function replay(events, bank) {
  const sessions = new Map();
  for (const event of mergeEvents(events)) {
    const d = event.data;
    if (event.kind === 'start') {
      if (sessions.has(event.sessionId) || d.questionIds.some(id => bank.questions.get(id)?.status !== 'ready')) continue;
      const validSubject = d.questionIds.every(id => bank.questions.get(id).subjectId === d.subjectId);
      const validExam = d.mode === 'review' || d.questionIds.every(id => bank.questions.get(id).examId === d.examId);
      if (!validSubject || !validExam) continue;
      sessions.set(event.sessionId, { id: event.sessionId, ...d, startedAt: event.at, updatedAt: event.at, deadline: d.mode === 'exam' ? Date.parse(event.at) + EXAM_DURATION_MS : null, cursor: 0, answers: {}, checkedAt: {}, submittedAt: null });
      continue;
    }
    const s = sessions.get(event.sessionId);
    if (!s || s.submittedAt) continue;
    if (event.kind === 'submit') {
      // Practice choices are drafts until checked; finishing treats drafts as skipped.
      // Keep the event log intact so reload and cloud replay produce the same result.
      if (s.mode !== 'exam') {
        for (const id of s.questionIds) if (!s.checkedAt[id]) delete s.answers[id];
      }
      s.submittedAt = s.deadline ? new Date(Math.min(Date.parse(event.at), s.deadline)).toISOString() : event.at;
      s.updatedAt = event.at;
      continue;
    }
    if (s.deadline && Date.parse(event.at) >= s.deadline) continue;
    if (event.kind === 'move') s.cursor = Math.min(d.cursor, s.questionIds.length - 1);
    if (event.kind === 'answer' && s.questionIds.includes(d.questionId) && !s.checkedAt[d.questionId]) {
      const q = bank.questions.get(d.questionId);
      if (d.optionIds.some(id => !q.options.some(o => o.id === id)) || (q.correctOptionIds.length === 1 && d.optionIds.length > 1)) continue;
      s.answers[d.questionId] = [...d.optionIds];
    }
    if (event.kind === 'check' && s.mode !== 'exam' && s.questionIds.includes(d.questionId) && s.answers[d.questionId]?.length && !s.checkedAt[d.questionId]) s.checkedAt[d.questionId] = event.at;
    s.updatedAt = event.at;
  }
  return [...sessions.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function isCorrect(question, selected = []) {
  return selected.length === question.correctOptionIds.length && new Set(selected).size === selected.length && question.correctOptionIds.every(id => selected.includes(id));
}

export function score(session, bank) {
  const total = session.questionIds.length;
  const correct = session.questionIds.filter(id => isCorrect(bank.questions.get(id), session.answers[id])).length;
  const answered = session.questionIds.filter(id => session.answers[id]?.length).length;
  return { total, correct, answered, wrong: answered - correct, skipped: total - answered, percent: Math.round(correct / total * 100), points: (correct / total * 10).toFixed(1) };
}

export function latestResponses(sessions, bank) {
  const latest = new Map();
  for (const s of sessions) for (const id of s.questionIds) {
    const at = s.mode === 'exam' ? s.submittedAt : (s.checkedAt[id] || s.submittedAt);
    if (!at) continue; // Unsubmitted exam answers never affect the wrong-answer collection.
    const old = latest.get(id);
    if (!old || Date.parse(at) > Date.parse(old.at) || (Date.parse(at) === Date.parse(old.at) && s.id > old.sessionId)) latest.set(id, { at, sessionId: s.id, correct: isCorrect(bank.questions.get(id), s.answers[id]), selected: s.answers[id] || [] });
  }
  return latest;
}

export function remainingMs(session, now = Date.now()) {
  return session.deadline ? Math.max(0, session.deadline - now) : 0;
}
