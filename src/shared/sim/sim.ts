// The authoritative game simulation. Pure TypeScript, no DOM, no wall-clock time and no
// Math.random: given the same seed and inputs it produces the same result. It runs on the
// dedicated server, in the host's browser for relay rooms, and locally for solo play.

import { BODY_HALF_W, GRAVITY, MAX_ENEMIES_ALIVE, RESPAWN_INVULN, SCREEN_W, START_LIVES, STREET_DEPTH, CONTINUE_TICKS, MAX_PLAYERS } from '../data/constants';
import { InputFrame, NO_INPUT } from '../data/input';
import { CHAPTERS, ChapterDef, PROP_HP, SectionDef } from '../data/stages';
import { ENEMIES } from '../data/enemies';
import { FIGHTERS, FighterId } from '../data/fighters';
import { TRY_PER_USD, convert, Currency } from '../data/currency';
import { Rng } from './rng';
import { Ent, GamePhase, HazardRt, Pickup, Projectile, Prop, SimEvent } from './types';
import { controlPlayer } from './control';
import { updateCombat, updateProjectiles, setState } from './combat';
import { aiTick } from './ai';
import { updatePickups, spawnCoin, spawnFood, buyItem, useItem } from './items';

export interface SpawnQ { e: string; side: 'L' | 'R'; z: number; t: number; wave: number }

export interface SimOptions { seed?: number; chapter?: number; section?: number; godMode?: boolean }

export class Sim {
  tick = 0;
  rng: Rng;
  ents: Ent[] = [];
  pickups: Pickup[] = [];
  props: Prop[] = [];
  projs: Projectile[] = [];
  hazards: HazardRt[] = [];
  events: SimEvent[] = [];
  inputs = new Map<number, InputFrame>();
  nextId = 1;
  chapter = 0;
  section = 0;
  camX = 0;
  lockX: number | null = null;
  waveIdx = 0;
  waveAlive = new Set<number>();
  spawnQ: SpawnQ[] = [];
  phase: GamePhase = 'lobby';
  phaseT = 0;
  bossId = -1;
  currency: Currency = 'TRY';
  continueT = 0;
  continues = 0;
  godMode: boolean;
  /** player records kept while a player is disconnected so they can rejoin intact */
  away = new Map<string, Ent>();

  constructor(opts: SimOptions = {}) {
    this.rng = new Rng(opts.seed ?? 1234);
    this.chapter = opts.chapter ?? 0;
    this.section = opts.section ?? 0;
    this.godMode = !!opts.godMode;
    this.currency = this.chapterDef.currency;
  }

  get chapterDef(): ChapterDef { return CHAPTERS[this.chapter]; }
  get sectionDef(): SectionDef { return this.chapterDef.sections[this.section]; }
  players(): Ent[] { return this.ents.filter((e) => e.kind === 'p' && !e.removed); }
  livePlayers(): Ent[] { return this.players().filter((p) => p.st !== 'out' && p.st !== 'dead' && p.hp > 0); }
  enemies(): Ent[] { return this.ents.filter((e) => e.kind === 'e' && !e.removed); }
  byId(id: number): Ent | undefined { return this.ents.find((e) => e.id === id && !e.removed); }
  emit(ev: SimEvent): void { this.events.push(ev); }

  // ------------------------------------------------------------------ entities
  blank(kind: 'p' | 'e', def: string, x: number, z: number): Ent {
    return {
      id: this.nextId++, kind, def, x, y: 0, z, vx: 0, vy: 0, vz: 0, face: 1, hp: 1, maxHp: 1, st: 'idle', t: 0, dur: 0,
      atk: null, hitList: [], buffer: null, bufT: 0, hitstop: 0, inv: 0, stun: 0, juggle: 0, poiseHits: 0, poiseT: 0,
      hold: -1, heldBy: -1, holdT: 0, holdHits: 0, escape: 0, thrownBy: -1, lastHitBy: -1, removed: false, rewarded: false, usedAir: false,
      pid: '', slot: 0, name: '', lives: 0, money: 0, bag: [], sel: 0, xp: 0, lvl: 1, speedT: 0, powerT: 0,
      running: false, dblDir: 0, dblT: 0, connected: true, nonces: [], ai: null, boss: false, phase: 0, quipCd: 0, offT: 0,
    };
  }

