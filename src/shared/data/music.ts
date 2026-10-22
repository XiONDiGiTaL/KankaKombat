// The supplied soundtrack: one title theme and one theme per city. The files are mastered
// MP3s in `public/assets/music/`; `seconds` is the decoded length of each master, measured
// from its MP3 frames, and it is what chapter pacing is balanced against — a chapter has to
// run long enough to hear its theme through before the clear screen cuts it off.
//
// Everything here is plain data so the simulation, the client audio engine and the pacing
// test can all read the same numbers.

export type ThemeId = 'title' | 'nyc' | 'izmir' | 'istanbul' | 'tampa';

export interface ThemeDef {
  file: string;
  seconds: number;
  use: string;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  title: { file: 'title.mp3', seconds: 142, use: 'Title screen and every out-of-game screen' },
  nyc: { file: 'nyc.mp3', seconds: 148, use: 'Chapter 1 — New York, both streets, shops and the boss' },
  izmir: { file: 'izmir.mp3', seconds: 177, use: 'Chapter 2 — İzmir, both streets, the bazaar and the boss' },
  istanbul: { file: 'istanbul.mp3', seconds: 159, use: 'Chapter 3 — İstanbul, both streets, the market and the boss' },
  tampa: { file: 'tampa.mp3', seconds: 138, use: 'Chapter 4 — Tampa, boardwalk, Ybor and the last pier' },
};

export const MUSIC_DIR = './assets/music/';

export const musicUrl = (id: ThemeId): string => MUSIC_DIR + THEMES[id].file;
