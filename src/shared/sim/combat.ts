// Combat rules: attack timing, hitbox/hurtbox overlap, blocking, poise and armor, juggle
// limits, dizziness, grabs, throws and projectiles. All outcomes are decided here, on the
// authority, and only ever reach clients as snapshots and events.

import { ATTACKS, AttackDef, PROJECTILES } from '../data/attacks';
import { BODY_HALF_W, BODY_HEIGHT, BODY_HALF_Z } from '../data/constants';
import { ENEMIES } from '../data/enemies';
import { FIGHTERS, FighterId } from '../data/fighters';
import type { Sim } from './sim';
import { Ent, INTANGIBLE, St } from './types';
import { breakProp } from './items';

const JUGGLE_LIMIT = 6;

export function setState(e: Ent, st: St, dur = 0): void {
  e.st = st; e.t = 0; e.dur = dur;
  if (st !== 'attack' && st !== 'grabatk' && st !== 'throw') e.atk = null;
  if (st === 'idle' || st === 'walk') e.juggle = 0;
}

export function startAttack(sim: Sim, e: Ent, id: string): void {
  const a = ATTACKS[id];
  if (!a) return;
  setState(e, a.grab && e.kind === 'p' ? 'grab' : 'attack');
  e.atk = id; e.hitList = []; e.buffer = null;
  if (a.lift) { e.vy = a.lift; e.y = Math.max(e.y, 0.1); }
  if (!a.aerial) { e.vx = 0; e.vz = 0; }
  sim.emit({ k: 'whiff', id: e.id, heavy: !!a.heavy });
}

export function phaseOf(a: AttackDef, t: number): 'tele' | 's' | 'a' | 'r' | 'end' {
  const tele = a.telegraph ?? 0;
  if (t < tele) return 'tele';
  if (t < tele + a.startup) return 's';
  if (t < tele + a.startup + a.active) return 'a';
  if (t < tele + a.startup + a.active + a.recovery) return 'r';
  return 'end';
}

function damageMul(e: Ent): number {
  if (e.kind === 'p') return (1 + 0.06 * (e.lvl - 1)) * (e.powerT > 0 ? 1.3 : 1);
  return 1;
}

function defenseOf(e: Ent): number {
  if (e.kind === 'p') return FIGHTERS[e.def as FighterId].defense;
  return 1;
}

/** Advance whatever timed state `e` is in. Returns true if `e` is still busy. */
export function updateCombat(sim: Sim, e: Ent): boolean {
  switch (e.st) {
    case 'attack': case 'grabatk': case 'throw': return updateAttack(sim, e);
    case 'hurt':
      e.vx *= 0.82; e.vz = 0;
      if (e.t >= e.dur) setState(e, 'idle');
      return true;
    case 'knock':
      if (e.y <= 0 && e.vy === 0 && e.t > 4) setState(e, e.hp <= 0 ? 'dead' : 'down');
      if (e.t > 240) { e.y = 0; e.vy = 0; setState(e, e.hp <= 0 ? 'dead' : 'down'); }
      return true;
    case 'down': {
      e.vx = 0;
      const slow = e.kind === 'e' && ENEMIES[e.def]?.slowGetup;
      const dur = e.hp <= 0 ? 9999 : slow ? 95 : e.kind === 'p' ? 40 : 54;
      if (slow && e.t === 40) quip(sim, e, true);
      if (e.t >= dur) setState(e, 'getup');
      return true;
    }
    case 'getup':
      if (e.t >= 20) { setState(e, 'idle'); e.inv = Math.max(e.inv, 24); e.stun = 0; }
      return true;
    case 'dodge':
      e.vx *= 0.9; e.vz *= 0.9;
      if (e.t >= e.dur) { e.vx = 0; e.vz = 0; setState(e, 'idle'); }
      return true;
    case 'dizzy':
      e.vx = 0;
      if (e.t >= 110) { setState(e, 'idle'); e.stun = 0; }
      return true;
    case 'tired':
      e.vx *= 0.8;
      if (e.t >= e.dur) setState(e, 'idle');
      return true;
    case 'grab':
      e.vx *= 0.7;
      if (e.t >= 14) setState(e, 'idle');
      return true;
    case 'held': {
      const h = sim.byId(e.heldBy);
      if (!h || (h.st !== 'hold' && h.st !== 'grabatk' && h.st !== 'throw')) { e.heldBy = -1; setState(e, 'idle'); e.inv = 20; return false; }
      return true;
    }
    case 'hold': return updateHold(sim, e);
    case 'thrown': thrownCollisions(sim, e); return true;
    case 'eat': if (e.t >= 26) setState(e, 'idle'); return true;
    case 'pickup': if (e.t >= 10) setState(e, 'idle'); return true;
    case 'taunt': if (e.t >= (e.dur || 50)) setState(e, 'idle'); return true;
    case 'dead': case 'out': case 'victory': case 'shop': e.vx = 0; return true;
    case 'jump': return false;
    default: return false;
  }
}