  addPlayer(pid: string, fighter: FighterId, name = 'Kanka'): Ent {
    const back = this.away.get(pid);
    if (back) {
      this.away.delete(pid);
      back.removed = false; back.connected = true;
      this.placePlayer(back, this.players().length);
      back.inv = RESPAWN_INVULN;
      this.ents.push(back);
      return back;
    }
    const existing = this.players().find((p) => p.pid === pid);
    if (existing) return existing;
    const used = new Set(this.players().map((p) => p.slot));
    let slot = 0; while (used.has(slot) && slot < MAX_PLAYERS) slot++;
    const def = FIGHTERS[fighter];
    const p = this.blank('p', fighter, 0, 0);
    p.pid = pid; p.slot = slot; p.name = name.slice(0, 12);
    p.maxHp = def.maxHp; p.hp = def.maxHp; p.lives = START_LIVES;
    this.placePlayer(p, slot);
    this.ents.push(p);
    return p;
  }

  /** Disconnect: the record is parked so a reconnect restores lives, money and items. */
  removePlayer(pid: string): void {
    const p = this.players().find((x) => x.pid === pid);
    if (!p) return;
    this.releaseHolds(p);
    p.removed = true; p.connected = false;
    this.ents = this.ents.filter((e) => e !== p);
    this.away.set(pid, p);
    this.inputs.delete(p.id);
    for (const e of this.enemies()) if (e.ai && e.ai.target === p.id) e.ai.target = -1;
  }

  releaseHolds(e: Ent): void {
    if (e.hold >= 0) {
      const t = this.byId(e.hold);
      if (t) { t.heldBy = -1; if (t.st === 'held') setState(t, 'idle'); t.inv = Math.max(t.inv, 20); }
      e.hold = -1;
    }
    if (e.heldBy >= 0) {
      const h = this.byId(e.heldBy);
      if (h) { h.hold = -1; if (h.st === 'hold' || h.st === 'grabatk') setState(h, 'idle'); }
      e.heldBy = -1;
    }
  }

  placePlayer(p: Ent, slot: number): void {
    p.x = this.camX + 40 + slot * 22; p.z = 18 + slot * 12; p.y = 0; p.vx = p.vy = p.vz = 0; p.face = 1;
    if (p.st !== 'out') setState(p, 'idle');
  }

  setInput(pid: string, input: InputFrame): void {
    const p = this.players().find((x) => x.pid === pid);
    if (!p) return;
    const prev = this.inputs.get(p.id);
    // pressed edges accumulate until the simulation consumes them
    this.inputs.set(p.id, { held: input.held, pressed: (prev?.pressed ?? 0) | input.pressed });
  }

  // ------------------------------------------------------------------ commands (shop, items, continue)
  command(pid: string, cmd: { c: 'buy'; item: string; nonce: string } | { c: 'leave' } | { c: 'use'; slot: number } | { c: 'continue' }): { ok: boolean; reason?: string } {
    const p = this.players().find((x) => x.pid === pid);
    if (cmd.c === 'continue') return this.tryContinue();
    if (!p) return { ok: false, reason: 'not in game' };
    switch (cmd.c) {
      case 'buy': {
        if (p.nonces.includes(cmd.nonce)) return { ok: false, reason: 'duplicate' };
        p.nonces.push(cmd.nonce); if (p.nonces.length > 32) p.nonces.shift();
        return buyItem(this, p, cmd.item);
      }
      case 'leave':
        if (p.st === 'shop') { setState(p, 'idle'); p.inv = 30; }
        return { ok: true };
      case 'use':
        return useItem(this, p, cmd.slot);
    }
  }

