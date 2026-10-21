// A game room. Transport-agnostic: it receives validated client messages tagged with a
// peer id and emits server messages through `send`/`broadcast`. The same class runs inside
// the Node server (dedicated, server-authoritative rooms), inside the host's browser
// (relay rooms) and locally for solo play.

import { MAX_PLAYERS, SNAPSHOT_EVERY } from '../data/constants';
import { FighterId, FIGHTER_IDS } from '../data/fighters';
import { Sim } from '../sim/sim';
import { encode } from '../sim/snapshot';
import { SimEvent } from '../sim/types';
import { ClientMsg, LobbyPlayer, PROTOCOL_VERSION, ServerMsg } from './protocol';

export interface Peer {
  peer: string;            // transport-level id (changes on reconnect)
  id: string;              // stable public player id
  token: string;           // private reconnect token
  name: string;
  fighter: FighterId;
  ready: boolean;
  connected: boolean;
  host: boolean;
  lastSeen: number;
  lastSeq: number;
  budget: number;          // simple token-bucket rate limit
}

export interface SessionOptions {
  code: string;
  send: (peer: string, msg: ServerMsg) => void;
  broadcast?: (msg: ServerMsg) => void;
  snapshotEvery?: number;
  seed?: number;
  allowDebugStart?: boolean;
  now?: () => number;
  timeoutMs?: number;
  godMode?: boolean;
}

export class HostSession {
  peers = new Map<string, Peer>();        // keyed by transport peer
  sim: Sim | null = null;
  pendingEvents: SimEvent[] = [];
  private ticks = 0;
  private idSeq = 0;
  private now: () => number;
  ended = false;

  constructor(readonly opts: SessionOptions) {
    this.now = opts.now ?? (() => Date.now());
  }

  get code(): string { return this.opts.code; }
  get inGame(): boolean { return this.sim !== null; }
  connectedCount(): number { return [...this.peers.values()].filter((p) => p.connected).length; }

  private broadcast(msg: ServerMsg): void {
    if (this.opts.broadcast) this.opts.broadcast(msg);
    else for (const p of this.peers.values()) if (p.connected) this.opts.send(p.peer, msg);
  }

  onMessage(peer: string, msg: ClientMsg): void {
    if (this.ended) return;
    const p = this.peers.get(peer);
    if (p) {
      p.lastSeen = this.now();
      p.budget -= msg.t === 'in' ? 1 : 3;
      if (p.budget < -120) return; // flooding: drop until the bucket refills
    }
    if (msg.t === 'hello') return this.hello(peer, msg);
    if (!p) return void this.opts.send(peer, { t: 'err', code: 'no-hello', msg: 'Say hello first.' });
    if (!p.connected) { p.connected = true; this.sendLobby(); }
    switch (msg.t) {
      case 'pick':
        if (!this.sim) { p.fighter = msg.f; p.ready = false; this.sendLobby(); }
        break;
      case 'ready':
        if (!this.sim) { p.ready = msg.r; this.sendLobby(); }
        break;
      case 'start':
        if (!p.host) return void this.opts.send(peer, { t: 'err', code: 'not-host', msg: 'Only the host can start.' });
        if (this.sim) return;
        if (!this.canStart()) return void this.opts.send(peer, { t: 'err', code: 'not-ready', msg: 'Everyone must be ready.' });
        this.startGame(this.opts.allowDebugStart ? msg.ch ?? 0 : 0, this.opts.allowDebugStart ? msg.se ?? 0 : 0);
        break;
      case 'in':
        if (!this.sim) return;
        if (msg.s <= p.lastSeq) return; // stale or replayed
        p.lastSeq = msg.s;
        this.sim.setInput(p.id, { held: msg.h, pressed: msg.p });
        break;
      case 'cmd': {
        if (!this.sim) return;
        const res = this.sim.command(p.id, msg);
        this.opts.send(peer, { t: 'res', nonce: msg.c === 'buy' ? msg.nonce : undefined, ok: res.ok, reason: res.reason });
        break;
      }
      case 'ping':
        this.opts.send(peer, { t: 'pong', ts: msg.ts });
        break;
      case 'bye':
        this.onDisconnect(peer);
        break;
      case 'restart':
        if (p.host && this.sim && (this.sim.phase === 'victory' || this.sim.phase === 'final')) this.backToLobby();
        break;
    }
  }