function updateAttack(sim: Sim, e: Ent): boolean {
  const a = e.atk ? ATTACKS[e.atk] : null;
  if (!a) { setState(e, 'idle'); return false; }
  const ph = phaseOf(a, e.t - 1);
  if (a.lunge && (ph === 's' || ph === 'a') && !a.aerial) e.vx = a.lunge * e.face * (e.kind === 'e' ? 1 : 1);
  else if (!a.aerial && e.y === 0) e.vx *= 0.6;
  if (ph === 'a') {
    const tele = a.telegraph ?? 0;
    const at = e.t - 1 - tele - a.startup;
    if (at === 0 && a.projectile) spawnProjectile(sim, e, a.projectile);
    if (a.hits && a.hits > 1 && at > 0 && at % Math.floor(a.active / a.hits) === 0) e.hitList = [];
    if (e.st === 'grabatk' || e.st === 'throw') {
      if (at === 0) heldAction(sim, e);
    } else if (a.grab) tryCommandGrab(sim, e, a);
    else detectHits(sim, e, a);
  }
  if (ph === 'r' && e.kind === 'p' && e.buffer && e.st === 'attack') {
    // combo continuation: light chains to the next light, heavy finishes the chain
    const f = FIGHTERS[e.def as FighterId];
    if (e.buffer === 'L' && a.next) { startAttack(sim, e, a.next); return true; }
    if (e.buffer === 'H' && e.atk !== f.heavy && !a.aerial && e.atk !== f.runAtk) { startAttack(sim, e, f.heavy); return true; }
  }
  if (ph === 'end') {
    if (e.st === 'grabatk') { setState(e, e.hold >= 0 ? 'hold' : 'idle'); return true; }
    if (e.kind === 'e' && a.next && e.hitList.length > 0 && sim.rng.chance(0.85)) { startAttack(sim, e, a.next); return true; }
    if (a.aerial && e.y > 0) { setState(e, 'jump'); e.usedAir = true; return true; }
    const tired = e.boss && a.telegraph && a.telegraph >= 18;
    if (tired) { setState(e, 'tired', ENEMIES[e.def].boss!.tired); return true; }
    setState(e, 'idle');
    e.vx = 0;
    return false;
  }
  return true;
}

function boxOf(e: Ent, a: AttackDef): { x0: number; x1: number; y0: number; y1: number } {
  const ax = e.x + e.face * a.box[0], bx = e.x + e.face * a.box[1];
  return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: e.y + a.box[2], y1: e.y + a.box[3] };
}

export function hittable(t: Ent): boolean {
  if (t.removed || t.inv > 0 || INTANGIBLE.has(t.st)) return false;
  if (t.st === 'knock' && t.juggle >= JUGGLE_LIMIT) return false;
  if (t.st === 'held') return false;
  if (t.hp <= 0 && t.st === 'knock') return false;
  return true;
}

function detectHits(sim: Sim, e: Ent, a: AttackDef): void {
  const b = boxOf(e, a);
  // props block attacks behind them and can be smashed
  let wall = Infinity;
  for (const pr of sim.props) {
    if (pr.broken || Math.abs(pr.z - e.z) > a.dz + 6) continue;
    if (pr.x + 12 < b.x0 || pr.x - 12 > b.x1 || b.y0 > 30) continue;
    wall = Math.min(wall, Math.abs(pr.x - e.x));
    if (e.kind === 'p' && !e.hitList.includes(-pr.id)) { e.hitList.push(-pr.id); breakProp(sim, pr, 1); }
  }
  for (const t of sim.ents) {
    if (t === e || t.kind === e.kind || e.hitList.includes(t.id) || !hittable(t)) continue;
    if (a.shockwave && t.y > 6) continue;
    if (Math.abs(t.z - e.z) > a.dz + BODY_HALF_Z) continue;
    if (t.x + BODY_HALF_W < b.x0 || t.x - BODY_HALF_W > b.x1) continue;
    if (t.y + BODY_HEIGHT < b.y0 || t.y > b.y1) continue;
    if (Math.abs(t.x - e.x) > wall + 6 && !a.shockwave) continue;
    e.hitList.push(t.id);
    applyHit(sim, e, t, a);
  }
}

