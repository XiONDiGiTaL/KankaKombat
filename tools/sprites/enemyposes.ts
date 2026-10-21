// Animation sets for enemies and bosses: the shared human base plus signature moves.

import { AnimSet, Frame, btAnims, scAnims } from './poses';
import { Pose } from './rig';

const f = (p: Pose, t: number, ph?: Frame['ph']): Frame => ({ p, t, ph });
const G: Pose = { af: [22, 112], ab: [14, 118], lf: [14, 6], lb: [-12, 6] };
const m = (...ps: Pose[]): Pose => Object.assign({}, ...ps);

function extras(a: AnimSet): AnimSet {
  a.shove = { loop: false, frames: [f(m(G, { lean: -6, af: [60, 120], ab: [50, 120] }), 8, 's'), f({ lean: 22, bx: 3, af: [92, 0], ab: [88, 0], lf: [30, 10], lb: [-30, 10], face: 'shout' }, 6, 'a'), f(m(G, { lean: 8 }), 10, 'r')] };
  a.throwobj = { loop: false, frames: [f({ lean: -14, af: [170, 40], ab: [-30, 20], hold: 'food', lf: [16, 6], lb: [-14, 6] }, 10, 's'), f({ lean: 18, af: [80, 0], ab: [-40, 20], lf: [28, 10], lb: [-22, 10], face: 'shout' }, 6, 'a'), f(m(G, { lean: 6 }), 10, 'r')] };
  a.grab = { loop: false, frames: [f({ lean: 6, af: [60, 40], ab: [55, 40], face: 'angry' }, 10, 's'), f({ lean: 16, bx: 3, af: [88, 10], ab: [80, 15], lf: [30, 10], lb: [-24, 10], face: 'shout' }, 6, 'a'), f({ lean: 6, af: [70, 30], ab: [60, 30] }, 12, 'r')] };
  return a;
}

export function thugAnims(): AnimSet { return extras(btAnims()); }
export function bruiserAnims(): AnimSet { return extras(scAnims()); }

export function rizaAnims(): AnimSet {
  const a = bruiserAnims();
  a.belly = { loop: false, frames: [
    f({ lean: -22, af: [-40, 30], ab: [-50, 30], lf: [10, 10], lb: [-10, 10], face: 'angry' }, 10, 's'),
    f({ lean: -20, bx: 2, af: [-60, 20], ab: [-70, 20], lf: [35, 40], lb: [-30, 30], face: 'shout' }, 5, 'a'),
    f({ lean: -20, bx: 2, af: [-60, 20], ab: [-70, 20], lf: [-20, 20], lb: [30, 40], face: 'shout' }, 5, 'a'),
    f({ lean: -8, af: [20, 40], ab: [-10, 40], lf: [14, 6], lb: [-12, 6] }, 12, 'r')] };
  a.slap = { loop: false, frames: [f({ lean: -6, af: [150, 30], ab: [-10, 30], face: 'angry' }, 8, 's'), f({ lean: 18, bx: 2, af: [80, -30], ab: [-20, 30], fistF: 2.6, face: 'shout' }, 4, 'a'), f(m(G, { lean: 6 }), 10, 'r')] };
  a.cone = { loop: false, frames: [
    f({ af: [60, 100], ab: [-10, 30], hold: 'cone', face: 'happy' }, 12, 's'), f({ af: [95, 20], ab: [-10, 30], hold: 'cone', face: 'happy', lean: 6 }, 12, 's'),
    f({ lean: 20, bx: 3, af: [95, 0], ab: [80, 0], hold: 'cone', face: 'shout' }, 4, 'a'), f({ af: [40, 60], ab: [-10, 30], hold: 'cone' }, 10, 'r')] };
  a.taunt = { loop: false, frames: [f({ af: [40, 150], ab: [-10, 30], face: 'happy' }, 15), f({ af: [44, 145], ab: [-10, 30], face: 'n' }, 15)] };
  a.idle = { loop: true, frames: [f({ af: [-20, 40], ab: [-30, 40], lean: -6 }, 16), f({ af: [-20, 40], ab: [-30, 40], lean: -6, by: 1 }, 16), f({ af: [40, 150], ab: [-30, 40], lean: -6, face: 'happy' }, 16)] };
  return a;
}

export function salAnims(): AnimSet {
  const a = thugAnims();
  a.poke = { loop: false, frames: [f({ lean: -8, af: [60, 40], ab: [-10, 30], hold: 'umbrella' }, 10, 's'), f({ lean: 16, bx: 3, af: [90, 0], ab: [-20, 30], hold: 'umbrella', face: 'shout' }, 6, 'a'), f({ af: [60, 30], ab: [-10, 30], hold: 'umbrella' }, 10, 'r')] };
  a.heavy = { loop: false, frames: [f({ lean: -14, af: [160, 10], ab: [150, 20], hold: 'sign' }, 12, 's'), f({ lean: 22, bx: 2, af: [80, 0], ab: [70, 10], hold: 'sign', face: 'shout' }, 6, 'a'), f({ af: [40, 30], ab: [30, 30], hold: 'sign' }, 12, 'r')] };
  a.block = { loop: true, frames: [f({ lean: -4, af: [70, 60], ab: [60, 70], hold: 'sign', face: 'angry' }, 30)] };
  a.idle = { loop: true, frames: [f({ af: [10, 60], ab: [-10, 30], hold: 'umbrella' }, 20), f({ af: [10, 60], ab: [-10, 30], hold: 'umbrella', by: 1 }, 20)] };
  return a;
}

