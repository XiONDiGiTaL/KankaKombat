// Data-driven attack definitions. Timing is in 60 Hz ticks; boxes are relative to the
// attacker's feet: [x0, x1] forward of the body centre, [y0, y1] height above the ground,
// and `dz` the half-depth of the hit along the street axis.

export interface AttackDef {
  anim: string;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  box: [number, number, number, number];
  dz: number;
  kb: [number, number];        // knockback velocity [forward, up]; up > 0 launches
  hitstun: number;
  knockdown?: boolean;
  stun?: number;               // dizzy build-up
  hitstop?: number;
  lunge?: number;              // forward speed during startup + active
  lift?: number;               // self upward velocity at start (hop attacks)
  next?: string;               // combo continuation (light chains)
  guardBreak?: boolean;
  unblockable?: boolean;
  heavy?: boolean;             // sfx / screen shake weight
  armor?: boolean;             // attacker does not flinch while performing it
  grab?: boolean;              // command grab (enemy/boss grapplers)
  projectile?: string;         // spawns a projectile on the first active tick
  telegraph?: number;          // extra wind-up ticks with a visible warning
  shockwave?: boolean;         // ground-level hit that jumping avoids
  hits?: number;               // multi-hit: re-arm the hit list every `active / hits` ticks
  aerial?: boolean;
}

const A = (d: AttackDef) => d;

