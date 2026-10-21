// Generates every sprite sheet into public/assets/sprites. Run with `npm run sprites`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { buildSheet, writePng } from './sheet';
import { CHARACTERS } from './roster';

const OUT = 'public/assets/sprites';
mkdirSync(OUT, { recursive: true });
const index: Record<string, string> = {};
for (const { spec, anims } of CHARACTERS) {
  const { sheet, atlas } = buildSheet(spec, anims());
  writePng(`${OUT}/${spec.id}.png`, sheet);
  writeFileSync(`${OUT}/${spec.id}.json`, JSON.stringify(atlas));
  index[spec.id] = `${spec.id}.json`;
}
writeFileSync(`${OUT}/index.json`, JSON.stringify(index));
console.log(`sprites: ${CHARACTERS.length} sheets written to ${OUT}`);
