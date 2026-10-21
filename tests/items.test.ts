import { describe, it, expect } from 'vitest';
import { arena, enemy, run, press, BTN } from './helpers';
import { spawnFood, spawnCoin } from '../src/shared/sim/items';
import { ITEMS } from '../src/shared/data/items';
import { MAX_LIVES } from '../src/shared/data/constants';

describe('food, money and the bag', () => {
  it('coins are credited to the first player who touches them, once', () => {
    const { sim, ps: [a, b] } = arena(['bt', 'sc']);
    b.z = a.z;
    spawnCoin(sim, 25, a.x, a.z);
    run(sim, 30);
    expect(a.money + b.money).toBe(25);
    expect(sim.pickups.length).toBe(0);
  });

  it('food is eaten when it helps, stored when it would be wasted, left when the bag is full', () => {
    const { sim, ps: [p] } = arena();
    p.hp = p.maxHp - 10;
    spawnFood(sim, 'nutella', p.x + 4, p.z, 0);
    press(sim, 'p0', BTN.GRAB);
    expect(p.hp).toBe(p.maxHp);          // capped at max
    expect(p.st).toBe('eat');
    run(sim, 40);
    spawnFood(sim, 'baklava', p.x + 4, p.z, 0);
    press(sim, 'p0', BTN.GRAB);
    expect(p.bag).toEqual(['baklava']); // full HP: stored
    run(sim, 20);
    p.bag = ['banana', 'banana', 'banana', 'banana'];
    spawnFood(sim, 'sujuk', p.x + 4, p.z, 0);
    press(sim, 'p0', BTN.GRAB);
    expect(p.bag.length).toBe(4);
    expect(sim.pickups.some((x) => x.item === 'sujuk')).toBe(true);
  });

  it('lahmacun restores all health', () => {
    const { sim, ps: [p] } = arena(['sc']);
    p.hp = 3;
    spawnFood(sim, 'lahmacun', p.x + 4, p.z, 0);
    press(sim, 'p0', BTN.GRAB);
    expect(p.hp).toBe(p.maxHp);
  });

  it('ayran grants exactly one life, up to the cap', () => {
    const { sim, ps: [p] } = arena();
    const l = p.lives;
    spawnFood(sim, 'ayran', p.x + 4, p.z, 0);
    press(sim, 'p0', BTN.GRAB);
    expect(p.lives).toBe(l + 1);
    run(sim, 40);
    p.lives = MAX_LIVES;
    spawnFood(sim, 'ayran', p.x + 4, p.z, 0);
    press(sim, 'p0', BTN.GRAB);
    expect(p.lives).toBe(MAX_LIVES);
    expect(p.bag).toContain('ayran');
  });

  it('bag items refuse to be wasted and are consumed exactly once', () => {
    const { sim, ps: [p] } = arena();
    p.bag = ['baklava'];
    press(sim, 'p0', BTN.ITEM);
    expect(p.bag).toEqual(['baklava']); // full HP
    p.hp = 20;
    press(sim, 'p0', BTN.ITEM);
    expect(p.hp).toBe(20 + ITEMS.baklava.heal);
    expect(p.bag).toEqual([]);
    run(sim, 30);
    press(sim, 'p0', BTN.ITEM);
    expect(p.hp).toBe(20 + ITEMS.baklava.heal);
  });

  it('banana and sujuk apply real buffs', () => {
    const { sim, ps: [p] } = arena();
    p.hp = 10;
    p.bag = ['banana', 'sujuk'];
    press(sim, 'p0', BTN.ITEM);
    expect(p.speedT).toBeGreaterThan(0);
    run(sim, 30);
    const x0 = p.x; run(sim, 20, { p0: BTN.RIGHT });
    expect(p.x - x0).toBeGreaterThan(1.6 * 20 * 1.2);
    press(sim, 'p0', BTN.ITEM);
    expect(p.powerT).toBeGreaterThan(0);
    run(sim, 30, { p0: 0 });
    const e = enemy(sim, 'kazim', p.x + 18, p.z);
    e.hp = e.maxHp = 500;
    press(sim, 'p0', BTN.LIGHT); run(sim, 10);
    expect(500 - e.hp).toBe(Math.round(4 * 1.3));
  });
});

describe('shops', () => {
  function inShop() {
    const r = arena();
    const { sim, ps: [p] } = r;
    const spot = sim.sectionDef.shops[0];
    p.x = spot.x; p.z = 4; sim.camX = spot.x - 150;
    press(sim, 'p0', BTN.GRAB);
    expect(p.st).toBe('shop');
    return r;
  }
  it('accepts valid purchases and deducts the right amount', () => {
    const { sim, ps: [p] } = inShop();
    p.money = 100;
    const r = sim.command('p0', { c: 'buy', item: 'nutella', nonce: 'n1' });
    expect(r.ok).toBe(true);
    expect(p.money).toBe(100 - ITEMS.nutella.priceTRY);
    expect(p.bag).toEqual(['nutella']);
  });
  it('rejects unaffordable, unstocked, duplicate and out-of-shop purchases', () => {
    const { sim, ps: [p] } = inShop();
    p.money = 10;
    expect(sim.command('p0', { c: 'buy', item: 'nutella', nonce: 'a' }).ok).toBe(false);
    expect(p.money).toBe(10);
    p.money = 1000;
    expect(sim.command('p0', { c: 'buy', item: 'lahmacun', nonce: 'b' }).reason).toBe('not sold here');
    expect(sim.command('p0', { c: 'buy', item: 'nutella', nonce: 'c' }).ok).toBe(true);
    expect(sim.command('p0', { c: 'buy', item: 'nutella', nonce: 'c' }).reason).toBe('duplicate');
    expect(p.bag.length).toBe(1);
    p.bag = ['banana', 'banana', 'banana', 'banana'];
    expect(sim.command('p0', { c: 'buy', item: 'nutella', nonce: 'd' }).reason).toBe('bag full');
    sim.command('p0', { c: 'leave' });
    expect(p.st).toBe('idle');
    p.bag = [];
    expect(sim.command('p0', { c: 'buy', item: 'nutella', nonce: 'e' }).reason).toBe('not in a shop');
  });
  it('the shopper cannot be hurt and enemies ignore them', () => {
    const { sim, ps: [p] } = inShop();
    const e = enemy(sim, 'abi', p.x + 16, p.z);
    e.ai!.cool = 0;
    run(sim, 200);
    expect(p.hp).toBe(p.maxHp);
  });
});