  tryContinue(): { ok: boolean; reason?: string } {
    if (this.phase !== 'gameover') return { ok: false, reason: 'not game over' };
    this.continues++;
    for (const p of this.players()) {
      p.lives = START_LIVES; p.hp = p.maxHp; p.money = Math.floor(p.money / 2);
      p.inv = RESPAWN_INVULN; setState(p, 'idle'); p.x = this.camX + 60 + p.slot * 20; p.y = 40;
      this.emit({ k: 'respawn', id: p.id });
    }
    this.phase = this.sectionDef.boss ? 'boss' : 'play';
    return { ok: true };
  }

  // ------------------------------------------------------------------ stage flow
  start(): void {
    this.loadSection(this.chapter, this.section);
  }

  loadSection(ch: number, se: number): void {
    const prevCur = this.currency;
    this.chapter = ch; this.section = se;
    const def = this.sectionDef;
    this.currency = this.chapterDef.currency;
    if (prevCur !== this.currency) {
      for (const p of [...this.players(), ...this.away.values()]) p.money = convert(p.money, prevCur, this.currency);
      this.emit({ k: 'convert', rate: TRY_PER_USD });
    }
    this.camX = 0; this.lockX = null; this.waveIdx = 0; this.waveAlive.clear(); this.spawnQ = [];
    this.ents = this.ents.filter((e) => e.kind === 'p');
    this.pickups = []; this.projs = [];
    this.props = def.props.map((pd) => ({ id: this.nextId++, kind: pd.kind, x: pd.x, z: pd.z, hp: PROP_HP[pd.kind] ?? 2, broken: false, drop: pd.drop, brokeT: 0 }));
    for (const f of def.food ?? []) spawnFood(this, f.item, f.x, f.z, 0);
    this.hazards = (def.hazards ?? []).map((h) => ({ kind: h.kind, state: 0, x: -999, dir: 1, z0: h.z0, z1: h.z1, hits: [] }));
    for (const p of this.players()) {
      p.hold = -1; p.heldBy = -1;
      if (p.st === 'dead' && p.lives > 0) p.st = 'idle';
      this.placePlayer(p, p.slot);
    }
    this.bossId = -1;
    this.phase = def.boss ? 'bossintro' : 'intro';
    this.phaseT = 0;
    this.emit({ k: 'section', ch, se });
    if (def.boss) {
      const b = this.spawnEnemy(def.boss, 'R', 34, -1);
      b.x = SCREEN_W - 70; b.face = -1;
      this.bossId = b.id;
    }
  }

  spawnEnemy(id: string, side: 'L' | 'R', z: number, wave: number): Ent {
    const def = ENEMIES[id];
    const e = this.blank('e', id, side === 'R' ? this.camX + SCREEN_W + 24 : this.camX - 24, z);
    const n = Math.max(1, this.players().length);
    const scale = def.boss ? 1 + 0.6 * (n - 1) : 1 + 0.3 * (n - 1);
    e.maxHp = Math.round(def.maxHp * scale); e.hp = e.maxHp;
    e.face = side === 'R' ? -1 : 1;
    e.boss = !!def.boss;
    e.ai = { mode: 'enter', target: -1, think: 20 + this.rng.int(0, 30), cool: 30 + this.rng.int(0, 40), side: side === 'R' ? 1 : -1, circleZ: z, blockT: 0 };
    if (wave >= 0) this.waveAlive.add(e.id);
    this.ents.push(e);
    return e;
  }

