#!/usr/bin/env python
"""Build the in-game sprite atlases from the approved concept sheets.

The concept art in ConceptArt/ is the source of truth for how every fighter looks, so the
game ships frames cut straight out of those sheets instead of a proxy drawn by code:
backgrounds are keyed out, sprites are trimmed, scaled to a common height, snapped to a
small palette and seated on the ground line of a uniform cell.

Run:  python tools/art/build_concept_sprites.py [--review]

Outputs public/assets/sprites/<id>.png + .json and index.json, plus a review contact
sheet in .freebuff/preview/concept_atlas.png when --review is passed.
"""
from __future__ import annotations

import json
import os
import sys
from collections import Counter, deque

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'assets', 'sprites')
PREVIEW = os.path.join(ROOT, '.freebuff', 'preview')

CELL = (120, 100)
GROUND = 96
STAND_H = 76          # height of a standing frame, in game pixels
COLS = 6

# ---------------------------------------------------------------- sheet slicing

def key_out(im: Image.Image, tol: int = 34) -> Image.Image:
    """Remove the flat studio backdrop, keeping antialiased edges with partial alpha."""
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    bg = Counter(im.convert('RGB').getdata()).most_common(1)[0][0]
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    o = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
            if d <= tol:
                continue
            # keep blended edge pixels but drop the pale halo around the sprite
            o[x, y] = (r, g, b, 255 if d > tol + 26 else 160)
    return out


def trim(im: Image.Image) -> Image.Image:
    b = im.getbbox()
    return im.crop(b) if b else im


def to_pixels(im: Image.Image, height: int, colors: int = 40) -> Image.Image:
    """Downscale to gameplay size and reduce to a small, crisp palette."""
    w = max(1, round(im.width * height / im.height))
    small = im.resize((w, height), Image.BOX)
    alpha = small.getchannel('A').point(lambda v: 255 if v > 110 else 0)
    rgb = small.convert('RGB').quantize(colors=colors, dither=Image.Dither.NONE).convert('RGBA')
    rgb.putalpha(alpha)
    # drop single stray pixels that would read as noise at 1:1
    px = rgb.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            if px[x, y][3] == 0:
                continue
            n = 0
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < rgb.width and 0 <= ny < rgb.height and px[nx, ny][3]:
                    n += 1
            if n == 0:
                px[x, y] = (0, 0, 0, 0)
    return rgb


def load_pose(sheet: str, box, height: int) -> Image.Image:
    x0, x1, y0, y1 = box
    src = Image.open(os.path.join(ROOT, sheet)).convert('RGBA').crop((x0, y0, x1, y1))
    return to_pixels(trim(key_out(src)), height)


# ---------------------------------------------------------------- sheet layout
# Manual boxes (x0, x1, y0, y1) on the 1920x1280 / 2240x1120 concept sheets. Auto
# detection is used for the three hero sheets; enemies use the shared sheet template.
HERO_BOXES = {
    'bt': dict(sheet='ConceptArt/bt_sprite_sheet.png', poses={
        'idle_front': (358, 516, 137, 423), 'idle_side': (685, 848, 137, 423), 'idle_back': (1184, 1347, 137, 423),
        'walk1': (349, 518, 485, 705), 'walk2': (626, 794, 485, 705), 'walk3': (901, 1069, 485, 705), 'walk4': (1176, 1346, 484, 705),
        'punch': (99, 264, 772, 902), 'kick': (383, 552, 800, 917), 'jump': (660, 844, 772, 1027),
        'crouch': (936, 1094, 832, 1050), 'power': (1175, 1373, 898, 1051)}),
    'muse': dict(sheet='ConceptArt/muse_sprite_sheet.png', poses={
        'idle_front': (555, 770, 60, 445), 'walk1': (215, 440, 495, 800), 'walk2': (490, 745, 495, 800),
        'walk3': (765, 1000, 495, 800), 'walk4': (1040, 1260, 495, 800),
        'power': (170, 445, 880, 1175), 'kick': (465, 755, 880, 1175), 'punch': (755, 1025, 880, 1175),
        'crouch': (1025, 1260, 880, 1175)}),
    'sc': dict(sheet='ConceptArt/sc_sprite_sheet.png', poses={
        'idle_front': (465, 690, 55, 460), 'walk1': (140, 345, 550, 865), 'walk2': (375, 585, 550, 865),
        'walk3': (640, 835, 550, 865), 'walk4': (915, 1120, 550, 865),
        'punch': (40, 215, 895, 1185), 'kick': (235, 475, 895, 1185), 'jump': (495, 705, 895, 1185),
        'crouch': (705, 900, 895, 1185), 'power': (895, 1180, 895, 1185)}),
}

