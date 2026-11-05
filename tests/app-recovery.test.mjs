import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { build } from 'esbuild';

let application;
const bank = JSON.parse(await readFile('frontend/public/data/question-bank.json', 'utf8'));

before(async () => {
  const bundle = await build({ entryPoints: ['frontend/src/main.js'], bundle: true, write: false, format: 'iife', platform: 'browser', loader: { '.css': 'empty' }, define: { __SUPABASE_URL__: '""', __SUPABASE_ANON_KEY__: '""' } });
  application = bundle.outputFiles[0].text;
});

// A minimal browser boundary runs the actual app and its confirmation handler.
// Storage is isolated in memory; no browser profile or real progress is touched.
async function openApp(storage) {
  const nodes = new Map();
  for (const id of ['app', 'toast', 'confirm-dialog', 'dialog-content', 'dialog-cancel', 'dialog-confirm']) {
    nodes.set('#' + id, { innerHTML: '', textContent: '', handlers: new Map(), classList: { add() {}, remove() {} }, addEventListener(kind, handler) { this.handlers.set(kind, handler); }, showModal() { this.open = true; }, close() { this.open = false; } });
  }
  const document = { title: '', hidden: false, querySelector: selector => nodes.get(selector) || null, addEventListener() {} };
  vm.runInNewContext(application, { document, window: { addEventListener() {}, scrollTo() {} }, localStorage: storage, crypto, URLSearchParams, Intl, location: { search: '' }, fetch: async () => ({ ok: true, json: async () => bank }), setInterval() {}, setTimeout() {}, clearTimeout() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(nodes.get('#app').innerHTML, /Học chắc từng câu/);
  return {
    get html() { return nodes.get('#app').innerHTML; },
    get message() { return nodes.get('#toast').textContent; },
    async confirmReset() {
      await nodes.get('#app').handlers.get('click')({ target: { closest: () => ({ dataset: { action: 'reset-corrupt' } }) }, preventDefault() {} });
      assert.equal(nodes.get('#confirm-dialog').open, true);
      nodes.get('#dialog-confirm').onclick();
    }
  };
}

function memoryStorage(raw, rejectWrites = false) {
  const entries = new Map([['fe-study:v1:guest', raw], ['fe-study:v1:other-account', 'untouched']]);
  return { getItem: key => entries.get(key) ?? null, setItem(key, value) { if (rejectWrites) throw new Error('Storage unavailable'); entries.set(key, value); } };
}

for (const raw of ['broken-json', '{"unexpected":"shape"}']) {
  test(`confirmed recovery replaces corrupt storage and survives reopening (${raw})`, async () => {
    const storage = memoryStorage(raw);
    const app = await openApp(storage);
    assert.match(app.html, /data-action="reset-corrupt"/);
    await app.confirmReset();
    assert.equal(storage.getItem('fe-study:v1:guest'), '[]');
    assert.equal(storage.getItem('fe-study:v1:other-account'), 'untouched');
    assert.doesNotMatch(app.html, /data-action="reset-corrupt"/);
    assert.doesNotMatch((await openApp(storage)).html, /data-action="reset-corrupt"/);
  });
}

test('failed recovery keeps the original data and the recovery controls', async () => {
  const storage = memoryStorage('broken-json', true);
  const app = await openApp(storage);
  await app.confirmReset();
  assert.equal(storage.getItem('fe-study:v1:guest'), 'broken-json');
  assert.match(app.html, /data-action="reset-corrupt"/);
  assert.match(app.message, /Chưa khôi phục/);
});
