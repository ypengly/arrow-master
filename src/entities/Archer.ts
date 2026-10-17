import Phaser from 'phaser';
import { TEX, arrowTex } from '../config/AssetConfig';
import { ARCHER, GROUND_Y } from '../config/GameConfig';
import type { ArrowKind } from '../types/WeaponTypes';
import type { Point } from '../utils/PhysicsUtils';

const ARROW_LEN = 64;
const STRING_X = 9;

export class Archer extends Phaser.GameObjects.Container {
  private readonly bodyImg: Phaser.GameObjects.Image;
  private readonly headImg: Phaser.GameObjects.Image;
  private readonly pivot: Phaser.GameObjects.Container;
  private readonly arrowImg: Phaser.GameObjects.Image;
  private readonly stringG: Phaser.GameObjects.Graphics;
  private recoil = 0;
  private pull = 0;
  private readonly pivotPt: Point = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number) {
    super(scene, x, GROUND_Y);
    this.bodyImg = scene.add.image(0, 0, TEX.archerBody).setOrigin(0.5, 1);
    this.headImg = scene.add.image(4, -68, TEX.archerHead);
    this.pivot = scene.add.container(10, ARCHER.bowPivotY);
    const bow = scene.add.image(0, 0, TEX.bow);
    this.arrowImg = scene.add.image(0, 0, arrowTex('normal')).setOrigin(1, 0.5);
    this.stringG = scene.add.graphics();
    this.pivot.add([this.stringG, bow, this.arrowImg]);
    this.add([this.bodyImg, this.headImg, this.pivot]);
    this.setDepth(14);
    scene.add.existing(this);
  }

  get pivotWorld(): Point { this.pivotPt.x = this.x + 10; this.pivotPt.y = this.y + ARCHER.bowPivotY; return this.pivotPt; }
  setArrowKind(kind: ArrowKind): void { this.arrowImg.setTexture(arrowTex(kind)); }
  tipOffset(): number { return STRING_X - this.pull + ARROW_LEN; }

  /** Pivot-relative arrow tip for the current draw. */
  bowTip(angle: number): Point {
    const p = this.pivotWorld; const l = this.tipOffset();
    return { x: p.x + Math.cos(angle) * l, y: p.y + Math.sin(angle) * l };
  }

  setAim(angle: number, power: number, nocked: boolean, time: number): void {
    this.pivot.rotation = angle;
    this.headImg.rotation = angle * 0.35;
    this.pull = ARCHER.maxPull * power;
    this.arrowImg.setVisible(nocked).x = STRING_X - this.pull + ARROW_LEN;
    this.stringG.clear().lineStyle(2, 0xf0e6d2, 1).beginPath();
    this.stringG.moveTo(STRING_X, -46).lineTo(STRING_X - this.pull, 0).lineTo(STRING_X, 46).strokePath();
    this.recoil *= 0.82;
    this.bodyImg.x = -this.recoil; this.bodyImg.y = Math.sin(time / 420) * 1.2;
    this.pivot.x = 10 - this.recoil * 0.6;
  }

  kick(): void { this.recoil = 7; }
  moveTo(x: number): void { this.x = x; }
}
