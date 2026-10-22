#!/usr/bin/env python3
"""Import the artists' character sheets into the game's sprite atlas format.

Every page is a square grid of frames on white (or, for one page, on a checkerboard).
Three things in them defeat a naive grid crop, and this script handles each:

* frames drift and lean, so content from one frame crosses into the neighbouring grid
  cell. The page is labelled into connected blobs once and each cell claims the blob
  that covers most of its middle, so limbs cut by the grid stay attached.
* the pages are painted with a soft grey drop shadow (and one has a checkerboard
  backdrop). The background is removed by a flood fill from the border that also
  accepts low-chroma grey, so the shadow and the checkerboard go while enclosed white
  (B.T.'s shirt, the bum's vest) survives.
* each page row is drawn on its own baseline. Rows are aligned to a common ground line
  by their median bottom, which keeps the foot lift inside a walk cycle intact.

Poses are addressed by (row, column) per page, so a page with a different column count
only needs its own entry in SHEETS. Boss sheets reuse the same source page with a
palette swap.

Each page also has a four-frame walk strip drawn separately (assets/source/walk). Those
frames replace the page's walk and run rows: they are scaled so the walker stands the
same height as the same figure on the page, re-quantised onto one shared palette so the
smoother painted shading still reads as the game's pixel art, and timed from the
character's own walk speed in src/shared/data so the feet do not slide more than the
four poses allow.

Output: public/assets/sprites/<id>.png + <id>.json (the atlas schema the renderer
reads) and tools/sprites/imported.json, the list of characters the procedural build
must not overwrite.

Usage:  python tools/art/import_sheets.py [bt sc bum ...]   (default: every sheet)
"""

from __future__ import annotations

import json
import os
import re
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "source")
OUT = os.path.join(ROOT, "public", "assets", "sprites")

TARGET_H = 66       # standing height in game pixels
COLS = 12           # atlas columns
PAD_X = 2           # empty columns kept either side of a frame in the atlas cell

BG_MIN = 176        # min channel above which a pixel may be background ...
BG_CHROMA = 22      # ... if it is also close to neutral (shadows, checkerboard)
EDGE_LO = 205       # luminance ramp for the antialiased silhouette edge
EDGE_HI = 248


# --------------------------------------------------------------------- pose maps
# The pages share one layout: idle, walk, run, punches, kicks, crouch/jump,
# hurt/knockdown, getup/victory. Columns differ per page, so each entry only overrides
# what it has to.
def poses(**over) -> dict:
    p = {
        "guard": (3, 0),
        "idle": [(0, 0), (0, 1), (0, 2), (0, 3)],
        "ready": [(0, 6), (0, 7)],
        "crouch": (5, 1),
        "crouch2": (5, 6),
        "dodge": (5, 2),
        "jump": (5, 3),
        "fall": (5, 4),
        "hurt": [(6, 1), (6, 2), (6, 3)],
        "knock": [(6, 3), (6, 4), (6, 5)],
        "lie": [(6, 6), (6, 7)],
        "getup": [(7, 2), (7, 3), (7, 4), (7, 5)],
        "victory": [(7, 6), (7, 7)],
        "punch": [(3, 1), (3, 2), (3, 3)],
        "kick": [(4, 1), (4, 2), (4, 3)],
        "heavy": (4, 4),
        "cane": [(4, 2), (4, 4)],
        "twirl": (4, 4),
    }
    p.update(over)
    return p


