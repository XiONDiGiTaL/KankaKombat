// The redesigned food economy: the six street drops are a closed set, every shop stocks its
// own place's food, no shop sells a drop, sit-down shops carry one $150 FULL signature and
// vendors stay cheaper. These tests keep those rules true and buy a meal in Tampa.
import { describe, it, expect } from 'vitest';
import { DROP_IDS, ITEMS, ITEM_IDS, ItemId } from '../src/shared/data/items';
import { SHOPS } from '../src/shared/data/shops';
import { spawnFood } from '../src/shared/sim/items';
import { arena, press, BTN } from './helpers';

const DROPS: ItemId[] = ['ayran', 'banana', 'lahmacun', 'baklava', 'sujuk', 'nutella'];

describe('street drops and shop meals', () => {
  it('keeps the six street drops exactly as they were', () => {
    expect(DROP_IDS).toEqual(DROPS);
    expect(DROPS.map((id) => ITEMS[id].dropWeight)).toEqual([28, 26, 18, 12, 10, 4]);
  });

  it('never rolls a shop meal out of a destructible', () => {
    const { sim } = arena();
    for (let i = 0; i < 600; i++) spawnFood(sim, null, 0, 0, 0);
    const dropped = new Set(sim.pickups.map((pk) => pk.item).filter((id): id is ItemId => !!id));
    expect(dropped.size).toBeGreaterThan(0);
    for (const id of dropped) expect(DROPS).toContain(id);
  });

  it('completes every catalog entry', () => {
    for (const id of ITEM_IDS) {
      const d = ITEMS[id];
      expect(d.id).toBe(id);
      expect(d.name.length).toBeGreaterThan(0);
      expect(d.heal).toBeGreaterThan(0);
      expect(d.price).toBeGreaterThan(0);
      expect(d.desc.length).toBeGreaterThan(0);
    }
  });
});

describe('shop stock', () => {
  const shops = Object.values(SHOPS);

  it('fits every menu in the panel: six rows or fewer, cheapest first', () => {
    for (const shop of shops) {
      expect(shop.stock.length).toBeGreaterThan(0);
      expect(shop.stock.length).toBeLessThanOrEqual(6);
      expect(new Set(shop.stock).size).toBe(shop.stock.length);
      for (const id of shop.stock) expect(ITEM_IDS).toContain(id);
      const prices = shop.stock.map((id) => ITEMS[id].price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    }
  });

  it('never sells the street-drop ladder', () => {
    for (const shop of shops) {
      for (const id of shop.stock) expect(ITEMS[id].dropWeight).toBe(0);
    }
  });

  it('gives the three sit-down shops one $150 FULL restore and nobody else one', () => {
    // full restores belong to bodega / bakkal / tacos; the newsstand and every street
    // booth stay below, so the FULL signature is worth walking indoors for
    const SIT_DOWN = ['bodega', 'bakkal', 'tacos'];
    for (const shop of shops) {
      const full = shop.stock.filter((id) => ITEMS[id].heal === Infinity);
      if (SIT_DOWN.includes(shop.id)) {
        expect(full.length).toBe(1);
        expect(ITEMS[full[0]].price).toBe(150);
      } else {
        expect(full.length).toBe(0);
        for (const id of shop.stock) {
          expect(ITEMS[id].price).toBeLessThan(150);
          expect(ITEMS[id].heal).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  it("sells the keeper's own food, not the next city's", () => {
    expect(SHOPS.bodega.stock).toEqual(['bagel', 'plantain', 'patty', 'knish', 'choppedcheese', 'bronxhero']);
    expect(SHOPS.bodega.stock).not.toContain('taco');
    expect(SHOPS.bakkal.stock).toEqual(expect.arrayContaining(['cay', 'simit', 'pide']));
    expect(SHOPS.bakkal.stock).not.toContain('bagel');
    expect(SHOPS.tacos.stock).toEqual(['tortilla', 'taco', 'quesadilla', 'elote', 'burrito', 'pastor']);
    expect(SHOPS.pazar.stock).toEqual(expect.arrayContaining(['tursu', 'kestane', 'misir', 'midye', 'nar', 'balikekmek']));
    expect(SHOPS.tacotruck.stock).not.toContain('pastor');
  });
});

describe('buying a shop meal', () => {
  it("buys the pastor plate at Lupe's counter and refuses a New York item", () => {
    const { sim, ps: [p] } = arena(['bt'], { chapter: 3 });
    // arena() clears the golf cart's runtime for chapter 3; the lane it runs in never
    // reaches z=4, so a neutral runtime keeps updateHazards happy for the two ticks here.
    sim.hazards = (sim.sectionDef.hazards ?? []).map((h) => ({ kind: h.kind, state: 0, x: -999, dir: 1, z0: h.z0, z1: h.z1, hits: [] }));
    const spot = sim.sectionDef.shops[0];
    expect(spot.shop).toBe('tacos');
    p.x = spot.x; p.z = 4; sim.camX = spot.x - 150;
    press(sim, 'p0', BTN.GRAB);
    expect(p.st).toBe('shop');

    p.money = ITEMS.pastor.price + 5;
    expect(sim.command('p0', { c: 'buy', item: 'pastor', nonce: 'b1' }).ok).toBe(true);
    expect(p.money).toBe(5);
    expect(p.bag).toEqual(['pastor']);
    expect(ITEMS.pastor.heal).toBe(Infinity);
    expect(sim.command('p0', { c: 'buy', item: 'bagel', nonce: 'b2' }).reason).toBe('not sold here');
  });
});
