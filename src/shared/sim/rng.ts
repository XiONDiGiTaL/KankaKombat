// Seeded PRNG (mulberry32): the authoritative simulation never touches Math.random.
export class Rng {
  constructor(public s: number) { this.s = s >>> 0; }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(lo: number, hi: number): number { return lo + Math.floor(this.next() * (hi - lo + 1)); }
  chance(p: number): boolean { return this.next() < p; }
  pick<T>(a: readonly T[]): T { return a[Math.floor(this.next() * a.length)]; }
  weighted<T>(items: readonly { w: number; v: T }[]): T {
    const total = items.reduce((s, i) => s + i.w, 0);
    let r = this.next() * total;
    for (const i of items) { if ((r -= i.w) < 0) return i.v; }
    return items[items.length - 1].v;
  }
}
