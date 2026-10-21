// A simple autopilot that plays through the real controls (it only ever produces input
// bitmasks). Used by the headless campaign test, the browser e2e autopilot and the
// title-screen attract mode. It cheats nowhere: it sees what a player would see.

import { BTN, InputFrame } from '../data/input';
import { ATTACKS } from '../data/attacks';
import { ITEMS } from '../data/items';
import { SCREEN_W } from '../data/constants';
import type { Sim } from './sim';
import { Ent } from './types';
import { phaseOf } from './combat';

export class Bot {
  private prev = 0;
  private t = 0;
  private evadeT = 0;
  private evadeDir = 0;
  private propT = 0;
  constructor(readonly pid: string, private seed = 1) {}

  think(sim: Sim): InputFrame {
    this.t++;
    const held = this.decide(sim);
    const pressed = held & ~this.prev;
    this.prev = held;
    return { held, pressed };
  }

  private tap(btn: number, every = 2): number {
    return (this.t + this.seed) % every === 0 ? btn : 0;
  }

  private decide(sim: Sim): number {
    const me = sim.players().find((p) => p.pid === this.pid);
    if (!me) return 0;
    if (sim.phase === 'chapterclear' || sim.phase === 'gameover') return this.tap(BTN.START, 20);
    if (sim.phase !== 'play' && sim.phase !== 'boss' && sim.phase !== 'intro') return 0;
    if (me.st === 'held') return this.tap(BTN.LIGHT | BTN.HEAVY | BTN.JUMP, 2);
    if (me.st === 'shop') return 0;
    if (['dead', 'out', 'hurt', 'knock', 'down', 'getup', 'eat'].includes(me.st)) return 0;

    // heal from the bag when low
    if (me.hp < me.maxHp * 0.45 && me.bag.some((i) => ITEMS[i].heal > 0)) {
      const slot = me.bag.findIndex((i) => ITEMS[i].heal > 0);
      if (me.sel !== slot) return this.tap(BTN.CYCLE, 4);
      return this.tap(BTN.ITEM, 4);
    }
    // holding someone: two knees then throw
    if (me.st === 'hold') return me.holdHits < 2 ? this.tap(BTN.LIGHT, 8) : this.tap(BTN.HEAVY, 6);

    let mv = 0;
    // dodge telegraphed specials and vehicles
    if (this.evadeT > 0) { this.evadeT--; return this.evadeDir; }
    for (const e of sim.enemies()) {
      if (e.st !== 'attack' || !e.atk) continue;
      const a = ATTACKS[e.atk];
      const ph = phaseOf(a, e.t);
      if ((a.telegraph ?? 0) >= 18 && (ph === 'tele' || ph === 's') && Math.abs(e.x - me.x) < 120 && Math.abs(e.z - me.z) < 30) {
        this.evadeT = 26;
        this.evadeDir = a.shockwave ? BTN.JUMP : (me.z > 32 ? BTN.UP : BTN.DOWN) | (me.x < e.x ? BTN.LEFT : BTN.RIGHT);
        return this.evadeDir;
      }
    }
    for (const h of sim.hazards) {
      if (h.state === 0) continue;
      if (me.z >= h.z0 - 8 && me.z <= h.z1 + 8) return me.z > (h.z0 + h.z1) / 2 && h.z1 + 12 < 64 ? BTN.DOWN : BTN.UP;
    }

    // food when hurt
    if (me.hp < me.maxHp * 0.8) {
      const food = sim.pickups.find((p) => p.kind === 'food' && Math.abs(p.x - me.x) < 160 && this.visible(sim, p.x));
      if (food) {
        if (Math.abs(food.x - me.x) < 10 && Math.abs(food.z - me.z) < 6) return this.tap(BTN.GRAB, 4);
        return this.toward(me, food.x, food.z);
      }
    }

    const target = this.pickTarget(sim, me);
    if (!target) {
      // collect coins, then head for the exit
      const coin = sim.pickups.find((p) => p.kind === 'coin' && Math.abs(p.x - me.x) < 140 && this.visible(sim, p.x));
      if (coin) return this.toward(me, coin.x, coin.z);
      if (me.bag.length < 2 && me.hp < me.maxHp) {
        const food = sim.pickups.find((p) => p.kind === 'food' && this.visible(sim, p.x));
        if (food) { if (Math.abs(food.x - me.x) < 10 && Math.abs(food.z - me.z) < 6) return this.tap(BTN.GRAB, 4); return this.toward(me, food.x, food.z); }
      }
      // smash props for drops
      const prop = this.propT < 300 ? sim.props.find((p) => !p.broken && Math.abs(p.x - me.x) < 120 && p.x > sim.camX + 30) : undefined;
      if (prop) {
        this.propT++;
        const fromLeft = prop.x - 24 > sim.camX + 14;
        const wx = fromLeft ? prop.x - 24 : prop.x + 24;
        const want = fromLeft ? 1 : -1;
        if (Math.abs(me.x - wx) < 6 && Math.abs(me.z - prop.z) < 4) return me.face === want ? this.tap(BTN.LIGHT, 5) : want === 1 ? BTN.RIGHT : BTN.LEFT;
        return this.toward(me, wx, prop.z);
      }
      this.propT = 0;
      return BTN.RIGHT | (me.z < 30 ? BTN.DOWN : me.z > 34 ? BTN.UP : 0);
    }
    const side = me.x < target.x ? -1 : 1;
    const wantX = target.x + side * 20;
    const dx = wantX - me.x, dz = target.z - me.z;
    if (Math.abs(dz) > 3) mv |= dz > 0 ? BTN.DOWN : BTN.UP;
    if (Math.abs(dx) > 5) mv |= dx > 0 ? BTN.RIGHT : BTN.LEFT;
    const facing = (target.x - me.x) * me.face > 0;
    if (Math.abs(target.x - me.x) < 28 && Math.abs(dz) < 6) {
      if (!facing) return target.x > me.x ? BTN.RIGHT : BTN.LEFT;
      if (target.st === 'dizzy' || (target.st === 'tired' && !target.boss)) return this.tap(BTN.GRAB, 6);
      return (this.t % 40) < 34 ? this.tap(BTN.LIGHT, 3) : this.tap(BTN.HEAVY, 3);
    }
    if (target.x < sim.camX + 4 || target.x > sim.camX + SCREEN_W - 4) mv &= ~(BTN.LEFT | BTN.RIGHT);
    return mv;
  }

  private visible(sim: Sim, x: number): boolean { return x > sim.camX + 12 && x < sim.camX + SCREEN_W - 12; }

  private toward(me: Ent, x: number, z: number): number {
    let mv = 0;
    if (Math.abs(z - me.z) > 3) mv |= z > me.z ? BTN.DOWN : BTN.UP;
    if (Math.abs(x - me.x) > 4) mv |= x > me.x ? BTN.RIGHT : BTN.LEFT;
    return mv;
  }

  private pickTarget(sim: Sim, me: Ent): Ent | null {
    let best: Ent | null = null, bd = Infinity;
    for (const e of sim.enemies()) {
      if (e.hp <= 0 || ['dead', 'down', 'getup', 'thrown'].includes(e.st)) continue;
      if (e.x < sim.camX - 10 || e.x > sim.camX + SCREEN_W + 10) continue;
      const d = Math.abs(e.x - me.x) + Math.abs(e.z - me.z) * 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
}
