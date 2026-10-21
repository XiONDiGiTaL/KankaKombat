// Dev helper: every character's frame from one animation side by side.
import { Px, hex } from './raster';
import { render } from './rig';
import { writePng } from './sheet';
import { CHARACTERS } from './roster';
const anim = process.argv[2] ?? 'idle', out = process.argv[3], idx = Number(process.argv[4] ?? 0);
const cell = 84;
const sheet = new Px(cell * 12, cell * Math.ceil(CHARACTERS.length / 12));
CHARACTERS.forEach((c, i) => {
  const a = c.anims()[anim] ?? c.anims().idle;
  const fr = render(c.spec, a.frames[Math.min(idx, a.frames.length - 1)].p);
  const ox = (i % 12) * cell + (cell - c.spec.cell[0]) / 2, oy = Math.floor(i / 12) * cell + (cell - 4 - c.spec.ground);
  sheet.rect((i % 12) * cell, Math.floor(i / 12) * cell + cell - 3, cell, 1, hex('#6a7a8a'));
  sheet.draw(fr, ox, oy);
});
writePng(out, sheet, 3, hex('#8fb4c8'));
