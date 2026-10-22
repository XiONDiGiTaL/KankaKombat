// The control legend drawn over the first street, then faded out: the player's *current*
// keyboard bindings (remaps included) side by side with the fixed pad layout, so both
// input methods are readable from the same card.

import { SCREEN_W, SCREEN_H } from '../../shared/data/constants';
import type { BtnName } from '../../shared/data/input';
import { drawText } from './font';
import { t as tr } from '../i18n';
import { keyLabel } from '../input/input';

export interface LegendRow { action: string; keys: string; pad: string }

/** How long the card is shown, in 60 Hz ticks, and how long the tail fade lasts. */
export const LEGEND_TICKS = 690;
export const LEGEND_FADE = 90;

/** 1 while fully visible, easing to 0 over the last LEGEND_FADE ticks. */
export function legendAlpha(t: number): number {
  if (t <= 0) return 0;
  return Math.max(0, Math.min(1, t / LEGEND_FADE));
}

const ARROWS = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];

/** One row per action, keyboard on the left and pad on the right. */
export function legendRows(keys: Record<BtnName, string[]>): LegendRow[] {
  // Enter and its numpad twin are one key to the player, so the card prints it once.
  const labels = (id: BtnName): string => {
    const names = [...new Set((keys[id] ?? []).map(keyLabel))];
    return (names.includes('ENTER') ? names.filter((n) => n !== 'NUM ENTER') : names).join('/');
  };
  const move = [...new Set([labels('UP'), labels('LEFT'), labels('DOWN'), labels('RIGHT')])].filter(Boolean);
  const defaultArrows = ['UP', 'LEFT', 'DOWN', 'RIGHT'].every((id) => (keys[id as BtnName] ?? []).length === 1 && ARROWS.includes(keys[id as BtnName][0]));
  const rows: { action: string; keys: string; pad: string }[] = [
    { action: 'MOVE', keys: defaultArrows ? 'ARROWS' : move.join(' '), pad: 'D-PAD/STICK' },
    { action: 'LIGHT', keys: labels('LIGHT'), pad: 'X' },
    { action: 'HEAVY', keys: labels('HEAVY'), pad: 'Y' },
    { action: 'JUMP', keys: labels('JUMP'), pad: 'A' },
    { action: 'GRAB', keys: labels('GRAB'), pad: 'B' },
    { action: 'BLOCK', keys: labels('BLOCK'), pad: 'RB' },
    { action: 'DODGE', keys: labels('DODGE'), pad: 'LB' },
    { action: 'RUN', keys: labels('RUN'), pad: 'RT' },
    { action: 'EAT', keys: labels('ITEM'), pad: 'LT' },
    { action: 'NEXT ITEM', keys: labels('CYCLE'), pad: 'BACK' },
    { action: 'PAUSE', keys: labels('START'), pad: 'START' },
  ];
  return rows.filter((r) => r.keys).map((r) => ({ ...r, action: tr(r.action), pad: tr(r.pad) }));
}

/** Draw the card at the bottom centre of the play area. */
export function drawControlLegend(ctx: CanvasRenderingContext2D, rows: LegendRow[], alpha: number): void {
  if (alpha <= 0 || !rows.length) return;
  const W = 232, padX = 8, rowH = 9, head = 24, foot = 5;
  const H = head + rows.length * rowH + foot;
  const x = Math.round((SCREEN_W - W) / 2), y = Math.round(SCREEN_H - H - 4);
  const keyX = x + 92, padRight = x + W - padX;

  ctx.save();
  ctx.globalAlpha = alpha;
  // panel: near-opaque ink so the street does not read through the small type, and a
  // thin gold frame with corner studs in the menu's style
  ctx.fillStyle = 'rgba(18,12,26,0.9)'; ctx.fillRect(x, y, W, H);
  ctx.fillStyle = '#f0c818';
  ctx.fillRect(x, y, W, 1); ctx.fillRect(x, y + H - 1, W, 1);
  ctx.fillRect(x, y, 1, H); ctx.fillRect(x + W - 1, y, 1, H);
  for (const [cx, cy] of [[x, y], [x + W - 2, y], [x, y + H - 2], [x + W - 2, y + H - 2]]) {
    ctx.fillRect(cx, cy, 2, 2);
  }

  drawText(ctx, tr('CONTROLS'), x + padX, y + 5, '#ffe066');
  drawText(ctx, tr('KEYBOARD'), keyX, y + 13, '#b9a6d8');
  drawText(ctx, tr('PAD'), padRight, y + 13, '#b9a6d8', { align: 'right' });

  rows.forEach((r, i) => {
    const ry = y + head + i * rowH;
    drawText(ctx, r.action, x + padX, ry, '#f6e8b8');
    drawText(ctx, r.keys, keyX, ry, '#ffe066');
    drawText(ctx, r.pad, padRight, ry, '#d8d0e8', { align: 'right' });
  });
  ctx.restore();
}
