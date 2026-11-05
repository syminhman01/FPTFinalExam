import { validEvent, mergeEvents } from '../core/study.js';
const prefix = 'fe-study:v1:';

export function loadEvents(owner, storage = localStorage) {
  const raw = storage.getItem(prefix + owner);
  if (!raw) return [];
  let events;
  try { events = JSON.parse(raw); } catch { throw new Error('Dữ liệu học trên máy không đọc được. Hãy tải bản sao trước khi khôi phục.'); }
  if (!Array.isArray(events) || events.some(e => !validEvent(e))) throw new Error('Dữ liệu học trên máy không đúng định dạng. Hãy tải bản sao trước khi khôi phục.');
  return mergeEvents(events);
}

export function saveEvents(owner, events, storage = localStorage) {
  storage.setItem(prefix + owner, JSON.stringify(events));
}

export function downloadProgress(owner, storage = localStorage) {
  const raw = storage.getItem(prefix + owner) || '[]';
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `fe-study-progress-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
