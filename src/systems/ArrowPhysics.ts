import Phaser from 'phaser';
import { COMBAT, GROUND_Y, PHYSICS } from '../config/GameConfig';
import { Arrow } from '../entities/Arrow';
import type { ArrowKind } from '../types/WeaponTypes';

export interface ArrowHooks {
  /** Test the swept segment; return true if the arrow was stopped (stuck or killed) by a collision. */
  test(a: Arrow, x1: number, y1: number, x2: number, y2: number): boolean;
  onSplit(a: Arrow): void;
  onGround(a: Arrow): void;
  onExpire(a: Arrow): void;
}

/** Pooled projectile integrator: gravity, rotation along velocity, ground sticking, expiry. */
export class ArrowPhysics {
  readonly active: Arrow[] = [];
  private readonly pool: Arrow[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  fire(x: number, y: number, vx: number, vy: number, kind: ArrowKind, damage: number, pierce: number, gravityScale: number, power: number, child = false): Arrow {
    if (this.active.length >= PHYSICS.maxArrows) this.recycleAt(this.oldestStuck());
    const a = this.pool.pop() ?? new Arrow(this.scene);
    a.launch(x, y, vx, vy, kind, damage, pierce, gravityScale, power, child);
    this.active.push(a);
    return a;
  }

  private oldestStuck(): number {
    const i = this.active.findIndex(a => a.stuck);
    return i >= 0 ? i : 0;
  }
  private recycleAt(i: number): void {
    const [a] = this.active.splice(i, 1);
    if (a) { a.kill(); this.pool.push(a); }
  }

  get inFlight(): number { let n = 0; for (const a of this.active) if (!a.stuck) n++; return n; }
  get last(): Arrow | undefined { for (let i = this.active.length - 1; i >= 0; i--) if (!this.active[i].stuck) return this.active[i]; return undefined; }

  update(dt: number, hooks: ArrowHooks): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const a = this.active[i];
      if (a.stuck) {
        a.followAnchor();
        a.stuckT -= dt * 1000;
        if (a.stuckT < 500) a.setAlpha(Math.max(0, a.stuckT / 500));
        if (a.stuckT <= 0) this.recycleAt(i);
        continue;
      }
      a.age += dt;
      const px = a.x, py = a.y;
      a.vy += PHYSICS.gravity * a.gravityScale * dt;
      a.x += a.vx * dt; a.y += a.vy * dt;
      a.rotation = Math.atan2(a.vy, a.vx);
      if (a.kind === 'split' && !a.splitDone && a.age >= COMBAT.splitDelay) { a.splitDone = true; hooks.onSplit(a); }
      if (hooks.test(a, px, py, a.x, a.y)) {
        if (!a.active) { this.recycleAt(i); continue; }
      }
      if (a.stuck) continue;
      if (a.y >= GROUND_Y) {
        a.y = GROUND_Y; a.stick(); hooks.onGround(a);
        if (!a.active) this.recycleAt(i);
        continue;
      }
      if (a.x > PHYSICS.boundsRight || a.x < PHYSICS.boundsLeft || a.y < PHYSICS.boundsTop) { hooks.onExpire(a); this.recycleAt(i); }
    }
  }

  clear(): void { while (this.active.length) this.recycleAt(0); }
}
