# KANKA KOMBAT — PROGRESS

_Updated 2026-10-21._

## IMPLEMENTED

- Deterministic 60 Hz simulation, rollback-friendly snapshots, combo/grab/throw/juggle
  systems, dodge i-frames, armour, stun, boss phases and purses.
- Two playable heroes (B.T. / S.C.), four chapters (NYC, İzmir, İstanbul, Tampa),
  twelve sections, four bosses, hazards, waves, camera locks and GO gating. MUSE is a
  reference sheet only; she is not in the roster, the fighter select or the build.
- **All six characters use the supplied artist sheets verbatim** — B.T., S.C., the NYC
  bum, Tampa Man, the Dondurma Man and Bıyıklı Fehmi, plus their four crimson boss
  palette swaps (`assets/source/*_sheet.*`, imported by `tools/art/import_sheets.py`
  → `public/assets/sprites/*.png`). Each page carries its own column count (the bum
  page is ten wide, the rest eight) and its own pose map, so signature moves land on
  the right frames: the bum's haymaker, Tampa Man's cane swing, Fehmi's slap and the
  Dondurma Man's stick twirl. Every animation the attack data asks for exists on every
  page.
  The importer segments each frame as a connected blob over a padded window (frames
  drift and lean across the 192 px grid), removes the painted drop shadow with a
  flood fill that also accepts low-chroma grey, closes hairline outline gaps so the
  fill cannot leak into white sleeves, keeps each sheet row's own baseline so the
  foot lift inside a walk survives, anchors standing poses on the planted foot and
  lying poses on the silhouette centre, and sizes the atlas cell (83×73 / 82×73) to
  the widest and tallest pose so nothing clips. The HUD head box is measured from the
  idle silhouette instead of hard-coded. `tools/sprites/build.ts` skips characters
  listed in `tools/sprites/imported.json`, so the procedural pass never overwrites them.
