// Compact, JSON-friendly snapshots of the authoritative state. Strings are mapped to
// indices into shared tables so both ends decode them identically.

import { ATTACKS } from '../data/attacks';
import { ENEMIES } from '../data/enemies';
import { FIGHTER_IDS } from '../data/fighters';
import { ITEM_IDS, ItemId } from '../data/items';
import { Currency } from '../data/currency';
import type { Sim } from './sim';
import { xpToNext } from './sim';
import { GamePhase, SimEvent, St, STATES } from './types';

export const DEFS: string[] = [...FIGHTER_IDS, ...Object.keys(ENEMIES)];
export const ATK_IDS: string[] = Object.keys(ATTACKS);
export const PROP_KINDS = ['crate', 'barrel', 'bin', 'box', 'mailbox'];
export const HAZARD_KINDS = ['tram', 'bike', 'taxi', 'golfcart', 'delivery'];
const PHASES: GamePhase[] = ['lobby', 'intro', 'play', 'clear', 'bossintro', 'boss', 'bossdown', 'chapterclear', 'gameover', 'final', 'victory'];

export const F_INV = 1, F_HOLD = 2, F_BOSS = 4, F_POWER = 8, F_SPEED = 16, F_RISING = 32, F_PLAYER = 64;

export interface ViewEnt {
  id: number; player: boolean; def: string; x: number; y: number; z: number; face: 1 | -1;
  st: St; t: number; hp: number; maxHp: number; atk: string | null; flags: number; phase: number;
}
export interface ViewPlayer {
  id: number; slot: number; pid: string; name: string; fighter: string; lives: number; money: number;
  bag: ItemId[]; sel: number; lvl: number; xp: number; xpNext: number; speedT: number; powerT: number; conn: boolean;
}
export interface ViewPickup { id: number; kind: 'coin' | 'food'; item: ItemId | null; x: number; y: number; z: number }
export interface ViewProp { id: number; kind: string; x: number; z: number; hp: number; maxHp: number; broken: boolean; brokeT: number }
export interface ViewProj { id: number; kind: string; x: number; y: number; z: number }
export interface ViewHazard { kind: string; state: number; x: number; dir: number; z0: number; z1: number }
export interface View {
  tick: number; phase: GamePhase; phaseT: number; chapter: number; section: number;
  camX: number; lockX: number | null; camMax: number; cur: Currency; bossId: number; continueT: number;
  ents: ViewEnt[]; players: ViewPlayer[]; pickups: ViewPickup[]; props: ViewProp[]; projs: ViewProj[]; hazards: ViewHazard[];
  events: SimEvent[];
}

/** Wire format: arrays of numbers plus a small header. */
export interface Snap {
  k: number; ph: number; pt: number; ch: number; se: number; cx: number; lk: number; cm: number; cu: 0 | 1; b: number; ct: number;
  e: number[][];
  p: (string | number)[][];
  pk: number[][]; pr: number[][]; pj: number[][]; hz: number[][];
  ev: SimEvent[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function encode(sim: Sim, events: SimEvent[]): Snap {
  return {
    k: sim.tick, ph: PHASES.indexOf(sim.phase), pt: sim.phaseT, ch: sim.chapter, se: sim.section,
    cx: r1(sim.camX), lk: sim.lockX ?? -1, cm: sim.camMax, cu: sim.currency === 'TRY' ? 0 : 1, b: sim.bossId, ct: sim.continueT,
    e: sim.ents.filter((e) => !e.removed).map((e) => [
      e.id, DEFS.indexOf(e.def), r1(e.x), r1(e.y), r1(e.z), e.face, STATES.indexOf(e.st), e.t, Math.max(0, Math.ceil(e.hp)), e.maxHp,
      e.atk ? ATK_IDS.indexOf(e.atk) : -1,
      (e.inv > 0 ? F_INV : 0) | (e.hold >= 0 ? F_HOLD : 0) | (e.boss ? F_BOSS : 0) | (e.powerT > 0 ? F_POWER : 0) | (e.speedT > 0 ? F_SPEED : 0) | (e.vy > 0 ? F_RISING : 0) | (e.kind === 'p' ? F_PLAYER : 0),
      e.phase,
    ]),
    p: sim.players().map((p) => [p.id, p.slot, p.pid, p.name, p.def, p.lives, p.money, p.bag.map((i) => ITEM_IDS.indexOf(i)).join(','), p.sel, p.lvl, p.xp, xpToNext(p.lvl), p.speedT, p.powerT, p.connected ? 1 : 0]),
    pk: sim.pickups.map((p) => [p.id, p.kind === 'coin' ? 0 : 1, p.item ? ITEM_IDS.indexOf(p.item) : -1, r1(p.x), r1(p.y), r1(p.z)]),
    pr: sim.props.map((p) => [p.id, PROP_KINDS.indexOf(p.kind), p.x, p.z, p.broken ? 1 : 0, p.brokeT, p.hp]),
    pj: sim.projs.map((p) => [p.id, p.kind === 'lokma' ? 0 : 1, r1(p.x), r1(p.y), r1(p.z)]),
    hz: sim.hazards.map((h) => [HAZARD_KINDS.indexOf(h.kind), h.state, r1(h.x), h.dir, h.z0, h.z1]),
    ev: events,
  };
}

export function decode(s: Snap): View {
  return {
    tick: s.k, phase: PHASES[s.ph] ?? 'play', phaseT: s.pt, chapter: s.ch, section: s.se, camX: s.cx, lockX: s.lk < 0 ? null : s.lk, camMax: s.cm,
    cur: s.cu ? 'USD' : 'TRY', bossId: s.b, continueT: s.ct,
    ents: s.e.map((a) => ({
      id: a[0], def: DEFS[a[1]], x: a[2], y: a[3], z: a[4], face: (a[5] === -1 ? -1 : 1) as 1 | -1, st: STATES[a[6]] ?? 'idle', t: a[7], hp: a[8], maxHp: a[9],
      atk: a[10] >= 0 ? ATK_IDS[a[10]] : null, flags: a[11], player: (a[11] & F_PLAYER) !== 0, phase: a[12] ?? 0,
    })),
    players: s.p.map((a) => ({
      id: a[0] as number, slot: a[1] as number, pid: a[2] as string, name: a[3] as string, fighter: a[4] as string, lives: a[5] as number, money: a[6] as number,
      bag: String(a[7]).split(',').filter((x) => x !== '').map((i) => ITEM_IDS[Number(i)]), sel: a[8] as number, lvl: a[9] as number, xp: a[10] as number, xpNext: a[11] as number,
      speedT: a[12] as number, powerT: a[13] as number, conn: a[14] === 1,
    })),
    pickups: s.pk.map((a) => ({ id: a[0], kind: a[1] === 0 ? 'coin' : 'food', item: a[2] >= 0 ? ITEM_IDS[a[2]] : null, x: a[3], y: a[4], z: a[5] })),
    props: s.pr.map((a) => ({ id: a[0], kind: PROP_KINDS[a[1]] ?? 'crate', x: a[2], z: a[3], broken: a[4] === 1, brokeT: a[5], hp: a[6] ?? 1, maxHp: 3 })),
    projs: s.pj.map((a) => ({ id: a[0], kind: a[1] === 0 ? 'lokma' : 'orange', x: a[2], y: a[3], z: a[4] })),
    hazards: s.hz.map((a) => ({ kind: HAZARD_KINDS[a[0]], state: a[1], x: a[2], dir: a[3], z0: a[4], z1: a[5] })),
    events: s.ev ?? [],
  };
}
