import { createClient } from '@supabase/supabase-js';
import { mergeEvents, validEvent } from '../core/study.js';

export function createCloud(url, key) {
  if (!url || !key) return null;
  return createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
}

export async function exchangeEvents(client, userId, localEvents) {
  const remote = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from('study_events').select('id,session_id,kind,happened_at,data').eq('user_id', userId).order('happened_at').order('id').range(from, from + 999);
    if (error) throw error;
    for (const row of data) {
      const e = { id: row.id, sessionId: row.session_id, kind: row.kind, at: row.happened_at, data: row.data };
      if (!validEvent(e)) throw new Error('Tiến độ trên máy chủ không đúng định dạng.');
      remote.push(e);
    }
    if (data.length < 1000) break;
  }
  const remoteIds = new Set(remote.map(e => e.id));
  const pending = mergeEvents(localEvents).filter(e => !remoteIds.has(e.id));
  for (let i = 0; i < pending.length; i += 100) {
    const { error } = await client.rpc('append_study_events', { items: pending.slice(i, i + 100) });
    if (error) throw error;
  }
  return mergeEvents(localEvents, remote);
}
