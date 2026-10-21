import { CharSpec } from './rig';
import { AnimSet, btAnims, scAnims } from './poses';
import { BT, SC } from './heroes';
import { ENEMY_SPECS } from './enemies';
import { thugAnims, bruiserAnims, rizaAnims, salAnims, earlAnims, kemalAnims, selimAnims, maloneAnims, gusAnims } from './enemyposes';

const ANIMS: Record<string, () => AnimSet> = {
  abi: thugAnims, selo: thugAnims, mert: thugAnims, leyla: thugAnims, punk: thugAnims, vinny: thugAnims, gator: thugAnims, kyle: thugAnims, cindy: thugAnims,
  kazim: bruiserAnims, kenan: bruiserAnims, gokhan: bruiserAnims, brick: bruiserAnims, lou: bruiserAnims,
  riza: rizaAnims, sal: salAnims, earl: earlAnims,
  kemal: kemalAnims, selim: selimAnims, malone: maloneAnims, gus: gusAnims,
};

export const CHARACTERS: { spec: CharSpec; anims: () => AnimSet }[] = [
  { spec: BT, anims: btAnims },
  { spec: SC, anims: scAnims },
  ...ENEMY_SPECS.map((spec) => ({ spec, anims: ANIMS[spec.id] ?? thugAnims })),
];
