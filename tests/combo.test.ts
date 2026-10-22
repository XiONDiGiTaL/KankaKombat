import { describe, it, expect } from 'vitest';
import { COMBO_FADE, COMBO_TTL, Combos } from '../src/client/render/combo';

describe('combo tracker', () => {
  it('only shows a chain from the second landed hit', () => {
    const c = new Combos();
    c.hit(7, 5);
    expect(c.get(7)).toBeUndefined();
    c.hit(7, 5);
    expect(c.get(7)?.n).toBe(2);
  });

  it('ignores blocked hits, zero-damage pokes and sourceless hazards', () => {
    const c = new Combos();
    c.hit(7, 5, true);
    c.hit(7, 0);
    c.hit(-1, 5);
    c.hit(7, 5);
    expect(c.get(7)).toBeUndefined();
    c.hit(7, 5);
    expect(c.get(7)?.n).toBe(2);
  });

  it('extends while hits keep landing and resets after the window closes', () => {
    const c = new Combos();
    c.hit(1, 5);
    c.hit(1, 5);
    for (let i = 0; i < COMBO_TTL - 1; i++) c.step();
    expect(c.get(1)?.n).toBe(2);
    c.step();
    expect(c.get(1)).toBeUndefined();
    c.hit(1, 5);
    expect(c.get(1)).toBeUndefined();
    c.hit(1, 5);
    expect(c.get(1)?.n).toBe(2);
  });

  it('keeps each player on their own chain', () => {
    const c = new Combos();
    c.hit(1, 5); c.hit(1, 5); c.hit(1, 5);
    c.hit(2, 5); c.hit(2, 5);
    expect(c.get(1)?.n).toBe(3);
    expect(c.get(2)?.n).toBe(2);
  });

  it('holds full opacity, then fades over the tail of the window', () => {
    const c = new Combos();
    c.hit(1, 5); c.hit(1, 5);
    for (let i = 0; i < COMBO_TTL - COMBO_FADE; i++) c.step();
    expect(c.get(1)?.alpha).toBe(1);
    c.step();
    expect(c.get(1)!.alpha).toBeLessThan(1);
    expect(c.get(1)!.alpha).toBeGreaterThan(0);
  });

  it('ends a player\'s chain immediately when that player is hit', () => {
    const c = new Combos();
    c.hit(1, 5); c.hit(1, 5); c.hit(1, 5);
    c.hit(2, 5); c.hit(2, 5);
    c.breakChain(1);
    expect(c.get(1)).toBeUndefined();
    expect(c.get(2)?.n).toBe(2);
    // The next landed hit starts a fresh chain, not a continuation of the old one.
    c.hit(1, 5);
    expect(c.get(1)).toBeUndefined();
    c.hit(1, 5);
    expect(c.get(1)?.n).toBe(2);
  });

  it('clears when a new game starts', () => {
    const c = new Combos();
    c.hit(1, 5); c.hit(1, 5);
    c.clear();
    expect(c.get(1)).toBeUndefined();
  });
});
