// Whether the local player has an enemy in grab reach, decided from the same rules the
// authoritative tryGrab uses. The on-screen prompt reads from this, so it can never promise
// a clinch the simulation would refuse.

import { ATTACKS } from '../shared/data/attacks';
import { FIGHTERS, FighterId } from '../shared/data/fighters';
import { phaseOf } from '../shared/sim/combat';
import { F_BOSS, F_HOLD, F_INV, ViewEnt } from '../shared/sim/snapshot';

/** States a normal enemy can be grabbed out of (mirrors grabEligible in combat.ts). */
const GRABBABLE: ReadonlySet<string> = new Set(['idle', 'walk', 'run', 'hurt', 'dizzy', 'block', 'tired', 'taunt']);

/** States in which the player can start a grab. */
const READY: ReadonlySet<string> = new Set(['idle', 'walk', 'run', 'block']);

/** How far forward from the body centre a grab starts, and how far the clinch tolerates
 *  a lane step. These are the authoritative numbers, not a second copy of them. */
export const GRAB_BACK = 4;
export const GRAB_LANE = 11;

function eligible(e: ViewEnt): boolean {
  if (e.player || e.hp <= 0 || e.y > 1) return false;
  if (e.flags & (F_INV | F_HOLD)) return false;
  if (e.st === 'held' || e.st === 'thrown') return false;
  if (e.flags & F_BOSS) return e.st === 'dizzy' || e.st === 'tired';
  if (e.st === 'attack') {
    const a = e.atk ? ATTACKS[e.atk] : null;
    return !!a && !a.armor && phaseOf(a, e.t) !== 'a';
  }
  return GRABBABLE.has(e.st);
}

/** The nearest eligible enemy in front of `me`, or undefined when the prompt should stay off. */
export function grabTarget(me: ViewEnt, ents: ViewEnt[]): ViewEnt | undefined {
  if (!READY.has(me.st) || (me.flags & F_HOLD)) return undefined;
  const f = FIGHTERS[me.def as FighterId];
  if (!f) return undefined;
  let best: ViewEnt | undefined, bestD = Infinity;
  for (const e of ents) {
    if (e.id === me.id || !eligible(e)) continue;
    if (Math.abs(e.z - me.z) > GRAB_LANE) continue;
    const dx = (e.x - me.x) * me.face;
    if (dx < -GRAB_BACK || dx > f.grabRange) continue;
    if (dx < bestD) { best = e; bestD = dx; }
  }
  return best;
}

/** The enemy the local player is holding right now, for the throw hint. */
export function heldVictim(me: ViewEnt, ents: ViewEnt[]): ViewEnt | undefined {
  if (me.st !== 'hold') return undefined;
  let best: ViewEnt | undefined, bestD = Infinity;
  for (const e of ents) {
    if (e.player || e.st !== 'held') continue;
    const d = Math.abs(e.x - me.x) + Math.abs(e.z - me.z);
    if (d > 34) continue;
    if (d < bestD) { best = e; bestD = d; }
  }
  return best;
}
