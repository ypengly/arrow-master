import Phaser from 'phaser';
import { TEX, ENV_THEMES, type WeatherKind } from '../config/AssetConfig';
import { GAME_WIDTH } from '../config/GameConfig';
import type { SaveManager } from './SaveManager';
import type { EnvironmentKind } from '../types/LevelTypes';

export type FxKind = 'impact' | 'headshot' | 'death' | 'fire' | 'ice' | 'lightning' | 'explosion' | 'victory' | 'coin' | 'poison' | 'spark' | 'dust' | 'heal';
type Cfg = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
interface Spec { cfg: Cfg; count: number }

const base = (o: Cfg): Cfg => ({ emitting: false, blendMode: 'ADD', alpha: { start: 1, end: 0 }, ...o });
const SPECS: Record<FxKind, Spec> = {
  impact:    { count: 10, cfg: base({ speed: { min: 60, max: 260 }, angle: { min: 0, max: 360 }, scale: { start: 0.5, end: 0 }, lifespan: { min: 200, max: 420 }, tint: [0xffffff, 0xffe9a0], gravityY: 500 }) },
  headshot:  { count: 28, cfg: base({ speed: { min: 100, max: 460 }, angle: { min: 0, max: 360 }, scale: { start: 0.8, end: 0 }, lifespan: { min: 300, max: 650 }, tint: [0xff3b3b, 0xffd35a, 0xffffff], gravityY: 400 }) },
  death:     { count: 18, cfg: base({ speed: { min: 60, max: 300 }, angle: { min: 0, max: 360 }, scale: { start: 0.7, end: 0 }, lifespan: { min: 300, max: 600 }, tint: [0xffffff, 0xffcc88, 0xaa7755], gravityY: 300 }) },
  fire:      { count: 5, cfg: base({ speed: { min: 20, max: 80 }, angle: { min: 240, max: 300 }, scale: { start: 0.55, end: 0 }, lifespan: { min: 300, max: 600 }, tint: [0xff5500, 0xffaa22], gravityY: -120 }) },
  ice:       { count: 16, cfg: base({ speed: { min: 40, max: 220 }, angle: { min: 0, max: 360 }, scale: { start: 0.5, end: 0 }, lifespan: { min: 300, max: 600 }, tint: [0x66ddff, 0xffffff], gravityY: 200 }) },
  lightning: { count: 14, cfg: base({ speed: { min: 80, max: 340 }, angle: { min: 0, max: 360 }, scale: { start: 0.4, end: 0 }, lifespan: { min: 150, max: 350 }, tint: [0xffee55, 0xffffff] }) },
  explosion: { count: 46, cfg: base({ speed: { min: 80, max: 520 }, angle: { min: 0, max: 360 }, scale: { start: 1.1, end: 0 }, lifespan: { min: 400, max: 800 }, tint: [0xffaa22, 0xff5500, 0x553322], gravityY: -40 }) },
  victory:   { count: 70, cfg: base({ speed: { min: 200, max: 650 }, angle: { min: 230, max: 310 }, scale: { start: 0.7, end: 0.1 }, lifespan: { min: 900, max: 1600 }, tint: [0xffd35a, 0xff77aa, 0x66ddff, 0x99ff77], gravityY: 500 }) },
  coin:      { count: 8, cfg: base({ speed: { min: 80, max: 240 }, angle: { min: 200, max: 340 }, scale: { start: 0.55, end: 0.1 }, lifespan: { min: 400, max: 700 }, tint: [0xffd35a, 0xfff2a8], gravityY: 600 }) },
  poison:    { count: 4, cfg: base({ speed: { min: 10, max: 50 }, angle: { min: 240, max: 300 }, scale: { start: 0.5, end: 0 }, lifespan: { min: 400, max: 800 }, tint: [0x66dd44, 0xaaff77], gravityY: -60 }) },
  spark:     { count: 6, cfg: base({ speed: { min: 50, max: 200 }, angle: { min: 0, max: 360 }, scale: { start: 0.35, end: 0 }, lifespan: { min: 150, max: 300 }, tint: [0xffffff, 0xffe9a0] }) },
  dust:      { count: 7, cfg: base({ speed: { min: 20, max: 110 }, angle: { min: 200, max: 340 }, scale: { start: 0.6, end: 0.1 }, lifespan: { min: 300, max: 600 }, tint: [0xb59a78, 0xd8c3a0], blendMode: 'NORMAL', alpha: { start: 0.7, end: 0 } }) },
  heal:      { count: 14, cfg: base({ speed: { min: 20, max: 120 }, angle: { min: 240, max: 300 }, scale: { start: 0.55, end: 0 }, lifespan: { min: 500, max: 900 }, tint: [0xff77aa, 0xffffff], gravityY: -100 }) },
};

