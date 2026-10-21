# KankaKombat — 16-Bit Art Style Directive

**For any AI model or artist working on KankaKombat art: read this first.**
The three sprite sheets in this folder are the canonical style reference.
Match them. Do not invent a different look.

## The sheets (source of truth, in this folder)

| File | Character | Who they are |
|---|---|---|
| `muse_sprite_sheet.png` | **Muse** | Long wavy black hair with blue-dyed tips, black sunglasses, chinstrap beard + goatee, gold cuban link chain + matching bracelet, black smartwatch, plain black t-shirt, baggy black jeans, blue/white high-top sneakers |
| `sc_sprite_sheet.png` | **S.C.** | Voluminous curly black hair, full dark beard, black t-shirt with red/blue graphic emblem, silver cuban link chain + bracelet, dark blue jeans, black/white/red high-top sneakers |
| `bt_sprite_sheet.png` | **B.T.** | Long wavy dark brown hair, white button-up shirt with small red cross emblem patch on the sleeve, blue jeans, white sneakers |

Character identity is **locked**. Hair, face, outfit, colors, and accessories
must stay identical to the sheet in every frame, pose, and future asset. If a
generation drifts from the reference, regenerate — do not "fix it in post"
and do not ship a near-miss.

## Core style

- **16-bit era beat 'em up**: SNES / Sega Genesis, Streets of Rage / Final
  Fight school. Chibi-tough proportions (~3 heads tall) as on the sheets.
- **True pixel art**: chunky, visible pixels. No smooth vector look, no
  anti-aliasing blur, no gradients, no painterly shading.
- **Limited palette**: 3–4 shade ramps per color (base / shadow / highlight,
  plus outline). Reuse the exact colors already on the sheets when drawing
  anything new.
- **Outlines**: dark, near-black outlines on every sprite.
- **Readability first**: silhouettes must read at gameplay size, not just in
  the 400% hero view.

## Sheet layout (every character, no exceptions)

Each character sheet uses the same layout on a **solid flat light-blue
background** (sample the exact blue from the existing sheets):

1. **Idle** — front view, side view, back view
2. **Walk cycle** — 4 frames, side view
3. **Actions** — punch, kick, jump, crouch, power-up
4. **Hero view** — one large idle sprite at the right edge (400% reference)

Pose labels in the same simple pixel font, dark navy text, placed under or
beside each row like the reference sheets.

## Hard consistency rules

- **One size per character.** Every frame of a character is the exact same
  height and proportions. Attack frames must NOT shrink or grow the sprite —
  a smaller punch/kick frame is an automatic reject.
- **Shared ground line** within each row; feet placement must make the
  animation cycle cleanly.
- **Props stay proportionate** to the character (chains, watches, emblems
  drawn at the same scale as the reference sheets).
- **Background is solid light blue ONLY.** Never pink, never magenta, never
  a checkerboard, never a scene. (Pink/magenta chroma backgrounds caused
  baked-in artifacts in past projects — banned outright.)
- **No text inside sprites**, no watermarks, no UI chrome baked into art.

## Building production sprites from these concepts

These sheets are *concept* references. When producing game-ready assets:

- Keep the pixel density and shade ramps of the concept sheets; redraw on a
  uniform grid so frames tile evenly.
- Export frames on transparency only at the production stage, keeping a
  light-blue-background version as the review copy.
- Every new character (enemies, NPCs, bosses) must be drawn to the same
  proportions, palette discipline, and outline weight so the whole cast
  looks like one game.

## Pickup items (`pickup_items_sheet.png`)

Food pickups, drawn big and readable at gameplay size with a pixel sparkle —
the health/energy currency of the game. Locked set: **Lahmacun** (flat +
rolled), **Ayran** (sealed cup), **Nutella** (jar), **Bananas** (bunch),
**Baklava** (tray, pistachio top), **Sujuk** (horseshoe sausage ring). New
pickups join this sheet's style: same pixel density, dark outlines, sparkle.

## Enemies (same sheet layout as the heroes)

| File | Enemy | Design / behaviour notes |
|---|---|---|
| `enemy_dondurma_man_sheet.png` | **The Dondurma Man** (İstanbul) | Red embroidered vest, white shirt, red fez, handlebar moustache. Weapon: his dondurma on its long metal stick — thrust and twirl attacks. Trickster energy. |
| `enemy_nyc_bum_sheet.png` | **NYC Bum** (New York) | Grey beanie, scruffy beard, torn olive overcoat over plaid, patched pants, fingerless glove. Wild haymaker punches, scrappy brawler. |
| `enemy_tampa_man_sheet.png` | **The Tampa Man** (Tampa) | Elderly: bald + wispy white side hair, glasses, pastel polo, khaki shorts, socks with sandals. Weapon: wooden cane — overhead swing + poke. Shuffling walk, determined. |
| `enemy_biyikli_fehmi_sheet.png` | **Bıyıklı Fehmi** (İstanbul) | Red fez, huge handlebar moustache, dark waistcoat over white shirt. Never puts down his tea glass (ince belli on its saucer) — it stays in his hand in every frame, punch included. Behaviour is part of his design: he sips his tea at every turn, so he always stands still for a moment before setting off again — the tea-sipping idle pose is on his sheet; preserve the pause in his animation timing. |

