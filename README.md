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
npm test             # 46 simulation / flow / net tests
npm run test:e2e     # Playwright online acceptance tests
npm run build        # sprites + fonts + typecheck + production bundle
```

Pushing to `main` runs the tests, builds the client and publishes `dist/` to GitHub
Pages (`.github/workflows/pages.yml`), so the live page at xiondigital.net/kankakombat
is always the build from the tip of `main`.

GitHub Pages matches project paths case-sensitively, so the pre-rename
`xiondigital.net/KankaKombat/` address cannot be answered by this repo. It is forwarded
by `KankaKombat/index.html` in the `xiondigital.github.io` repo, which keeps `?room=`
invite codes intact. A real edge `301` and asset caching need the domain proxied through
Cloudflare; the exact records, rule expressions and verification steps are in
[docs/cloudflare.md](docs/cloudflare.md).

## Features

- **Two heroes** — B.T. (speed and combos) and S.C. (power and grapples) — each with
  their own combo chain, heavy, air/run attacks, grab, knees and throws.
- **Four chapters / twelve sections** — NY night, İzmir sunset, İstanbul morning,
  Tampa afternoon. Each street locks the camera for a fight, then blinks the GO sign.
- **Four concept bosses** — Dumpster Duke, Bıyıklı Fehmi, the Dondurma Man and the
  Tampa Man — with phases, telegraphs, summons and purses.
- **Bitmap typography** — TITLE and HUD fonts generated from the approved lettering
  sheet, with Ç Ğ İ Ö Ş Ü. No system font is used anywhere in the UI.
- **HUD** — portrait panels (gold P1 / silver P2), health that drains green → yellow
  → red and pulses when critical, boss bar, lives, wallet, bag and stage banners.
- **Destructibles** — bins, crates, boxes, barrels and mailboxes take three hits
  (intact → damaged → smashed), burst into debris and pop stage-flavoured food.
- **Shops** — BODEGA, BAKKAL, PAZAR and TACOS interiors with the keeper behind the
  counter, the hero at the counter and a cream bitmap menu (icons, prices, triangular
  cursor, wallet, bag, speech bubble). Street vendors open the same menu.
- **Economy** — Ayran 30, Bananas 40, Lahmacun 50, Baklava 80, Sujuk 90, Nutella 150.
  One wallet all campaign; the symbol changes to ₺ or $ with the city.
- **Bilingual UI** — English / Türkçe switch in the main menu and settings, persisted
  with all player-facing menus, help, shop dialogue, chapter and boss text.
- **Settings** — music and effects volume, mute, screen shake, touch controls,
  remappable keyboard and gamepad support.
- **Online** — five-character room codes, host-authoritative rooms over a Supabase
  Realtime broadcast relay (no game server needed, so the static Pages build can host
  rooms), or a dedicated Node server; drop-in, reconnect with the same token,
  authoritative purchases. The room creator's tab runs the simulation; guests send input
  and receive interpolated snapshots.

## Controls (default)

| Action | Keyboard | Pad |
|---|---|---|
| Move | Arrows / WASD | D-pad / stick |
| Light / combo | J or Z | X |
| Heavy / throw | K or X | Y |
| Jump | Space or C | A |
| Grab / pick up / enter shop | L or V | B |
| Block (hold) | U or B | RB |
| Dodge roll | O or N | LB |
| Run (hold) | Shift | RT |
| Eat bag item | E or F | LT |
| Next bag item | Q or R | Back |
| Start / continue | Enter | Start |

All keys are remappable in **How to Play**. Gamepads, keyboard and touch share one
input bitmask, and menus are fully keyboard navigable.

## Project layout

```
src/shared/data/      fighters, enemies, attacks, stages, items, shops, constants
src/shared/sim/       60 Hz deterministic simulation, combat, AI, items, snapshots
src/shared/net/       protocol, host session, room authority
src/client/           renderer, backgrounds, effects, bitmap font, audio, UI, i18n
src/server/           dedicated WebSocket server
tools/sprites/        pixel-art rig + sheet builder (npm run sprites)
tools/art/            sheet importers, web assets (npm run sheets / props / web-assets)
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
Production sheets live in `public/assets/sprites/` with JSON atlases; the review
sheets in `.freebuff/preview/` use the approved light-blue background. The binding
rules are in [ART_STYLE_DIRECTIVE.md](ConceptArt/ART_STYLE_DIRECTIVE.md). All art is
original.

## Status

See [PROGRESS.md](PROGRESS.md) for the current IMPLEMENTED / VISUALLY VERIFIED /
STILL PLANNED split.
