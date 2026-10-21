// Core world and timing constants shared by the simulation and the renderer.
export const TICK_HZ = 60;
export const SNAPSHOT_EVERY = 3;          // network snapshots at 20 Hz
export const SCREEN_W = 384;
export const SCREEN_H = 216;
export const STREET_TOP = 136;            // screen y of the back edge of the walkable street (z = 0)
export const STREET_DEPTH = 64;           // z range [0, STREET_DEPTH]
export const GRAVITY = 0.26;
export const MAX_PLAYERS = 4;
export const START_LIVES = 3;
export const MAX_LIVES = 5;
export const BAG_SLOTS = 4;
export const RESPAWN_INVULN = 150;
export const BODY_HALF_W = 8;
export const BODY_HEIGHT = 44;
export const BODY_HALF_Z = 6;
export const MAX_ENEMIES_ALIVE = 7;
export const CONTINUE_TICKS = 60 * 12;
export const LEVEL_CAP = 10;
