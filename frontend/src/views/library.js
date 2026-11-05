import { eligibleQuestions } from '../core/bank.js';
import { score } from '../core/study.js';
import { escape as e, icon, date } from '../lib/html.js';

export function examTitle(exam) {
  return exam.title || exam.id.replace(/^SSG104_|^SWT301_FE_/, '').replace(/_/g, ' ');
}

export function subjectTabs(bank, active) {
  return `<div class="subject-tabs" role="group" aria-label="Chọn môn học">${bank.subjects.map(s => `<button class="subject-tab ${s.id === active ? 'selected' : ''}" data-action="subject" data-id="${e(s.id)}" aria-pressed="${s.id === active}"><strong>${e(s.id)}</strong><span>${s.exams.length} bộ đề</span></button>`).join('')}</div>`;
}

export function examRows(bank, subjectId, sessions, search = '') {
  const exams = bank.subjects.find(s => s.id === subjectId).exams.filter(x => `${x.id} ${examTitle(x)}`.toLowerCase().includes(search.toLowerCase().trim()));
  if (!exams.length) return `<div class="empty compact"><h3>Chưa tìm thấy đề này</h3><p>Thử mã đề hoặc mùa thi khác, ví dụ SP26.</p></div>`;
  return exams.map(exam => {
    const ready = eligibleQuestions(exam).length;
    const history = sessions.filter(s => s.examId === exam.id && s.submittedAt && s.mode !== 'review');
    const best = history.length ? Math.max(...history.map(s => score(s, bank).percent)) : null;
    const excluded = exam.questions.length - ready;
    return `<article class="exam-row"><div class="exam-row-main"><h3>${e(examTitle(exam))}</h3><p>${ready} câu${excluded ? ` <span class="separator">·</span> <button class="text-button source-note" data-action="excluded" data-id="${e(exam.id)}">${excluded} câu tạm loại</button>` : ''}</p></div><div class="exam-progress">${best === null ? '<span class="muted">Chưa làm</span>' : `<strong>${best}%</strong><span>${history.length} lần hoàn thành</span>`}</div><div class="row-actions"><button class="button secondary small" data-action="start-exam" data-id="${e(exam.id)}" ${ready ? '' : 'disabled'}>${icon('time')}<span>Thi thử</span></button><button class="button primary small" data-action="start-practice" data-id="${e(exam.id)}" ${ready ? '' : 'disabled'}>Luyện tập${icon('arrow')}</button></div></article>`;
  }).join('');
}

export function library(state) {
  const { bank, subjectId, sessions, latest, search } = state;
  const subject = bank.subjects.find(s => s.id === subjectId);
  const ready = subject.exams.flatMap(eligibleQuestions).length;
  const responses = [...latest].filter(([id]) => bank.questions.get(id).subjectId === subjectId);
  const wrong = responses.filter(([, r]) => !r.correct).length;
  const unfinished = sessions.find(s => s.subjectId === subjectId && !s.submittedAt);
  return `<div class="page-heading"><div><h1>Học chắc từng câu.</h1><p>Chọn một bộ đề, luyện tập và quay lại những câu còn sai.</p></div><div class="exam-date">${icon('time')}<span>Lịch thi của bạn<strong>19–20 tháng 11</strong></span></div></div>
    ${subjectTabs(bank, subjectId)}
    <div class="library-layout"><section aria-labelledby="exam-list-title"><div class="section-heading"><div><h2 id="exam-list-title">Bộ đề ${e(subjectId)}</h2><p>${subject.exams.length} bộ đề <span class="separator">·</span> ${ready} câu có thể luyện</p></div><label class="search">${icon('search')}<input id="exam-search" type="search" placeholder="Tìm mã đề…" aria-label="Tìm bộ đề" value="${e(search)}" /></label></div><div class="exam-list" id="exam-rows">${examRows(bank, subjectId, sessions, search)}</div></section>
    <aside class="home-aside ${unfinished ? 'has-resume' : ''}"><section class="resume-panel"><div class="panel-symbol">${icon('book')}</div><h2>${unfinished ? 'Tiếp tục từ lần trước' : 'Bắt đầu một buổi ôn'}</h2>${unfinished ? `<p>${unfinished.mode === 'exam' ? 'Thi thử' : unfinished.mode === 'review' ? 'Ôn câu sai' : 'Luyện tập'} · ${e(unfinished.examId === 'wrong' ? subjectId : examTitle(bank.exams.get(unfinished.examId)))}</p><p class="resume-detail">${unfinished.mode === 'exam' ? Object.keys(unfinished.answers).filter(id => unfinished.answers[id].length).length : Object.keys(unfinished.checkedAt).length}/${unfinished.questionIds.length} câu đã ${unfinished.mode === 'exam' ? 'trả lời' : 'kiểm tra'}</p><button class="button primary full" data-action="resume" data-id="${e(unfinished.id)}">Tiếp tục học${icon('arrow')}</button>` : `<p>Mỗi câu được kiểm tra ngay sau khi trả lời. Đi theo nhịp học của bạn.</p><button class="button primary full" data-action="start-practice" data-id="${e(subject.exams[0].id)}">Luyện đề đầu tiên${icon('arrow')}</button>`}</section>
    <section class="study-summary"><h2>Tiến độ môn này</h2><dl><div><dt>Câu đã ôn</dt><dd>${responses.length}<span> / ${ready}</span></dd></div><div><dt>Câu cần ôn lại</dt><dd>${wrong}</dd></div></dl><progress value="${responses.length}" max="${ready || 1}" aria-label="${responses.length} trên ${ready} câu đã ôn"></progress>${wrong ? `<button class="text-button" data-action="nav" data-id="wrong">Học lại câu sai${icon('arrow')}</button>` : `<p class="small-note">Tiến độ sẽ cập nhật khi bạn kiểm tra câu trả lời.</p>`}</section>
    <section class="quiet-note"><h3>Trả lời trước, xem giải thích sau.</h3><p>Khi luyện lại, bạn có thể đảo thứ tự câu để kiểm tra mức độ nhớ bài.</p><label class="toggle-label"><input type="checkbox" id="shuffle" ${state.shuffle ? 'checked' : ''} /> Đảo thứ tự khi luyện</label></section></aside></div>`;
}

