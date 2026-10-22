// Playable protagonists. Two heroes are on the menu from the start; two are secrets.
// B.T. is the fast combo fighter, S.C. the power grappler. Ozzi and Aynur only appear
// when the fighter select screen is asked for them (Up on B.T. / S.C.), so they stay
// off the card row until then.

export interface FighterDef {
  id: 'bt' | 'sc' | 'ozzi' | 'aynur';
  name: string;
  blurb: string;
  sheet: string;
  maxHp: number;
  walk: number; walkZ: number; run: number;
  jumpV: number;
  defense: number;          // incoming damage is divided by this
  light: string; heavy: string; jumpAtk: string; runAtk: string; grabAtk: string;
  /** How far in front of the body centre a grab can start, in world pixels. */
  grabRange: number;
  grabHold: number;
  grabHits?: number;        // slaps before the finisher (default 3); only Aynur goes past it
  grabFinisher?: number;    // extra damage on the last slap (default 3)
  throwSpeed: number; throwDamage: number;
  dodgeTicks: number; dodgeInvuln: number; dodgeSpeed: number;
  stats: { power: number; speed: number; grapple: number; toughness: number };
  secret?: boolean;         // not drawn on the select screen until revealed
  unlockFrom?: 'bt' | 'sc'; // the card that reveals this fighter when it is asked for more
}

export const FIGHTER_IDS = ['bt', 'sc', 'ozzi', 'aynur'] as const;
export type FighterId = (typeof FIGHTER_IDS)[number];

export const FIGHTERS: Record<FighterId, FighterDef> = {
  bt: {
    id: 'bt', name: 'B.T.', blurb: 'Speed & combos. Four-hit chains, crescent kick, lightning dodge.', sheet: 'bt',
    maxHp: 100, walk: 1.6, walkZ: 1.05, run: 3.2, jumpV: 4.6, defense: 1.0,
    light: 'bt_l1', heavy: 'bt_h', jumpAtk: 'bt_j', runAtk: 'bt_r', grabAtk: 'bt_ga',
    grabRange: 26, grabHold: 100, throwSpeed: 4.3, throwDamage: 14,
    dodgeTicks: 16, dodgeInvuln: 13, dodgeSpeed: 3.6,
    stats: { power: 2, speed: 5, grapple: 2, toughness: 3 },
  },
  sc: {
    id: 'sc', name: 'S.C.', blurb: 'Power & grapples. Launching uppercut, armored haymaker, huge throws.', sheet: 'sc',
    maxHp: 125, walk: 1.35, walkZ: 0.9, run: 2.7, jumpV: 4.3, defense: 1.15,
    light: 'sc_l1', heavy: 'sc_h', jumpAtk: 'sc_j', runAtk: 'sc_r', grabAtk: 'sc_ga',
    grabRange: 28, grabHold: 150, throwSpeed: 5.3, throwDamage: 22,
    dodgeTicks: 20, dodgeInvuln: 12, dodgeSpeed: 3.0,
    // max power, but her hold is shorter than the two grapple specialists': the bar shows
    // she can still throw harder than anyone, not that she owns the hold
    stats: { power: 5, speed: 2, grapple: 4, toughness: 4 },
  },
  // Ozzi is the roster's tank: max toughness, paid for with less damage than S.C. and one
  // fewer link in his chain than B.T. His edge is reach - every strike starts a little
  // further out - plus the quickest sidestep in the game. His grab is a plain knee, not a
  // launch, so he never plays like a second S.C.
  ozzi: {
    id: 'ozzi', name: 'OZZI', blurb: 'Brick wall. Long reach, three-hit chains, the fastest sidestep in the game.', sheet: 'ozzi',
    maxHp: 120, walk: 1.55, walkZ: 1.0, run: 3.05, jumpV: 4.5, defense: 1.22,
    light: 'ozzi_l1', heavy: 'ozzi_h', jumpAtk: 'ozzi_j', runAtk: 'ozzi_r', grabAtk: 'ozzi_ga',
    grabRange: 30, grabHold: 130, throwSpeed: 4.7, throwDamage: 17,
    dodgeTicks: 14, dodgeInvuln: 12, dodgeSpeed: 3.8,
    stats: { power: 3, speed: 4, grapple: 3, toughness: 5 },
    secret: true, unlockFrom: 'sc',
  },
  // Aynur is the grappler's answer to S.C.: her strikes are the shortest in the roster, but
  // once she has you the hold lasts and each LIGHT lands another slap - five before the
  // finisher. The victim cannot act at all while held, and the last slap drops them. Her
  // throw is a repositioning tool, not the payoff: the full five-slap string hits harder.
  aynur: {
    id: 'aynur', name: 'AYNUR', blurb: 'Grapple queen. Locks you in place, then lands a five-slap combo.', sheet: 'aynur',
    maxHp: 105, walk: 1.45, walkZ: 0.95, run: 2.85, jumpV: 4.4, defense: 1.05,
    light: 'aynur_l1', heavy: 'aynur_h', jumpAtk: 'aynur_j', runAtk: 'aynur_r', grabAtk: 'aynur_ga',
    grabRange: 32, grabHold: 240, grabHits: 5, grabFinisher: 12, throwSpeed: 4.1, throwDamage: 17,
    dodgeTicks: 18, dodgeInvuln: 12, dodgeSpeed: 3.2,
    stats: { power: 3, speed: 3, grapple: 5, toughness: 2 },
    secret: true, unlockFrom: 'bt',
  },
};

/** The fighters a fresh select screen shows, in card order. */
export const STARTER_IDS: FighterId[] = FIGHTER_IDS.filter((id) => !FIGHTERS[id].secret);

/** The hidden fighter a card reveals, keyed by the card it hides behind. */
export const SECRET_OF: Partial<Record<FighterId, FighterId>> = Object.fromEntries(
  FIGHTER_IDS.filter((id) => FIGHTERS[id].secret).map((id) => [FIGHTERS[id].unlockFrom!, id]),
) as Partial<Record<FighterId, FighterId>>;
