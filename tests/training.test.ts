import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/shared/sim/sim';
import { BTN } from '../src/shared/data/input';
import { ENEMIES } from '../src/shared/data/enemies';
import { TRAINING, sectionAt } from '../src/shared/data/stages';
import { decode, encode } from '../src/shared/sim/snapshot';
import { press, run, until } from './helpers';

// The training room is a practice tool, not a story section: one dummy on its mark, no
// waves, no exit and no loot. These checks keep the room's promises to the player.

function gym() {
  const sim = new Sim({ seed: 5, training: true });
  const p = sim.addPlayer('p0', 'aynur');
  sim.start();
  sim.phase = 'play'; sim.phaseT = 0;
  const d = sim.byId(sim.trainingDummyId)!;
  return { sim, p, d };
}

function closeIn(p: ReturnType<typeof gym>['p'], d: ReturnType<typeof gym>['d']): void {
  p.x = d.x - 18; p.z = d.z; p.face = 1; p.st = 'idle'; p.t = 0;
}

describe('training room', () => {
  it('loads one quiet room with a live dummy and no story furniture', () => {
    const { sim, p, d } = gym();
    expect(sim.sectionDef).toBe(TRAINING);
    expect(sectionAt(0, 0, true)).toBe(TRAINING);
    expect(sim.enemies().map((e) => e.def)).toEqual(['dummy']);
    expect(sim.props).toEqual([]);
    expect(sim.hazards).toEqual([]);
    expect(sim.pickups).toEqual([]);
    expect(ENEMIES.dummy.dummy).toBe(true);
    expect(d.maxHp).toBe(ENEMIES.dummy.maxHp);
    expect(Math.abs(d.x - 300)).toBeLessThan(1);
    expect(p.x).toBeLessThan(d.x);
    // the room never ends: no waves, no exit trigger and no accidental game over
    run(sim, 400);
    expect(sim.phase).toBe('play');
    expect(sim.byId(d.id)).toBeTruthy();
  });

  it('shows the dummy in the sprite index with the poses the clinch needs', () => {
    const index: Record<string, string> = JSON.parse(readFileSync('public/assets/sprites/index.json', 'utf8'));
    expect(index.dummy).toBe('dummy.json');
    const atlas = JSON.parse(readFileSync('public/assets/sprites/dummy.json', 'utf8')) as {
      count: number; anims: Record<string, { frames: unknown[] }>;
    };
    for (const anim of ['idle', 'hurt', 'hurt2', 'knock', 'down', 'getup', 'held', 'thrown']) {
      expect(atlas.anims[anim]?.frames.length, anim).toBeGreaterThan(0);
    }
  });

  it('grabs, lands five slaps and puts the dummy back on its mark', () => {
    const { sim, p, d } = gym();
    closeIn(p, d);
    press(sim, 'p0', BTN.GRAB);
    expect(p.st).toBe('hold');
    expect(d.heldBy).toBe(p.id);

    for (let i = 0; i < 5; i++) {
      press(sim, 'p0', BTN.LIGHT);
      run(sim, 18);
    }
    expect(p.holdHits).toBe(5);
    expect(p.hold).toBe(-1);
    expect(d.heldBy).toBe(-1);
    expect(['knock', 'down', 'getup']).toContain(d.st);

    run(sim, 200);
    expect(d.st).toBe('idle');
    expect(d.hp).toBe(d.maxHp);
    expect(Math.abs(d.x - 300)).toBeLessThan(1);
    expect(sim.pickups).toEqual([]);
    expect(p.xp).toBe(0);
    expect(p.money).toBe(0);
  });

  it('throws the dummy, knocks it down and stands it up again at home', () => {
    const { sim, p, d } = gym();
    closeIn(p, d);
    press(sim, 'p0', BTN.GRAB);
    expect(p.st).toBe('hold');
    press(sim, 'p0', BTN.HEAVY);
    run(sim, 12);
    expect(p.hold).toBe(-1);
    expect(['thrown', 'knock', 'down']).toContain(d.st);

    // it has to be away from home to prove the reset, not merely back where it started
    expect(Math.abs(d.x - 300)).toBeGreaterThan(1);
    until(sim, () => d.st === 'idle', 400);
    expect(Math.abs(d.x - 300)).toBeLessThan(1);
    expect(d.hp).toBe(d.maxHp);
  });

  it('tags the snapshot as training so the client draws the gym, not New York', () => {
    const { sim } = gym();
    const v = decode(encode(sim, []));
    expect(v.training).toBe(true);
    expect(encode(sim, []).tr).toBe(1);
    const story = new Sim({ seed: 5 });
    expect(encode(story, []).tr).toBe(0);
    expect(decode(encode(story, [])).training).toBe(false);
  });
});