  private updateWaves(): void {
    const def = this.sectionDef;
    // trigger the next wave when the camera reaches it
    if (this.lockX === null && this.waveIdx < def.waves.length && this.camX >= def.waves[this.waveIdx].at) {
      const w = def.waves[this.waveIdx];
      this.lockX = w.at;
      this.camX = w.at;
      w.spawn.forEach((s, i) => this.spawnQ.push({ e: s.e, side: s.side ?? 'R', z: s.z ?? 8 + this.rng.int(0, STREET_DEPTH - 16), t: i * 26 + (s.delay ?? 0), wave: this.waveIdx }));
      this.waveIdx++;
      this.emit({ k: 'wave' });
    }
    for (const q of this.spawnQ) q.t--;
    const alive = this.enemies().filter((e) => e.hp > 0).length;
    const ready = this.spawnQ.filter((q) => q.t <= 0);
    let room = MAX_ENEMIES_ALIVE - alive;
    for (const q of ready) {
      if (room-- <= 0) break;
      this.spawnEnemy(q.e, q.side, q.z, q.wave);
      this.spawnQ.splice(this.spawnQ.indexOf(q), 1);
    }
    for (const id of [...this.waveAlive]) { const e = this.byId(id); if (!e || e.hp <= 0) this.waveAlive.delete(id); }
    // safety net: an enemy stranded off-screen (behind props, pushed out) is pulled back in
    for (const e of this.enemies()) {
      const off = e.x < this.camX - 4 || e.x > this.camX + SCREEN_W + 4;
      e.offT = off && e.hp > 0 ? e.offT + 1 : 0;
      if (e.offT > 480) { e.x = e.x < this.camX ? this.camX + 20 : this.camX + SCREEN_W - 20; e.z = 30; e.offT = 0; }
    }
    if (this.lockX !== null && this.waveAlive.size === 0 && this.spawnQ.length === 0) {
      this.lockX = null;
      this.emit({ k: 'go' });
    }
  }

  get camMax(): number {
    const def = this.sectionDef;
    if (this.lockX !== null) return this.lockX;
    const next = def.waves[this.waveIdx];
    return Math.min(def.length - SCREEN_W, next ? next.at : Infinity);
  }

  private updateCamera(): void {
    const ps = this.livePlayers();
    if (!ps.length) return;
    const minX = Math.min(...ps.map((p) => p.x)), maxX = Math.max(...ps.map((p) => p.x));
    if (this.sectionDef.boss) {
      // boss arenas: a free camera that follows the players both ways inside the arena
      const want = Math.max(0, Math.min(this.sectionDef.length - SCREEN_W, (minX + maxX) / 2 - SCREEN_W / 2));
      this.camX += Math.max(-3, Math.min(3, want - this.camX));
      return;
    }
    const want = (minX + maxX) / 2 - SCREEN_W / 2 + 30;
    // the camera only scrolls forward, never past the lock, and never so far that the
    // rearmost player would fall off the left edge
    const limit = Math.min(this.camMax, minX - 16);
    if (want > this.camX) this.camX = Math.min(Math.max(this.camX, want), Math.max(this.camX, limit));
    this.camX = Math.max(0, this.camX);
  }

  private updateHazards(): void {
    const defs = this.sectionDef.hazards ?? [];
    defs.forEach((h, i) => {
      const rt = this.hazards[i];
      const t = (this.tick + h.offset) % h.period;
      const driveLen = Math.ceil((SCREEN_W + 260) / h.speed);
      if (this.lockX !== null || this.phase !== 'play') { if (rt.state !== 2) { rt.state = 0; return; } }
      if (t < h.warn) {
        if (rt.state !== 1) { rt.state = 1; rt.dir = this.rng.chance(0.5) ? 1 : -1; this.emit({ k: 'horn', kind: h.kind }); }
      } else if (t < h.warn + driveLen) {
        if (rt.state !== 2) { rt.state = 2; rt.hits = []; rt.x = rt.dir === 1 ? this.camX - 130 : this.camX + SCREEN_W + 130; }
        rt.x += h.speed * rt.dir;
        for (const e of this.ents) {
          if (e.removed || e.hp <= 0 || e.y > 26 || e.z < rt.z0 - 4 || e.z > rt.z1 + 4 || Math.abs(e.x - rt.x) > 48 || rt.hits.includes(e.id)) continue;
          if (e.st === 'shop' || e.st === 'out' || e.st === 'dead' || e.inv > 0 || e.st === 'down' || e.st === 'getup') continue;
          rt.hits.push(e.id);
          this.hurtBy(e, h.damage, rt.dir * 4.2, 3.2, -1);
        }
      } else rt.state = 0;
    });
  }

