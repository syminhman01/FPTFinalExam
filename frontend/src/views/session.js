import { isCorrect, score, remainingMs } from '../core/study.js';
import { escape as e, icon, clock } from '../lib/html.js';
import { examTitle } from './library.js';

function questionImage(q) {
  if (!q.image || !/^\/data\/images\/[a-zA-Z0-9_./-]+\.(png|jpg|webp)$/.test(q.image)) return '';
  return `<figure class="source-figure"><a href="${e(q.image)}" target="_blank" rel="noopener" aria-label="Mở ảnh câu hỏi số ${q.number} ở kích thước đầy đủ"><img src="${e(q.image)}" alt="Nội dung hoặc hình minh họa gốc của câu ${q.number}; mở ảnh để phóng to" loading="lazy" /></a><figcaption>Ảnh đề gốc · Chạm để xem lớn</figcaption></figure>`;
}

export function feedback(q, selected) {
  const correct = isCorrect(q, selected);
  return `<section class="feedback ${correct ? 'correct' : 'incorrect'}" aria-label="Kết quả câu trả lời"><h3>${icon(correct ? 'check' : 'cross')}${correct ? 'Chính xác' : selected.length ? 'Chưa chính xác' : 'Bạn đã bỏ trống câu này'}</h3><p class="correct-answer">Đáp án đúng: <strong>${e(q.correctOptionIds.join(', '))}</strong></p><div class="explanation">${e(q.explanation || 'Nguồn chưa có giải thích cho câu này.')}</div>${q.issues?.length ? `<details class="source-issues"><summary>Chú thích từ tài liệu</summary><p>${q.issues.map(e).join('<br>')}</p></details>` : ''}</section>`;
}

export function sessionView(state, s) {
  const { bank } = state;
  if (s.submittedAt) return resultView(state, s);
  const q = bank.questions.get(s.questionIds[s.cursor]);
  const selected = s.answers[q.id] || [];
  const checked = Boolean(s.checkedAt[q.id]);
  const multi = q.correctOptionIds.length > 1;
  const answered = s.mode === 'exam' ? Object.values(s.answers).filter(a => a.length).length : Object.keys(s.checkedAt).length;
  const title = s.examId === 'wrong' ? 'Ôn lại câu sai' : examTitle(bank.exams.get(s.examId));
  return `<div class="session-top"><button class="text-button muted" data-action="leave">${icon('back')}Lưu và về danh sách</button><div class="session-mode">${s.mode === 'exam' ? 'Thi thử' : s.mode === 'review' ? 'Ôn câu sai' : 'Luyện tập'}${s.mode === 'exam' ? `<span class="timer ${remainingMs(s) < 300000 ? 'urgent' : ''}" id="timer" aria-label="Thời gian còn lại">${icon('time')}<span>${clock(remainingMs(s))}</span></span>` : '<span>Không giới hạn thời gian</span>'}</div></div>
    <div class="session-heading"><h1>${e(title)}</h1><p>${e(s.subjectId)} <span class="separator">·</span> ${s.questionIds.length} câu${s.mode === 'exam' ? ' · Đáp án hiện sau khi nộp bài' : ' · Kiểm tra sau mỗi câu'}</p></div>
    <div class="session-layout"><section class="question-panel" aria-labelledby="question-title"><div class="question-topline"><span>Câu ${s.cursor + 1} / ${s.questionIds.length}</span><span class="question-type">${multi ? `Chọn ${q.correctOptionIds.length} đáp án` : 'Chọn một đáp án'}</span></div><h2 id="question-title" class="question-prompt">${e(q.prompt)}</h2>${questionImage(q)}
    <fieldset class="answer-options"><legend class="sr-only">${multi ? 'Chọn các đáp án đúng' : 'Chọn đáp án đúng'}</legend>${q.options.map(o => {
      const right = checked && q.correctOptionIds.includes(o.id);
      const wrong = checked && selected.includes(o.id) && !right;
      return `<label class="answer-option ${selected.includes(o.id) ? 'chosen' : ''} ${right ? 'is-correct' : ''} ${wrong ? 'is-wrong' : ''}" for="option-${o.id}"><input id="option-${o.id}" type="${multi ? 'checkbox' : 'radio'}" name="answer" value="${o.id}" ${selected.includes(o.id) ? 'checked' : ''} ${checked ? 'disabled' : ''} /><span class="option-letter">${e(o.id)}</span><span class="option-text">${e(o.text)}</span>${right ? `<span class="answer-mark">${icon('check')}<span class="sr-only">Đáp án đúng</span></span>` : wrong ? `<span class="answer-mark">${icon('cross')}<span class="sr-only">Đáp án sai</span></span>` : ''}</label>`;
    }).join('')}</fieldset>${checked ? feedback(q, selected) : ''}<div class="question-actions"><button class="button secondary" data-action="previous" ${s.cursor === 0 ? 'disabled' : ''}>${icon('back')}Câu trước</button>${s.mode !== 'exam' && !checked ? `<button class="button primary" data-action="check" ${selected.length ? '' : 'disabled'}>Kiểm tra${icon('check')}</button>` : `<button class="button primary" data-action="next">${s.cursor === s.questionIds.length - 1 ? 'Kết thúc bài' : 'Câu tiếp theo'}${icon('arrow')}</button>`}</div><p class="source-reference">Câu ${q.number} trong đề gốc${q.source?.page ? ` · Trang ${q.source.page}` : ''}</p></section>
    <aside class="session-aside"><section class="question-map"><h2>Tiến độ bài làm</h2><p>${answered}/${s.questionIds.length} câu đã ${s.mode === 'exam' ? 'trả lời' : 'kiểm tra'}</p><progress value="${answered}" max="${s.questionIds.length}" aria-label="Tiến độ bài làm"></progress><div class="question-grid" role="group" aria-label="Chuyển đến câu hỏi">${s.questionIds.map((id, i) => {
      const q2 = bank.questions.get(id);
      const evaluated = s.mode !== 'exam' && s.checkedAt[id];
      const cls = evaluated ? (isCorrect(q2, s.answers[id]) ? 'correct' : 'incorrect') : s.answers[id]?.length ? 'answered' : '';
      return `<button class="question-index ${cls} ${i === s.cursor ? 'current' : ''}" data-action="jump" data-id="${i}" aria-label="Câu ${i + 1}${evaluated ? (cls === 'correct' ? ', đã trả lời đúng' : ', đã trả lời sai') : s.answers[id]?.length ? ', đã chọn đáp án' : ', chưa trả lời'}" ${i === s.cursor ? 'aria-current="step"' : ''}>${i + 1}</button>`;
    }).join('')}</div><div class="map-key"><span><i class="key-dot filled"></i>${s.mode === 'exam' ? 'Đã trả lời' : 'Đã kiểm tra'}</span><span><i class="key-dot"></i>Chưa làm</span></div><button class="button secondary full" data-action="finish">${s.mode === 'exam' ? 'Nộp bài thi' : 'Kết thúc bài luyện'}</button></section><p class="small-note">${s.mode === 'exam' ? 'Thời gian vẫn chạy khi bạn rời trang. Hết 50 phút, bài được tự động nộp.' : 'Tiến độ được lưu sau mỗi thao tác. Bạn có thể quay lại bất cứ lúc nào.'}</p></aside></div>`;
}

