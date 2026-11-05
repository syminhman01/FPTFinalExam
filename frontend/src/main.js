import './styles.css';
import { readBank, eligibleQuestions, shuffled } from './core/bank.js';
import { mergeEvents, replay, latestResponses, score, isCorrect, remainingMs } from './core/study.js';
import { createCloud, exchangeEvents } from './lib/cloud.js';
import { loadEvents, saveEvents, downloadProgress } from './lib/storage.js';
import { escape as e, icon, clock } from './lib/html.js';
import { library, examRows, wrongView, historyView, examTitle } from './views/library.js';
import { sessionView, excludedView } from './views/session.js';

const app = document.querySelector('#app');
const toastNode = document.querySelector('#toast');
const dialog = document.querySelector('#confirm-dialog');
const cloud = createCloud(__SUPABASE_URL__, __SUPABASE_ANON_KEY__);
const state = { bank: null, events: [], sessions: [], latest: new Map(), owner: 'guest', user: null, subjectId: 'SSG104', nav: 'library', sessionId: null, excludedId: null, search: '', shuffle: false, onlyWrong: false, sync: 'local', localError: false, guestCount: 0 };
let toastTimer, syncTimer, syncing = false, syncAgain = false, authGeneration = 0;
let lastTimestamp = 0;

function notify(message) {
  toastNode.textContent = message;
  toastNode.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastNode.classList.remove('visible'), 5500);
}

function confirmAction(title, body, label, callback) {
  document.querySelector('#dialog-content').innerHTML = `<h2 id="dialog-title">${e(title)}</h2><p>${e(body)}</p><div class="dialog-actions"><button class="button secondary" id="dialog-cancel">Quay lại</button><button class="button primary" id="dialog-confirm">${e(label)}</button></div>`;
  document.querySelector('#dialog-cancel').onclick = () => dialog.close();
  document.querySelector('#dialog-confirm').onclick = () => { dialog.close(); callback(); };
  dialog.showModal();
}

function refreshModel() {
  lastTimestamp = Math.max(lastTimestamp, ...state.events.slice(-1).map(event => Date.parse(event.at)));
  state.sessions = replay(state.events, state.bank);
  state.latest = latestResponses(state.sessions, state.bank);
}

function persist() {
  try {
    if (!state.storageCorrupt) state.events = mergeEvents(state.events, loadEvents(state.owner));
    saveEvents(state.owner, state.events);
    state.localError = false;
  } catch {
    state.localError = true;
    notify('Trình duyệt chưa lưu được tiến độ. Giữ trang đang mở và tải bản sao trong Lịch sử.');
  }
}

function emit(kind, sessionId, data = {}, at) {
  if (state.storageCorrupt) { notify('Dữ liệu cũ cần được khôi phục trước khi lưu bài mới.'); return; }
  const timestamp = at ? Date.parse(at) : Math.max(Date.now(), lastTimestamp + 1);
  lastTimestamp = Math.max(lastTimestamp, timestamp);
  state.events = mergeEvents(state.events, [{ id: crypto.randomUUID(), sessionId, kind, at: new Date(timestamp).toISOString(), data }]);
  persist();
  refreshModel();
  scheduleSync();
}

function currentSession() { return state.sessions.find(s => s.id === state.sessionId); }

