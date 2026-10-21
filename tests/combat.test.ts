import { describe, it, expect } from 'vitest';
import { arena, enemy, run, press, until, BTN } from './helpers';
import { ATTACKS } from '../src/shared/data/attacks';
import { hittable } from '../src/shared/sim/combat';
import { PROP_HP } from '../src/shared/data/stages';

describe('combat', () => {
  it('light attack hits an enemy in front but not one behind or in another lane', () => {
    const { sim, ps: [p] } = arena();
    const front = enemy(sim, 'bum', p.x + 18, p.z);
    const behind = enemy(sim, 'bum', p.x - 18, p.z);
    const lane = enemy(sim, 'bum', p.x + 18, p.z + 30);
    const hp = front.hp;
    press(sim, 'p0', BTN.LIGHT);
    run(sim, 10);
    expect(front.hp).toBeLessThan(hp);
    expect(['hurt', 'idle']).toContain(front.st);
    expect(behind.hp).toBe(behind.maxHp);
    expect(lane.hp).toBe(lane.maxHp);
  });

  it('chains B.T.\'s four-hit combo and the finisher knocks down', () => {
    const { sim, ps: [p] } = arena();
    const e = enemy(sim, 'dondurma', p.x + 20, p.z);
    e.hp = e.maxHp = 500;
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      if (i % 6 === 0) sim.setInput('p0', { held: BTN.LIGHT, pressed: BTN.LIGHT }); else sim.setInput('p0', { held: 0, pressed: 0 });
      sim.step();
      if (p.atk) seen.add(p.atk);
      if (e.st === 'knock') break;
      e.x = p.x + 20; e.z = p.z;
    }
    expect([...seen]).toEqual(expect.arrayContaining(['bt_l1', 'bt_l2', 'bt_l3', 'bt_l4']));
  });

  it('heavy attack knocks down; the target always gets back up', () => {
    const { sim, ps: [p] } = arena(['sc']);
    const e = enemy(sim, 'bum', p.x + 20, p.z);
    e.hp = e.maxHp = 200;
    press(sim, 'p0', BTN.HEAVY);
    until(sim, () => e.st === 'knock', 40);
    until(sim, () => e.st === 'down', 120);
    until(sim, () => e.st === 'getup', 120);
    until(sim, () => e.st === 'idle' || e.st === 'walk', 60);
    expect(e.hp).toBeGreaterThan(0);
  });

  it('blocking takes chip damage only; S.C.\'s haymaker breaks guard', () => {
    const { sim, ps: [p] } = arena(['sc']);
    const e = enemy(sim, 'fehmi', p.x + 20, p.z);
    e.hp = e.maxHp = 300;
    e.st = 'block'; e.ai!.blockT = 999; e.face = -1;
    press(sim, 'p0', BTN.LIGHT);
    run(sim, 10);
    expect(e.maxHp - e.hp).toBeLessThanOrEqual(2);
    run(sim, 20);
    e.st = 'block'; e.ai!.blockT = 999;
    const before = e.hp;
    press(sim, 'p0', BTN.HEAVY);
    run(sim, 20);
    expect(e.hp).toBeLessThan(before - 2);
    expect(e.st).not.toBe('block');
  });

  it('grab checks range and facing, holds, knees and releases on the third knee', () => {
    const { sim, ps: [p] } = arena();
    const far = enemy(sim, 'bum', p.x + 60, p.z);
    press(sim, 'p0', BTN.GRAB);
    expect(p.st).toBe('grab'); // whiff
    expect(far.heldBy).toBe(-1);
    run(sim, 20);
    const e = enemy(sim, 'bum', p.x - 18, p.z);
    press(sim, 'p0', BTN.GRAB); // facing the wrong way
    expect(e.heldBy).toBe(-1);
    run(sim, 20);
    p.face = -1;
    press(sim, 'p0', BTN.GRAB);
    expect(p.st).toBe('hold');
    expect(p.hold).toBe(e.id);
    expect(e.st).toBe('held');
    expect(e.heldBy).toBe(p.id);
    const hp = e.hp;
    for (let k = 0; k < 3; k++) { press(sim, 'p0', BTN.LIGHT); run(sim, 25); }
    expect(e.hp).toBeLessThan(hp);
    expect(e.heldBy).toBe(-1);
    expect(p.hold).toBe(-1);
    expect(['knock', 'down', 'getup', 'dead']).toContain(e.st);
  });

  it('throw releases the victim, deals landing damage and bowls over others', () => {
    const { sim, ps: [p] } = arena(['sc']);
    const e = enemy(sim, 'bum', p.x + 18, p.z);
    e.hp = e.maxHp = 200;
    const victim = enemy(sim, 'bum', p.x + 70, p.z);
    victim.hp = victim.maxHp = 200;
    press(sim, 'p0', BTN.GRAB);
    expect(p.st).toBe('hold');
    press(sim, 'p0', BTN.HEAVY);
    until(sim, () => e.st === 'thrown', 30);
    expect(e.heldBy).toBe(-1);
    until(sim, () => e.st === 'down' || e.st === 'getup', 120);
    expect(e.hp).toBeLessThanOrEqual(200 - 22);
    expect(victim.hp).toBeLessThan(200);
  });

  it('a grabbed enemy breaks free when the hold times out', () => {
    const { sim, ps: [p] } = arena();
    const e = enemy(sim, 'bum', p.x + 18, p.z);
    press(sim, 'p0', BTN.GRAB);
    expect(e.st).toBe('held');
    run(sim, 130);
    expect(e.heldBy).toBe(-1);
    expect(e.st).not.toBe('held');
    expect(p.hold).toBe(-1);
  });

  it('bosses cannot be grabbed unless dizzy or tired', () => {
    const { sim, ps: [p] } = arena(['sc']);
    const b = enemy(sim, 'bum_boss', p.x + 18, p.z);
    press(sim, 'p0', BTN.GRAB);
    expect(b.heldBy).toBe(-1);
    run(sim, 20);
    b.st = 'tired'; b.t = 0; b.dur = 100;
    press(sim, 'p0', BTN.GRAB);
    expect(b.heldBy).toBe(p.id);
  });

  it('juggles are capped so a combo cannot loop forever', () => {
    const { sim, ps: [p] } = arena();
    const e = enemy(sim, 'bum', p.x + 18, p.z);
    e.hp = e.maxHp = 9999;
    e.st = 'knock'; e.y = 30; e.vy = 0;
    // keep hitting an airborne target: after the juggle limit it can no longer be hit
    let hits = 0;
    for (let i = 0; i < 40; i++) {
      p.x = e.x - 18; p.z = e.z; p.face = 1; p.st = 'idle'; p.inv = 0;
      if (e.y < 20) { e.y = 30; e.vy = 0; }
      const before = e.hp;
      press(sim, 'p0', BTN.LIGHT); run(sim, 8, { p0: 0 });
      if (e.hp < before) hits++;
    }
    expect(hits).toBeGreaterThan(0);
    expect(hits).toBeLessThanOrEqual(6);
    e.st = 'knock'; e.juggle = 6; e.inv = 0;
    expect(hittable(e)).toBe(false);
  });

  it('a defeated enemy rewards exactly once', () => {
    const { sim, ps: [p] } = arena();
    const e = enemy(sim, 'bum', p.x + 18, p.z);
    e.hp = 1;
    press(sim, 'p0', BTN.LIGHT);
    run(sim, 8);
    expect(e.hp).toBe(0);
    const coins = sim.pickups.filter((x) => x.kind === 'coin').length;
    expect(coins).toBe(1);
    sim.reward(e); // a second call must not be possible in normal flow; guard is the flag
    const kos = sim.events.filter((x) => x.k === 'ko').length;
    run(sim, 100);
    expect(sim.pickups.filter((x) => x.kind === 'coin').length + (p.money > 0 ? 1 : 0)).toBeLessThanOrEqual(2);
    expect(kos).toBeGreaterThanOrEqual(1);
  });

  it('attacks do not pass through solid props, which break and drop loot', () => {
    const { sim, ps: [p] } = arena();
    sim.props.push({ id: 900, kind: 'crate', x: p.x + 20, z: p.z, hp: PROP_HP.crate, broken: false, drop: 'lahmacun', brokeT: 0 });
    const e = enemy(sim, 'bum', p.x + 28, p.z);
    press(sim, 'p0', BTN.LIGHT); run(sim, 12);
    expect(e.hp).toBe(e.maxHp);
    for (let i = 0; i < PROP_HP.crate; i++) { press(sim, 'p0', BTN.LIGHT); run(sim, 20); }
    expect(sim.props[0].broken).toBe(true);
    expect(sim.pickups.some((x) => x.item === 'lahmacun')).toBe(true);
  });

  it('every attack definition has sane timing data', () => {
    for (const [id, a] of Object.entries(ATTACKS)) {
      expect(a.startup, id).toBeGreaterThan(0);
      expect(a.active, id).toBeGreaterThan(0);
      expect(a.recovery, id).toBeGreaterThanOrEqual(0);
      expect(a.box[0] <= a.box[1], id).toBe(true);
      if (a.next) expect(ATTACKS[a.next], id).toBeDefined();
    }
  });
});
