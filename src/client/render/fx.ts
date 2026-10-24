// Client-side visual effects. These are purely cosmetic: they are spawned from simulation
// events but never feed back into gameplay.

import { STREET_TOP } from '../../shared/data/constants';
import { drawText, textWidth } from './font';

interface Particle { x: number; y: number; z: number; vx: number; vy: number; life: number; max: number; kind: 'spark' | 'dust' | 'chip' | 'star' | 'ring' | 'bit'; color: string; size: number }
interface FloatText { x: number; y: number; z: number; text: string; color: string; life: number; max: number; vy: number; big?: boolean }
interface Bubble { id: number; text: string; life: number }

export class Fx {
  parts: Particle[] = [];
  texts: FloatText[] = [];
  bubbles: Bubble[] = [];
  shake = 0;
  flash = new Map<number, number>();   // entity id -> ticks of white flash
  private seed = 1;

  private rnd(): number { this.seed = (this.seed * 16807) % 2147483647; return (this.seed % 10000) / 10000; }

  hit(x: number, y: number, z: number, heavy: boolean, block = false): void {
    const n = heavy ? 12 : 6;
    for (let i = 0; i < n; i++) {
      const a = this.rnd() * Math.PI * 2, s = (heavy ? 2.2 : 1.4) * (0.4 + this.rnd());
      this.parts.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 10 + this.rnd() * 6, kind: 'spark', color: block ? '#8ac8ff' : this.rnd() < 0.5 ? '#fff6c0' : '#f6d838', size: heavy ? 2 : 1 });
    }
    this.parts.push({ x, y, z, vx: 0, vy: 0, life: 0, max: heavy ? 10 : 7, kind: 'ring', color: block ? '#8ac8ff' : '#ffffff', size: heavy ? 10 : 6 });
    if (heavy) this.shake = Math.max(this.shake, 4);
  }

  dust(x: number, z: number, big = false): void {
    for (let i = 0; i < (big ? 10 : 4); i++) this.parts.push({ x: x + (this.rnd() - 0.5) * 16, y: 1, z, vx: (this.rnd() - 0.5) * 1.6, vy: this.rnd() * 0.8, life: 0, max: 18 + this.rnd() * 10, kind: 'dust', color: '#d8ccb8', size: big ? 3 : 2 });
    if (big) this.shake = Math.max(this.shake, 3);
  }

  debris(x: number, z: number, color: string): void {
    for (let i = 0; i < 12; i++) this.parts.push({ x, y: 8, z, vx: (this.rnd() - 0.5) * 4, vy: 2 + this.rnd() * 2.5, life: 0, max: 40, kind: 'chip', color, size: 2 });
  }

  coins(x: number, z: number, color = '#f6d838'): void {
    for (let i = 0; i < 6; i++) this.parts.push({ x, y: 10, z, vx: (this.rnd() - 0.5) * 2, vy: 1.5 + this.rnd() * 1.5, life: 0, max: 24, kind: 'bit', color, size: 1 });
  }

  sparkle(x: number, y: number, z: number, color: string): void {
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; this.parts.push({ x, y, z, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 + 0.5, life: 0, max: 26, kind: 'star', color, size: 1 }); }
  }

  text(x: number, y: number, z: number, text: string, color: string, big = false): void {
    this.texts.push({ x, y, z, text, color, life: 0, max: big ? 70 : 42, vy: big ? 0.35 : 0.6, big });
    if (this.texts.length > 40) this.texts.shift();
  }

  say(id: number, text: string): void {
    this.bubbles = this.bubbles.filter((b) => b.id !== id);
    this.bubbles.push({ id, text, life: 150 });
  }

  step(): void {
    for (const p of this.parts) {
      p.life++;
      p.x += p.vx; p.y += p.vy;
      if (p.kind === 'chip' || p.kind === 'bit') { p.vy -= 0.2; if (p.y < 0) { p.y = 0; p.vy *= -0.4; p.vx *= 0.7; } }
      else if (p.kind === 'dust') { p.vx *= 0.92; p.vy *= 0.95; }
      else if (p.kind === 'spark') { p.vx *= 0.86; p.vy *= 0.86; }
    }
    this.parts = this.parts.filter((p) => p.life < p.max);
    if (this.parts.length > 400) this.parts.splice(0, this.parts.length - 400);
    for (const t of this.texts) { t.life++; t.y += t.vy * (1 - t.life / t.max); }
    this.texts = this.texts.filter((t) => t.life < t.max);
    for (const b of this.bubbles) b.life--;
    this.bubbles = this.bubbles.filter((b) => b.life > 0);
    for (const [id, n] of this.flash) n <= 1 ? this.flash.delete(id) : this.flash.set(id, n - 1);
    this.shake = Math.max(0, this.shake - 0.35);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const p of this.parts) {
      const sx = Math.round(p.x - camX), sy = Math.round(STREET_TOP + p.z - p.y);
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = p.kind === 'dust' ? 0.7 * k : 1;
      ctx.fillStyle = p.color;
      if (p.kind === 'ring') {
        const r = Math.round(p.size * (0.4 + p.life / p.max));
        ctx.fillRect(sx - r, sy, 1, 1); ctx.fillRect(sx + r, sy, 1, 1); ctx.fillRect(sx, sy - r, 1, 1); ctx.fillRect(sx, sy + r, 1, 1);
        const d = Math.round(r * 0.7); ctx.fillRect(sx - d, sy - d, 1, 1); ctx.fillRect(sx + d, sy - d, 1, 1); ctx.fillRect(sx - d, sy + d, 1, 1); ctx.fillRect(sx + d, sy + d, 1, 1);
      } else if (p.kind === 'star') {
        ctx.fillRect(sx, sy - 1, 1, 3); ctx.fillRect(sx - 1, sy, 3, 1);
      } else ctx.fillRect(sx, sy, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      const sx = t.x - camX, sy = STREET_TOP + t.z - t.y;
      if (t.life > t.max - 10 && t.life % 4 < 2) continue;
      drawText(ctx, t.text, sx, sy, t.color, { align: 'center', outline: true, scale: t.big ? 1 : 1 });
    }
  }

  drawBubble(ctx: CanvasRenderingContext2D, id: number, sx: number, sy: number): void {
    const b = this.bubbles.find((x) => x.id === id);
    if (!b) return;
    const words = b.text.split(' ');
    const lines: string[] = []; let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > 18) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    if (cur.trim()) lines.push(cur.trim());
    const w = Math.max(...lines.map((l) => textWidth(l))) + 8, h = lines.length * 9 + 5;
    const x = Math.round(Math.max(2, Math.min(384 - w - 2, sx - w / 2))), y = Math.round(Math.max(30, sy - h - 6));
    ctx.fillStyle = '#1a1220'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1a1220'; ctx.fillRect(Math.round(sx) - 1, y + h, 3, 2); ctx.fillStyle = '#fffaf0'; ctx.fillRect(Math.round(sx), y + h, 1, 1);
    lines.forEach((l, i) => drawText(ctx, l, x + 4, y + 3 + i * 9, '#1a1220', { shadow: null }));
  }
}
