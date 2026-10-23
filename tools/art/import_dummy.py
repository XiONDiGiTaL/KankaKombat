#!/usr/bin/env python3
"""Import the training dummy into the game's sprite atlas format.

The supplied page is four painted poses of the same sand-filled dummy: upright, rocked
back, rocked forward and flat on the floor. Unlike the character pages it already has a
transparent background, so the work here is only cutting the four poses on their common
baseline, scaling them to fighter height and snapping them onto one shared palette.

The atlas cell is wider than the standing figure so the fallen pose fits inside it
without bleeding into the next frame. `anchor` is the ground line under the base.

Output: public/assets/sprites/dummy.png|json

Usage:  python tools/art/import_dummy.py
"""

from __future__ import annotations

import json
import os

import numpy as np
from PIL import Image

from import_sheets import ROOT, crisp

SRC = os.path.join(ROOT, "assets", "source", "training_dummy.png")
OUT = os.path.join(ROOT, "public", "assets", "sprites")

FRAMES = 4
TARGET_H = 70             # standing height; the fighters are 66px
CELL_W, CELL_H = 72, 78
ANCHOR = (CELL_W // 2, CELL_H - 3)
COLORS = 40


def load_frames() -> list[Image.Image]:
    im = Image.open(SRC).convert("RGBA")
    fw = im.width // FRAMES
    out = []
    for i in range(FRAMES):
        slot = im.crop((i * fw, 0, (i + 1) * fw, im.height))
        alpha = np.asarray(slot)[..., 3]
        ys, xs = np.where(alpha > 8)
        if not len(xs):
            raise SystemExit(f"dummy: frame {i} is empty")
        out.append(slot.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)))
    return out


def main() -> None:
    frames = load_frames()
    scale = TARGET_H / frames[0].height
    smalls = [f.resize((max(1, round(f.width * scale)), max(1, round(f.height * scale))), Image.LANCZOS)
              for f in frames]

    # premultiply before packing: LANCZOS has already blended the silhouette edge, and the
    # shared palette should only see the colour that is actually under each pixel
    tiles = []
    for f in smalls:
        rgba = np.asarray(f).astype(np.float32)
        a = rgba[..., 3:4] / 255.0
        premul = np.concatenate([rgba[..., :3] * a, rgba[..., 3:4]], axis=2)
        tiles.append(premul)
    tiles = crisp(tiles, colors=COLORS)

    sheet = np.zeros((CELL_H, CELL_W * FRAMES, 4), np.float32)
    for i, tile in enumerate(tiles):
        h, w, _ = tile.shape
        ox = i * CELL_W + (CELL_W - w) // 2
        oy = ANCHOR[1] - h
        sheet[oy:oy + h, ox:ox + w] = tile

    # crisp() keeps premultiplied colour; put it back to straight RGBA for the canvas
    a = sheet[..., 3:4] / 255.0
    rgb = np.divide(sheet[..., :3], np.maximum(a, 1e-6), out=np.zeros_like(sheet[..., :3]), where=a > 0)
    rgba = np.clip(np.concatenate([rgb, sheet[..., 3:4]], axis=2), 0, 255).astype(np.uint8)
    rgba[rgba[..., 3] < 16, 3] = 0
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "dummy.png"), optimize=True)

    one = lambda i, t, ph=None: {"i": i, "t": t, **({"ph": ph} if ph else {})}
    atlas = {
        "id": "dummy",
        "cell": [CELL_W, CELL_H],
        "anchor": [ANCHOR[0], ANCHOR[1]],
        "cols": FRAMES,
        "count": FRAMES,
        "anims": {
            "idle": {"loop": True, "frames": [one(0, 30)]},
            "hurt": {"loop": False, "frames": [one(1, 5), one(2, 6)]},
            "hurt2": {"loop": False, "frames": [one(2, 5), one(1, 6)]},
            "knock": {"loop": False, "frames": [one(1, 6), one(2, 8), one(3, 12)]},
            "down": {"loop": False, "frames": [one(3, 20)]},
            "getup": {"loop": False, "frames": [one(3, 6), one(1, 6), one(0, 10)]},
            "defeat": {"loop": True, "frames": [one(3, 60)]},
            "held": {"loop": True, "frames": [one(1, 12), one(2, 12)]},
            "thrown": {"loop": True, "frames": [one(3, 8)]},
        },
    }
    with open(os.path.join(OUT, "dummy.json"), "w", encoding="utf-8") as fh:
        json.dump(atlas, fh, separators=(",", ":"))
    print(f"dummy: {FRAMES} frames, cell {CELL_W}x{CELL_H}, anchor {ANCHOR}")


if __name__ == "__main__":
    main()
