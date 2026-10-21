// Keyboard (remappable), gamepad and touch input merged into one button bitmask.
// Pressed edges are accumulated between samples so taps shorter than a frame still count.

import { BTN, BtnName } from '../../shared/data/input';
import { loadSettings, saveSettings } from '../settings';

export const ACTIONS: { id: BtnName; label: string }[] = [
  { id: 'LEFT', label: 'Move left' }, { id: 'RIGHT', label: 'Move right' }, { id: 'UP', label: 'Move up (into the street)' }, { id: 'DOWN', label: 'Move down (toward you)' },
  { id: 'LIGHT', label: 'Light attack / combo' }, { id: 'HEAVY', label: 'Heavy attack / throw' }, { id: 'JUMP', label: 'Jump' }, { id: 'GRAB', label: 'Grab / pick up / enter shop' },
  { id: 'BLOCK', label: 'Block (hold)' }, { id: 'DODGE', label: 'Dodge roll' }, { id: 'RUN', label: 'Run (hold) — or double-tap' }, { id: 'ITEM', label: 'Eat selected bag item' },
  { id: 'CYCLE', label: 'Next bag item' }, { id: 'START', label: 'Start / continue' },
];

export const DEFAULT_KEYS: Record<BtnName, string[]> = {
  LEFT: ['ArrowLeft', 'KeyA'], RIGHT: ['ArrowRight', 'KeyD'], UP: ['ArrowUp', 'KeyW'], DOWN: ['ArrowDown', 'KeyS'],
  LIGHT: ['KeyJ', 'KeyZ'], HEAVY: ['KeyK', 'KeyX'], JUMP: ['Space', 'KeyC'], GRAB: ['KeyL', 'KeyV'],
  BLOCK: ['KeyU', 'KeyB'], DODGE: ['KeyO', 'KeyN'], RUN: ['ShiftLeft', 'ShiftRight'], ITEM: ['KeyE', 'KeyF'],
  CYCLE: ['KeyQ', 'KeyR'], START: ['Enter', 'NumpadEnter'],
};

const PAD: Partial<Record<BtnName, number[]>> = {
  JUMP: [0], GRAB: [1], LIGHT: [2], HEAVY: [3], DODGE: [4], BLOCK: [5], ITEM: [6], RUN: [7], CYCLE: [8], START: [9],
  UP: [12], DOWN: [13], LEFT: [14], RIGHT: [15],
};

export function keyLabel(code: string): string {
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '').replace('Left', ' L').replace('Right', ' R').replace('Space', 'SPACE').replace('Numpad', 'NUM ');
}

export class Input {
  keys: Record<BtnName, string[]>;
  private keyHeld = new Set<string>();
  private touchHeld = 0;
  private pressed = 0;
  private padPrev = 0;
  enabled = true;
  onPause: () => void = () => {};
  onAnyKey: (code: string) => void = () => {};
  capture: ((code: string) => void) | null = null;

  constructor() {
    const s = loadSettings();
    this.keys = { ...DEFAULT_KEYS, ...(s.keys ?? {}) } as Record<BtnName, string[]>;
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => { this.keyHeld.clear(); this.touchHeld = 0; });
  }

  private typing(e: KeyboardEvent): boolean {
    const t = e.target as HTMLElement | null;
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  private bitFor(code: string): number {
    let b = 0;
    for (const [name, codes] of Object.entries(this.keys)) if (codes.includes(code)) b |= BTN[name as BtnName];
    return b;
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    if (this.typing(e)) return;
    if (this.capture && down) { e.preventDefault(); const c = this.capture; this.capture = null; c(e.code); return; }
    if (down && (e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) { this.onPause(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone
    const bit = this.bitFor(e.code);
    if (down && !e.repeat) this.onAnyKey(e.code);
    if (!bit) return;
    if (this.enabled) e.preventDefault();
    if (down) { if (!this.keyHeld.has(e.code) && this.enabled) this.pressed |= bit; this.keyHeld.add(e.code); }
    else this.keyHeld.delete(e.code);
  }

  setTouch(bit: number, down: boolean): void {
    if (down) { if (!(this.touchHeld & bit)) this.pressed |= bit; this.touchHeld |= bit; }
    else this.touchHeld &= ~bit;
  }

  private padBits(): number {
    let b = 0;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      for (const [name, idx] of Object.entries(PAD)) for (const i of idx!) if (p.buttons[i]?.pressed) b |= BTN[name as BtnName];
      const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0;
      if (ax < -0.4) b |= BTN.LEFT; if (ax > 0.4) b |= BTN.RIGHT; if (ay < -0.4) b |= BTN.UP; if (ay > 0.4) b |= BTN.DOWN;
    }
    return b;
  }

  /** Called once per 60 Hz tick. */
  sample(): { held: number; pressed: number } {
    let held = this.touchHeld;
    for (const code of this.keyHeld) held |= this.bitFor(code);
    const pad = this.padBits();
    held |= pad;
    const padPressed = pad & ~this.padPrev;
    this.padPrev = pad;
    const pressed = (this.pressed | padPressed) & (this.enabled ? ~0 : 0);
    this.pressed = 0;
    return this.enabled ? { held, pressed } : { held: 0, pressed: 0 };
  }

  rebind(action: BtnName, code: string): void {
    for (const k of Object.keys(this.keys) as BtnName[]) this.keys[k] = this.keys[k].filter((c) => c !== code);
    this.keys[action] = [code, ...this.keys[action].filter((c) => c !== code)].slice(0, 2);
    saveSettings({ keys: this.keys });
  }

  resetKeys(): void { this.keys = { ...DEFAULT_KEYS }; saveSettings({ keys: this.keys }); }
}
