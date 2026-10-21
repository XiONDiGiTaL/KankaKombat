// Input is a bitmask so it is cheap to send over the network and trivial to validate.
export const BTN = {
  LEFT: 1, RIGHT: 2, UP: 4, DOWN: 8,
  LIGHT: 16, HEAVY: 32, JUMP: 64, GRAB: 128,
  BLOCK: 256, DODGE: 512, RUN: 1024, ITEM: 2048,
  CYCLE: 4096, START: 8192,
} as const;
export type BtnName = keyof typeof BTN;
export const BTN_MASK = 16383;

export interface InputFrame { held: number; pressed: number }
export const NO_INPUT: InputFrame = { held: 0, pressed: 0 };
