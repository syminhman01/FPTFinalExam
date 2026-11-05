/** Runtime validation at the boundary of the generated question bank. */
export function readBank(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.subjects)) throw new Error('Ngân hàng câu hỏi không đúng định dạng.');
  const questions = new Map();
  const exams = new Map();
  for (const subject of input.subjects) {
    if (typeof subject.id !== 'string' || !Array.isArray(subject.exams)) throw new Error('Dữ liệu môn học không hợp lệ.');
    for (const exam of subject.exams) {
      if (typeof exam.id !== 'string' || exams.has(exam.id) || !Array.isArray(exam.questions)) throw new Error('Dữ liệu đề thi không hợp lệ.');
      exams.set(exam.id, { ...exam, subjectId: subject.id });
      for (const q of exam.questions) {
        if (typeof q.id !== 'string' || questions.has(q.id) || typeof q.prompt !== 'string' || !Array.isArray(q.options) || !Array.isArray(q.correctOptionIds) || !['ready', 'excluded'].includes(q.status)) throw new Error('Dữ liệu câu hỏi không hợp lệ.');
        const ids = new Set(q.options.map(o => o.id));
        if (ids.size !== q.options.length || q.options.some(o => typeof o.text !== 'string' || !/^[A-Z]$/.test(o.id))) throw new Error(`Lựa chọn không hợp lệ: ${q.id}`);
        if (q.status === 'ready' && (!q.prompt.trim() || !q.correctOptionIds.length || q.correctOptionIds.some(id => !ids.has(id)))) throw new Error(`Đáp án không khớp: ${q.id}`);
        questions.set(q.id, { ...q, subjectId: subject.id, examId: exam.id });
      }
    }
  }
  return { ...input, questions, exams };
}

export function eligibleQuestions(exam) {
  return exam.questions.filter(q => q.status === 'ready');
}

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
