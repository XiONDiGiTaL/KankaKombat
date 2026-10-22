// Per-player hit chains for the HUD. Purely cosmetic: the simulation still decides every
// hit; this only groups the hits a player landed closely enough together to read as a combo.

/** Ticks a combo stays alive after the last landed hit (one second at 60 Hz). */
export const COMBO_TTL = 60;
/** The last ticks of that window fade the plate out instead of popping it away. */
export const COMBO_FADE = 18;

interface Combo {
  n: number;
  ttl: number;
  pop: number;
}

export interface ComboView {
  n: number;
  /** 1 while the chain is live, falling to 0 over the last COMBO_FADE ticks. */
  alpha: number;
  /** Ticks left on the hit flash; the renderer uses it for the white count flash. */
  pop: number;
}

export class Combos {
  private map = new Map<number, Combo>();

  /** Register one landed hit. Blocks and zero-damage pokes do not extend a chain, and
   *  hazards have no player source, so only real player hits ever start a counter. */
  hit(src: number, dmg: number, block = false): void {
    if (src < 0 || dmg <= 0 || block) return;
    const c = this.map.get(src);
    if (c && c.ttl > 0) {
      c.n = Math.min(999, c.n + 1);
      c.ttl = COMBO_TTL;
      c.pop = 5;
      return;
    }
    this.map.set(src, { n: 1, ttl: COMBO_TTL, pop: 5 });
  }

  /** Runs on the fixed 60 Hz tick, so a 120 Hz display cannot fade a combo twice as fast. */
  step(): void {
    for (const [id, c] of this.map) {
      if (c.pop > 0) c.pop--;
      if (c.ttl > 0) c.ttl--;
      if (c.ttl <= 0) this.map.delete(id);
    }
  }

  /** A hit on the player ends their chain at once; it must not keep counting while they
   *  are being staggered, even if they land another blow before the old timer expires. */
  breakChain(id: number): void {
    this.map.delete(id);
  }

  /** A chain is only worth showing from the second hit onward. */
  get(id: number): ComboView | undefined {
    const c = this.map.get(id);
    if (!c || c.n < 2) return undefined;
    return { n: c.n, alpha: Math.min(1, c.ttl / COMBO_FADE), pop: c.pop };
  }

  clear(): void {
    this.map.clear();
  }
}