SHEETS = {
    # ---------------------------------------------------------------- heroes
    "bt": dict(file="bt_sheet.png", cols=8, pose=poses(), walk="walk/bt.png"),
    "sc": dict(file="sc_sheet.png", cols=8, pose=poses(), walk="walk/sc.png"),  # B.T. is the woman

    # ---------------------------------------------------------------- secret fighters
    # Ozzi and Aynur are painted on pages of their own, with no walk strips and a
    # different pose grid: Ozzi walks on row 0 and runs on row 1; Aynur's page has
    # four rows of ten. Everything else (scale, baseline, packing) is the same import
    # path as the heroes.
    "ozzi": dict(file="ozzi_sheet.png", cols=8, pose=poses(
        idle=[(0, 5), (0, 6), (0, 7), (0, 4)],
        ready=[(0, 6), (0, 7)],
        walkrow=0, runrow=1,
        punch=[(2, 0), (2, 1), (2, 2)],
        kick=[(2, 5), (2, 6), (3, 4)],
        heavy=(3, 5),
        guard=(3, 1),
        crouch=(5, 6), crouch2=(7, 2), dodge=(4, 3),
        jump=(5, 3), fall=(5, 4),
        hurt=[(5, 2), (5, 1), (4, 0)],
        knock=[(6, 1), (6, 2), (6, 4)],
        lie=[(6, 5), (5, 7)],
        getup=[(7, 2), (7, 3), (7, 4), (7, 5)],
        victory=[(7, 6), (7, 7)],
        slap=(4, 4),
    )),
    "aynur": dict(file="aynur_sheet.png", cols=10, rows=4, seam_rows=[3], pose=poses(
        idle=[(0, 0), (0, 1), (0, 2), (0, 3)],
        ready=[(0, 4), (0, 5)],
        walkrow=1, runrow=1,
        # the palm strikes and jabs on row 2; the flying, floor and recovery poses on
        # row 3 supply everything a four-row page has no dedicated frame for
        punch=[(2, 1), (2, 3), (2, 4)],
        kick=[(2, 2), (2, 9), (2, 7)],
        heavy=(2, 9),
        slap=(2, 8),
        guard=(2, 5),
        crouch=(3, 6), crouch2=(3, 5), dodge=(3, 5),
        jump=(3, 1), fall=(3, 2),
        hurt=[(3, 0), (3, 1), (3, 2)],
        knock=[(3, 1), (3, 2), (3, 3)],
        lie=[(3, 3), (3, 4)],
        getup=[(3, 5), (3, 6), (0, 0), (0, 1)],
        victory=[(3, 7), (0, 7)],
    )),

    # ---------------------------------------------------------------- New York bum
    "bum": dict(file="bum_sheet.jpg", cols=10, pose=poses(
        # ten columns per row: the strikes sit further right and the crouch frames
        # are at the end of the jump strip
        crouch=(5, 7), crouch2=(5, 8), dodge=(5, 1), jump=(5, 4), fall=(5, 5),
        hurt=[(6, 2), (6, 3), (6, 4)],
        knock=[(6, 4), (6, 5), (6, 6)],
        lie=[(6, 7), (6, 8)],
        getup=[(7, 2), (7, 3), (7, 5), (7, 6)],
        victory=[(7, 7), (7, 8)],
        idle=[(0, 0), (0, 1), (0, 2), (0, 3)],
        ready=[(0, 8), (0, 9)],
        punch=[(3, 2), (3, 5), (3, 4)],
        kick=[(4, 3), (4, 6), (4, 7)],
        heavy=(3, 5),
    ), walk="walk/bum.png"),

    # ---------------------------------------------------------------- Tampa Man
    "tampa": dict(file="tampa_sheet.jpg", cols=8, pose=poses(
        punch=[(3, 2), (3, 4), (3, 3)],
        kick=[(4, 3), (4, 4), (4, 6)],
        heavy=(4, 4),
        cane=[(4, 2), (4, 4)],
        twirl=(4, 5),
    ), walk="walk/tampa.png"),

    # ---------------------------------------------------------------- Dondurma Man
    "dondurma": dict(file="dondurma_sheet.jpg", cols=8, rule_lines=True, pose=poses(
        punch=[(3, 2), (3, 4), (3, 3)],
        kick=[(4, 3), (4, 5), (4, 2)],
        heavy=(4, 5),
        twirl=(4, 4),
    ), walk="walk/dondurma.png"),

    # ---------------------------------------------------------------- Bıyıklı Fehmi
    "fehmi": dict(file="fehmi_sheet.png", cols=8, pose=poses(
        punch=[(3, 1), (3, 3), (3, 2)],
        kick=[(4, 2), (4, 3), (4, 4)],
        heavy=(4, 3),
        twirl=(4, 4),
    ), walk="walk/fehmi.png"),
}

WALK_ROW = "walk"      # frame-key row id for spliced strip frames

# boss sheets: same pages, a darker crimson palette swap so the champion reads apart
BOSSES = {
    "bum_boss": ("bum", "DUMPSTER DUKE"),
    "tampa_boss": ("tampa", "TAMPA TYRANT"),
    "dondurma_boss": ("dondurma", "DONDURMA DON"),
    "fehmi_boss": ("fehmi", "FEHMI THE FEZ"),
}


def tint_boss(img: np.ndarray) -> np.ndarray:
    """Crimson palette swap of a premultiplied RGBA float frame.

    Blues (denim) keep their hue so the outfit stays readable as a recolour rather
    than a monochrome wash of the champion.
    """
    a = img[..., 3:4] / 255.0
    red = img[..., 0]
    green = img[..., 1]
    blue = img[..., 2]
    out = img.copy()
    out[..., 0] = red * 0.94 + 22.0 * a[..., 0]
    out[..., 1] = green * 0.62
    out[..., 2] = blue * 0.64
    denim = (blue > red + 20) & (blue > 40)
    out[..., 0] = np.where(denim, red * 0.72, out[..., 0])
    out[..., 1] = np.where(denim, green * 0.70, out[..., 1])
    out[..., 2] = np.where(denim, blue * 0.86, out[..., 2])
    return np.clip(out, 0, 255)


