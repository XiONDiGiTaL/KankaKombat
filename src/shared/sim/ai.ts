// Enemy and boss behaviour. Enemies share an "attack token" budget per player so a crowd
// takes turns instead of mobbing, flankers circle behind, ranged enemies keep their distance,
// and bosses pick from phase-specific move lists with telegraphed specials.

import { ATTACKS } from '../data/attacks';
import { ENEMIES, EnemyAttack, EnemyDef } from '../data/enemies';
import { SCREEN_W } from '../data/constants';
import type { Sim } from './sim';
import { Ent, FREE } from './types';
import { phaseOf, quip, setState, startAttack, updateCombat } from './combat';

const TOKENS_PER_PLAYER = 2;

export function aiTick(sim: Sim, e: Ent): void {
  const def = ENEMIES[e.def];
  const ai = e.ai!;
  if (e.hp <= 0) { updateCombat(sim, e); return; }
  if (e.boss) checkPhase(sim, e, def);
  if (e.st === 'block') {
    e.vx *= 0.75; e.vz = 0;
    if (--ai.blockT <= 0) setState(e, 'idle');
    return;
  }
  if (!FREE.has(e.st)) { updateCombat(sim, e); return; }

  if (ai.cool > 0) ai.cool--;
  ai.think--;
  const speedMul = e.boss ? phaseDef(def, e).speed : 1;
  let target = sim.byId(ai.target);
  if (!target || !isTarget(target) || ai.think <= 0) {
    if (ai.think <= 0) ai.think = 18 + sim.rng.int(0, 22);
    target = pickTarget(sim, e) ?? undefined;
    ai.target = target ? target.id : -1;
  }
  if (!target) { e.vx = 0; e.vz = 0; if (e.st !== 'idle') setState(e, 'idle'); return; }

  const dx = target.x - e.x, adx = Math.abs(dx), dz = target.z - e.z;
  // entering from off-screen: walk in before anything else
  if (ai.mode === 'enter') {
    if (e.x > sim.camX + 20 && e.x < sim.camX + SCREEN_W - 20) ai.mode = 'approach';
    else {
      const cx = sim.camX + SCREEN_W / 2, wz = detour(sim, e, cx, target.z);
      move(e, Math.sign(cx - e.x), Math.abs(wz - e.z) > 2 ? Math.sign(wz - e.z) : 0, def, 1); return;
    }
  }

  // reactive defence: block or sidestep an incoming player attack
  if (target.st === 'attack' && target.atk && adx < 46 && Math.abs(dz) < 12 && target.face === Math.sign(e.x - target.x)) {
    const ph = phaseOf(ATTACKS[target.atk], target.t);
    if (ph === 's' && ai.blockT >= 0) {
      ai.blockT = -20; // one reaction roll per attack
      if (sim.rng.chance(def.block)) { e.face = dx >= 0 ? 1 : -1; setState(e, 'block'); ai.blockT = 26; return; }
      if (sim.rng.chance(def.dodge)) { setState(e, 'dodge', 16); e.vz = (e.z > 32 ? -1 : 1) * 2.6; e.vx = -Math.sign(dx) * 1.2; e.inv = 10; return; }
    }
  }
  if (ai.blockT < 0) ai.blockT++;

  const attacks = e.boss ? phaseDef(def, e).attacks : def.attacks;
  const engaged = sim.enemies().filter((o) => o !== e && o.ai?.target === target!.id && o.ai.mode === 'approach' && o.hp > 0).length;
  const mayEngage = e.boss || def.keepAway || engaged < TOKENS_PER_PLAYER + Math.max(0, sim.players().length - 1);
  ai.mode = mayEngage ? 'approach' : 'circle';

  // attack if any move fits the current spacing
  const inLane = Math.abs(dz) < (def.keepAway ? 10 : 7);
  if (ai.cool <= 0 && inLane && mayEngage) {
    const options = attacks.filter((a) => adx >= a.min && adx <= a.max + 4);
    if (options.length && sim.rng.chance(e.boss ? phaseDef(def, e).aggression : def.aggression * 0.35)) {
      const pick = sim.rng.weighted(options.map((a: EnemyAttack) => ({ w: a.w, v: a.id })));
      e.face = dx >= 0 ? 1 : -1;
      startAttack(sim, e, pick);
      const a = ATTACKS[pick];
      if (a.telegraph) quip(sim, e);
      ai.cool = Math.round((e.boss ? 30 : 50 + sim.rng.int(0, 50)) / speedMul);
      return;
    }
  }

  // positioning
  let wantX: number, wantZ: number;
  if (def.keepAway) {
    const side = e.x < target.x ? -1 : 1;
    wantX = target.x + side * def.keepAway; wantZ = target.z;
  } else if (ai.mode === 'circle') {
    const side = e.x < target.x ? -1 : 1;
    if (sim.rng.chance(0.01)) ai.circleZ = 6 + sim.rng.int(0, 52);
    wantX = target.x + side * 74; wantZ = ai.circleZ;
  } else {
    let side = e.x < target.x ? -1 : 1;
    if (def.flank && adx > 40) side = -target.face; // try to come from behind
    const reach = Math.max(14, Math.min(...attacks.map((a) => a.max)) - 6);
    wantX = target.x + side * Math.min(reach, 22); wantZ = target.z;
  }
  wantX = Math.max(sim.camX + 14, Math.min(sim.camX + SCREEN_W - 14, wantX));
  wantZ = detour(sim, e, wantX, wantZ);
  const mx = Math.abs(wantX - e.x) > 3 ? Math.sign(wantX - e.x) : 0;
  const mz = Math.abs(wantZ - e.z) > 2 ? Math.sign(wantZ - e.z) : 0;
  // Bıyıklı Fehmi always pauses for a sip before he sets off again.
  if (def.sip && (mx || mz) && e.st !== 'walk') {
    ai.sipT = ai.sipT ?? 0;
    if (ai.sipT > 0) { ai.sipT--; e.vx = e.vz = 0; return; }
    if (ai.sipT === 0) { ai.sipT = -40; e.vx = e.vz = 0; return; }
  }
  if (!mx && !mz) ai.sipT = 0;
  move(e, mx, mz, def, speedMul);
  e.face = dx >= 0 ? 1 : -1;
  if (!mx && !mz && sim.rng.chance(0.004)) quip(sim, e);
}

