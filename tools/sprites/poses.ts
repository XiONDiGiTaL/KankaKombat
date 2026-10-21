// Animation library. Each animation is a list of frames (pose + duration in 60 Hz ticks).
// Attack frames carry a phase tag (s = startup, a = active, r = recovery) so the renderer
// can stay in lock-step with the simulation's attack timing rather than wall-clock time.

import { Pose } from './rig';

export interface Frame { p: Pose; t: number; ph?: 's' | 'a' | 'r' }
export interface Anim { frames: Frame[]; loop: boolean }
export type AnimSet = Record<string, Anim>;

const G: Pose = { af: [22, 112], ab: [14, 118], lf: [14, 6], lb: [-12, 6], fistF: 2.2, fistB: 2 }; // guard stance
const f = (p: Pose, t: number, ph?: Frame['ph']): Frame => ({ p, t, ph });
const m = (...ps: Pose[]): Pose => Object.assign({}, ...ps);

function walkCycle(n: number, swing: number, lean: number, armSwing: number, kneeLift: number): Frame[] {
  const out: Frame[] = [];
  for (let i = 0; i < n; i++) {
    const ph = (i / n) * Math.PI * 2;
    const s = Math.sin(ph), c = Math.cos(ph);
    out.push(f({
      lean, by: Math.abs(c) < 0.5 ? -1 : 0,
      lf: [swing * s, kneeLift * Math.max(0, -c) + 6],
      lb: [-swing * s, kneeLift * Math.max(0, c) + 6],
      af: [-armSwing * s + 10, 70], ab: [armSwing * s - 5, 70],
    }, 5));
  }
  return out;
}

