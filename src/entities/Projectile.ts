import Phaser from 'phaser';
import { TEX } from '../config/AssetConfig';

/** Enemy projectile (arrows, magic orbs, falling rocks). Pooled by EnemySystem. */
export class Projectile extends Phaser.GameObjects.Image {
  vx = 0; vy = 0; damage = 0; gravity = 0; radius = 12;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, TEX.orb);
    this.setDepth(25).setBlendMode(Phaser.BlendModes.ADD);
    scene.add.existing(this);
    this.kill();
  }

  fire(x: number, y: number, vx: number, vy: number, damage: number, color: number, gravity = 0, scale = 1): void {
    this.setPosition(x, y).setTint(color).setScale(scale).setActive(true).setVisible(true);
    this.vx = vx; this.vy = vy; this.damage = damage; this.gravity = gravity; this.radius = 11 * scale;
  }
  kill(): void { this.setActive(false).setVisible(false); }
}
