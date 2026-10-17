import { BOSS_ORDER } from '../config/EnemyConfig';
import type { GameMode } from '../types/GameTypes';
import type { LevelData } from '../types/LevelTypes';
import { pick, shuffle } from '../utils/RandomUtils';

export interface WaveCallbacks { spawn(type: string): void; waveStart(n: number, total: number | null): void }

function endlessWave(n: number): string[] {
  const pool = ['basic'];
  if (n >= 2) pool.push('fast'); if (n >= 3) pool.push('shield'); if (n >= 4) pool.push('archer');
  if (n >= 5) pool.push('armored'); if (n >= 7) pool.push('mage'); if (n >= 9) pool.push('elite');
  const out: string[] = [];
  const count = Math.min(16, 4 + Math.floor(n * 1.3));
  for (let i = 0; i < count; i++) out.push(pick(pool));
  if (n % 10 === 0) out.push(`boss:${BOSS_ORDER[(n / 10 - 1) % BOSS_ORDER.length]}`);
  return out;
}

/** Turns level JSON (or an endless generator) into timed spawns, wave by wave. */
export class WaveSystem {
  readonly endless: boolean;
  readonly totalWaves: number | null;
  done = false;
  waveNo = 0;
  private readonly waves: string[][] = [];
  private cur: string[] = [];
  private state: 'pause' | 'spawning' | 'waitClear' = 'pause';
  private timer = 1.8;
  private readonly interval: number;
  private readonly pauseLen: number;

  constructor(level: LevelData, mode: GameMode) {
    this.endless = !!level.endless && !level.bossRush;
    this.pauseLen = mode === 'bossRush' ? 3 : 2.2;
    const diff = level.difficulty ?? level.id;
    this.interval = mode === 'timeAttack' ? 0.7 : Math.min(2.3, Math.max(0.8, 2.3 - diff * 0.012));
    if (level.bossRush) {
      for (const b of BOSS_ORDER) this.waves.push([`boss:${b}`]);
    } else if (!level.endless) {
      const list: string[] = [];
      for (const e of level.enemies) for (let i = 0; i < e.count; i++) list.push(e.type);
      shuffle(list);
      const n = Math.max(1, level.waves ?? 1);
      const size = Math.ceil(list.length / n);
      for (let i = 0; i < n; i++) { const w = list.slice(i * size, (i + 1) * size); if (w.length) this.waves.push(w); }
      if (level.boss) this.waves.push([`boss:${level.boss}`]);
    }
    this.totalWaves = this.endless ? null : this.waves.length;
  }

  update(dt: number, alive: number, cb: WaveCallbacks): void {
    if (this.done) return;
    if (this.state === 'pause') {
      this.timer -= dt;
      if (this.timer > 0) return;
      if (this.endless) this.cur = endlessWave(this.waveNo + 1);
      else if (this.waveNo >= this.waves.length) { this.done = true; return; }
      else this.cur = [...this.waves[this.waveNo]];
      this.waveNo++; this.state = 'spawning'; this.timer = 0;
      cb.waveStart(this.waveNo, this.totalWaves);
    } else if (this.state === 'spawning') {
      this.timer -= dt;
      if (this.timer <= 0 && this.cur.length) {
        cb.spawn(this.cur.shift() as string);
        this.timer = this.interval;
      }
      if (this.cur.length === 0) this.state = 'waitClear';
    } else if (alive === 0) { this.state = 'pause'; this.timer = this.pauseLen; }
  }

  /** Debug / skip helper. */
  forceFinish(): void { this.waves.length = 0; this.cur.length = 0; this.done = true; }
}
