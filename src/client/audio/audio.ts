// Supplied city/title themes streaming from public/assets/music, plus the original
// chiptune fallback and every procedural sound effect. The five supplied tracks are
// mastered MP3s (see shared/data/music.ts); the TRACKS below stay as the fallback when
// a file cannot be fetched and for the short victory sting.

import { loadSettings, saveSettings } from '../settings';
import { THEMES, musicUrl, type ThemeId } from '../../shared/data/music';

type Voice = 'square' | 'triangle' | 'sawtooth' | 'sine';
interface Track { bpm: number; lead: string; bass: string; drums: string; harm?: string; leadVoice?: Voice; swing?: number }

const NOTE: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function freq(n: string): number {
  const m = /^([A-G][#b]?)(\d)$/.exec(n);
  if (!m) return 0;
  return 440 * Math.pow(2, (NOTE[m[1]] + (Number(m[2]) + 1) * 12 - 69) / 12);
}

// Each token is one 16th-note step: a note, '-' to hold, '.' for rest. Drums: K kick, S snare, H hat, D dum, T tek.
const TRACKS: Record<string, Track> = {
  menu: {
    bpm: 128, leadVoice: 'square',
    lead: 'A4 . C5 . E5 - D5 C5 D5 - E5 - A4 - - . G4 . B4 . D5 - C5 B4 C5 - D5 - G4 - - . F4 . A4 . C5 - B4 A4 B4 - C5 - E5 - D5 C5 B4 - G#4 - B4 - E5 - - - . . . .',
    bass: 'A2 . A3 . A2 . A3 . A2 . A3 . G2 . G3 . G2 . G3 . G2 . G3 . G2 . B2 . F2 . F3 . F2 . F3 . F2 . F3 . E2 . E3 . E2 . E3 . G#2 . B2 . E3 . D3 .',
    drums: 'K . H . S . H K K . H . S . H . K . H . S . H K K . H . S . S S',
  },
  istanbul: {
    bpm: 124, leadVoice: 'square',
    lead: 'D5 - Eb5 - F#5 - G5 - A5 - - - G5 F#5 Eb5 - D5 - - - . . . . A4 - Bb4 - C5 - D5 - Eb5 - D5 C5 Bb4 - A4 - - - . . . . D5 - Eb5 - F#5 - G5 - A5 - Bb5 - A5 G5 F#5 - G5 - F#5 Eb5 D5 - - - . . . .',
    harm: 'A4 - - - . . . . D5 - - - . . . . F#4 - - - . . . . A4 - - - . . . . A4 - - - . . . . D5 - - - . . . . F#4 - - - . . . . D4 - - - . . . .',
    bass: 'D3 . . D3 . . A2 . D3 . . D3 . . C3 . D3 . . D3 . . A2 . Bb2 . . Bb2 . . A2 . D3 . . D3 . . A2 . D3 . . D3 . . C3 . Eb3 . . Eb3 . . D3 . D3 . . . A2 . D3 .',
    drums: 'D . . T . T D . T . . T . T . . D . . T . T D . T . T T T . T .',
  },
  izmir: {
    bpm: 140, leadVoice: 'square',
    lead: 'G4 B4 D5 - B4 D5 G5 - F#5 E5 D5 - E5 F#5 G5 - A5 G5 F#5 - E5 D5 C5 - B4 C5 D5 - - - . . G4 B4 D5 - B4 D5 G5 - A5 B5 C6 - B5 A5 G5 - F#5 G5 A5 - D5 - F#5 - G5 - - - . . . .',
    harm: 'D4 . G4 . D4 . G4 . D4 . A4 . D4 . A4 . C4 . E4 . C4 . E4 . D4 . F#4 . D4 . F#4 . D4 . G4 . D4 . G4 . E4 . C5 . E4 . C5 . D4 . A4 . D4 . F#4 . B3 . G4 . B3 . G4 .',
    bass: 'G2 . D3 . G2 . D3 . D2 . A2 . D2 . A2 . C3 . G2 . C3 . G2 . D2 . A2 . D2 . F#2 . G2 . D3 . G2 . D3 . C3 . G2 . C3 . G2 . D2 . A2 . D2 . A2 . G2 . D3 . G2 . . .',
    drums: 'K . H H S . H H K . H H S . H S K . H H S . H H K K H H S . S S',
  },
  nyc: {
    bpm: 100, leadVoice: 'sawtooth', swing: 0.12,
    lead: '. . . . E5 . . E5 . . G5 . A5 - . . . . . . E5 . D5 . E5 - - - . . . . . . . . E5 . . E5 . . G5 . B5 - A5 . G5 . E5 . D5 . E5 - - - - - . . . .',
    bass: 'E2 . E3 . G2 . A2 Bb2 B2 . E2 . D3 . E3 . E2 . E3 . G2 . A2 Bb2 B2 . E2 . G2 . A2 . A2 . A3 . C3 . D3 Eb3 E3 . A2 . G2 . E2 . B1 . B2 . D3 . F#2 . G2 . G#2 . B2 . D3 .',
    drums: 'K . H . S . H K . K H . S . H H K . H . S . H K . K H . S H S H',
  },
  tampa: {
    bpm: 118, leadVoice: 'square',
    lead: 'C5 - A4 - F4 - A4 C5 - - D5 - C5 - A4 - Bb4 - G4 - E4 - G4 Bb4 - - C5 - Bb4 - G4 - A4 - F4 - C4 - F4 A4 - - C5 - D5 - E5 - F5 - - - E5 D5 C5 - A4 - Bb4 - C5 - - - . . . .',
    harm: 'F4 . A4 . F4 . A4 . F4 . A4 . F4 . A4 . E4 . G4 . E4 . G4 . E4 . G4 . E4 . G4 . D4 . F4 . D4 . F4 . D4 . F4 . D4 . F4 . C4 . E4 . C4 . E4 . G4 . E4 . C4 . E4 .',
    bass: 'F2 . F3 . F2 . F3 . F2 . F3 . F2 . F3 . C2 . C3 . C2 . C3 . C2 . C3 . C2 . C3 . D2 . D3 . D2 . D3 . D2 . D3 . D2 . D3 . Bb1 . Bb2 . Bb1 . Bb2 . C2 . C3 . C2 . E2 .',
    drums: 'K . H . S . H . K . H K S . H . K . H . S . H . K . H K S . S S',
  },
  victory: {
    bpm: 140, leadVoice: 'square',
    lead: 'C5 E5 G5 C6 - - G5 - C6 - - - . . . . A5 - B5 - C6 - D6 - E6 - - - - - - -',
    bass: 'C3 . G3 . C3 . G3 . C3 . G3 . C3 . E3 . F3 . A3 . F3 . G3 . B3 . C4 - - - - - - -',
    drums: 'K . H . S . H . K . H . S . H . K . H . S . H . K . K . S S S S',
  },
};

/** One theme per city (named after the chapter's `music` id) and the title theme. */
const MUSIC_FILES: Record<string, string> = Object.fromEntries(
  (Object.keys(THEMES) as ThemeId[]).map((id) => [id, musicUrl(id)]),
);

/** Synth-only ids: the chiptune menu loop used as the title fallback and the victory sting. */
type SynthId = 'menu' | 'victory';
export type MusicId = ThemeId | SynthId;

interface FileTrack { el: HTMLAudioElement; gain: GainNode }

export type Sfx = 'light' | 'heavy' | 'whiff' | 'block' | 'grab' | 'throw' | 'land' | 'coin' | 'eat' | 'oneup' | 'buy' | 'error' | 'ui' | 'ok' | 'ko' | 'boss' | 'horn' | 'bell' | 'jump' | 'levelup' | 'go' | 'break' | 'pause' | 'thud' | 'toss';

export class Audio {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;
  private noise!: AudioBuffer;
  private current: MusicId | '' = '';
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastPlayed = new Map<string, number>();
  private voices = 0;
  private files = new Map<string, FileTrack>();
  private file: FileTrack | null = null;
  private fileName = '';
  private broken = new Set<string>();

  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    this.master.connect(lp); lp.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolumes();
    if (this.current) { const t = this.current; this.current = ''; this.music(t); }
  }

  applyVolumes(): void {
    if (!this.ctx) return;
    const s = loadSettings();
    this.master.gain.value = s.muted ? 0 : 0.9;
    this.musicGain.gain.value = s.music * 0.32;
    this.sfxGain.gain.value = s.sfx * 0.55;
  }

  setVolume(kind: 'music' | 'sfx', v: number): void { saveSettings({ [kind]: Math.max(0, Math.min(1, v)) }); this.applyVolumes(); }
  toggleMute(): boolean { const m = !loadSettings().muted; saveSettings({ muted: m }); this.applyVolumes(); return m; }

  // ------------------------------------------------------------------ music
  music(name: MusicId): void {
    if (name === this.current) return;
    this.current = name;
    if (!this.ctx) return;       // unlock() replays the requested track after a gesture
    this.startMusic(name);
  }

  /** Swap to `name`: fade the outgoing stream (or stop the synth), then start the new one.
   *  File tracks are cached, so returning to a theme resumes where it was paused. */
  private startMusic(name: MusicId): void {
    if (this.file && this.fileName === name) return;
    if (this.file) this.fadeOutFile();
    this.stopSynth();
    const url = MUSIC_FILES[name as string];
    if (url && !this.broken.has(name)) { this.fileName = name; this.startFile(name, url); return; }
    this.fileName = '';
    this.startSynth(name);
  }

  /** Stream a supplied track through its own gain node so it can cross-fade against the
   *  synth and the previous city theme. */
  private openFile(name: string, url: string): FileTrack {
    // `new Audio()` would resolve to this module's class, not the DOM element, so build one
    const el = document.createElement('audio');
    el.src = url;
    el.loop = true;
    el.preload = 'auto';
    const gain = this.ctx!.createGain();
    gain.gain.value = 0;
    this.ctx!.createMediaElementSource(el).connect(gain);
    gain.connect(this.musicGain);
    el.addEventListener('error', () => this.fileFailed(name));
    const track = { el, gain };
    this.files.set(name, track);
    return track;
  }

  private startFile(name: string, url: string): void {
    const ctx = this.ctx!;
    const track = this.files.get(name) ?? this.openFile(name, url);
    this.file = track;
    const now = ctx.currentTime;
    track.gain.gain.cancelScheduledValues(now);
    track.gain.gain.setValueAtTime(0, now);
    track.gain.gain.linearRampToValueAtTime(1, now + 0.8);
    const playing = track.el.play();
    if (playing) void playing.catch(() => { /* the next user gesture retries via unlock() */ });
  }

  private fadeOutFile(): void {
    const track = this.file;
    if (!track || !this.ctx) return;
    const now = this.ctx.currentTime;
    track.gain.gain.cancelScheduledValues(now);
    track.gain.gain.setValueAtTime(track.gain.gain.value, now);
    track.gain.gain.linearRampToValueAtTime(0, now + 0.5);
    this.file = null;
    this.fileName = '';
    setTimeout(() => { if (this.file !== track) track.el.pause(); }, 620);
  }

  /** A missing or undecodable file drops back to the chiptune for that id instead of
   *  leaving the game silent. */
  private fileFailed(name: string): void {
    if (this.broken.has(name)) return;
    this.broken.add(name);
    console.warn(`music: could not load ${MUSIC_FILES[name] ?? name}; using the chiptune fallback`);
    if (this.current !== name) return;
    this.current = '';
    this.music(TRACKS[name] ? (name as MusicId) : 'menu');
  }

  private startSynth(name: MusicId): void {
    this.step = 0;
    this.nextTime = this.ctx!.currentTime + 0.08;
    if (!TRACKS[name]) return;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  private stopSynth(): void { if (this.timer) clearInterval(this.timer); this.timer = null; }

  stopMusic(): void {
    this.current = '';
    this.fadeOutFile();
    this.stopSynth();
  }

  private schedule(): void {
    const ctx = this.ctx!; const tr = TRACKS[this.current];
    if (!tr) return;
    const lead = tr.lead.split(/\s+/), bass = tr.bass.split(/\s+/), drums = tr.drums.split(/\s+/), harm = tr.harm?.split(/\s+/);
    const len = Math.max(lead.length, bass.length);
    const stepDur = 60 / tr.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.12) {
      const i = this.step;
      const t = this.nextTime + (tr.swing && i % 2 ? stepDur * tr.swing : 0);
      const hold = (arr: string[], idx: number) => { let n = 1; while (arr[(idx + n) % arr.length] === '-') n++; return n; };
      const l = lead[i % lead.length]; if (l && l !== '-' && l !== '.') this.tone(tr.leadVoice ?? 'square', freq(l), t, stepDur * hold(lead, i % lead.length) * 0.92, 0.16, this.musicGain);
      if (harm) { const h = harm[i % harm.length]; if (h && h !== '-' && h !== '.') this.tone('triangle', freq(h), t, stepDur * hold(harm, i % harm.length) * 0.9, 0.12, this.musicGain); }
      const b = bass[i % bass.length]; if (b && b !== '-' && b !== '.') this.tone('triangle', freq(b), t, stepDur * hold(bass, i % bass.length) * 0.85, 0.34, this.musicGain);
      const d = drums[i % drums.length];
      if (d === 'K' || d === 'D') this.kick(t, d === 'D' ? 0.5 : 0.6);
      if (d === 'S' || d === 'T') this.snare(t, d === 'T' ? 0.18 : 0.3, d === 'T' ? 2600 : 1600);
      if (d === 'H') this.hat(t);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % (len * 8);
    }
  }

  private tone(type: Voice, f: number, t: number, dur: number, vol: number, out: AudioNode, slide = 0): void {
    if (!f) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + Math.max(0.01, dur * 0.7)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }

  private noiseHit(t: number, dur: number, vol: number, hp: number, out: AudioNode, lpf = 12000): void {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lpf;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(f2); f2.connect(g); g.connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  private kick(t: number, v: number): void { this.tone('sine', 140, t, 0.14, v, this.musicGain, 0.3); }
  private snare(t: number, v: number, hp: number): void { this.noiseHit(t, 0.12, v, hp, this.musicGain); }
  private hat(t: number): void { this.noiseHit(t, 0.03, 0.08, 7000, this.musicGain); }

  // ------------------------------------------------------------------ effects
  sfx(name: Sfx, pitch = 1): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const last = this.lastPlayed.get(name) ?? 0;
    if (now - last < 0.045) return;       // no machine-gun retriggers
    if (this.voices > 14) return;
    this.lastPlayed.set(name, now);
    this.voices++; setTimeout(() => this.voices--, 250);
    const o = this.sfxGain, t = now;
    switch (name) {
      case 'light': this.noiseHit(t, 0.06, 0.5, 900, o, 5000); this.tone('square', 180 * pitch, t, 0.05, 0.2, o, 0.5); break;
      case 'heavy': this.noiseHit(t, 0.16, 0.7, 300, o, 3000); this.tone('square', 110 * pitch, t, 0.14, 0.32, o, 0.4); this.tone('sine', 70, t, 0.2, 0.5, o, 0.5); break;
      case 'whiff': this.noiseHit(t, 0.07, 0.12, 2500, o, 6000); break;
      case 'block': this.tone('square', 900, t, 0.05, 0.18, o, 0.8); this.tone('square', 1350, t + 0.02, 0.06, 0.12, o); break;
      case 'grab': this.tone('square', 260, t, 0.06, 0.2, o, 1.4); this.noiseHit(t, 0.05, 0.2, 1500, o); break;
      case 'throw': case 'toss': this.noiseHit(t, 0.18, 0.25, 600, o, 4000); this.tone('sawtooth', 400, t, 0.16, 0.12, o, 0.4); break;
      case 'land': case 'thud': this.tone('sine', 90, t, 0.16, 0.5, o, 0.4); this.noiseHit(t, 0.1, 0.3, 200, o, 1200); break;
      case 'coin': this.tone('square', 988, t, 0.06, 0.16, o); this.tone('square', 1319, t + 0.06, 0.12, 0.16, o); break;
      case 'eat': for (let i = 0; i < 3; i++) this.noiseHit(t + i * 0.09, 0.05, 0.3, 500, o, 2500); this.tone('triangle', 520, t + 0.28, 0.12, 0.2, o, 1.5); break;
      case 'oneup': ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => this.tone('square', freq(n), t + i * 0.07, 0.09, 0.18, o)); break;
      case 'levelup': ['G4', 'C5', 'E5', 'G5'].forEach((n, i) => this.tone('square', freq(n), t + i * 0.06, 0.1, 0.16, o)); break;
      case 'buy': this.tone('square', 1568, t, 0.05, 0.16, o); this.tone('square', 2093, t + 0.05, 0.14, 0.16, o); this.noiseHit(t + 0.02, 0.1, 0.12, 4000, o); break;
      case 'error': this.tone('square', 140, t, 0.18, 0.2, o); this.tone('square', 120, t + 0.1, 0.18, 0.2, o); break;
      case 'ui': this.tone('square', 660, t, 0.03, 0.12, o); break;
      case 'ok': this.tone('square', 660, t, 0.05, 0.14, o); this.tone('square', 990, t + 0.05, 0.08, 0.14, o); break;
      case 'pause': this.tone('square', 440, t, 0.05, 0.14, o); this.tone('square', 330, t + 0.06, 0.08, 0.14, o); break;
      case 'ko': this.tone('sawtooth', 300, t, 0.4, 0.22, o, 0.2); this.noiseHit(t, 0.3, 0.4, 200, o, 2000); break;
      case 'boss': for (let i = 0; i < 4; i++) this.tone('sawtooth', i % 2 ? 330 : 440, t + i * 0.18, 0.17, 0.16, o); break;
      case 'horn': this.tone('square', 392, t, 0.25, 0.14, o); this.tone('square', 494, t, 0.25, 0.1, o); break;
      case 'bell': for (let i = 0; i < 3; i++) this.tone('triangle', 1760, t + i * 0.16, 0.12, 0.2, o); break;
      case 'jump': this.tone('square', 300, t, 0.08, 0.12, o, 1.8); break;
      case 'go': this.tone('square', 784, t, 0.08, 0.16, o); this.tone('square', 784, t + 0.12, 0.12, 0.16, o); break;
      case 'break': this.noiseHit(t, 0.22, 0.5, 400, o, 3500); this.tone('square', 150, t, 0.12, 0.2, o, 0.5); break;
    }
  }
}