  /** Environmental damage (vehicles); `src` -1 means no attacker. */
  hurtBy(e: Ent, dmg: number, vx: number, vy: number, src: number): void {
    this.releaseHolds(e);
    if (!(this.godMode && e.kind === 'p')) e.hp -= dmg;
    e.lastHitBy = src >= 0 ? src : e.lastHitBy;
    e.vx = vx; e.vy = vy; e.y = Math.max(e.y, 1);
    setState(e, 'knock');
    this.emit({ k: 'hit', x: e.x, y: 24, z: e.z, heavy: true, dmg, tgt: e.id });
  }

  private updatePhysics(e: Ent): void {
    if (e.st === 'held' || e.st === 'shop') return;
    e.x += e.vx; e.z += e.vz;
    const air = e.y > 0 || e.vy > 0;
    if (air) {
      e.y += e.vy; e.vy -= GRAVITY;
      if (e.y <= 0) { e.y = 0; const v = e.vy; e.vy = 0; this.onLand(e, v); }
    }
    e.z = Math.max(0, Math.min(STREET_DEPTH, e.z));
    const def = this.sectionDef;
    if (e.kind === 'p') e.x = Math.max(this.camX + BODY_HALF_W + 2, Math.min(this.camX + SCREEN_W - BODY_HALF_W - 2, e.x));
    else if (def.boss) e.x = Math.max(14, Math.min(def.length - 14, e.x));
    else e.x = Math.max(-80, Math.min(def.length + 80, e.x));
    if (e.st === 'thrown') e.x = Math.max(this.camX + 4, Math.min(this.camX + SCREEN_W - 4, e.x));
    // solid props
    for (const pr of this.props) {
      if (pr.broken || e.y > 18) continue;
      const dx = e.x - pr.x, dz = e.z - pr.z, ox = 14 + BODY_HALF_W - Math.abs(dx), oz = 7 - Math.abs(dz);
      if (ox > 0 && oz > 0) { if (ox < oz * 2.5) e.x += Math.sign(dx || 1) * ox; else e.z += Math.sign(dz || 1) * oz; }
    }
    // gentle separation so enemies do not stack on one pixel
    if (e.kind === 'e' && e.y === 0 && e.hp > 0) {
      for (const o of this.ents) {
        if (o === e || o.kind !== 'e' || o.removed || o.hp <= 0 || o.y > 0) continue;
        const dx = e.x - o.x, dz = e.z - o.z;
        if (Math.abs(dx) < 12 && Math.abs(dz) < 5) { e.x += Math.sign(dx || (e.id < o.id ? -1 : 1)) * 0.5; e.z += Math.sign(dz || (e.id < o.id ? -1 : 1)) * 0.25; }
      }
    }
  }

  private onLand(e: Ent, v: number): void {
    switch (e.st) {
      case 'jump': setState(e, 'idle'); e.vx = 0; e.vz = 0; e.usedAir = false; this.emit({ k: 'land', id: e.id, heavy: false }); break;
      case 'attack': if (e.atk && e.kind === 'p') { setState(e, 'idle'); e.vx = 0; e.vz = 0; e.usedAir = false; } else { e.vx *= 0.3; } break;
      case 'knock': case 'thrown': {
        if (e.st === 'thrown') {
          const thrower = this.byId(e.thrownBy);
          const dmg = thrower && thrower.kind === 'p' ? FIGHTERS[thrower.def as FighterId].throwDamage : 14;
          if (!(this.godMode && e.kind === 'p')) e.hp -= dmg;
          e.lastHitBy = e.thrownBy >= 0 ? e.thrownBy : e.lastHitBy;
          this.emit({ k: 'hit', x: e.x, y: 4, z: e.z, heavy: true, dmg, tgt: e.id });
        }
        if (v < -3.2 && e.hp > 0) { e.vy = 1.6; e.y = 0.1; e.vx *= 0.5; this.emit({ k: 'land', id: e.id, heavy: true }); break; }
        e.vx = 0; e.vz = 0; setState(e, e.hp <= 0 ? 'dead' : 'down'); this.emit({ k: 'land', id: e.id, heavy: true });
        break;
      }
      default: e.vx = 0; e.vz = 0;
    }
  }

