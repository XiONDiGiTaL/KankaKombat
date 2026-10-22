// Generates every procedural sprite sheet into public/assets/sprites. Run with `npm run sprites`.
//
// Characters listed in tools/sprites/imported.json are built by
// tools/art/import_hero_sheets.py from the artists' source sheets instead, so this pass
// leaves their PNG/JSON alone and only keeps them in the load index.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { buildSheet, writePng } from './sheet';
import { CHARACTERS } from './roster';

const OUT = 'public/assets/sprites';
const MANIFEST = 'tools/sprites/imported.json';
mkdirSync(OUT, { recursive: true });

const imported: string[] = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : [];
const index: Record<string, string> = {};
for (const { spec, anims } of CHARACTERS) {
  index[spec.id] = `${spec.id}.json`;
  if (imported.includes(spec.id)) {
    if (!existsSync(`${OUT}/${spec.id}.png`)) {
      throw new Error(`${spec.id} is imported from assets/source; run \`npm run sheets\` first`);
    }
    continue;
  }
  const { sheet, atlas } = buildSheet(spec, anims());
  writePng(`${OUT}/${spec.id}.png`, sheet);
  writeFileSync(`${OUT}/${spec.id}.json`, JSON.stringify(atlas));
}
// Imported sheets are not in the procedural roster, but the game loads everything listed
// here, so they still belong in the index even though this pass never touches their pixels.
for (const id of imported) index[id] ??= `${id}.json`;
writeFileSync(`${OUT}/index.json`, JSON.stringify(index));
console.log(`sprites: ${CHARACTERS.length} sheets in ${OUT} (${imported.join(', ') || 'none'} imported)`);