export function resultView(state, s) {
  const { bank } = state;
  const result = score(s, bank);
  const title = s.examId === 'wrong' ? 'Ôn lại câu sai' : examTitle(bank.exams.get(s.examId));
  const wrongIds = s.questionIds.filter(id => !isCorrect(bank.questions.get(id), s.answers[id]));
  return `<button class="text-button muted back-to-list" data-action="leave">${icon('back')}Về danh sách đề</button><section class="result-summary"><div><h1>Đã hoàn thành bài ${s.mode === 'exam' ? 'thi thử' : 'luyện'}.</h1><p>${e(s.subjectId)} · ${e(title)}</p><div class="result-actions">${wrongIds.length ? `<button class="button primary" data-action="retry-wrong" data-id="${e(s.id)}">Ôn lại ${wrongIds.length} câu sai${icon('arrow')}</button>` : '<button class="button primary" data-action="leave">Chọn bộ đề tiếp theo</button>'}<button class="button secondary" data-action="restart" data-id="${e(s.id)}">${icon('refresh')}Làm lại bài này</button></div></div><div class="result-score"><strong>${result.points}<span>/10</span></strong><p>${result.correct}/${result.total} câu đúng · ${result.percent}%</p><p class="small-note">${result.wrong} câu sai · ${result.skipped} câu bỏ trống</p></div></section><section class="result-review"><div class="section-heading"><h2>Xem lại từng câu</h2><label class="toggle-label"><input id="only-wrong" type="checkbox" ${state.onlyWrong ? 'checked' : ''} /> Chỉ xem câu sai</label></div>${s.questionIds.map((id, i) => {
    const q = bank.questions.get(id); const selected = s.answers[id] || []; const correct = isCorrect(q, selected);
    if (state.onlyWrong && correct) return '';
    return `<details class="review-question"><summary><span class="review-status ${correct ? 'correct' : 'incorrect'}">${icon(correct ? 'check' : 'cross')}</span><span><strong>Câu ${i + 1}</strong><span class="review-preview">${e(q.prompt)}</span></span></summary><div class="review-content"><p class="question-prompt">${e(q.prompt)}</p>${questionImage(q)}<ul class="review-options">${q.options.map(o => `<li><strong>${e(o.id)}.</strong> ${e(o.text)}${selected.includes(o.id) ? ' <span class="your-choice">Bạn chọn</span>' : ''}</li>`).join('')}</ul>${feedback(q, selected)}</div></details>`;
  }).join('') || '<div class="empty compact"><h3>Bạn đã trả lời đúng tất cả các câu.</h3></div>'}</section>`;
}

export function excludedView(state, examId) {
  const exam = state.bank.exams.get(examId);
  const list = exam.questions.filter(q => q.status === 'excluded');
  return `<button class="text-button muted back-to-list" data-action="nav" data-id="library">${icon('back')}Về danh sách đề</button><div class="page-heading"><div><h1>Câu tạm loại khỏi chấm điểm</h1><p>${e(examTitle(exam))} · Giữ lại để đối chiếu, không đưa vào luyện hoặc thi thử.</p></div></div>${list.map(q => `<article class="excluded-question"><h2>Câu ${q.number} trong đề gốc</h2><p class="question-prompt">${e(q.prompt)}</p>${questionImage(q)}<p class="source-warning">${q.issues?.map(e).join('<br>') || 'Nội dung nguồn chưa đủ để chấm điểm.'}</p><details><summary>Xem đáp án và giải thích trong nguồn</summary><p>Đáp án nguồn: ${e(q.correctOptionIds.join(', '))}</p><p class="explanation">${e(q.explanation)}</p></details></article>`).join('')}`;
}
