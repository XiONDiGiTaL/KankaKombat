import { CharSpec } from './rig';
import { AnimSet, btAnims, scAnims } from './poses';
import { BT, SC } from './heroes';

export const CHARACTERS: { spec: CharSpec; anims: () => AnimSet }[] = [
  { spec: BT, anims: btAnims },
  { spec: SC, anims: scAnims },
];