# --------------------------------------------------------------------- animations
def anim_set(p: dict, cols: int) -> dict:
    """Every animation the renderer and the attack data can ask for."""
    walk = [(p.get("walkrow", 1), c) for c in range(cols)]
    run = [(p.get("runrow", 2), c) for c in range(cols)]
    idle = p["idle"]
    hurt = p["hurt"]
    knock = p["knock"]
    lie = p["lie"]
    getup = p["getup"]
    victory = p["victory"]
    punch = p["punch"]
    kick = p["kick"]
    guard = p["guard"]
    crouch = p["crouch"]

    a: dict[str, dict] = {}

    def add(name, frames, loop):
        seq = []
        for f in frames:
            cell, ticks = f[0], f[1]
            ph = f[2] if len(f) > 2 else None
            entry = {"cell": cell, "t": ticks}
            if ph:
                entry["ph"] = ph
            seq.append(entry)
        a[name] = {"loop": loop, "frames": seq}

    add("idle", [(c, t) for c, t in zip(idle, (16, 12, 12, 16))], True)
    add("ready", [(c, 12) for c in p["ready"]], True)
    add("walk", [(c, 5) for c in walk], True)
    add("run", [(c, 4) for c in run], True)
    add("jump", [(p["jump"], 8)], False)
    add("fall", [(p["fall"], 8)], False)
    add("land", [(crouch, 6)], False)
    add("crouch", [(crouch, 30)], True)
    add("crouchwalk", [(crouch, 8), (p.get("crouch2") or crouch, 8)], True)
    add("hurt", [(hurt[0], 6), (hurt[1], 8)], False)
    add("hurt2", [(hurt[1], 6), (hurt[2], 8)], False)
    add("knock", [(knock[0], 8), (knock[1], 10), (knock[2], 12)], False)
    add("down", [(lie[0], 12), (lie[1], 12)], False)
    add("getup", [(c, 8) for c in getup], False)
    add("defeat", [(lie[1], 60)], True)
    add("victory", [(victory[0], 10), (victory[1], 10)], True)
    add("taunt", [(victory[0], 20)], False)
    add("block", [(guard, 30)], True)
    add("dodge", [(crouch, 4), (p["dodge"], 6), (idle[0], 6)], False)
    add("grab", [(punch[0], 8)], False)
    add("hold", [(punch[1], 10), (punch[0], 10)], True)
    add("grabatk", [(punch[0], 5, "s"), (punch[1], 6, "a"), (punch[0], 6, "r")], False)
    add("throw", [(punch[0], 8, "s"), (p["heavy"], 6, "a"), (guard, 10, "r")], False)
    add("pickup", [(crouch, 10)], False)
    add("dizzy", [(hurt[1], 14), (idle[1], 14)], True)
    add("held", [(hurt[0], 20)], True)
    add("thrown", [(knock[0], 8), (knock[1], 8)], True)
    add("eat", [(idle[1], 8), (idle[2], 8)], True)

    # attacks read stance -> strike -> back to stance
    add("light1", [(guard, 3, "s"), (punch[1], 3, "a"), (idle[0], 5, "r")], False)
    add("light2", [(punch[0], 3, "s"), (punch[2], 3, "a"), (idle[0], 6, "r")], False)
    add("light3", [(kick[0], 4, "s"), (kick[1], 4, "a"), (idle[0], 7, "r")], False)
    add("light4", [(kick[0], 4, "s"), (kick[2], 6, "a"), (idle[0], 10, "r")], False)
    add("heavy", [(guard, 8, "s"), (p["heavy"], 6, "a"), (idle[0], 12, "r")], False)
    add("jumpatk", [(p["jump"], 3, "s"), (p["fall"], 14, "a"), (p["fall"], 6, "r")], False)
    add("runatk", [(run[2], 4, "s"), (punch[1], 10, "a"), (run[2], 10, "r")], False)
    add("shove", [(punch[0], 5, "s"), (punch[1], 6, "a"), (guard, 6, "r")], False)
    add("throwobj", [(punch[0], 4, "s"), (punch[2], 8, "a"), (guard, 8, "r")], False)

    # signature moves of the four concept enemies
    add("haymaker", [(guard, 10, "s"), (p["heavy"], 6, "a"), (idle[0], 12, "r")], False)
    add("slap", [(guard, 4, "s"), (p.get("slap") or punch[2], 4, "a"), (idle[0], 8, "r")], False)
    add("cane", [(p["cane"][0], 10, "s"), (p["cane"][1], 6, "a"), (idle[0], 12, "r")], False)
    add("poke", [(punch[0], 6, "s"), (punch[1], 6, "a"), (idle[0], 8, "r")], False)
    add("thrust", [(punch[0], 8, "s"), (punch[1], 5, "a"), (idle[0], 10, "r")], False)
    add("twirl", [(kick[0], 6, "s"), (p["twirl"], 18, "a"), (idle[0], 12, "r")], False)
    add("charge", [(c, 4) for c in run], True)

    # aliases for moves only the legacy roster uses
    for alias, src in (("stomp", "heavy"), ("splash", "heavy"), ("belly", "heavy"),
                       ("cone", "light1"), ("whip", "light2"), ("rush", "runatk")):
        a[alias] = a[src]
    return a


