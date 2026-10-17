import Phaser from 'phaser';

export class ProgressBar extends Phaser.GameObjects.Container {
  protected readonly fill: Phaser.GameObjects.Rectangle;
  protected readonly back: Phaser.GameObjects.Rectangle;
  protected ratio = 1;
  readonly barW: number;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, color = 0x66dd55) {
    super(scene, x, y);
    this.barW = w;
    this.back = scene.add.rectangle(0, 0, w + 6, h + 6, 0x10131c, 0.85).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff, 0.25);
    this.fill = scene.add.rectangle(3, 0, w, h, color).setOrigin(0, 0.5);
    this.add([this.back, this.fill]);
    scene.add.existing(this);
  }

  set(ratio: number): void {
    this.ratio = Math.min(1, Math.max(0, ratio));
    this.fill.scaleX = this.ratio;
  }
  setColor(c: number): void { this.fill.setFillStyle(c); }
}
