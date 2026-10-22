# KANKA KOMBAT — PROGRESS

_Updated 2026-10-22._

## IMPLEMENTED

- Deterministic 60 Hz simulation, rollback-friendly snapshots, combo/grab/throw/juggle
  systems, dodge i-frames, armour, stun, boss phases and purses.
- Two playable heroes (B.T. / S.C.), four chapters (NYC, İzmir, İstanbul, Tampa),
  sixteen sections, four bosses, hazards, waves, camera locks and GO gating. MUSE is a
  reference sheet only as a fighter; she only appears as a pedestrian. Each chapter is
  now street → peaceful plaza → street → boss arena, so the campaign breathes instead
  of running four fights back to back on one loop of music.
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
  cart strip is 4 × 70×65 frames whose wheels turn with distance travelled (frame from
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
- **Three-state destructibles drawn from the break-state sheet**: metal trash can,
  plank crate, taped cardboard box, hooped wooden barrel and street mailbox, each with
  its own intact, damaged and smashed map (roughly half to two thirds of a 60 px
  fighter) and a wide wreckage pile on the third hit — a tipped can with its lid off,
  planks thrown out of the frame, flattened cardboard, staves and loose hoops, an
  overturned mailbox with letters spilled. The break also throws debris, dust and a shine so the drop reads as
  the reward. Arc drops, stage drop tables, item heal tiers, one-slot bag, coin pickup,
  wallet symbol per city.
- **Hazard vehicles are imported strips drawn into a declared footprint**
  (`HAZARD_SIZE` in `src/client/render/art.ts`) so each one reads as a real vehicle
  next to a 68 px fighter: taxi 112×76, tram 89×107, courier bike 72×79, golf cart
  70×65, and the food-delivery bicycle 53×56 that rides the Kordon, Kemeraltı and
  Galata. Its page left the page colour inside the frame, so the importer now erodes
  the bright mask and drops whatever sits inside a large flat white blob — the gaps
  between the rider and the bike go transparent while the thin spokes survive. `tools/art/import_hazards.py` (`npm run hazards`) cuts the four painted frames,
  scales each strip to its own on-screen height, snaps it to a shared palette and
  bottom-aligns it in the cell; the renderer picks the frame from distance travelled,
  so the wheels and the rider's legs move with the street, mirrors for right-to-left
  traffic and keeps the simulation's `hitW` equal to the art (a tram cannot clip
  through its own nose). A contact shadow grounds each one.
- **An emulator-style control scheme, on keyboard and pad** — the keyboard is one left-hand
  block plus the arrow cluster: **Z** light attack / confirm, **X** heavy attack / cancel,
  **A** jump, **S** grab, **C** block, **D** dodge, **V** run, **Q/E** eat, **W/F** next item,
  **Enter** pause. Nothing the game needs sits out on J/K/L/U/O any more, and the same two
  buttons drive every menu — title, main menu, fighter select, pause, lobby, farewell — so
  the scheme is one muscle memory from first screen to last. Gamepads use the standard Xbox
  mapping (A jump/confirm, B grab/cancel, X light, Y heavy, LB dodge, RB block, LT eat,
  RT run, Back next item, Start pause), with both analog-trigger axes read as buttons so
  the triggers work on pads that expose them as axes. A connected pad is announced, and the
  d-pad or either stick moves focus through the menus. Arrows, both sticks, every face
  button, both bumpers, both triggers and Start are covered by `tests/input.test.ts` and by
  a browser check that stubs the Gamepad API.
