import Phaser from 'phaser';
import { txt } from './Button';
import { services } from '../systems/Services';

export function drawStar(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number): void {
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.45 : r;
    pts.push({ x: x + Math.cos(a) * rad, y: y + Math.sin(a) * rad });
  }
  g.fillStyle(color, 1).fillPoints(pts, true);
  g.lineStyle(2, 0x10131c, 1).strokePoints(pts, true);
}

export interface LevelCardInfo { id: number; unlocked: boolean; stars: number; best: number; boss: boolean }

/** Map node: number, stars, lock / boss marker. */
export class LevelCard extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, info: LevelCardInfo, onClick: () => void) {
    super(scene, x, y);
    const g = scene.add.graphics();
    const col = !info.unlocked ? 0x555a66 : info.boss ? 0xc0392b : info.stars >= 3 ? 0xffc83a : 0x3f8f4f;
    g.fillStyle(0x000000, 0.35).fillCircle(3, 5, 44);
    g.fillStyle(col, 1).fillCircle(0, 0, 42).lineStyle(5, 0x10131c, 1).strokeCircle(0, 0, 42);
    g.fillStyle(0xffffff, 0.2).fillCircle(-8, -12, 24);
    for (let i = 0; i < 3; i++) drawStar(g, (i - 1) * 24, 58, 10, i < info.stars ? 0xffd35a : 0x39404f);
    this.add(g);
    if (info.unlocked) {
      this.add(txt(scene, 0, info.boss ? -6 : 0, String(info.id), 32));
      if (info.boss) this.add(txt(scene, 0, 20, 'BOSS', 14, '#ffd35a'));
    } else {
      const lk = scene.add.graphics();
      lk.fillStyle(0xcfd5e0, 1).fillRoundedRect(-14, -4, 28, 22, 4);
      lk.lineStyle(5, 0xcfd5e0, 1).beginPath().arc(0, -6, 9, Math.PI, 0, false).strokePath();
      lk.fillStyle(0x2b3040, 1).fillCircle(0, 6, 3.5);
      this.add(lk);
    }
    this.setSize(92, 130);
    if (info.unlocked) {
      this.setInteractive({ useHandCursor: true });
      this.on('pointerover', () => this.setScale(1.1));
      this.on('pointerout', () => this.setScale(1));
      this.on('pointerup', () => { services(scene).audio.play('click'); onClick(); });
    }
    scene.add.existing(this);
  }
}
