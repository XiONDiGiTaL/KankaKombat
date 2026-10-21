// Draws a View (decoded, interpolated snapshot) into the 384x216 game canvas.

import { SCREEN_H, SCREEN_W, STREET_TOP, MAX_LIVES, BAG_SLOTS } from '../../shared/data/constants';
import { CHAPTERS } from '../../shared/data/stages';
import { ENEMIES } from '../../shared/data/enemies';
import { FIGHTERS } from '../../shared/data/fighters';
import { ATTACKS } from '../../shared/data/attacks';
import { SHOPS } from '../../shared/data/shops';
import { ITEMS } from '../../shared/data/items';
import { formatMoney } from '../../shared/data/currency';
import { phaseOf } from '../../shared/sim/combat';
import { F_INV, View, ViewEnt, ViewPlayer } from '../../shared/sim/snapshot';
import { BgLayers, buildBackground } from './backgrounds';
import { artCanvas, drawItem, propFrame } from './art';
import { drawText, textWidth } from './font';
import { Fx } from './fx';
import { frameFor, getSheet } from './sprites';
import { t } from '../i18n';

export const SLOT_COLORS = ['#f04a4a', '#4a9af0', '#4ad06a', '#f0c83a'];

export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  readonly canvas: HTMLCanvasElement;
  fx = new Fx();
  private bg: BgLayers | null = null;
  private bgKey = '';
  private frame = 0;
  localPid = '';
  shopSel = 0;
  shopMsg = '';
  private tags = true;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = SCREEN_W; this.canvas.height = SCREEN_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  private ensureBg(v: View): void {
    const key = `${v.chapter}.${v.section}`;
    if (key === this.bgKey) return;
    const sec = CHAPTERS[v.chapter].sections[v.section];
    this.bg = buildBackground(sec.theme, sec, 1000 + v.chapter * 10 + v.section);
    this.bgKey = key;
  }

  render(v: View, hud = true): void {
    const c = this.ctx;
    this.frame++;
    this.tags = hud;
    if (hud && this.localEnt(v)?.st === 'shop') { this.drawShop(v); return; }
    this.ensureBg(v);
    const sh = this.fx.shake > 0 ? Math.round((this.frame % 2 ? 1 : -1) * Math.min(3, this.fx.shake)) : 0;
    const cam = Math.round(v.camX);
    c.save();
    c.translate(0, sh);
    this.drawBackground(cam);
    this.drawWorld(v, cam);
    this.fx.draw(c, cam);
    c.restore();
    if (!hud) { c.fillStyle = 'rgba(14,10,20,0.25)'; c.fillRect(0, 0, SCREEN_W, SCREEN_H); return; }
    this.drawHud(v);
    this.drawOverlay(v);
  }

  private drawBackground(cam: number): void {
    const c = this.ctx, b = this.bg!;
    c.drawImage(b.sky, 0, 0);
    c.drawImage(b.far, -Math.round(cam * b.farF), 0);
    c.drawImage(b.mid, -Math.round(cam * b.midF), 0);
    c.drawImage(b.near, -cam, 0);
    c.drawImage(b.floor, -cam, STREET_TOP);
  }

  private drawWorld(v: View, cam: number): void {
    const c = this.ctx;
    type D = { z: number; draw: () => void };
    const list: D[] = [];
    const sy = (z: number, y: number) => Math.round(STREET_TOP + z - y);
    const sx = (x: number) => Math.round(x - cam);

    // hazard lanes: warning stripes before the vehicle arrives
    for (const h of v.hazards) {
      if (h.state === 1 && this.frame % 16 < 10) {
        const y0 = sy(h.z0, 0), y1 = sy(h.z1, 0);
        c.globalAlpha = 0.35; c.fillStyle = '#f0c818'; c.fillRect(0, y0, SCREEN_W, y1 - y0 + 4); c.globalAlpha = 1;
        const label = { tram: 'TRAM!', bike: 'BIKE!', taxi: 'TAXI!', golfcart: 'GOLF CART!' }[h.kind] ?? 'LOOK OUT!';
        drawText(c, '! ' + label, h.dir === 1 ? 8 : SCREEN_W - 8, y0 - 2, '#f0c818', { align: h.dir === 1 ? 'left' : 'right', outline: true });
      }
      if (h.state === 2) {
        const z = (h.z0 + h.z1) / 2;
        // the cart's four frames turn its wheels, so they are picked by distance travelled
        const cart = h.kind === 'golfcart' ? propFrame('golfcart', Math.floor(Math.abs(h.x) / 6), h.dir === -1) : null;
        if (cart) {
          list.push({ z: z + 0.5, draw: () => c.drawImage(cart.img, cart.sx, cart.sy, cart.w, cart.h,
            sx(h.x) - Math.round(cart.w / 2), sy(z, 0) - cart.h + 2, cart.w, cart.h) });
        } else {
          const art = artCanvas(h.kind, h.dir === -1);
          list.push({ z: z + 0.5, draw: () => { c.drawImage(art, sx(h.x) - Math.round(art.width / 2), sy(z, 0) - art.height + 4); } });
        }
      }
    }
    for (const p of v.props) {
      list.push({ z: p.z, draw: () => {
        if (p.broken) { if (p.brokeT < 600) c.drawImage(artCanvas('debris'), sx(p.x) - 6, sy(p.z, 0) - 3); return; }
        const art = artCanvas(p.kind);
        this.shadow(sx(p.x), sy(p.z, 0), art.width / 2 + 1);
        c.drawImage(art, sx(p.x) - Math.round(art.width / 2), sy(p.z, 0) - art.height + 2);
      } });
    }
    for (const pk of v.pickups) {
      list.push({ z: pk.z, draw: () => {
        const name = pk.kind === 'coin' ? (v.cur === 'TRY' ? 'coinTRY' : 'coinUSD') : pk.item!;
        const art = artCanvas(name);
        this.shadow(sx(pk.x), sy(pk.z, 0), 4);
        const bob = pk.kind === 'food' && pk.y === 0 ? Math.round(Math.sin(this.frame / 12) * 1) : 0;
        c.drawImage(art, sx(pk.x) - Math.round(art.width / 2), sy(pk.z, pk.y) - art.height + 1 + bob);
        if (pk.kind === 'coin' && this.frame % 40 < 4) { c.fillStyle = '#ffffff'; c.fillRect(sx(pk.x) + 1, sy(pk.z, pk.y) - 4, 1, 1); }
      } });
    }
    for (const pj of v.projs) list.push({ z: pj.z, draw: () => { this.shadow(sx(pj.x), sy(pj.z, 0), 2); const a = artCanvas(pj.kind); c.drawImage(a, sx(pj.x) - 2, sy(pj.z, pj.y) - 3); } });
    for (const e of v.ents) list.push({ z: e.z + (e.st === 'held' ? 0.2 : 0), draw: () => this.drawEnt(v, e, sx(e.x), sy(e.z, e.y), sy(e.z, 0)) });
    list.sort((a, b) => a.z - b.z);
    for (const d of list) d.draw();

    // prompts for the local player (shop door / food)
    const me = this.localEnt(v);
    if (me && v.phase === 'play' && v.lockX === null && me.st !== 'shop') {
      const sec = CHAPTERS[v.chapter].sections[v.section];
      for (const s of sec.shops) if (Math.abs(me.x - s.x) < 24 && me.z < 16) this.prompt(sx(s.x), STREET_TOP - 44, 'GRAB: ENTER ' + SHOPS[s.shop].name.toUpperCase());
    }
    if (me && (me.st === 'idle' || me.st === 'walk')) {
      const food = v.pickups.find((p) => p.kind === 'food' && Math.abs(p.x - me.x) < 18 && Math.abs(p.z - me.z) < 10);
      if (food) this.prompt(sx(food.x), sy(food.z, 0) - 16, 'GRAB: PICK UP');
    }
    // speech bubbles
    for (const e of v.ents) if (this.fx.bubbles.some((b) => b.id === e.id)) this.fx.drawBubble(c, e.id, sx(e.x), sy(e.z, e.y) - (e.flags & 4 ? 70 : 52));
  }

  private prompt(x: number, y: number, text: string): void {
    if (this.frame % 60 > 50) return;
    const w = textWidth(text) + 6;
    const xx = Math.max(2, Math.min(SCREEN_W - w - 2, Math.round(x - w / 2)));
    this.ctx.fillStyle = 'rgba(26,18,32,0.85)'; this.ctx.fillRect(xx, y - 2, w, 11);
    drawText(this.ctx, text, xx + 3, y, '#f6e8b8', { shadow: null });
  }

  localEnt(v: View): ViewEnt | undefined {
    const p = v.players.find((x) => x.pid === this.localPid);
    return p ? v.ents.find((e) => e.id === p.id) : undefined;
  }

  private shadow(x: number, y: number, r: number): void {
    const c = this.ctx;
    c.fillStyle = 'rgba(20,10,30,0.35)';
    c.fillRect(x - r, y - 1, r * 2, 2);
    c.fillRect(x - r + 2, y - 2, r * 2 - 4, 4);
  }

  private drawEnt(v: View, e: ViewEnt, x: number, y: number, ground: number): void {
    const c = this.ctx;
    const sheetId = e.def;
    const sheet = getSheet(sheetId);
    if (e.st !== 'held') this.shadow(x, ground, e.flags & 4 ? 13 : 9);
    if (!sheet) return;
    if (e.st === 'shop') return; // inside the shop
    if (e.st === 'dead' && !e.player && e.t > 40 && this.frame % 4 < 2) return; // KO'd enemies blink out
    if (e.flags & F_INV && e.player && this.frame % 6 < 2) return;
    const fi = frameFor(sheet, e);
    const [cw, ch] = sheet.atlas.cell, [ax, ay] = sheet.atlas.anchor;
    const col = fi % sheet.atlas.cols, row = Math.floor(fi / sheet.atlas.cols);
    const flip = e.face === -1;
    const src = this.fx.flash.has(e.id) ? sheet.white : flip ? sheet.flipped : sheet.img;
    const dx = x - (flip ? cw - 1 - ax : ax), dy = y - ay;
    if (this.fx.flash.has(e.id) && flip) {
      c.save(); c.translate(dx + cw, dy); c.scale(-1, 1); c.drawImage(sheet.white, col * cw, row * ch, cw, ch, 0, 0, cw, ch); c.restore();
    } else c.drawImage(src, col * cw, row * ch, cw, ch, dx, dy, cw, ch);
    const headY = y - (e.flags & 4 ? 86 : 66);
    // telegraph: flashing warning over specials
    if (e.st === 'attack' && e.atk) {
      const a = ATTACKS[e.atk];
      if (a.telegraph && phaseOf(a, e.t) === 'tele' && this.frame % 8 < 5) drawText(c, '!', x, headY - 4, '#f03a3a', { align: 'center', outline: true, scale: 2 });
    }
    if (e.st === 'dizzy') for (let i = 0; i < 3; i++) { const a = this.frame / 10 + (i * Math.PI * 2) / 3; c.drawImage(artCanvas('fx_star'), Math.round(x + Math.cos(a) * 9) - 2, Math.round(headY + 6 + Math.sin(a) * 3) - 2); }
    if (e.st === 'tired' && this.frame % 20 < 10) drawText(c, 'TIRED!', x, headY - 2, '#8ac8ff', { align: 'center', outline: true });
    if (e.player && this.tags) {
      const p = v.players.find((pp) => pp.id === e.id);
      if (p) {
        const colr = SLOT_COLORS[p.slot];
        const local = p.pid === this.localPid;
        drawText(c, `P${p.slot + 1}`, x, headY - 3, colr, { align: 'center', outline: true });
        if (local) { c.fillStyle = colr; c.fillRect(x - 2, headY + 5, 5, 1); c.fillRect(x - 1, headY + 6, 3, 1); c.fillRect(x, headY + 7, 1, 1); }
        if (!p.conn) drawText(c, 'OFFLINE', x, headY - 12, '#aaaaaa', { align: 'center', outline: true });
      }
    } else if (!(e.flags & 4) && e.hp < e.maxHp && e.hp > 0) {
      // small enemy health pip bar
      const w = 18, f = Math.round((w * e.hp) / e.maxHp);
      c.fillStyle = '#1a1220'; c.fillRect(x - w / 2 - 1, headY + 2, w + 2, 4);
      c.fillStyle = '#5a1a1a'; c.fillRect(x - w / 2, headY + 3, w, 2);
      c.fillStyle = '#f0c83a'; c.fillRect(x - w / 2, headY + 3, f, 2);
    }
  }

  // ------------------------------------------------------------------ HUD
  private drawHud(v: View): void {
    const c = this.ctx;
    const n = Math.max(1, v.players.length);
    const pw = n <= 2 ? 120 : 94;
    v.players.forEach((p, i) => this.playerPanel(p, v, 3 + i * (pw + 2), pw));
    // boss bar
    const boss = v.ents.find((e) => e.id === v.bossId);
    if (boss && (v.phase === 'boss' || v.phase === 'bossintro')) {
      const name = t(ENEMIES[boss.def]?.name ?? 'BOSS').toUpperCase();
      c.fillStyle = 'rgba(26,18,32,0.85)'; c.fillRect(40, SCREEN_H - 16, SCREEN_W - 80, 14);
      drawText(c, name, 44, SCREEN_H - 14, '#f6e8b8', { shadow: null });
      const bx = 44 + textWidth(name) + 6, bw = SCREEN_W - 84 - (bx - 44) - 4;
      c.fillStyle = '#1a1220'; c.fillRect(bx - 1, SCREEN_H - 14, bw + 2, 9);
      c.fillStyle = '#4a1414'; c.fillRect(bx, SCREEN_H - 13, bw, 7);
      const f = Math.max(0, Math.round((bw * boss.hp) / boss.maxHp));
      c.fillStyle = boss.phase > 0 ? '#f05a2a' : '#e0303c'; c.fillRect(bx, SCREEN_H - 13, f, 7);
      c.fillStyle = '#ff9a9a'; c.fillRect(bx, SCREEN_H - 13, f, 1);
      c.fillStyle = '#1a1220'; c.fillRect(bx + Math.round(bw / 2), SCREEN_H - 13, 1, 7);
    }
    // GO sign: lit / dim blink at the right edge once the street is clear
    const enemiesLeft = v.ents.some((e) => !e.player && e.hp > 0);
    if (v.phase === 'play' && v.lockX === null && !enemiesLeft) {
      const lit = this.frame % 44 < 30;
      const bx = SCREEN_W - 38, by = 84;
      c.fillStyle = '#1a1220'; c.fillRect(bx - 2, by - 2, 36, 32);
      c.fillStyle = lit ? '#f0c818' : '#6a5a20'; c.fillRect(bx - 1, by - 1, 34, 30);
      c.fillStyle = lit ? '#7a2a1a' : '#2a1a12'; c.fillRect(bx, by, 32, 28);
      drawText(c, 'GO', bx + 6, by + 4, lit ? '#fff6d0' : '#8a7a48', { scale: 2, outline: true });
      c.fillStyle = lit ? '#f0c818' : '#6a5a20';
      for (let k = 0; k < 6; k++) c.fillRect(bx + 8 + k, by + 23 - k, 12 - k * 2, 1);
    }
  }

  private playerPanel(p: ViewPlayer, v: View, x: number, w: number): void {
    const c = this.ctx;
    const e = v.ents.find((en) => en.id === p.id);
    const col = SLOT_COLORS[p.slot];
    const local = p.pid === this.localPid;
    c.fillStyle = 'rgba(26,18,32,0.78)'; c.fillRect(x, 2, w, 27);
    c.fillStyle = col; c.fillRect(x, 2, 2, 27);
    if (local) { c.fillStyle = col; c.fillRect(x, 2, w, 1); }
    // portrait: crop the head from the idle frame
    const sheet = getSheet(p.fighter);
    if (sheet) {
      const [cw, ch] = sheet.atlas.cell; const fi = sheet.atlas.anims.idle.frames[0].i;
      // atlases can declare where the head sits, and how tall it is: the imported sheets
      // are 83x73 with a 24px head, the procedural ones are 64x76 with a 20x22
      const [hx, hy, hw, hh] = sheet.atlas.head ?? [22, 9, 20, 22];
      c.drawImage(sheet.img, (fi % sheet.atlas.cols) * cw + hx, Math.floor(fi / sheet.atlas.cols) * ch + hy, hw, hh,
        x + 2, 2 + Math.floor((27 - hh) / 2), hw, hh);
    }
    const name = `P${p.slot + 1} ${FIGHTERS[p.fighter as 'bt' | 'sc']?.name ?? ''}`;
    drawText(c, name, x + 26, 4, col, { shadow: '#1a1220' });
    drawText(c, `LV${p.lvl}`, x + w - 4, 4, '#f6e8b8', { align: 'right', shadow: '#1a1220' });
    // hp bar
    const hp = e ? e.hp : 0, max = e ? e.maxHp : 1;
    const bw = w - 30;
    c.fillStyle = '#1a1220'; c.fillRect(x + 25, 12, bw + 2, 6);
    c.fillStyle = '#4a1414'; c.fillRect(x + 26, 13, bw, 4);
    const f = Math.max(0, Math.round((bw * hp) / max));
    c.fillStyle = hp / max < 0.3 ? (this.frame % 20 < 10 ? '#f03a3a' : '#a02020') : '#4ad06a'; c.fillRect(x + 26, 13, f, 4);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(x + 26, 13, f, 1);
    // lives, money
    const heart = artCanvas('heart');
    c.drawImage(heart, x + 25, 19);
    drawText(c, `×${Math.min(p.lives, MAX_LIVES)}`, x + 34, 20, '#ffffff', { shadow: '#1a1220' });
    drawText(c, formatMoney(p.money, v.cur), x + 52, 20, '#f6d838', { shadow: '#1a1220' });
    // bag
    const bx = x + w - 4 - p.bag.length * 9;
    p.bag.forEach((it, i) => {
      const a = artCanvas(it);
      c.save(); c.translate(bx + i * 9, 18); c.scale(0.5, 0.5); c.drawImage(a, 0, 0); c.restore();
      if (i === p.sel && local) { c.fillStyle = '#f6e8b8'; c.fillRect(bx + i * 9, 27, 8, 1); }
    });
    if (p.powerT > 0) drawText(c, 'POW', x + 3, 26, '#f05a2a', { shadow: '#1a1220' });
    else if (p.speedT > 0) drawText(c, 'SPD', x + 3, 26, '#4ac0f0', { shadow: '#1a1220' });
    if (e && (e.st === 'out')) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, 2, w, 27); drawText(c, 'OUT', x + w / 2, 12, '#aaaaaa', { align: 'center' }); }
  }

  // ------------------------------------------------------------------ shop interior
  /** River City Ransom shop: themed interior, keeper behind the counter, cream menu
   *  panel with icons, prices and a triangular cursor. Draws on the game canvas so the
   *  type stays the project's own bitmap fonts at 1:1 pixel density. */
  private drawShop(v: View): void {
    const c = this.ctx;
    const me = this.localEnt(v);
    if (!me) return;
    const sec = CHAPTERS[v.chapter].sections[v.section];
    const spot = sec.shops.find((s) => Math.abs(me.x - s.x) < 24) ?? sec.shops[0];
    const shop = SHOPS[spot?.shop ?? 'bodega'];
    const p = v.players.find((x) => x.id === me.id) ?? v.players[0];
    const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const P = (x: number, y: number, col: string) => R(x, y, 1, 1, col);
    type Deco = { wall: string; wall2: string; shelf: string; floor: string; floor2: string; counter: string; counterHi: string; apron: string; shirt: string; hair: string };
    const D: Record<string, Deco> = {
      ny: { wall: '#3e2a2e', wall2: '#4a3438', shelf: '#6a4a32', floor: '#8a7a66', floor2: '#746454', counter: '#7a2a22', counterHi: '#a84a36', apron: '#e8e0d0', shirt: '#3a6a8a', hair: '#2a1a14' },
      izmir: { wall: '#d8c0a0', wall2: '#e4d0b4', shelf: '#8a5a32', floor: '#b89a72', floor2: '#a48860', counter: '#6a4228', counterHi: '#9a6a42', apron: '#f6f2e8', shirt: '#2a6a5a', hair: '#3a2418' },
      istanbul: { wall: '#c8a878', wall2: '#d8b888', shelf: '#5a3a22', floor: '#9a7a58', floor2: '#86684a', counter: '#7a3a22', counterHi: '#a85a32', apron: '#e8dcc0', shirt: '#8a3a2a', hair: '#1e1a18' },
      tampa: { wall: '#e0c89a', wall2: '#ecd8ac', shelf: '#3a7a8a', floor: '#c8a870', floor2: '#b09060', counter: '#8a5a32', counterHi: '#b8824a', apron: '#f6f2e8', shirt: '#c85a3a', hair: '#2a1a14' },
    };
    const d = D[shop.style] ?? D.ny;
    const INK = '#1a1220';

    // ---- interior back wall
    R(0, 0, SCREEN_W, 96, d.wall);
    R(0, 0, SCREEN_W, 26, d.wall2);
    R(0, 26, SCREEN_W, 2, INK);
    for (let y = 0; y < 24; y += 8) R(0, y + 1, SCREEN_W, 1, 'rgba(255,255,255,0.06)');
    for (let x = 8; x < SCREEN_W; x += 26) R(x, 0, 1, 26, 'rgba(0,0,0,0.12)');
    // wall sign / neon
    R(300, 32, 70, 20, INK); R(302, 34, 66, 16, shop.style === 'ny' ? '#2a1220' : '#f6e8b8');
    drawText(c, shop.style === 'ny' ? 'OPEN' : shop.style === 'tampa' ? 'ABIERTO' : 'AFİYET', 335, 37, shop.style === 'ny' ? (this.frame % 60 < 40 ? '#f06a8a' : '#7a2a3a') : '#7a2a1a', { align: 'center', font: 'title', shadow: null });
    // shelves with stock
    R(12, 34, 110, 3, INK); R(12, 37, 110, 3, d.shelf);
    for (let row = 0; row < 2; row++) {
      const sy = 46 + row * 20;
      R(12, sy, 110, 3, INK); R(12, sy + 3, 110, 2, d.shelf);
      for (let i = 0; i < 17; i++) {
        const col = ['#d0202c', '#2a6ad0', '#f0c818', '#5aa83a', '#e8e0d0', '#c8602a'][(i + row * 3) % 6];
        const hh = 7 + ((i * 5 + row) % 4);
        R(16 + i * 6, sy - hh, 5, hh, col);
        P(16 + i * 6, sy - hh, '#ffffff80');
      }
    }
    // themed extras
    if (shop.style === 'izmir' || shop.style === 'istanbul') {
      // tea glasses on the shelf + Turkish flag
      R(132, 34, 1, 22, '#6a4a2a'); R(133, 35, 12, 8, '#d0202c'); R(136, 37, 4, 3, '#f6f6f2');
      for (let i = 0; i < 5; i++) { R(136 + i * 8, 54, 4, 6, '#e8f6ff'); P(136 + i * 8 + 1, 55, '#b05a20'); }
    } else if (shop.style === 'ny') {
      for (let i = 0; i < 4; i++) { R(132, 36 + i * 7, 30, 3, ['#c8c8c0', '#8a5a3a', '#c8c8c0', '#8a5a3a'][i]); }
    } else {
      for (let i = 0; i < 5; i++) { R(132 + i * 9, 40, 6, 18, ['#e0a020', '#c02a2a', '#3a9a4a', '#d8d0b0', '#8a3a9a'][i]); }
    }
    // floor + counter
    R(0, 96, SCREEN_W, 30, d.floor);
    for (let y = 96; y < 126; y += 6) R(0, y, SCREEN_W, 1, d.floor2);
    for (let x = 0; x < SCREEN_W; x += 16) R(x, 96, 1, 30, d.floor2);
    R(0, 95, SCREEN_W, 2, INK);
    R(156, 98, 210, 4, INK); R(156, 102, 210, 24, d.counter); R(158, 102, 206, 3, d.counterHi);
    R(156, 122, 210, 4, INK);
    for (let x = 166; x < 360; x += 24) R(x, 108, 1, 13, '#00000030');

    // ---- keeper behind the counter
    const kx = 250;
    R(kx - 11, 82, 22, 16, d.shirt);
    R(kx - 9, 98, 18, 8, d.apron);
    R(kx - 11, 82, 22, 1, INK);
    R(kx - 8, 68, 16, 15, '#e0a878'); R(kx - 9, 67, 18, 3, d.hair);
    R(kx - 8, 70, 3, 3, d.hair); R(kx + 5, 70, 3, 3, d.hair);
    P(kx - 3, 75, INK); P(kx + 3, 75, INK);
    R(kx - 2, 79, 5, 1, '#7a3a2a');
    R(kx - 13, 86, 3, 12, d.shirt); R(kx + 10, 86, 3, 10, d.shirt);
    if (shop.style === 'izmir' || shop.style === 'istanbul') R(kx - 4, 77, 9, 1, '#2a1a14');

    // ---- hero standing at the counter
    const sheet = getSheet(p.fighter);
    if (sheet) {
      const [cw, ch] = sheet.atlas.cell;
      const fi = sheet.atlas.anims.idle.frames[0].i;
      c.drawImage(sheet.img, (fi % sheet.atlas.cols) * cw, Math.floor(fi / sheet.atlas.cols) * ch, cw, ch, 96, 64, cw, ch);
    }
    // ground contact shadow
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(100, 123, 24, 3);

    // ---- speech bubble with the keeper's line
    const line = `${t(shop.keeper).toUpperCase()}: ${t(shop.keeperLine).toUpperCase()}`;
    const maxChars = 42;
    const words = line.split(' ');
    const lines: string[] = []; let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    if (cur.trim()) lines.push(cur.trim());
    const bw = Math.min(280, Math.max(...lines.map((l) => textWidth(l))) + 12);
    const bx = Math.round(250 - bw / 2), by = 6, bh = lines.length * 8 + 8;
    R(bx - 1, by - 1, bw + 2, bh + 2, INK); R(bx, by, bw, bh, '#f6e8b8');
    R(bx + bw / 2 - 3, by + bh, 7, 4, INK); R(bx + bw / 2 - 2, by + bh, 5, 3, '#f6e8b8');
    lines.forEach((l, i) => drawText(c, l, bx + 6, by + 4 + i * 8, '#2a1a14', { shadow: null }));

    // ---- cream menu panel
    const top = 126;
    R(0, top, SCREEN_W, SCREEN_H - top, INK);
    R(2, top + 2, SCREEN_W - 4, SCREEN_H - top - 4, '#f6e8b8');
    R(2, top + 2, SCREEN_W - 4, 1, '#fffbe8');
    R(2, SCREEN_H - 4, SCREEN_W - 4, 2, '#c8a878');
    drawText(c, t(shop.name).toUpperCase(), 7, top + 6, '#7a2a1a', { font: 'title', shadow: null });
    drawText(c, formatMoney(p.money, v.cur), SCREEN_W - 60, top + 6, '#2a5a2a', { align: 'right', shadow: null });
    drawText(c, `BAG ${p.bag.length}/${BAG_SLOTS}`, SCREEN_W - 7, top + 6, '#7a5a2a', { align: 'right', shadow: null });
    R(6, top + 17, SCREEN_W - 12, 1, '#c8a878');

    shop.stock.forEach((id, i) => {
      const y = top + 18 + i * 10;
      const sel = i === this.shopSel;
      const dmg = ITEMS[id];
      if (sel) {
        R(5, y - 1, SCREEN_W - 10, 10, '#8a2a22');
        R(5, y - 1, SCREEN_W - 10, 1, '#c85a3a');
        // triangular cursor
        c.fillStyle = '#f0c818';
        for (let k = 0; k < 4; k++) c.fillRect(8 + k, y + 1 + k, 1, 7 - k * 2);
      }
      drawItem(c, id, 17, y, 10, 10);
      const poor = p.money < dmg.price;
      drawText(c, t(dmg.name).toUpperCase(), 30, y + 1, sel ? '#fff6d0' : poor ? '#a08070' : '#2a1a14', { shadow: null });
      drawText(c, dmg.heal === Infinity ? t('FULL HP') : `+${dmg.heal} HP`, 118, y + 1, sel ? '#f0c8a0' : '#8a6a4a', { shadow: null });
      drawText(c, formatMoney(dmg.price, v.cur), SCREEN_W - 9, y + 1, sel ? '#fff6d0' : poor ? '#a08070' : '#2a1a14', { align: 'right', shadow: null });
    });
    R(6, SCREEN_H - 11, SCREEN_W - 12, 1, '#c8a878');
    const hint = this.shopMsg || t('UP/DOWN CHOOSE   ENTER BUY   ESC LEAVE');
    drawText(c, hint, SCREEN_W / 2, SCREEN_H - 9, this.shopMsg ? '#b02a22' : '#7a5a2a', { align: 'center', shadow: null });
  }

  // ------------------------------------------------------------------ overlays
  private drawOverlay(v: View): void {
    const c = this.ctx;
    const ch = CHAPTERS[v.chapter], sec = ch.sections[v.section];
    const banner = (lines: [string, string, number?][], alpha = 0.75) => {
      const heights = lines.map(([,, sc]) => (sc ?? 1) * 8 + 5);
      const h = heights.reduce((a, b) => a + b, 0) + 10;
      const y = Math.round(SCREEN_H / 2 - h / 2);
      c.fillStyle = `rgba(26,18,32,${alpha})`; c.fillRect(0, y, SCREEN_W, h);
      c.fillStyle = '#f0c818'; c.fillRect(0, y, SCREEN_W, 1); c.fillRect(0, y + h - 1, SCREEN_W, 1);
      let ly = y + 6;
      lines.forEach(([t, col, sc], i) => { drawText(c, t, SCREEN_W / 2, ly, col, { align: 'center', outline: true, scale: sc ?? 1 }); ly += heights[i]; });
    };
    switch (v.phase) {
      case 'intro':
        if (v.phaseT < 110) banner(v.section === 0 ? [[t(ch.title).toUpperCase(), '#f0c818'], [`${t(ch.city).toUpperCase()}, ${t(ch.country).toUpperCase()}`, '#ffffff'], [t(sec.name).toUpperCase(), '#8ac8ff']] : [[t(sec.name).toUpperCase(), '#f0c818', 2]]);
        if (v.section === 0 && v.phaseT < 110) {
          const words = ch.intro.split(' '); const lines: string[] = []; let cur = '';
          for (const w of words) { if ((cur + ' ' + w).length > 56) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
          lines.push(cur.trim());
          lines.forEach((l, i) => drawText(c, t(l), SCREEN_W / 2, 150 + i * 9, '#f6e8b8', { align: 'center', outline: true }));
        }
        break;
      case 'bossintro': {
        const boss = v.ents.find((e) => e.id === v.bossId);
        const d = boss ? ENEMIES[boss.def] : undefined;
        if (d?.boss && v.phaseT > 20) banner([[t('WARNING!'), this.frame % 16 < 8 ? '#f03a3a' : '#f0c818', 2], [t(d.name).toUpperCase(), '#ffffff'], [t(d.boss.title).toUpperCase(), '#8ac8ff'], [`"${t(d.boss.intro)}"`, '#f6e8b8']]);
        break;
      }
      case 'clear': banner([[t('SECTION CLEAR!'), '#f0c818', 2]], 0.6); break;
      case 'bossdown': {
        const boss = v.ents.find((e) => e.id === v.bossId);
        const d = boss ? ENEMIES[boss.def] : undefined;
        if (v.phaseT > 40) banner([[t('K.O.!'), '#f0c818', 3], [d?.boss ? `"${t(d.boss.defeat)}"` : '', '#f6e8b8']], 0.6);
        break;
      }
      case 'chapterclear': {
        const lines: [string, string, number?][] = [[`${t(ch.city).toUpperCase()} CLEARED!`, '#f0c818', 2]];
        for (const p of v.players) lines.push([`P${p.slot + 1} ${p.name.toUpperCase()}  LV${p.lvl}  ${formatMoney(p.money, v.cur)}  ×${p.lives}`, SLOT_COLORS[p.slot]]);
        lines.push([t('ONE WALLET, ALL STREETS — CASH CARRIES OVER'), '#8ac8ff']);
        lines.push([t('ALL HEALTH RESTORED'), '#4ad06a']);
        if (v.phaseT > 90 && this.frame % 40 < 28) lines.push([t('PRESS START (ENTER) TO CONTINUE'), '#ffffff']);
        banner(lines, 0.85);
        break;
      }
      case 'gameover': {
        const secs = Math.max(0, Math.ceil(v.continueT / 60));
        c.fillStyle = 'rgba(14,10,20,0.55)'; c.fillRect(0, 0, SCREEN_W, SCREEN_H);
        banner([[t('GAME OVER'), '#f03a3a', 3], [`${t('CONTINUE?')} ${secs}`, '#f0c818', 2], [t('PRESS START (ENTER) — MONEY IS HALVED'), '#ffffff']], 0.92);
        break;
      }
      case 'final': banner([[t('GAME OVER'), '#f03a3a', 3], [t('THE NUTELLA IS LOST... FOR NOW.'), '#f6e8b8']], 0.9); break;
      case 'victory': banner([[t('VICTORY!'), '#f0c818', 3], [t('THE LAST JAR OF NUTELLA IS SAFE.'), '#ffffff'], [t('KANKA KOMBAT: NUTELLA NIGHTS'), '#8ac8ff'], [t('THANKS FOR PLAYING!'), '#f6e8b8']], 0.9); break;
      default: break;
    }
  }
}