## Stages

Wide panoramic stage designs. Every stage keeps a **clear, flat fighting
plane across the bottom third** — decoration lives in the backdrop, never
under the fighters' feet. Skies use banded / dithered color transitions,
never smooth gradients.

| File | Stage | Mood |
|---|---|---|
| `stage_new_york.png` | **New York** | Night. Neon bodega + pizza signs, subway entrance with green globe lamps, brick tenements, fire escapes, water towers, steam vent, moon + skyline silhouette. |
| `stage_izmir.png` | **İzmir** | Sunset. Kordon promenade + railing, Saat Kulesi clock tower, Konak mosque, ferry on the glittering bay, palm silhouettes, Turkish flags, mountains across the water. |
| `stage_istanbul.png` | **Istanbul** | Vibrant morning. Cobblestone embankment, Bosphorus + ferry, Galata Tower, domes and minarets, seagulls, market stalls, tea garden. |
| `stage_tampa.png` | **Tampa** | Relaxed sunny afternoon. Boardwalk fighting plane, pastel beach houses, lifeguard tower, taco truck, palms, pier in the distance, Bayshore Dr sign. |

## UI, lettering & HUD

- `ui_hud_kit.png` — health bar (full / half / low / empty) + wider boss
  bar, portrait box cutouts (gold / silver / red frames), score HUD
  (SCORE, HI-SCORE, 1UP, CREDIT, stage-name banner), the **GO ==>** sign in
  lit and dim blink states, GAME OVER + CONTINUE? countdown treatment.
- `font_lettering_sheet.png` — the game's bitmap font source. TITLE FONT
  (chunky yellow arcade) for headers, prices and signage; HUD FONT (small
  white) for body text and numbers. The Turkish glyphs (Ç Ğ İ Ö Ş Ü) are
  mandatory — character and place names need them (Bıyıklı Fehmi, İzmir).
  No system/default fonts anywhere in the game's UI, ever.

## Destructibles (`destructibles_sheet.png`)

Street props are breakable and pay out food. Every destructible has three
art states — **intact / damaged / smashed** — and the game swaps them as
the object takes hits: metal trash can, wooden crate, cardboard box,
wooden barrel, street mailbox. On the final hit the object bursts (debris +
sparkle) and pops a food pickup from `pickup_items_sheet.png` into a
little arc. Props sit on the fighting plane and can be broken by player
and enemy attacks alike.

## Shops (`shop_interior_ui.png`)

River City Ransom pattern: the heroes are **visibly standing inside the
store** in front of the counter, shopkeeper NPC behind it, and the buy
menu is a foreground cream panel (item list + prices, cursor, MONEY
readout) over the scene. Rules:

- Every stage themes its shop to its location — NY bodega, İzmir
  bakkal/pastane, Istanbul bazaar shop, Tampa beach/taco spot — reusing
  the same menu panel and font.
- Shops are reached through enterable storefronts on the stage maps
  (marked door + sign in the title font) — see `shop_fronts_vendors.png`
  for the four stage fronts (BODEGA / BAKKAL / PAZAR / TACOS shack) — or,
  where an interior is too heavy, a street vendor NPC with a booth stand
  on the street who opens the same menu as an overlay (same sheet: NY
  hot-dog cart, İzmir simit cart, Istanbul tea stand, Tampa taco truck).
- Buying is instant-use or carry-one-item; the player cannot be attacked
  inside a shop; exiting returns them to the exact spot outside the door.
- Prices on the concept (Lahmacun 50, Ayran 30, Bananas 40, Baklava 80,
  Sujuk 90, Nutella 150) set the food economy: price tracks heal value,
  Nutella is the rare full restore.

## Localisation (EN / TR)

Every player-facing string ships in **English and Turkish**, switchable from the
main menu and settings and remembered between visits. Menus, help, controls,
shopkeeper dialogue, item names, chapter and boss text, HUD banners and shop
labels all swap language. Turkish glyphs come from the game's own font build, not
a fallback font. Dates, prices and the ₺/$ wallet symbol stay locale-correct.

## Rights / compliance

- All KankaKombat art is original work for this project. Do not copy,
  trace, or rip sprites from commercial games — the classics are a style
  reference, not an asset source.
- Keep the cast's proportions and outfits as designed above; do not
  redesign a locked character without XiØN's explicit say-so.

— Directive set by XiØN, 2026-10-21.