interface WeatherSpec { tint: number[]; speedX: [number, number]; speedY: [number, number]; scale: [number, number]; alpha: number; freq: number; y: number; life: number }
const WEATHER: Record<WeatherKind, WeatherSpec> = {
  leaves: { tint: [0x9bd56b, 0xd4a24a], speedX: [-30, 30], speedY: [30, 80], scale: [0.35, 0.6], alpha: 0.8, freq: 380, y: -20, life: 9000 },
  sand:   { tint: [0xf0d49a, 0xd9b36a], speedX: [120, 220], speedY: [-10, 20], scale: [0.15, 0.3], alpha: 0.6, freq: 90, y: 200, life: 7000 },
  snow:   { tint: [0xffffff], speedX: [-25, 25], speedY: [40, 90], scale: [0.2, 0.45], alpha: 0.9, freq: 90, y: -20, life: 11000 },
  embers: { tint: [0xff7a22, 0xffcc44], speedX: [-20, 40], speedY: [-110, -40], scale: [0.2, 0.4], alpha: 0.9, freq: 140, y: 760, life: 8000 },
  dust:   { tint: [0xd8d2c0], speedX: [10, 50], speedY: [-5, 15], scale: [0.15, 0.3], alpha: 0.4, freq: 220, y: 300, life: 8000 },
  ash:    { tint: [0x999999], speedX: [-20, 20], speedY: [20, 50], scale: [0.2, 0.35], alpha: 0.5, freq: 200, y: -20, life: 10000 },
  motes:  { tint: [0xeaffc0, 0xffffff], speedX: [-15, 15], speedY: [-25, 5], scale: [0.15, 0.35], alpha: 0.7, freq: 220, y: 600, life: 9000 },
  fog:    { tint: [0x8899bb], speedX: [10, 40], speedY: [-5, 5], scale: [1.4, 2.4], alpha: 0.08, freq: 600, y: 520, life: 12000 },
};

export class ParticleSystem {
  private readonly emitters = new Map<FxKind, Phaser.GameObjects.Particles.ParticleEmitter>();

  constructor(private readonly scene: Phaser.Scene, private readonly save: SaveManager) {}

  private get scale(): number {
    const s = this.save.d.settings;
    return (s.quality === 'low' ? 0.35 : s.quality === 'medium' ? 0.7 : 1) * (s.reducedMotion ? 0.6 : 1);
  }

  burst(kind: FxKind, x: number, y: number, mult = 1): void {
    let em = this.emitters.get(kind);
    if (!em) {
      em = this.scene.add.particles(0, 0, TEX.dot, SPECS[kind].cfg).setDepth(40);
      this.emitters.set(kind, em);
    }
    em.explode(Math.max(1, Math.round(SPECS[kind].count * this.scale * mult)), x, y);
  }

  weather(env: EnvironmentKind): void {
    const w = WEATHER[ENV_THEMES[env].weather];
    const s = this.save.d.settings;
    const freq = w.freq * (s.quality === 'low' ? 2.5 : s.quality === 'medium' ? 1.5 : 1) * (s.reducedMotion ? 3 : 1);
    this.scene.add.particles(0, w.y, TEX.dot, {
      x: { min: 0, max: GAME_WIDTH + 100 }, lifespan: w.life, frequency: freq, quantity: 1,
      speedX: { min: w.speedX[0], max: w.speedX[1] }, speedY: { min: w.speedY[0], max: w.speedY[1] },
      scale: { min: w.scale[0], max: w.scale[1] }, alpha: w.alpha, tint: w.tint,
    }).setDepth(4);
  }
}
