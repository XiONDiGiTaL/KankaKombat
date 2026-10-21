// Animation sets for the four concept enemies and their champion versions.
// Signature behaviour lives here: the Dondurma Man's long-stick thrust/twirl,
// the bum's wild haymaker, the Tampa Man's cane, and Fehmi's tea-sip idle.

import { AnimSet, Frame, btAnims } from './poses';
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

// ---------------------------------------------------------------- Dondurma Man
export function dondurmaAnims(): AnimSet {
  const a = extras(btAnims());
  const staff = (angle: number, p: Pose): Pose => ({ ...p, hold: 'dondurma', holdAngle: angle });
  a.idle = { loop: true, frames: [
    f(staff(-52, { af: [26, 30], ab: [-18, 24], lean: -4 }), 20),
    f(staff(-50, { af: [28, 30], ab: [-18, 24], lean: -4, by: 1 }), 20),
    f(staff(-40, { af: [34, 34], ab: [-18, 24], lean: -2, face: 'happy' }), 18),
  ] };
  a.walk = { loop: true, frames: a.walk.frames.map((fr, i) => ({ ...fr, p: staff(i % 2 ? -70 : -58, { ...fr.p, af: [12, 50] as [number, number] }) })) };
  a.thrust = { loop: false, frames: [
    f(staff(-90, { lean: -18, af: [-60, 60], ab: [-20, 40], lf: [10, 10], lb: [-10, 10], face: 'angry' }), 14, 's'),
    f(staff(4, { lean: 24, bx: 3, af: [88, 0], ab: [-30, 30], lf: [38, 8], lb: [-28, 10], face: 'shout' }), 5, 'a'),
    f(staff(-30, { lean: 10, af: [40, 20], ab: [-20, 30], lf: [24, 6], lb: [-18, 6] }), 18, 'r'),
  ] };
  a.twirl = { loop: false, frames: [
    f(staff(-120, { lean: -12, af: [-40, 40], ab: [-30, 30], face: 'angry' }), 10, 's'),
    f(staff(-30, { lean: 6, af: [40, 60], ab: [-20, 30], face: 'shout' }), 4, 'a'),
    f(staff(20, { lean: 10, af: [70, 30], ab: [-10, 30], face: 'shout' }), 4, 'a'),
    f(staff(80, { lean: 6, af: [100, 10], ab: [10, 30], face: 'shout' }), 4, 'a'),
    f(staff(140, { lean: 0, af: [130, 0], ab: [30, 20], face: 'shout' }), 4, 'a'),
    f(staff(-160, { lean: -4, af: [60, 40], ab: [-10, 30] }), 22, 'r'),
  ] };
  a.slap = { loop: false, frames: [f(staff(-80, { lean: -6, af: [150, 30], ab: [-10, 30], face: 'angry' }), 8, 's'), f(staff(-60, { lean: 18, bx: 2, af: [80, -30], ab: [-20, 30], fistF: 2.6, face: 'shout' }), 4, 'a'), f(staff(-80, { lean: 6 }), 10, 'r')] };
  a.taunt = { loop: true, frames: [f(staff(-82, { af: [-4, 30], ab: [-10, 30], face: 'happy', by: -1 }), 14), f(staff(-70, { af: [20, 60], ab: [-10, 30], face: 'happy' }), 14)] };
  return a;
}

// ---------------------------------------------------------------- NYC Bum
export function bumAnims(): AnimSet {
  const a = extras(btAnims());
  a.idle = { loop: true, frames: [
    f({ af: [8, 70], ab: [2, 80], lf: [12, 8], lb: [-10, 8], lean: 6, by: 1 }, 22),
    f({ af: [8, 70], ab: [2, 80], lf: [12, 8], lb: [-10, 8], lean: 8, by: 2 }, 22),
    f({ af: [16, 60], ab: [2, 80], lf: [12, 8], lb: [-10, 8], lean: 5, face: 'angry' }, 14),
  ] };
  a.haymaker = { loop: false, frames: [
    f({ lean: -20, hx: -1, af: [10, 90], ab: [-80, 30], lf: [18, 14], lb: [-16, 10], fistB: 3.2, face: 'angry' }, 18, 's'),
    f({ lean: 26, bx: 4, af: [20, 100], ab: [96, 0], fistB: 3.6, lf: [34, 10], lb: [-30, 10], face: 'shout' }, 6, 'a'),
    f({ lean: 14, bx: 2, af: [20, 80], ab: [70, 30], fistB: 2.4 }, 20, 'r'),
  ] };
  a.heavy = { loop: false, frames: [
    f({ lean: -18, af: [140, 20], ab: [120, 20], lf: [16, 10], lb: [-16, 10], face: 'angry' }, 18, 's'),
    f({ lean: 30, bx: 3, af: [80, 0], ab: [70, 0], lf: [40, 12], lb: [-34, 12], face: 'shout' }, 6, 'a'),
    f({ lean: 12, af: [30, 50], ab: [20, 50] }, 24, 'r'),
  ] };
  return a;
}

