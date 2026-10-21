// Application controller: screens, connections, the fixed-timestep loop, event -> fx/sfx.

import './style.css';
import { SCREEN_H, SCREEN_W, TICK_HZ } from '../shared/data/constants';
import { BTN } from '../shared/data/input';
import { FIGHTERS, FighterId } from '../shared/data/fighters';
import { ITEMS, ITEM_IDS, ItemId } from '../shared/data/items';
import { SHOPS } from '../shared/data/shops';
import { CHAPTERS } from '../shared/data/stages';
import { formatMoney } from '../shared/data/currency';
import { BRANDING } from '../shared/config/branding';
import { makeRoomCode, normalizeRoomCode } from '../shared/net/protocol';
import { Bot } from '../shared/sim/bot';
import { decode, View } from '../shared/sim/snapshot';
import type { SimEvent } from '../shared/sim/types';
import { Renderer, SLOT_COLORS } from './render/renderer';
import { getSheet, loadSheets } from './render/sprites';
import { artCanvas } from './render/art';
import { drawText } from './render/font';
import { Input, ACTIONS, keyLabel } from './input/input';
import { Audio } from './audio/audio';
import { GameClient } from './net/gameclient';
import { Link, LocalLink, RelayGuestLink, RelayHostLink, WsLink } from './net/links';
import { supabaseChannel, wsRelayChannel, Channel } from './net/channels';
import { loadSettings, saveSettings, sessionToken, randomId } from './settings';
import { viewWorld } from './viewworld';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';
const AUTOPILOT = params.get('autopilot') === '1';

// Online configuration. A dedicated server (VITE_WS_URL or ?server=) gives server-authoritative
// rooms; otherwise rooms are host-authoritative over a broadcast relay (Supabase by default).
const ENV = import.meta.env as Record<string, string | undefined>;
const WS_URL = params.get('server') ?? ENV.VITE_WS_URL ?? '';
const RELAY_URL = params.get('relay') ?? ENV.VITE_RELAY_URL ?? '';
const SB_URL = ENV.VITE_SUPABASE_URL ?? 'https://ezwxppiuxbyzmmheckce.supabase.co';
const SB_KEY = ENV.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d3hwcGl1eGJ5em1taGVja2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MjE4MjEsImV4cCI6MjEwMzI5NzgyMX0.fh6AUpeKPDlm4Tr2xXwhf0VdKsRv1A1bZ2s4WFPDMaE';
const netMode = WS_URL ? 'server' : RELAY_URL ? 'relay-ws' : 'relay-supabase';

type ScreenId = 'loading' | 'title' | 'menu' | 'select' | 'lobby' | 'howto' | 'settings' | 'credits' | 'pause' | 'shop' | 'ended' | 'none';

class App {
  renderer = new Renderer();
  input = new Input();
  audio = new Audio();
  display = $<HTMLCanvasElement>('screen');
  dctx = this.display.getContext('2d')!;
  client: GameClient | null = null;
  attract: { link: LocalLink; bots: Bot[] } | null = null;
  screen: ScreenId = 'loading';
  back: ScreenId[] = [];
  paused = false;
  selectMode: 'solo' | 'online' = 'solo';
  fighter: FighterId = loadSettings().fighter;
  shopSel = 0;
  shopPending: string | null = null;
  lastView: View | null = null;
  autopilot: Bot | null = null;
  ended = false;
  private acc = 0;
  private last = performance.now();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  async boot(): Promise<void> {
    this.display.width = SCREEN_W; this.display.height = SCREEN_H;
    this.dctx.imageSmoothingEnabled = false;
    window.addEventListener('resize', () => this.fit());
    this.fit();
    try {
      await loadSheets('./assets/sprites/', (d, t) => { $('loadbar').style.width = `${(d / t) * 100}%`; });
    } catch (e) {
      $('loadmsg').textContent = 'Could not load game assets. Check your connection and refresh.';
      console.error(e);
      return;
    }
    this.bindUi();
    this.startAttract();
    this.drawLogo();
    const room = normalizeRoomCode(params.get('room') ?? '');
    if (room) { ($<HTMLInputElement>('join-code')).value = room; this.go('select'); this.setSelectMode('online'); }
    else this.go('title');
    requestAnimationFrame((t) => this.frame(t));
    (window as unknown as { __kk: unknown }).__kk = this; // test hook (read-only use in e2e)
  }

