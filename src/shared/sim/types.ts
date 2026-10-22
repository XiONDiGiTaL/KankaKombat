import type { ItemId } from '../data/items';

export const STATES = [
  'idle', 'walk', 'run', 'jump', 'attack', 'hurt', 'knock', 'down', 'getup', 'block', 'dodge',
  'grab', 'hold', 'grabatk', 'throw', 'held', 'thrown', 'eat', 'dead', 'out', 'shop', 'dizzy',
  'tired', 'victory', 'pickup', 'taunt', 'spawn',
] as const;
export type St = (typeof STATES)[number];

/** States in which an entity accepts new movement/attack decisions. */
export const FREE: ReadonlySet<St> = new Set<St>(['idle', 'walk', 'run', 'block']);
/** States in which an entity cannot be hit at all. */
export const INTANGIBLE: ReadonlySet<St> = new Set<St>(['down', 'getup', 'dead', 'out', 'shop', 'spawn', 'thrown']);

export interface AiState {
  mode: 'approach' | 'circle' | 'retreat' | 'enter';
  target: number;
  think: number;
  cool: number;
  side: number;
  circleZ: number;
  blockT: number;
  sipT?: number;
}

export interface Ent {
  id: number;
  kind: 'p' | 'e';
  def: string;                 // fighter id or enemy id
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  face: 1 | -1;
  hp: number; maxHp: number;
  st: St; t: number; dur: number;
  atk: string | null;
  hitList: number[];
  buffer: 'L' | 'H' | 'G' | null; bufT: number;
  hitstop: number;
  inv: number;
  stun: number;
  juggle: number;
  poiseHits: number; poiseT: number;
  hold: number;                // id of the entity this one is holding, -1 if none
  heldBy: number;
  holdT: number; holdHits: number; escape: number;
  thrownBy: number;
  lastHitBy: number;
  removed: boolean;
  rewarded: boolean;
  usedAir: boolean;
  // players
  pid: string; slot: number; name: string;
  lives: number; money: number; bag: ItemId[]; sel: number;
  xp: number; lvl: number;
  speedT: number; powerT: number;
  running: boolean; dblDir: number; dblT: number;
  connected: boolean;
  nonces: string[];
  // enemies
  ai: AiState | null;
  boss: boolean; phase: number;
  quipCd: number;
  offT: number;
}

export interface Pickup { id: number; kind: 'coin' | 'food'; item: ItemId | null; amount: number; x: number; y: number; z: number; vy: number; ttl: number; taken: boolean }
export interface Prop { id: number; kind: string; x: number; z: number; hp: number; broken: boolean; drop: string | undefined; brokeT: number }
export interface Projectile { id: number; kind: string; owner: number; x: number; y: number; z: number; vx: number; vy: number; dead: boolean }
export interface HazardRt { kind: string; state: 0 | 1 | 2; x: number; dir: 1 | -1; z0: number; z1: number; hits: number[] }

export type GamePhase = 'lobby' | 'intro' | 'play' | 'clear' | 'bossintro' | 'boss' | 'bossdown' | 'chapterclear' | 'gameover' | 'final' | 'victory';

export type SimEvent =
  | { k: 'hit'; x: number; y: number; z: number; heavy: boolean; block?: boolean; dmg: number; tgt: number; src?: number; hazard?: boolean }
  | { k: 'whiff'; id: number; heavy: boolean }
  | { k: 'ko'; id: number; boss: boolean }
  | { k: 'coin'; id: number; amt: number }
  | { k: 'eat'; id: number; item: ItemId }
  | { k: 'oneup'; id: number }
  | { k: 'stash'; id: number; item: ItemId }
  | { k: 'msg'; id: number; text: string }
  | { k: 'buy'; id: number; item: ItemId; price: number }
  | { k: 'grab'; id: number }
  | { k: 'throw'; id: number }
  | { k: 'land'; id: number; heavy: boolean }
  | { k: 'jump'; id: number }
  | { k: 'break'; x: number; z: number; id?: number }
  | { k: 'prophit'; id: number; x: number; z: number; hp: number }
  | { k: 'quip'; id: number; text: string }
  | { k: 'phase'; id: number; text: string }
  | { k: 'levelup'; id: number; lvl: number }
  | { k: 'die'; id: number }
  | { k: 'respawn'; id: number }
  | { k: 'wave' }
  | { k: 'go' }
  | { k: 'section'; ch: number; se: number }
  | { k: 'convert'; rate: number }
  | { k: 'horn'; kind: string }
  | { k: 'proj'; kind: string };
