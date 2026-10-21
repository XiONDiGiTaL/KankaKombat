// Client view of a room: handshake, lobby state, snapshot buffer with interpolation,
// input sending and command results. Never decides gameplay outcomes itself.

import { ClientMsg, LobbyPlayer, PROTOCOL_VERSION, ServerMsg } from '../../shared/net/protocol';
import { FighterId } from '../../shared/data/fighters';
import { decode, View, ViewEnt } from '../../shared/sim/snapshot';
import { SimEvent } from '../../shared/sim/types';
import { Link } from './links';

const TICK_MS = 1000 / 60;

export type ClientStatus = 'connecting' | 'lobby' | 'game' | 'closed';

export class GameClient {
  status: ClientStatus = 'connecting';
  myId = '';
  code = '';
  isHost = false;
  lobby: LobbyPlayer[] = [];
  canStart = false;
  error = '';
  rtt = 0;
  private snaps: View[] = [];
  private offset: number | null = null;        // estimated (serverTick - localTick)
  private seq = 0;
  private pendingPressed = 0;
  private lastHeld = 0;
  private sendEvery: number;
  private n = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  eventQueue: SimEvent[] = [];
  onChange: () => void = () => {};
  onResult: (r: { nonce?: string; ok: boolean; reason?: string }) => void = () => {};
  onError: (code: string, msg: string) => void = () => {};

  constructor(readonly link: Link, readonly name: string, readonly token: string, public fighter: FighterId) {
    this.sendEvery = link.kind === 'relay-guest' ? 3 : link.remote ? 2 : 1;
    link.onMessage = (m) => this.handle(m);
    link.onClose = (r) => { if (this.status !== 'closed') { this.status = 'closed'; this.error = r; this.onChange(); } };
    this.send({ t: 'hello', v: PROTOCOL_VERSION, name, token, f: fighter });
    if (link.remote) this.pingTimer = setInterval(() => this.send({ t: 'ping', ts: performance.now() }), 1000);
  }

  send(m: ClientMsg): void { if (this.status !== 'closed') this.link.send(m); }

  private handle(m: ServerMsg): void {
    switch (m.t) {
      case 'welcome':
        this.myId = m.id; this.code = m.code; this.isHost = m.host;
        if (this.status === 'connecting') this.status = m.inGame ? 'game' : 'lobby';
        this.onChange();
        break;
      case 'lobby':
        this.lobby = m.players; this.canStart = m.canStart;
        this.isHost = !!m.players.find((p) => p.id === this.myId)?.host;
        if (m.inGame && this.status !== 'game') this.status = 'game';
        if (!m.inGame && this.status === 'game') { this.status = 'lobby'; this.snaps = []; }
        this.onChange();
        break;
      case 'start':
        this.status = 'game'; this.snaps = []; this.offset = null;
        this.onChange();
        break;
      case 'snap': {
        const v = decode(m.s);
        this.eventQueue.push(...v.events);
        if (this.eventQueue.length > 600) this.eventQueue.splice(0, this.eventQueue.length - 600);
        const localTick = performance.now() / TICK_MS;
        const off = v.tick - localTick;
        // track the most recent (least delayed) arrival so jitter only ever adds delay
        this.offset = this.offset === null ? off : Math.max(off, this.offset - 0.05);
        this.snaps.push(v);
        if (this.snaps.length > 40) this.snaps.shift();
        if (this.status !== 'game') { this.status = 'game'; this.onChange(); }
        break;
      }
      case 'res': this.onResult(m); break;
      case 'err': this.error = m.msg; this.onError(m.code, m.msg); this.onChange(); break;
      case 'pong': this.rtt = performance.now() - m.ts; break;
      case 'end': this.status = 'closed'; this.error = m.reason; this.onChange(); break;
    }
  }

  /** Sample input every 60 Hz tick; pressed edges are batched so a quick tap is never lost. */
  input(held: number, pressed: number): void {
    this.pendingPressed |= pressed;
    if (++this.n % this.sendEvery !== 0 && pressed === 0 && held === this.lastHeld) return;
    this.lastHeld = held;
    this.send({ t: 'in', s: ++this.seq, h: held, p: this.pendingPressed });
    this.pendingPressed = 0;
  }

  latest(): View | null { return this.snaps[this.snaps.length - 1] ?? null; }

  /** Interpolated view. Remote entities are drawn ~100 ms in the past; the local player uses the newest state. */
  view(): View | null {
    const last = this.latest();
    if (!last) return null;
    if (!this.link.remote || this.snaps.length < 2 || this.offset === null) return last;
    const renderTick = performance.now() / TICK_MS + this.offset - 6;
    let a = this.snaps[0], b = this.snaps[1];
    for (let i = this.snaps.length - 1; i > 0; i--) {
      if (this.snaps[i - 1].tick <= renderTick) { a = this.snaps[i - 1]; b = this.snaps[i]; break; }
    }
    if (renderTick >= last.tick) return last;
    const span = b.tick - a.tick || 1;
    const k = Math.max(0, Math.min(1, (renderTick - a.tick) / span));
    const me = last.players.find((p) => p.pid === this.myId);
    const lerp = (x: number, y: number) => x + (y - x) * k;
    const ents: ViewEnt[] = b.ents.map((eb) => {
      if (me && eb.id === me.id) return last.ents.find((e) => e.id === eb.id) ?? eb;
      const ea = a.ents.find((e) => e.id === eb.id);
      if (!ea || Math.abs(ea.x - eb.x) > 60) return eb;
      return { ...eb, x: lerp(ea.x, eb.x), y: lerp(ea.y, eb.y), z: lerp(ea.z, eb.z) };
    });
    return { ...b, ents, camX: lerp(a.camX, b.camX), players: last.players, pickups: b.pickups, events: [] };
  }

  takeEvents(): SimEvent[] { const e = this.eventQueue; this.eventQueue = []; return e; }

  close(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.status = 'closed';
    this.link.close();
  }
}
