#!/usr/bin/env python3
"""Import the townsfolk walk sheet (8 characters x 4 stride frames) for the peaceful areas.

The page is one row per character on a white background; each cell is cut to its figure,
the whole set is scaled by one factor so the crowd keeps its relative heights next to a
68 px fighter, snapped onto a shared palette and packed into a uniform 4-column atlas that
the client draws as ambient pedestrians (no collision, like River City Ransom).

Output: public/assets/sprites/npcs.png|json

Usage:  python tools/art/import_npcs.py
"""

from __future__ import annotations

import json
import os

import numpy as np
from PIL import Image

from import_sheets import ROOT, background, crisp, label, resample

SRC = os.path.join(ROOT, "assets", "source", "npcs.jpg")
OUT = os.path.join(ROOT, "public", "assets", "sprites")

ROWS = 8
COLS = 4
TARGET_H = 60          # a townsfolk is a little shorter than the 68 px hero
COLORS = 64            # eight outfits on one palette, so a few extra shades are needed
GROUND_PAD = 1         # transparent rows under the feet, so the contact reads

IDS = [
    "muse", "boombox", "turkish", "hijab",
    "tampa", "latina", "turkish_woman", "elderly",
]


def main() -> None:
    rgb = np.asarray(Image.open(SRC).convert("RGB"))
    h, w, _ = rgb.shape
    bg = background(rgb)
    alpha = (~bg).astype(np.float32)

    fig = np.concatenate([rgb.astype(np.float32) * alpha[..., None], alpha[..., None] * 255.0], axis=2)
    cw, ch = w / COLS, h / ROWS

    crops: list[np.ndarray] = []
    for row in range(ROWS):
        for col in range(COLS):
            x0, x1 = int(round(col * cw)), int(round((col + 1) * cw))
            y0, y1 = int(round(row * ch)), int(round((row + 1) * ch))
            lab, n = label(alpha[y0:y1, x0:x1] > 0.5)
            if n == 0:
                raise SystemExit(f"npc sheet: empty cell at row {row} col {col}")
            counts = np.bincount(lab.ravel())
            biggest = int(counts[1:].max())
            keep = [i for i in range(1, len(counts)) if counts[i] >= biggest * 0.04]
            m = np.isin(lab, keep)
            ys, xs = np.where(m)
            box = (int(ys.min()), int(ys.max()) + 1, int(xs.min()), int(xs.max()) + 1)
            crops.append(fig[y0 + box[0]:y0 + box[1], x0 + box[2]:x0 + box[3]])

    heights = [c.shape[0] for c in crops]
    s = TARGET_H / float(np.median(heights))
    scaled = crisp([resample(c, s) for c in crops], colors=COLORS)

    cell_w = max(m.shape[1] for m in scaled) + 2
    cell_h = max(m.shape[0] for m in scaled) + 2
    sheet = np.zeros((cell_h * ROWS, cell_w * COLS, 4), np.float32)
    for i, m in enumerate(scaled):
        row, col = divmod(i, COLS)
        ox = col * cell_w + (cell_w - m.shape[1]) // 2
        oy = row * cell_h + (cell_h - m.shape[0]) - GROUND_PAD
        sheet[oy:oy + m.shape[0], ox:ox + m.shape[1]] = m

    a = np.clip(sheet[..., 3:4], 0, 255)
    rgb_out = np.where(a > 0, sheet[..., :3] * 255.0 / np.maximum(a, 1e-3), 0)
    rgba = np.clip(np.concatenate([rgb_out, a], axis=2), 0, 255).astype(np.uint8)
    rgba[rgba[..., 3] < 24, 3] = 0
    rgba[rgba[..., 3] == 0, :3] = 0
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "npcs.png"), optimize=True)
    meta = {
        "cell": [cell_w, cell_h],
        "cols": COLS,
        "rows": ROWS,
        "ids": IDS,
        "anchor": [cell_w // 2, cell_h - GROUND_PAD],
    }
    with open(os.path.join(OUT, "npcs.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    print(f"npcs: {len(IDS)} characters x {COLS} frames, cell {cell_w}x{cell_h} (target {TARGET_H}px)")


if __name__ == "__main__":
    main()