  private hello(peer: string, msg: Extract<ClientMsg, { t: 'hello' }>): void {
    // reconnect: same private token resumes the same player
    const prior = [...this.peers.values()].find((x) => x.token === msg.token);
    if (prior) {
      this.peers.delete(prior.peer);
      prior.peer = peer; prior.connected = true; prior.lastSeen = this.now(); prior.lastSeq = -1;
      this.peers.set(peer, prior);
      if (this.sim && !this.sim.players().some((x) => x.pid === prior.id)) this.sim.addPlayer(prior.id, prior.fighter, prior.name);
      this.opts.send(peer, { t: 'welcome', v: PROTOCOL_VERSION, id: prior.id, code: this.code, host: prior.host, inGame: this.inGame });
      this.sendLobby();
      return;
    }
    if (this.peers.size >= MAX_PLAYERS) {
      // drop the oldest disconnected seat if there is one, otherwise refuse
      const stale = [...this.peers.values()].find((x) => !x.connected);
      if (!stale) return void this.opts.send(peer, { t: 'err', code: 'room-full', msg: 'This room is full (4 players).' });
      this.peers.delete(stale.peer);
      this.sim?.away.delete(stale.id);
    }
    const isHost = ![...this.peers.values()].some((x) => x.host);
    const taken = new Set([...this.peers.values()].map((x) => x.fighter));
    const fighter = taken.has(msg.f) && taken.size < FIGHTER_IDS.length ? FIGHTER_IDS.find((f) => !taken.has(f))! : msg.f;
    const pl: Peer = {
      peer, id: 'P' + (++this.idSeq) + '-' + msg.token.slice(0, 4), token: msg.token, name: msg.name, fighter, ready: false,
      connected: true, host: isHost, lastSeen: this.now(), lastSeq: -1, budget: 120,
    };
    this.peers.set(peer, pl);
    this.opts.send(peer, { t: 'welcome', v: PROTOCOL_VERSION, id: pl.id, code: this.code, host: isHost, inGame: this.inGame });
    if (this.sim) this.sim.addPlayer(pl.id, pl.fighter, pl.name); // drop-in co-op
    this.sendLobby();
  }

  onDisconnect(peer: string): void {
    const p = this.peers.get(peer);
    if (!p || !p.connected) return;
    p.connected = false; p.ready = false;
    this.sim?.removePlayer(p.id);
    if (p.host) {
      // hand host rights to someone still here so the room never becomes unstartable
      const next = [...this.peers.values()].find((x) => x.connected);
      if (next) { p.host = false; next.host = true; }
    }
    this.sendLobby();
  }

  canStart(): boolean {
    const here = [...this.peers.values()].filter((p) => p.connected);
    return here.length > 0 && here.every((p) => p.ready);
  }

  lobbyPlayers(): LobbyPlayer[] {
    return [...this.peers.values()].map((p) => ({ id: p.id, name: p.name, f: p.fighter, ready: p.ready, conn: p.connected, host: p.host }));
  }

  sendLobby(): void {
    this.broadcast({ t: 'lobby', players: this.lobbyPlayers(), inGame: this.inGame, canStart: this.canStart() });
  }

  startGame(ch = 0, se = 0): void {
    this.sim = new Sim({ seed: this.opts.seed ?? (this.now() & 0x7fffffff), chapter: ch, section: se, godMode: this.opts.godMode });
    for (const p of this.peers.values()) if (p.connected) this.sim.addPlayer(p.id, p.fighter, p.name);
    this.sim.start();
    this.broadcast({ t: 'start', ch, se });
    this.sendLobby();
  }

  /** Advance one 60 Hz tick; emits a snapshot every `snapshotEvery` ticks. */
  tick(): void {
    if (this.ended) return;
    const now = this.now();
    for (const p of this.peers.values()) {
      p.budget = Math.min(120, p.budget + 2);
      if (p.connected && now - p.lastSeen > (this.opts.timeoutMs ?? 8000)) this.onDisconnect(p.peer);
    }
    if (!this.sim) return;
    this.sim.step();
    if (this.sim.events.length) { this.pendingEvents.push(...this.sim.events); this.sim.events = []; }
    if (this.pendingEvents.length > 400) this.pendingEvents.splice(0, this.pendingEvents.length - 400);
    if (++this.ticks % (this.opts.snapshotEvery ?? SNAPSHOT_EVERY) !== 0) return;
    const acks: Record<string, number> = {};
    for (const p of this.peers.values()) acks[p.id] = p.lastSeq;
    this.broadcast({ t: 'snap', s: encode(this.sim, this.pendingEvents), acks });
    this.pendingEvents = [];
  }

  /** Return everyone to the lobby (after victory / final game over). */
  backToLobby(): void {
    this.sim = null;
    for (const p of this.peers.values()) p.ready = false;
    this.sendLobby();
  }
}