export function applyHit(sim: Sim, src: Ent | null, t: Ent, a: AttackDef, dirOverride?: number): void {
  const dir = dirOverride ?? (src ? (t.x >= src.x ? 1 : -1) : 1);
  const hs = a.hitstop ?? (a.heavy ? 6 : 3);
  // blocking: only against attacks from the front
  if (t.st === 'block' && !a.unblockable && t.face === -dir) {
    if (a.guardBreak) {
      sim.releaseHolds(t);
      setState(t, 'hurt', 34); t.vx = dir * 2;
      const dmg = Math.max(1, Math.round((a.damage * (src ? damageMul(src) : 1)) / defenseOf(t) * 0.5));
      if (!(sim.godMode && t.kind === 'p')) t.hp -= dmg;
      sim.emit({ k: 'hit', x: t.x - dir * 6, y: t.y + 30, z: t.z, heavy: true, dmg, tgt: t.id });
      if (src) src.hitstop = hs;
      t.hitstop = hs;
      return;
    }
    const chip = Math.max(0, Math.floor((a.damage * 0.15) / defenseOf(t)));
    if (!(sim.godMode && t.kind === 'p')) t.hp = Math.max(1, t.hp - chip);
    t.vx = dir * Math.min(2.4, a.kb[0] * 0.6 + 0.6);
    if (src) src.hitstop = 3;
    t.hitstop = 3;
    sim.emit({ k: 'hit', x: t.x - dir * 6, y: t.y + 30, z: t.z, heavy: false, block: true, dmg: chip, tgt: t.id });
    return;
  }
  let dmg = (a.damage * (src ? damageMul(src) : 1)) / defenseOf(t);
  if (t.st === 'tired' || t.st === 'dizzy') dmg *= 1.5;
  dmg = Math.max(1, Math.round(dmg));
  if (!(sim.godMode && t.kind === 'p')) t.hp -= dmg;
  if (src) t.lastHitBy = src.id;
  sim.emit({ k: 'hit', x: t.x - dir * 4, y: t.y + (a.box[2] + a.box[3]) / 2, z: t.z, heavy: !!a.heavy, dmg, tgt: t.id });
  if (src) src.hitstop = hs;
  t.hitstop = hs;
  // a held victim being hit (by someone else) or a holder being hit breaks the grab
  if (t.hold >= 0 || t.heldBy >= 0) sim.releaseHolds(t);

  if (t.hp <= 0) {
    t.hp = 0;
    setState(t, 'knock');
    t.vx = dir * Math.max(2.4, a.kb[0]); t.vy = Math.max(3.2, a.kb[1]); t.y = Math.max(t.y, 1);
    if (t.kind === 'e' && !t.rewarded) sim.reward(t);
    return;
  }
  const def = t.kind === 'e' ? ENEMIES[t.def] : undefined;
  const tAtk = t.atk ? ATTACKS[t.atk] : undefined;
  const armored = tAtk?.armor && (t.st === 'attack') && ['tele', 's', 'a'].includes(phaseOf(tAtk, t.t));
  t.juggle++;
  const airborne = t.y > 0 || t.st === 'knock';
  if (armored && !airborne) { t.stun += (a.stun ?? 0) * 0.5; return; }
  if (a.knockdown || airborne || t.juggle >= JUGGLE_LIMIT) {
    // bosses only go down to real knockdown moves, and never while armored
    if (t.boss && !a.knockdown && !airborne) { flinch(t, a, dir); return; }
    sim.releaseHolds(t);
    setState(t, 'knock');
    t.vx = dir * a.kb[0] * (def ? 1 / Math.sqrt(def.weight) : 1);
    t.vy = Math.max(a.kb[1], 2.2); t.y = Math.max(t.y, 1);
    return;
  }
  if (def && def.poise > 0 && t.st !== 'hurt' && t.st !== 'dizzy' && t.st !== 'tired') {
    if (t.poiseHits < def.poise) { t.poiseHits++; t.poiseT = 50; t.stun += (a.stun ?? 0); return; }
    t.poiseHits = 0;
  }
  t.stun += a.stun ?? 0;
  const dizzyAt = t.boss ? 90 : 42;
  if (t.kind === 'e' && t.stun >= dizzyAt && t.st !== 'tired') { sim.releaseHolds(t); setState(t, 'dizzy'); t.stun = 0; t.vx = 0; return; }
  if (t.st === 'tired' || t.st === 'dizzy') return; // stay vulnerable, do not reset the window
  flinch(t, a, dir);
}

