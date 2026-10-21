// Player control: turns an input frame into movement, attacks, grabs and interactions.

import { BTN, InputFrame } from '../data/input';
import { FIGHTERS, FighterId } from '../data/fighters';
import type { Sim } from './sim';
import { Ent, FREE } from './types';
import { setState, startAttack, tryGrab, updateCombat } from './combat';
import { tryInteract, useItem } from './items';

const DOUBLE_TAP = 14;

export function controlPlayer(sim: Sim, p: Ent, inp: InputFrame): void {
  const f = FIGHTERS[p.def as FighterId];
  const held = inp.held, pr = inp.pressed;
  const dx = (held & BTN.RIGHT ? 1 : 0) - (held & BTN.LEFT ? 1 : 0);
  const dz = (held & BTN.DOWN ? 1 : 0) - (held & BTN.UP ? 1 : 0);
  const spd = p.speedT > 0 ? 1.25 : 1;

  // double-tap run detection
  if (p.dblT > 0) p.dblT--;
  const tapDir = pr & BTN.RIGHT ? 1 : pr & BTN.LEFT ? -1 : 0;
  if (tapDir) {
    if (p.dblDir === tapDir && p.dblT > 0) p.running = true;
    p.dblDir = tapDir; p.dblT = DOUBLE_TAP;
  }
  if (!dx || dx !== p.face) p.running = false;
  const running = dx !== 0 && (p.running || (held & BTN.RUN) !== 0);

  // buffer attack presses made during other actions
  if (pr & BTN.LIGHT) { p.buffer = 'L'; p.bufT = 10; }
  else if (pr & BTN.HEAVY) { p.buffer = 'H'; p.bufT = 10; }
  else if (p.bufT > 0 && --p.bufT === 0) p.buffer = null;

  if (p.st === 'held') { if (pr) p.escape += popcount(pr); return void updateCombat(sim, p); }

  if (p.st === 'hold') {
    if (pr & BTN.HEAVY || pr & BTN.GRAB) {
      if (dx && dx !== p.face) p.face = dx as 1 | -1;
      setState(p, 'throw'); p.atk = 'p_throw'; p.buffer = null;
      return;
    }
    if (pr & BTN.LIGHT) { setState(p, 'grabatk'); p.atk = f.grabAtk; p.buffer = null; return; }
    // reposition while holding: slow walk, turning swaps the victim to the other side
    if (dx && dx !== p.face && p.t > 6) p.face = dx as 1 | -1;
    p.vx = dx * f.walk * 0.45; p.vz = dz * f.walkZ * 0.45;
    updateCombat(sim, p);
    return;
  }

  if (p.st === 'jump') {
    p.vx = p.vx * 0.98 + dx * 0.04;
    if (!p.usedAir && p.buffer) {
      startAttack(sim, p, f.jumpAtk); p.usedAir = true; p.buffer = null;
    }
    return;
  }

  if (!FREE.has(p.st)) { updateCombat(sim, p); return; }

  // --- free states: idle / walk / run / block
  if (pr & BTN.JUMP && !(held & BTN.BLOCK)) {
    setState(p, 'jump');
    p.vy = f.jumpV; p.y = 0.1; p.usedAir = false;
    p.vx = dx * (running ? f.run : f.walk) * spd; p.vz = dz * f.walkZ * 0.8;
    sim.emit({ k: 'jump', id: p.id });
    return;
  }
  if (pr & BTN.DODGE || (held & BTN.BLOCK && pr & BTN.JUMP)) {
    const ddx = dx || (dz ? 0 : -p.face), ddz = dz;
    const n = Math.hypot(ddx, ddz) || 1;
    setState(p, 'dodge', f.dodgeTicks);
    p.vx = (ddx / n) * f.dodgeSpeed; p.vz = (ddz / n) * f.dodgeSpeed * 0.7;
    p.inv = Math.max(p.inv, f.dodgeInvuln);
    return;
  }
  if (pr & BTN.GRAB) {
    if (tryInteract(sim, p)) return;
    if (tryGrab(sim, p)) return;
    setState(p, 'grab'); p.vx = p.face * 0.6;
    return;
  }
  if (p.buffer) {
    const id = running || p.st === 'run' ? f.runAtk : p.buffer === 'L' ? f.light : f.heavy;
    if (dx) p.face = dx as 1 | -1;
    startAttack(sim, p, id);
    if (id === f.runAtk) p.vx = p.face * f.run;
    p.running = false;
    return;
  }
  if (pr & BTN.ITEM) { useItem(sim, p, p.sel); return; }
  if (pr & BTN.CYCLE && p.bag.length) { p.sel = (p.sel + 1) % p.bag.length; }

  if (held & BTN.BLOCK) {
    if (p.st !== 'block') setState(p, 'block');
    p.vx = 0; p.vz = 0;
    return;
  }
  if (dx || dz) {
    if (dx) p.face = dx as 1 | -1;
    const sp = (running ? f.run : f.walk) * spd;
    p.vx = dx * sp; p.vz = dz * f.walkZ * spd * (running ? 1.1 : 1);
    const st = running ? 'run' : 'walk';
    if (p.st !== st) setState(p, st);
  } else {
    p.vx = 0; p.vz = 0;
    if (p.st !== 'idle') setState(p, 'idle');
  }
}

function popcount(n: number): number { let c = 0; while (n) { c += n & 1; n >>>= 1; } return c; }
