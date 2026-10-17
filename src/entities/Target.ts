import Phaser from 'phaser';
import { TEX } from '../config/AssetConfig';
import type { Circle } from '../utils/PhysicsUtils';

export const TARGET_RADIUS = 30;
export const TARGET_LIFETIME = 24;

/** Floating bullseye training target; moves vertically on later levels. */
export class Target extends Phaser.GameObjects.Image {
  readonly circle: Circle;
  readonly moving: boolean;
  dead = false;
  ttl = TARGET_LIFETIME;
  private readonly baseY: number; private readonly amp: number; private readonly speed: number; private readonly phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number, moving: boolean) {
    super(scene, x, y, TEX.target);
    this.moving = moving; this.baseY = y; this.amp = moving ? 70 : 0; this.speed = 1.2 + Math.random() * 1.2; this.phase = Math.random() * 6.28;
    this.circle = { x, y, r: TARGET_RADIUS };
    this.setDepth(12);
    scene.add.existing(this);
  }

  tick(dt: number, time: number): void {
    this.ttl -= dt;
    if (this.moving) this.y = this.baseY + Math.sin(time / 1000 * this.speed + this.phase) * this.amp;
    this.circle.x = this.x; this.circle.y = this.y;
    if (this.ttl < 3) this.setAlpha(0.5 + 0.5 * Math.sin(time / 80));
  }

  /** 0 = dead centre, 1 = edge. */
  ringFor(px: number, py: number): number { return Math.hypot(px - this.x, py - this.y) / TARGET_RADIUS; }
}
