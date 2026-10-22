import { describe, expect, it } from 'vitest';
import { LEGEND_FADE, LEGEND_TICKS, drawControlLegend, legendAlpha, legendRows } from '../src/client/render/controllegend';
import { DEFAULT_KEYS } from '../src/client/input/input';
import type { BtnName } from '../src/shared/data/input';

// The control card is the only place a player can see the *current* bindings without
// leaving the first street, so it has to follow remaps rather than print defaults.

const keys = (patch: Partial<Record<BtnName, string[]>> = {}): Record<BtnName, string[]> =>
  ({ ...DEFAULT_KEYS, ...patch } as Record<BtnName, string[]>);

describe('control legend', () => {
  it('lists every action with its keyboard binding and the pad button beside it', () => {
    const rows = legendRows(keys());
    expect(rows.map((r) => r.action)).toEqual([
      'MOVE', 'LIGHT', 'HEAVY', 'JUMP', 'GRAB', 'BLOCK', 'DODGE', 'RUN', 'EAT', 'NEXT ITEM', 'PAUSE',
    ]);
    const by = (action: string) => rows.find((r) => r.action === action)!;
    expect(by('MOVE').keys).toBe('ARROWS');
    expect(by('MOVE').pad).toBe('D-PAD/STICK');
    expect(by('LIGHT').keys).toBe('Z');
    expect(by('LIGHT').pad).toBe('X');
    expect(by('HEAVY').keys).toBe('X');
    expect(by('JUMP').keys).toBe('A/SPACE');
    expect(by('EAT').keys).toBe('Q/E');
    expect(by('NEXT ITEM').keys).toBe('W/F');
    expect(by('PAUSE').keys).toBe('ENTER');
    expect(by('PAUSE').pad).toBe('START');
  });

  it('shows remapped keys, including a remapped direction pad', () => {
    const rows = legendRows(keys({ LIGHT: ['KeyJ'], DODGE: ['ShiftLeft'], UP: ['KeyW'] }));
    expect(rows.find((r) => r.action === 'LIGHT')!.keys).toBe('J');
    expect(rows.find((r) => r.action === 'DODGE')!.keys).toBe('SHIFT');
    // no longer the arrow cluster, so the card prints the keys instead of "ARROWS"
    const move = rows.find((r) => r.action === 'MOVE')!.keys;
    expect(move).toContain('W');
    expect(move).toContain('←');
  });

  it('drops a row whose binding was cleared rather than printing an empty column', () => {
    const rows = legendRows(keys({ BLOCK: [], RUN: [] }));
    expect(rows.find((r) => r.action === 'BLOCK')).toBeUndefined();
    expect(rows.find((r) => r.action === 'RUN')).toBeUndefined();
  });

  it('holds for most of its life and fades out at the end', () => {
    expect(legendAlpha(LEGEND_TICKS)).toBe(1);
    expect(legendAlpha(LEGEND_FADE)).toBe(1);
    expect(legendAlpha(LEGEND_FADE / 2)).toBeCloseTo(0.5);
    expect(legendAlpha(0)).toBe(0);
    expect(legendAlpha(-10)).toBe(0);
    // monotonic over the tail, so the card never blinks back in
    let prev = legendAlpha(LEGEND_TICKS);
    for (let t = LEGEND_TICKS; t >= 0; t -= 7) {
      const a = legendAlpha(t);
      expect(a).toBeLessThanOrEqual(prev + 1e-9);
      prev = a;
    }
  });

  it('draws the rows at the requested alpha and restores the context', () => {
    const calls: string[] = [];
    let alpha = 1;
    const ctx = {
      set globalAlpha(v: number) { alpha = v; },
      get globalAlpha() { return alpha; },
      set fillStyle(v: string) { calls.push(v); },
      get fillStyle() { return ''; },
      fillRect: () => {},
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
    } as unknown as CanvasRenderingContext2D;
    const rows = legendRows(keys());
    drawControlLegend(ctx, rows, 0.4);
    expect(alpha).toBe(0.4);
    expect(calls.includes('restore')).toBe(true);
    const before = calls.length;
    drawControlLegend(ctx, rows, 0);
    expect(calls.length, 'nothing is drawn once faded out').toBe(before);
  });
});
