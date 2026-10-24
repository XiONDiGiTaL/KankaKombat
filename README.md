# KANKA KOMBAT: NUTELLA NIGHTS

A 16-bit co-op beat-'em-up in the Streets of Rage / Final Fight school — B.T. and
S.C. chasing the last jar of Nutella through New York, İzmir, İstanbul and Tampa.
Runs in the browser; built with TypeScript, Vite, Canvas 2D and a deterministic
60 Hz simulation shared by solo, host-authoritative relay rooms and the Node server.

**Play now: <https://xiondigital.net/kankakombat/>**

![B.T. and S.C. fighting together on the New York street](docs/screenshots/co-op.png)

![Bodega shop](docs/screenshots/shop.png)

## Play

```bash
npm install
npm run dev          # http://localhost:5173
npm run server       # optional dedicated WebSocket server (PORT=8799)
npm test             # simulation, flow, net and training tests
npm run test:e2e     # Playwright acceptance tests (menus, shops, online, controls)
npm run verify:live  # redirect + edge cache + live fighter select on the deployed build
npm run build        # sprites + fonts + typecheck + production bundle
```

Pushing to `main` runs the tests, builds the client and publishes `dist/` to GitHub
Pages (`.github/workflows/pages.yml`), so the live page at xiondigital.net/kankakombat
is always the build from the tip of `main`. Every push and pull request also runs
`.github/workflows/ci.yml`: one job typechecks and runs the unit suite, and another builds
the app and runs the whole Playwright suite in Chromium.

GitHub Pages matches project paths case-sensitively, so the pre-rename
`xiondigital.net/KankaKombat/` address cannot be answered by this repo. It is forwarded
by `KankaKombat/index.html` in the `xiondigital.github.io` repo, which keeps `?room=`
invite codes intact. A real edge `301` and asset caching need the domain proxied through
Cloudflare; the exact records, rule expressions and verification steps are in
[docs/cloudflare.md](docs/cloudflare.md).

## Features

- **Four fighters, one cyclable card** — B.T. (speed and combos) and S.C. (power and
  grapples) plus **Ozzi** and **Aynur**, all on the select screen. Left/Right, the peek
  tiles either side of the card, or the name rail walk the roster, and the fighter on the
  card is the one FIGHT! starts with. Each has their own combo chain, heavy, air/run
  attacks, grab, knees and throws. Each fighter maxes exactly one stat, so no two share a
  role: B.T. speed, S.C. power, Ozzi toughness, Aynur grapple. **Ozzi** is the tank, with
  long reach, a three-hit chain and the fastest sidestep in the game; **Aynur** is the hold
  specialist, her grab reaching farther than anyone's (connecting at point-blank and
  staying open for a few frames as an enemy steps in) before locking an enemy in place for
  a five-slap combo that hits harder than throwing early.
  S.C. still hits hardest but her hold is shorter than either grapple specialist's.
  Hover a stat bar (or tap it) and the card explains what that stat changes in play,
  quoting the fighter's own numbers — heavy damage and throw, run and walk pace, grab
  reach, hold length and slap count, health and damage taken.
- **Four chapters / seventeen sections** — NY night, İzmir sunset, İstanbul morning,
  Tampa afternoon. Each chapter walks street → peaceful plaza → street → boss arena:
  the fighting streets lock the camera for a wave and blink the GO sign, the plaza is
  a quiet town stretch with no waves and no traffic. New York also has a subway
  transport stretch between Flatbush and the plaza: down the stairs, along the
  Broadway–Lafayette platform (no waves, one newsstand), back up the far end.
- **Painted stage strips** — every street is one of the supplied concept scenes,
  imported as a scrolling strip and drawn behind the fighters. Each strip declares the
  shops it already paints (bodega doorway, bazaar stalls, taco truck), and the campaign
  puts its shops on those anchors, so the storefront under the `SHOP` tag is the one you
  enter and no street repeats a frontage. Spots a strip leaves bare get a booth built
  there: a striped market stall for a shop, the vendor's own cart for a vendor.
- **Peaceful areas** — a plaza per chapter with both shop kinds (storefront and street
  vendor booth), food on the ground, and eight townsfolk (Muse, the boombox man, the
  Turkish man and woman, the hijab woman, the Tampa man, the Latina woman and the
  elderly woman) crossing in both directions with their own stride speed. They never
  collide, never fight and are never simulated: pure ambience, like River City Ransom.
- **Training room** — pick a fighter on the select screen, then **TRAINING**. The
  Dragon's Den Gym is one painted room with no waves, traffic or exit, and a
  spring-based dummy that takes hits, grapples and throws. It is refilled and put back
  on its mark after every knockdown, so the clinch (GRAB, then SLAP and THROW) can be
  repeated without reloading. The room uses the same grab prompt as the campaign and a
  two-line lesson stays on screen; the stage strip and the dummy are both imported from
  their own source art.
