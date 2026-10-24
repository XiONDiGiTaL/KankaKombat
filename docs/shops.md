# Shops, vendors and the food economy

The shop system is built around one rule: **drops stay generic, shops sell culture.** The six
street drops are a closed set and never appear in a shop; every shop stocks the food of its
own place, and its menu is the only way to eat it. Sit-down shops carry one $150 FULL restore
as their signature; street booths are cheaper and never reach FULL.

Nothing here is speculative: the tables below are the shipped catalog
(`src/shared/data/items.ts`), and the stock lists are the shipped shelves
(`src/shared/data/shops.ts`).

---

## 1. The two economies

**Street drops (locked, unchanged).** Ayran 30 / +25, Bananas 40 / +45, Lahmacun 50 / +45,
Baklava 80 / +70, Sucuk 90 / +70, Nutella 150 / FULL. They fall out of bins, crates, barrels,
boxes and mailboxes. Their weights (28/26/18/12/10/4) are the drop table; every shop item is
weight 0, so `spawnFood` can never roll one.

**Shop meals (the reason to walk in).** No overlap with the drops, heals above what the
street gives, and a cultural identity per counter.

### TACOS — Tampa · Lupe (Mexican-American)

| Item | Price | Heal |
|---|---|---|
| Tortillas | $25 | +20 |
| Taco | $40 | +35 |
| Quesadilla | $55 | +45 |
| Elote | $70 | +55 |
| Burrito | $90 | +70 |
| Pastor Plate | $150 | FULL |

### BODEGA — New York · Marcos (Dominican-American)

| Item | Price | Heal |
|---|---|---|
| Bagel | $30 | +25 |
| Plantain Chips | $35 | +30 |
| Beef Patty | $45 | +40 |
| Knish | $50 | +45 |
| Chopped Cheese | $90 | +75 |
| Bronx Hero | $150 | FULL |

No bacon, egg and cheese anywhere — the bodega heroes are the Chopped Cheese and the Bronx
Hero, out of respect for Muslim players. The Beef Patty icon currently reads as a plain
brown disc; it is being redrawn as a folded golden pastry.

### BAKKAL — İzmir · Hüsnü (Turkish grocer)

| Item | Price | Heal |
|---|---|---|
| Çay | $20 | +15 |
| Simit | $30 | +25 |
| Börek | $50 | +45 |
| Lokum | $65 | +55 |
| Dondurma | $85 | +70 |
| Karışık Pide | $150 | FULL |

The joke writes itself: you fight dondurma men and çaycıs all over Türkiye, and Hüsnü sells
you their stock.

### PAZAR — İstanbul · Kemal (street cart)

| Item | Price | Heal |
|---|---|---|
| Turşu Suyu | $20 | +15 |
| Kestane | $35 | +30 |
| Mısır | $40 | +35 |
| Midye Dolma | $60 | +50 |
| Nar Suyu | $75 | +60 |
| Balık Ekmek | $130 | +90 |

Street prices, no FULL restore — full restores stay a shop privilege.

### Booths without their own table

They draw from their city's table, capped below FULL:

| Booth | Stock |
|---|---|
| Newsstand (Dee, NY store) | Bagel 30, Plantain Chips 35, Knish 50 |
| Hot Dog Cart (Sal, NY) | Plantain Chips 35, Beef Patty 45, Knish 50 |
| Simit Cart (Hasan, İzmir) | Çay 20, Simit 30, Börek 50 |
| Çay Stand (Ayşe, İstanbul) | Çay 20, Simit 30, Lokum 65 |
| Taco Truck (Rico, Tampa) | Tortillas 25, Taco 40, Quesadilla 55, Elote 70 |

---

## 2. Vendor roster

| Shop id | City | Venue | Keeper | Heritage | Look |
|---|---|---|---|---|---|
| `bodega` | New York | store | **Marcos** | Dominican-American, uptown | 40s–50s, brown skin, short beard, navy cap, green apron over a white tee, gold chain; warm, fast, calls you *papi* |
| `newsstand` | New York | store | **Dee** | African-American, Brooklyn | 60s, grey crop, glasses on a chain, burgundy cardigan, dry and unhurried |
| `hotdog` | New York | cart | **Sal** | Italian-American, Bensonhurst | 50s, grey moustache, paper hat, stained apron, *buddy* |
| `bakkal` | İzmir | store | **Hüsnü** | Turkish, İzmirli | 60s+, grey moustache and glasses, flat cap, plaid shirt, cream apron, hands on the glass counter |
| `simit` | İzmir | cart | **Hasan** | Turkish | 30s, lean, black moustache, white shirt, cloth cap, tea glass in reach |
| `pazar` | İstanbul | cart | **Kemal** | Turkish | 40s, jet-black hair and a thick black moustache, no glasses, flat cap, burgundy vest, white apron; his own red cart carries the midye tray and the turşu jar |
| `cay` | İstanbul | stand | **Ayşe** | Turkish | 40s, hair in a bun, burgundy cardigan, tray of tulip glasses, *canım* |
| `tacos` | Tampa | store | **Lupe** | Mexican-American | orange shirt, apron, hands on the bar; *amigo* |
| `tacotruck` | Tampa | truck | **Rico** | Mexican, Lupe's nephew | 20s, backwards cap, green apron; *carnal* |

