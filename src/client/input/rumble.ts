// Controller rumble: short dual-rumble effects on the pads a browser exposes. The same
// classifier turns a simulation hit into the right weight, so a chip on guard feels like
// a tap while a tram sends the pad to full strength.

export type RumbleKind = 'hit' | 'hitHeavy' | 'hurt' | 'hurtHeavy' | 'block' | 'grab' | 'throw' | 'vehicle';

export interface RumbleEffect {
  duration: number;   // ms
  strong: number;     // 0..1 low-frequency motor
  weak: number;       // 0..1 high-frequency motor
}

/** Durations and strengths, ordered so anything sharper is felt as such. */
export const RUMBLE: Record<RumbleKind, RumbleEffect> = {
  block: { duration: 55, strong: 0.10, weak: 0.06 },
  hit: { duration: 90, strong: 0.22, weak: 0.35 },
  hitHeavy: { duration: 165, strong: 0.48, weak: 0.62 },
  grab: { duration: 120, strong: 0.36, weak: 0.20 },
  hurt: { duration: 155, strong: 0.52, weak: 0.30 },
  throw: { duration: 220, strong: 0.72, weak: 0.46 },
  hurtHeavy: { duration: 245, strong: 0.82, weak: 0.55 },
  vehicle: { duration: 340, strong: 1.00, weak: 0.80 },
};

export interface HapticActuator {
  playEffect?: (type: 'dual-rumble', params: { duration: number; strongMagnitude: number; weakMagnitude: number; startDelay?: number }) => Promise<unknown>;
}

export interface HapticPad { vibrationActuator?: HapticActuator | null }

export interface HitInfo {
  /** The local player threw the attack (or a thrown body / projectile they own). */
  source: boolean;
  /** The local player took the hit. */
  target: boolean;
  hazard?: boolean;
  heavy?: boolean;
  block?: boolean;
}

/** Which effect a hit deserves, or null when neither end of it belongs to this player. */
export function classifyHit(h: HitInfo): RumbleKind | null {
  if (!h.source && !h.target) return null;
  if (h.hazard) return 'vehicle';
  if (h.target) {
    if (h.block) return 'block';
    return h.heavy ? 'hurtHeavy' : 'hurt';
  }
  if (h.block) return 'block';
  return h.heavy ? 'hitHeavy' : 'hit';
}

const ACTUATOR = 'vibrationActuator';

/** The pads a browser currently exposes; missing API means no rumble, never an error. */
function connectedPads(): (HapticPad | null)[] {
  try {
    const pads = typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function'
      ? navigator.getGamepads()
      : [];
    return pads ? [...pads] : [];
  } catch { return []; }
}

export class Rumble {
  private last = -Infinity;

  constructor(
    private readonly pads: () => (HapticPad | null | undefined)[] = connectedPads,
    private readonly now: () => number = () => performance.now(),
    private readonly enabled: () => boolean = () => true,
  ) {}

  /** Fire one effect on every connected pad. Errors and missing support are ignored. */
  play(kind: RumbleKind): void {
    if (!this.enabled()) return;
    // one burst per frame is plenty: multi-hit moves would otherwise stack six motors
    const at = this.now();
    if (at - this.last < 25) return;
    this.last = at;
    const e = RUMBLE[kind];
    for (const pad of this.pads()) {
      const actuator = pad?.[ACTUATOR];
      if (!actuator?.playEffect) continue;
      try {
        const p = actuator.playEffect('dual-rumble', {
          duration: e.duration, strongMagnitude: e.strong, weakMagnitude: e.weak, startDelay: 0,
        });
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch { /* pad dropped out between polls */ }
    }
  }
}
