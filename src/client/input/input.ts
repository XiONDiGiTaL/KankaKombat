// Keyboard (remappable), gamepad and touch input merged into one button bitmask.
// Pressed edges are accumulated between samples so taps shorter than a frame still count.
//
// The keyboard follows the muscle memory of an emulator pad rather than a typing layout:
// Z and X are the two attack buttons (and confirm/cancel in every menu), A/S/D and C/V sit
// under the left hand, and Q/W/E/F are the shoulder row. Arrows are the d-pad. Nothing the
// game needs lives on the far side of the keyboard any more.
//
// Gamepads use the standard mapping: A jump, B grab, X light, Y heavy, LB dodge, RB block,
// LT item, RT run, Back cycle, Start pause, with the d-pad and either stick walking.

import { BTN, BtnName } from '../../shared/data/input';
import { loadSettings, saveSettings } from '../settings';

export const ACTIONS: { id: BtnName; label: string }[] = [
  { id: 'LEFT', label: 'Move left' }, { id: 'RIGHT', label: 'Move right' }, { id: 'UP', label: 'Move up (into the street)' }, { id: 'DOWN', label: 'Move down (toward you)' },
  { id: 'LIGHT', label: 'Light attack / combo — and confirm' }, { id: 'HEAVY', label: 'Heavy attack / throw — and cancel' }, { id: 'JUMP', label: 'Jump' },
  { id: 'GRAB', label: 'Grab / pick up / enter shop' },
  { id: 'BLOCK', label: 'Block (hold)' }, { id: 'DODGE', label: 'Dodge roll' }, { id: 'RUN', label: 'Run (hold) — or double-tap' }, { id: 'ITEM', label: 'Eat selected bag item' },
  { id: 'CYCLE', label: 'Next bag item' }, { id: 'START', label: 'Pause / start / continue' },
];

export const DEFAULT_KEYS: Record<BtnName, string[]> = {
  LEFT: ['ArrowLeft'], RIGHT: ['ArrowRight'], UP: ['ArrowUp'], DOWN: ['ArrowDown'],
  LIGHT: ['KeyZ'], HEAVY: ['KeyX'], JUMP: ['KeyA', 'Space'], GRAB: ['KeyS'],
  BLOCK: ['KeyC'], DODGE: ['KeyD'], RUN: ['KeyV'], ITEM: ['KeyQ', 'KeyE'],
  CYCLE: ['KeyW', 'KeyF'], START: ['Enter', 'NumpadEnter'],
};

/** Standard-mapping gamepad buttons (Xbox layout: A=0, B=1, X=2, Y=3, LB=4, RB=5, LT=6, RT=7,
 *  Back=8, Start=9, d-pad=12..15). */
const PAD: Partial<Record<BtnName, number[]>> = {
  JUMP: [0], GRAB: [1], LIGHT: [2], HEAVY: [3], DODGE: [4], BLOCK: [5], ITEM: [6], RUN: [7], CYCLE: [8], START: [9],
  UP: [12], DOWN: [13], LEFT: [14], RIGHT: [15],
};

/** Analog triggers are buttons on some pads and axes on others; read whichever the pad has. */
const AXIS_TRIGGERS: Partial<Record<BtnName, [number, number]>> = {
  ITEM: [6, 4], RUN: [7, 5],
};

const KEY_NAMES: Record<string, string> = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Space: 'SPACE', Enter: 'ENTER', NumpadEnter: 'NUM ENTER', Escape: 'ESC',
};

/** What a key looks like on the How-to-Play sheet. */
export function keyLabel(code: string): string {
  if (KEY_NAMES[code]) return KEY_NAMES[code];
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace('ShiftLeft', 'SHIFT').replace('ShiftRight', 'SHIFT');
}

export class Input {
  keys: Record<BtnName, string[]>;
  private keyHeld = new Set<string>();
  private touchHeld = 0;
  private pressed = 0;
  private padPrev = 0;
  private padPressed = 0;
  enabled = true;
  onPause: () => void = () => {};
  onAnyKey: (code: string) => void = () => {};
  /** Every physical press that maps to a game button, menus included (screens decide). */
  onPress: (bit: number) => void = () => {};
  onPadConnect: (name: string) => void = () => {};
  capture: ((code: string) => void) | null = null;

  constructor() {
    const s = loadSettings();
    this.keys = { ...DEFAULT_KEYS, ...(s.keys ?? {}) } as Record<BtnName, string[]>;
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => { this.keyHeld.clear(); this.touchHeld = 0; });
    window.addEventListener('gamepadconnected', (e) => this.onPadConnect((e as GamepadEvent).gamepad.id));
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

  /** The bitmask a key maps to right now (0 when it is unbound). */
  bitAt(code: string): number { return this.bitFor(code); }

  private onKey(e: KeyboardEvent, down: boolean): void {
    if (this.typing(e)) return;
    if (this.capture && down) { e.preventDefault(); const c = this.capture; this.capture = null; c(e.code); return; }
    if (down && (e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) { this.onPause(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone
    // Whether the game takes this key is decided by the screen it was pressed on. The press
    // callbacks below can open or close a menu, and that must not retroactively turn the same
    // press into a gameplay input: Enter on RESUME resumed and then instantly re-paused,
    // because the button handler had already set `enabled` back to true by the time the bit
    // was stored.
    const enabled = this.enabled;
    const bit = this.bitFor(e.code);
    if (down && !e.repeat) { this.onAnyKey(e.code); if (bit) this.onPress(bit); }
    if (!bit) return;
    if (enabled) e.preventDefault();
    if (down) { if (!this.keyHeld.has(e.code) && enabled) this.pressed |= bit; this.keyHeld.add(e.code); }
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
      for (const [name, idx] of Object.entries(PAD)) {
        for (const i of idx!) {
          const btn = p.buttons[i];
          if (btn && (btn.pressed || btn.value > 0.5)) b |= BTN[name as BtnName];
        }
      }
      for (const [name, [button, axis]] of Object.entries(AXIS_TRIGGERS)) {
        const btn = p.buttons[button!];
        const analog = Math.max(btn?.value ?? 0, p.axes[axis!] ?? 0);
        if (analog > 0.45) b |= BTN[name as BtnName];
      }
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
    this.padPressed = padPressed;
    const pressed = (this.pressed | padPressed) & (this.enabled ? ~0 : 0);
    this.pressed = 0;
    return this.enabled ? { held, pressed } : { held: 0, pressed: 0 };
  }

  /** Gamepad presses from the last sample, for the menus. Keyboard menus keep their native
   *  key handling, so arrow keys still nudge a focused slider or text field. */
  uiPressed(): number { return this.padPressed; }

  rebind(action: BtnName, code: string): void {
    for (const k of Object.keys(this.keys) as BtnName[]) this.keys[k] = this.keys[k].filter((c) => c !== code);
    this.keys[action] = [code, ...this.keys[action].filter((c) => c !== code)].slice(0, 2);
    saveSettings({ keys: this.keys });
  }

  resetKeys(): void { this.keys = { ...DEFAULT_KEYS }; saveSettings({ keys: this.keys }); }
}