  private updateLife(e: Ent): void {
    if (e.kind === 'e') {
      if (e.hp <= 0 && !e.rewarded) this.reward(e);
      if (e.st === 'dead' && e.t > 70) e.removed = true;
      return;
    }
    if (e.hp <= 0 && e.st !== 'dead' && e.st !== 'out' && e.st !== 'knock' && e.y <= 0) { this.releaseHolds(e); setState(e, 'dead'); }
    if (e.st === 'dead' && e.t === 1) { e.lives = Math.max(0, e.lives - 1); this.emit({ k: 'die', id: e.id }); }
    if (e.st === 'dead' && e.t > 90) {
      if (e.lives > 0) {
        e.hp = e.maxHp; e.inv = RESPAWN_INVULN; setState(e, 'idle');
        const mate = this.livePlayers()[0];
        e.x = mate ? mate.x - 20 : this.camX + 60; e.z = mate ? mate.z : 30; e.y = 60; e.vy = 0;
        this.emit({ k: 'respawn', id: e.id });
      } else setState(e, 'out');
    }
  }

  /** Awarded exactly once per enemy: the `rewarded` flag is the guard. */
  reward(e: Ent): void {
    e.rewarded = true;
    const def = ENEMIES[e.def];
    this.emit({ k: 'ko', id: e.id, boss: e.boss });
    const amt = this.rng.int(def.reward[0], def.reward[1]);
    const coins = e.boss ? 5 : 1;
    for (let i = 0; i < coins; i++) spawnCoin(this, Math.ceil(amt / coins), e.x + (i - (coins - 1) / 2) * 10, e.z);
    if (this.rng.chance(def.food)) spawnFood(this, null, e.x + 6, e.z, 3);
    for (const p of this.players()) {
      const gain = p.id === e.lastHitBy ? def.xp : Math.floor(def.xp / 2);
      p.xp += gain;
      while (p.xp >= xpToNext(p.lvl) && p.lvl < 10) { p.xp -= xpToNext(p.lvl); p.lvl++; p.maxHp += 6; p.hp = Math.min(p.maxHp, p.hp + 12); this.emit({ k: 'levelup', id: p.id, lvl: p.lvl }); }
    }
  }