function flinch(t: Ent, a: AttackDef, dir: number): void {
  setState(t, 'hurt', a.hitstun);
  t.vx = dir * a.kb[0]; t.vz = 0;
  t.face = dir === 1 ? -1 : 1;
}

// ------------------------------------------------------------------ grabs and throws

export function grabEligible(t: Ent): boolean {
  if (t.kind !== 'e' || t.removed || t.hp <= 0 || t.y > 0 || t.heldBy >= 0 || t.inv > 0) return false;
  if (t.boss) return t.st === 'dizzy' || t.st === 'tired';
  return ['idle', 'walk', 'run', 'hurt', 'dizzy', 'block', 'tired', 'taunt'].includes(t.st) ||
    (t.st === 'attack' && !!t.atk && phaseOf(ATTACKS[t.atk], t.t) !== 'a' && !ATTACKS[t.atk].armor);
}

/** Player grab: range, facing, target state and eligibility are all checked here. */
export function tryGrab(sim: Sim, p: Ent): boolean {
  let best: Ent | null = null, bestD = Infinity;
  for (const t of sim.ents) {
    if (!grabEligible(t)) continue;
    const dx = (t.x - p.x) * p.face;
    if (dx < 4 || dx > 26 || Math.abs(t.z - p.z) > 9) continue;
    if (dx < bestD) { best = t; bestD = dx; }
  }
  if (!best) return false;
  const f = FIGHTERS[p.def as FighterId];
  setState(p, 'hold'); p.hold = best.id; p.holdT = f.grabHold; p.holdHits = 0; p.vx = 0; p.vz = 0;
  sim.releaseHolds(best);
  setState(best, 'held'); best.heldBy = p.id; best.face = (p.face === 1 ? -1 : 1);
  best.atk = null; best.vx = 0; best.vz = 0;
  positionHeld(p, best);
  sim.emit({ k: 'grab', id: p.id });
  return true;
}

export function positionHeld(h: Ent, t: Ent): void {
  t.x = h.x + h.face * 17; t.z = h.z + 0.5; t.y = 0; t.vx = 0; t.vz = 0;
  t.face = h.face === 1 ? -1 : 1;
}

function updateHold(sim: Sim, e: Ent): boolean {
  const t = sim.byId(e.hold);
  if (!t || t.heldBy !== e.id || t.hp <= 0) { e.hold = -1; setState(e, 'idle'); return false; }
  positionHeld(e, t);
  e.holdT--;
  if (e.kind === 'e') {
    // enemy grapplers: the victim mashes to escape, otherwise gets slammed
    if (t.escape >= 14) {
      sim.releaseHolds(e); t.escape = 0;
      t.vx = -e.face * 3; setState(t, 'hurt', 10); t.inv = 30;
      if (e.boss) setState(e, 'tired', 60); else setState(e, 'hurt', 30);
      sim.emit({ k: 'msg', id: t.id, text: 'ESCAPED!' });
      return true;
    }
    if (e.holdT <= 0) {
      setState(e, 'throw'); e.atk = 'gus_slap';
      e.hold = -1; t.heldBy = -1; t.escape = 0;
      setState(t, 'thrown'); t.thrownBy = e.id; t.vx = -e.face * 2.6; t.vy = 4.6; t.y = 14;
      sim.emit({ k: 'throw', id: e.id });
    }
    return true;
  }
  if (e.holdT <= 0) {
    // the enemy wriggles free
    sim.releaseHolds(e);
    t.vx = e.face * 2; setState(t, 'hurt', 8); t.inv = 20;
    e.vx = -e.face * 1.5; setState(e, 'hurt', 10);
  }
  return true;
}

/** Called on the first active tick of a grab attack or throw while holding someone. */
function heldAction(sim: Sim, e: Ent): void {
  const t = sim.byId(e.hold);
  if (!t) return;
  if (e.st === 'grabatk') {
    const a = ATTACKS[e.atk!];
    e.holdHits++;
    t.heldBy = -1; t.st = 'idle';
    applyHit(sim, e, t, e.holdHits >= 3 ? { ...a, knockdown: true, kb: [3.2, 2.6], damage: a.damage + 3 } : a, e.face);
    if (t.hp > 0 && e.holdHits < 3 && (t.st as string) !== 'knock') { setState(t, 'held'); t.heldBy = e.id; e.hold = t.id; positionHeld(e, t); }
    else { e.hold = -1; t.heldBy = -1; }
    return;
  }
  // throw
  const f = FIGHTERS[e.def as FighterId];
  const w = ENEMIES[t.def]?.weight ?? 1;
  e.hold = -1; t.heldBy = -1;
  setState(t, 'thrown'); t.thrownBy = e.id; t.hitList = [];
  t.vx = e.face * f.throwSpeed / Math.sqrt(w); t.vy = 3.4; t.y = 16; t.face = e.face === 1 ? -1 : 1;
  t.lastHitBy = e.id;
  sim.emit({ k: 'throw', id: e.id });
}