export function commonAnims(): AnimSet {
  return {
    idle: { loop: true, frames: [f(m(G), 14), f(m(G, { by: 1 }), 12), f(m(G, { by: 1, face: 'blink' }), 6), f(m(G), 14)] },
    walk: { loop: true, frames: walkCycle(8, 26, 4, 30, 30) },
    run: { loop: true, frames: walkCycle(6, 42, 14, 55, 60).map((x) => ({ ...x, t: 4, p: { ...x.p, af: [x.p.af![0] + 10, 100] as [number, number], ab: [x.p.ab![0], 100] as [number, number] } })) },
    jump: { loop: false, frames: [f({ lf: [45, 80], lb: [-5, 70], af: [120, 30], ab: [-40, 30], by: -2 }, 8)] },
    fall: { loop: false, frames: [f({ lf: [20, 30], lb: [-15, 20], af: [100, 20], ab: [-60, 20] }, 8)] },
    land: { loop: false, frames: [f({ by: 4, lean: 10, lf: [40, 80], lb: [-20, 70], af: [40, 30], ab: [-30, 30] }, 6)] },
    crouch: { loop: true, frames: [f({ by: 6, lean: 8, lf: [55, 105], lb: [-25, 85], af: [30, 110], ab: [20, 110] }, 30)] },
    crouchwalk: { loop: true, frames: [f({ by: 6, lean: 8, lf: [65, 110], lb: [-35, 80], af: [30, 110], ab: [20, 110] }, 8), f({ by: 6, lean: 8, lf: [40, 95], lb: [-15, 90], af: [30, 110], ab: [20, 110] }, 8)] },
    hurt: { loop: false, frames: [f({ lean: -16, hx: -1, bx: -1, face: 'hurt', af: [40, 40], ab: [-50, 30], lf: [16, 6], lb: [-14, 6] }, 10), f({ lean: -8, face: 'hurt', af: [30, 60], ab: [-30, 40], lf: [14, 6], lb: [-12, 6] }, 10)] },
    hurt2: { loop: false, frames: [f({ lean: 24, hx: 1, hy: 1, by: 1, face: 'hurt', af: [10, 40], ab: [-10, 40], lf: [14, 10], lb: [-12, 10] }, 10), f({ lean: 14, face: 'hurt', af: [10, 60], ab: [0, 50] }, 10)] },
    knock: { loop: false, frames: [f({ lean: -45, face: 'hurt', lf: [55, 20], lb: [35, 10], af: [150, 10], ab: [170, 10], hx: -1 }, 30)] },
    down: { loop: false, frames: [f({ rot: -90, face: 'ko', lf: [6, 0], lb: [-4, 0], af: [30, 30], ab: [-20, 20] }, 30)] },
    getup: { loop: false, frames: [f({ by: 11, lean: -28, lf: [80, 10], lb: [70, 40], af: [-40, 20], ab: [-30, 20], face: 'hurt' }, 12), f({ by: 6, lean: 12, lf: [55, 105], lb: [-25, 85], af: [30, 60], ab: [20, 60] }, 12)] },
    grab: { loop: false, frames: [f({ lean: 10, bx: 1, af: [85, 15], ab: [72, 25], lf: [22, 6], lb: [-16, 6] }, 8)] },
    hold: { loop: true, frames: [f({ lean: 6, af: [72, 55], ab: [62, 65], lf: [18, 6], lb: [-14, 6] }, 20), f({ lean: 6, by: 1, af: [72, 55], ab: [62, 65], lf: [18, 6], lb: [-14, 6] }, 20)] },
    grabatk: { loop: false, frames: [f({ lean: 4, af: [72, 55], ab: [62, 65], lf: [40, 80], lb: [-10, 6] }, 5, 's'), f({ lean: 10, by: -1, af: [75, 50], ab: [65, 60], lf: [85, 125], lb: [-5, 4], face: 'shout' }, 6, 'a'), f({ lean: 4, af: [72, 55], ab: [62, 65], lf: [25, 30], lb: [-14, 6] }, 6, 'r')] },
    throw: { loop: false, frames: [f({ lean: -22, af: [160, 25], ab: [150, 25], lf: [20, 10], lb: [-20, 10], face: 'shout' }, 8, 's'), f({ lean: 30, bx: 2, af: [100, 0], ab: [95, 5], lf: [35, 20], lb: [-30, 10], face: 'shout' }, 6, 'a'), f({ lean: 14, af: [70, 20], ab: [60, 20], lf: [25, 15], lb: [-20, 10] }, 10, 'r')] },
    block: { loop: true, frames: [f({ lean: -6, by: 1, af: [45, 125], ab: [38, 130], fistF: 2.4, fistB: 2.4, lf: [16, 12], lb: [-16, 10], face: 'angry' }, 30)] },
    dodge: { loop: false, frames: [f({ lean: 40, by: 7, lf: [70, 130], lb: [40, 120], af: [60, 120], ab: [50, 120] }, 4), f({ rot: 90, dy: -3, lean: 40, by: 7, lf: [70, 130], lb: [40, 120], af: [60, 120], ab: [50, 120] }, 6), f({ lean: 30, by: 6, lf: [60, 120], lb: [-20, 90], af: [40, 110], ab: [30, 110] }, 6)] },
    eat: { loop: true, frames: [f({ af: [35, 140], ab: [-6, 20], hold: 'food', face: 'eat' }, 8), f({ af: [30, 135], ab: [-6, 20], hold: 'food', face: 'happy' }, 8)] },
    pickup: { loop: false, frames: [f({ by: 5, lean: 26, af: [40, 0], ab: [-10, 20], lf: [45, 90], lb: [-20, 70] }, 10)] },
    victory: { loop: true, frames: [f({ af: [172, 0], ab: [-25, 40], face: 'happy', lf: [10, 0], lb: [-12, 0] }, 20), f({ af: [168, 10], ab: [-25, 40], by: -1, face: 'happy', lf: [10, 0], lb: [-12, 0] }, 20)] },
    defeat: { loop: true, frames: [f({ rot: -90, face: 'ko', lf: [6, 0], lb: [-4, 0], af: [30, 30], ab: [-20, 20] }, 60)] },
    ready: { loop: true, frames: [f({ af: [100, 130], ab: [-10, 30], face: 'n', lf: [10, 0], lb: [-10, 0] }, 12), f({ af: [165, 10], ab: [-10, 30], face: 'happy', by: -1, lf: [10, 0], lb: [-10, 0] }, 16)] },
    dizzy: { loop: true, frames: [f({ lean: -8, face: 'ko', af: [-5, 10], ab: [5, 10], lf: [10, 4], lb: [-10, 4] }, 14), f({ lean: 8, bx: 1, face: 'ko', af: [-5, 10], ab: [5, 10], lf: [10, 4], lb: [-10, 4] }, 14)] },
    held: { loop: true, frames: [f({ lean: -10, face: 'hurt', af: [40, 50], ab: [-30, 30], lf: [5, 10], lb: [-5, 10], by: -2 }, 20)] },
    thrown: { loop: true, frames: [f({ rot: -90, dy: -10, face: 'hurt', lf: [40, 20], lb: [20, 10], af: [150, 10], ab: [170, 10] }, 8), f({ rot: 90, dy: -10, face: 'hurt', lf: [40, 20], lb: [20, 10], af: [150, 10], ab: [170, 10] }, 8)] },
    taunt: { loop: false, frames: [f({ af: [100, 120], ab: [-10, 30], face: 'shout' }, 20), f({ af: [90, 100], ab: [-10, 30], face: 'happy' }, 20)] },
  };
}

