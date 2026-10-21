// Connections between the game client and a room's authority.
//
//  LocalLink      solo play: the HostSession runs in this tab.
//  WsLink         dedicated server: the HostSession runs on the Node server (server-authoritative).
//  RelayHostLink  online without a server: the HostSession runs in the host's tab and guests
//                 talk to it through a broadcast relay (Supabase Realtime, as in LeapBuddies,
//                 or the self-hosted /relay endpoint). Host-authoritative.
//  RelayGuestLink the guest side of a relay room.

import { HostSession } from '../../shared/net/session';
import { ClientMsg, ServerMsg, parseClientPayload } from '../../shared/net/protocol';
import { SNAPSHOT_EVERY } from '../../shared/data/constants';
import { SimEvent } from '../../shared/sim/types';
import { Channel } from './channels';

export interface Link {
  readonly kind: 'local' | 'ws' | 'relay-host' | 'relay-guest';
  onMessage: (m: ServerMsg) => void;
  onClose: (reason: string) => void;
  send(m: ClientMsg): void;
  tick?(): void;                 // called at 60 Hz when the authority lives in this tab
  close(): void;
  readonly remote: boolean;      // true when snapshots arrive over the network
}

const LOCAL = 'local';

export class LocalLink implements Link {
  readonly kind = 'local' as const;
  readonly remote = false;
  onMessage: (m: ServerMsg) => void = () => {};
  onClose: (r: string) => void = () => {};
  readonly session: HostSession;
  constructor(code = 'SOLO', opts: { allowDebugStart?: boolean; seed?: number } = {}) {
    this.session = new HostSession({ code, send: (_p, m) => this.onMessage(m), snapshotEvery: 1, allowDebugStart: opts.allowDebugStart, seed: opts.seed, timeoutMs: 1e12 });
  }
  send(m: ClientMsg): void { this.session.onMessage(LOCAL, m); }
  tick(): void { this.session.tick(); }
  close(): void { this.session.ended = true; }
}

export class WsLink implements Link {
  readonly kind = 'ws' as const;
  readonly remote = true;
  onMessage: (m: ServerMsg) => void = () => {};
  onClose: (r: string) => void = () => {};
  private ws: WebSocket;
  private closed = false;
  private queue: string[] = [];
  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => { for (const q of this.queue) this.ws.send(q); this.queue = []; };
    this.ws.onmessage = (ev) => { try { this.onMessage(JSON.parse(String(ev.data))); } catch { /* ignore malformed */ } };
    this.ws.onclose = () => { if (!this.closed) this.onClose('Lost connection to the game server.'); this.closed = true; };
    this.ws.onerror = () => { if (!this.closed) this.onClose('Could not reach the game server.'); this.closed = true; try { this.ws.close(); } catch { /* */ } };
  }
  send(m: ClientMsg): void {
    const s = JSON.stringify(m);
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(s);
    else if (this.ws.readyState === WebSocket.CONNECTING) this.queue.push(s);
  }
  close(): void { this.closed = true; try { this.send({ t: 'bye' }); this.ws.close(); } catch { /* */ } }
}

interface Envelope { f: string; to: string; m: unknown }

export class RelayHostLink implements Link {
  readonly kind = 'relay-host' as const;
  readonly remote = false;
  onMessage: (m: ServerMsg) => void = () => {};
  onClose: (r: string) => void = () => {};
  readonly session: HostSession;
  private remoteEvents: SimEvent[] = [];
  private snapN = 0;
  constructor(readonly code: string, private channel: Channel) {
    this.session = new HostSession({
      code, snapshotEvery: 1, timeoutMs: 8000,
      send: (peer, m) => (peer === LOCAL ? this.onMessage(m) : this.post(peer, m)),
      broadcast: (m) => this.broadcast(m),
    });
    channel.onMessage = (data) => {
      const env = data as Envelope;
      if (!env || env.to !== 'host' || typeof env.f !== 'string' || env.f.length > 40) return;
      const msg = parseClientPayload(env.m);
      if (msg) this.session.onMessage(env.f, msg);
    };
    channel.onError = (r) => this.onClose(r);
  }
  private post(peer: string, m: ServerMsg): void { this.channel.send({ f: 'host', to: peer, m }); }
  private broadcast(m: ServerMsg): void {
    this.onMessage(m);
    if (m.t !== 'snap') { this.channel.send({ f: 'host', to: '*', m }); return; }
    // the local player gets every tick; remote guests get 20 Hz with events accumulated
    this.remoteEvents.push(...m.s.ev);
    if (++this.snapN % SNAPSHOT_EVERY !== 0) return;
    const out: ServerMsg = { ...m, s: { ...m.s, ev: this.remoteEvents } };
    this.remoteEvents = [];
    if (this.session.connectedCount() > 1) this.channel.send({ f: 'host', to: '*', m: out });
  }
  send(m: ClientMsg): void { this.session.onMessage(LOCAL, m); }
  tick(): void { this.session.tick(); }
  close(): void { this.session.ended = true; this.channel.send({ f: 'host', to: '*', m: { t: 'end', reason: 'The host closed the room.' } }); this.channel.close(); }
}

export class RelayGuestLink implements Link {
  readonly kind = 'relay-guest' as const;
  readonly remote = true;
  onMessage: (m: ServerMsg) => void = () => {};
  onClose: (r: string) => void = () => {};
  private lastHeard = Date.now();
  private welcomed = false;
  private timer: ReturnType<typeof setInterval>;
  private hello: ClientMsg | null = null;
  private started = Date.now();
  constructor(private gid: string, private channel: Channel) {
    channel.onMessage = (data) => {
      const env = data as Envelope;
      if (!env || env.f !== 'host' || (env.to !== '*' && env.to !== gid)) return;
      this.lastHeard = Date.now();
      const m = env.m as ServerMsg;
      if (m.t === 'welcome') this.welcomed = true;
      if (!this.welcomed && m.t !== 'err') return;
      if (m.t === 'end') { this.onClose(m.reason); return; }
      this.onMessage(m);
    };
    channel.onError = (r) => this.onClose(r);
    this.timer = setInterval(() => {
      if (!this.welcomed) {
        if (this.hello) channel.send({ f: gid, to: 'host', m: this.hello });
        if (Date.now() - this.started > 12000) { this.onClose('Room not found. Check the code, or the host may have left.'); this.close(); }
      } else if (Date.now() - this.lastHeard > 7000) { this.onClose('Lost contact with the host.'); this.close(); }
    }, 1000);
  }
  send(m: ClientMsg): void {
    if (m.t === 'hello') this.hello = m;
    this.channel.send({ f: this.gid, to: 'host', m });
  }
  close(): void { clearInterval(this.timer); try { this.channel.send({ f: this.gid, to: 'host', m: { t: 'bye' } }); } catch { /* */ } this.channel.close(); }
}