/** Steer around a solid prop sitting between the enemy and where it wants to go. */
function detour(sim: Sim, e: Ent, wantX: number, wantZ: number): number {
  for (const pr of sim.props) {
    if (pr.broken) continue;
    const between = (pr.x - e.x) * (wantX - e.x) > 0 && Math.abs(pr.x - e.x) < 40;
    if (between && Math.abs(pr.z - e.z) < 12) return pr.z > 32 ? pr.z - 16 : pr.z + 16;
  }
  return wantZ;
}

function move(e: Ent, mx: number, mz: number, def: EnemyDef, mul: number): void {
  e.vx = mx * def.walk * mul; e.vz = mz * def.walkZ * mul;
  const st = mx || mz ? 'walk' : 'idle';
  if (e.st !== st) setState(e, st);
  if (mx) e.face = mx as 1 | -1;
}

function isTarget(p: Ent): boolean {
  return p.kind === 'p' && !p.removed && p.hp > 0 && !['dead', 'out', 'shop'].includes(p.st);
}

function pickTarget(sim: Sim, e: Ent): Ent | null {
  let best: Ent | null = null, score = Infinity;
  for (const p of sim.players()) {
    if (!isTarget(p)) continue;
    const load = sim.enemies().filter((o) => o !== e && o.ai?.target === p.id).length;
    const s = Math.abs(p.x - e.x) + Math.abs(p.z - e.z) * 2 + load * 40 + (p.id === e.ai!.target ? -30 : 0);
    if (s < score) { score = s; best = p; }
  }
  return best;
}

function phaseDef(def: EnemyDef, e: Ent) {
  return def.boss!.phases[Math.min(e.phase, def.boss!.phases.length - 1)];
}

function checkPhase(sim: Sim, e: Ent, def: EnemyDef): void {
  const phases = def.boss!.phases;
  const next = phases[e.phase + 1];
  if (!next || e.hp / e.maxHp > next.below || e.hp <= 0) return;
  e.phase++;
  sim.emit({ k: 'phase', id: e.id, text: next.line ?? '' });
  if (FREE.has(e.st) || e.st === 'hurt') { setState(e, 'taunt', 60); e.vx = 0; }
  e.inv = 60;
  for (const s of next.summon ?? []) sim.spawnEnemy(s, sim.rng.chance(0.5) ? 'L' : 'R', 8 + sim.rng.int(0, 48), -1);
}