// ---------------------------------------------------------------- Tampa Man
export function tampaAnims(): AnimSet {
  const a = extras(btAnims());
  a.idle = { loop: true, frames: [
    f({ af: [24, 10], ab: [-8, 30], hold: 'cane', lf: [10, 6], lb: [-8, 6], lean: 5 }, 26),
    f({ af: [24, 10], ab: [-8, 30], hold: 'cane', lf: [10, 6], lb: [-8, 6], lean: 6, by: 1 }, 26),
  ] };
  a.walk = { loop: true, frames: a.walk.frames.map((fr, i) => ({ ...fr, t: 9, p: { ...fr.p, af: [24, 10] as [number, number], hold: 'cane', lean: 6 + (i % 2) } })) };
  a.cane = { loop: false, frames: [
    f({ lean: -14, af: [172, 0], ab: [-10, 30], hold: 'cane', lf: [16, 10], lb: [-16, 10], face: 'angry' }, 20, 's'),
    f({ lean: 18, bx: 2, af: [72, 0], ab: [-20, 30], hold: 'cane', lf: [34, 10], lb: [-28, 10], face: 'shout' }, 6, 'a'),
    f({ lean: 8, af: [40, 20], ab: [-10, 30], hold: 'cane' }, 20, 'r'),
  ] };
  a.poke = { loop: false, frames: [
    f({ lean: -6, af: [60, 40], ab: [-10, 30], hold: 'cane', face: 'angry' }, 14, 's'),
    f({ lean: 16, bx: 3, af: [92, 0], ab: [-20, 30], hold: 'cane', lf: [28, 8], lb: [-24, 8], face: 'shout' }, 6, 'a'),
    f({ lean: 8, af: [60, 30], ab: [-10, 30], hold: 'cane' }, 16, 'r'),
  ] };
  a.charge = { loop: true, frames: [
    f({ lean: 14, af: [150, 0], ab: [-30, 30], hold: 'cane', lf: [26, 14], lb: [-20, 12], face: 'shout' }, 8, 'a'),
    f({ lean: 14, af: [150, 0], ab: [-30, 30], hold: 'cane', lf: [-14, 12], lb: [22, 16], face: 'shout' }, 8, 'a'),
  ] };
  return a;
}

// ---------------------------------------------------------------- Bıyıklı Fehmi
export function fehmiAnims(): AnimSet {
  const a = extras(btAnims());
  // The tea glass is a permanent accessory; these poses only move the hand to it.
  a.idle = { loop: true, frames: [
    f({ af: [30, 60], ab: [-8, 30], lf: [12, 6], lb: [-10, 6], lean: 2 }, 30),
    f({ af: [46, 118], ab: [-8, 30], lf: [12, 6], lb: [-10, 6], lean: -2, face: 'happy' }, 22),
    f({ af: [52, 128], ab: [-8, 30], lf: [12, 6], lb: [-10, 6], lean: -3, face: 'happy' }, 26),
    f({ af: [30, 60], ab: [-8, 30], lf: [12, 6], lb: [-10, 6], lean: 2 }, 26),
  ] };
  a.slap = { loop: false, frames: [
    f({ lean: -8, af: [150, 30], ab: [-10, 60], face: 'angry' }, 12, 's'),
    f({ lean: 16, bx: 2, af: [80, -20], ab: [-20, 70], fistF: 2.6, face: 'shout' }, 4, 'a'),
    f({ lean: 4, af: [40, 70], ab: [-10, 50] }, 16, 'r'),
  ] };
  a.haymaker = { loop: false, frames: [
    f({ lean: -18, af: [20, 60], ab: [-70, 40], lf: [16, 8], lb: [-16, 8], face: 'angry' }, 16, 's'),
    f({ lean: 24, bx: 3, af: [30, 60], ab: [96, 0], fistB: 3.2, lf: [34, 10], lb: [-30, 10], face: 'shout' }, 5, 'a'),
    f({ lean: 10, af: [30, 70], ab: [60, 30] }, 22, 'r'),
  ] };
  a.charge = { loop: true, frames: [
    f({ lean: 22, af: [20, 80], ab: [10, 80], lf: [36, 20], lb: [-30, 16], face: 'shout' }, 8, 'a'),
    f({ lean: 22, af: [20, 80], ab: [10, 80], lf: [-18, 16], lb: [30, 20], face: 'shout' }, 8, 'a'),
  ] };
  a.heavy = { loop: false, frames: [
    f({ lean: -16, af: [140, 20], ab: [120, 20], lf: [16, 10], lb: [-16, 10], face: 'angry' }, 16, 's'),
    f({ lean: 28, bx: 3, af: [80, 0], ab: [70, 0], lf: [38, 12], lb: [-32, 12], face: 'shout' }, 6, 'a'),
    f({ lean: 12, af: [30, 50], ab: [20, 50] }, 26, 'r'),
  ] };
  return a;
}