- **Hand-drawn walk strips replace every walk and run row** (`assets/source/walk/*.png`,
  four frames each, spliced in by the same importer). Each strip is cut as four blobs,
  scaled so the walker stands exactly as tall as the same figure on his page (measured
  off that page's own walk row, so the body does not change size on a step), snapped
  onto one 28-colour palette so painted shading still reads as pixel art, and timed
  from the character's own `walk` speed in `src/shared/data`: B.T./S.C. cycle in ~20
  ticks, the bum 29, Fehmi 38 and the Tampa Man 44, run at 55% of that. Two artifacts
  needed their own cleanup: a grey baseline rule under the feet (erased as low-chroma
  runs in the last rows) and paper-white gaps sealed off by an arm, a cane or a leg,
  which are dropped when a big near-white blob is 255-flat while painted garments and
  hair highlights always carry shading.
- **Food icons and the golf cart come from the artists' pages too**
  (`tools/art/import_props.py` → `public/assets/props/`): the six-item grid is keyed off
  its flat blue, and the printed captions and sparkles are dropped because they are
  separate blobs from the food; each icon is bottom-aligned in an 18×18 tile at the
  size the old 16×12 pickups occupied, so world drops, the HUD bag, the shop list and
  the How-to-Play table all pick them up through the same `artCanvas()` call. The golf
  cart strip is 4 × 54×50 frames whose wheels turn with distance travelled (frame from
  `h.x`, not from the clock) and which mirrors for right-to-left traffic.
- **CRT glass** over the canvas (`SETTINGS → CRT FILTER`, on by default): a hair of
  blur to take the edge off the upscaled pixels, 3-px scanlines, a faint RGB mask, a
  vignette and a corner glare, so the sharper walk strips and the softer page art sit
  together.
- Procedural pipeline still covers the legacy roster, uniform 64×76 cells,
  transparent production + light-blue review copies. Hero heads are hand-authored 20×22 pixel maps
  (`tools/sprites/headmaps.ts`: hair silhouettes, brows, 3-px eyes, nose, lips, shades,
  beards, earrings, dyed tips) so every frame keeps the identical face; the expression
  pass repaints only the eye/mouth rectangles for hit, shout, blink and KO frames.
  Bodies use rig v2 (`tools/sprites/rig.ts`): limbs are continuous ribbons through their
  joints, all parts composite as one silhouette with coloured occlusion edges where a
  limb passes in front of the body, and a single outline wraps the finished figure.
  Heroes sit at ~2.9 heads with wide shoulders, tapered waist and chunky high-tops.
- Bitmap TITLE/HUD fonts built from `font_lettering_sheet.png`, Turkish glyphs
  included; every DOM screen and canvas label uses them (no system font).
- HUD portraits, colour-tier health, critical pulse, boss bar, stage banners,
  GAME OVER / CONTINUE 9→0, chapter-clear summary.
- Three-state destructibles with art sized to the cast (trash can, crate, barrel,
  cardboard box and mailbox are 55–90% of a fighter's height), debris, arc drops,
  stage drop tables, item heal tiers, one-slot bag, coin pickup, wallet symbol per city.
- Layered stage backdrops: dithered dusk/sunset skies, painted clouds, layered ridges,
  banded water with a sun path and shore reflections, dense skylines with lit windows,
  fire escapes, water towers, neon with halos, awnings, subway entrances, promenade
  railings, quay lamps, palms, and textured pavement (slabs, boardwalk planks,
  crosswalks, manholes, puddles).
- Four themed enterable shops (BODEGA / BAKKAL / PAZAR / TACOS), keeper NPC, hero at
  the counter, cream bitmap menu with icons, prices, cursor, wallet, bag and speech
  bubble; shop doors on the street; no combat inside; exit back to the door.
- English / Türkçe language switch (menu + settings), persisted; translated menus,
  help, controls, shop dialogue, items, chapters, bosses, banners and shop UI.
- Music/SFX volume, mute (incl. a one-click SOUND toggle on the main menu),
  screen shake, touch mode, remappable keys, gamepad and keyboard navigation, and a
  full How-to-Play guide (controls, fighting, food & economy) reachable from the
  menu, pause and settings.
- 16-bit menu skin matched to the HUD kit: layered gold frames, corner studs, chunky
  bevel buttons, scanlines, arcade sliders and pixel key chips.
- Online: dedicated server and host-authoritative relay, drop-in/reconnect, room
  caps, authoritative purchases; three Playwright acceptance tests.
- **Web release**: GitHub Actions runs the suite, builds the client and deploys it to
  GitHub Pages on every push to `main`, published at xiondigital.net/kankakombat.
  Rooms need no server: the room creator's tab is the authority and talks to the others
  through a Supabase Realtime broadcast channel, the same relay Leap Buddies uses, so a
  static host is enough for online co-op. The OG card and favicon are generated from the
  game's own sheets and fonts (`npm run web-assets`). Because Pages project paths are
  case-sensitive, the old `/KankaKombat/` URL is served by a forwarder page in the
  `xiondigital.github.io` repo that carries `?room=` codes through to the live game.
  Turning that into a real edge `301` (plus asset caching) needs the domain proxied
  through Cloudflare; the runbook is [docs/cloudflare.md](docs/cloudflare.md).
- Fighter select: one grid per stat block, so both heroes' bars share the same labels,
  the same track width and a segmented empty track. The cards show the in-game sprite on a
  dusk backdrop, sized from its own opaque bounds: both cards use one whole-pixel scale and
  one floor line, so the two stand at matching size and nothing is cropped.
- The name field is this player's own tag, not a room title, and the screen now says so
  in both languages.

## VISUALLY VERIFIED (rendered screenshots in `.freebuff/preview/audit/`)

- Title, main menu (EN/TR), fighter select, NY street, NY boss intro/fight.
- BODEGA frontage, all four shop interiors, purchase result, wallet/bag update.
- İzmir Kordon, İstanbul market, Tampa boardwalk, GAME OVER 9→0.
- Turkish gameplay banners, Turkish shop menu, language persistence after reload.
- Sprite review sheets for MUSE / S.C. / B.T. and the four enemies.
- Imported B.T. / S.C. sheets re-rendered frame by frame and play-tested on the NY
  street: idle, walk, run, light chain, kick, hit flash, HUD portrait at 1:1.
- Imported enemies play-tested on their own chapters via the debug start: NYC bum and
  Dumpster Duke's palette, Bıyıklı Fehmi on the Kordon, the Dondurma Man in the
  İstanbul market and Tampa Man on the boardwalk.
- New walk strips in motion on screen: B.T. walking and running down Flatbush, S.C. on
  the Tampa boardwalk, and all four enemies walking together on the Kordon.
- All six food icons as ground drops on the Kordon, in the TACOS shop list and in the
  How-to-Play food table; four of them in the HUD bag.
- The golf cart crossing the Bayshore boardwalk lane, wheels turning, both directions.
- CRT glass on and off side by side in SETTINGS.

## STILL PLANNED

- The Dondurma Man's page has a few frames where the stretched ice cream detaches into
  separate shapes; those drips are dropped rather than carried with the frame.
- A second art pass on the enemy bodies and more attack-frame polish.
- Vendor booths currently open the full interior scene; the concept asks for the
  same menu as a street 
