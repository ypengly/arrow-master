import Phaser from 'phaser';
import { ProgressBar } from './ProgressBar';

/** Progress bar that shifts green to red and trails damage with a pale ghost bar. */
export class HealthBar extends ProgressBar {
  private readonly ghost: Phaser.GameObjects.Rectangle;
  private ghostRatio = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    super(scene, x, y, w, h);
    this.ghost = scene.add.rectangle(3, 0, w, h, 0xffffff, 0.55).setOrigin(0, 0.5);
    this.remove(this.fill); this.add([this.ghost, this.fill]);
  }

  override set(ratio: number): void {
    super.set(ratio);
    this.setColor(this.ratio > 0.5 ? 0x66dd55 : this.ratio > 0.25 ? 0xffc83a : 0xff4a3a);
    this.ghostRatio = this.ratio >= this.ghostRatio ? this.ratio : Math.max(this.ratio, this.ghostRatio - 0.012);
    this.ghost.scaleX = this.ghostRatio;
  }
}
