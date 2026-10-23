#!/usr/bin/env python3
"""Import the supplied stage strips as scrolling backdrops.

Each strip is a single wide painted scene. The game's screen is 384x216 with the walkable
street starting at y=136, so a strip is scaled by one factor to the point where its own street
line sits on STREET_TOP and the art still covers the top of the screen; the street below that
line is continued with mirrored repeats of the strip's last rows, so a fighter standing at
z=40 is standing on the art's own pavement texture rather than on a seam.

`shops` lists the fractions of the strip width where the scene itself carries a shop: the bodega
doorway, a market stall, a food truck's hatch. The strip is tiled from world x=0, so a stall at
fraction f sits at world x = n*tile + f*tile for every repeat, and a section's shop spots are
authored on those coordinates. That is what makes the painted booth the one you can walk into;
the renderer only draws its own stall where a stage has no painted one to stand on.

Output: public/assets/stages/<id>.png|json

Usage:  python tools/art/import_stages.py [id ...]
"""

from __future__ import annotations

import json
import os
import sys

import numpy as np
from PIL import Image

from import_sheets import ROOT

SRC = os.path.join(ROOT, "assets", "source", "stages")
OUT = os.path.join(ROOT, "public", "assets", "stages")

STREET_TOP = 136          # keep in step with src/shared/data/constants.ts
SCREEN_H = 216
COLORS = 96


# `ground` is the y of the strip's street line, `scale` the factor that lands that line on
# STREET_TOP while keeping the art inside the screen, and `shops` the (fraction, kind) of every
# shop the art already paints: `store` reads as a doorway you step into, `vendor` as a stall or
# cart you walk up to. Values are tuned against the renders, not measured, so re-check the
# screenshot when a strip is swapped.
STAGES = {
    "ny": dict(file="ny.png", ground=806, scale=0.210, shops=[(0.230, "store")]),
    "kordon": dict(file="kordon.jpg", ground=571, scale=0.235, shops=[(0.752, "store")]),
    "bosphorus": dict(file="bosphorus.jpg", ground=730, scale=0.185, shops=[(0.119, "vendor"), (0.277, "vendor"), (0.910, "vendor")]),
    "bazaar": dict(file="bazaar.jpg", ground=790, scale=0.170, shops=[(0.086, "vendor"), (0.279, "vendor"), (0.503, "vendor"), (0.718, "vendor"), (0.920, "vendor")]),
    "tampa": dict(file="tampa_beach.jpg", ground=590, scale=0.230, shops=[(0.442, "store"), (0.849, "vendor")]),
    "subway": dict(file="subway.png", ground=330, scale=0.410, shops=[]),
    # the training room: a single painted gym wall, with the ring centred in the strip
    "gym": dict(file="dragons_den.png", ground=634, scale=0.214, shops=[]),
}


def build(stage: str) -> None:
    cfg = STAGES[stage]
    src = os.path.join(SRC, cfg["file"])
    im = Image.open(src).convert("RGB")
    w, h = im.size
    s = cfg["scale"]
    tw, th = max(1, round(w * s)), max(1, round(h * s))
    art = im.resize((tw, th), Image.LANCZOS)
    # one shared palette keeps the imported scene from looking smoother than the sprites
    art = art.quantize(colors=COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")

    out = Image.new("RGB", (tw, SCREEN_H), (20, 18, 26))
    top = STREET_TOP - round(cfg["ground"] * s)
    out.paste(art, (0, top))

    # extend the pavement: mirror the strip's own last rows downward, so the walkable band is
    # the same texture as the art's street and the join is a reflection, not a seam
    band = art.crop((0, max(0, th - 30), tw, th))
    bh = max(1, band.height)
    y = top + th
    flip = True
    while y < SCREEN_H:
        piece = band.transpose(Image.FLIP_TOP_BOTTOM) if flip else band
        out.paste(piece, (0, y))
        y += bh
        flip = not flip

    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, f"{stage}.png"), optimize=True)
    meta = {
        "w": tw,
        "h": SCREEN_H,
        "ground": STREET_TOP,
        "scale": s,
        "shops": [{"x": round(f * tw), "kind": kind} for f, kind in cfg["shops"]],
    }
    with open(os.path.join(OUT, f"{stage}.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    spots = ", ".join(f"{s2['kind']}@{s2['x']}" for s2 in meta["shops"]) or "none"
    print(f"{stage}: tile {tw}x{SCREEN_H} (scale {s}), shops {spots}, art top {top}")


def main() -> None:
    for stage in (sys.argv[1:] or STAGES.keys()):
        build(stage)


if __name__ == "__main__":
    main()
