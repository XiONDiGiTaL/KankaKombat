#!/usr/bin/env python3
"""Import the supplied hazard vehicles (taxi, tram, motorbike) into the game atlases.

The source strips are four side-on frames each, already cut out on transparency, painted at
poster scale. A hazard has to read as a real vehicle next to a 68 px fighter, so every strip
is scaled by one factor to its own on-screen height, snapped onto a shared palette (so the
painted shading reads as pixel art) and packed into a bottom-aligned 4-frame cell.

The cell is what the renderer draws into: HAZARD_SIZE in src/client/render/art.ts is kept
equal to it, and the simulation's hitW matches, so a frame's nose always connects.

Usage:  python tools/art/import_hazards.py [taxi tram bike ...]
"""

from __future__ import annotations

import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

from import_sheets import ROOT, crisp, resample

SRC = os.path.join(ROOT, "assets", "source", "hazards")
OUT = os.path.join(ROOT, "public", "assets", "props")

# on-screen height of the vehicle's body, in game pixels; the fighter is 68 px tall
TARGET_H = {
    "taxi": 76,
    "tram": 94,
    "bike": 78,
    "delivery": 56,
}

# A painted strip can leave the page colour inside the art: the gaps between the rider and
# the frame, or the see-through of a bike's triangle. Those are big flat blobs of white, so
# they are found by eroding the bright mask (thin highlights and spokes survive) and dropping
# whatever sits inside the grown core of a blob.
def clear_white_holes(im: np.ndarray) -> np.ndarray:
    rgb = im[..., :3]
    bright = ((rgb.min(axis=2) > 232) & (im[..., 3] > 20)).astype(np.uint8) * 255
    if not bright.any():
        return im
    mask = Image.fromarray(bright, "L")
    core = mask.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(9))
    hole = np.asarray(core) > 0
    out = im.copy()
    out[hole] = 0
    return out
COLORS = 48          # the painted shading needs more than the props' 32, faces are small
WHITE_HOLES = {"delivery"}   # strips that still carry the page colour inside the silhouette


def frames(path: str, name: str) -> list[np.ndarray]:
    """Cut the transparent strip into its four frames, cropped to each frame's own bbox."""
    im = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
    # only the strip whose page colour leaked inside the art needs the hole pass: the other
    # pages are already cut out, and their white highlights are part of the paint
    if name in WHITE_HOLES:
        im = clear_white_holes(im)
    mask = im[..., 3] > 20
    cols = mask.any(axis=0)
    runs: list[tuple[int, int]] = []
    x = 0
    w = mask.shape[1]
    while x < w:
        if cols[x]:
            start = x
            while x < w and cols[x]:
                x += 1
            runs.append((start, x))
        else:
            x += 1
    if len(runs) != 4:
        raise SystemExit(f"{os.path.basename(path)}: expected 4 frames, found {len(runs)}")
    out = []
    for x0, x1 in runs:
        sub = mask[:, x0:x1]
        ys = np.where(sub.any(axis=1))[0]
        y0, y1 = int(ys.min()), int(ys.max()) + 1
        crop = im[y0:y1, x0:x1]
        a = crop[..., 3:4] / 255.0
        out.append(np.concatenate([crop[..., :3] * a, crop[..., 3:4]], axis=2))
    return out


def build(name: str) -> None:
    src = os.path.join(SRC, f"{name}.png")
    crops = frames(src, name)
    # one factor for the whole strip, taken from the median frame so a spark or a raised
    # arm cannot shrink the vehicle
    body_h = float(np.median([c.shape[0] for c in crops]))
    s = TARGET_H[name] / body_h
    scaled = [resample(c, s) for c in crops]
    scaled = crisp(scaled, colors=COLORS)

    cw = max(m.shape[1] for m in scaled)
    ch = max(m.shape[0] for m in scaled)
    sheet = np.zeros((ch, cw * len(scaled), 4), np.float32)
    for i, m in enumerate(scaled):
        ox = i * cw + (cw - m.shape[1]) // 2
        oy = ch - m.shape[0]
        sheet[oy:oy + m.shape[0], ox:ox + m.shape[1]] = m

    # the sheet is premultiplied while it is scaled; put it back to straight alpha so the
    # PNG's edges do not read darker than the art
    a = np.clip(sheet[..., 3:4], 0, 255)
    rgb = np.where(a > 0, sheet[..., :3] * 255.0 / np.maximum(a, 1e-3), 0)
    rgba = np.clip(np.concatenate([rgb, a], axis=2), 0, 255).astype(np.uint8)
    rgba[rgba[..., 3] < 24, 3] = 0
    rgba[rgba[..., 3] == 0, :3] = 0
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, f"{name}.png"), optimize=True)
    with open(os.path.join(OUT, f"{name}.json"), "w", encoding="utf-8") as fh:
        json.dump({"cell": [cw, ch], "count": len(scaled)}, fh, separators=(",", ":"))
    print(f"{name}: {len(scaled)} frames, cell {cw}x{ch} (body target {TARGET_H[name]}px)")


def main() -> None:
    jobs = sys.argv[1:] or ["taxi", "tram", "bike", "delivery"]
    for job in jobs:
        build(job)


if __name__ == "__main__":
    main()