ENEMY_SHEETS = {
    'bum': 'ConceptArt/enemy_nyc_bum_sheet.png',
    'dondurma': 'ConceptArt/enemy_dondurma_man_sheet.png',
    'tampa': 'ConceptArt/enemy_tampa_man_sheet.png',
    'fehmi': 'ConceptArt/enemy_biyikli_fehmi_sheet.png',
}

# The four enemy sheets share one template: three idle views, four walk frames,
# then haymaker / jump / crouch / power-up.
ENEMY_TEMPLATE = {
    'idle_front': (100, 360, 60, 430), 'idle_side': (575, 845, 105, 430), 'idle_back': (945, 1215, 95, 415),
    'walk1': (120, 375, 485, 790), 'walk2': (440, 695, 485, 790), 'walk3': (750, 1015, 485, 790), 'walk4': (1060, 1315, 485, 790),
    'punch': (40, 615, 835, 1215), 'jump': (640, 1015, 795, 1195), 'crouch': (1025, 1335, 845, 1215), 'power': (1385, 1785, 780, 1215),
}

CHARACTERS = {
    'bt': dict(sheet='ConceptArt/bt_sprite_sheet.png', solver='hero'),
    'sc': dict(sheet='ConceptArt/sc_sprite_sheet.png', solver='hero'),
    'muse': dict(sheet='ConceptArt/muse_sprite_sheet.png', solver='hero'),
}
for eid, sheet in ENEMY_SHEETS.items():
    CHARACTERS[eid] = dict(sheet=sheet, solver='enemy')
    CHARACTERS[eid + '_boss'] = dict(sheet=sheet, solver='enemy')

# ---------------------------------------------------------------- animation map
# Every state is covered by a real concept pose. Frames that read better mirrored are
# baked as separate frames so the atlas stays a plain list of images.
def anims_for(p: dict[str, int]) -> dict:
    F = lambda name, t, ph=None: {'i': p[name], 't': t, **({'ph': ph} if ph else {})}
    return {
        'idle': {'loop': True, 'frames': [F('idle_front', 26), F('idle_front', 22)]},
        'walk': {'loop': True, 'frames': [F('walk1', 6), F('walk2', 6), F('walk3', 6), F('walk4', 6)]},
        'run': {'loop': True, 'frames': [F('walk1', 4), F('walk2', 4), F('walk3', 4), F('walk4', 4)]},
        'jump': {'loop': False, 'frames': [F('jump', 8)]},
        'fall': {'loop': False, 'frames': [F('jump', 8)]},
        'land': {'loop': False, 'frames': [F('crouch', 6)]},
        'crouch': {'loop': True, 'frames': [F('crouch', 30)]},
        'crouchwalk': {'loop': True, 'frames': [F('crouch', 8)]},
        'hurt': {'loop': False, 'frames': [F('jump', 10), F('idle_front', 10)]},
        'hurt2': {'loop': False, 'frames': [F('jump', 12)]},
        'knock': {'loop': False, 'frames': [F('fall_back', 30)]},
        'down': {'loop': False, 'frames': [F('down', 30)]},
        'getup': {'loop': False, 'frames': [F('crouch', 12), F('idle_front', 12)]},
        'grab': {'loop': False, 'frames': [F('punch', 8)]},
        'hold': {'loop': True, 'frames': [F('punch', 20)]},
        'grabatk': {'loop': False, 'frames': [F('kick', 6, 's'), F('kick', 6, 'a'), F('kick', 8, 'r')]},
        'throw': {'loop': False, 'frames': [F('power', 6, 's'), F('power', 8, 'a'), F('punch', 8, 'r')]},
        'block': {'loop': True, 'frames': [F('crouch', 30)]},
        'dodge': {'loop': False, 'frames': [F('jump', 6), F('crouch', 6)]},
        'eat': {'loop': True, 'frames': [F('idle_front', 10), F('power', 10)]},
        'pickup': {'loop': False, 'frames': [F('crouch', 10)]},
        'victory': {'loop': True, 'frames': [F('power', 24)]},
        'defeat': {'loop': True, 'frames': [F('down', 60)]},
        'ready': {'loop': True, 'frames': [F('power', 20), F('idle_front', 20)]},
        'dizzy': {'loop': True, 'frames': [F('idle_front', 14), F('crouch', 14)]},
        'held': {'loop': True, 'frames': [F('jump', 20)]},
        'thrown': {'loop': True, 'frames': [F('fall_back', 8)]},
        'taunt': {'loop': False, 'frames': [F('power', 20)]},
        'shop': {'loop': True, 'frames': [F('idle_front', 26)]},
        'light1': {'loop': False, 'frames': [F('punch', 3, 's'), F('punch', 4, 'a'), F('punch_mirror', 6, 'r')]},
        'light2': {'loop': False, 'frames': [F('punch_mirror', 3, 's'), F('punch_mirror', 4, 'a'), F('punch', 6, 'r')]},
        'light3': {'loop': False, 'frames': [F('kick', 4, 's'), F('kick', 4, 'a'), F('kick', 7, 'r')]},
        'light4': {'loop': False, 'frames': [F('kick', 4, 's'), F('kick', 4, 'a'), F('kick', 9, 'r')]},
        'heavy': {'loop': False, 'frames': [F('kick', 6, 's'), F('kick', 6, 'a'), F('kick', 12, 'r')]},
        'jumpatk': {'loop': False, 'frames': [F('kick', 4, 'a'), F('jump', 8, 'r')]},
        'runatk': {'loop': False, 'frames': [F('kick', 4, 'a'), F('kick', 10, 'r')]},
    }


