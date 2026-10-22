import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FIGHTERS, FIGHTER_IDS, SECRET_OF, STARTER_IDS, type FighterId } from '../src/shared/data/fighters';
import { ATTACKS } from '../src/shared/data/attacks';

// The two hidden fighters ship as data: a page imported into the atlas, a stat line and a
// chain of attacks. A typo in any of those links shows up in game as an invisible fighter or
// a fighter that freezes on the first punch, so the wiring is pinned down here.

const index: Record<string, string> = JSON.parse(readFileSync('public/assets/sprites/index.json', 'utf8'));
const atlas = (id: string) => JSON.parse(readFileSync(`public/assets/sprites/${id}.json`, 'utf8')) as {
  id: string; cell: [number, number]; anims: Record<string, { frames: { i: number }[] }>; count: number;
};

describe('roster', () => {
  it('starts with the two heroes and hides the other two behind a card each', () => {
    expect(STARTER_IDS).toEqual(['bt', 'sc']);
    expect(Object.keys(SECRET_OF).sort()).toEqual(['bt', 'sc']);
    for (const id of FIGHTER_IDS) {
      const f = FIGHTERS[id];
      expect(f.id, id).toBe(id);
      expect(f.secret ?? false, `${id} visibility`).toBe(STARTER_IDS.includes(id) === false);
      if (f.secret) expect(SECRET_OF[f.unlockFrom!], `${id} is behind ${f.unlockFrom}`).toBe(id);
    }
  });

  it('gives every fighter exactly one maxed stat, and a different one each', () => {
    const maxed = Object.fromEntries(FIGHTER_IDS.map((id) => [
      id, Object.entries(FIGHTERS[id].stats).filter(([, v]) => v === 5).map(([k]) => k),
    ]));
    expect(maxed).toEqual({ bt: ['speed'], sc: ['power'], ozzi: ['toughness'], aynur: ['grapple'] });
    // the maxed stat is the identity the select card advertises; nothing else competes with it
    for (const id of FIGHTER_IDS) {
      const values = Object.values(FIGHTERS[id].stats);
      expect(values.filter((v) => v === 5), `${id} has one 5`).toHaveLength(1);
      expect(values.filter((v) => v >= 3), `${id} is not a one-stat gimmick`).not.toHaveLength(1);
    }
  });

  it('backs the toughness bar with real survivability and the grapple bar with a real hold', () => {
    const effective = (id: FighterId) => FIGHTERS[id].maxHp * FIGHTERS[id].defense;
    // Ozzi's max toughness is the roster's highest effective health, paid for in damage
    expect(effective('ozzi')).toBeGreaterThan(effective('sc'));
    expect(effective('ozzi')).toBeGreaterThan(effective('bt'));
    expect(FIGHTERS.ozzi.stats.power).toBeLessThan(FIGHTERS.sc.stats.power);
    // S.C. keeps max power but her grapple is one notch below the specialist
    expect(FIGHTERS.sc.stats.grapple).toBe(4);
    expect(FIGHTERS.sc.grabHold).toBeLessThan(FIGHTERS.aynur.grabHold);
    expect(FIGHTERS.aynur.grabHold).toBeGreaterThan(FIGHTERS.sc.grabHold);
    expect(FIGHTERS.aynur.grabHits).toBeGreaterThan(FIGHTERS.sc.grabHits ?? 3);
  });

  it('keeps every stat bar inside the five-segment track', () => {
    for (const id of FIGHTER_IDS) {
      for (const [k, v] of Object.entries(FIGHTERS[id].stats)) {
        expect(Number.isInteger(v), `${id} ${k}`).toBe(true);
        expect(v, `${id} ${k}`).toBeGreaterThanOrEqual(1);
        expect(v, `${id} ${k}`).toBeLessThanOrEqual(5);
      }
    }
  });

  it('places Ozzi between the heroes without feeling like either of them', () => {
    const { bt, sc, ozzi } = FIGHTERS;
    // power sits between S.C.'s haymaker and B.T.'s jab, speed above S.C. and below B.T.
    expect(ozzi.stats.power).toBeGreaterThan(bt.stats.power);
    expect(ozzi.stats.power).toBeLessThan(sc.stats.power);
    expect(ozzi.stats.speed).toBeGreaterThan(sc.stats.speed);
    expect(ozzi.stats.speed).toBeLessThan(bt.stats.speed);
    expect(ozzi.maxHp).toBeGreaterThan(bt.maxHp);
    expect(ozzi.maxHp).toBeLessThan(sc.maxHp);
    expect(ozzi.run).toBeGreaterThan(sc.run);
    expect(ozzi.run).toBeLessThan(bt.run);
    // his own feel: fewer hits than B.T.'s chain and no launch, but longer reach and the
    // quickest dodge in the roster
    expect([bt, sc, ozzi].every((f) => ozzi.dodgeTicks <= f.dodgeTicks)).toBe(true);
    const ozziReach = ATTACKS[ozzi.heavy].box[1];
    expect(ozziReach).toBeGreaterThan(ATTACKS[bt.heavy].box[1]);
    expect(ATTACKS[ozzi.heavy].damage).toBeLessThan(ATTACKS[sc.heavy].damage);
    expect(FIGHTERS.ozzi.light).toBe('ozzi_l1');
    expect(ATTACKS.ozzi_l1.next).toBe('ozzi_l2');
    expect(ATTACKS.ozzi_l2.next).toBe('ozzi_l3');
    expect(ATTACKS.ozzi_l3.next, 'three hits, not four').toBeUndefined();
  });

  it('makes Aynur the hold specialist: longest reach and hold, most slaps', () => {
    const { bt, sc, ozzi, aynur } = FIGHTERS;
    expect(aynur.grabRange).toBeGreaterThan(Math.max(bt.grabRange, sc.grabRange, ozzi.grabRange));
    expect(aynur.grabHold).toBeGreaterThan(Math.max(bt.grabHold, sc.grabHold));
    expect(aynur.grabHits).toBeGreaterThan(3);
    expect(aynur.stats.grapple).toBe(5);
    expect(aynur.stats.power).toBeLessThan(sc.stats.power);
    expect(aynur.throwDamage).toBeGreaterThan(bt.throwDamage);
    // S.C. owns the big throw; Aynur's is a repositioning tool for after a few slaps.
    expect(aynur.throwDamage).toBeLessThan(sc.throwDamage);
    // her slap is the grab attack itself, so the victim stays in the hold for it
    expect(ATTACKS[aynur.grabAtk].anim).toBe('slap');
  });

  it('trades reach for the clinch: shortest strikes, strongest five-slap finish', () => {
    const { aynur } = FIGHTERS;
    const heavyReach = (id: FighterId) => ATTACKS[FIGHTERS[id].heavy].box[1];
    // her normals are the shortest in the roster; the grab is the one long tool she has
    for (const id of FIGHTER_IDS) {
      if (id === 'aynur') continue;
      expect(heavyReach('aynur'), `shorter heavy than ${id}`).toBeLessThan(heavyReach(id));
    }
    // Finishing the five-slap string must beat slapping four times and throwing: the
    // signature combo is the payoff, not a worse option than cashing out early.
    const slap = ATTACKS[aynur.grabAtk].damage;
    const hits = aynur.grabHits ?? 3;
    const full = slap * (hits - 1) + slap + (aynur.grabFinisher ?? 3);
    const earlyThrow = slap * (hits - 1) + aynur.throwDamage;
    expect(full).toBeGreaterThan(earlyThrow);
  });
});

