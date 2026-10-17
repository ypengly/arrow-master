import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { Button, txt } from './Button';

export interface DialogButton { label: string; color?: number; onClick?: () => void }

/** Modal dialog that blocks input beneath it. */
export class Dialog {
  private readonly objs: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, title: string, message: string, buttons: DialogButton[], panelH = 360, fontSize = 24) {
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    const dim = scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65).setDepth(500).setInteractive();
    const panel = scene.add.rectangle(cx, cy, 760, panelH, 0x1d2335).setStrokeStyle(5, 0xffd35a).setDepth(501);
    const t = txt(scene, cx, cy - panelH / 2 + 44, title, 38, '#ffd35a').setDepth(502);
    const m = txt(scene, cx, cy - 8, message, fontSize, '#e8ecf5', [0.5, 0.5], false).setDepth(502).setAlign('center').setWordWrapWidth(700);
    this.objs.push(dim, panel, t, m);
    const gap = 250, startX = cx - ((buttons.length - 1) * gap) / 2;
    buttons.forEach((b, i) => {
      const btn = new Button(scene, startX + i * gap, cy + panelH / 2 - 56, b.label, () => { this.close(); b.onClick?.(); }, { w: 220, h: 60, color: b.color ?? 0xc9822b, fontSize: 26 }).setDepth(503);
      this.objs.push(btn);
    });
  }

  close(): void { for (const o of this.objs) o.destroy(); this.objs.length = 0; }
}

/** Slide-in notification (achievements, rewards). */
export function toast(scene: Phaser.Scene, title: string, sub: string, color = 0xffd35a): void {
  const y0 = -80, y1 = 150 + Math.random() * 0;
  const bg = scene.add.rectangle(GAME_WIDTH / 2, y0, 560, 84, 0x1d2335, 0.96).setStrokeStyle(4, color).setDepth(600).setScrollFactor(0);
  const t = txt(scene, GAME_WIDTH / 2, y0 - 12, title, 28, '#ffd35a').setDepth(601).setScrollFactor(0);
  const s = txt(scene, GAME_WIDTH / 2, y0 + 20, sub, 20, '#e8ecf5', [0.5, 0.5], false).setDepth(601).setScrollFactor(0);
  scene.tweens.add({ targets: [bg], y: y1, duration: 350, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: [t], y: y1 - 12, duration: 350, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: [s], y: y1 + 20, duration: 350, ease: 'Back.easeOut' });
  scene.time.delayedCall(2800, () => scene.tweens.add({ targets: [bg, t, s], alpha: 0, duration: 400, onComplete: () => { bg.destroy(); t.destroy(); s.destroy(); } }));
}
