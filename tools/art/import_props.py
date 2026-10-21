#!/usr/bin/env python3
"""Import the food icons and the golf cart into the game's small prop atlases.

Both pages are painted at poster scale, so they are cut off their backgrounds, scaled
down to the game's pixel density and snapped onto one shared palette, which lets them
sit next to the hand-authored pixel art without shouting.

* food icons (assets/source/items.png): a 3x2 grid of items on flat blue, each with a
  printed caption and a sparkle. The caption and the sparkle are separate blobs from
  the food, so only the item's own blobs are kept - the largest one plus anything at
  least a quarter of its size (the splash over the Ayran).
* golf cart (assets/source/golfcart.png): four side-on frames of the Tampa Man driving.
  The page is white and the windshield is white too, sealed inside the roof frame, so
  the strip gets the same "page white" cleanup as the walk strips.

Output: public/assets/props/items.png|json and public/assets/props/golfcart.png|json

Usage:  python tools/art/import_props.py [items golfcart]
"""

from __future__ import annotations

import json
import os
import sys

import numpy as np
from PIL import Image

from import_sheets import ROOT, background, clear_white_gaps, crisp, resample, segment_strip

SRC = os.path.join(ROOT, "assets", "source")
OUT = os.path.join(ROOT, "public", "assets", "props")

ITEM_TILE = 18          # square tile, bottom aligned, matches the old 16x12 pickups
ITEM_INSET = 1          # empty pixel row kept under every icon
CART_W = 54             # the cart reads at the taxi's width ...
CART_PALETTE = 32

# grid order of the food page, left to right then top to bottom
ITEMS = ["lahmacun", "ayran", "nutella", "banana", "baklava", "sujuk"]
GRID = (3, 2)


def fit(img: np.ndarray, box: int, inset: int) -> np.ndarray:
    """Scale a premultiplied crop into a box x box tile, centred and bottom aligned."""
    s = min(box / img.shape[1], (box - inset) / img.shape[0])
    small = resample(img, s)
    tile = np.zeros((box, box, 4), np.float32)
    ox = (box - small.shape[1]) // 2
    oy = box - small.shape[0] - inset
    tile[oy:oy + small.shape[0], ox:ox + small.shape[1]] = small
    return tile


def items() -> None:
    rgb = np.asarray(Image.open(os.path.join(SRC, "items.png")).convert("RGB"))
    h, w, _ = rgb.shape
    bgcol = rgb[2, 2].astype(np.float32)
    dist = np.abs(rgb.astype(np.float32) - bgcol).max(axis=2)
    alpha = np.clip((dist - 16.0) / 40.0, 0.0, 1.0).astype(np.float32)

    cw, ch = w // GRID[0], h // GRID[1]
    tiles = []
    for row in range(GRID[1]):
        for col in range(GRID[0]):
            x0, y0 = col * cw, row * ch
            a = alpha[y0:y0 + ch, x0:x0 + cw]
            sub = rgb[y0:y0 + ch, x0:x0 + cw]
            lab, n = _label(a > 0.5)
            counts = np.bincount(lab.ravel())
            if len(counts) < 2:
                raise SystemExit("items: empty cell")
            biggest = int(counts[1:].max())
            keep = [i for i in range(1, len(counts)) if counts[i] >= biggest * 0.25]
            m = np.isin(lab, keep)
            ys, xs = np.where(m)
            box = (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)
            a = a[box[0]:box[1], box[2]:box[3]] * m[box[0]:box[1], box[2]:box[3]]
            crop = sub[box[0]:box[1], box[2]:box[3]].astype(np.float32)
            premul = np.concatenate([crop * a[..., None], a[..., None] * 255.0], axis=2)
            tiles.append(fit(premul, ITEM_TILE, ITEM_INSET))

    tiles = crisp(tiles, colors=24)
    sheet = np.zeros((ITEM_TILE, ITEM_TILE * len(tiles), 4), np.float32)
    for i, t in enumerate(tiles):
        sheet[:, i * ITEM_TILE:(i + 1) * ITEM_TILE] = t
    rgba = np.clip(sheet, 0, 255).astype(np.uint8)
    rgba[rgba[..., 3] < 16, 3] = 0
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "items.png"), optimize=True)
    with open(os.path.join(OUT, "items.json"), "w", encoding="utf-8") as fh:
        json.dump({"cell": [ITEM_TILE, ITEM_TILE], "ids": ITEMS}, fh, separators=(",", ":"))
    print(f"items: {len(tiles)} icons in {ITEM_TILE}x{ITEM_TILE}")


def golfcart() -> None:
    path = os.path.join(SRC, "golfcart.png")
    rgb = np.asarray(Image.open(path).convert("RGB"))
    bg = clear_white_gaps(rgb, background(rgb))
    # segment_strip does its own cleanup; pass the cleaned page through a temp buffer
    tmp = os.path.join(OUT, "_cart_src.png")
    os.makedirs(OUT, exist_ok=True)
    clean = rgb.copy()
    clean[bg] = 255
    Image.fromarray(clean, "RGB").save(tmp)
    try:
        frames = segment_strip(tmp, 4)
    finally:
        os.remove(tmp)

    scale = CART_W / max(m.shape[1] for m, _x, _y in frames)
    smalls = [resample(m, scale) for m, _x, _y in frames]
    smalls = crisp(smalls, colors=CART_PALETTE)
    ch = max(m.shape[0] for m in smalls)
    sheet = np.zeros((ch, CART_W * len(smalls), 4), np.float32)
    for i, m in enumerate(smalls):
        ox = i * CART_W + (CART_W - m.shape[1]) // 2
        oy = ch - m.shape[0]
        sheet[oy:oy + m.shape[0], ox:ox + m.shape[1]] = m
    rgba = np.clip(sheet, 0, 255).astype(np.uint8)
    rgba[rgba[..., 3] < 16, 3] = 0
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "golfcart.png"), optimize=True)
    with open(os.path.join(OUT, "golfcart.json"), "w", encoding="utf-8") as fh:
        json.dump({"cell": [CART_W, ch], "count": len(smalls)}, fh, separators=(",", ":"))
    print(f"golfcart: {len(smalls)} frames, cell {CART_W}x{ch}")


def _label(fg: np.ndarray) -> tuple[np.ndarray, int]:
    """8-connected component labels (span fill, ids from 1)."""
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


if __name__ == "__main__":
    jobs = sys.argv[1:] or ["items", "golfcart"]
    for job in jobs:
        if job == "items":
            items()
        elif job == "golfcart":
            golfcart()
        else:
            raise SystemExit(f"unknown job {job}")
