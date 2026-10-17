import type { MusicMode, SfxName } from '../types/GameTypes';
import type { SaveManager } from './SaveManager';

type Wave = OscillatorType;
const SCALES: Record<MusicMode, { notes: number[]; bass: number[]; tempo: number; wave: Wave }> = {
  menu: { notes: [261.6, 329.6, 392, 523.3, 392, 329.6, 293.7, 349.2], bass: [130.8, 98, 110, 87.3], tempo: 330, wave: 'triangle' },
  game: { notes: [220, 261.6, 329.6, 293.7, 220, 261.6, 392, 329.6], bass: [110, 110, 87.3, 98], tempo: 240, wave: 'triangle' },
  boss: { notes: [196, 233.1, 293.7, 233.1, 196, 207.7, 277.2, 233.1], bass: [98, 98, 103.8, 92.5], tempo: 170, wave: 'sawtooth' },
};

/** Procedural WebAudio sound: no audio files needed, fails silently when audio is unsupported. */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: number | null = null;
  private mode: MusicMode | null = null;
  private step = 0;

  constructor(private readonly save: SaveManager) {}

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
        this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.5; this.sfxGain.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.16; this.musicGain.connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  }

  /** Call from a user gesture to satisfy browser autoplay rules. */
  unlock(): void { this.ensure(); if (this.mode) this.startLoop(); }

  private tone(freq: number, dur: number, type: Wave, vol: number, slide = 0, delay = 0, music = false): void {
    const ctx = this.ensure();
    const bus = music ? this.musicGain : this.sfxGain;
    if (!ctx || !bus) return;
    try {
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + dur + 0.02);
    } catch { /* ignore audio failures */ }
  }

  private noise(dur: number, vol: number, freq: number, delay = 0): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || !this.noiseBuf) return;
    try {
      const t = ctx.currentTime + delay;
      const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t); src.stop(t + dur + 0.02);
    } catch { /* ignore */ }
  }

  play(name: SfxName): void {
    if (!this.save.d.settings.sound) return;
    switch (name) {
      case 'click': this.tone(600, 0.06, 'square', 0.12, 200); break;
      case 'draw': this.tone(140, 0.28, 'sawtooth', 0.07, 160); break;
      case 'release': this.tone(900, 0.12, 'triangle', 0.14, -600); this.noise(0.1, 0.25, 3000); break;
      case 'impact': this.tone(180, 0.1, 'square', 0.2, -100); this.noise(0.08, 0.3, 1800); break;
      case 'thud': this.tone(110, 0.1, 'sine', 0.2, -50); break;
      case 'clank': this.tone(1200, 0.12, 'square', 0.15, -300); this.tone(1800, 0.08, 'square', 0.08, -600); break;
      case 'headshot': this.tone(880, 0.1, 'square', 0.2); this.tone(1320, 0.18, 'square', 0.2, 0, 0.08); this.noise(0.12, 0.3, 4000); break;
      case 'death': this.tone(300, 0.3, 'sawtooth', 0.15, -230); break;
      case 'explosion': this.noise(0.6, 0.6, 700); this.tone(80, 0.5, 'sine', 0.4, -50); break;
      case 'powerup': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.16, 0, i * 0.07)); break;
      case 'combo': this.tone(660, 0.08, 'triangle', 0.14); this.tone(880, 0.1, 'triangle', 0.14, 0, 0.06); break;
      case 'coin': this.tone(1318, 0.05, 'square', 0.1); this.tone(1760, 0.1, 'square', 0.1, 0, 0.05); break;
      case 'hurt': this.tone(160, 0.25, 'sawtooth', 0.25, -100); this.noise(0.15, 0.3, 900); break;
      case 'boss': this.tone(70, 0.9, 'sawtooth', 0.3, -20); this.tone(140, 0.9, 'square', 0.12, -40); break;
      case 'star': this.tone(784, 0.2, 'triangle', 0.2); this.tone(1175, 0.3, 'triangle', 0.18, 0, 0.1); break;
      case 'victory': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.2, 0, i * 0.13)); break;
      case 'gameover': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.35, 'sawtooth', 0.14, 0, i * 0.22)); break;
    }
  }

  playMusic(mode: MusicMode): void {
    if (this.mode === mode && this.timer !== null) return;
    this.mode = mode;
    this.startLoop();
  }
  stopMusic(): void { this.mode = null; this.clearLoop(); }
  /** Re-evaluates settings (call after toggling music). */
  refresh(): void { if (this.mode) this.startLoop(); }

  private clearLoop(): void { if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; } }
  private startLoop(): void {
    this.clearLoop();
    if (!this.mode || !this.save.d.settings.music || !this.ensure()) return;
    const cfg = SCALES[this.mode];
    this.step = 0;
    this.timer = window.setInterval(() => {
      if (!this.save.d.settings.music) return;
      const n = cfg.notes[this.step % cfg.notes.length];
      this.tone(n, cfg.tempo / 1000 * 1.4, cfg.wave, 0.5, 0, 0, true);
      if (this.step % 2 === 0) this.tone(cfg.bass[(this.step / 2) % cfg.bass.length | 0], cfg.tempo / 1000 * 2, 'sine', 0.7, 0, 0, true);
      this.step++;
    }, cfg.tempo);
  }
}
