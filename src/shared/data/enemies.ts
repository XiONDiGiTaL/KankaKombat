// Enemy and boss roster. Behaviour is data: the AI reads ranges, weights and chances
// from here, and bosses add phases with their own move lists and speed.

export interface EnemyAttack { id: string; w: number; min: number; max: number }
export interface BossPhase { below: number; attacks: EnemyAttack[]; speed: number; aggression: number; summon?: string[]; line?: string }

export interface EnemyDef {
  id: string;
  name: string;
  sheet: string;
  maxHp: number;
  walk: number; walkZ: number;
  attacks: EnemyAttack[];
  aggression: number;        // 0..1 chance per decision to commit to an attack when in range
  block: number;             // chance to block a telegraphed player attack
  dodge: number;             // chance to sidestep instead
  poise: number;             // light hits absorbed before flinching (0 = always flinch)
  reward: [number, number];  // currency drop range (local units)
  food: number;              // chance to drop food
  xp: number;
  weight: number;            // throw distance divisor
  flank?: boolean;           // prefers attacking from behind
  keepAway?: number;         // ranged enemies hold this distance
  slowGetup?: boolean;
  quips?: string[];
  boss?: { title: string; phases: BossPhase[]; tired: number; intro: string; defeat: string };
}

const atk = (id: string, w: number, min: number, max: number): EnemyAttack => ({ id, w, min, max });

