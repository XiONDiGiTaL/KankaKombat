// Enemy and boss roster — the four approved concept characters, one per city, plus
// their boss-grade champion. Behaviour is data: AI reads ranges, weights and chances.

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
  reward: [number, number];  // cash drop range
  food: number;              // chance to drop food
  xp: number;
  weight: number;            // throw distance divisor
  flank?: boolean;
  keepAway?: number;
  slowGetup?: boolean;
  /** Bıyıklı Fehmi always stops for a sip before setting off again. */
  sip?: boolean;
  /** The training-room dummy: no AI, no reward and never removed. */
  dummy?: boolean;
  quips?: string[];
  boss?: { title: string; phases: BossPhase[]; tired: number; intro: string; defeat: string };
}

const atk = (id: string, w: number, min: number, max: number): EnemyAttack => ({ id, w, min, max });

export const ENEMIES: Record<string, EnemyDef> = {
  // ------------------------------------------------------------- Training room
  // A sand-filled dummy on a spring base. It is an enemy only so the existing hit, grab
  // and throw code treats it like one; the simulation skips its AI, refills its health
  // every tick and sets it back on its stand after a knockdown.
  dummy: {
    id: 'dummy', name: 'TRAINING DUMMY', sheet: 'dummy', maxHp: 9999, walk: 0, walkZ: 0,
    attacks: [], aggression: 0, block: 0, dodge: 0, poise: 0, reward: [0, 0], food: 0, xp: 0, weight: 1,
    dummy: true,
  },

  // ------------------------------------------------------------- New York
  bum: {
    id: 'bum', name: 'NYC BUM', sheet: 'bum', maxHp: 52, walk: 1.05, walkZ: 0.75,
    attacks: [atk('e_jab', 3, 0, 24), atk('bum_haymaker', 2, 0, 30), atk('e_shove', 1, 0, 22)],
    aggression: 0.55, block: 0.04, dodge: 0.06, poise: 0, reward: [6, 14], food: 0.16, xp: 16, weight: 1.0,
    quips: ['YO! Watch it!', 'This is MY corner!', 'Got any change?'],
  },
  bum_boss: {
    id: 'bum_boss', name: 'DUMPSTER DUKE', sheet: 'bum_boss', maxHp: 420, walk: 1.0, walkZ: 0.7,
    attacks: [], aggression: 0.65, block: 0.15, dodge: 0.05, poise: 4, reward: [120, 120], food: 1, xp: 200, weight: 2.0,
    boss: {
      title: 'King of the Alley', intro: 'You want the jar? Come take it from the Duke.',
      defeat: "Alright, alright! The jar's yours, kid.", tired: 80,
      phases: [
        { below: 1.0, speed: 1, aggression: 0.55, attacks: [atk('bum_haymaker', 3, 0, 34), atk('e_jab', 3, 0, 26), atk('e_shove', 2, 0, 22)] },
        { below: 0.5, speed: 1.25, aggression: 0.8, line: 'NOW I\'M MAD!', summon: ['bum', 'bum'], attacks: [atk('bum_haymaker', 4, 0, 36), atk('bum_boss_slam', 2, 0, 30), atk('e_shove', 1, 0, 22)] },
      ],
    },
  },

  // ------------------------------------------------------------- İzmir
  fehmi: {
    id: 'fehmi', name: 'BIYIKLI FEHMI', sheet: 'fehmi', maxHp: 64, walk: 0.78, walkZ: 0.55,
    attacks: [atk('fehmi_slap', 3, 0, 26), atk('fehmi_backhand', 2, 0, 30)],
    aggression: 0.5, block: 0.12, dodge: 0, poise: 2, reward: [8, 18], food: 0.2, xp: 22, weight: 1.4, sip: true,
    quips: ['Bir çay molası... sonra.', 'Bıyığıma dikkat et.', 'Bu çay buz gibi olmuş.'],
  },
  fehmi_boss: {
    id: 'fehmi_boss', name: 'BIYIKLI FEHMI', sheet: 'fehmi_boss', maxHp: 480, walk: 0.8, walkZ: 0.55,
    attacks: [], aggression: 0.6, block: 0.2, dodge: 0, poise: 4, reward: [140, 140], food: 1, xp: 220, weight: 2.0, sip: true,
    boss: {
      title: 'The Tea House Champion', intro: 'Sip first. Then we fight. That is the rule.',
      defeat: 'My tea has gone cold. You win, kanka.', tired: 90,
      phases: [
        { below: 1.0, speed: 1, aggression: 0.5, attacks: [atk('fehmi_backhand', 4, 0, 32), atk('fehmi_slap', 3, 0, 26)] },
        { below: 0.5, speed: 1.15, aggression: 0.75, line: 'ÇAYI DEVRETTİN!', attacks: [atk('fehmi_backhand', 3, 0, 34), atk('fehmi_charge', 3, 50, 180), atk('fehmi_boss_slam', 2, 0, 30)] },
      ],
    },
  },

  // ------------------------------------------------------------- İstanbul
  dondurma: {
    id: 'dondurma', name: 'DONDURMA MAN', sheet: 'dondurma', maxHp: 62, walk: 0.95, walkZ: 0.75,
    attacks: [atk('dondurma_thrust', 3, 10, 44), atk('dondurma_swat', 2, 0, 26), atk('dondurma_twirl', 2, 0, 34)],
    aggression: 0.55, block: 0.06, dodge: 0.12, poise: 1, reward: [9, 20], food: 0.22, xp: 24, weight: 1.2,
    quips: ['Dondurma? Hayır. DONDURMA!', 'Uzun sopa, uzun mesele.', 'Ters çevir, damlar!'],
  },
  dondurma_boss: {
    id: 'dondurma_boss', name: 'THE DONDURMA MAN', sheet: 'dondurma_boss', maxHp: 500, walk: 1.0, walkZ: 0.7,
    attacks: [], aggression: 0.62, block: 0.12, dodge: 0.2, poise: 3, reward: [160, 160], food: 1, xp: 240, weight: 1.8,
    boss: {
      title: 'Master of the Long Stick', intro: 'One scoop. One chance. Catch it if you can!',
      defeat: 'Eh... the dondurma melts. You win this round.', tired: 80,
      phases: [
        { below: 1.0, speed: 1, aggression: 0.55, attacks: [atk('dondurma_thrust', 4, 10, 48), atk('dondurma_twirl', 2, 0, 36), atk('dondurma_swat', 2, 0, 26)] },
        { below: 0.5, speed: 1.3, aggression: 0.8, line: 'TWIRL TIME!', attacks: [atk('dondurma_boss_twirl', 3, 0, 40), atk('dondurma_thrust', 3, 10, 50), atk('e_kick', 1, 0, 26)] },
      ],
    },
  },

  // ------------------------------------------------------------- Tampa
  tampa: {
    id: 'tampa', name: 'THE TAMPA MAN', sheet: 'tampa', maxHp: 58, walk: 0.68, walkZ: 0.5,
    attacks: [atk('tampa_cane', 3, 0, 36), atk('tampa_poke', 2, 12, 46), atk('e_jab', 1, 0, 22)],
    aggression: 0.48, block: 0.1, dodge: 0, poise: 2, reward: [7, 16], food: 0.2, xp: 22, weight: 1.3, slowGetup: true,
    quips: ['Get off my beach!', 'I fought a gator in \'72!', 'These sandals are orthopedic!'],
  },
  tampa_boss: {
    id: 'tampa_boss', name: 'THE TAMPA MAN', sheet: 'tampa_boss', maxHp: 520, walk: 0.7, walkZ: 0.5,
    attacks: [], aggression: 0.58, block: 0.18, dodge: 0, poise: 4, reward: [180, 180], food: 1, xp: 260, weight: 2.1, slowGetup: true,
    boss: {
      title: 'President of the Homeowners Association', intro: 'This pier is private property, sonny.',
      defeat: 'Fine. FINE. I\'ll write you a permit.', tired: 100,
      phases: [
        { below: 1.0, speed: 1, aggression: 0.5, attacks: [atk('tampa_cane', 3, 0, 38), atk('tampa_poke', 2, 12, 48), atk('e_shove', 2, 0, 22)] },
        { below: 0.5, speed: 1.15, aggression: 0.78, line: 'WHERE IS MY CANE?!', attacks: [atk('tampa_boss_sweep', 3, 0, 40), atk('tampa_cane', 2, 0, 38), atk('e_slam', 1, 0, 28)] },
      ],
    },
  },
};

export const ENEMY_IDS = Object.keys(ENEMIES);
