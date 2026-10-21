import { describe, it, expect } from 'vitest';
import { arena, run, until } from './helpers';
import { Sim } from '../src/shared/sim/sim';
import { Bot } from '../src/shared/sim/bot';
import { CHAPTERS } from '../src/shared/data/stages';
import { START_LIVES } from '../src/shared/data/constants';

describe('lives, respawn and game over', () => {
  it('a death costs a life and respawns the player with full health', () => {
    const { sim, ps: [p] } = arena();
    p.hp = 0;
    until(sim, () => p.st === 'dead', 5);
    until(sim, () => p.st === 'idle' && p.hp === p.maxHp, 200);
    expect(p.lives).toBe(START_LIVES - 1);
    expect(p.inv).toBeGreaterThan(0);
  });
  it('the last life leads to game over; continue revives everyone with half the money', () => {
    const { sim, ps: [p] } = arena();
    p.lives = 1; p.money = 101; p.hp = 0;
    until(sim, () => sim.phase === 'gameover', 300);
    expect(p.st).toBe('out');
    sim.setInput('p0', { held: 8192, pressed: 8192 });
    sim.step();
    expect(sim.phase).toBe('play');
    expect(p.lives).toBe(START_LIVES);
    expect(p.money).toBe(50);
  });
  it('one player dying does not touch the partner', () => {
    const { sim, ps: [a, b] } = arena(['bt', 'sc']);
    b.money = 77; a.lives = 1; a.hp = 0;
    run(sim, 200);
    expect(a.st).toBe('out');
    expect(sim.phase).toBe('play');
    expect(b.money).toBe(77);
    expect(b.lives).toBe(START_LIVES);
  });
});

describe('stage flow', () => {
  it('waves lock the camera until cleared', () => {
    const sim = new Sim({ seed: 5 });
    const p = sim.addPlayer('p0', 'bt');
    sim.start();
    until(sim, () => sim.phase === 'play', 200);
    const w = sim.sectionDef.waves[0];
    p.z = 40;
    until(sim, () => sim.lockX !== null, 2000, { p0: 2 });
    expect(sim.lockX).toBe(w.at);
    run(sim, 200, { p0: 2 });
    expect(sim.camX).toBeLessThanOrEqual(w.at);
    for (const e of sim.enemies()) { e.hp = 0; sim.reward(e); }
    sim.spawnQ = [];
    run(sim, 3, { p0: 0 });
    expect(sim.lockX).toBeNull();
    void p;
  });

  it('defeating a boss clears the chapter and moves on, converting currency at the US border', () => {
    const sim = new Sim({ seed: 3, chapter: 1, section: 2 });
    const p = sim.addPlayer('p0', 'sc');
    sim.start();
    p.money = 345;
    until(sim, () => sim.phase === 'boss', 400);
    const boss = sim.byId(sim.bossId)!;
    boss.hp = 0; sim.reward(boss);
    until(sim, () => sim.phase === 'chapterclear', 400);
    until(sim, () => sim.chapter === 2, 1000);
    expect(sim.currency).toBe('USD');
    // ₺345 + the ₺350 boss purse, converted at ₺10 = $1
    expect(p.money).toBe(Math.floor((345 + 350) / 10));
  });

  it('every chapter has distinct sections and a unique boss', () => {
    const bosses = CHAPTERS.map((c) => c.sections.find((s) => s.boss)?.boss);
    expect(new Set(bosses).size).toBe(4);
    const themes = CHAPTERS.flatMap((c) => c.sections.map((s) => s.theme));
    expect(new Set(themes).size).toBe(themes.length);
    for (const c of CHAPTERS) expect(c.sections.filter((s) => s.shops.length).length).toBeGreaterThanOrEqual(1);
  });
});

describe('full campaign (autopilot through real inputs)', () => {
  it('two bots can finish all four chapters', () => {
    const sim = new Sim({ seed: 42 });
    const bots = [new Bot('a', 0), new Bot('b', 1)];
    sim.addPlayer('a', 'bt'); sim.addPlayer('b', 'sc');
    sim.start();
    const bossesBeaten = new Set<string>();
    for (let i = 0; i < 60 * 60 * 40 && sim.phase !== 'victory' && sim.phase !== 'final'; i++) {
      for (const b of bots) sim.setInput(b.pid, b.think(sim));
      sim.step();
      if (sim.phase === 'bossdown') bossesBeaten.add(sim.sectionDef.boss!);
    }
    expect(sim.phase).toBe('victory');
    expect([...bossesBeaten].sort()).toEqual(['gus', 'kemal', 'malone', 'selim']);
  }, 240_000);
});