# ------------------------------------------------------------------------ imaging
def shift_or(mask: np.ndarray, r: int) -> np.ndarray:
    """4-neighbour dilation by r pixels (a diamond)."""
    out = mask.copy()
    for _ in range(r):
        grow = out.copy()
        grow[1:, :] |= out[:-1, :]
        grow[:-1, :] |= out[1:, :]
        grow[:, 1:] |= out[:, :-1]
        grow[:, :-1] |= out[:, 1:]
        out = grow
    return out


def shift_and(mask: np.ndarray, r: int) -> np.ndarray:
    """4-neighbour erosion by r pixels."""
    out = mask.copy()
    for _ in range(r):
        keep = out.copy()
        keep[1:, :] &= out[:-1, :]
        keep[:-1, :] &= out[1:, :]
        keep[:, 1:] &= out[:, :-1]
        keep[:, :-1] &= out[:, 1:]
        out = keep
    return out


def background(rgb: np.ndarray, rule_lines: bool = False) -> np.ndarray:
    """Everything reachable from the page border without crossing the drawn figure.

    The figure's ink is never pure white, so a flood fill over "not ink" removes the
    white background, the painted drop shadow and one page's checkerboard together.
    The ink mask is closed first: outlines have hairline gaps where they were painted
    over the light shadow, and without the closing the fill leaks into white sleeves.
    """
    mn = rgb.min(axis=2)
    chroma = rgb.max(axis=2) - mn
    ink = (mn <= BG_MIN) | (chroma >= BG_CHROMA)
    solid = shift_and(shift_or(ink, 2), 2)
    cand = ~solid
    h, w = cand.shape
    out = np.zeros_like(cand)
    stack = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)]
    stack += [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    while stack:
        x, y = stack.pop()
        if out[y, x] or not cand[y, x]:
            continue
        left = x
        while left > 0 and cand[y, left - 1] and not out[y, left - 1]:
            left -= 1
        right = x
        while right < w - 1 and cand[y, right + 1] and not out[y, right + 1]:
            right += 1
        out[y, left:right + 1] = True
        for ny in (y - 1, y + 1):
            if 0 <= ny < h:
                row = cand[ny, left:right + 1] & ~out[ny, left:right + 1]
                idx = np.flatnonzero(row)
                if len(idx):
                    starts = idx[np.r_[True, np.diff(idx) > 1]]
                    stack.extend((left + int(s), ny) for s in starts)
    # give the closing's 2px halo back to the background, stopping at real ink
    out = shift_or(out, 2) & ~(mn <= BG_MIN - 30)

    if rule_lines:
        # One page carries a faint horizontal guide rule on every row boundary; it is
        # drawn across the feet and would ride along with the frames. Rule rows are the
        # only ones near a boundary where most of the page is grey ink.
        grey = ((chroma < 14) & (mn > 55) & (mn < 180)).mean(axis=1)
        near = np.array([min(y % 192, 192 - (y % 192)) < 26 for y in range(h)])
        out[(grey > 0.22) & near] = True

    # Pockets of paper-white that reach the ground line are the gaps between the legs,
    # which the artists outlined shut where the drop shadow merges them. The fill cannot
    # enter them, so they are removed here; garments never reach the feet.
    pure = (mn >= 240) & (chroma <= 10) & ~out
    lab, n = label(pure)
    if n:
        counts = np.bincount(lab.ravel())
        rows = 8
        bottoms = []
        for r in range(rows):
            y0, y1 = r * h // rows, (r + 1) * h // rows
            solid_rows = np.nonzero(~out[y0:y1].all(axis=1))[0]
            bottoms.append(y0 + int(solid_rows.max()) if len(solid_rows) else -999)
        ys, xs = np.nonzero(pure)
        order = np.argsort(lab[ys, xs])
        ys, xs = ys[order], xs[order]
        labs = lab[ys, xs]
        uniq, starts = np.unique(labs, return_index=True)
        for uid, start in zip(uniq, starts):
            size = int(counts[uid])
            if size < 150 or size > 1600:
                continue
            yy = ys[start:start + size]
            r = int(yy.mean()) * rows // h
            r = min(rows - 1, max(0, r))
            if int(yy.max()) >= bottoms[r] - 8:
                out |= lab == uid
    return out


def label(fg: np.ndarray) -> tuple[np.ndarray, int]:
    """8-connected component labels over a boolean mask (span fill, ids from 1)."""
    h, w = fg.shape
    lab = np.zeros((h, w), np.int32)
    cur = 0
    for sy, sx in zip(*np.nonzero(fg)):
        if lab[sy, sx]:
            continue
        cur += 1
        stack = [(int(sx), int(sy))]
        while stack:
            x, y = stack.pop()
            if lab[y, x] or not fg[y, x]:
                continue
            left = x
            while left > 0 and fg[y, left - 1] and not lab[y, left - 1]:
                left -= 1
            right = x
            while right < w - 1 and fg[y, right + 1] and not lab[y, right + 1]:
                right += 1
            lab[y, left:right + 1] = cur
            for ny in (y - 1, y + 1):
                if 0 <= ny < h:
                    row = fg[ny, left:right + 1] & (lab[ny, left:right + 1] == 0)
                    idx = np.flatnonzero(row)
                    if len(idx):
                        starts = idx[np.r_[True, np.diff(idx) > 1]]
                        stack.extend((left + int(s), ny) for s in starts)
    return lab, cur


def resample(img: np.ndarray, s: float) -> np.ndarray:
    """Area-average downscale of a premultiplied RGBA float image."""
    h, w, _ = img.shape
    ow, oh = max(1, round(w * s)), max(1, round(h * s))
    out = np.zeros((oh, ow, 4), np.float32)
    x0s = np.floor(np.arange(ow) / s).astype(int)
    x1s = np.minimum(w, np.ceil((np.arange(ow) + 1) / s).astype(int))
    y0s = np.floor(np.arange(oh) / s).astype(int)
    y1s = np.minimum(h, np.ceil((np.arange(oh) + 1) / s).astype(int))
    for oy in range(oh):
        for ox in range(ow):
            patch = img[y0s[oy]:max(y1s[oy], y0s[oy] + 1), x0s[ox]:max(x1s[ox], x0s[ox] + 1)]
            out[oy, ox] = patch.reshape(-1, 4).mean(axis=0)
    return out


# -------------------------------------------------------------------------- build
# --------------------------------------------------------------- walk strips
# Four-frame running strips, one per character. They are painted smoother than the
# pages, so they are palette-matched to the page art on the way in.
def walk_speeds() -> dict[str, float]:
    """Walk speed per sheet id, read from the game data so the cadence stays in sync.

    Both data files keep `sheet: 'x'` and `walk: n` on the same line per enemy/fighter.
    """
    speeds: dict[str, float] = {}
    for rel in ("src/shared/data/enemies.ts", "src/shared/data/fighters.ts"):
        path = os.path.join(ROOT, *rel.split("/"))
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                ms = re.search(r"sheet:\s*'(\w+)'", line)
                mw = re.search(r"\bwalk:\s*([\d.]+)", line)
                if ms and mw:
                    speeds[ms.group(1)] = float(mw.group(1))
    return speeds


def drop_ground_line(rgb: np.ndarray, band: int = 8, min_run: int = 60) -> np.ndarray:
    """Erase the thin grey rule the strips carry under the feet.

    Every walk strip has a 1-3px grey stroke running along the ground under the
    figures - an artist's baseline, not part of the character. It survives the flood
    fill because it touches the shoes, and at game scale it reads as a stray streak.
    Only long, low-chroma, mid-grey runs in the last few rows qualify; the near-black
    outlines and the near-white soles are left alone.
    """
    h, w, _ = rgb.shape
    out = rgb.copy()
    mn = out.min(axis=2)
    mx = out.max(axis=2)
    line = (mx - mn <= 16) & (mn >= 30) & (mn <= 230)
    for y in range(max(0, h - band), h):
        x = 0
        while x < w:
            if not line[y, x]:
                x += 1
                continue
            end = x
            while end < w and line[y, end]:
                end += 1
            if end - x >= min_run:
                out[y, x:end] = 255
            x = end
    return out


def clear_white_gaps(rgb: np.ndarray, bg: np.ndarray, min_area: int = 4000, pure_frac: float = 0.6) -> np.ndarray:
    """Drop the page-white gaps the border fill cannot reach.

    Where an arm, a cane or a leg closes a loop, the strip's paper white is sealed off
    from the border and would render as a solid white wedge. Those gaps are the only
    near-white shapes painted absolutely flat at 255; the artists' white garments and
    hair highlights always carry a little shading (249-252), so they survive.
    """
    mn = rgb.min(axis=2)
    chroma = rgb.max(axis=2) - mn
    pure = (mn >= 240) & (chroma <= 10) & ~bg
    lab, _n = label(pure)
    counts = np.bincount(lab.ravel())
    for i in range(1, len(counts)):
        if counts[i] < min_area:
            continue
        m = lab == i
        if float((rgb[m].min(axis=1) >= 254).mean()) > pure_frac:
            bg = bg | m
    return bg


def segment_strip(path: str, count: int = 4) -> list[tuple[np.ndarray, int, int]]:
    """Cut a one-row walk strip into `count` premultiplied crops, left to right.

    The figures are found as blobs rather than by an even grid, so a stride or a cane
    that reaches past its own slot cannot be clipped by a neighbouring frame.
    """
    rgb = drop_ground_line(np.asarray(Image.open(path).convert("RGB")))
    bg = clear_white_gaps(rgb, background(rgb))
    lum = rgb.min(axis=2).astype(np.float32)
    alpha = np.ones(rgb.shape[:2], np.float32)
    alpha[bg] = 0.0
    ring = np.zeros_like(bg)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(bg, (dy, dx), (0, 1))
    ring &= ~bg
    alpha[ring] = np.clip((EDGE_HI - lum[ring]) / (EDGE_HI - EDGE_LO), 0, 1)

    lab, _n = label(alpha > 0.02)
    counts = np.bincount(lab.ravel())
    cand = [(int(i), int(counts[i])) for i in range(1, len(counts)) if counts[i] > 0]
    cand.sort(key=lambda kv: kv[1], reverse=True)
    if len(cand) < count:
        raise SystemExit(f"{os.path.basename(path)}: wanted {count} figures, found {len(cand)}")
    keep = [i for i, _a in cand[:count]]
    boxes = []
    for i in keep:
        ys, xs = np.where(lab == i)
        boxes.append((int(xs.mean()), i, int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1))
    boxes.sort()

    out = []
    for _cx, i, x0, x1, y0, y1 in boxes:
        a = np.where(lab[y0:y1, x0:x1] == i, alpha[y0:y1, x0:x1], 0.0).astype(np.float32)
        premul = np.concatenate([rgb[y0:y1, x0:x1].astype(np.float32) * a[..., None],
                                 a[..., None] * 255.0], axis=2)
        out.append((premul, x0, y0))
    return out


def crisp(frames: list[np.ndarray], colors: int = 28) -> list[np.ndarray]:
    """Snap a set of frames onto one small palette so painted shading reads as pixel art."""
    solid = np.concatenate([m[m[..., 3] > 200][:, :3] for m in frames if (m[..., 3] > 200).any()])
    if len(solid) == 0:
        return frames
    palette = np.asarray(Image.fromarray(solid.reshape(1, -1, 3).astype(np.uint8), "RGB")
                         .quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
                         .convert("RGB"), np.float32).reshape(-1, 3)
    palette = np.unique(palette, axis=0)
    out = []
    for m in frames:
        c = m[..., :3]
        # nearest palette entry in sRGB, only where the pixel is actually drawn
        d = ((c.reshape(-1, 1, 3) - palette.reshape(1, -1, 3)) ** 2).sum(axis=2)
        near = palette[np.argmin(d, axis=1)].reshape(c.shape)
        m = m.copy()
        m[..., :3] = near
        out.append(m)
    return out


def segment(path: str, cols: int, rule_lines: bool = False, rows: int = 8,
            seam_rows: tuple[int, ...] = ()) -> dict[tuple[int, int], tuple[np.ndarray, int, int]]:
    """Cut the page into (row, col) -> (premultiplied rgba crop, x, y in the page).

    `seam_rows` are rows whose figures touch across the grid: a 1px vertical cut on
    each internal cell boundary there keeps two knockdown poses from being claimed as
    one blob (which leaves a boot from the next frame floating in the cell).
    """
    rgb = np.asarray(Image.open(path).convert("RGB"))
    h, w, _ = rgb.shape
    bg = background(rgb, rule_lines)
    if seam_rows:
        ch = h / rows
        for r in seam_rows:
            y0, y1 = int(round(r * ch)), int(round((r + 1) * ch))
            for c in range(1, cols):
                bg[y0:y1, int(round(c * w / cols))] = True
    lum = rgb.min(axis=2).astype(np.float32)

    alpha = np.ones((h, w), np.float32)
    alpha[bg] = 0.0
    ring = np.zeros_like(bg)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(bg, (dy, dx), (0, 1))
    ring &= ~bg
    alpha[ring] = np.clip((EDGE_HI - lum[ring]) / (EDGE_HI - EDGE_LO), 0, 1)

    lab, _ = label(alpha > 0.02)
    cw, ch = w / cols, h / rows
    frames: dict[tuple[int, int], tuple[np.ndarray, int, int]] = {}
    for r in range(rows):
        y0, y1 = int(round(r * ch)), int(round((r + 1) * ch))
        for c in range(cols):
            x0, x1 = int(round(c * cw)), int(round((c + 1) * cw))
            inner = lab[y0 + 24:y1 - 24, x0 + 24:x1 - 24]
            ids, counts = np.unique(inner, return_counts=True)
            keep = (ids > 0) & (counts > 150)
            if not keep.any():
                continue
            best = int(ids[keep][np.argmax(counts[keep])])
            # grow the claim over a padded window so limbs outside the grid survive
            wx0, wy0 = max(0, x0 - 40), max(0, y0 - 40)
            wx1, wy1 = min(w, x1 + 40), min(h, y1 + 40)
            m = lab[wy0:wy1, wx0:wx1] == best
            ys, xs = np.where(m)
            if not len(ys):
                continue
            by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            a = np.where(m, alpha[wy0:wy1, wx0:wx1], 0.0).astype(np.float32)
            premul = np.concatenate([rgb[wy0:wy1, wx0:wx1].astype(np.float32) * a[..., None],
                                     a[..., None] * 255.0], axis=2)
            frames[(r, c)] = (premul[by0:by1, bx0:bx1], int(wx0 + bx0), int(wy0 + by0))
    return frames


def walk_cadence(sheet_id: str) -> tuple[int, int]:
    """(walk, run) ticks per four-frame cycle for this sheet's walk speed.

    One strip cycle is two steps, so the cycle length is chosen so that the ground the
    character covers while the legs complete a cycle stays close to the painted stride:
    K was tuned at the heroes' 1.5 px/tick and then scaled by each character's own speed,
    which keeps Fehmi's amble and the Tampa Man's shuffle from moonwalking.
    """
    speed = walk_speeds().get(sheet_id, 1.5)
    cycle = int(round(30.0 / max(0.35, speed)))
    cycle = max(10, min(64, cycle))
    return cycle, max(6, int(round(cycle * 0.55)))


def build(sheet_id: str, spec: dict, tint=None) -> None:
    page = segment(os.path.join(SRC, spec["file"]), spec["cols"], spec.get("rule_lines", False),
                   spec.get("rows", 8), tuple(spec.get("seam_rows", ())))
    cols = spec["cols"]
    anims_src = anim_set(spec["pose"], cols)

    if not page:
        raise SystemExit(f"{sheet_id}: no frames found")

    # the page sets the scale: its standing figures are TARGET_H tall
    heights = sorted(m.shape[0] for m, _, _ in page.values())
    tall = [v for v in heights if v > 0.55 * heights[-1]]
    page_scale = TARGET_H / float(np.median(tall))

    # (row, col) -> (scaled crop, source x, source y, scale)
    scaled: dict[tuple, tuple[np.ndarray, int, int, float]] = {
        k: (resample(m, page_scale), sx, sy, page_scale) for k, (m, sx, sy) in page.items()
    }

    if spec.get("walk"):
        strip = segment_strip(os.path.join(SRC, spec["walk"]))
        # match the page's own walking figures, so the body does not change size on a step
        page_walk = [m.shape[0] for k, (m, _sx, _sy, _s) in scaled.items() if k[0] == 1]
        target_h = float(np.median(page_walk)) if page_walk else float(TARGET_H)
        strip_scale = target_h / float(np.median([m.shape[0] for m, _sx, _sy in strip]))
        frames = [resample(m, strip_scale) for m, _sx, _sy in strip]
        frames = crisp(frames)
        for i, m in enumerate(frames):
            scaled[(WALK_ROW, i)] = (m, strip[i][1], strip[i][2], strip_scale)
        w_cycle, r_cycle = walk_cadence(sheet_id)
        anims_src["walk"] = {"loop": True, "frames": [
            {"cell": (WALK_ROW, i), "t": max(2, int(round(w_cycle * w)))} for i, w in enumerate((0.3, 0.2, 0.3, 0.2))
        ]}
        anims_src["run"] = {"loop": True, "frames": [
            {"cell": (WALK_ROW, i), "t": max(2, int(round(r_cycle * w)))} for i, w in enumerate((0.3, 0.2, 0.3, 0.2))
        ]}

    # only keep animations whose frames exist on the page, and index the frames they use
    order: list[tuple] = []
    anims: dict[str, dict] = {}
    for name, a in anims_src.items():
        seq = []
        for f in a["frames"]:
            if f["cell"] not in scaled:
                continue
            if f["cell"] not in order:
                order.append(f["cell"])
            e = {"i": order.index(f["cell"]), "t": f["t"]}
            if "ph" in f:
                e["ph"] = f["ph"]
            seq.append(e)
        if seq:
            anims[name] = {"loop": a["loop"], "frames": seq}

    # per source-row baseline, so a row's own foot lift survives the normalisation
    bottoms: dict[object, list[float]] = {}
    for k, (m, _sx, sy, s) in scaled.items():
        bottoms.setdefault(k[0], []).append(sy * s + m.shape[0])
    baseline = {r: float(np.median(v)) for r, v in bottoms.items()}
    lifts = {k: int(round(baseline[k[0]] - (sy * s + m.shape[0]))) for k, (m, _sx, sy, s) in scaled.items()}

    if tint:
        scaled = {k: (tint(m), sx, sy, s) for k, (m, sx, sy, s) in scaled.items()}

    # anchor: planted foot for standing poses, silhouette centre for lying ones
    anchor_off: dict[tuple, int] = {}
    for k, (m, _sx, _sy, _s) in scaled.items():
        ys, xs = np.where(m[..., 3] > 60)
        if len(xs) == 0:
            anchor_off[k] = m.shape[1] // 2
            continue
        if m.shape[0] < 0.62 * TARGET_H:
            off = int(round((xs.min() + xs.max() + 1) / 2))
        else:
            band = ys > ys.max() - max(2, m.shape[0] * 0.12)
            off = int(round(xs[band].mean()))
        anchor_off[k] = off

    used = [k for k in order]
    left = max(anchor_off[k] for k in used) + PAD_X
    right = max(scaled[k][0].shape[1] - anchor_off[k] for k in used) + PAD_X
    ax, cw = left, left + right

    top = min(-lifts[k] - scaled[k][0].shape[0] for k in used)
    low = max(-lifts[k] for k in used)
    ground, ch = -top + 2, -top + 2 + low + 2

    sheet = np.zeros((((len(order) + COLS - 1) // COLS) * ch, COLS * cw, 4), np.float32)
    for i, key in enumerate(order):
        m = scaled[key][0]
        oy = ground - lifts[key] - m.shape[0]
        ox = ax - anchor_off[key]
        cx, cy = (i % COLS) * cw, (i // COLS) * ch
        mh, mw = m.shape[0], m.shape[1]
        sx0, sy0 = max(0, -ox), max(0, -oy)
        dx0, dy0 = max(0, ox), max(0, oy)
        ww, hh = min(mw - sx0, cw - dx0), min(mh - sy0, ch - dy0)
        if ww > 0 and hh > 0:
            sheet[cy + dy0:cy + dy0 + hh, cx + dx0:cx + dx0 + ww] = m[sy0:sy0 + hh, sx0:sx0 + ww]

    rgba = np.clip(sheet, 0, 255).astype(np.uint8)
    rgba[rgba[..., 3] < 16, 3] = 0      # drop resampling haze
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, f"{sheet_id}.png"), optimize=True)

    # HUD portrait: head box measured off the idle silhouette
    idle = sheet[0:ch, 0:cw]
    ys, xs = np.where(idle[..., 3] > 60)
    top_y, bottom = int(ys.min()), int(ys.max())
    band = ys < top_y + (bottom - top_y) * 0.30
    hx = int(round((xs[band].min() + xs[band].max() + 1) / 2))
    head = [max(0, hx - 10), max(0, top_y - 1), 20, 24]

    atlas = {"id": sheet_id, "cell": [cw, ch], "anchor": [ax, ground], "head": head,
             "cols": COLS, "count": len(order), "anims": anims}
    with open(os.path.join(OUT, f"{sheet_id}.json"), "w", encoding="utf-8") as fh:
        json.dump(atlas, fh, separators=(",", ":"))

    BUILT.add(sheet_id)
    print(f"{sheet_id}: {len(order)} frames, cell {cw}x{ch}, ground {ground}, {len(anims)} anims")


BUILT: set[str] = set()

if __name__ == "__main__":
    wanted = sys.argv[1:] or list(SHEETS) + list(BOSSES)
    for key in wanted:
        if key in SHEETS:
            build(key, SHEETS[key])
        elif key in BOSSES:
            base, _name = BOSSES[key]
            build(key, SHEETS[base], tint=tint_boss)
        else:
            raise SystemExit(f"unknown sheet {key}")
    path = os.path.join(ROOT, "tools", "sprites", "imported.json")
    previous: set[str] = set()
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            previous = set(json.load(fh))
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(sorted(BUILT | previous), fh)
