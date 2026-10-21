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

## Rights / compliance

- All KankaKombat art is original work for this project. Do not copy,
  trace, or rip sprites from commercial games — the classics are a style
  reference, not an asset source.
- Keep the cast's proportions and outfits as designed above; do not
  redesign a locked character without XiØN's explicit say-so.

— Directive set by XiØN, 2026-10-21.
