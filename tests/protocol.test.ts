import { describe, it, expect } from 'vitest';
import { validateClientMsg, parseClientPayload, normalizeRoomCode, makeRoomCode, PROTOCOL_VERSION, MAX_MSG_BYTES } from '../src/shared/net/protocol';
import { Sim } from '../src/shared/sim/sim';
import { encode, decode } from '../src/shared/sim/snapshot';

describe('protocol validation', () => {
  it('accepts well-formed messages', () => {
    expect(validateClientMsg({ t: 'hello', v: PROTOCOL_VERSION, name: 'Ayşe', token: 'abc123', f: 'bt' })).toBeTruthy();
    expect(validateClientMsg({ t: 'in', s: 5, h: 3, p: 1 })).toEqual({ t: 'in', s: 5, h: 3, p: 1 });
    expect(validateClientMsg({ t: 'cmd', c: 'buy', item: 'ayran', nonce: 'x1' })).toBeTruthy();
  });
  it('rejects malformed, out-of-range and impossible messages', () => {
    expect(validateClientMsg(null)).toBeNull();
    expect(validateClientMsg({ t: 'hello', v: 999, name: 'x', token: 'y', f: 'bt' })).toBeNull();
    expect(validateClientMsg({ t: 'hello', v: PROTOCOL_VERSION, name: 'x', token: 'y', f: 'ninja' })).toBeNull();
    expect(validateClientMsg({ t: 'in', s: -1, h: 0, p: 0 })).toBeNull();
    expect(validateClientMsg({ t: 'in', s: 1, h: 99999999, p: 0 })).toBeNull();
    expect(validateClientMsg({ t: 'in', s: 1.5, h: 0, p: 0 })).toBeNull();
    expect(validateClientMsg({ t: 'cmd', c: 'buy', item: 'gold', nonce: 'x' })).toBeNull();
    expect(validateClientMsg({ t: 'cmd', c: 'givemoney', amount: 1e9 })).toBeNull();
    expect(validateClientMsg({ t: 'start', ch: 7 })).toBeNull();
    expect(validateClientMsg({ t: 'hp', v: 999 })).toBeNull();
    expect(parseClientPayload('{not json')).toBeNull();
    expect(parseClientPayload('x'.repeat(MAX_MSG_BYTES + 1))).toBeNull();
  });
  it('cleans player names', () => {
    const m = validateClientMsg({ t: 'hello', v: PROTOCOL_VERSION, name: '<b>x</b>', token: 't', f: 'sc' });
    expect(m && m.t === 'hello' && m.name).not.toContain('<');
  });
  it('normalises room codes', () => {
    expect(normalizeRoomCode(' ab3cd ')).toBe('AB3CD');
    expect(normalizeRoomCode('ABCD')).toBeNull();
    expect(normalizeRoomCode('AB0CD')).toBeNull(); // 0 is not in the alphabet (looks like O)
    expect(normalizeRoomCode(makeRoomCode())).not.toBeNull();
  });
  it('snapshots round-trip through JSON', () => {
    const sim = new Sim({ seed: 1 });
    sim.addPlayer('a', 'bt', 'A'); sim.start();
    for (let i = 0; i < 200; i++) sim.step();
    const wire = JSON.parse(JSON.stringify(encode(sim, [])));
    const v = decode(wire);
    expect(v.players[0].pid).toBe('a');
    expect(v.ents.length).toBe(sim.ents.length);
    expect(v.ents[0].x).toBeCloseTo(sim.ents[0].x, 0);
    expect(JSON.stringify(wire).length).toBeLessThan(4000);
  });
});
