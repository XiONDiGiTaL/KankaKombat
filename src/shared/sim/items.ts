// Currency, food, inventory and shops. Rules (all enforced on the authority):
// - Coins are collected by touch and credited to whoever touches them first.
// - Food is picked up with GRAB. If it would help right now it is eaten immediately;
//   otherwise (full HP / max lives) it goes into the 4-slot bag; if the bag is full it stays.
// - Bag items refuse to be used when they would be wasted.
// - Purchases need the shop's stock, enough money and a free bag slot.

import { BAG_SLOTS } from '../data/constants';
import { ITEMS, ITEM_IDS, ItemId } from '../data/items';
import { SHOPS } from '../data/shops';
import type { Sim } from './sim';
import { Ent, Prop } from './types';
import { setState } from './combat';

export function spawnCoin(sim: Sim, amount: number, x: number, z: number): void {
  sim.pickups.push({ id: sim.nextId++, kind: 'coin', item: null, amount, x, y: 2, z, vy: 2.6, ttl: 60 * 30, taken: false });
}

export function spawnFood(sim: Sim, item: ItemId | null, x: number, z: number, vy: number): void {
  const it = item ?? sim.rng.weighted(ITEM_IDS.map((id) => ({ w: ITEMS[id].dropWeight, v: id })));
  sim.pickups.push({ id: sim.nextId++, kind: 'food', item: it, amount: 0, x, y: vy > 0 ? 2 : 0, z, vy, ttl: 60 * 25, taken: false });
}

export function updatePickups(sim: Sim): void {
  for (const pk of sim.pickups) {
    if (pk.taken) continue;
    if (pk.y > 0 || pk.vy > 0) { pk.y += pk.vy; pk.vy -= 0.22; if (pk.y <= 0) { pk.y = 0; pk.vy = pk.vy < -1.5 ? -pk.vy * 0.4 : 0; } }
    if (pk.ttl > 0 && --pk.ttl === 0) { pk.taken = true; continue; }
    if (pk.kind !== 'coin') continue;
    for (const p of sim.livePlayers()) {
      if (p.st === 'shop' || p.st === 'held' || p.y > 12) continue;
      if (Math.abs(p.x - pk.x) < 13 && Math.abs(p.z - pk.z) < 9) {
        pk.taken = true;
        p.money += pk.amount;
        sim.emit({ k: 'coin', id: p.id, amt: pk.amount });
        break;
      }
    }
  }
  sim.pickups = sim.pickups.filter((p) => !p.taken);
}

/** Apply an item's effect. Returns false (and changes nothing) if it would be wasted. */
function consume(sim: Sim, p: Ent, item: ItemId): boolean {
  const d = ITEMS[item];
  if (p.hp >= p.maxHp) return false;
  p.hp = d.heal === Infinity ? p.maxHp : Math.min(p.maxHp, p.hp + d.heal);
  setState(p, 'eat'); p.vx = 0; p.vz = 0;
  sim.emit({ k: 'eat', id: p.id, item });
  return true;
}

export function nearShop(sim: Sim, p: Ent): string | null {
  if (sim.phase !== 'play' || sim.lockX !== null) return null;
  for (const s of sim.sectionDef.shops) if (Math.abs(p.x - s.x) < 24 && p.z < 16) return s.shop;
  return null;
}

/** GRAB pressed: shop door first, then food on the ground. */
export function tryInteract(sim: Sim, p: Ent): boolean {
  if (nearShop(sim, p)) {
    setState(p, 'shop'); p.vx = 0; p.vz = 0;
    return true;
  }
  let best = null as (typeof sim.pickups)[number] | null, bd = Infinity;
  for (const pk of sim.pickups) {
    if (pk.taken || pk.kind !== 'food' || pk.y > 6) continue;
    const d = Math.abs(pk.x - p.x) + Math.abs(pk.z - p.z);
    if (Math.abs(pk.x - p.x) < 18 && Math.abs(pk.z - p.z) < 10 && d < bd) { best = pk; bd = d; }
  }
  if (!best || !best.item) return false;
  if (consume(sim, p, best.item)) { best.taken = true; return true; }
  if (p.bag.length < BAG_SLOTS) {
    p.bag.push(best.item); best.taken = true;
    setState(p, 'pickup');
    sim.emit({ k: 'stash', id: p.id, item: best.item });
    return true;
  }
  sim.emit({ k: 'msg', id: p.id, text: 'BAG FULL!' });
  return true;
}

export function useItem(sim: Sim, p: Ent, slot: number): { ok: boolean; reason?: string } {
  if (!Number.isInteger(slot) || slot < 0 || slot >= p.bag.length) return { ok: false, reason: 'empty slot' };
  if (!['idle', 'walk', 'run', 'block', 'shop'].includes(p.st)) return { ok: false, reason: 'busy' };
  const item = p.bag[slot];
  const wasShop = p.st === 'shop';
  if (!consume(sim, p, item)) {
    const text = 'FULL HP!';
    sim.emit({ k: 'msg', id: p.id, text });
    return { ok: false, reason: text };
  }
  if (wasShop) setState(p, 'shop');
  p.bag.splice(slot, 1);
  p.sel = Math.min(p.sel, Math.max(0, p.bag.length - 1));
  return { ok: true };
}

export function buyItem(sim: Sim, p: Ent, item: string): { ok: boolean; reason?: string } {
  if (p.st !== 'shop') return { ok: false, reason: 'not in a shop' };
  const shopId = nearShop(sim, p);
  const shop = shopId ? SHOPS[shopId] : null;
  if (!shop || !shop.stock.includes(item as ItemId)) return { ok: false, reason: 'not sold here' };
  const d = ITEMS[item as ItemId];
  const price = d.price;
  if (p.money < price) { sim.emit({ k: 'msg', id: p.id, text: 'NOT ENOUGH MONEY' }); return { ok: false, reason: 'not enough money' }; }
  if (p.bag.length >= BAG_SLOTS) { sim.emit({ k: 'msg', id: p.id, text: 'BAG FULL!' }); return { ok: false, reason: 'bag full' }; }
  p.money -= price;
  p.bag.push(d.id);
  sim.emit({ k: 'buy', id: p.id, item: d.id, price });
  return { ok: true };
}

export function breakProp(sim: Sim, pr: Prop, dmg: number): void {
  if (pr.broken) return;
  pr.hp -= dmg;
  sim.emit({ k: 'hit', x: pr.x, y: 10, z: pr.z, heavy: false, dmg: 0, tgt: -1 });
  if (pr.hp > 0) { sim.emit({ k: 'prophit', id: pr.id, x: pr.x, z: pr.z, hp: pr.hp }); return; }
  pr.broken = true;
  sim.emit({ k: 'break', x: pr.x, z: pr.z, id: pr.id });
  if (pr.drop === 'coin') spawnCoin(sim, sim.currency === 'TRY' ? sim.rng.int(15, 40) : sim.rng.int(2, 4), pr.x, pr.z);
  else if (pr.drop) spawnFood(sim, pr.drop as ItemId, pr.x, pr.z, 2.5);
}
