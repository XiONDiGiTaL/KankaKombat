// What the four bars on a fighter card actually change in play. The tooltips are built
// from the same fields the simulation reads (attack damage, throw damage, run/dodge speed,
// grab hold length, health and defence), so a balance change cannot leave the explanation
// describing last patch's fighter.

import { ATTACKS } from '../shared/data/attacks';
import { TICK_HZ } from '../shared/data/constants';
import type { FighterDef } from '../shared/data/fighters';

export type StatKey = 'power' | 'speed' | 'grapple' | 'toughness';

/** Card order: the order the bars are drawn in. */
export const STAT_KEYS: readonly StatKey[] = ['power', 'speed', 'grapple', 'toughness'];

const BODY: Record<StatKey, string> = {
  power: 'How hard your strikes land, and how much a throw hurts.',
  speed: 'How fast you walk and run.',
  grapple: 'How far your grab reaches, how long you can hold a grabbed enemy, and how many slaps land before the finisher.',
  toughness: 'How much health you bring, and how much of every hit you shrug off.',
};

export interface StatFigure {
  /** Short tag, already translated for display. */
  label: string;
  value: string;
}

export interface StatTip {
  /** The translated stat name, shown as the tooltip heading. */
  label: string;
  body: string;
  figures: StatFigure[];
}

/** The tooltip for one bar on one fighter's card. */
export function statTip(f: FighterDef, k: StatKey, tr: (s: string) => string = (s) => s): StatTip {
  const figures: StatFigure[] = [];
  switch (k) {
    case 'power':
      figures.push(
        { label: 'HEAVY', value: String(ATTACKS[f.heavy].damage) },
        { label: 'THROW', value: String(f.throwDamage) },
      );
      break;
    case 'speed':
      figures.push(
        { label: 'RUN', value: f.run.toFixed(1) },
        { label: 'WALK', value: f.walk.toFixed(1) },
      );
      break;
    case 'grapple':
      figures.push(
        { label: 'REACH', value: String(f.grabRange) },
        { label: 'HOLD', value: `${(f.grabHold / TICK_HZ).toFixed(1)}s` },
        { label: 'SLAPS', value: String(f.grabHits ?? 3) },
      );
      break;
    case 'toughness':
      figures.push(
        { label: 'HP', value: String(f.maxHp) },
        // the share of an incoming hit that actually lands: 1 / defense
        { label: 'TAKEN', value: `${Math.round(100 / f.defense)}%` },
      );
      break;
  }
  return {
    label: tr(k.toUpperCase()),
    body: tr(BODY[k]),
    figures: figures.map((x) => ({ label: tr(x.label), value: x.value })),
  };
}