export const ENEMIES: Record<string, EnemyDef> = {
  // ------------------------------------------------------------- İstanbul
  abi: { id: 'abi', name: 'Mahalle Abisi', sheet: 'abi', maxHp: 38, walk: 1.0, walkZ: 0.7, attacks: [atk('e_jab', 3, 0, 24), atk('e_punch', 2, 0, 24)], aggression: 0.45, block: 0.08, dodge: 0.04, poise: 0, reward: [10, 25], food: 0.12, xp: 12, weight: 1, quips: ['Ne bakıyon?', 'Kanka, dur bi!'] },
  kazim: { id: 'kazim', name: 'Kebapçı Kazım', sheet: 'kazim', maxHp: 72, walk: 0.75, walkZ: 0.55, attacks: [atk('e_heavy', 3, 0, 28), atk('e_shove', 2, 0, 22)], aggression: 0.35, block: 0.15, dodge: 0, poise: 2, reward: [20, 40], food: 0.25, xp: 22, weight: 1.6, quips: ['Şiş gibi gelirim!'] },
  selo: { id: 'selo', name: 'Sinsi Selo', sheet: 'selo', maxHp: 30, walk: 1.5, walkZ: 1.0, attacks: [atk('e_jab', 3, 0, 22), atk('e_flykick', 2, 30, 70)], aggression: 0.55, block: 0.05, dodge: 0.3, poise: 0, reward: [10, 30], food: 0.1, xp: 14, weight: 0.8, flank: true },
  riza: { id: 'riza', name: 'Rıza Dondurmacı', sheet: 'riza', maxHp: 95, walk: 0.85, walkZ: 0.6, attacks: [atk('riza_belly', 3, 30, 90), atk('riza_slap', 3, 0, 24), atk('riza_cone', 2, 0, 28)], aggression: 0.5, block: 0.1, dodge: 0, poise: 2, reward: [40, 70], food: 0.6, xp: 40, weight: 1.8, quips: ['Dondurma? Hayır... DONDURMAAA!', 'Bu bıyık 20 yıllık!', 'Külahı al... ALAMAZSIN!'] },
  // ------------------------------------------------------------- İzmir
  mert: { id: 'mert', name: 'Martı Mert', sheet: 'mert', maxHp: 34, walk: 1.7, walkZ: 1.1, attacks: [atk('e_jab', 3, 0, 22), atk('e_dashkick', 2, 34, 80)], aggression: 0.5, block: 0.05, dodge: 0.35, poise: 0, reward: [12, 28], food: 0.12, xp: 16, weight: 0.8, flank: true, quips: ['Hop! Kaçtım!'] },
  kenan: { id: 'kenan', name: 'Kumru Kenan', sheet: 'kenan', maxHp: 56, walk: 1.15, walkZ: 0.8, attacks: [atk('e_punch', 3, 0, 24), atk('e_heavy', 2, 0, 28)], aggression: 0.7, block: 0.05, dodge: 0, poise: 1, reward: [15, 35], food: 0.15, xp: 20, weight: 1.2, quips: ['Kumru yedim, güçlüyüm!'] },
  gokhan: { id: 'gokhan', name: 'Gevrek Gökhan', sheet: 'gokhan', maxHp: 52, walk: 0.95, walkZ: 0.7, attacks: [atk('e_counter', 2, 0, 24), atk('e_punch', 2, 0, 24)], aggression: 0.35, block: 0.55, dodge: 0, poise: 1, reward: [15, 35], food: 0.15, xp: 20, weight: 1.1 },
  leyla: { id: 'leyla', name: 'Lokma Leyla', sheet: 'leyla', maxHp: 32, walk: 1.2, walkZ: 0.9, attacks: [atk('e_throw', 4, 60, 150), atk('e_jab', 1, 0, 22)], aggression: 0.5, block: 0, dodge: 0.2, poise: 0, reward: [15, 30], food: 0.3, xp: 18, weight: 0.9, keepAway: 100, quips: ['Lokma ister misin?'] },
  // ------------------------------------------------------------- New York
  punk: { id: 'punk', name: 'Bodega Punk', sheet: 'punk', maxHp: 36, walk: 1.6, walkZ: 1.0, attacks: [atk('e_jab', 3, 0, 22), atk('e_kick', 2, 0, 26)], aggression: 0.55, block: 0.05, dodge: 0.2, poise: 0, reward: [1, 3], food: 0.12, xp: 18, weight: 0.9, quips: ['Yo, wrong block!'] },
  brick: { id: 'brick', name: 'Brick', sheet: 'brick', maxHp: 85, walk: 0.8, walkZ: 0.55, attacks: [atk('e_heavy', 3, 0, 28), atk('e_slam', 2, 0, 26)], aggression: 0.4, block: 0.15, dodge: 0, poise: 2, reward: [2, 5], food: 0.25, xp: 28, weight: 1.7 },
  vinny: { id: 'vinny', name: 'Slick Vinny', sheet: 'vinny', maxHp: 42, walk: 1.45, walkZ: 1.0, attacks: [atk('e_kick', 3, 0, 26), atk('e_punch', 2, 0, 24)], aggression: 0.5, block: 0.1, dodge: 0.2, poise: 0, reward: [2, 4], food: 0.12, xp: 20, weight: 1, flank: true, quips: ['Behind ya, pal.'] },
  sal: { id: 'sal', name: 'Sidewalk Sal', sheet: 'sal', maxHp: 80, walk: 1.0, walkZ: 0.8, attacks: [atk('sal_poke', 3, 18, 44), atk('sal_swat', 2, 0, 28)], aggression: 0.45, block: 0.5, dodge: 0.3, poise: 1, reward: [3, 6], food: 0.6, xp: 40, weight: 1.1, quips: ['Socrates walked these streets. Probably.', 'The sign says NO. Read the sign!', 'I have a PhD in pigeon.'] },
  // ------------------------------------------------------------- Tampa
  gator: { id: 'gator', name: 'Gator Boy', sheet: 'gator', maxHp: 42, walk: 1.2, walkZ: 0.8, attacks: [atk('e_punch', 3, 0, 24), atk('e_kick', 2, 0, 26)], aggression: 0.55, block: 0.1, dodge: 0.05, poise: 0, reward: [1, 4], food: 0.12, xp: 22, weight: 1 },
  kyle: { id: 'kyle', name: 'Skater Kyle', sheet: 'kyle', maxHp: 34, walk: 1.8, walkZ: 1.1, attacks: [atk('e_dashkick', 3, 30, 90), atk('e_jab', 2, 0, 22)], aggression: 0.55, block: 0, dodge: 0.3, poise: 0, reward: [1, 4], food: 0.12, xp: 22, weight: 0.8, flank: true, quips: ['Gnarly!'] },
  lou: { id: 'lou', name: 'Big Lou', sheet: 'lou', maxHp: 95, walk: 0.75, walkZ: 0.5, attacks: [atk('e_slam', 3, 0, 26), atk('e_shove', 2, 0, 22)], aggression: 0.4, block: 0.2, dodge: 0, poise: 3, reward: [3, 6], food: 0.3, xp: 32, weight: 1.9 },
  cindy: { id: 'cindy', name: 'Citrus Cindy', sheet: 'cindy', maxHp: 34, walk: 1.2, walkZ: 0.9, attacks: [atk('e_throw_orange', 4, 60, 150), atk('e_kick', 1, 0, 24)], aggression: 0.5, block: 0, dodge: 0.2, poise: 0, reward: [2, 4], food: 0.3, xp: 22, weight: 0.9, keepAway: 100, quips: ['Fresh squeezed!'] },
  earl: { id: 'earl', name: 'Grandpa Earl', sheet: 'earl', maxHp: 85, walk: 0.7, walkZ: 0.5, attacks: [atk('earl_cane', 3, 0, 34), atk('earl_charge', 2, 40, 110), atk('e_shove', 2, 0, 22)], aggression: 0.5, block: 0.1, dodge: 0, poise: 2, reward: [3, 7], food: 0.6, xp: 42, weight: 1.2, slowGetup: true, quips: ['Get off my lawn!', 'Back in MY day we walked uphill BOTH ways!', 'I fought a gator in \'72!'] },

  // ------------------------------------------------------------- bosses
  kemal: {
    id: 'kemal', name: 'Kabadayı Kemal', sheet: 'kemal', maxHp: 420, walk: 0.95, walkZ: 0.7, attacks: [], aggression: 0.6, block: 0.2, dodge: 0, poise: 4, reward: [300, 300], food: 1, xp: 200, weight: 2.2,
    boss: {
      title: 'The Neighborhood Enforcer', intro: 'Bu mahalle benim, kanka.', defeat: 'Tamam... tamam! Mahalle sizin!', tired: 80,
      phases: [
        { below: 1.0, speed: 1, aggression: 0.55, attacks: [atk('kemal_whip', 3, 20, 50), atk('kemal_combo', 3, 0, 30), atk('kemal_charge', 2, 60, 200), atk('kemal_stomp', 1, 0, 80)] },
        { below: 0.5, speed: 1.25, aggression: 0.75, summon: ['abi', 'abi'], line: 'ÇOCUKLAR! Gelin buraya!', attacks: [atk('kemal_whip', 2, 20, 50), atk('kemal_combo', 3, 0, 30), atk('kemal_charge', 3, 60, 220), atk('kemal_stomp', 2, 0, 90)] },
      ],
    },
  },
  selim: {
    id: 'selim', name: 'Sunset Selim', sheet: 'selim', maxHp: 460, walk: 1.5, walkZ: 1.0, attacks: [], aggression: 0.6, block: 0.3, dodge: 0.35, poise: 3, reward: [350, 350], food: 1, xp: 240, weight: 1.3,
    boss: {
      title: 'The Promenade Promoter', intro: 'Ladies and gentlemen... the Kordon main event!', defeat: 'Okay okay, you headline next week.', tired: 70,
      phases: [
        { below: 1.0, speed: 1, aggression: 0.55, attacks: [atk('selim_jab', 4, 0, 26), atk('selim_fly', 2, 60, 200)] },
        { below: 0.5, speed: 1.3, aggression: 0.8, line: 'SHOWTIME!', attacks: [atk('selim_jab', 3, 0, 26), atk('selim_fly', 2, 60, 220), atk('selim_spin', 3, 0, 34)] },
      ],
    },
  },
  malone: {
    id: 'malone', name: 'Knuckles Malone', sheet: 'malone', maxHp: 520, walk: 1.2, walkZ: 0.85, attacks: [], aggression: 0.65, block: 0.4, dodge: 0.2, poise: 4, reward: [40, 40], food: 1, xp: 280, weight: 1.8,
    boss: {
      title: 'The Underground Promoter', intro: 'Gloves off. Rules off. Ding ding.', defeat: 'Hell of a fight, kid. Hell of a fight.', tired: 70,
      phases: [
        { below: 1.0, speed: 1, aggression: 0.6, attacks: [atk('malone_jab', 4, 0, 30), atk('malone_upper', 2, 0, 28), atk('malone_rush', 1, 40, 160)] },
        { below: 0.5, speed: 1.25, aggression: 0.8, line: 'Round two. No bell.', attacks: [atk('malone_jab', 3, 0, 30), atk('malone_upper', 2, 0, 28), atk('malone_rush', 3, 40, 180)] },
      ],
    },
  },
  gus: {
    id: 'gus', name: 'Big Gator Gus', sheet: 'gus', maxHp: 600, walk: 0.9, walkZ: 0.65, attacks: [], aggression: 0.6, block: 0.45, dodge: 0, poise: 5, reward: [50, 50], food: 1, xp: 320, weight: 2.6,
    boss: {
      title: 'The Neighborhood Fixer', intro: 'Y\'all are in Gus country now.', defeat: 'Alright... you fixed ME.', tired: 90,
      phases: [
        { below: 1.0, speed: 1, aggression: 0.55, attacks: [atk('gus_grab', 3, 0, 26), atk('gus_slap', 3, 0, 30), atk('gus_shove', 2, 0, 26), atk('gus_splash', 2, 50, 160)] },
        { below: 0.5, speed: 1.2, aggression: 0.8, line: 'Now I\'m MAD.', attacks: [atk('gus_grab', 4, 0, 26), atk('gus_slap', 2, 0, 30), atk('gus_splash', 3, 40, 180), atk('gus_shove', 1, 0, 26)] },
      ],
    },
  },
};