  // ------------------------------------------------------------------ main step
  step(): void {
    this.tick++;
    this.phaseT++;
    switch (this.phase) {
      case 'lobby': case 'final': case 'victory': return;
      case 'intro': if (this.phaseT > 120) { this.phase = 'play'; this.phaseT = 0; } break;
      case 'bossintro': if (this.phaseT > 150) { this.phase = 'boss'; this.phaseT = 0; } break;
      case 'clear': if (this.phaseT > 50) this.advance(); return;
      case 'bossdown':
        if (this.phaseT === 1) for (const p of this.livePlayers()) setState(p, 'victory');
        if (this.phaseT > 180) { this.phase = 'chapterclear'; this.phaseT = 0; for (const p of this.players()) { if (p.st === 'out') { p.lives = 1; setState(p, 'idle'); } p.hp = p.maxHp; } }
        break;
      case 'chapterclear': {
        const anyStart = [...this.inputs.values()].some((i) => i.pressed & 8192);
        if (this.phaseT > 600 || (this.phaseT > 90 && anyStart)) this.advance();
        this.inputs.forEach((i) => (i.pressed = 0));
        return;
      }
      case 'gameover':
        this.continueT--;
        if ([...this.inputs.values()].some((i) => i.pressed & 8192)) this.tryContinue();
        else if (this.continueT <= 0) this.phase = 'final';
        this.inputs.forEach((i) => (i.pressed = 0));
        return;
      default: break;
    }
    const active = this.phase === 'play' || this.phase === 'boss' || this.phase === 'bossintro' || this.phase === 'bossdown' || this.phase === 'intro';
    if (!active) return;

    for (const e of this.ents) {
      if (e.removed) continue;
      if (e.hitstop > 0) { e.hitstop--; continue; }
      e.t++;
      if (e.inv > 0) e.inv--;
      if (e.speedT > 0) e.speedT--;
      if (e.powerT > 0) e.powerT--;
      if (e.poiseT > 0 && --e.poiseT === 0) e.poiseHits = 0;
      if (e.stun > 0 && e.st !== 'dizzy') e.stun = Math.max(0, e.stun - 0.15);
      if (e.quipCd > 0) e.quipCd--;
      if (e.kind === 'p') {
        const inp = this.inputs.get(e.id) ?? NO_INPUT;
        if (this.phase === 'bossdown' || this.phase === 'intro' && this.phaseT < 30) controlPlayer(this, e, NO_INPUT);
        else controlPlayer(this, e, inp);
        const stored = this.inputs.get(e.id);
        if (stored) stored.pressed = 0;
      } else if (this.phase !== 'bossintro' && this.phase !== 'bossdown') aiTick(this, e);
      else if (e.st !== 'idle' && e.st !== 'dead' && e.st !== 'knock' && e.st !== 'down') updateCombat(this, e);
      this.updatePhysics(e);
      this.updateLife(e);
    }
    this.ents = this.ents.filter((e) => !e.removed);
    updateProjectiles(this);
    updatePickups(this);
    for (const pr of this.props) if (pr.broken) pr.brokeT++;
    if (this.phase === 'play') { this.updateWaves(); this.updateHazards(); this.updateCamera(); this.checkExit(); }
    else if (this.phase === 'boss') { this.checkBoss(); this.updateCamera(); }
    else if (this.phase === 'intro') this.updateCamera();
    if (this.players().length > 0 && this.players().every((p) => p.st === 'out')) {
      this.phase = 'gameover'; this.phaseT = 0; this.continueT = CONTINUE_TICKS;
    }
  }

  private checkExit(): void {
    const def = this.sectionDef;
    if (this.waveIdx < def.waves.length || this.lockX !== null || this.spawnQ.length) return;
    if (this.enemies().some((e) => e.hp > 0)) return;
    const ps = this.livePlayers();
    if (ps.length && this.camX >= def.length - SCREEN_W - 1 && ps.some((p) => p.x >= def.length - 40)) {
      this.phase = 'clear'; this.phaseT = 0;
    }
  }

  private checkBoss(): void {
    const b = this.byId(this.bossId);
    if (!b || b.hp <= 0) {
      for (const e of this.enemies()) if (e.hp > 0) { e.hp = 0; this.reward(e); setState(e, 'knock'); e.vy = 3; e.vx = 2 * e.face * -1; }
      // the boss's purse (and any loose coins) is split evenly between the surviving players
      const coins = this.pickups.filter((p) => p.kind === 'coin' && !p.taken);
      const total = coins.reduce((n, c) => n + c.amount, 0);
      const winners = this.livePlayers().length ? this.livePlayers() : this.players();
      if (total > 0 && winners.length) {
        coins.forEach((c) => (c.taken = true));
        const share = Math.floor(total / winners.length);
        winners.forEach((p, i) => { const amt = share + (i === 0 ? total - share * winners.length : 0); p.money += amt; this.emit({ k: 'coin', id: p.id, amt }); });
      }
      this.phase = 'bossdown'; this.phaseT = 0;
    }
  }

  private advance(): void {
    const ch = this.chapterDef;
    if (this.section + 1 < ch.sections.length) this.loadSection(this.chapter, this.section + 1);
    else if (this.chapter + 1 < CHAPTERS.length) this.loadSection(this.chapter + 1, 0);
    else { this.phase = 'victory'; this.phaseT = 0; }
  }
}

export function xpToNext(lvl: number): number { return 60 + lvl * 40; }