export function earlAnims(): AnimSet {
  const a = thugAnims();
  a.cane = { loop: false, frames: [f({ lean: -10, af: [175, 0], ab: [-10, 30], hold: 'cane', face: 'angry' }, 12, 's'), f({ lean: 16, bx: 2, af: [75, 0], ab: [-20, 30], hold: 'cane', face: 'shout' }, 6, 'a'), f({ af: [40, 20], ab: [-10, 30], hold: 'cane' }, 12, 'r')] };
  a.charge = { loop: true, frames: [
    f({ lean: 18, af: [150, 0], ab: [-30, 30], hold: 'cane', lf: [30, 20], lb: [-20, 20], face: 'shout' }, 5, 'a'),
    f({ lean: 18, af: [150, 0], ab: [-30, 30], hold: 'cane', lf: [-15, 20], lb: [25, 25], face: 'shout' }, 5, 'a')] };
  a.charge.frames.unshift(f({ lean: -6, af: [170, 0], ab: [-30, 30], hold: 'cane', face: 'angry' }, 14, 's'));
  a.charge.frames.push(f({ lean: 4, af: [40, 30], ab: [-20, 30], hold: 'cane', face: 'hurt' }, 14, 'r'));
  a.idle = { loop: true, frames: [f({ af: [30, 10], ab: [-10, 30], hold: 'cane' }, 24), f({ af: [30, 10], ab: [-10, 30], hold: 'cane', by: 1, face: 'angry' }, 24)] };
  a.walk.frames = a.walk.frames.map((x) => ({ ...x, t: 7, p: { ...x.p, af: [30, 10] as [number, number], hold: 'cane' } }));
  return a;
}

export function kemalAnims(): AnimSet {
  const a = bruiserAnims();
  a.whip = { loop: false, frames: [f({ lean: -10, af: [160, 30], ab: [-10, 30], hold: 'beads', face: 'angry' }, 10, 's'), f({ lean: 14, bx: 2, af: [92, 0], ab: [-20, 30], hold: 'beads', face: 'shout' }, 6, 'a'), f({ af: [50, 30], ab: [-10, 30], hold: 'beads' }, 10, 'r')] };
  a.charge = { loop: true, frames: [
    f({ lean: 30, af: [20, 100], ab: [10, 100], lf: [40, 40], lb: [-40, 30], face: 'shout' }, 5, 'a'),
    f({ lean: 30, af: [20, 100], ab: [10, 100], lf: [-20, 30], lb: [30, 40], face: 'shout' }, 5, 'a')] };
  a.charge.frames.unshift(f({ lean: -10, by: 2, af: [-30, 60], ab: [-40, 60], lf: [20, 30], lb: [-30, 30], face: 'angry' }, 12, 's'));
  a.charge.frames.push(f({ lean: 10, af: [20, 60], ab: [10, 60] }, 12, 'r'));
  a.stomp = { loop: false, frames: [f({ lean: -8, by: -2, lf: [95, 100], lb: [-6, 4], af: [120, 40], ab: [-100, 30], face: 'shout' }, 14, 's'), f({ lean: 6, by: 3, lf: [30, 40], lb: [-20, 30], af: [40, 40], ab: [-40, 40], face: 'shout' }, 10, 'a'), f({ lean: 10, by: 2, lf: [24, 30], lb: [-20, 20], af: [30, 60], ab: [-20, 60], face: 'hurt' }, 20, 'r')] };
  return a;
}

export function selimAnims(): AnimSet {
  const a = thugAnims();
  a.taunt = { loop: false, frames: [f({ af: [170, 0], ab: [170, 10], face: 'happy' }, 20), f({ af: [150, 20], ab: [160, 10], face: 'shout', by: -1 }, 20)] };
  return a;
}

export function maloneAnims(): AnimSet {
  const a = bruiserAnims();
  a.rush = { loop: true, frames: [
    f({ lean: 18, bx: 2, af: [92, 0], ab: [40, 120], lf: [30, 10], lb: [-24, 10], fistF: 3, face: 'shout' }, 4, 'a'),
    f({ lean: 18, bx: 2, ab: [92, 0], af: [40, 120], lf: [-10, 10], lb: [20, 10], fistB: 3, face: 'shout' }, 4, 'a')] };
  a.rush.frames.unshift(f({ lean: -6, by: 2, af: [30, 130], ab: [24, 130], face: 'angry' }, 14, 's'));
  a.rush.frames.push(f(m(G, { lean: 4, face: 'hurt' }), 14, 'r'));
  a.idle = { loop: true, frames: [f(m(G, { bx: 0 }), 8), f(m(G, { bx: 1, by: 1 }), 8), f(m(G, { bx: 0 }), 8), f(m(G, { bx: -1, by: 1 }), 8)] };
  return a;
}

export function gusAnims(): AnimSet {
  const a = bruiserAnims();
  a.splash = { loop: false, frames: [
    f({ lean: -10, by: 4, af: [150, 20], ab: [140, 20], lf: [50, 90], lb: [-30, 70], face: 'shout' }, 14, 's'),
    f({ rot: 90, dy: -6, lean: 0, af: [90, 0], ab: [80, 0], lf: [10, 0], lb: [-10, 0], face: 'shout' }, 10, 'a'),
    f({ by: 4, lean: 20, af: [40, 40], ab: [30, 40], lf: [45, 80], lb: [-25, 70], face: 'hurt' }, 20, 'r')] };
  return a;
}