### Voice and address

One address term per keeper, never a pile-up:

| Keeper | Term |
|---|---|
| Marcos | *papi* |
| Dee | *baby* |
| Sal | *buddy* |
| Hüsnü, Hasan, Kemal | *kanka* |
| Ayşe | *canım* |
| Lupe | *amigo* |
| Rico | *carnal* |

The bitmap HUD font has no Spanish accents or inverted punctuation (no á, í, ñ, ¡, ¿), so
Spanish appears in ASCII; Turkish lines use the font's own Ç Ğ İ Ö Ş U glyphs.

---

## 3. Art status

| Asset | State |
|---|---|
| `shop_items_sheet.png` (24 icons) | **delivered and integrated** — appended to the 18px item atlas by `tools/art/import_props.py` |
| `bakkal_stage.png` | **delivered and integrated** — cropped and baked to `public/assets/shops/bakkal.png`; the room is painted, so Hüsnü is already in it |
| `lupe_sheet_white.png`, `tacos_shop_stage.png` | not yet in the repo; the current Lupe room and atlas from the first pass stay live |
| `marcos_sheet_white.png` | **integrated** — cut to `marcos.png|json` and drawn at the bodega's counter |
| `husnu_sheet.png` | **cut and staged** — `husnu.png|json` ships, but the bakkal panorama already paints him at its own chibi scale, so his atlas waits for the bakkal room redesign |
| `kemal_sheet.png` | **integrated** — cut to `kemal.png|json` and drawn behind the pazar cart |
| Pazar booth art | **integrated** — `pazar.png` is the Istanbul waterfront with his own cart baked in |

### Counter atlases

A keeper sheet is cut by `tools/art/import_shop.py` into `<keeper>.png` + `.json` in
`public/assets/shops/`, a 4×4 grid of 16 cells with a matching `idle`/`greet`/`serve`/`talk`
row. Every cell is the same size, the figure is cut at the counter line, and the anchor is
the cell's bottom-centre, so the renderer only has to put `counterY` on the bar and
`keeperX` on the torso. `keeperFrame()` steps it from the game clock; a sale plays `serve`,
a short wallet plays `talk`, and the first beats of a visit play `greet`.

One size across the drop: the visible bust — head top to the cut — is ~43 px for every
keeper, so Marcos, Hüsnü and Kemal read at Lupe's scale in a scene change. The cut and the
scale are listed per keeper in `KEEPERS`, and both are measured from the art (the torso
colour gives the centre column, the head top gives the height), never typed per frame.

- **`lupe`** — 43 px bust, cut at her hands on the taco shop's bar.
- **`marcos`** — 40 px bust, cut at the sheet's own counter line (y=314); he is drawn into
  every shop whose interior is still assembled from blocks, since the bodega has no room art.
- **`husnu`** — 43 px bust, cut at his glass counter (y=364); staged for the bakkal redesign.
- **`kemal`** — 43 px bust, cut at his cart's top edge (y=276).

**Kemal's cart is furniture, not a frame.** His bust row is drawn behind his own red cart,
with the midye tray on the left and the turşu jar on the right. The import lifts that cart
out of the idle row and bakes it into the pazar room, paints his resting hand out with the
counter's own red, and cuts the atlas at the cart's top edge — so the greeting and serving
rows move his arms over a cart that stays put, instead of the cart breathing with him.
The room is the Istanbul waterfront cropped 3:1 at the game's own framing (the concept is
drawn at screen scale), with the cart parked on the pavement at `counterY: 100`.

`tests/shopArt.test.ts` pins the grid, the anchor on the cell's bottom edge and the empty
headroom row, and the shop e2e samples Marcos's cap over the block interior and Kemal's cap
over the cart to prove the atlases are the ones on screen.

Running: [Marcos at the bodega](screenshots/shop-bodega.png) ·
[Kemal at his cart](screenshots/shop-pazar.png). Rebuild the drop with `npm run shop`.

### What a vendor sheet must be

