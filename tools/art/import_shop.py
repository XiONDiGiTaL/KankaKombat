#!/usr/bin/env python3
"""Import the painted shops: their rooms and the keepers behind their counters.

`tacos_shop.jpg` is one wide painted scene of the shop (wall, shelves, bar, floor). The
game's screen is 384x216 with the menu panel taking everything below y=126, so the room
is the whole panorama scaled to 384x126 — the same crop the reference preview uses.

A keeper sheet is a 4x4 grid in four rows: behind-the-counter busts, greeting, serving and
talking. The camera sits at the counter, so a standing pose has to be cut off where the
counter starts; the import does that per frame and bakes the visible part into a uniform
atlas cell, aligned by two landmarks measured from the art itself:

- the torso (a shirt, apron or vest, whose colour is listed per keeper) gives the body's
  centre column, so the torso stays put while the arms move between poses;
- the top of the head gives the head's height, so the face never bounces.

Every keeper is scaled so the visible bust — head top to the cut — is the same ~43 px in
the room, so the four of them read at one size across a scene change. The cell's
bottom-centre is the anchor the renderer puts on the counter's edge, which is why
`counterY` and `keeperX` are shipped next to each room's art.

`bakkal_stage.png` is Hüsnü's whole shop as one 1600x686 panorama. It is tighter than 3:1,
so the import crops a 525px band (shelves down to the counter front) instead of squashing
it. Hüsnü's sheet is cut like the others and blitted over the painted figure at the
room's own counter line.

`pazar` is Kemal's street cart, so his room is the Istanbul waterfront the cart is parked
on (the stage concept, cropped 3:1 at the game's own framing with the pavement along the
bottom). The cart itself is cut out of the idle row of his own sheet — tray, turşu jar,
front boards and all — so the cart in the room and the man behind it are the same drawing
at the same scale.

Output: public/assets/shops/{tacos,bakkal,pazar}.png|json and
        public/assets/shops/{lupe,marcos,husnu,kemal}.png|json

Usage:  python tools/art/import_shop.py
"""

from __future__ import annotations

import json
import os

import numpy as np
from PIL import Image, ImageDraw

from import_sheets import ROOT

SRC = os.path.join(ROOT, "assets", "source", "shops")
OUT = os.path.join(ROOT, "public", "assets", "shops")

# Keep in step with src/shared/data/constants.ts and with the room crop in the renderer.
SCREEN_W = 384
ROOM_H = 126

# The bar's top edge and Lupe's column, in room pixels. Her hands rest on the edge, so the
# busts are anchored here bottom-centre; every other row is cut at the same line. Measured
# against the reference preview, not guessed: her bust is 47x43 here, the same as the mock.
# She stands far enough along the bar that her silhouette (27 px left of her centre) clears
# the menu board's price column at x=242, in every pose — a waving hand in front of the
# chalk is the one thing that would make the wall unreadable.
COUNTER_Y = 79
KEEPER_X = 272

# The chalk menu board on the back wall. The painting has a small one whose chalk is
# unreadable scribble once the panorama is 384 px wide — its slate is 24 px across, less
# than five letters of the HUD font. The import repaints the board at a size a dish and its
# price fit side by side and ships a *blank* slate: the game chalks MENÚ and the counter's
# stock on at runtime with its own glyphs (src/client/render/shops.ts), so the board is
# letters and live prices, not texture. It covers the right end of the middle shelf run,
# which reads as a board hung proud of the wall — the same place the painting hung one.
BOARD = (183, 31, 64, 44)       # x, y, w, h in room pixels
BOARD_OLD_TOP = (216, 27, 247, 31)   # the old board's frame, above the new one's top edge
BOARD_OLD_HANGER = (1141, 95, 1330, 166)  # the old wire and nail, in source pixels
COL_WALL = (252, 216, 128)      # the plaster the old board hung on
COL_WIRE = (62, 25, 6)
COL_INK = (36, 20, 8)
COL_FRAME = (155, 81, 44)
COL_FRAME_LIT = (196, 118, 58)
COL_FRAME_DARK = (106, 52, 24)
COL_SLATE = (35, 45, 31)
COL_SLATE_EDGE = (27, 35, 25)
COL_DUST = (48, 60, 43)

