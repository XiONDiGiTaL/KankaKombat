// Non-sensitive local settings (volume, key bindings, last name and fighter). Every storage
// access is guarded: blocked storage just means settings do not persist.

import { BRANDING } from '../shared/config/branding';

export interface Settings {
  music: number;
  sfx: number;
  muted: boolean;
  name: string;
  fighter: 'bt' | 'sc';
  keys?: Record<string, string[]>;
  touch?: 'auto' | 'on' | 'off';
  shake: boolean;
}

const KEY = BRANDING.storagePrefix + '.settings.v1';
const DEFAULTS: Settings = { music: 0.55, sfx: 0.8, muted: false, name: '', fighter: 'bt', touch: 'auto', shake: true };

let cache: Settings | null = null;

export function loadSettings(): Settings {
  if (cache) return cache;
  try { cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { cache = { ...DEFAULTS }; }
  return cache!;
}

export function saveSettings(patch: Partial<Settings>): Settings {
  cache = { ...loadSettings(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* storage blocked */ }
  return cache;
}

/** Per-tab reconnect token: survives a refresh, not shared between tabs. */
export function sessionToken(): string {
  const k = BRANDING.storagePrefix + '.token';
  try {
    let t = sessionStorage.getItem(k);
    if (!t) { t = randomId(20); sessionStorage.setItem(k, t); }
    return t;
  } catch { return randomId(20); }
}

export function randomId(n: number): string {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return [...a].map((x) => 'abcdefghijkmnpqrstuvwxyz23456789'[x % 32]).join('');
}
