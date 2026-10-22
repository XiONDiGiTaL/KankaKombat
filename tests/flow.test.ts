import { describe, it, expect } from 'vitest';
import { arena, run, until } from './helpers';
import { Sim } from '../src/shared/sim/sim';
import { Bot } from '../src/shared/sim/bot';
import { CHAPTERS } from '../src/shared/data/stages';
import { THEMES } from '../src/shared/data/music';
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

  it('defeating a boss clears the chapter and moves on; cash carries over and the local symbol changes', () => {
    const sim = new Sim({ seed: 3, chapter: 1, section: 3 });
    const p = sim.addPlayer('p0', 'sc');
    sim.start();
    p.money = 345;
    until(sim, () => sim.phase === 'boss', 400);
    const boss = sim.byId(sim.bossId)!;
    boss.hp = 0; sim.reward(boss);
    until(sim, () => sim.phase === 'chapterclear', 400);
    until(sim, () => sim.chapter === 2, 1000);
    expect(sim.currency).toBe('TRY');
    // one wallet all campaign long: the boss purse lands as coins, nothing is converted
    expect(p.money).toBeGreaterThanOrEqual(345);
  });

  it('every chapter has distinct sections and a unique boss', () => {
    const bosses = CHAPTERS.map((c) => c.sections.find((s) => s.boss)?.boss);
    expect(new Set(bosses).size).toBe(4);
    const themes = CHAPTERS.flatMap((c) => c.sections.map((s) => s.theme));
    expect(new Set(themes).size).toBe(themes.length);
    for (const c of CHAPTERS) expect(c.sections.filter((s) => s.shops.length).length).toBeGreaterThanOrEqual(1);
  });

  it('gives every chapter one peaceful stretch, between two fights and the boss', () => {
    for (const c of CHAPTERS) {
      const idx = c.sections.map((s, i) => (s.peace ? i : -1)).filter((i) => i >= 0);
      expect(idx, `${c.id} has one plaza`).toHaveLength(1);
      const peace = c.sections[idx[0]];
      // a town is not a fight: nothing spawns, nothing runs the player down
      expect(peace.waves).toEqual([]);
      expect(peace.hazards ?? []).toEqual([]);
      expect(peace.boss).toBeUndefined();
      // and it is where the money goes: both a shop front and a stall
      expect(peace.shops.length).toBeGreaterThanOrEqual(2);
      // it sits after a fighting street and before the boss arena
      const before = c.sections.slice(0, idx[0]);
      const after = c.sections.slice(idx[0] + 1);
      expect(before.some((s) => s.waves.length), `${c.id} fights before the plaza`).toBe(true);
      expect(after.some((s) => s.boss), `${c.id} boss after the plaza`).toBe(true);
    }
  });
});

describe('stage pacing', () => {
  // Each chapter carries one supplied theme (2:18–2:57 long), so a chapter has to run long
  // enough for that track to play through instead of being cut off by the clear screen, and
  // short enough that it is not a second full loop. Measured from the start of the first
  // street to the chapter-clear screen, with two bots playing through the real input path.
  // A solo run plays the same content with one fighter, so it runs longer and the theme
  // loops once; the co-op pace is the one the soundtrack is cut to.
  it('every chapter plays its whole theme and clears in about two to three minutes', () => {
    const seconds: Record<string, number> = {};
    for (let ch = 0; ch < CHAPTERS.length; ch++) {
      const sim = new Sim({ seed: 42, chapter: ch, section: 0 });
      const bots = [new Bot('a', 0), new Bot('b', 1)];
      sim.addPlayer('a', 'bt'); sim.addPlayer('b', 'sc');
      sim.start();
      let cleared = 0;
      for (let i = 0; i < 60 * 60 * 12 && !cleared; i++) {
        for (const b of bots) sim.setInput(b.pid, b.think(sim));
        sim.step();
        if (sim.phase === 'chapterclear' || sim.phase === 'victory') cleared = i;
        if (sim.phase === 'gameover' || sim.phase === 'final') break;
      }
      expect(cleared, `${CHAPTERS[ch].id} never cleared`).toBeGreaterThan(0);
      seconds[CHAPTERS[ch].id] = cleared / 60;
    }
    for (const [id, s] of Object.entries(seconds)) {
      const theme = THEMES[CHAPTERS.find((c) => c.id === id)!.music].seconds;
      // the outro's last bars may land just after the clear screen, but no chapter may end
      // a whole verse early — that is the track being skipped, which is what this guards
      expect(s, `${id} cleared in ${s.toFixed(1)}s, theme ${theme}s`).toBeGreaterThanOrEqual(theme - 15);
      // and it stays inside one playthrough plus a short tail, not a second loop
      expect(s, `${id} cleared in ${s.toFixed(1)}s, theme ${theme}s`).toBeLessThanOrEqual(theme + 60);
      expect(s, `${id} cleared in ${s.toFixed(1)}s`).toBeGreaterThanOrEqual(120);
      expect(s, `${id} cleared in ${s.toFixed(1)}s`).toBeLessThanOrEqual(200);
    }
  }, 120_000);
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
    expect([...bossesBeaten].sort()).toEqual(CHAPTERS.map((c) => c.sections.find((x) => x.boss)!.boss).sort());
  }, 240_000);
});