# One scale for every frame so her head stays the same size in all four rows.
SCALE = 0.148
HEAD_Y = 36           # head top in room pixels, shared by every row
COLORS = 96

ROWS = ["idle", "greet", "serve", "talk"]

# Hüsnü's bakkal: one 1600x686 panorama of the shop. It is not 3:1, so the import crops a
# 525px band (1600/384*126) instead of squashing it: shelves at the top, the glass counter
# at 78% of the band. He is painted into the panorama too, small and still; his own sheet
# is cut like the others and blitted over the painted figure at the same counter line.
BAKKAL_SRC = "bakkal_stage.png"
BAKKAL_CROP = (0, 65, 1600, 590)
BAKKAL_COLORS = 96
BAKKAL_COUNTER = 88
BAKKAL_KEEPER_X = 228

# Kemal's pazar. He is a street vendor, so his room is the waterfront he works on: the
# Istanbul concept, cropped to the game's own 3:1 framing (the concept is drawn at the
# screen's scale, 2240 px wide), with the pavement along the bottom of the crop. The room
# is the same waterfront the stage uses, which is the point — the cart is parked on it.
PAZAR_SRC = os.path.join(ROOT, "ConceptArt", "stage_istanbul.png")
PAZAR_CROP = (0, 330, 2240, 1059)      # the whole waterfront, pavement along the bottom
PAZAR_COLORS = 128
PAZAR_CART_CENTRE = 240                 # room x the cart's middle line sits on
PAZAR_FLOOR = 124                       # room y the cart's wheels/shadow rest on
BOARD_RED = (204, 63, 54)               # the cart's counter surface, sampled from the art


HEAD_PAD = 5                  # room px of headroom baked above every keeper's head


def with_alpha(im: Image.Image) -> Image.Image:
    """The sheet is drawn on flat white; everything white becomes transparent."""
    a = np.array(im.convert("RGB"))
    return Image.fromarray(np.dstack([a, np.where(a.min(axis=2) >= 246, 0, 255).astype(np.uint8)]), "RGBA")


def hair_top(im: Image.Image) -> int:
    """First row of the figure that carries a wide run of dark pixels: the top of her hair.

    Hands are dark only as a 1px outline, so a 70px run cannot be anything but hair.
    """
    a = np.array(im)
    dark = (a[:, :, 3] > 0) & (a[:, :, :3].astype(int).sum(axis=2) < 260)
    for y in range(im.height):
        xs = np.where(dark[y])[0]
        if len(xs) == 0:
            continue
        runs = np.split(xs, np.where(np.diff(xs) > 1)[0] + 1)
        if max(len(r) for r in runs) >= 70:
            return y
    return 0


def figure_top(im: Image.Image) -> int:
    """First row carrying a real slice of the figure: the top of the hat or hair.

    The other three keepers are read this way rather than by a dark run: Hüsnü's hair is
    grey and Marcos's cap is blue, so only the silhouettes are common to all of them.
    """
    a = np.array(im)
    fg = a[:, :, 3] > 0
    need = max(6, round(im.width * 0.08))
    for y in range(im.height):
        if int(fg[y].sum()) >= need:
            return y
    return 0


def torso_lupe(a: np.ndarray) -> np.ndarray:
    """Her orange shirt: the one landmark that does not move with her arms."""
    return (a[:, :, 0] > 170) & (a[:, :, 1] > 70) & (a[:, :, 1] < 150) & (a[:, :, 2] < 90)


def torso_marcos(a: np.ndarray) -> np.ndarray:
    """The bodega's green apron."""
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return (g > 60) & (g < 160) & (g > r + 15) & (g > b + 15)


def torso_husnu(a: np.ndarray) -> np.ndarray:
    """The bakkal's cream apron, a shade off his skin so only the apron is picked up."""
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return (r > 225) & (g > 180) & (g < 236) & (b > 120) & (b < 190) & (r >= g) & (g >= b)


def torso_kemal(a: np.ndarray) -> np.ndarray:
    """His burgundy vest, dark enough to be told apart from the cart's red boards."""
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return (r > 75) & (r < 140) & (g < 70) & (b < 80) & (r > g + 40)


def torso_center(im: Image.Image, torso) -> float:
    """Centre column of the keeper's torso, which stays put while the arms move."""
    a = np.array(im).astype(int)
    m = (a[:, :, 3] > 0) & torso(a)
    xs = np.where(m)[1]
    return (xs.min() + xs.max()) / 2 if len(xs) else im.width / 2


