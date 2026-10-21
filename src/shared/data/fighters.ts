// Playable protagonists. Two heroes, available from the start, each with a distinct feel.
// B.T. is the fast combo fighter, S.C. the power grappler. (The MUSE sheet in ConceptArt is
// a style reference only, not a playable character.)

export interface FighterDef {
  id: 'bt' | 'sc';
  name: string;
  blurb: string;
  sheet: string;
  maxHp: number;
  walk: number; walkZ: number; run: number;
  jumpV: number;
  defense: number;          // incoming damage is divided by this
  light: string; heavy: string; jumpAtk: string; runAtk: string; grabAtk: string;
  grabHold: number;
  throwSpeed: number; throwDamage: number;
  dodgeTicks: number; dodgeInvuln: number; dodgeSpeed: number;
  stats: { power: number; speed: number; grapple: number; toughness: number };
}

export const FIGHTER_IDS = ['bt', 'sc'] as const;
export type FighterId = (typeof FIGHTER_IDS)[number];

export const FIGHTERS: Record<FighterId, FighterDef> = {
  bt: {
    id: 'bt', name: 'B.T.', blurb: 'Speed & combos. Four-hit chains, crescent kick, lightning dodge.', sheet: 'bt',
    maxHp: 100, walk: 1.6, walkZ: 1.05, run: 3.2, jumpV: 4.6, defense: 1.0,
    light: 'bt_l1', heavy: 'bt_h', jumpAtk: 'bt_j', runAtk: 'bt_r', grabAtk: 'bt_ga',
    grabHold: 100, throwSpeed: 4.3, throwDamage: 14,
    dodgeTicks: 16, dodgeInvuln: 13, dodgeSpeed: 3.6,
    stats: { power: 2, speed: 5, grapple: 2, toughness: 3 },
  },
  sc: {
    id: 'sc', name: 'S.C.', blurb: 'Power & grapples. Launching uppercut, armored haymaker, huge throws.', sheet: 'sc',
    maxHp: 125, walk: 1.35, walkZ: 0.9, run: 2.7, jumpV: 4.3, defense: 1.15,
    light: 'sc_l1', heavy: 'sc_h', jumpAtk: 'sc_j', runAtk: 'sc_r', grabAtk: 'sc_ga',
    grabHold: 170, throwSpeed: 5.3, throwDamage: 22,
    dodgeTicks: 20, dodgeInvuln: 12, dodgeSpeed: 3.0,
    stats: { power: 5, speed: 2, grapple: 5, toughness: 4 },
  },
};
