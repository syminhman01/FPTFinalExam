import { build } from 'esbuild';
import { readFile, mkdir, cp, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function buildApp() {
  const url = process.env.PUBLIC_SUPABASE_URL || '';
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || '';
  if (Boolean(url) !== Boolean(key)) throw new Error('Provide both PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY, or leave both empty for local study.');
  if (url && !/^https:\/\/[a-zA-Z0-9.-]+(:\d+)?\/?$/.test(url)) throw new Error('PUBLIC_SUPABASE_URL must be an HTTPS origin.');
  if (key.startsWith('sb_secret_')) throw new Error('Never put a Supabase secret key in the frontend. Use a publishable/anon key.');
  if (key.split('.').length === 3) {
    try { if (JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role') throw new Error('SERVICE_ROLE'); }
    catch (err) { if (err.message === 'SERVICE_ROLE') throw new Error('Never put service_role in the frontend.'); }
  }
  const target = resolve('dist');
  await mkdir(target, { recursive: true });
  await cp('frontend/public', target, { recursive: true });
  await writeFile(resolve(target, 'index.html'), await readFile('frontend/index.html'));
  await build({ entryPoints: ['frontend/src/main.js'], bundle: true, format: 'esm', target: 'es2022', minify: true, outfile: resolve(target, 'app.js'), define: { __SUPABASE_URL__: JSON.stringify(url), __SUPABASE_ANON_KEY__: JSON.stringify(key) }, legalComments: 'eof' });
  console.log('Built dist/ — ' + (url ? 'Google sign-in configured' : 'local study; cloud not configured'));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('scripts/build.mjs')) await buildApp();