- **Four concept bosses** — Dumpster Duke, Bıyıklı Fehmi, the Dondurma Man and the
  Tampa Man — with phases, telegraphs, summons and purses.
- **Bitmap typography** — TITLE and HUD fonts generated from the approved lettering
  and extension sheets: Turkish Ç Ğ İ Ö Ş Ü, Spanish Á É Í Ó Ú Ñ, real ¡ ¿, em/en
  dashes, the curly apostrophe and the copy marks (© Ø Â ; …), with locale-aware case
  folding (Turkish i → İ) and `$`/`₺` prices. No system font is used
  anywhere in the UI; the append-only glyph contract and known gaps are in
  [docs/fonts.md](docs/fonts.md).
- **HUD** — portrait panels (P1 red / P2 blue), health that drains green → yellow
  → red and pulses when critical, boss bar, lives, wallet, bag, stage banners and a
  per-player hit combo counter that counts chained hits, fades when the chain drops and
  ends at once when that player takes a hit.
- **Destructibles** — bins, crates, boxes, barrels and mailboxes take three hits
  (intact → damaged → smashed), burst into debris and pop stage-flavoured food. Each
  state has its own sprite: the can dented and lidless, the crate cracked, the box
  crushed and taped, the barrel staved, the mailbox tipped, and a wide wreckage pile
  on the third hit.
- **Traffic hazards** — a yellow cab on Bedford Row, a red tram on Galata, a motorbike
  and a food-delivery bicycle on the Turkish streets cross on a telegraph: big enough
  next to a 68 px fighter to read as a vehicle, with a warning, a contact shadow and a
  hit box that matches the art.
- **Shops** — BODEGA, BAKKAL, PAZAR and TACOS interiors with the keeper behind the
  counter, the hero at the counter and a cream bitmap menu (icons, prices, triangular
  cursor, wallet, bag, speech bubble). Every keeper talks in their own register — Marcos'
  "papi", Dee's "baby", Sal's "buddy", kanka at the Turkish counters, Ayşe's "canım",
  Lupe's "amigo", Rico's "carnal". Lupe's taco shop is the first painted room rather than
  a drawn interior: the supplied room art with its ABIERTO sign, and her own four-row sheet
  cut at the bar — leaning there between sales, arms up when you walk in, a plate held over
  the counter when a purchase goes through, a shrug when the wallet is short. Hüsnü's bakkal
  is the second, baked from the supplied stage art with him painted at his glass counter.
  Street vendors open the same menu. Every shop
  you can walk into is marked from across the street: a bobbing `SHOP` tag carrying the
  city's coin, a chevron pointing at the door and a lit threshold on the pavement,
  brightening as the player walks up.
- **Economy** — two shelves of food that never overlap. Street drops stay Ayran 30,
  Bananas 40, Lahmacun 50, Baklava 80, Sucuk 90, Nutella 150; every shop sells the food of
  its own place instead — Marcos' bagels, patties, chopped cheese and Bronx Hero, Hüsnü's çay,
  simit, lokum, dondurma and karışık pide, the pazar's chestnuts, pickle juice and balık
  ekmek, Lupe's tortillas, elote and pastor plate. The 24 shop-only meals never drop, heal
  above the street ladder, and the three sit-down shops each carry one $150 FULL restore
  while the street booths stay cheaper. One wallet all campaign; the symbol changes to ₺ or $
  with the city. The catalog and art brief are in [docs/shops.md](docs/shops.md).
- **Bilingual UI** — English / Türkçe switch in the main menu and settings, persisted
  with all player-facing menus, help, shop dialogue, chapter and boss text.
- **Soundtrack** — five supplied themes stream from `public/assets/music/`: the title
  track on every out-of-game screen and one track per city, carried through both
  streets, the shop break and the boss fight, cross-faded and resumed where it left
  off. A missing file falls back to the original chiptune loops.
- **Settings** — music and effects volume, mute, screen shake, touch controls,
  remappable keyboard and gamepad support.
- **Online** — five-character room codes, host-authoritative rooms over a Supabase
  Realtime broadcast relay (no game server needed, so the static Pages build can host
  rooms), or a dedicated Node server; drop-in, reconnect with the same token,
  authoritative purchases. The room creator's tab runs the simulation; guests send input
  and receive interpolated snapshots.

## Controls (default)

The keyboard is laid out like an emulator pad: the two attack buttons sit under the right
hand, everything else is one reach away, and no action lives outside the left block.

| Action | Keyboard | Pad |
|---|---|---|
| Move | Arrows | D-pad / left stick |
| Light / combo — and confirm | Z | X |
| Heavy / throw — and cancel | X | Y |
| Jump | A or Space | A |
| Grab / pick up / enter shop | S | B |
| Dodge roll | D | LB |
| Block (hold) | C | RB |
| Run (hold) | V | RT |
| Eat bag item | Q or E | LT |
| Next bag item | W or F | Back |
| Pause / start / continue | Enter (or Esc in game) | Start |

