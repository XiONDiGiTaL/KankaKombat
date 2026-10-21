// Dev: run the whole campaign headless with bots and print progress.
import { Sim } from '../../src/shared/sim/sim';
import { Bot } from '../../src/shared/sim/bot';

const n = Number(process.argv[2] ?? 2);
const god = process.argv[3] === 'god';
const sim = new Sim({ seed: 42, godMode: god });
const bots: Bot[] = [];
const fighters = ['bt', 'sc'] as const;
for (let i = 0; i < n; i++) { sim.addPlayer('p' + i, fighters[i % 2], 'Bot' + i); bots.push(new Bot('p' + i, i)); }
sim.start();
let last = '';
const maxTicks = 60 * 60 * 40;
for (let i = 0; i < maxTicks; i++) {
  for (const b of bots) sim.setInput(b.pid, b.think(sim));
  sim.step();
  const key = `${sim.chapter}.${sim.section} ${sim.phase}`;
  if (key !== last) {
    last = key;
    console.log(`[${(sim.tick / 60).toFixed(0)}s] ${key} cam=${sim.camX | 0} ` + sim.players().map((p) => `${p.def}:hp${p.hp}/${p.maxHp} L${p.lives} $${p.money} lv${p.lvl} bag[${p.bag}]`).join(' | '));
  }
  if (sim.phase === 'victory' || sim.phase === 'final') break;
  if (i % 3600 === 0 && i) console.log(`  .. t=${i / 60}s wave=${sim.waveIdx} lock=${sim.lockX} enemies=${sim.enemies().map((e) => e.def + ':' + e.st + ':' + e.hp + '@' + (e.x | 0)).join(',')} players=${sim.players().map((p) => p.st + '@' + (p.x | 0) + ',' + (p.z | 0)).join(' ')}`);
}
console.log('END', sim.phase, (sim.tick / 60).toFixed(0) + 's');