// ---------------------------------------------------------------- B.T. moveset (speed / combos)
export function btAnims(): AnimSet {
  const a = commonAnims();
  a.light1 = { loop: false, frames: [f(m(G, { lean: 4 }), 3, 's'), f(m(G, { lean: 10, bx: 1, af: [92, 0], fistF: 2.6, lf: [24, 6] }), 3, 'a'), f(m(G, { lean: 6 }), 5, 'r')] };
  a.light2 = { loop: false, frames: [f(m(G, { lean: 2, ab: [10, 140] }), 3, 's'), f(m(G, { lean: 14, bx: 2, ab: [90, 0], fistB: 2.6, af: [20, 120], lf: [28, 6] }), 3, 'a'), f(m(G, { lean: 6 }), 6, 'r')] };
  a.light3 = { loop: false, frames: [f(m(G, { lean: -4, lf: [70, 110] }), 4, 's'), f({ lean: -18, by: -1, lf: [112, 6], lb: [-8, 4], af: [70, 50], ab: [-60, 40], face: 'shout' }, 4, 'a'), f(m(G, { lean: -6, lf: [50, 60] }), 7, 'r')] };
  a.light4 = { loop: false, frames: [f({ lean: 20, lf: [80, 130], lb: [-10, 10], af: [-30, 60], ab: [-60, 40] }, 4, 's'), f({ lean: -26, by: -2, lf: [100, 0], lb: [10, 0], af: [-80, 20], ab: [-120, 30], face: 'shout' }, 6, 'a'), f({ lean: -10, lf: [40, 40], lb: [-12, 6], af: [-30, 40], ab: [10, 60] }, 10, 'r')] };
  a.heavy = { loop: false, frames: [f({ lean: 18, by: 2, lf: [70, 120], lb: [-20, 30], af: [40, 140], ab: [-50, 30] }, 8, 's'), f({ lean: -30, by: -2, lf: [120, 0], lb: [5, 0], af: [-60, 30], ab: [-110, 20], face: 'shout' }, 6, 'a'), f({ lean: -12, lf: [60, 50], lb: [-10, 6], af: [10, 60], ab: [-30, 40] }, 12, 'r')] };
  a.jumpatk = { loop: false, frames: [f({ lean: -10, lf: [60, 110], lb: [-10, 90], af: [100, 40], ab: [-40, 30] }, 3, 's'), f({ lean: -22, lf: [100, 0], lb: [-20, 100], af: [60, 60], ab: [-70, 30], face: 'shout' }, 14, 'a'), f({ lf: [40, 40], lb: [-10, 40], af: [80, 40], ab: [-40, 30] }, 6, 'r')] };
  a.runatk = { loop: false, frames: [f({ lean: 20, by: 2, lf: [50, 100], lb: [-30, 40], af: [60, 100], ab: [-40, 60] }, 4, 's'), f({ lean: -30, by: -3, lf: [105, 0], lb: [90, 10], af: [130, 20], ab: [-60, 30], face: 'shout' }, 10, 'a'), f({ lean: -6, by: 2, lf: [40, 70], lb: [-20, 60], af: [40, 60], ab: [-20, 60] }, 10, 'r')] };
  return a;
}

// ---------------------------------------------------------------- S.C. moveset (power / grapples)
export function scAnims(): AnimSet {
  const a = commonAnims();
  a.light1 = { loop: false, frames: [f(m(G, { lean: 2, af: [40, 120] }), 4, 's'), f(m(G, { lean: 12, bx: 2, af: [82, 30], fistF: 2.9, lf: [24, 6] }), 4, 'a'), f(m(G, { lean: 6 }), 7, 'r')] };
  a.light2 = { loop: false, frames: [f(m(G, { lean: -2, ab: [-20, 100] }), 4, 's'), f(m(G, { lean: 16, bx: 3, ab: [84, 40], fistB: 2.9, af: [20, 120], lf: [28, 6] }), 4, 'a'), f(m(G, { lean: 8 }), 8, 'r')] };
  a.light3 = { loop: false, frames: [f(m(G, { lean: 14, by: 3, af: [10, 150], lf: [40, 70], lb: [-24, 50] }), 6, 's'), f({ lean: -8, by: -2, af: [165, 15], fistF: 3.2, ab: [10, 90], lf: [16, 6], lb: [-18, 6], face: 'shout' }, 5, 'a'), f(m(G, { lean: -4, af: [120, 40] }), 11, 'r')] };
  a.heavy = { loop: false, frames: [f({ lean: -12, by: 1, ab: [-70, 80], af: [30, 110], lf: [16, 8], lb: [-22, 10], fistB: 3 }, 12, 's'), f({ lean: 24, bx: 4, ab: [96, 0], fistB: 3.6, af: [10, 60], lf: [34, 10], lb: [-30, 10], face: 'shout' }, 6, 'a'), f(m(G, { lean: 12, ab: [60, 30] }), 14, 'r')] };
  a.jumpatk = { loop: false, frames: [f({ lean: 6, lf: [60, 110], lb: [-10, 90], af: [130, 120], ab: [-40, 30] }, 4, 's'), f({ lean: 20, lf: [70, 120], lb: [-10, 100], af: [100, 0], fistF: 3, ab: [-40, 30], face: 'shout' }, 14, 'a'), f({ lf: [40, 40], lb: [-10, 40], af: [80, 40], ab: [-40, 30] }, 6, 'r')] };
  a.runatk = { loop: false, frames: [f({ lean: 30, by: 2, af: [20, 100], ab: [10, 100], lf: [40, 40], lb: [-40, 30] }, 4, 's'), f({ lean: 38, bx: 3, af: [40, 110], ab: [30, 110], lf: [50, 20], lb: [-45, 20], face: 'shout' }, 12, 'a'), f({ lean: 10, af: [20, 100], ab: [10, 100], lf: [20, 10], lb: [-20, 10] }, 10, 'r')] };
  a.light4 = a.light3;
  return a;
}