  // ------------------------------------------------------------------ screens
  go(id: ScreenId, push = true): void {
    if (push && this.screen !== id && this.screen !== 'loading') this.back.push(this.screen);
    this.screen = id;
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('show', s.id === id));
    const inGame = !!this.client && this.client.status === 'game';
    $('pause-btn').classList.toggle('show', inGame && id === 'none');
    this.updateTouch();
    this.input.enabled = id === 'none' || id === 'shop' || id === 'title' || id === 'ended';
    const first = document.querySelector<HTMLElement>(`#${id} button:not([disabled]), #${id} input`);
    // focus after the current key event finishes, so Enter does not also "click" the new button
    if (first && id !== 'title' && id !== 'none' && matchMedia('(pointer: fine)').matches) setTimeout(() => first.focus({ preventScroll: true }), 0);
    if (id === 'howto') this.buildHowto();
    if (id === 'settings') this.syncSettings();
  }

  goBack(): void {
    const prev = this.back.pop() ?? 'menu';
    this.go(prev, false);
  }

  toast(msg: string, err = false, ms = 3500): void {
    const t = $('toast');
    t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (t.className = ''), ms);
  }

  fit(): void {
    const touchH = $('touch').classList.contains('show') && innerHeight > innerWidth ? Math.min(260, innerHeight * 0.46) : 0;
    const W = innerWidth, H = innerHeight - touchH - 8;
    let s = Math.min(W / SCREEN_W, H / SCREEN_H);
    if (s >= 2) s = Math.floor(s);
    this.display.style.width = `${Math.floor(SCREEN_W * s)}px`;
    this.display.style.height = `${Math.floor(SCREEN_H * s)}px`;
  }

  updateTouch(): void {
    const mode = loadSettings().touch ?? 'auto';
    const coarse = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;
    const want = (mode === 'on' || (mode === 'auto' && (coarse || params.get('touch') === '1'))) && params.get('touch') !== '0';
    $('touch').classList.toggle('show', want && (this.screen === 'none' || this.screen === 'shop'));
    this.fit();
  }

  // ------------------------------------------------------------------ UI wiring
  bindUi(): void {
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock);
    document.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) => b.addEventListener('click', () => {
      this.audio.sfx('ok');
      const to = b.dataset.go!;
      if (to === 'solo' || to === 'online') { this.go('select'); this.setSelectMode(to); }
      else this.go(to as ScreenId);
    }));
    document.querySelectorAll<HTMLButtonElement>('[data-back]').forEach((b) => b.addEventListener('click', () => { this.audio.sfx('ui'); this.goBack(); }));
    document.addEventListener('focusin', (e) => { if ((e.target as HTMLElement).tagName === 'BUTTON') this.audio.sfx('ui'); });
    $('title').addEventListener('click', () => this.titleStart());
    this.input.onAnyKey = (code) => { if (this.screen === 'title' && (code === 'Enter' || code === 'Space' || code === 'KeyJ')) this.titleStart(); };
    window.addEventListener('keydown', (e) => { if (this.screen === 'title' && e.key === 'Enter') e.preventDefault(); }, true);
    this.input.onPause = () => this.togglePause();
    $('pause-btn').addEventListener('click', () => this.togglePause());
    $('resume').addEventListener('click', () => this.togglePause());
    $('quit').addEventListener('click', () => this.quitToTitle());
    this.buildCards();
    $<HTMLInputElement>('name').value = loadSettings().name;
    $('solo-start').addEventListener('click', () => this.startSolo());
    $('create-room').addEventListener('click', () => void this.createRoom());
    $('join-room').addEventListener('click', () => void this.joinRoom());
    $<HTMLInputElement>('join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') void this.joinRoom(); });
    $('copy-link').addEventListener('click', () => this.copyLink());
    $('leave-room').addEventListener('click', () => this.quitToTitle());
    $('ready-btn').addEventListener('click', () => { const me = this.client?.lobby.find((p) => p.id === this.client!.myId); this.client?.send({ t: 'ready', r: !me?.ready }); this.audio.sfx('ok'); });
    $('start-btn').addEventListener('click', () => { this.client?.send({ t: 'start', ...this.debugStart() }); this.audio.sfx('ok'); });
    $('pick-bt').addEventListener('click', () => this.lobbyPick('bt'));
    $('pick-sc').addEventListener('click', () => this.lobbyPick('sc'));
    $('shop-leave').addEventListener('click', () => this.client?.send({ t: 'cmd', c: 'leave' }));
    $('end-title').addEventListener('click', () => this.quitToTitle());
    $('end-lobby').addEventListener('click', () => {
      if (!this.client) return;
      if (this.client.link.kind === 'local') this.startSolo();
      else this.client.send({ t: 'restart' });
    });
    $('reset-keys').addEventListener('click', () => { this.input.resetKeys(); this.buildHowto(); });
    $<HTMLInputElement>('vol-music').addEventListener('input', (e) => this.audio.setVolume('music', Number((e.target as HTMLInputElement).value)));
    $<HTMLInputElement>('vol-sfx').addEventListener('input', (e) => { this.audio.setVolume('sfx', Number((e.target as HTMLInputElement).value)); this.audio.sfx('coin'); });
    $<HTMLInputElement>('mute').addEventListener('change', (e) => { saveSettings({ muted: (e.target as HTMLInputElement).checked }); this.audio.applyVolumes(); });
    $<HTMLInputElement>('shake').addEventListener('change', (e) => saveSettings({ shake: (e.target as HTMLInputElement).checked }));
    $<HTMLSelectElement>('touch-mode').addEventListener('change', (e) => { saveSettings({ touch: (e.target as HTMLSelectElement).value as 'auto' }); this.updateTouch(); });
    // touch pad
    document.querySelectorAll<HTMLButtonElement>('#touch button').forEach((b) => {
      const bit = BTN[b.dataset.b as keyof typeof BTN];
      const down = (e: PointerEvent) => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('on'); this.input.setTouch(bit, true); this.audio.unlock(); };
      const up = (e: PointerEvent) => { e.preventDefault(); b.classList.remove('on'); this.input.setTouch(bit, false); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    });
    // keyboard navigation in menus: arrows move focus between buttons
    window.addEventListener('keydown', (e) => {
      if (this.screen === 'none' || this.screen === 'title' || this.screen === 'shop') return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' && (t as HTMLInputElement).type !== 'range' && (t as HTMLInputElement).type !== 'checkbox') return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = [...document.querySelectorAll<HTMLElement>(`#${this.screen} button:not([disabled]), #${this.screen} input, #${this.screen} select, #${this.screen} .card`)].filter((x) => x.offsetParent !== null);
      const i = items.indexOf(document.activeElement as HTMLElement);
      const n = items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
      if (n) { e.preventDefault(); n.focus(); }
    });
    if (DEBUG) $('debug-start').hidden = false;
    $('net-mode').textContent = netMode === 'server' ? 'Online: dedicated server (server-authoritative).' : 'Online: host-authoritative rooms over a secure relay. The room creator runs the game.';
  }

  setSelectMode(m: 'solo' | 'online'): void {
    this.selectMode = m;
    $('select-title').textContent = m === 'solo' ? 'CHOOSE YOUR FIGHTER' : 'ONLINE CO-OP';
    $('select-buttons').hidden = m !== 'solo';
    $('online-buttons').hidden = m !== 'online';
  }

  debugStart(): { ch?: number; se?: number } {
    if (!DEBUG) return {};
    return { ch: Number($<HTMLSelectElement>('dbg-ch').value), se: Number($<HTMLSelectElement>('dbg-se').value) };
  }

  titleStart(): void {
    if (this.screen !== 'title') return;
    this.audio.unlock(); this.audio.sfx('ok');
    this.go('menu');
  }

  buildCards(): void {
    const wrap = $('cards');
    wrap.innerHTML = '';
    for (const f of Object.values(FIGHTERS)) {
      const card = document.createElement('div');
      card.className = 'card'; card.tabIndex = 0; card.dataset.f = f.id;
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const stats = Object.entries(f.stats).map(([k, v]) => `<div class="stat">${k.toUpperCase().padEnd(9, ' ')}<i><b style="width:${v * 20}%"></b></i></div>`).join('');
      card.innerHTML = `<div><h3>${f.name}</h3><p>${f.blurb}</p>${stats}</div>`;
      card.prepend(cv);
      const pick = () => { this.fighter = f.id; saveSettings({ fighter: f.id }); this.audio.sfx('ok'); wrap.querySelectorAll('.card').forEach((c) => c.classList.toggle('on', (c as HTMLElement).dataset.f === f.id)); };
      card.addEventListener('click', pick);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('.card').forEach((c) => c.classList.toggle('on', (c as HTMLElement).dataset.f === this.fighter));
  }

  /** Animate the fighter-card previews with real sprite frames. */
  drawCards(): void {
    if (this.screen !== 'select') return;
    const t = Math.floor(performance.now() / (1000 / 60));
    document.querySelectorAll<HTMLElement>('#cards .card').forEach((card) => {
      const cv = card.querySelector('canvas')!; const c = cv.getContext('2d')!;
      const sheet = getSheet(card.dataset.f!);
      if (!sheet) return;
      const on = card.classList.contains('on');
      const anim = sheet.atlas.anims[on ? 'ready' : 'idle'];
      const total = anim.frames.reduce((s, f) => s + f.t, 0);
      let tt = t % total, fi = anim.frames[0].i;
      for (const f of anim.frames) { if (tt < f.t) { fi = f.i; break; } tt -= f.t; }
      const [cw, ch] = sheet.atlas.cell;
      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, 64, 64);
      c.drawImage(sheet.img, (fi % sheet.atlas.cols) * cw, Math.floor(fi / sheet.atlas.cols) * ch, cw, ch, 0, 0, 64, 64);
    });
  }

  drawLogo(): void {
    const cv = $<HTMLCanvasElement>('logo'); const c = cv.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    const big = (t: string, y: number, col: string) => {
      for (const [dx, dy, cc] of [[3, 3, '#1a1220'], [2, 2, '#1a1220'], [-1, 0, '#1a1220'], [1, 0, '#1a1220'], [0, -1, '#1a1220'], [0, 1, '#7a2a1a']] as [number, number, string][])
        drawText(c, t, 160 + dx, y + dy, cc, { scale: 4, align: 'center', shadow: null });
      drawText(c, t, 160, y, col, { scale: 4, align: 'center', shadow: null });
    };
    big(BRANDING.title.split(' ')[0].toUpperCase(), 4, '#f0c818');
    big(BRANDING.title.split(' ').slice(1).join(' ').toUpperCase(), 36, '#f6e8b8');
    drawText(c, BRANDING.subtitle.toUpperCase(), 160, 74, '#e0303c', { scale: 2, align: 'center', outline: true });
    const jar = artCanvas('nutella');
    c.drawImage(jar, 22, 70); c.drawImage(jar, 286, 70);
    for (const [id, x] of [['bt', -14], ['sc', 270]] as [string, number][]) {
      const sh = getSheet(id); if (!sh) continue;
      const fi = sh.atlas.anims.victory.frames[0].i; const [cw, ch] = sh.atlas.cell;
      c.save();
      if (id === 'sc') { c.translate(x + cw, 0); c.scale(-1, 1); c.drawImage(sh.img, (fi % sh.atlas.cols) * cw, Math.floor(fi / sh.atlas.cols) * ch, cw, ch, 0, 30, cw, ch); }
      else c.drawImage(sh.img, (fi % sh.atlas.cols) * cw, Math.floor(fi / sh.atlas.cols) * ch, cw, ch, x, 30, cw, ch);
      c.restore();
    }
  }

  buildHowto(): void {
    const tbl = $('keytable');
    tbl.innerHTML = '';
    for (const a of ACTIONS) {
      const tr = document.createElement('tr');
      const keys = this.input.keys[a.id] ?? [];
      tr.innerHTML = `<td>${a.label.toUpperCase()}</td><td>${keys.map((k) => `<span class="kbd" data-a="${a.id}">${keyLabel(k)}</span>`).join(' ')}</td>`;
      tbl.appendChild(tr);
    }
    tbl.querySelectorAll<HTMLElement>('.kbd').forEach((k) => k.addEventListener('click', () => {
      k.classList.add('wait'); k.textContent = '…';
      this.input.capture = (code) => { if (code !== 'Escape') this.input.rebind(k.dataset.a as never, code); this.buildHowto(); };
    }));
    const food = $('foodtable');
    food.innerHTML = '';
    for (const id of ITEM_IDS) {
      const d = ITEMS[id];
      const tr = document.createElement('tr');
      const cv = document.createElement('canvas'); const a = artCanvas(id); cv.width = a.width; cv.height = a.height; cv.getContext('2d')!.drawImage(a, 0, 0);
      const td0 = document.createElement('td'); td0.appendChild(cv);
      tr.appendChild(td0);
      tr.insertAdjacentHTML('beforeend', `<td>${d.name.toUpperCase()}</td><td>${d.desc}</td><td>₺${d.priceTRY} / $${d.priceUSD}</td>`);
      food.appendChild(tr);
    }
  }

  syncSettings(): void {
    const s = loadSettings();
    $<HTMLInputElement>('vol-music').value = String(s.music);
    $<HTMLInputElement>('vol-sfx').value = String(s.sfx);
    $<HTMLInputElement>('mute').checked = s.muted;
    $<HTMLInputElement>('shake').checked = s.shake;
    $<HTMLSelectElement>('touch-mode').value = s.touch ?? 'auto';
  }

  playerName(): string {
    const n = $<HTMLInputElement>('name').value.trim() || 'Kanka';
    saveSettings({ name: n });
    return n;
  }

  // ------------------------------------------------------------------ attract mode (title background)
  startAttract(): void {
    const link = new LocalLink('DEMO', { allowDebugStart: true, seed: 7 });
    const bots = [new Bot('a', 0), new Bot('b', 1)];
    this.attractView = null; this.attractEvs = [];
    link.onMessage = (m) => { if (m.t === 'snap') { this.attractView = decode(m.s); this.attractEvs.push(...m.s.ev); if (this.attractEvs.length > 200) this.attractEvs.splice(0, 100); } };
    link.session.onMessage('a', { t: 'hello', v: 1, name: 'B.T.', token: 'attract-a', f: 'bt' });
    link.session.onMessage('b', { t: 'hello', v: 1, name: 'S.C.', token: 'attract-b', f: 'sc' });
    link.session.onMessage('a', { t: 'ready', r: true });
    link.session.onMessage('b', { t: 'ready', r: true });
    const ids = [...link.session.peers.values()].map((p) => p.id);
    link.session.startGame(Math.floor(Math.random() * 4), 0);
    bots.forEach((b, i) => (b.pid = ids[i]));
    link.session.sim!.godMode = true;
    this.attract = { link, bots };
    this.renderer.localPid = '';
  }

  stopAttract(): void { this.attract = null; }

  // ------------------------------------------------------------------ sessions
  attach(link: Link): GameClient {
    this.stopAttract();
    this.client?.close();
    const c = new GameClient(link, this.playerName(), sessionToken() + (link.kind === 'local' ? '-solo' : ''), this.fighter);
    this.client = c;
    this.ended = false;
    this.renderer.fx = new (this.renderer.fx.constructor as new () => typeof this.renderer.fx)();
    c.onChange = () => this.onClientChange();
    c.onResult = (r) => { if (r.nonce && r.nonce === this.shopPending) { this.shopPending = null; if (!r.ok) { $('shop-msg').textContent = (r.reason ?? 'Cannot buy').toUpperCase(); this.audio.sfx('error'); } } };
    c.onError = (code, msg) => { this.toast(msg, true); if (code === 'room-full' || code === 'room-not-found') this.quitToTitle(false); };
    this.autopilot = AUTOPILOT ? new Bot('', 3) : null;
    // a local authority answers the hello synchronously, before the callbacks above existed
    queueMicrotask(() => this.onClientChange());
    return c;
  }

  startSolo(): void {
    const link = new LocalLink('SOLO', { allowDebugStart: DEBUG });
    const c = this.attach(link);
    c.send({ t: 'ready', r: true });
    c.send({ t: 'start', ...this.debugStart() });
    this.paused = false;
    this.go('none', false); this.back = [];
  }

  async createRoom(): Promise<void> {
    try {
      if (netMode === 'server') {
        this.attach(new WsLink(`${WS_URL.replace(/\/$/, '')}/ws?create=1`));
      } else {
        const code = makeRoomCode();
        this.toast('Opening room…');
        const ch = await this.openChannel(code);
        this.attach(new RelayHostLink(code, ch));
      }
      this.go('lobby');
    } catch (e) {
      this.toast((e as Error).message || 'Could not create the room.', true);
    }
  }

  async joinRoom(): Promise<void> {
    const code = normalizeRoomCode($<HTMLInputElement>('join-code').value);
    if (!code) { this.toast('Room codes are 5 letters/numbers.', true); this.audio.sfx('error'); return; }
    try {
      if (netMode === 'server') this.attach(new WsLink(`${WS_URL.replace(/\/$/, '')}/ws?room=${code}`));
      else {
        this.toast('Connecting…');
        const ch = await this.openChannel(code);
        this.attach(new RelayGuestLink('g' + randomId(8), ch));
      }
      this.go('lobby');
      $('room-code').textContent = code;
    } catch (e) {
      this.toast((e as Error).message || 'Could not join the room.', true);
    }
  }

  async openChannel(code: string): Promise<Channel> {
    const ch = netMode === 'relay-ws' ? wsRelayChannel(code, RELAY_URL) : await supabaseChannel(code, SB_URL, SB_KEY);
    await ch.ready;
    return ch;
  }

  inviteLink(): string {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('room', this.client?.code ?? '');
    for (const k of ['server', 'relay']) if (params.get(k)) u.searchParams.set(k, params.get(k)!);
    return u.toString();
  }

  copyLink(): void {
    const link = this.inviteLink();
    navigator.clipboard?.writeText(link).then(() => ($('copy-ok').textContent = 'COPIED!'), () => ($('copy-ok').textContent = link));
    this.audio.sfx('ok');
  }

  lobbyPick(f: FighterId): void { this.fighter = f; saveSettings({ fighter: f }); this.client?.send({ t: 'pick', f }); this.audio.sfx('ok'); }

  onClientChange(): void {
    const c = this.client;
    if (!c) return;
    if (c.status === 'closed') {
      this.toast(c.error || 'Disconnected.', true, 6000);
      this.quitToTitle(false);
      return;
    }
    if (c.status === 'lobby') {
      if (this.screen !== 'lobby' && this.screen !== 'howto' && this.screen !== 'settings') this.go('lobby');
      this.renderLobby();
    }
    if (c.status === 'game' && (this.screen === 'lobby' || this.screen === 'select' || this.screen === 'ended')) { this.go('none', false); this.back = []; this.ended = false; }
    this.renderer.localPid = c.myId;
  }

  renderLobby(): void {
    const c = this.client!;
    $('room-code').textContent = c.code || '-----';
    const ul = $('players'); ul.innerHTML = '';
    c.lobby.forEach((p, i) => {
      const li = document.createElement('li');
      li.style.setProperty('--c', SLOT_COLORS[i % 4]);
      li.innerHTML = `<b>P${i + 1}</b> <span></span> <span class="tiny">${FIGHTERS[p.f].name}</span>${p.host ? ' <span class="tiny">HOST</span>' : ''}<span class="st ${!p.conn ? 'off' : p.ready ? 'ok' : 'no'}">${!p.conn ? 'OFFLINE' : p.ready ? 'READY' : 'NOT READY'}</span>`;
      (li.children[1] as HTMLElement).textContent = p.name + (p.id === c.myId ? ' (YOU)' : '');
      ul.appendChild(li);
    });
    const me = c.lobby.find((p) => p.id === c.myId);
    $('ready-btn').textContent = me?.ready ? 'UNREADY' : 'READY';
    $('start-btn').hidden = !c.isHost;
    ($('start-btn') as HTMLButtonElement).disabled = !c.canStart;
    $('pick-bt').classList.toggle('on', me?.f === 'bt'); $('pick-sc').classList.toggle('on', me?.f === 'sc');
    $('lobby-msg').textContent = c.isHost ? (c.canStart ? 'Everyone is ready — press START!' : 'Waiting for everyone to ready up. Share the code or link.') : 'Ready up! The host starts the game.';
  }

  togglePause(): void {
    if (this.screen === 'shop') { this.client?.send({ t: 'cmd', c: 'leave' }); return; }
    if (!this.client || this.client.status !== 'game') { if (this.screen !== 'title' && this.screen !== 'menu' && this.screen !== 'loading') this.goBack(); return; }
    if (this.screen === 'pause') { this.paused = false; this.go('none', false); this.back = []; this.audio.sfx('pause'); return; }
    if (this.screen !== 'none') { this.goBack(); return; }
    this.paused = this.client.link.kind === 'local';
    $('pause-note').textContent = this.paused ? '' : 'Online game: the fight continues while you are in this menu!';
    this.audio.sfx('pause');
    this.go('pause');
  }

  quitToTitle(stopClient = true): void {
    if (stopClient && this.client) this.client.close();
    this.client = null;
    this.paused = false;
    this.renderer.localPid = '';
    this.back = [];
    this.startAttract();
    this.go('title', false);
  }

  // ------------------------------------------------------------------ shop
  updateShop(v: View): void {
    const me = this.renderer.localEnt(v);
    const inShop = !!me && me.st === 'shop';
    if (inShop && this.screen === 'none') { this.shopSel = 0; this.go('shop', false); }
    if (!inShop && this.screen === 'shop') { this.go('none', false); this.shopPending = null; }
    if (!inShop || !me) return;
    const sec = CHAPTERS[v.chapter].sections[v.section];
    const spot = sec.shops.find((s) => Math.abs(me.x - s.x) < 24);
    if (!spot) return;
    const shop = SHOPS[spot.shop];
    const p = v.players.find((x) => x.pid === this.client?.myId)!;
    $('shop-name').textContent = shop.name.toUpperCase();
    $('shop-tag').textContent = shop.tagline;
    $('shop-money').textContent = formatMoney(p.money, v.cur);
    $('shop-bag').textContent = `${p.bag.length}/4`;
    const ul = $('shop-list');
    const key = shop.stock.join(',') + p.money + this.shopSel + v.cur;
    if (ul.dataset.key === key) return;
    ul.dataset.key = key;
    ul.innerHTML = '';
    shop.stock.forEach((id, i) => {
      const d = ITEMS[id]; const price = v.cur === 'TRY' ? d.priceTRY : d.priceUSD;
      const li = document.createElement('li');
      li.className = (i === this.shopSel ? 'sel ' : '') + (p.money < price ? 'poor' : '');
      const cv = document.createElement('canvas'); const a = artCanvas(id); cv.width = a.width; cv.height = a.height; cv.getContext('2d')!.drawImage(a, 0, 0);
      li.appendChild(cv);
      li.insertAdjacentHTML('beforeend', `<span>${d.name.toUpperCase()}<span class="d">${d.desc}</span></span><span class="price">${formatMoney(price, v.cur)}</span>`);
      li.addEventListener('click', () => { this.shopSel = i; this.buy(id); });
      ul.appendChild(li);
    });
  }

  buy(id: ItemId): void {
    if (!this.client || this.shopPending) return;
    const nonce = randomId(10);
    this.shopPending = nonce;
    this.client.send({ t: 'cmd', c: 'buy', item: id, nonce });
  }

  shopInput(pressed: number, v: View): void {
    const me = this.renderer.localEnt(v);
    if (!me) return;
    const sec = CHAPTERS[v.chapter].sections[v.section];
    const spot = sec.shops.find((s) => Math.abs(me.x - s.x) < 24);
    if (!spot) return;
    const stock = SHOPS[spot.shop].stock;
    if (pressed & BTN.UP) { this.shopSel = (this.shopSel + stock.length - 1) % stock.length; this.audio.sfx('ui'); $('shop-list').dataset.key = ''; }
    if (pressed & BTN.DOWN) { this.shopSel = (this.shopSel + 1) % stock.length; this.audio.sfx('ui'); $('shop-list').dataset.key = ''; }
    if (pressed & (BTN.LIGHT | BTN.START | BTN.JUMP)) this.buy(stock[this.shopSel]);
    if (pressed & (BTN.GRAB | BTN.HEAVY)) this.client?.send({ t: 'cmd', c: 'leave' });
  }

  // ------------------------------------------------------------------ loop
  frame(t: number): void {
    requestAnimationFrame((tt) => this.frame(tt));
    const dt = Math.min(250, t - this.last);
    this.last = t;
    this.acc += dt;
    const step = 1000 / TICK_HZ;
    let steps = 0;
    while (this.acc >= step && steps < 8) { this.acc -= step; this.tick(); steps++; }
    if (steps >= 8) this.acc = 0;
    this.draw();
  }

  tick(): void {
    // attract mode
    if (this.attract && !this.client) {
      const sim = this.attract.link.session.sim;
      if (sim) for (const b of this.attract.bots) sim.setInput(b.pid, b.think(sim));
      this.attract.link.tick();
      if (sim && (sim.phase === 'victory' || sim.phase === 'final' || sim.tick > 60 * 90)) this.startAttract();
    }
    const c = this.client;
    if (c && c.status === 'game') {
      let inp = this.input.sample();
      const v = c.latest();
      if (this.autopilot && v) {
        this.autopilot.pid = c.myId;
        inp = this.autopilot.think(viewWorld(v));
      }
      if (this.screen === 'shop' && v) { this.shopInput(inp.pressed, v); inp = { held: 0, pressed: 0 }; }
      if (this.screen === 'pause' || this.screen === 'howto' || this.screen === 'settings') inp = { held: 0, pressed: 0 };
      if (!this.paused) {
        c.input(inp.held, inp.pressed);
        c.link.tick?.();
      }
    } else this.input.sample();
    this.renderer.fx.step();
  }

  draw(): void {
    let v: View | null = null;
    if (this.client && this.client.status === 'game') v = this.client.view();
    else if (this.attract) v = this.attractView;
    if (v) {
      const evs = this.client ? this.client.takeEvents() : this.attractEvs.splice(0);
      this.processEvents(evs, v, !this.client);
      if (!loadSettings().shake) this.renderer.fx.shake = 0;
      this.renderer.render(v, !!this.client);
      this.dctx.drawImage(this.renderer.canvas, 0, 0);
      this.lastView = v;
      if (this.client) {
        this.updateShop(v);
        this.music(v);
        const over = v.phase === 'victory' || v.phase === 'final';
        if (over && !this.ended) {
          this.ended = true;
          $('end-lobby').textContent = this.client.link.kind === 'local' ? 'PLAY AGAIN' : 'BACK TO LOBBY';
          $('end-lobby').hidden = this.client.link.kind !== 'local' && !this.client.isHost;
          setTimeout(() => { if (this.ended && this.client) this.go('ended', false); }, 2500);
        }
      } else this.audio.music('menu');
    } else {
      this.dctx.fillStyle = '#0e0a14'; this.dctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    this.drawCards();
  }

  attractView: View | null = null;
  attractEvs: SimEvent[] = [];

  music(v: View): void {
    if (v.phase === 'victory') this.audio.music('victory');
    else if (v.phase === 'bossintro' || v.phase === 'boss' || v.phase === 'bossdown') this.audio.music('boss');
    else if (v.phase === 'gameover' || v.phase === 'final') this.audio.stopMusic();
    else this.audio.music(CHAPTERS[v.chapter].music);
  }

  processEvents(evs: SimEvent[], v: View, silent = false): void {
    const fx = this.renderer.fx;
    const a = silent ? { sfx: () => {} } as unknown as Audio : this.audio;
    const ent = (id: number) => v.ents.find((e) => e.id === id);
    const meP = v.players.find((p) => p.pid === this.renderer.localPid);
    const isMe = (id: number) => !!meP && meP.id === id;
    for (const e of evs) {
      switch (e.k) {
        case 'hit': {
          fx.hit(e.x, e.y, e.z, e.heavy, e.block);
          if (e.tgt >= 0) {
            fx.flash.set(e.tgt, 3);
            const t = ent(e.tgt);
            if (e.dmg > 0 && t) fx.text(t.x, t.y + 46, t.z, String(e.dmg), t.player ? '#ff6a6a' : '#ffffff');
          }
          a.sfx(e.block ? 'block' : e.heavy ? 'heavy' : 'light', 0.9 + Math.random() * 0.2);
          break;
        }
        case 'whiff': a.sfx('whiff'); break;
        case 'ko': { a.sfx('ko'); const t = ent(e.id); if (t) fx.dust(t.x, t.z, true); if (e.boss) fx.shake = 8; break; }
        case 'coin': { const t = ent(e.id); if (t) { fx.coins(t.x, t.z); fx.text(t.x, t.y + 50, t.z, '+' + formatMoney(e.amt, v.cur), '#f6d838'); } a.sfx('coin'); break; }
        case 'eat': { const t = ent(e.id); if (t) { fx.sparkle(t.x, 30, t.z, '#4ad06a'); fx.text(t.x, 56, t.z, ITEMS[e.item].heal === Infinity ? 'FULL HP!' : '+HP', '#4ad06a'); } a.sfx('eat'); break; }
        case 'oneup': { const t = ent(e.id); if (t) { fx.sparkle(t.x, 30, t.z, '#f6f6f2'); fx.text(t.x, 56, t.z, '1UP!', '#8ac8ff', true); } a.sfx('oneup'); break; }
        case 'stash': { const t = ent(e.id); if (t) fx.text(t.x, 54, t.z, 'INTO BAG', '#f6e8b8'); a.sfx('ok'); break; }
        case 'msg': { const t = ent(e.id); if (t) fx.text(t.x, 58, t.z, e.text, '#ffb04a'); if (isMe(e.id)) { a.sfx('error'); if (this.screen === 'shop') $('shop-msg').textContent = e.text; } break; }
        case 'buy': { const t = ent(e.id); if (t) fx.text(t.x, 58, t.z, '+' + ITEMS[e.item].name.toUpperCase(), '#4ad06a'); a.sfx('buy'); if (isMe(e.id)) $('shop-msg').textContent = `BOUGHT ${ITEMS[e.item].name.toUpperCase()}!`; break; }
        case 'grab': a.sfx('grab'); break;
        case 'throw': a.sfx('throw'); break;
        case 'land': { const t = ent(e.id); if (t && e.heavy) { fx.dust(t.x, t.z, true); a.sfx('thud'); } break; }
        case 'jump': if (isMe(e.id)) a.sfx('jump'); break;
        case 'break': fx.debris(e.x, e.z, '#c8904a'); a.sfx('break'); break;
        case 'quip': fx.say(e.id, e.text); break;
        case 'phase': if (e.text) fx.say(e.id, e.text); fx.shake = 6; a.sfx('boss'); break;
        case 'levelup': { const t = ent(e.id); if (t) { fx.text(t.x, 60, t.z, 'LEVEL UP!', '#f0c818', true); fx.sparkle(t.x, 30, t.z, '#f0c818'); } a.sfx('levelup'); break; }
        case 'die': a.sfx('ko'); break;
        case 'respawn': { const t = ent(e.id); if (t) fx.sparkle(t.x, 30, t.z, '#ffffff'); break; }
        case 'go': a.sfx('go'); break;
        case 'section': if (CHAPTERS[e.ch].sections[e.se].boss) a.sfx('boss'); break;
        case 'convert': this.toast('Wallets converted: ₺10 = $1. Welcome to America!'); break;
        case 'horn': a.sfx(e.kind === 'tram' ? 'bell' : 'horn'); break;
        case 'proj': a.sfx('toss'); break;
        default: break;
      }
    }
  }
}

void new App().boot();
