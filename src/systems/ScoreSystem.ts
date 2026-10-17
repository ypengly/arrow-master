import { SCORE_VALUES } from '../config/GameConfig';

export interface HitFlags { head: boolean; long: boolean; moving: boolean; bullseye?: boolean }
export interface ScoreResult { points: number; label: string | null }

export class ScoreSystem {
  total = 0;

  hit(f: HitFlags, comboMult: number): ScoreResult {
    let p: number = f.head ? SCORE_VALUES.headshot : SCORE_VALUES.hit;
    if (f.bullseye) p += SCORE_VALUES.bullseye;
    if (f.long) p += SCORE_VALUES.longDistance;
    if (f.moving) p += SCORE_VALUES.moving;
    p += SCORE_VALUES.comboStep * (comboMult - 1);
    this.total += p;
    const label = f.head ? 'HEADSHOT!' : f.bullseye ? 'BULLSEYE!' : f.long ? 'LONG SHOT!' : null;
    return { points: p, label };
  }
  explosiveKill(): number { this.total += SCORE_VALUES.explosive; return SCORE_VALUES.explosive; }
  add(n: number): void { this.total += n; }
}