# Every keeper sheet is 4x4 (bust, greeting, serving, talking). `bust` is the height of
# the visible figure in room pixels — head top to the counter it is cut at — and `scale`
# is the uniform shrink of the sheet. With `bust` the same for all four, the cut lands on
# each sheet's own counter line, which is what the comment beside it records.
KEEPERS = {
    "lupe": dict(sheet="lupe_sheet.png", scale=0.148, bust=43, torso=torso_lupe, head=hair_top),
    "marcos": dict(sheet="marcos_sheet_white.png", scale=0.150, bust=40, torso=torso_marcos, head=figure_top),   # cut at the counter line y=314
    "husnu": dict(sheet="husnu_sheet.png", scale=0.145, bust=43, torso=torso_husnu, head=figure_top),            # cut at the counter line y=364
    "kemal": dict(sheet="kemal_sheet.png", scale=0.170, bust=43, torso=torso_kemal, head=figure_top),            # cut at the cart's top edge y=276
}


def clear_old_hanger(im: Image.Image) -> Image.Image:
    """Take the painting's own wire and nail off the wall, before the downscale smears them.

    Called on the full-size panorama; paint_menu_board() then hangs the bigger board.

    Only pixels that sit on the blend between the wire's colour and the plaster's are
    touched, so the bunting tips hanging into this band survive. At source resolution the
    hole is too small to see once the panorama is resampled.
    """
    a = np.array(im).astype(int)
    x0, y0, x1, y1 = BOARD_OLD_HANGER
    patch = a[y0:y1, x0:x1]
    v = np.array(COL_WALL) - np.array(COL_WIRE)
    mix = np.clip(((patch - COL_WIRE) @ v) / (v @ v), 0, 1)
    blend = np.abs(patch - (COL_WIRE + mix[..., None] * v)).sum(axis=2) < 26
    patch[blend] = COL_WALL
    a[y0:y1, x0:x1] = patch
    return Image.fromarray(a.astype(np.uint8), "RGB")


def paint_menu_board(room: Image.Image) -> None:
    """Replace the painting's tiny chalkboard with one the HUD font can be written on.

    Sizes are in room pixels, so the frame and slate are authored at the resolution the
    game draws them at and stay crisp. The slate is left blank and undecorated where the
    game's chalk goes; only the frame, the shadowed edges and a little dust are painted.
    """
    x, y, w, h = BOARD
    d = ImageDraw.Draw(room)

    # the old board's top frame pokes above the new one: plaster over it (those rows hold
    # nothing but the wire, which clear_old_hanger() has already taken out)
    d.rectangle(BOARD_OLD_TOP, fill=COL_WALL)

    # no wire: at this size the board is mounted flush and the old painting's hanger (taken
    # out at source resolution) is not put back — it would cross the shelf's crown and the
    # bunting string where the board now sits
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=COL_INK)
    d.rectangle([x + 1, y + 1, x + w - 2, y + h - 2], fill=COL_FRAME)
    d.line([(x + 1, y + 1), (x + w - 2, y + 1)], fill=COL_FRAME_LIT)
    d.line([(x + 1, y + 1), (x + 1, y + h - 2)], fill=COL_FRAME_LIT)
    d.line([(x + 1, y + h - 2), (x + w - 2, y + h - 2)], fill=COL_FRAME_DARK)
    d.line([(x + w - 2, y + 1), (x + w - 2, y + h - 2)], fill=COL_FRAME_DARK)

    d.rectangle([x + 3, y + 3, x + w - 4, y + h - 4], fill=COL_SLATE)
    d.line([(x + 3, y + 3), (x + w - 4, y + 3)], fill=COL_SLATE_EDGE)
    d.line([(x + 3, y + 3), (x + 3, y + h - 4)], fill=COL_SLATE_EDGE)
    # chalk dust in the side margins the writing never reaches, so the slate is not a dead
    # flat rectangle; the seeded rng keeps the rebuilt PNG identical every run
    rng = np.random.default_rng(7)
    margins = [[x + 5, x + 6, x + 7], [x + w - 8, x + w - 7, x + w - 6]]
    for i in range(20):
        dx = int(rng.choice(margins[i % 2]))
        dy = int(rng.integers(y + 5, y + h - 5))
        d.point((dx, dy), fill=COL_DUST)