export const ATTACKS: Record<string, AttackDef> = {
  // ------------------------------------------------------------- B.T.: fast four-hit chain
  bt_l1: A({ anim: 'light1', startup: 3, active: 3, recovery: 6, damage: 4, box: [4, 25, 24, 40], dz: 8, kb: [0.6, 0], hitstun: 14, stun: 6, next: 'bt_l2', lunge: 0.6 }),
  bt_l2: A({ anim: 'light2', startup: 3, active: 3, recovery: 6, damage: 4, box: [4, 26, 24, 40], dz: 8, kb: [0.6, 0], hitstun: 14, stun: 6, next: 'bt_l3', lunge: 0.6 }),
  bt_l3: A({ anim: 'light3', startup: 4, active: 4, recovery: 8, damage: 6, box: [6, 30, 20, 44], dz: 8, kb: [1.0, 0], hitstun: 16, stun: 8, next: 'bt_l4', lunge: 0.5 }),
  bt_l4: A({ anim: 'light4', startup: 4, active: 6, recovery: 12, damage: 9, box: [2, 32, 14, 40], dz: 9, kb: [3.6, 2.6], hitstun: 24, knockdown: true, hitstop: 6, heavy: true, lunge: 0.8 }),
  bt_h: A({ anim: 'heavy', startup: 8, active: 6, recovery: 14, damage: 13, box: [2, 34, 18, 46], dz: 9, kb: [3.8, 2.8], hitstun: 24, knockdown: true, stun: 10, hitstop: 7, heavy: true, lunge: 1.2 }),
  bt_j: A({ anim: 'jumpatk', startup: 3, active: 14, recovery: 6, damage: 9, box: [2, 28, 4, 30], dz: 8, kb: [3.0, 2.0], hitstun: 20, knockdown: true, hitstop: 5, aerial: true }),
  bt_r: A({ anim: 'runatk', startup: 4, active: 10, recovery: 12, damage: 10, box: [0, 30, 10, 36], dz: 9, kb: [4.4, 2.6], hitstun: 22, knockdown: true, hitstop: 6, heavy: true, lunge: 3.0, lift: 1.6 }),
  bt_ga: A({ anim: 'grabatk', startup: 5, active: 6, recovery: 6, damage: 5, box: [0, 26, 0, 46], dz: 10, kb: [0, 0], hitstun: 20, stun: 4 }),

  // ------------------------------------------------------------- S.C.: slower, heavier, launches
  sc_l1: A({ anim: 'light1', startup: 4, active: 4, recovery: 7, damage: 7, box: [4, 26, 24, 42], dz: 8, kb: [0.8, 0], hitstun: 16, stun: 8, next: 'sc_l2', lunge: 0.5 }),
  sc_l2: A({ anim: 'light2', startup: 4, active: 4, recovery: 8, damage: 7, box: [4, 27, 24, 42], dz: 8, kb: [0.8, 0], hitstun: 16, stun: 8, next: 'sc_l3', lunge: 0.5 }),
  sc_l3: A({ anim: 'light3', startup: 6, active: 5, recovery: 11, damage: 12, box: [4, 26, 20, 52], dz: 9, kb: [2.2, 3.8], hitstun: 26, knockdown: true, hitstop: 7, heavy: true, lunge: 0.6 }),
  sc_h: A({ anim: 'heavy', startup: 12, active: 6, recovery: 14, damage: 20, box: [4, 32, 18, 44], dz: 9, kb: [5.2, 2.4], hitstun: 28, knockdown: true, stun: 14, hitstop: 9, heavy: true, guardBreak: true, lunge: 1.0, armor: true }),
  sc_j: A({ anim: 'jumpatk', startup: 4, active: 14, recovery: 6, damage: 12, box: [0, 26, 0, 30], dz: 8, kb: [2.6, 1.8], hitstun: 22, knockdown: true, hitstop: 6, heavy: true, aerial: true }),
  sc_r: A({ anim: 'runatk', startup: 4, active: 12, recovery: 10, damage: 13, box: [0, 24, 8, 42], dz: 10, kb: [5.0, 2.2], hitstun: 24, knockdown: true, hitstop: 7, heavy: true, lunge: 2.6, armor: true }),
  sc_ga: A({ anim: 'grabatk', startup: 6, active: 6, recovery: 7, damage: 8, box: [0, 26, 0, 46], dz: 10, kb: [0, 0], hitstun: 22, stun: 6, heavy: true }),

  // ------------------------------------------------------------- OZZI: long reach, three hits
  ozzi_l1: A({ anim: 'light1', startup: 3, active: 3, recovery: 6, damage: 5, box: [4, 27, 24, 40], dz: 8, kb: [0.6, 0], hitstun: 14, stun: 6, next: 'ozzi_l2', lunge: 0.6 }),
  ozzi_l2: A({ anim: 'light2', startup: 3, active: 3, recovery: 6, damage: 5, box: [4, 28, 24, 40], dz: 8, kb: [0.6, 0], hitstun: 14, stun: 6, next: 'ozzi_l3', lunge: 0.6 }),
  ozzi_l3: A({ anim: 'light3', startup: 5, active: 5, recovery: 11, damage: 9, box: [4, 32, 18, 48], dz: 9, kb: [2.4, 3.4], hitstun: 26, knockdown: true, hitstop: 7, heavy: true, lunge: 0.6 }),
  ozzi_h: A({ anim: 'heavy', startup: 10, active: 6, recovery: 14, damage: 15, box: [4, 36, 16, 46], dz: 9, kb: [4.2, 2.6], hitstun: 26, knockdown: true, stun: 10, hitstop: 7, heavy: true, lunge: 1.3 }),
  ozzi_j: A({ anim: 'jumpatk', startup: 3, active: 14, recovery: 6, damage: 10, box: [2, 30, 4, 32], dz: 8, kb: [3.2, 2.0], hitstun: 20, knockdown: true, hitstop: 5, aerial: true }),
  ozzi_r: A({ anim: 'runatk', startup: 4, active: 10, recovery: 12, damage: 11, box: [0, 32, 10, 36], dz: 9, kb: [4.6, 2.6], hitstun: 22, knockdown: true, hitstop: 6, heavy: true, lunge: 3.0, lift: 1.5 }),
  ozzi_ga: A({ anim: 'grabatk', startup: 4, active: 5, recovery: 6, damage: 6, box: [0, 26, 0, 46], dz: 10, kb: [0, 0], hitstun: 20, stun: 5 }),

  // ------------------------------------------------------------- AYNUR: hold them, then slap
  aynur_l1: A({ anim: 'light1', startup: 3, active: 3, recovery: 6, damage: 4, box: [4, 24, 24, 40], dz: 8, kb: [0.6, 0], hitstun: 14, stun: 5, next: 'aynur_l2', lunge: 0.5 }),
  aynur_l2: A({ anim: 'light2', startup: 3, active: 3, recovery: 7, damage: 5, box: [4, 25, 24, 40], dz: 8, kb: [0.7, 0], hitstun: 14, stun: 5, next: 'aynur_l3', lunge: 0.5 }),
  aynur_l3: A({ anim: 'light3', startup: 5, active: 4, recovery: 10, damage: 8, box: [4, 28, 18, 40], dz: 8, kb: [2.0, 1.2], hitstun: 22, stun: 8, hitstop: 5 }),
  aynur_h: A({ anim: 'slap', startup: 8, active: 5, recovery: 12, damage: 12, box: [4, 30, 20, 42], dz: 9, kb: [3.8, 1.6], hitstun: 24, knockdown: true, stun: 10, hitstop: 6, heavy: true, lunge: 0.9 }),
  aynur_j: A({ anim: 'jumpatk', startup: 4, active: 14, recovery: 6, damage: 9, box: [0, 26, 4, 30], dz: 8, kb: [2.8, 1.8], hitstun: 20, knockdown: true, hitstop: 5, aerial: true }),
  aynur_r: A({ anim: 'runatk', startup: 4, active: 10, recovery: 14, damage: 9, box: [0, 26, 10, 36], dz: 9, kb: [4.0, 2.2], hitstun: 22, knockdown: true, hitstop: 5, heavy: true, lunge: 2.8 }),
  aynur_ga: A({ anim: 'slap', startup: 3, active: 4, recovery: 4, damage: 6, box: [0, 26, 0, 46], dz: 10, kb: [0, 0], hitstun: 20, stun: 5, hitstop: 3 }),

  p_throw: A({ anim: 'throw', startup: 9, active: 2, recovery: 14, damage: 0, box: [0, 0, 0, 0], dz: 0, kb: [0, 0], hitstun: 0, heavy: true }),

  // ------------------------------------------------------------- shared enemy moves
  e_jab: A({ anim: 'light1', startup: 9, active: 4, recovery: 14, damage: 5, box: [4, 24, 24, 40], dz: 7, kb: [1.0, 0], hitstun: 16, lunge: 0.4 }),
  e_punch: A({ anim: 'light2', startup: 12, active: 4, recovery: 16, damage: 7, box: [4, 25, 24, 40], dz: 7, kb: [1.4, 0], hitstun: 18, lunge: 0.6 }),
  e_kick: A({ anim: 'light3', startup: 13, active: 5, recovery: 16, damage: 8, box: [6, 28, 14, 38], dz: 7, kb: [2.0, 0], hitstun: 18 }),
  e_heavy: A({ anim: 'heavy', startup: 20, active: 6, recovery: 20, damage: 13, box: [4, 30, 18, 44], dz: 8, kb: [4.0, 2.4], hitstun: 24, knockdown: true, hitstop: 7, heavy: true, lunge: 0.8 }),
  e_shove: A({ anim: 'shove', startup: 14, active: 5, recovery: 18, damage: 5, box: [4, 24, 16, 42], dz: 8, kb: [4.6, 0.6], hitstun: 22, knockdown: false, hitstop: 4 }),
  e_flykick: A({ anim: 'runatk', startup: 12, active: 12, recovery: 16, damage: 9, box: [0, 28, 10, 36], dz: 8, kb: [3.6, 2.4], hitstun: 22, knockdown: true, lunge: 2.6, lift: 1.8, telegraph: 8 }),
  e_slam: A({ anim: 'heavy', startup: 22, active: 6, recovery: 24, damage: 15, box: [2, 30, 0, 44], dz: 10, kb: [3.2, 3.0], hitstun: 26, knockdown: true, hitstop: 8, heavy: true, armor: true, telegraph: 10 }),
  e_counter: A({ anim: 'light2', startup: 4, active: 4, recovery: 16, damage: 8, box: [4, 26, 20, 42], dz: 8, kb: [2.4, 1.2], hitstun: 20, knockdown: true }),
  e_throw: A({ anim: 'throwobj', startup: 18, active: 2, recovery: 20, damage: 0, box: [0, 0, 0, 0], dz: 0, kb: [0, 0], hitstun: 0, projectile: 'lokma' }),
  e_throw_orange: A({ anim: 'throwobj', startup: 18, active: 2, recovery: 20, damage: 0, box: [0, 0, 0, 0], dz: 0, kb: [0, 0], hitstun: 0, projectile: 'orange' }),
  e_dashkick: A({ anim: 'runatk', startup: 10, active: 14, recovery: 14, damage: 8, box: [0, 28, 6, 34], dz: 8, kb: [3.0, 2.0], hitstun: 20, knockdown: true, lunge: 3.2, telegraph: 6 }),

  // ------------------------------------------------------------- concept roster
  // The Dondurma Man: long metal stick — a committed thrust and a wide twirl.
  dondurma_thrust: A({ anim: 'thrust', startup: 14, active: 5, recovery: 18, damage: 10, box: [10, 48, 22, 44], dz: 7, kb: [2.8, 0.4], hitstun: 20, heavy: true, lunge: 1.2, telegraph: 6 }),
  dondurma_twirl: A({ anim: 'twirl', startup: 10, active: 18, recovery: 22, damage: 8, box: [-26, 40, 18, 48], dz: 10, kb: [3.2, 2.0], hitstun: 22, knockdown: true, hits: 2, heavy: true, telegraph: 10 }),
  dondurma_swat: A({ anim: 'slap', startup: 10, active: 4, recovery: 14, damage: 6, box: [4, 28, 24, 42], dz: 8, kb: [1.8, 0], hitstun: 18 }),

  // NYC Bum: wild haymaker that swings past the guard.
  bum_haymaker: A({ anim: 'haymaker', startup: 18, active: 6, recovery: 20, damage: 12, box: [2, 34, 20, 46], dz: 9, kb: [4.2, 1.8], hitstun: 24, knockdown: true, heavy: true, telegraph: 8, guardBreak: true }),

  // Tampa Man: overhead cane swing and a flat poke.
  tampa_cane: A({ anim: 'cane', startup: 20, active: 6, recovery: 20, damage: 12, box: [4, 38, 14, 50], dz: 9, kb: [3.8, 2.0], hitstun: 24, knockdown: true, heavy: true, telegraph: 8 }),
  tampa_poke: A({ anim: 'poke', startup: 14, active: 6, recovery: 16, damage: 8, box: [10, 44, 20, 38], dz: 7, kb: [2.4, 0.4], hitstun: 20 }),

  // Bıyıklı Fehmi: backhand with the tea hand still raised, and a tea-fuelled charge.
  fehmi_slap: A({ anim: 'slap', startup: 12, active: 4, recovery: 16, damage: 7, box: [4, 28, 24, 44], dz: 8, kb: [2.2, 0], hitstun: 20 }),
  fehmi_backhand: A({ anim: 'haymaker', startup: 16, active: 5, recovery: 22, damage: 11, box: [2, 32, 22, 46], dz: 9, kb: [4.0, 1.6], hitstun: 24, knockdown: true, heavy: true, telegraph: 8 }),
  fehmi_charge: A({ anim: 'charge', startup: 10, active: 30, recovery: 34, damage: 13, box: [0, 26, 8, 46], dz: 10, kb: [4.8, 2.2], hitstun: 26, knockdown: true, heavy: true, lunge: 2.2, armor: true, telegraph: 24 }),

  // ------------------------------------------------------------- bosses
  bum_boss_slam: A({ anim: 'heavy', startup: 18, active: 6, recovery: 24, damage: 16, box: [2, 34, 0, 46], dz: 10, kb: [4.0, 3.0], hitstun: 28, knockdown: true, heavy: true, armor: true, telegraph: 10 }),
  dondurma_boss_twirl: A({ anim: 'twirl', startup: 8, active: 22, recovery: 24, damage: 10, box: [-30, 44, 18, 50], dz: 12, kb: [3.6, 2.2], hitstun: 24, knockdown: true, hits: 3, heavy: true, telegraph: 12 }),
  fehmi_boss_slam: A({ anim: 'heavy', startup: 16, active: 6, recovery: 26, damage: 17, box: [2, 34, 18, 48], dz: 10, kb: [4.4, 2.8], hitstun: 28, knockdown: true, heavy: true, armor: true, telegraph: 12 }),
  tampa_boss_sweep: A({ anim: 'cane', startup: 16, active: 10, recovery: 28, damage: 15, box: [-10, 44, 0, 34], dz: 12, kb: [4.2, 2.4], hitstun: 26, knockdown: true, heavy: true, shockwave: true, telegraph: 14 }),

  // ------------------------------------------------------------- legacy moves (kept for data compatibility)
  // Rıza Dondurmacı
  riza_belly_legacy: A({ anim: 'belly', startup: 10, active: 26, recovery: 24, damage: 12, box: [0, 26, 10, 40], dz: 10, kb: [4.4, 2.2], hitstun: 24, knockdown: true, hitstop: 7, heavy: true, lunge: 3.4, armor: true, telegraph: 26 }),
  riza_slap: A({ anim: 'slap', startup: 9, active: 4, recovery: 14, damage: 7, box: [4, 26, 22, 42], dz: 8, kb: [2.4, 0], hitstun: 20, hitstop: 5 }),
  riza_cone: A({ anim: 'cone', startup: 24, active: 4, recovery: 12, damage: 9, box: [4, 30, 24, 44], dz: 8, kb: [2.0, 1.0], hitstun: 22, stun: 20 }),

  // ------------------------------------------------------------- Sidewalk Sal
  sal_poke: A({ anim: 'poke', startup: 14, active: 6, recovery: 16, damage: 8, box: [8, 40, 20, 40], dz: 7, kb: [2.4, 0.4], hitstun: 20 }),
  sal_swat: A({ anim: 'heavy', startup: 16, active: 6, recovery: 18, damage: 11, box: [4, 32, 14, 46], dz: 9, kb: [3.6, 2.2], hitstun: 24, knockdown: true, heavy: true, telegraph: 8 }),

  // ------------------------------------------------------------- Angry Grandpa Earl
  earl_cane: A({ anim: 'cane', startup: 18, active: 6, recovery: 18, damage: 12, box: [4, 36, 10, 46], dz: 9, kb: [3.8, 2.0], hitstun: 24, knockdown: true, hitstop: 7, heavy: true, telegraph: 6 }),
  earl_charge: A({ anim: 'charge', startup: 8, active: 40, recovery: 30, damage: 9, box: [0, 22, 8, 40], dz: 9, kb: [3.6, 1.8], hitstun: 22, knockdown: true, lunge: 2.0, armor: true, telegraph: 30 }),

  // ------------------------------------------------------------- bosses
  kemal_whip: A({ anim: 'whip', startup: 14, active: 6, recovery: 16, damage: 10, box: [8, 48, 20, 44], dz: 8, kb: [2.6, 0.8], hitstun: 22, hitstop: 5 }),
  kemal_charge: A({ anim: 'charge', startup: 8, active: 34, recovery: 34, damage: 16, box: [0, 28, 8, 48], dz: 11, kb: [5.2, 2.6], hitstun: 28, knockdown: true, hitstop: 8, heavy: true, lunge: 4.0, armor: true, telegraph: 30 }),
  kemal_stomp: A({ anim: 'stomp', startup: 10, active: 10, recovery: 40, damage: 14, box: [-90, 90, 0, 8], dz: 34, kb: [3.0, 3.2], hitstun: 26, knockdown: true, hitstop: 8, heavy: true, armor: true, telegraph: 34, shockwave: true, unblockable: true }),
  kemal_combo: A({ anim: 'light2', startup: 10, active: 4, recovery: 10, damage: 8, box: [4, 30, 22, 48], dz: 9, kb: [1.6, 0], hitstun: 18, next: 'kemal_combo2' }),
  kemal_combo2: A({ anim: 'heavy', startup: 10, active: 6, recovery: 26, damage: 13, box: [4, 32, 18, 48], dz: 9, kb: [4.4, 2.4], hitstun: 26, knockdown: true, heavy: true, hitstop: 7 }),

  selim_jab: A({ anim: 'light1', startup: 6, active: 3, recovery: 8, damage: 6, box: [4, 26, 24, 42], dz: 8, kb: [0.8, 0], hitstun: 16, next: 'selim_jab2' }),
  selim_jab2: A({ anim: 'light2', startup: 5, active: 3, recovery: 8, damage: 6, box: [4, 26, 24, 42], dz: 8, kb: [0.8, 0], hitstun: 16, next: 'selim_kick' }),
  selim_kick: A({ anim: 'light4', startup: 6, active: 5, recovery: 20, damage: 10, box: [2, 32, 14, 42], dz: 9, kb: [3.8, 2.4], hitstun: 24, knockdown: true, heavy: true, hitstop: 6 }),
  selim_fly: A({ anim: 'runatk', startup: 8, active: 18, recovery: 34, damage: 15, box: [0, 30, 8, 40], dz: 10, kb: [4.8, 2.8], hitstun: 26, knockdown: true, heavy: true, hitstop: 8, lunge: 4.2, lift: 2.6, armor: true, telegraph: 26 }),
  selim_spin: A({ anim: 'heavy', startup: 8, active: 16, recovery: 30, damage: 9, box: [-30, 30, 10, 42], dz: 12, kb: [3.4, 2.2], hitstun: 22, knockdown: true, hits: 2, armor: true, telegraph: 20 }),

  malone_jab: A({ anim: 'light1', startup: 6, active: 3, recovery: 7, damage: 6, box: [4, 30, 26, 46], dz: 8, kb: [0.8, 0], hitstun: 16, next: 'malone_jab2' }),
  malone_jab2: A({ anim: 'light1', startup: 5, active: 3, recovery: 7, damage: 6, box: [4, 30, 26, 46], dz: 8, kb: [0.8, 0], hitstun: 16, next: 'malone_cross' }),
  malone_cross: A({ anim: 'light2', startup: 7, active: 4, recovery: 20, damage: 12, box: [4, 32, 24, 46], dz: 9, kb: [4.0, 1.8], hitstun: 24, knockdown: true, heavy: true, hitstop: 7 }),
  malone_upper: A({ anim: 'light3', startup: 14, active: 5, recovery: 30, damage: 18, box: [2, 28, 18, 58], dz: 9, kb: [2.0, 4.6], hitstun: 30, knockdown: true, heavy: true, hitstop: 9, armor: true, telegraph: 18 }),
  malone_rush: A({ anim: 'rush', startup: 8, active: 36, recovery: 40, damage: 7, box: [0, 30, 20, 46], dz: 10, kb: [2.4, 1.0], hitstun: 20, lunge: 2.4, armor: true, telegraph: 28, hits: 4 }),

  gus_grab: A({ anim: 'grab', startup: 16, active: 6, recovery: 30, damage: 0, box: [0, 26, 0, 50], dz: 9, kb: [0, 0], hitstun: 0, grab: true, unblockable: true, telegraph: 18 }),
  gus_splash: A({ anim: 'splash', startup: 18, active: 10, recovery: 44, damage: 18, box: [-34, 34, 0, 20], dz: 16, kb: [3.4, 3.0], hitstun: 28, knockdown: true, heavy: true, hitstop: 9, lunge: 2.4, lift: 5.0, armor: true, telegraph: 30 }),
  gus_slap: A({ anim: 'light2', startup: 12, active: 5, recovery: 18, damage: 11, box: [4, 32, 18, 50], dz: 9, kb: [3.6, 1.2], hitstun: 22, knockdown: true, heavy: true }),
  gus_shove: A({ anim: 'shove', startup: 10, active: 5, recovery: 16, damage: 6, box: [4, 30, 14, 50], dz: 10, kb: [5.4, 0.6], hitstun: 22, hitstop: 5 }),
};

export interface ProjectileDef { speed: number; damage: number; kb: [number, number]; arc: number; knockdown?: boolean; hitstun: number }
export const PROJECTILES: Record<string, ProjectileDef> = {
  lokma: { speed: 3.2, damage: 6, kb: [1.6, 0.6], arc: 2.0, hitstun: 18 },
  orange: { speed: 3.4, damage: 7, kb: [1.8, 0.8], arc: 2.2, hitstun: 18 },
};

export function totalFrames(a: AttackDef): number {
  return (a.telegraph ?? 0) + a.startup + a.active + a.recovery;
}
