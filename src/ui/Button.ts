import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/AssetConfig';
import { services } from '../systems/Services';

export function txt(scene: Phaser.Scene, x: number, y: number, text: string, size = 24, color = '#ffffff', origin: [number, number] = [0.5, 0.5], bold = true): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT_FAMILY, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal',
    stroke: '#10131c', strokeThickness: Math.max(2, Math.round(size / 7)),
  }).setOrigin(origin[0], origin[1]);
}

export interface ButtonOpts { w?: number; h?: number; color?: number; fontSize?: number; textColor?: string }

/** Large, touch-friendly button with hover/press feedback and click sound. */
export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly shine: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private enabled = true;
  private down = false;
  private baseColor: number;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, private readonly onClick: () => void, opts: ButtonOpts = {}) {
    super(scene, x, y);
    const w = opts.w ?? 260, h = opts.h ?? 64;
    this.baseColor = opts.color ?? 0xc9822b;
    this.bg = scene.add.rectangle(0, 0, w, h, this.baseColor).setStrokeStyle(4, 0x10131c);
    this.shine = scene.add.rectangle(0, -h / 4, w - 8, h / 2 - 4, 0xffffff, 0.18);
    this.label = txt(scene, 0, 0, text, opts.fontSize ?? 28, opts.textColor ?? '#ffffff');
    this.add([this.bg, this.shine, this.label]);
    this.setSize(w, h);
    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerover', () => { if (this.enabled) this.setScale(1.04); });
    this.bg.on('pointerout', () => { this.down = false; this.setScale(1); });
    this.bg.on('pointerdown', () => { if (this.enabled) { this.down = true; this.setScale(0.96); } });
    this.bg.on('pointerup', () => {
      this.setScale(1);
      if (!this.enabled || !this.down) return;
      this.down = false;
      services(scene).audio.play('click');
      this.onClick();
    });
    scene.add.existing(this);
  }

  setLabel(t: string): this { this.label.setText(t); return this; }
  setColor(c: number): this { this.baseColor = c; if (this.enabled) this.bg.setFillStyle(c); return this; }
  setEnabled(on: boolean): this {
    this.enabled = on;
    this.bg.setFillStyle(on ? this.baseColor : 0x555a66);
    this.label.setAlpha(on ? 1 : 0.6);
    return this;
  }
  setOutline(color: number): this { this.bg.setStrokeStyle(4, color); return this; }
}
