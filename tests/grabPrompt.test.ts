import { describe, it, expect } from 'vitest';
import { grabTarget, heldVictim, GRAB_LANE } from '../src/client/grabReadiness';
import { F_BOSS, F_HOLD, F_INV, ViewEnt } from '../src/shared/sim/snapshot';
import { FIGHTERS } from '../src/shared/data/fighters';

const ent = (o: Partial<ViewEnt> = {}): ViewEnt => ({
  id: 1, player: false, def: 'bum', x: 0, y: 0, z: 0, face: -1,
  st: 'idle', t: 0, hp: 10, maxHp: 10, atk: null, flags: 0, phase: 0, ...o,
});

const me = (o: Partial<ViewEnt> = {}): ViewEnt => ent({
  id: 99, player: true, def: 'aynur', x: 100, z: 20, face: 1, hp: 100, maxHp: 100, ...o,
});

describe('grab prompt readiness', () => {
  it('lights up at the authoritative reach and lane, and nowhere else', () => {
    const reach = FIGHTERS.aynur.grabRange;
    expect(grabTarget(me(), [ent({ x: 100 + reach, z: 20 })])).toBeTruthy();
    expect(grabTarget(me(), [ent({ x: 100 + reach + 1, z: 20 })])).toBeUndefined();
    expect(grabTarget(me(), [ent({ x: 100 + 18, z: 20 + GRAB_LANE })])).toBeTruthy();
    expect(grabTarget(me(), [ent({ x: 100 + 18, z: 20 + GRAB_LANE + 1 })])).toBeUndefined();
    // facing matters: the overlap fringe works, a body behind the back does not
    expect(grabTarget(me(), [ent({ x: 97, z: 20 })])).toBeTruthy();
    expect(grabTarget(me(), [ent({ x: 94, z: 20 })])).toBeUndefined();
    expect(grabTarget(me({ face: -1 }), [ent({ x: 118, z: 20 })])).toBeUndefined();
  });

  it('ignores what the simulation cannot grab: held, thrown, invulnerable, airborne', () => {
    for (const e of [
      ent({ st: 'held' }), ent({ st: 'thrown' }), ent({ st: 'down' }), ent({ st: 'getup' }),
      ent({ st: 'dead', hp: 0 }), ent({ y: 8 }), ent({ flags: F_INV }), ent({ flags: F_HOLD }),
    ]) {
      expect(grabTarget(me(), [e]), `${e.st} y=${e.y} flags=${e.flags}`).toBeUndefined();
    }
  });

  it('lets bosses only be grabbed while dizzy or tired', () => {
    expect(grabTarget(me(), [ent({ x: 110, z: 20, flags: F_BOSS, st: 'idle' })])).toBeUndefined();
    expect(grabTarget(me(), [ent({ x: 110, z: 20, flags: F_BOSS, st: 'dizzy' })])).toBeTruthy();
    expect(grabTarget(me(), [ent({ x: 110, z: 20, flags: F_BOSS, st: 'tired' })])).toBeTruthy();
  });

  it('matches the attack-state rule: startup yes, active frames no, armor no', () => {
    expect(grabTarget(me(), [ent({ x: 110, z: 20, st: 'attack', atk: 'e_jab', t: 3 })])).toBeTruthy();
    expect(grabTarget(me(), [ent({ x: 110, z: 20, st: 'attack', atk: 'e_jab', t: 10 })])).toBeUndefined();
    expect(grabTarget(me(), [ent({ x: 110, z: 20, st: 'attack', atk: 'e_slam', t: 12 })])).toBeUndefined();
  });

  it('stays off while the player is busy or already holding someone', () => {
    expect(grabTarget(me({ st: 'attack' }), [ent({ x: 110 })])).toBeUndefined();
    expect(grabTarget(me({ st: 'hold', flags: F_HOLD }), [ent({ x: 110 })])).toBeUndefined();
    expect(grabTarget(me({ st: 'hurt' }), [ent({ x: 110 })])).toBeUndefined();
  });

  it('finds the held victim for the throw hint', () => {
    const meHolding = me({ st: 'hold', flags: F_HOLD });
    const victim = ent({ id: 7, st: 'held', x: 117, z: 20 });
    const other = ent({ id: 8, st: 'held', x: 140, z: 20 });
    expect(heldVictim(meHolding, [other, victim])?.id).toBe(7);
    expect(heldVictim(me({ st: 'idle' }), [victim])).toBeUndefined();
    expect(heldVictim(meHolding, [ent({ st: 'held', x: 100 + 40 })])).toBeUndefined();
  });
});