Menus follow the same two buttons everywhere: **Z / A / Start** confirms and **X / B**
cancels, on the title card, the main menu, fighter select, pause, the lobby and the farewell
screen. The pad moves focus with the d-pad or either stick. All keys are remappable in
**How to Play**; the pad layout is the standard Xbox mapping (A/B/X/Y, bumpers, triggers,
Back, Start) and is fixed, so the same muscle memory works on every controller. Gamepads,
keyboard and touch share one input bitmask. On the first street a control card shows every
action with your current keyboard binding beside the pad button, then fades after a few
seconds — so a remapped key is visible without opening Settings. Hits, grapples and vehicle
strikes rumble a connected pad with effects weighted by what happened, from a light guard
chip up to a full-strength tram hit; **SETTINGS -> CONTROLLER RUMBLE** turns it off.

## Project layout

```
src/shared/data/      fighters, enemies, attacks, stages, items, shops, constants
src/shared/sim/       60 Hz deterministic simulation, combat, AI, items, snapshots
src/shared/net/       protocol, host session, room authority
src/client/           renderer, backgrounds, effects, bitmap font, audio, UI, i18n
src/server/           dedicated WebSocket server
tools/sprites/        pixel-art rig + sheet builder (npm run sprites)
tools/art/            sheet importers, web assets (npm run sheets / props / hazards / npcs / shop)
tools/font/           TTF build from the lettering sheet (npm run fonts)
.github/workflows/    test + build + GitHub Pages deploy
ConceptArt/           approved style bible and reference sheets (read-only)
```

## Art pipeline

Both heroes and all four enemies come from the artists' approved pages.
`tools/art/import_sheets.py` segments each pose as a connected blob, strips the
painted drop shadow and sealed paper gaps, anchors standing poses on the planted foot,
sizes the atlas cell to the widest and tallest pose, and splices the hand-drawn
four-frame walk strips in at the same scale as that page's walk row. Item icons, the
golf cart and the HUD portraits are imported the same way by `tools/art/import_props.py`.

Lupe's taco shop is imported too: `tools/art/import_shop.py` (`npm run shop`) turns the
room panorama into the 384x126 interior and her four-row sheet into a 16-cell atlas cut
at the bar's edge, aligning each frame by the shirt's centre column and the top of her
hair so her torso and face stay put while her arms do the talking.

The training dummy is its own four-pose page; `npm run dummy` cuts it on the common
baseline, sizes it to fighter height and writes a small atlas with hurt, knockdown and
throw poses. Traffic and townsfolk are imported sheets too. `npm run hazards` cuts the four-frame
taxi / tram / motorbike / delivery-bike strips to their own height next to the fighter,
drops any page colour left inside the art (the white gaps between a bike's tubes and its
rider), and writes `public/assets/props/<kind>.png|json`; `HAZARD_SIZE` in `src/client/render/art.ts`
holds that on-screen box, the simulation's hit width (`hitW` in
`src/shared/data/stages.ts`) is kept equal to it, and `npm test` checks both. `npm run
npcs` scales the eight-character pedestrian page into one 4-column atlas
(`public/assets/sprites/npcs.png|json`); the client flips a row for leftbound traffic
and plays its four frames at that walker's own speed.

Street furniture is still hand-authored pixel maps in `src/client/render/art.ts`:
every destructible carries three maps (`kind`, `kind_dmg`, `kind_broken`: intact,
damaged, smashed) and a wide wreckage pile for the third hit.

Production sheets live in `public/assets/sprites/` with JSON atlases; the review
sheets in `.freebuff/preview/` use the approved light-blue background. The binding
rules are in [ART_STYLE_DIRECTIVE.md](ConceptArt/ART_STYLE_DIRECTIVE.md). All art is
original.

## Music

The soundtrack is one title theme and one theme per city, streamed as MP3 rather than
bundled into the JS. The city theme starts with its chapter and plays through both
streets, any shop stop and the boss arena, so a chapter is paced at roughly the length
of its own track — two bots clear a chapter in 2:20–3:05, checked by the stage-pacing
test in `tests/flow.test.ts`. A solo run is longer and the theme loops once. Boss intros,
the victory sting and every effect are synthesized; game over fades the music out.

| Where | File | Length |
|---|---|---|
| Title screen, menus, fighter select, lobby | `title.mp3` | 2:22 |
| Chapter 1 — New York | `nyc.mp3` | 2:28 |
| Chapter 2 — İzmir | `izmir.mp3` | 2:57 |
| Chapter 3 — İstanbul | `istanbul.mp3` | 2:39 |
| Chapter 4 — Tampa | `tampa.mp3` | 2:18 |

Track ids, files and exact lengths live in `src/shared/data/music.ts`, one entry per
theme; a chapter names its theme with `music` in `src/shared/data/stages.ts`.

## Status

See [PROGRESS.md](PROGRESS.md) for the current IMPLEMENTED / VISUALLY VERIFIED /
STILL PLANNED split.
