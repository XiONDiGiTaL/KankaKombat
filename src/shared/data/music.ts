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
  /** Bump this when the master behind `file` is replaced. The soundtrack sits under the
   *  edge rule that keeps `/assets/` for a year, and its names are not content-hashed, so
   *  a same-name replacement would stay stale at the edge and in returning browsers; a new
   *  version makes a new URL, a new cache key, and the new master ships on the next load. */
  rev: number;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  title: { file: 'title.mp3', seconds: 142, use: 'Title screen and every out-of-game screen', rev: 1 },
  nyc: { file: 'nyc.mp3', seconds: 148, use: 'Chapter 1 — New York, both streets, shops and the boss', rev: 1 },
  izmir: { file: 'izmir.mp3', seconds: 177, use: 'Chapter 2 — İzmir, both streets, the bazaar and the boss', rev: 1 },
  istanbul: { file: 'istanbul.mp3', seconds: 159, use: 'Chapter 3 — İstanbul, both streets, the market and the boss', rev: 1 },
  tampa: { file: 'tampa.mp3', seconds: 138, use: 'Chapter 4 — Tampa, boardwalk, Ybor and the last pier', rev: 1 },
};

export const MUSIC_DIR = './assets/music/';

/** The URL the client streams: versioned, so a replaced master is fetched fresh
 *  instead of coming back from a year-long edge or browser cache. */
export const musicUrl = (id: ThemeId): string => `${MUSIC_DIR}${THEMES[id].file}?v=${THEMES[id].rev}`;
