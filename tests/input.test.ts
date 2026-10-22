import { describe, expect, it } from 'vitest';
import { BTN, BtnName } from '../src/shared/data/input';
import { DEFAULT_KEYS, keyLabel } from '../src/client/input/input';

// The default keyboard layout is the game's contract with the player: it is printed in the
// How-to-Play sheet, in the README and in the trailer. These checks keep it the emulator block
// it is meant to be, and stop two actions from fighting over one key.

const KEY_CODES = Object.keys(DEFAULT_KEYS) as BtnName[];

describe('default controls', () => {
  it('maps every action to at least one key and never repeats a key', () => {
    const seen = new Map<string, BtnName>();
    for (const btn of KEY_CODES) {
      expect(DEFAULT_KEYS[btn].length, btn).toBeGreaterThan(0);
      for (const code of DEFAULT_KEYS[btn]) {
        expect(seen.get(code), `${code} is bound to ${seen.get(code)} and ${btn}`).toBeUndefined();
        seen.set(code, btn);
      }
    }
  });

  it('keeps the two attack buttons under the right hand, Z and X', () => {
    expect(DEFAULT_KEYS.LIGHT).toContain('KeyZ');
    expect(DEFAULT_KEYS.HEAVY).toContain('KeyX');
    // the menu contract: LIGHT confirms, HEAVY cancels
    expect(DEFAULT_KEYS.LIGHT).toHaveLength(1);
    expect(DEFAULT_KEYS.HEAVY).toHaveLength(1);
  });

  it('leaves movement on the d-pad arrows, not on WASD', () => {
    expect(DEFAULT_KEYS.LEFT).toEqual(['ArrowLeft']);
    expect(DEFAULT_KEYS.RIGHT).toEqual(['ArrowRight']);
    expect(DEFAULT_KEYS.UP).toEqual(['ArrowUp']);
    expect(DEFAULT_KEYS.DOWN).toEqual(['ArrowDown']);
  });

  it('uses only keys around the left hand block and the arrow cluster', () => {
    const allowed = new Set([
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'KeyZ', 'KeyX', 'KeyA', 'KeyS', 'KeyD', 'KeyC', 'KeyV',
      'KeyQ', 'KeyW', 'KeyE', 'KeyF', 'Space', 'Enter', 'NumpadEnter',
    ]);
    for (const btn of KEY_CODES) for (const code of DEFAULT_KEYS[btn]) expect(allowed.has(code), `${btn} uses ${code}`).toBe(true);
  });

  it('covers every game button', () => {
    for (const btn of Object.keys(BTN) as BtnName[]) expect(DEFAULT_KEYS[btn], btn).toBeDefined();
  });

  it('prints arrow keys and confirmation keys legibly', () => {
    expect(keyLabel('ArrowLeft')).toBe('←');
    expect(keyLabel('ArrowUp')).toBe('↑');
    expect(keyLabel('KeyZ')).toBe('Z');
    expect(keyLabel('Enter')).toBe('ENTER');
    expect(keyLabel('KeyW')).toBe('W');
  });
});