function shell(content) {
  const wrongCount = [...state.latest.values()].filter(r => !r.correct).length;
  const name = state.user?.user_metadata?.full_name || state.user?.email?.split('@')[0] || 'Tài khoản';
  const syncText = state.localError ? 'Chưa lưu được trên máy' : !state.user ? 'Tiến độ lưu trên thiết bị này' : state.sync === 'syncing' ? 'Đang đồng bộ…' : state.sync === 'error' ? 'Chưa đồng bộ · Thử lại' : state.sync === 'offline' ? 'Ngoại tuyến · Đã lưu trên máy' : 'Đã đồng bộ';
  return `<header class="site-header"><div class="header-inner"><a href="#" class="brand" data-action="nav" data-id="library" aria-label="FE Study, về danh sách đề"><span class="brand-symbol">${icon('book')}</span><span>FE <strong>Study</strong></span></a><nav aria-label="Điều hướng chính">${[['library', 'Luyện đề'], ['wrong', `Câu sai${wrongCount ? ` <span class="nav-count">${wrongCount}</span>` : ''}`], ['history', 'Lịch sử']].map(([id, label]) => `<button class="nav-link ${state.nav === id ? 'active' : ''}" data-action="nav" data-id="${id}" ${state.nav === id ? 'aria-current="page"' : ''}>${label}</button>`).join('')}</nav><div class="account">${state.user ? `<span class="account-name" title="${e(name)}">${e(name)}</span><button class="text-button muted sign-out" data-action="logout">Đăng xuất</button>` : `<button class="button secondary google-login" data-action="login"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.4c2-1.8 2.8-4.4 2.8-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.8-2.4l-3.4-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3a10 10 0 0 0 0 9.2l3.4-2.7Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7C7.2 7.8 9.4 6 12 6Z"/></svg><span>Đăng nhập Google</span></button>`}</div></div></header>
    <div class="save-bar"><span>${icon(state.user ? 'cloud' : 'check')}<button class="text-button ${state.sync === 'error' || state.localError ? 'save-error' : ''}" data-action="sync" ${state.user ? '' : 'disabled'}>${e(syncText)}</button></span>${!state.user ? '<span class="save-hint">Đăng nhập để học tiếp trên thiết bị khác</span>' : ''}</div>
    ${state.user && state.guestCount ? `<div class="merge-banner"><span>Có ${state.guestCount} buổi học trên thiết bị này chưa thuộc tài khoản của bạn.</span><button class="text-button" data-action="merge-guest">Gộp vào tài khoản</button></div>` : ''}
    ${state.storageCorrupt ? '<div class="error-banner"><p>Dữ liệu cũ trên máy không đọc được. Tải bản sao trước khi khôi phục để tránh mất tiến độ.</p><button class="button secondary small" data-action="export">Tải bản sao dữ liệu cũ</button><button class="text-button" data-action="reset-corrupt">Khôi phục bộ nhớ học</button></div>' : ''}
    <main id="main" class="main ${state.sessionId ? 'study-main' : ''}">${content}</main><footer class="site-footer"><span>FE Study</span><span>Ôn theo đề nguồn · Học theo nhịp của bạn</span></footer>`;
}

function render({ focus, scroll = false } = {}) {
  if (!state.bank) return;
  const session = currentSession();
  let content = state.excludedId ? excludedView(state, state.excludedId) : session ? sessionView(state, session) : state.nav === 'wrong' ? wrongView(state) : state.nav === 'history' ? historyView(state) : library(state);
  app.innerHTML = shell(content);
  document.title = session ? `${session.submittedAt ? 'Kết quả' : 'Câu ' + (session.cursor + 1)} — FE Study` : `${state.nav === 'wrong' ? 'Câu sai' : state.nav === 'history' ? 'Lịch sử' : 'Luyện đề'} — FE Study`;
  if (focus) document.getElementById(focus)?.focus({ preventScroll: true });
  if (scroll) {
    const heading = document.querySelector('.question-prompt, main h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function openLibrary(nav = 'library') {
  state.nav = nav; state.sessionId = null; state.excludedId = null; state.onlyWrong = false;
  render({ scroll: true });
}

function startSession(examId, mode, ids) {
  const exam = state.bank.exams.get(examId);
  let questionIds = ids || eligibleQuestions(exam).map(q => q.id);
  if (state.shuffle && mode !== 'exam') questionIds = shuffled(questionIds);
  if (!questionIds.length) return notify('Hiện chưa có câu phù hợp để luyện.');
  const sessionId = crypto.randomUUID();
  emit('start', sessionId, { subjectId: exam?.subjectId || state.subjectId, examId, mode, questionIds });
  state.sessionId = sessionId; state.excludedId = null; state.onlyWrong = false;
  render({ scroll: true });
}

function finishSession() {
  const s = currentSession();
  if (!s || s.submittedAt) return;
  const answered = s.mode === 'exam' ? Object.values(s.answers).filter(a => a.length).length : Object.keys(s.checkedAt).length;
  confirmAction(s.mode === 'exam' ? 'Nộp bài thi?' : 'Kết thúc bài luyện?', `Bạn đã ${s.mode === 'exam' ? 'trả lời' : 'kiểm tra'} ${answered}/${s.questionIds.length} câu. Các câu còn lại sẽ được tính là chưa đúng.`, s.mode === 'exam' ? 'Nộp bài' : 'Xem kết quả', () => { emit('submit', s.id); render({ scroll: true }); });
}

function expireExams() {
  if (!state.bank || state.storageCorrupt) return;
  const expired = state.sessions.filter(s => s.mode === 'exam' && !s.submittedAt && remainingMs(s) === 0);
  for (const s of expired) emit('submit', s.id, {}, new Date(s.deadline).toISOString());
  if (expired.length) {
    dialog.close(); render();
    notify('Đã hết 50 phút. Bài thi được tự động nộp và lưu kết quả.');
  }
  const s = currentSession();
  const timer = document.querySelector('#timer');
  if (timer && s) {
    timer.querySelector('span').textContent = clock(remainingMs(s));
    timer.classList.toggle('urgent', remainingMs(s) < 300000);
  }
}

function scheduleSync() {
  if (!cloud || !state.user) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, 1400);
}

async function syncNow() {
  if (!cloud || !state.user || state.storageCorrupt) return;
  if (!navigator.onLine) { state.sync = 'offline'; render(); return; }
  if (syncing) { syncAgain = true; return; }
  syncing = true;
  const generation = authGeneration;
  const userId = state.user.id;
  const previousSync = state.sync;
  state.sync = 'syncing';
  updateSaveLabel();
  try {
    const beforeIds = new Set(state.events.map(event => event.id));
    const result = await exchangeEvents(cloud, userId, state.events);
    if (generation !== authGeneration) return;
    state.events = mergeEvents(state.events, result);
    persist(); refreshModel(); state.sync = 'ok';
    expireExams();
    // Do not replace an active answer or search field just because a heartbeat ran.
    if (state.sessionId && result.some(event => !beforeIds.has(event.id))) render({ focus: document.activeElement?.id });
    else if (state.sessionId || document.activeElement?.id === 'exam-search') updateSaveLabel();
    else render();
  } catch {
    if (generation === authGeneration) { state.sync = 'error'; updateSaveLabel(); if (previousSync !== 'error') notify('Chưa đồng bộ được. Tiến độ vẫn được giữ trên máy; bấm trạng thái lưu để thử lại.'); }
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; scheduleSync(); }
  }
}

function updateSaveLabel() {
  const node = document.querySelector('[data-action="sync"]');
  if (node) { node.textContent = state.localError ? 'Chưa lưu được trên máy' : state.sync === 'syncing' ? 'Đang đồng bộ…' : state.sync === 'error' ? 'Chưa đồng bộ · Thử lại' : state.sync === 'offline' ? 'Ngoại tuyến · Đã lưu trên máy' : state.user ? 'Đã đồng bộ' : 'Tiến độ lưu trên thiết bị này'; node.classList.toggle('save-error', state.sync === 'error' || state.localError); }
}

async function activateUser(user) {
  const owner = user?.id || 'guest';
  if (state.owner === owner && state.user?.id === user?.id) { if (user) scheduleSync(); return; }
  authGeneration++; clearTimeout(syncTimer);
  state.owner = owner; state.user = user; state.sessionId = null; state.excludedId = null; state.storageCorrupt = false;
  state.sync = user ? 'syncing' : 'local';
  try { state.events = loadEvents(owner); } catch { state.events = []; state.storageCorrupt = true; }
  try { const ownedIds = new Set(state.events.map(event => event.id)); state.guestCount = user ? replay(loadEvents('guest').filter(event => !ownedIds.has(event.id)), state.bank).length : 0; } catch { state.guestCount = 0; }
  refreshModel(); expireExams(); render();
  if (user) await syncNow();
}

async function login() {
  if (!cloud) return notify('Đồng bộ chưa được bật cho website này. Bạn vẫn có thể luyện đề và lưu trên thiết bị.');
  const button = document.querySelector('[data-action="login"]');
  if (button) { button.disabled = true; button.textContent = 'Đang mở Google…'; }
  try {
    const { error } = await cloud.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/', queryParams: { prompt: 'select_account' } } });
    if (error) throw error;
  } catch { notify('Chưa mở được đăng nhập Google. Kiểm tra kết nối rồi thử lại.'); render(); }
}

app.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  event.preventDefault();
  const { action, id } = button.dataset;
  const s = currentSession();
  if (action === 'nav') return openLibrary(id);
  if (action === 'subject') { state.subjectId = id; state.search = ''; return render(); }
  if (action === 'start-practice') return startSession(id, 'practice');
  if (action === 'start-exam') {
    const count = eligibleQuestions(state.bank.exams.get(id)).length;
    return confirmAction('Sẵn sàng thi thử?', `${count} câu trong 50 phút. Đồng hồ chạy liên tục; đáp án chỉ hiện sau khi nộp hoặc hết giờ.`, 'Bắt đầu 50 phút', () => startSession(id, 'exam'));
  }
  if (action === 'resume') { state.sessionId = id; state.onlyWrong = false; expireExams(); return render({ scroll: true }); }
  if (action === 'leave') return openLibrary();
  if (action === 'excluded') { state.excludedId = id; return render({ scroll: true }); }
  if (action === 'check' && s) {
    const questionId = s.questionIds[s.cursor];
    if (!s.answers[questionId]?.length || s.mode === 'exam') return;
    emit('check', s.id, { questionId });
    render();
    document.querySelector('.feedback')?.setAttribute('tabindex', '-1');
    document.querySelector('.feedback')?.focus({ preventScroll: false });
    return;
  }
  if (['next', 'previous', 'jump'].includes(action) && s) {
    const cursor = action === 'jump' ? Number(id) : s.cursor + (action === 'next' ? 1 : -1);
    if (cursor >= s.questionIds.length) return finishSession();
    emit('move', s.id, { cursor: Math.max(0, cursor) }); return render({ scroll: true });
  }
  if (action === 'finish') return finishSession();
  if (action === 'review-wrong') {
    const ids = [...state.latest].filter(([qid, r]) => !r.correct && state.bank.questions.get(qid).subjectId === state.subjectId && (!id || state.bank.questions.get(qid).examId === id)).map(([qid]) => qid);
    return startSession(id || 'wrong', 'review', ids);
  }
  if (action === 'retry-wrong') {
    const old = state.sessions.find(x => x.id === id);
    return startSession(old.examId, 'review', old.questionIds.filter(qid => !isCorrect(state.bank.questions.get(qid), old.answers[qid])));
  }
  if (action === 'restart') { const old = state.sessions.find(x => x.id === id); return startSession(old.examId, old.mode, old.questionIds); }
  if (action === 'login') return login();
  if (action === 'logout') {
    const { error } = await cloud.auth.signOut({ scope: 'local' });
    if (error) return notify('Chưa đăng xuất được. Hãy thử lại.');
    return activateUser(null);
  }
  if (action === 'sync') return syncNow();
  if (action === 'merge-guest') {
    return confirmAction('Gộp tiến độ trên thiết bị?', 'Các buổi học chưa đăng nhập trên thiết bị này sẽ được sao chép vào tài khoản Google hiện tại.', 'Gộp tiến độ', () => {
      try { state.events = mergeEvents(state.events, loadEvents('guest')); persist(); refreshModel(); state.guestCount = 0; scheduleSync(); render(); } catch { notify('Không đọc được tiến độ cũ trên thiết bị.'); }
    });
  }
  if (action === 'export') {
    if (state.localError) {
      const memoryStorage = { getItem: () => JSON.stringify(state.events) }; downloadProgress(state.owner, memoryStorage);
    } else downloadProgress(state.owner);
  }
  if (action === 'reset-corrupt') return confirmAction('Khôi phục bộ nhớ học?', 'Chỉ thực hiện sau khi bạn đã tải bản sao. Dữ liệu học cục bộ không đọc được sẽ được thay bằng bộ nhớ trống.', 'Khôi phục', () => {
    try {
      // Replace only this owner's confirmed-corrupt value, without reading/merging it.
      saveEvents(state.owner, []);
    } catch {
      notify('Chưa khôi phục được bộ nhớ học. Dữ liệu cũ vẫn được giữ; hãy tải bản sao và thử lại.');
      return;
    }
    state.events = [];
    state.storageCorrupt = false;
    state.localError = false;
    refreshModel(); render(); scheduleSync();
  });
});

app.addEventListener('change', event => {
  const input = event.target;
  if (input.id === 'shuffle') { state.shuffle = input.checked; return; }
  if (input.id === 'only-wrong') { state.onlyWrong = input.checked; return render({ focus: 'only-wrong' }); }
  if (input.name !== 'answer') return;
  expireExams();
  const s = currentSession();
  if (!s || s.submittedAt) return;
  const q = state.bank.questions.get(s.questionIds[s.cursor]);
  if (s.checkedAt[q.id]) return;
  const optionIds = [...document.querySelectorAll('input[name="answer"]:checked')].map(x => x.value);
  emit('answer', s.id, { questionId: q.id, optionIds });
  render({ focus: input.id });
});

app.addEventListener('input', event => {
  if (event.target.id !== 'exam-search') return;
  state.search = event.target.value;
  document.querySelector('#exam-rows').innerHTML = examRows(state.bank, state.subjectId, state.sessions, state.search);
});

window.addEventListener('online', () => { scheduleSync(); updateSaveLabel(); });
window.addEventListener('offline', () => { state.sync = 'offline'; updateSaveLabel(); });
window.addEventListener('focus', () => { expireExams(); scheduleSync(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { expireExams(); scheduleSync(); } });
window.addEventListener('storage', event => {
  if (event.key !== `fe-study:v1:${state.owner}` || state.storageCorrupt) return;
  try { state.events = mergeEvents(state.events, loadEvents(state.owner)); refreshModel(); render(); } catch { notify('Chưa đọc được tiến độ từ thẻ trình duyệt khác.'); }
});

async function boot() {
  try {
    const response = await fetch('/data/question-bank.json');
    if (!response.ok) throw new Error('Không tải được bộ đề.');
    state.bank = readBank(await response.json());
    state.subjectId = state.bank.subjects[0].id;
    try { state.events = loadEvents('guest'); } catch { state.storageCorrupt = true; }
    refreshModel(); expireExams(); render();
    if (cloud) {
      cloud.auth.onAuthStateChange((_event, session) => { setTimeout(() => activateUser(session?.user || null), 0); });
      const { data, error } = await cloud.auth.getSession();
      if (error) notify('Phiên đăng nhập chưa sẵn sàng. Bạn vẫn có thể học trên thiết bị.');
      else await activateUser(data.session?.user || null);
    }
    const params = new URLSearchParams(location.search);
    if (params.has('error')) { notify('Đăng nhập Google chưa hoàn tất. Bạn có thể thử lại.'); history.replaceState(null, '', '/'); }
    setInterval(expireExams, 1000);
    setInterval(() => { if (!document.hidden && state.user) syncNow(); }, 30000);
  } catch (error) {
    app.innerHTML = `<main id="main" class="loading-shell"><h1>Chưa mở được bộ đề</h1><p>${e(error.message)}</p><p>Kiểm tra kết nối rồi tải lại trang. Tiến độ đã lưu trên máy được giữ nguyên.</p><button class="button primary" id="reload-page">Tải lại trang</button></main>`;
    document.querySelector('#reload-page').onclick = () => location.reload();
  }
}
boot();
