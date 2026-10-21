import { CharSpec } from './rig';
import { AnimSet, btAnims, scAnims } from './poses';
import { BT, SC } from './heroes';
import { ENEMY_SPECS } from './enemies';
import { thugAnims, dondurmaAnims, bumAnims, tampaAnims, fehmiAnims } from './enemyposes';

const ANIMS: Record<string, () => AnimSet> = {
  dondurma: dondurmaAnims,
  dondurma_boss: dondurmaAnims,
  bum: bumAnims,
  bum_boss: bumAnims,
  tampa: tampaAnims,
  tampa_boss: tampaAnims,
  fehmi: fehmiAnims,
  fehmi_boss: fehmiAnims,
};

export const CHARACTERS: { spec: CharSpec; anims: () => AnimSet }[] = [
  { spec: BT, anims: btAnims },
  { spec: SC, anims: scAnims },
  ...ENEMY_SPECS.map((spec) => ({ spec, anims: ANIMS[spec.id] ?? thugAnims })),
];
