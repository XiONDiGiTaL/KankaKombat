import { Sim } from '../src/shared/sim/sim';
import { BTN } from '../src/shared/data/input';
import { Ent } from '../src/shared/sim/types';
import { FighterId } from '../src/shared/data/fighters';

/** A started sim in its first street with waves, props and hazards removed. */
export function arena(players: FighterId[] = ['bt'], opts: { seed?: number; chapter?: number } = {}): { sim: Sim; ps: Ent[] } {
  const sim = new Sim({ seed: opts.seed ?? 99, chapter: opts.chapter ?? 0 });
  const ps = players.map((f, i) => sim.addPlayer('p' + i, f, 'T' + i));
  sim.start();
  sim.phase = 'play';
  sim.waveIdx = sim.sectionDef.waves.length;   // no scripted waves
  sim.props = []; sim.pickups = []; sim.hazards = [];
  ps.forEach((p, i) => { p.x = 100; p.z = 20 + i * 20; p.face = 1; p.inv = 0; });
  sim.camX = 0;
  return { sim, ps };
}

export function enemy(sim: Sim, id: string, x: number, z: number): Ent {
  const e = sim.spawnEnemy(id, 'R', z, -1);
  e.x = x; e.z = z; e.face = -1; e.inv = 0;
  e.ai!.mode = 'approach'; e.ai!.cool = 9999; e.ai!.blockT = -99999; // passive, no reactive blocks/dodges
  return e;
}

export function run(sim: Sim, ticks: number, inputs: Record<string, number> = {}): void {
  for (let i = 0; i < ticks; i++) {
    for (const [pid, held] of Object.entries(inputs)) sim.setInput(pid, { held, pressed: 0 });
    sim.step();
  }
}

/** Press a button for one tick (edge + held), then release. */
export function press(sim: Sim, pid: string, btn: number, holdOthers = 0): void {
  sim.setInput(pid, { held: btn | holdOthers, pressed: btn });
  sim.step();
  sim.setInput(pid, { held: holdOthers, pressed: 0 });
}

export function until(sim: Sim, cond: () => boolean, max = 600, inputs: Record<string, number> = {}): number {
  for (let i = 0; i < max; i++) { if (cond()) return i; run(sim, 1, inputs); }
  throw new Error('condition not reached in ' + max + ' ticks');
}

export { BTN };
