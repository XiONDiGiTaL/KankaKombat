// Draws a View (decoded, interpolated snapshot) into the 384x216 game canvas.

import { SCREEN_H, SCREEN_W, STREET_TOP, MAX_LIVES } from '../../shared/data/constants';
import { CHAPTERS } from '../../shared/data/stages';
import { ENEMIES } from '../../shared/data/enemies';
import { FIGHTERS } from '../../shared/data/fighters';
import { ATTACKS } from '../../shared/data/attacks';
import { SHOPS } from '../../shared/data/shops';
import { formatMoney } from '../../shared/data/currency';
import { phaseOf } from '../../shared/sim/combat';
import { F_INV, View, ViewEnt, ViewPlayer } from '../../shared/sim/snapshot';
import { BgLayers, buildBackground } from './backgrounds';
import { artCanvas } from './art';
import { drawText, textWidth } from './font';
import { Fx } from './fx';
import { frameFor, getSheet } from './sprites';

export const SLOT_COLORS = ['#f04a4a', '#4a9af0', '#4ad06a', '#f0c83a'];

export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  readonly canvas: HTMLCanvasElement;
  fx = new Fx();
  private bg: BgLayers | null = null;
  private bgKey = '';
  private frame = 0;
  localPid = '';

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
        const art = artCanvas(h.kind === 'golfcart' ? 'golfcart' : h.kind, h.dir === -1);
        const z = (h.z0 + h.z1) / 2;
        list.push({ z: z + 0.5, draw: () => { c.drawImage(art, sx(h.x) - Math.round(art.width / 2), sy(z, 0) - art.height + 4); } });
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
    const headY = y - (e.flags & 4 ? 74 : 54);
    // telegraph: flashing warning over specials
    if (e.st === 'attack' && e.atk) {
      const a = ATTACKS[e.atk];
      if (a.telegraph && phaseOf(a, e.t) === 'tele' && this.frame % 8 < 5) drawText(c, '!', x, headY - 4, '#f03a3a', { align: 'center', outline: true, scale: 2 });
    }
    if (e.st === 'dizzy') for (let i = 0; i < 3; i++) { const a = this.frame / 10 + (i * Math.PI * 2) / 3; c.drawImage(artCanvas('fx_star'), Math.round(x + Math.cos(a) * 9) - 2, Math.round(headY + 6 + Math.sin(a) * 3) - 2); }
    if (e.st === 'tired' && this.frame % 20 < 10) drawText(c, 'TIRED!', x, headY - 2, '#8ac8ff', { align: 'center', outline: true });
    if (e.player) {
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
      const name = ENEMIES[boss.def]?.name.toUpperCase() ?? 'BOSS';
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
    // GO arrow
    const enemiesLeft = v.ents.some((e) => !e.player && e.hp > 0);
    if (v.phase === 'play' && v.lockX === null && !enemiesLeft && v.camX < v.camMax - 4 && this.frame % 40 < 26) {
      drawText(c, 'GO', SCREEN_W - 34, 92, '#f0c818', { outline: true, scale: 2 });
      c.drawImage(artCanvas('arrow'), SCREEN_W - 12, 90);
    }
    if (v.phase === 'play' && v.lockX === null && !enemiesLeft && v.camX >= v.camMax - 4 && this.frame % 40 < 26) {
      drawText(c, 'EXIT', SCREEN_W - 44, 92, '#f0c818', { outline: true, scale: 2 });
      c.drawImage(artCanvas('arrow'), SCREEN_W - 12, 90);
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
      const [cw] = sheet.atlas.cell; const fi = sheet.atlas.anims.idle.frames[0].i;
      c.drawImage(sheet.img, (fi % sheet.atlas.cols) * cw + 22, Math.floor(fi / sheet.atlas.cols) * sheet.atlas.cell[1] + 10, 20, 20, x + 3, 5, 20, 20);
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
      c.save(); c.translate(bx + i * 9, 19); c.scale(0.6, 0.6); c.drawImage(a, 0, 0); c.restore();
      if (i === p.sel && local) { c.fillStyle = '#f6e8b8'; c.fillRect(bx + i * 9, 27, 8, 1); }
    });
    if (p.powerT > 0) drawText(c, 'POW', x + 3, 26, '#f05a2a', { shadow: '#1a1220' });
    else if (p.speedT > 0) drawText(c, 'SPD', x + 3, 26, '#4ac0f0', { shadow: '#1a1220' });
    if (e && (e.st === 'out')) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, 2, w, 27); drawText(c, 'OUT', x + w / 2, 12, '#aaaaaa', { align: 'center' }); }
  }

  // ------------------------------------------------------------------ overlays
  private drawOverlay(v: View): void {
    const c = this.ctx;
    const ch = CHAPTERS[v.chapter], sec = ch.sections[v.section];
    const banner = (lines: [string, string, number?][], alpha = 0.75) => {
      const h = lines.length * 14 + 12;
      const y = Math.round(SCREEN_H / 2 - h / 2);
      c.fillStyle = `rgba(26,18,32,${alpha})`; c.fillRect(0, y, SCREEN_W, h);
      c.fillStyle = '#f0c818'; c.fillRect(0, y, SCREEN_W, 1); c.fillRect(0, y + h - 1, SCREEN_W, 1);
      lines.forEach(([t, col, sc], i) => drawText(c, t, SCREEN_W / 2, y + 7 + i * 14, col, { align: 'center', outline: true, scale: sc ?? 1 }));
    };
    switch (v.phase) {
      case 'intro':
        if (v.phaseT < 110) banner(v.section === 0 ? [[ch.title.toUpperCase(), '#f0c818'], [`${ch.city.toUpperCase()}, ${ch.country.toUpperCase()}`, '#ffffff'], [sec.name.toUpperCase(), '#8ac8ff']] : [[sec.name.toUpperCase(), '#f0c818', 2]]);
        if (v.section === 0 && v.phaseT < 110) {
          const words = ch.intro.split(' '); const lines: string[] = []; let cur = '';
          for (const w of words) { if ((cur + ' ' + w).length > 56) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
          lines.push(cur.trim());
          lines.forEach((l, i) => drawText(c, l, SCREEN_W / 2, 150 + i * 9, '#f6e8b8', { align: 'center', outline: true }));
        }
        break;
      case 'bossintro': {
        const boss = v.ents.find((e) => e.id === v.bossId);
        const d = boss ? ENEMIES[boss.def] : undefined;
        if (d?.boss && v.phaseT > 20) banner([['WARNING!', this.frame % 16 < 8 ? '#f03a3a' : '#f0c818', 2], [d.name.toUpperCase(), '#ffffff'], [d.boss.title.toUpperCase(), '#8ac8ff'], [`"${d.boss.intro}"`, '#f6e8b8']]);
        break;
      }
      case 'clear': banner([['SECTION CLEAR!', '#f0c818', 2]], 0.6); break;
      case 'bossdown': {
        const boss = v.ents.find((e) => e.id === v.bossId);
        const d = boss ? ENEMIES[boss.def] : undefined;
        if (v.phaseT > 40) banner([['K.O.!', '#f0c818', 3], [d?.boss ? `"${d.boss.defeat}"` : '', '#f6e8b8']], 0.6);
        break;
      }
      case 'chapterclear': {
        const lines: [string, string, number?][] = [[`${ch.city.toUpperCase()} CLEARED!`, '#f0c818', 2]];
        for (const p of v.players) lines.push([`P${p.slot + 1} ${p.name.toUpperCase()}  LV${p.lvl}  ${formatMoney(p.money, v.cur)}  ×${p.lives}`, SLOT_COLORS[p.slot]]);
        if (v.chapter === 1) lines.push([`WALLETS WILL CONVERT TO DOLLARS AT ₺10 = $1`, '#8ac8ff']);
        lines.push(['ALL HEALTH RESTORED', '#4ad06a']);
        if (v.phaseT > 90 && this.frame % 40 < 28) lines.push(['PRESS START (ENTER) TO CONTINUE', '#ffffff']);
        banner(lines, 0.85);
        break;
      }
      case 'gameover': {
        const secs = Math.ceil(v.continueT / 60);
        banner([['GAME OVER', '#f03a3a', 3], [`CONTINUE? ${secs}`, '#f0c818', 2], ['PRESS START (ENTER) - MONEY IS HALVED', '#ffffff']], 0.85);
        break;
      }
      case 'final': banner([['GAME OVER', '#f03a3a', 3], ['THE NUTELLA IS LOST... FOR NOW.', '#f6e8b8']], 0.9); break;
      case 'victory': banner([['VICTORY!', '#f0c818', 3], ['THE LAST JAR OF NUTELLA IS SAFE.', '#ffffff'], ['KANKA KOMBAT: NUTELLA NIGHTS', '#8ac8ff'], ['THANKS FOR PLAYING!', '#f6e8b8']], 0.9); break;
      default: break;
    }
  }
}