describe('fighter sheets and attacks', () => {
  it('ships an imported atlas for every fighter, indexed for the loader', () => {
    for (const id of FIGHTER_IDS) {
      const sheetId: string = FIGHTERS[id].sheet;
      expect(index[sheetId], `${id} in index.json`).toBe(`${sheetId}.json`);
      const a = atlas(sheetId);
      expect(a.id).toBe(sheetId);
      expect(a.count).toBeGreaterThan(20);
      // idle, walk/run, hurt, grab and the knock-down cycle all have to exist
      for (const anim of ['idle', 'walk', 'run', 'hurt', 'hold', 'grabatk', 'throw', 'knock', 'down', 'getup', 'victory']) {
        expect(a.anims[anim]?.frames.length, `${sheetId}.${anim}`).toBeGreaterThan(0);
      }
    }
  });

  it('resolves every fighter move to a defined attack and a real animation on its sheet', () => {
    for (const id of FIGHTER_IDS as readonly FighterId[]) {
      const f = FIGHTERS[id];
      const a = atlas(f.sheet);
      const moves = [f.light, f.heavy, f.jumpAtk, f.runAtk, f.grabAtk];
      // follow any light chain to its end as well
      for (let move = ATTACKS[f.light]; move?.next; move = ATTACKS[move.next]) moves.push(move.next);
      for (const move of moves) {
        const atk = ATTACKS[move];
        expect(atk, `${id} ${move}`).toBeDefined();
        expect(a.anims[atk.anim]?.frames.length, `${id} ${move} -> ${atk.anim}`).toBeGreaterThan(0);
      }
    }
  });
});
