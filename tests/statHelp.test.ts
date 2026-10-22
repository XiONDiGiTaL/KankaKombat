import { describe, expect, it } from 'vitest';
import { ATTACKS } from '../src/shared/data/attacks';
import { TICK_HZ } from '../src/shared/data/constants';
import { FIGHTERS, FIGHTER_IDS } from '../src/shared/data/fighters';
import { STAT_KEYS, statTip } from '../src/client/statHelp';
import { TR } from '../src/client/i18n';

// The select cards claim what a bar does ("max power", "max grapple"). A tooltip that
// drifts from the simulation would be worse than no tooltip, so the text is pinned to the
// same fields combat and movement read.

const max = (pick: (id: (typeof FIGHTER_IDS)[number]) => number) => Math.max(...FIGHTER_IDS.map(pick));

describe('fighter stat tooltips', () => {
  it('explains all four bars on every card, with live numbers for each', () => {
    for (const id of FIGHTER_IDS) {
      for (const k of STAT_KEYS) {
        const tip = statTip(FIGHTERS[id], k);
        expect(tip.label, `${id}.${k} label`).not.toBe('');
        expect(tip.body, `${id}.${k} body`).toMatch(/\.$/);
        expect(tip.figures, `${id}.${k} figures`).toHaveLength(k === 'grapple' ? 3 : 2);
        for (const fig of tip.figures) {
          expect(fig.label, `${id}.${k} figure label`).not.toBe('');
          expect(fig.value, `${id}.${k} figure value`).toMatch(/^\d/);
        }
      }
    }
  });

  it('quotes the damage the combat code actually applies', () => {
    for (const id of FIGHTER_IDS) {
      const f = FIGHTERS[id];
      const tip = statTip(f, 'power');
      expect(tip.figures.map((x) => [x.label, x.value])).toEqual([
        ['HEAVY', String(ATTACKS[f.heavy].damage)],
        ['THROW', String(f.throwDamage)],
      ]);
    }
  });

  it('quotes the movement numbers, the grab reach/hold and the damage share', () => {
    for (const id of FIGHTER_IDS) {
      const f = FIGHTERS[id];
      expect(statTip(f, 'speed').figures.map((x) => x.value)).toEqual([f.run.toFixed(1), f.walk.toFixed(1)]);
      expect(statTip(f, 'grapple').figures.map((x) => x.value)).toEqual([
        String(f.grabRange),
        `${(f.grabHold / TICK_HZ).toFixed(1)}s`,
        String(f.grabHits ?? 3),
      ]);
      expect(statTip(f, 'toughness').figures.map((x) => x.value)).toEqual([
        String(f.maxHp),
        `${Math.round(100 / f.defense)}%`,
      ]);
    }
    // the defaults every non-Aynur grappler inherits, so "3 SLAPS" is not an accident
    expect(statTip(FIGHTERS.bt, 'grapple').figures[2].value).toBe('3');
    expect(statTip(FIGHTERS.aynur, 'grapple').figures[2].value).toBe('5');
    expect(statTip(FIGHTERS.aynur, 'grapple').figures[1].value).toBe('4.0s');
    expect(statTip(FIGHTERS.aynur, 'grapple').figures[0].value).toBe(String(FIGHTERS.aynur.grabRange));
  });

  it('makes each maxed bar the roster lead in that stat', () => {
    // power — S.C. hits hardest and throws hardest
    expect(ATTACKS[FIGHTERS.sc.heavy].damage).toBe(max((id) => ATTACKS[FIGHTERS[id].heavy].damage));
    expect(FIGHTERS.sc.throwDamage).toBe(max((id) => FIGHTERS[id].throwDamage));
    // speed — B.T. walks and runs fastest (Ozzi's quicker sidestep is a dodge, not pace)
    expect(FIGHTERS.bt.run).toBe(max((id) => FIGHTERS[id].run));
    expect(FIGHTERS.bt.walk).toBe(max((id) => FIGHTERS[id].walk));
    // grapple — Aynur reaches farthest, holds longest and lands the extra slaps
    expect(FIGHTERS.aynur.grabRange).toBe(max((id) => FIGHTERS[id].grabRange));
    expect(FIGHTERS.aynur.grabHold).toBe(max((id) => FIGHTERS[id].grabHold));
    expect(FIGHTERS.aynur.grabHits).toBe(max((id) => FIGHTERS[id].grabHits ?? 3));
    // toughness — Ozzi keeps the largest share of every hit, and once defence is counted he
    // outlasts S.C.'s bigger raw bar (health x defence is the damage he can absorb)
    expect(Math.round(100 / FIGHTERS.ozzi.defense)).toBe(Math.min(...FIGHTER_IDS.map((id) => Math.round(100 / FIGHTERS[id].defense))));
    expect(FIGHTERS.ozzi.maxHp * FIGHTERS.ozzi.defense).toBe(max((id) => FIGHTERS[id].maxHp * FIGHTERS[id].defense));
  });

  it('has a Turkish line for every heading, explanation and figure tag', () => {
    for (const id of FIGHTER_IDS) {
      for (const k of STAT_KEYS) {
        const tip = statTip(FIGHTERS[id], k);
        expect(TR[tip.body], `${id}.${k} body translation`).toBeTruthy();
        expect(TR[tip.label], `${id}.${k} label translation`).toBeTruthy();
        for (const fig of tip.figures) expect(TR[fig.label], `${id}.${k} "${fig.label}" translation`).toBeTruthy();
      }
    }
    const tr = statTip(FIGHTERS.bt, 'grapple', (s) => TR[s] ?? s);
    expect(tr.label).toBe('TUTUŞ');
    expect(tr.figures.map((x) => x.label)).toEqual(['ERİM', 'TUTMA', 'TOKAT']);
    expect(tr.body).not.toMatch(/^How /);
  });

  it('defaults to English, so a caller with no translator still gets text', () => {
    const tip = statTip(FIGHTERS.ozzi, 'toughness');
    expect(tip.label).toBe('TOUGHNESS');
    expect(tip.body).toBe('How much health you bring, and how much of every hit you shrug off.');
    expect(tip.figures.map((x) => x.label)).toEqual(['HP', 'TAKEN']);
    expect(tip.figures.map((x) => x.value)).toEqual(['120', '82%']);
  });
});
