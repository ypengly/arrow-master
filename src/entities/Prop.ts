import Phaser from 'phaser';
import { TEX } from '../config/AssetConfig';
import { GROUND_Y } from '../config/GameConfig';
import type { Rect } from '../utils/PhysicsUtils';

export type PropKind = 'barrel' | 'crate' | 'cover';
const SIZE: Record<PropKind, { w: number; h: number; tex: string }> = {
  barrel: { w: 40, h: 56, tex: TEX.barrel }, crate: { w: 46, h: 46, tex: TEX.crate }, cover: { w: 80, h: 120, tex: TEX.cover },
};

/** Barrels explode, crates break, covers block arrows (and hide enemies). */
export class Prop extends Phaser.GameObjects.Image {
  readonly kind: PropKind;
  readonly rect: Rect;
  dead = false;

  constructor(scene: Phaser.Scene, kind: PropKind, x: number) {
    const s = SIZE[kind];
    super(scene, x, GROUND_Y + 2, s.tex);
    this.kind = kind;
    this.setOrigin(0.5, 1).setDepth(kind === 'cover' ? 9 : 8);
    this.rect = { x: x - s.w / 2, y: GROUND_Y - s.h, w: s.w, h: s.h };
    scene.add.existing(this);
  }

  get blocksArrows(): boolean { return this.kind === 'cover'; }

  destroyProp(): void { this.dead = true; this.destroy(); }
}
