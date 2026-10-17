import Phaser from 'phaser';
import { arrowTex } from '../config/AssetConfig';
import { PHYSICS } from '../config/GameConfig';
import type { ArrowKind } from '../types/WeaponTypes';

export interface Anchor { x: number; y: number; dead: boolean; active: boolean }

export class Arrow extends Phaser.GameObjects.Image {
  vx = 0; vy = 0; kind: ArrowKind = 'normal'; damage = 1; pierceLeft = 0; gravityScale = 1;
  stuck = false; stuckT = 0; age = 0; startX = 0; didHit = false; splitDone = false; isChild = false; power = 1;
  readonly hits = new Set<unknown>();
  private anchor: Anchor | null = null; private offX = 0; private offY = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, arrowTex('normal'));
    this.setOrigin(1, 0.5).setDepth(20);
    scene.add.existing(this);
    this.kill();
  }

  launch(x: number, y: number, vx: number, vy: number, kind: ArrowKind, damage: number, pierce: number, gravityScale: number, power: number, child: boolean): void {
    this.setTexture(arrowTex(kind)).setPosition(x, y).setActive(true).setVisible(true).setAlpha(1);
    this.vx = vx; this.vy = vy; this.kind = kind; this.damage = damage; this.pierceLeft = pierce; this.gravityScale = gravityScale;
    this.stuck = false; this.age = 0; this.startX = x; this.didHit = false; this.splitDone = child; this.isChild = child; this.power = power;
    this.anchor = null; this.hits.clear(); this.rotation = Math.atan2(vy, vx);
  }

  stick(anchor?: Anchor): void {
    this.stuck = true; this.stuckT = PHYSICS.stickMs; this.vx = 0; this.vy = 0;
    if (anchor) { this.anchor = anchor; this.offX = this.x - anchor.x; this.offY = this.y - anchor.y; }
  }

  /** Follows the enemy it is stuck into; detaches (and fades quickly) once the host dies. */
  followAnchor(): void {
    if (!this.anchor) return;
    if (this.anchor.dead || !this.anchor.active) { this.anchor = null; this.stuckT = Math.min(this.stuckT, 350); return; }
    this.x = this.anchor.x + this.offX; this.y = this.anchor.y + this.offY;
  }

  kill(): void { this.setActive(false).setVisible(false); this.stuck = false; this.anchor = null; this.hits.clear(); }
}