- **Painted stage strips back every street** — the supplied concept scenes are imported
  as one scrolling strip per district (`tools/art/import_stages.py`, `npm run stages` →
  `public/assets/stages/<id>.png|json`) and drawn 1:1 behind the fighters, so a street is
  the artist's own bodega, bazaar, waterfront or boardwalk rather than a redrawn one. Each
  strip records the shops it already paints (the bodega doorway, the five bazaar stalls,
  the taco truck's hatch), and the campaign places its shops on those anchors — `tile * n
  + anchor` for the tile repeat — so the storefront under the `SHOP` tag is the one you
  walk into, and no street ever shows the same frontage twice (`tests/art.test.ts` guards
  both). Spots a strip does not paint get a booth built on the spot: a market stall with a
  striped awning, crates and a keeper for a storefront, the shop's own cart for a vendor.
  The three panoramas with no lettering (bosphorus, kordon, bazaar) repeat alternately
  mirrored, so their sky, water and pavement join edge-to-edge with no seam; the strips
  with readable signs (New York, the platform, the taco truck) repeat straight, because a
  mirrored sign is worse than a join.
- **A subway transport stretch in New York, and the bazaar district** — Flatbush Avenue now
  drops into `Broadway–Lafayette`, a 700 px platform section with no waves: painted tile
  arches, the moon over the street grate, the MTA map wall as its landmark, and a newsstand
  booth you can buy from before climbing back to the plaza. İzmir's Kemeraltı and İstanbul's
  Kadıköy Çarşı run along the bazaar strip, their shops standing on its stalls.
- **Shop affordances on the street** — every enterable storefront and booth carries a
  bobbing gold `SHOP` plate with the city's coin ($ or ₺), a chevron pointing down at the
  door and a lit threshold on the pavement that brightens as the player approaches, so a
  shop reads as a shop from across the screen instead of only when you stand on it.
- **Peaceful town stretches with pedestrian traffic** — one plaza per chapter
  (`peace: true` in `src/shared/data/stages.ts`) with no waves, no camera lock and no
  traffic, both shop kinds (storefront + vendor booth) and food on the pavement.
  Eight townsfolk imported from the pedestrians page (`tools/art/import_npcs.py`,
  `npm run npcs` → one 61×72 four-frame atlas) walk across in both directions: they are
  client-side only (`src/client/ambient.ts` + `src/client/render/npcs.ts`), never in
  the snapshot, never colliding, and each one draws a different face at its own speed
  and phase, mirrored when walking left, so a crowd does not march in lockstep. The
  crowd respawns from the far edge as the camera moves and empties out as soon as the
  next fighting street loads.
- **Street dressing toward the stage concepts** — every street scatters its chapter's
  pavement clutter (hydrants, newspaper boxes, wire baskets, sandwich boards and
  bollards in New York; café tables, pots and produce crates in İzmir; crate stacks and
  tea sets in İstanbul; coolers, surf racks and pots in Tampa), all kept clear of the
  shop doors, plus a second subway stair on Bedford Row and the plaza so every NYC
  street carries the concept's landmark. Sunset and dawn skies get the concept's long
  streak clouds, and the Tampa sky gets sun rays.
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
- Stage dressing from the concept maps: the İzmir **Saat Kulesi** with mosque and ferry,
  İstanbul's domed skyline and pencil minarets over the market roofs, the NYC bodega /
  subway / water-tower block at night, and Tampa's lifeguard tower and pier. Shop
  frontages are now built per shop rather than per city (`BODEGA` neon and a 24/7 window
  plate, `BAKKAL` bread boards and flag, `PAZAR` lanterns and spice sacks, `TACOS`
  counter and surfboard), and the four vendor stalls have their keeper, glass case,
  samovar and open service hatch. Signs draw the title lettering through `signBoard`,
  which sizes the board to the text and drops to the HUD face instead of overflowing.
- Destructibles use their three authored states (intact → damaged → smashed) from the
  snapshot's `hp`: the renderer used to draw only the intact sprite. A smashed prop leaves
  a wreckage pile flanked by loose scraps, chips fly on the first hits, and the debris
  colour follows the prop (tin, planks, cardboard, barrel staves, mail paint).
- Title lettering carries the reference's two-tone gold (lit top rows, shaded base).
  Signage passes `flatTitle` so a sign stays one solid colour on its board.
- `npm run verify:live` checks the deployed build in one pass: the legacy `/KankaKombat/`
  redirect, the asset cache headers at the edge, and the live fighter select (both cards
  rendered, no console errors, no failed requests). It exits non-zero on a missing proxy
  or rule, so the Cloudflare runbook has a single machine-checkable gate.
- Supplied soundtrack wired in: `title.mp3` on every out-of-game screen and one city
  theme per chapter, cross-faded through the Web Audio graph and resumed where the track
  left off. The city theme runs through both streets, the shop stop and the boss arena so
  a section change never cuts it; only victory (a synth sting) and game over (fade out)
  interrupt it. A file that cannot be fetched drops to the chiptune loop for that id
  instead of leaving the game silent. Track ids and decoded lengths are data in
  `src/shared/data/music.ts`.
- Chapter pacing is cut to the soundtrack: sections were trimmed so two players clear a
  chapter in 2:20–3:05, i.e. long enough to hear that chapter's 2:18–2:57 theme through
  and short enough not to loop it. `tests/flow.test.ts` drives two bots through the real
  input path and fails if a chapter ends more than 15s before its theme or runs past a
  playthrough plus a minute.
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
- The golf cart crossing the Bayshore boardwalk lane, wheels turning, both directions,
  now 70×65 so it dwarfs the trash cans instead of hiding behind them.
- The taxi on Bedford Row, the tram on Galata and the courier bike on the Kordon at
  their new footprints, rendered through the real renderer next to a fighter.
- All five destructibles side by side on Flatbush in intact / damaged / smashed states,
  plus the crushed cardboard pile re-drawn as a wide scatter of flats.
- The peaceful plaza in the real build: five pedestrians crossing both ways at their
  own speeds, BODEGA shop entered with GRAB, an item bought and the menu left again,
  then the GO exit through to Bedford Row with the crowd cleared
  ([crowd](docs/screenshots/live-peace-2.png),
  [shop](docs/screenshots/live-shop-open.png),
  [taxi](docs/screenshots/live-taxi-hazard-2.png)).
- The food-delivery courier riding the Kordon in the running build, and the shop
  marker over the BODEGA amid the new pavement clutter
  ([courier](docs/screenshots/live-delivery.png),
  [marker](docs/screenshots/live-shop-marker.png),
  [Bedford Row](docs/screenshots/stage-bedford.png),
  [plaza](docs/screenshots/stage-plaza.png),
  [Kordon](docs/screenshots/stage-kordon.png),
  [Tampa](docs/screenshots/stage-tampa.png)).
- Imported traffic next to a fighter through the real renderer:
  [taxi](docs/screenshots/hazard-taxi.png),
  [tram](docs/screenshots/hazard-tram.png),
  [motorbike](docs/screenshots/hazard-bike.png),
  [delivery bike](docs/screenshots/hazard-delivery.png); the plaza and the three break states:
  [plaza](docs/screenshots/peace-plaza-2.png),
  [break states](docs/screenshots/prop-break-states-2.png).
- CRT glass on and off side by side in SETTINGS.
- All four storefronts and all four vendor stalls on their own streets (BODEGA, HOT DOG,
  BAKKAL, SİMİT, PAZAR, ÇAY, TACOS, TACO TRUCK) from the debug start, plus the İzmir
  skyline with the clock tower and the İstanbul minarets over the market roofs.
- Title lettering and the BODEGA shop menu with the new two-tone glyph fill.
- All five supplied themes playing in the running build: the title track on the title
  screen (`/assets/music/title.mp3`, 142s) and each city theme on its chapter, including
  the boss arena where the İzmir theme kept playing instead of switching.
- Review sheet for every frontage and booth: [stage-dressing.png](docs/screenshots/stage-dressing.png).

## STILL PLANNED

- Vendor booths and storefronts both open the full interior shop scene; per-booth
  counters (a hot-dog cart you buy from on the street) would be a nicer fit.
- The Dondurma Man's page has a few frames where the stretched ice cream detaches into
  separate shapes; those drips are dropped rather than carried with the frame.
- A second art pass on the enemy bodies and more attack-frame polish.
- Vendor booths currently open the full interior scene; the concept asks for the
  same menu as a street 
