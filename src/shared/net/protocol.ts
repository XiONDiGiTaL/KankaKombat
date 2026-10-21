// Versioned, validated wire protocol. Every message from a client is checked here before
// the session looks at it; anything malformed, oversized or out of range is dropped.

import { BTN_MASK } from '../data/input';
import { FIGHTER_IDS, FighterId } from '../data/fighters';
import { ITEM_IDS } from '../data/items';
import type { Snap } from '../sim/snapshot';

export const PROTOCOL_VERSION = 1;
export const MAX_MSG_BYTES = 4096;
export const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LEN = 5;

export type ClientMsg =
  | { t: 'hello'; v: number; name: string; token: string; f: FighterId }
  | { t: 'pick'; f: FighterId }
  | { t: 'ready'; r: boolean }
  | { t: 'start'; ch?: number; se?: number }
  | { t: 'in'; s: number; h: number; p: number }
  | { t: 'cmd'; c: 'buy'; item: string; nonce: string }
  | { t: 'cmd'; c: 'leave' }
  | { t: 'cmd'; c: 'use'; slot: number }
  | { t: 'cmd'; c: 'continue' }
  | { t: 'ping'; ts: number }
  | { t: 'restart' }
  | { t: 'bye' };

export interface LobbyPlayer { id: string; name: string; f: FighterId; ready: boolean; conn: boolean; host: boolean }

export type ServerMsg =
  | { t: 'welcome'; v: number; id: string; code: string; host: boolean; inGame: boolean }
  | { t: 'lobby'; players: LobbyPlayer[]; inGame: boolean; canStart: boolean }
  | { t: 'start'; ch: number; se: number }
  | { t: 'snap'; s: Snap; acks: Record<string, number> }
  | { t: 'res'; nonce?: string; ok: boolean; reason?: string }
  | { t: 'err'; code: string; msg: string }
  | { t: 'pong'; ts: number }
  | { t: 'end'; reason: string };

const isInt = (x: unknown, lo: number, hi: number): x is number => typeof x === 'number' && Number.isInteger(x) && x >= lo && x <= hi;
const isStr = (x: unknown, max: number): x is string => typeof x === 'string' && x.length > 0 && x.length <= max;
const isFighter = (x: unknown): x is FighterId => typeof x === 'string' && (FIGHTER_IDS as readonly string[]).includes(x);

export function cleanName(n: string): string {
  return n.replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 12) || 'Kanka';
}

export function validateClientMsg(raw: unknown): ClientMsg | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  switch (m.t) {
    case 'hello':
      if (m.v !== PROTOCOL_VERSION || !isStr(m.name, 24) || !isStr(m.token, 64) || !isFighter(m.f)) return null;
      return { t: 'hello', v: PROTOCOL_VERSION, name: cleanName(m.name), token: m.token, f: m.f };
    case 'pick': return isFighter(m.f) ? { t: 'pick', f: m.f } : null;
    case 'ready': return typeof m.r === 'boolean' ? { t: 'ready', r: m.r } : null;
    case 'start': {
      const ch = m.ch === undefined ? undefined : isInt(m.ch, 0, 3) ? m.ch : null;
      const se = m.se === undefined ? undefined : isInt(m.se, 0, 2) ? m.se : null;
      if (ch === null || se === null) return null;
      return { t: 'start', ch, se };
    }
    case 'in':
      if (!isInt(m.s, 0, 2 ** 31) || !isInt(m.h, 0, BTN_MASK) || !isInt(m.p, 0, BTN_MASK)) return null;
      return { t: 'in', s: m.s, h: m.h, p: m.p };
    case 'cmd':
      switch (m.c) {
        case 'buy': return isStr(m.item, 16) && (ITEM_IDS as string[]).includes(m.item) && isStr(m.nonce, 32) ? { t: 'cmd', c: 'buy', item: m.item, nonce: m.nonce } : null;
        case 'leave': return { t: 'cmd', c: 'leave' };
        case 'use': return isInt(m.slot, 0, 7) ? { t: 'cmd', c: 'use', slot: m.slot } : null;
        case 'continue': return { t: 'cmd', c: 'continue' };
        default: return null;
      }
    case 'ping': return typeof m.ts === 'number' && Number.isFinite(m.ts) ? { t: 'ping', ts: m.ts } : null;
    case 'bye': return { t: 'bye' };
    case 'restart': return { t: 'restart' };
    default: return null;
  }
}

/** Parse a raw transport payload (string or object) with a size limit. */
export function parseClientPayload(data: unknown): ClientMsg | null {
  try {
    if (typeof data === 'string') {
      if (data.length > MAX_MSG_BYTES) return null;
      return validateClientMsg(JSON.parse(data));
    }
    return validateClientMsg(data);
  } catch {
    return null;
  }
}

export function makeRoomCode(rand: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < ROOM_CODE_LEN; i++) s += ROOM_ALPHABET[Math.floor(rand() * ROOM_ALPHABET.length)];
  return s;
}

export function normalizeRoomCode(s: string): string | null {
  const c = s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length !== ROOM_CODE_LEN || [...c].some((ch) => !ROOM_ALPHABET.includes(ch))) return null;
  return c;
}