def build_room() -> None:
    im = clear_old_hanger(Image.open(os.path.join(SRC, "tacos_shop.jpg")).convert("RGB"))
    room = im.resize((SCREEN_W, ROOM_H), Image.LANCZOS)
    paint_menu_board(room)
    room = room.quantize(colors=COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    os.makedirs(OUT, exist_ok=True)
    room.save(os.path.join(OUT, "tacos.png"), optimize=True)
    meta = {"w": SCREEN_W, "h": ROOM_H, "counterY": COUNTER_Y, "keeperX": KEEPER_X, "keeper": "lupe",
            "board": list(BOARD)}
    with open(os.path.join(OUT, "tacos.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    print(f"tacos: room {SCREEN_W}x{ROOM_H}, bar at y={COUNTER_Y}, keeper at x={KEEPER_X}, board {BOARD}")


def build_bakkal() -> None:
    im = Image.open(os.path.join(SRC, BAKKAL_SRC)).convert("RGB")
    band = im.crop(BAKKAL_CROP)
    room = band.resize((SCREEN_W, ROOM_H), Image.LANCZOS)
    room = room.quantize(colors=BAKKAL_COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    os.makedirs(OUT, exist_ok=True)
    room.save(os.path.join(OUT, "bakkal.png"), optimize=True)
    # Hüsnü is painted into the panorama at a chibi scale of his own (his head fills the
    # bust), so his atlas does not sit over him: it is cut and shipped ready for the bakkal
    # room redesign, and this room keeps the painted figure until then.
    meta = {"w": SCREEN_W, "h": ROOM_H, "counterY": BAKKAL_COUNTER, "keeperX": BAKKAL_KEEPER_X}
    with open(os.path.join(OUT, "bakkal.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    print(f"bakkal: room {SCREEN_W}x{ROOM_H} from a {band.width}x{band.height} band, counter at y={BAKKAL_COUNTER}")


ANIMS = {
    "idle": {"frames": [0, 1, 2, 3], "fps": 5},
    "greet": {"frames": [4, 5, 6, 7], "fps": 8},
    "serve": {"frames": [8, 9, 10, 11], "fps": 8},
    "talk": {"frames": [12, 13, 14, 15], "fps": 6},
}


def build_keeper(name: str, cfg: dict) -> dict:
    """Cut one 4x4 sheet into the 16-cell counter atlas the renderer steps through."""
    sheet = with_alpha(Image.open(os.path.join(SRC, cfg["sheet"])))
    cw, ch = sheet.width / 4, sheet.height / 4
    s = cfg["scale"]
    frames = []      # (image, torso centre x, head top)
    for r in range(4):
        for c in range(4):
            cell = sheet.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
            body = cell.crop(cell.split()[3].getbbox())
            w, h = max(1, round(body.width * s)), max(1, round(body.height * s))
            small = body.resize((w, h), Image.LANCZOS)
            rgb = small.convert("RGB").quantize(colors=64, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
            small = Image.merge("RGBA", (*rgb.split(), small.split()[3].point(lambda a: 255 if a >= 96 else 0)))
            frames.append((small, torso_center(body, cfg["torso"]) * s, cfg["head"](body) * s))

    # The cell has to hold every pose: arms out sideways in the greeting, a plate pushed
    # forward in the serving row. Its height is the visible bust plus a little headroom,
    # so anything below the counter falls outside the cell and is cut exactly where the
    # counter would hide it.
    left = max(round(f[1]) for f in frames)
    right = max(round(f[0].width - f[1]) for f in frames)
    cell_w = left + right + 2
    cell_h = cfg["bust"] + HEAD_PAD
    ax = left + 1                        # anchor = counter edge, bottom-centre of the cell

    atlas = Image.new("RGBA", (cell_w * 4, cell_h * 4), (0, 0, 0, 0))
    for i, (img, cx, hy) in enumerate(frames):
        tile = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
        tile.alpha_composite(img, (ax - round(cx), HEAD_PAD - round(hy)))
        atlas.paste(tile, ((i % 4) * cell_w, (i // 4) * cell_h))
    atlas.save(os.path.join(OUT, f"{name}.png"), optimize=True)

    meta = {"cell": [cell_w, cell_h], "anchor": [ax, cell_h], "anims": ANIMS}
    with open(os.path.join(OUT, f"{name}.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    print(f"{name}: atlas {atlas.width}x{atlas.height}, cell {cell_w}x{cell_h}, anchor {ax},{cell_h}")
    return meta


def kemal_cart(s: float) -> tuple[Image.Image, tuple[int, int], int]:
    """The cart from the idle row of Kemal's sheet, as a sprite for the pazar room.

    His bust row is drawn behind his own cart: the midye tray on the left, the turşu jar on
    the right, the red front boards below. The atlas cuts him at the cart's top edge, so the
    cart itself is lifted out here and baked into the room — a cart does not breathe, and
    the keepers' other rows have to stay behind it. Returns the scaled sprite, the cell
    coordinate it was cut from, and the cut line, so the room can place the two exactly.
    """
    cfg = KEEPERS["kemal"]
    sheet = with_alpha(Image.open(os.path.join(SRC, cfg["sheet"])))
    cell = sheet.crop((0, 0, round(sheet.width / 4), round(sheet.height / 4)))
    a = np.array(cell).copy()
    cut = round(cfg["head"](cell.crop(cell.split()[3].getbbox())) + cfg["bust"] / s)
    keep = np.zeros(a.shape[:2], bool)
    keep[292:, :] = True                       # the cart's top board, front boards and wheels
    keep[196:300, 36:224] = True               # the midye tray, overlapping his left arm
    keep[168:308, 338:414] = True              # the turşu jar, overlapping his right arm
    keep &= a[:, :, 3] > 0
    # His hand rests on the counter and his vest shows above it; both belong to the keeper,
    # not the furniture, so the hand is painted out with the counter's own red. Otherwise a
    # hand would stay on the cart while the greeting and serving rows move his arms.
    a[cut:292, 218:338] = (*BOARD_RED, 255)
    keep[cut:292, 218:338] = True
    ys, xs = np.where(keep)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    art = Image.fromarray(np.dstack([a[:, :, :3], np.where(keep, 255, 0).astype(np.uint8)])[y0:y1, x0:x1], "RGBA")
    art = art.resize((max(1, round(art.width * s)), max(1, round(art.height * s))), Image.LANCZOS)
    rgb = art.convert("RGB").quantize(colors=64, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    art = Image.merge("RGBA", (*rgb.split(), art.split()[3].point(lambda v: 255 if v >= 96 else 0)))
    return art, (x0, y0), cut


def build_pazar(anchor_x: int) -> None:
    """Kemal's pazar: the storefront's arch behind, his own cart across the front."""
    cfg = KEEPERS["kemal"]
    s = cfg["scale"]
    src = Image.open(PAZAR_SRC).convert("RGB")
    room = src.crop(PAZAR_CROP).resize((SCREEN_W, ROOM_H), Image.LANCZOS)
    room = room.quantize(colors=PAZAR_COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")

    cart, (ox, oy), cut = kemal_cart(s)
    top = round((oy - cut) * s)                 # the sprite's top, relative to the cut line
    counter = PAZAR_FLOOR - (top + cart.height)  # the cart's base rests on the pavement
    left = PAZAR_CART_CENTRE - anchor_x + round(ox * s)
    frame = Image.new("RGBA", (SCREEN_W, ROOM_H), (0, 0, 0, 0))
    frame.alpha_composite(room.convert("RGBA"))
    frame.alpha_composite(cart, (left, counter + top))
    out = frame.convert("RGB")
    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, "pazar.png"), optimize=True)
    meta = {"w": SCREEN_W, "h": ROOM_H, "counterY": counter, "keeperX": PAZAR_CART_CENTRE,
            "keeper": "kemal"}
    with open(os.path.join(OUT, "pazar.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    print(f"pazar: arch band {PAZAR_CROP}, cart {cart.width}x{cart.height} at ({left},{counter}), counter y={counter}")


def main() -> None:
    build_room()
    build_bakkal()
    metas = {name: build_keeper(name, cfg) for name, cfg in KEEPERS.items()}
    build_pazar(metas["kemal"]["anchor"][0])


if __name__ == "__main__":
    main()