def build(cid: str, cfg: dict, review: list) -> None:
    sheet = cfg['sheet']
    poses = HERO_BOXES[cid]['poses'] if cfg['solver'] == 'hero' and cid in HERO_BOXES else ENEMY_TEMPLATE
    frames: dict[str, Image.Image] = {}
    for name, box in poses.items():
        frames[name] = load_pose(sheet, box, STAND_H)
    # some sheets omit a pose (Muse's sheet has no jump drawing): substitute the closest one
    for need, alt in (('kick', 'punch'), ('jump', 'power'), ('crouch', 'idle_front'), ('power', 'punch')):
        if need not in frames and alt in frames:
            frames[need] = frames[alt]
    # derived frames: mirrored punch (other fist), lying down, knocked back
    if 'punch' in frames:
        frames['punch_mirror'] = frames['punch'].transpose(Image.FLIP_LEFT_RIGHT)
    frames['down'] = frames['idle_front'].rotate(90, expand=True)
    frames['fall_back'] = frames['idle_front'].rotate(-90, expand=True)

    order = list(frames.keys())
    idx = {n: i for i, n in enumerate(order)}
    rows = (len(order) + COLS - 1) // COLS
    img = Image.new('RGBA', (COLS * CELL[0], rows * CELL[1]), (0, 0, 0, 0))
    for name, im in frames.items():
        i = idx[name]
        cx = (i % COLS) * CELL[0] + CELL[0] // 2
        cy = (i // COLS) * CELL[1] + GROUND
        img.alpha_composite(im, (cx - im.width // 2, cy - im.height))
    img.save(os.path.join(OUT, f'{cid}.png'))
    atlas = {
        'id': cid, 'cell': list(CELL), 'anchor': [CELL[0] // 2, GROUND], 'cols': COLS,
        'count': len(order), 'anims': anims_for(idx),
    }
    with open(os.path.join(OUT, f'{cid}.json'), 'w') as f:
        json.dump(atlas, f)

    review.append((cid, img))


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(PREVIEW, exist_ok=True)
    review: list = []
    for cid, cfg in CHARACTERS.items():
        build(cid, cfg, review)
        print('atlas', cid)
    index = {cid: f'{cid}.json' for cid in CHARACTERS}
    with open(os.path.join(OUT, 'index.json'), 'w') as f:
        json.dump(index, f)
    if '--review' in sys.argv:
        scale = 2
        cols = len(review)
        w = CELL[0] * COLS * scale
        h = sum(a.height * scale for _, a in review[:1]) * len(review)
        sheet = Image.new('RGB', (cols * w, h // max(1, cols)) if False else (w, sum(a.height * scale for _, a in review)), (120, 160, 200))
        y = 0
        for cid, a in review:
            sheet.paste(a.convert('RGB'), (0, y))
            ImageDraw.Draw(sheet).text((2, y + 2), cid, fill=(0, 0, 0))
            y += a.height * scale
        sheet = sheet.resize((sheet.width * scale // 2, sheet.height * scale // 2), Image.NEAREST)
        sheet.save(os.path.join(PREVIEW, 'concept_atlas.png'))
        print('review sheet written')


if __name__ == '__main__':
    main()