- **4×4** grid: row 1 behind-counter bust idle, row 2 greet, row 3 serve, row 4 talk.
- Flat white background (or transparent), no shadow, no caption, no second character.
- One size for all 16 frames; same head height in every row; torso centred.
- Hands and arms above the counter line. Anything below is cut where the bar hides it.
- Row-1 busts may carry the counter they lean on (Marcos' bar line, Kemal's cart). The
  import cuts just above that line for every row, so it is never shipped as part of the
  keeper; a cart the keeper is drawn behind can be lifted out and baked into his room.
- Optional per-row strips next to the sheet help review, but the 4×4 sheet is the source.

### What a room must be

- A panorama, ideally 3:1 at 2048 px wide. The game's room window is **384×126** (the cream
  menu owns everything below y=126).
- If the panorama is not 3:1, the import crops a band instead of squashing it; the bakkal's
  1600×686 source becomes a 1600×525 band (y 65–590) at 0.24×.
- The counter's top edge is one clean horizontal line; the keeper's centre column is measured
  from the art and shipped as `counterY` / `keeperX` in the room's `.json`. Set it so the
  keeper's silhouette (about 27 px left of the centre for a behind-the-counter bust) clears
  a wall board's right-hand column — Lupe stands at `keeperX: 272` so no pose puts a hand
  over the prices.
- Signage in the game's own lettering — title for a shop's name, HUD for small copy such as
  the chalk menu — with Turkish glyphs where needed. No real brand logos.
- A room may carry a **chalk menu board**. The art paints the frame and an empty slate, and
  the room's `.json` ships its rect as `board: [x, y, w, h]`; the renderer writes the words
  on it at runtime with the HUD glyphs, so the wall text is real text (spelled, folded, and
  never a painted letterform that disagrees with the font). Lupe's is `[183, 31, 64, 44]`:
  the old painting's board was 24 px wide at 384 — less than five letters — so the import
  repaints it wide enough for a dish and its price side by side, leaving the slate blank.

**The board is derived, never typed.** `chalkLayout(board, shop)` reads the shop's own
`stock` and writes the wall from it: the first rows in menu order whose short name (the
dish's first word, `Pastor Plate` → `PASTOR`) and price fit the slate, as many as the
slate's height holds — three for Lupe. A long dish beside a three-digit price is skipped
for the next one that fits, so `TORTILLAS` and `QUESADILLA` are off the wall while `TACO`,
`ELOTE` and `BURRITO` are on it. Adding, renaming or repricing a dish moves the wall with
the menu below; there is no list in the art or in the room's `.json` to drift. Prices are
the wallet's amounts without the city's symbol — a chalk menu writes `40`, the printed
menu carries `$40`.

`tests/shopArt.test.ts` fails if a row outgrows the slate, if a row names a price the
counter does not charge, or if a stock of one dish does not produce exactly one row. Keep
the board's top edge below the greeting bubble's two lines (y=30 in a painted room) and its
bottom above `counterY`.

A room may ship without a `keeper` key: the bakkal panorama paints its own Hüsnü, and the
renderer leaves him alone until the room is redesigned. A shop with no room art keeps its
drawn interior, but a keeper with an atlas is still drawn from it there (Marcos in the
bodega) instead of from the little block figure.

Rooms are static images today; animated room loops are not supported yet.

---

## 4. Food icons

One sheet, **6 columns × 4 rows**, transparent background, no captions, delivered as
`assets/source/shops/shop_items_sheet.png`. `import_props.py` cuts every cell by its alpha
bbox, scales it into the catalog's **18×18** tile (1px inset, bottom-aligned) and appends the
24 tiles after the six drops, so the whole catalog is one atlas with 30 ids.

The sheet's row order is **not** the design table's order, so the ids are mapped by what each
icon shows:

| Row | Icons, left to right |
|---|---|
| 1 | Tortillas, Taco, Quesadilla, Elote, Burrito, Pastor Plate |
| 2 | Bagel, Beef Patty, Knish, Plantain Chips, Chopped Cheese, Bronx Hero |
| 3 | Simit, Çay, Börek, Lokum, Dondurma, Karışık Pide |
| 4 | Kestane, Mısır, Turşu Suyu, Midye Dolma, Nar Suyu, Balık Ekmek |

Pending art: the Beef Patty disc (folded golden pastry), and the new Lupe/vendor sheets.

---

## 5. Where this lives

- `src/shared/data/items.ts` — the catalog: six drops with weights, 24 shop meals at weight 0.
- `src/shared/data/shops.ts` — stock, venue, keeper and line for all nine shops.
- `src/client/render/shops.ts` — painted-room registry (`tacos`, `bakkal`).
- `tools/art/import_props.py` — `items` job: drops + shop icons → `public/assets/props/items.png`.
- `tools/art/import_shop.py` — rooms and keeper atlases → `public/assets/shops/`.
- `tests/shopStock.test.ts` — drop table, six-row menus, no drop overlap, the FULL rules, and
  a real purchase at Lupe's counter.