export function wrongView(state) {
  const { bank, subjectId, latest } = state;
  const wrong = [...latest].filter(([id, r]) => !r.correct && bank.questions.get(id).subjectId === subjectId);
  const examGroups = new Map();
  for (const [id] of wrong) {
    const q = bank.questions.get(id);
    examGroups.set(q.examId, (examGroups.get(q.examId) || 0) + 1);
  }
  return `<div class="page-heading"><div><h1>Học lại câu sai</h1><p>Câu trả lời đúng ở lần ôn sau sẽ tự rời khỏi danh sách này.</p></div>${wrong.length ? `<button class="button primary" data-action="review-wrong">Ôn ${wrong.length} câu${icon('arrow')}</button>` : ''}</div>${subjectTabs(bank, subjectId)}${wrong.length ? `<section class="simple-panel"><div class="section-heading"><h2>${wrong.length} câu cần ôn</h2></div>${[...examGroups].map(([id, count]) => `<article class="exam-row"><div class="exam-row-main"><h3>${e(examTitle(bank.exams.get(id)))}</h3><p>${count} câu trả lời sai hoặc bỏ trống</p></div><button class="button secondary small" data-action="review-wrong" data-id="${e(id)}">Luyện lại${icon('arrow')}</button></article>`).join('')}</section>` : `<section class="empty">${icon('check')}<h2>Chưa có câu cần ôn lại</h2><p>Luyện một bộ đề trước. Những câu trả lời sai sẽ được lưu ở đây.</p><button class="button primary" data-action="nav" data-id="library">Chọn bộ đề${icon('arrow')}</button></section>`}`;
}

export function historyView(state) {
  const { bank, sessions, subjectId } = state;
  const list = sessions.filter(s => s.subjectId === subjectId);
  return `<div class="page-heading"><div><h1>Lịch sử học</h1><p>Nhìn lại kết quả hoặc tiếp tục bài đang làm.</p></div><button class="button secondary" data-action="export">Tải bản sao tiến độ</button></div>${subjectTabs(bank, subjectId)}${list.length ? `<div class="history-list">${list.map(s => {
    const result = score(s, bank);
    const name = s.examId === 'wrong' ? 'Ôn câu sai' : examTitle(bank.exams.get(s.examId));
    return `<article class="exam-row"><div class="exam-row-main"><h3>${e(name)}</h3><p>${s.mode === 'exam' ? 'Thi thử' : s.mode === 'review' ? 'Ôn câu sai' : 'Luyện tập'} <span class="separator">·</span> ${date(s.startedAt)} <span class="separator">·</span> ${result.total} câu</p></div><div class="exam-progress">${s.submittedAt ? `<strong>${result.correct}/${result.total}</strong><span>${result.points} điểm</span>` : '<span class="status-pill">Đang làm</span>'}</div><button class="button secondary small" data-action="resume" data-id="${e(s.id)}">${s.submittedAt ? 'Xem kết quả' : 'Tiếp tục'}${icon('arrow')}</button></article>`;
  }).join('')}</div>` : '<section class="empty"><h2>Buổi học đầu tiên đang chờ bạn</h2><p>Chọn một bộ đề và bắt đầu luyện tập để lưu kết quả.</p><button class="button primary" data-action="nav" data-id="library">Chọn bộ đề</button></section>'}`;
}
