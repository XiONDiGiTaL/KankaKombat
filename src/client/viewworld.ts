// Adapts a client-side View to the BotWorld interface so the autopilot can play through
// any connection (used by the browser e2e tests and the attract mode).
import type { BotEnt, BotWorld } from '../shared/sim/bot';
import type { View } from '../shared/sim/snapshot';

export function viewWorld(v: View): BotWorld {
  const ent = (id: number) => v.ents.find((e) => e.id === id);
  return {
    phase: v.phase, camX: v.camX,
    players: () => v.players.map((p): BotEnt | null => {
      const e = ent(p.id);
      if (!e) return null;
      return { id: e.id, pid: p.pid, x: e.x, y: e.y, z: e.z, hp: e.hp, maxHp: e.maxHp, st: e.st, atk: e.atk, t: e.t, boss: false, face: e.face, bag: p.bag, sel: p.sel, holdHits: 0 };
    }).filter((x): x is BotEnt => !!x),
    enemies: () => v.ents.filter((e) => !e.player).map((e) => ({ id: e.id, pid: '', x: e.x, y: e.y, z: e.z, hp: e.hp, maxHp: e.maxHp, st: e.st, atk: e.atk, t: e.t, boss: (e.flags & 4) !== 0, face: e.face, bag: [], sel: 0, holdHits: 0 })),
    props: v.props, pickups: v.pickups, hazards: v.hazards,
  };
}
