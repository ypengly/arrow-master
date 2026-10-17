import { PHYSICS } from '../config/GameConfig';
import { angleLerp, clamp, damp } from '../utils/MathUtils';
import type { Point } from '../utils/PhysicsUtils';

const MIN_ANGLE = -1.5, MAX_ANGLE = 0.6;

/** Smooth aim + charge state. Pointer position drives the angle; hold time drives power. */
export class AimSystem {
  angle = -0.25;
  power = 0;
  charging = false;
  private target = -0.25;
  private startT = 0;

  constructor(private readonly pivot: () => Point, private readonly chargeMs: () => number) {}

  setPointer(px: number, py: number): void {
    const p = this.pivot(); const dx = px - p.x, dy = py - p.y;
    this.target = dx < 20 ? (dy < 0 ? MIN_ANGLE : MAX_ANGLE) : clamp(Math.atan2(dy, dx), MIN_ANGLE, MAX_ANGLE);
  }
  begin(nowMs: number): void { this.charging = true; this.startT = nowMs; this.power = 0; }
  update(nowMs: number, dt: number): void {
    this.angle = angleLerp(this.angle, this.target, damp(20, dt));
    if (this.charging) this.power = clamp((nowMs - this.startT) / this.chargeMs(), 0, 1);
  }
  release(): { angle: number; power: number } | null {
    if (!this.charging) return null;
    this.charging = false;
    const power = Math.max(PHYSICS.minPower, this.power);
    this.power = 0;
    return { angle: this.angle, power };
  }
  cancel(): void { this.charging = false; this.power = 0; }
}