export const THROWN_BODY: AttackDef = { anim: 'none', startup: 0, active: 1, recovery: 0, damage: 12, box: [0, 0, 0, 0], dz: 10, kb: [3, 2.6], hitstun: 20, knockdown: true, heavy: true, hitstop: 5 };

function thrownCollisions(sim: Sim, e: Ent): void {
  for (const t of sim.ents) {
    if (t === e || t.kind !== e.kind || e.hitList.includes(t.id) || !hittable(t)) continue;
    if (Math.abs(t.x - e.x) > 16 || Math.abs(t.z - e.z) > 10 || e.y > t.y + BODY_HEIGHT) continue;
    e.hitList.push(t.id);
    const thrower = sim.byId(e.thrownBy);
    applyHit(sim, thrower ?? null, t, THROWN_BODY, Math.sign(e.vx) || 1);
  }
  for (const pr of sim.props) {
    if (!pr.broken && Math.abs(pr.x - e.x) < 16 && Math.abs(pr.z - e.z) < 10 && e.y < 20 && !e.hitList.includes(-pr.id)) { e.hitList.push(-pr.id); breakProp(sim, pr, 9); }
  }
}

function tryCommandGrab(sim: Sim, e: Ent, a: AttackDef): void {
  if (e.hold >= 0) return;
  const b = boxOf(e, a);
  for (const t of sim.ents) {
    if (t.kind !== 'p' || !hittable(t) || t.y > 4 || t.heldBy >= 0) continue;
    if (Math.abs(t.z - e.z) > a.dz + BODY_HALF_Z || t.x + BODY_HALF_W < b.x0 || t.x - BODY_HALF_W > b.x1) continue;
    sim.releaseHolds(t);
    setState(e, 'hold'); e.hold = t.id; e.holdT = 70; e.atk = null;
    setState(t, 'held'); t.heldBy = e.id; t.escape = 0;
    positionHeld(e, t);
    sim.emit({ k: 'grab', id: e.id });
    sim.emit({ k: 'msg', id: t.id, text: 'MASH TO ESCAPE!' });
    return;
  }
}

// ------------------------------------------------------------------ projectiles

function spawnProjectile(sim: Sim, e: Ent, kind: string): void {
  const d = PROJECTILES[kind];
  const target = sim.byId(e.ai?.target ?? -1);
  const dist = target ? Math.abs(target.x - e.x) : 100;
  const vy = d.arc;
  const flight = (2 * vy) / 0.12;
  const vx = Math.min(d.speed * 1.6, Math.max(1.6, dist / flight)) * e.face;
  sim.projs.push({ id: sim.nextId++, kind, owner: e.id, x: e.x + e.face * 10, y: 30, z: e.z, vx, vy, dead: false });
  sim.emit({ k: 'proj', kind });
}

export function updateProjectiles(sim: Sim): void {
  for (const pj of sim.projs) {
    if (pj.dead) continue;
    pj.x += pj.vx; pj.y += pj.vy; pj.vy -= 0.12;
    if (pj.y <= 0) { pj.dead = true; continue; }
    const d = PROJECTILES[pj.kind];
    for (const t of sim.ents) {
      if (t.kind !== 'p' || !hittable(t)) continue;
      if (Math.abs(t.x - pj.x) > BODY_HALF_W + 3 || Math.abs(t.z - pj.z) > 8 || pj.y < t.y || pj.y > t.y + BODY_HEIGHT) continue;
      const owner = sim.byId(pj.owner) ?? null;
      applyHit(sim, owner, t, { anim: 'none', startup: 0, active: 1, recovery: 0, damage: d.damage, box: [0, 0, 0, 0], dz: 8, kb: d.kb, hitstun: d.hitstun, knockdown: d.knockdown }, Math.sign(pj.vx) || 1);
      pj.dead = true;
      break;
    }
  }
  sim.projs = sim.projs.filter((p) => !p.dead);
}

export function quip(sim: Sim, e: Ent, force = false): void {
  const q = ENEMIES[e.def]?.quips;
  if (!q || (!force && e.quipCd > 0)) return;
  e.quipCd = 600;
  sim.emit({ k: 'quip', id: e.id, text: sim.rng.pick(q) });
}
