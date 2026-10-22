// Ambient townsfolk for the peaceful stretches of each chapter. They are deliberately
// cosmetic: they walk past, never collide, never fight, and are never part of the snapshot,
// exactly like the bystanders in River City Ransom. Each section gets a small seeded crowd,
// so the same street always starts with the same faces, and the crowd keeps recycling as
// the camera moves.

import { SCREEN_W } from '../shared/data/constants';
import { npcIds } from './render/npcs';

export interface Walker {
  npc: string;
  x: number;
  z: number;
  dir: 1 | -1;
  speed: number;
  walk: number;      // distance travelled, drives the stride frames
}

const MAX_WALKERS = 6;
const WALKER_SPEED: [number, number] = [0.32, 0.75];

export class Crowd {
  walkers: Walker[] = [];
  private seed = 1;
  private want = 0;
  private sectionKey = '';

  private rnd(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed % 100000) / 100000;
  }

  /** Rebuild the crowd for a section. `count` of 0 empties the street (fighting zones). */
  reset(sectionKey: string, count: number): void {
    if (sectionKey === this.sectionKey) return;
    this.sectionKey = sectionKey;
    this.seed = 1;
    for (let i = 0; i < sectionKey.length; i++) this.seed = (this.seed * 31 + sectionKey.charCodeAt(i)) % 2147483647;
    this.want = Math.min(count, MAX_WALKERS);
    this.walkers = [];
  }

  private make(dir: 1 | -1, x: number, self?: Walker): Walker {
    // no twins on one street: skip the faces already walking here so a crowd reads as a crowd
    const ids = npcIds();
    const used = new Set(this.walkers.filter((w) => w !== self).map((w) => w.npc));
    const free = ids.filter((id) => !used.has(id));
    const pool = free.length ? free : ids;
    const npc = pool.length ? pool[Math.floor(this.rnd() * pool.length)] : 'turkish';
    const sp = WALKER_SPEED[0] + this.rnd() * (WALKER_SPEED[1] - WALKER_SPEED[0]);
    return { npc, x, z: 6 + this.rnd() * 26, dir, speed: sp, walk: this.rnd() * 40 };
  }

  /** Seed the street around the camera, then keep the traffic flowing as it moves. */
  step(camX: number): void {
    while (this.walkers.length < this.want) {
      const dir: 1 | -1 = this.rnd() < 0.5 ? 1 : -1;
      this.walkers.push(this.make(dir, camX + this.rnd() * SCREEN_W));
    }
    while (this.walkers.length > this.want) this.walkers.pop();
    for (const w of this.walkers) {
      w.x += w.speed * w.dir;
      w.walk += w.speed;
      // someone who leaves the frame comes back in from the far side, walking inwards
      if (w.x < camX - 70) Object.assign(w, this.make(-1, camX + SCREEN_W + 40 + this.rnd() * 60, w));
      else if (w.x > camX + SCREEN_W + 70) Object.assign(w, this.make(1, camX - 40 - this.rnd() * 60, w));
    }
  }
}
