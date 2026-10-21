"""Social card and favicon for the web release, drawn from the shipped atlases.

The OG card is what link previews show when someone shares xiondigital.net/kankakombat,
so it uses the game's own title font and the two heroes' real idle sprites.
Run: python tools/art/make_web_assets.py
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPRITES = os.path.join(ROOT, 'public', 'assets', 'sprites')
FONTS = os.path.join(ROOT, 'public', 'fonts')
OUT = os.path.join(ROOT, 'public')

GOLD = (240, 200, 24)
CREAM = (246, 232, 184)
RED = (224, 48, 60)
INK = (14, 10, 20)


def idle_frame(fighter: str) -> Image.Image:
    """First idle cell of a character sheet, cropped to the cell and trimmed."""
    atlas = json.load(open(os.path.join(SPRITES, fighter + '.json')))
    sheet = Image.open(os.path.join(SPRITES, fighter + '.png')).convert('RGBA')
    cw, ch = atlas['cell']
    i = atlas['anims']['idle']['frames'][0]['i']
    cell = sheet.crop(((i % atlas['cols']) * cw, (i // atlas['cols']) * ch, (i % atlas['cols']) * cw + cw, (i // atlas['cols']) * ch + ch))
    return cell.crop(cell.getbbox())


def head_frame(fighter: str) -> Image.Image:
    atlas = json.load(open(os.path.join(SPRITES, fighter + '.json')))
    sheet = Image.open(os.path.join(SPRITES, fighter + '.png')).convert('RGBA')
    cw, ch = atlas['cell']
    x, y, w, h = atlas['head']
    return sheet.crop((x, y, x + w, y + h))


def scanlines(img: Image.Image, step: int = 4) -> None:
    d = ImageDraw.Draw(img, 'RGBA')
    for y in range(0, img.height, step):
        d.line([(0, y), (img.width, y)], fill=(0, 0, 0, 26))


def og_card() -> None:
    W, H = 1200, 630
    card = Image.new('RGB', (W, H), INK)
    d = ImageDraw.Draw(card)
    for y in range(H):
        k = y / H
        d.line([(0, y), (W, y)], fill=(int(36 - 22 * k), int(26 - 16 * k), int(46 - 26 * k)))
    # faint street grid, so the flat panel still feels like a place
    g = ImageDraw.Draw(card, 'RGBA')
    for x in range(0, W, 60):
        g.line([(x, 0), (x, H)], fill=(255, 255, 255, 6))
    for y in range(0, H, 60):
        g.line([(0, y), (W, y)], fill=(255, 255, 255, 6))

    title = ImageFont.truetype(os.path.join(FONTS, 'kanka-title.ttf'), 104)
    sub = ImageFont.truetype(os.path.join(FONTS, 'kanka-title.ttf'), 40)
    small = ImageFont.truetype(os.path.join(FONTS, 'kanka-hud.ttf'), 24)

    def centre(text, font, y, fill):
        d.text((W // 2, y), text, font=font, fill=fill, anchor='mm', stroke_width=4, stroke_fill=INK)

    centre('KANKA', title, 106, GOLD)
    centre('KOMBAT', title, 202, GOLD)
    centre('NUTELLA NIGHTS', sub, 282, RED)
    centre("ONLINE CO-OP BEAT 'EM UP  ·  TWO PLAYERS  ·  FOUR CITIES", small, 340, CREAM)
    centre('FREE IN YOUR BROWSER  ·  XIONDIGITAL.NET/KANKAKOMBAT', small, 594, GOLD)

    bt, sc = idle_frame('bt'), idle_frame('sc')
    for spr, x, scale in ((bt, 30, 5), (sc, W - 30, 5)):
        im = spr.resize((spr.width * scale, spr.height * scale), Image.NEAREST)
        card.paste(im, (x if x == 30 else x - im.width, 556 - im.height), im)

    d.rectangle([0, 0, W - 1, H - 1], outline=GOLD, width=6)
    d.rectangle([14, 14, W - 15, H - 15], outline=(122, 42, 26), width=2)
    scanlines(card)
    card.save(os.path.join(OUT, 'og.png'), optimize=True)
    print('public/og.png', card.size)


def favicon() -> None:
    head = head_frame('bt')
    side = 32
    icon = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    # a small gold plate behind the head keeps the silhouette readable in a tab bar
    plate = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    pd = ImageDraw.Draw(plate)
    pd.rectangle([1, 1, side - 2, side - 2], fill=(26, 18, 32, 255), outline=GOLD, width=2)
    icon.alpha_composite(plate)
    scale = min((side - 6) / head.width, (side - 6) / head.height)
    head = head.resize((max(1, int(head.width * scale)), max(1, int(head.height * scale))), Image.NEAREST)
    icon.alpha_composite(head, ((side - head.width) // 2, (side - head.height) // 2 + 1))
    icon.save(os.path.join(OUT, 'favicon.png'))
    print('public/favicon.png', icon.size)


if __name__ == '__main__':
    og_card()
    favicon()
