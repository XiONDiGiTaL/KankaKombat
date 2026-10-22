import { describe, expect, it } from 'vitest';
import { RUMBLE, Rumble, classifyHit, type HapticPad, type RumbleKind } from '../src/client/input/rumble';

// Rumble is the only feedback that reaches a pad, and it is invisible in tests unless the
// classifier and the dispatcher are pinned: a tram must not feel like a jab, and a pad that
// rejects playEffect must never break the frame.

const recordingPad = (calls: { type: string; params: unknown }[], fail = false): HapticPad => ({
  vibrationActuator: {
    playEffect: (type, params) => {
      calls.push({ type, params });
      return fail ? Promise.reject(new Error('not supported')) : Promise.resolve('ok');
    },
  },
});

describe('hit classification', () => {
  it('maps the local player landing a hit by weight', () => {
    expect(classifyHit({ source: true, target: false })).toBe('hit');
    expect(classifyHit({ source: true, target: false, heavy: true })).toBe('hitHeavy');
    expect(classifyHit({ source: true, target: false, block: true })).toBe('block');
  });

  it('maps taking a hit harder than dealing one, and a vehicle hardest', () => {
    expect(classifyHit({ source: false, target: true })).toBe('hurt');
    expect(classifyHit({ source: false, target: true, heavy: true })).toBe('hurtHeavy');
    expect(classifyHit({ source: false, target: true, block: true })).toBe('block');
    expect(classifyHit({ source: false, target: true, hazard: true })).toBe('vehicle');
    // a vehicle always wins, even if the event is somehow tagged with a source
    expect(classifyHit({ source: true, target: true, hazard: true })).toBe('vehicle');
  });

  it('stays quiet for hits between other fighters', () => {
    expect(classifyHit({ source: false, target: false })).toBeNull();
    expect(classifyHit({ source: false, target: false, hazard: true })).toBeNull();
  });

  it('scales duration and motor strength with the weight of the effect', () => {
    const strength: RumbleKind[] = ['block', 'hit', 'grab', 'hitHeavy', 'hurt', 'throw', 'hurtHeavy', 'vehicle'];
    const length: RumbleKind[] = ['block', 'hit', 'grab', 'hurt', 'hitHeavy', 'throw', 'hurtHeavy', 'vehicle'];
    for (let i = 1; i < strength.length; i++) {
      expect(RUMBLE[strength[i]].strong, `${strength[i]} is stronger than ${strength[i - 1]}`)
        .toBeGreaterThan(RUMBLE[strength[i - 1]].strong);
    }
    for (let i = 1; i < length.length; i++) {
      expect(RUMBLE[length[i]].duration, `${length[i]} lasts longer than ${length[i - 1]}`)
        .toBeGreaterThan(RUMBLE[length[i - 1]].duration);
    }
    for (const e of Object.values(RUMBLE)) {
      expect(e.duration).toBeGreaterThan(0);
      for (const v of [e.strong, e.weak]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('pad dispatch', () => {
  it('plays a dual-rumble effect on every connected pad', () => {
    const callsA: { type: string; params: unknown }[] = [];
    const callsB: { type: string; params: unknown }[] = [];
    const rumble = new Rumble(() => [recordingPad(callsA), null, recordingPad(callsB)], () => 1000);
    rumble.play('hit');
    for (const calls of [callsA, callsB]) {
      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe('dual-rumble');
      expect(calls[0].params).toEqual({
        duration: RUMBLE.hit.duration,
        strongMagnitude: RUMBLE.hit.strong,
        weakMagnitude: RUMBLE.hit.weak,
        startDelay: 0,
      });
    }
  });

  it('suppresses a second burst inside the same couple of frames', () => {
    const calls: { type: string; params: unknown }[] = [];
    let now = 0;
    const rumble = new Rumble(() => [recordingPad(calls)], () => now);
    rumble.play('hit');
    rumble.play('vehicle');   // same instant: the motors are already spinning
    expect(calls).toHaveLength(1);
    now = 40;
    rumble.play('vehicle');
    expect(calls).toHaveLength(2);
    expect((calls[1].params as { strongMagnitude: number }).strongMagnitude).toBe(RUMBLE.vehicle.strong);
  });

  it('does nothing when rumble is turned off or no pad can vibrate', async () => {
    const calls: { type: string; params: unknown }[] = [];
    const off = new Rumble(() => [recordingPad(calls)], () => 0, () => false);
    off.play('vehicle');
    expect(calls).toHaveLength(0);

    const bare = new Rumble(() => [{}, { vibrationActuator: null }, null, undefined], () => 0);
    expect(() => bare.play('grab')).not.toThrow();
  });

  it('survives a pad that rejects the effect', async () => {
    const calls: { type: string; params: unknown }[] = [];
    const rumble = new Rumble(() => [recordingPad(calls, true)], () => 0);
    expect(() => rumble.play('throw')).not.toThrow();
    await Promise.resolve();
    expect(calls).toHaveLength(1);
  });
});
