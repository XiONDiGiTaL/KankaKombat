// Dev helper: renders selected animations of a character at 4x on a backdrop for inspection.
// usage: tsx tools/sprites/preview.ts <id> <anim,anim,...> <out.png> [scale]
import { Px, hex } from './raster';
import { render } from './rig';
import { writePng } from './sheet';
import { CHARACTERS } from './roster';

const [id, list, out, sc] = process.argv.slice(2);
const c = CHARACTERS.find((x) => x.spec.id === id)!;
const anims = c.anims();
const names = list === 'all' ? Object.keys(anims) : list.split(',');
const frames = names.flatMap((n) => anims[n].frames.map((f) => render(c.spec, f.p)));
const cols = Math.min(frames.length, 10);
const W = c.spec.cell[0], H = c.spec.cell[1];
const sheet = new Px(cols * W, Math.ceil(frames.length / cols) * H);
frames.forEach((f, i) => { const ox = (i % cols) * W, oy = Math.floor(i / cols) * H; sheet.rect(ox, oy + c.spec.ground + 1, W, 1, hex('#6a7a8a')); sheet.draw(f, ox, oy); });
writePng(out, sheet, Number(sc ?? 4), hex('#8fb4c8'));
