import { describe, it, expect } from 'vitest';
import { arena, run, press, until, BTN } from './helpers';
import { STREET_DEPTH } from '../src/shared/data/constants';

describe('movement', () => {
  it('walks horizontally and along the street depth axis', () => {
    const { sim, ps: [p] } = arena();
    const x0 = p.x, z0 = p.z;
    run(sim, 30, { p0: BTN.RIGHT });
    expect(p.x).toBeGreaterThan(x0 + 30);
    expect(p.st).toBe('walk');
    run(sim, 20, { p0: BTN.DOWN });
    expect(p.z).toBeGreaterThan(z0 + 10);
    run(sim, 200, { p0: BTN.DOWN });
    expect(p.z).toBe(STREET_DEPTH);
    run(sim, 300, { p0: BTN.UP });
    expect(p.z).toBe(0);
    run(sim, 2, { p0: 0 });
    expect(p.st).toBe('idle');
  });

  it('runs on double-tap and with the run button', () => {
    const { sim, ps: [p] } = arena();
    press(sim, 'p0', BTN.RIGHT); run(sim, 3);
    press(sim, 'p0', BTN.RIGHT, 0);
    sim.setInput('p0', { held: BTN.RIGHT, pressed: 0 });
    run(sim, 10, { p0: BTN.RIGHT });
    expect(p.st).toBe('run');
    run(sim, 5, { p0: 0 });
    run(sim, 10, { p0: BTN.RIGHT | BTN.RUN });
    expect(p.st).toBe('run');
  });

  it('jumps and lands back on the ground', () => {
    const { sim, ps: [p] } = arena();
    press(sim, 'p0', BTN.JUMP);
    expect(p.st).toBe('jump');
    run(sim, 8);
    expect(p.y).toBeGreaterThan(10);
    until(sim, () => p.st === 'idle', 120);
    expect(p.y).toBe(0);
  });

  it('dodge rolls with invulnerability frames', () => {
    const { sim, ps: [p] } = arena();
    const x0 = p.x;
    press(sim, 'p0', BTN.DODGE, BTN.RIGHT);
    expect(p.st).toBe('dodge');
    expect(p.inv).toBeGreaterThan(5);
    until(sim, () => p.st === 'idle', 60);
    expect(p.x).toBeGreaterThan(x0 + 15);
  });

  it('players stay inside the camera window and never block each other', () => {
    const { sim, ps: [a, b] } = arena(['bt', 'sc']);
    b.z = a.z;
    run(sim, 200, { p0: BTN.LEFT });
    expect(a.x).toBeGreaterThanOrEqual(sim.camX + 8);
    b.x = a.x + 4;
    run(sim, 10, { p0: BTN.RIGHT });
    expect(a.x).toBeGreaterThan(b.x); // walked straight through the partner
  });
});
