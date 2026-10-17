import { COMBO_CFG } from '../config/GameConfig';

export class ComboSystem {
  count = 0;
  best = 0;
  private last = 0;

  get multiplier(): number { return Math.min(COMBO_CFG.maxMult, Math.max(1, this.count)); }

  hit(nowMs: number): number {
    if (nowMs - this.last > COMBO_CFG.windowMs) this.count = 0;
    this.count++;
    this.last = nowMs;
    this.best = Math.max(this.best, this.count);
    return this.multiplier;
  }
  miss(): void { this.count = 0; }
  update(nowMs: number): void { if (this.count > 0 && nowMs - this.last > COMBO_CFG.windowMs) this.count = 0; }
}
