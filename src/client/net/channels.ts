// Broadcast channels used by relay rooms. A channel delivers every message sent by one
// member to all the others; addressing (host / guest id) is done in the envelope.

import { BRANDING } from '../../shared/config/branding';

export interface Channel {
  onMessage: (data: unknown) => void;
  onError: (reason: string) => void;
  ready: Promise<void>;
  send(data: unknown): void;
  close(): void;
}

/** Supabase Realtime broadcast: the same relay LeapBuddies uses. */
export async function supabaseChannel(code: string, url: string, anonKey: string): Promise<Channel> {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 40 } },
  });
  const ch = client.channel(BRANDING.roomPrefix + code, { config: { broadcast: { self: false, ack: false } } });
  const c: Channel = {
    onMessage: () => {}, onError: () => {}, ready: Promise.resolve(),
    send: (data) => { void ch.send({ type: 'broadcast', event: 'm', payload: data }); },
    close: () => { try { void client.removeChannel(ch); client.realtime.disconnect(); } catch { /* */ } },
  };
  ch.on('broadcast', { event: 'm' }, (msg: { payload?: unknown }) => c.onMessage(msg.payload));
  c.ready = new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Could not reach the online relay. Check your connection and try again.')), 15000);
    ch.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') { clearTimeout(t); resolve(); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') c.onError('The online relay dropped the connection.');
    });
  });
  return c;
}

/** Self-hosted relay (the Node server's /relay endpoint). */
export function wsRelayChannel(code: string, base: string): Channel {
  const ws = new WebSocket(`${base.replace(/\/$/, '')}/relay?ch=${encodeURIComponent(BRANDING.roomPrefix + code)}`);
  const queue: string[] = [];
  let closed = false;
  const c: Channel = {
    onMessage: () => {}, onError: () => {},
    ready: new Promise<void>((resolve, reject) => {
      ws.onopen = () => { for (const q of queue) ws.send(q); queue.length = 0; resolve(); };
      ws.onerror = () => { reject(new Error('Could not reach the relay server.')); if (!closed) c.onError('Relay connection error.'); };
    }),
    send: (data) => { const s = JSON.stringify(data); if (ws.readyState === WebSocket.OPEN) ws.send(s); else if (ws.readyState === WebSocket.CONNECTING) queue.push(s); },
    close: () => { closed = true; try { ws.close(); } catch { /* */ } },
  };
  ws.onmessage = (ev) => { try { c.onMessage(JSON.parse(String(ev.data))); } catch { /* ignore */ } };
  ws.onclose = () => { if (!closed) c.onError('Relay connection closed.'); closed = true; };
  return c;
}
