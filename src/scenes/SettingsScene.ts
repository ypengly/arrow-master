import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { services } from '../systems/Services';
import type { Quality } from '../types/GameTypes';
import { Button, txt } from '../ui/Button';
import { Dialog } from '../ui/Dialog';

const QUALITIES: Quality[] = ['low', 'medium', 'high'];

export class SettingsScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  constructor() { super('Settings'); }

  create(): void {
    const sv = services(this), s = sv.save.d.settings;
    this.cameras.main.fadeIn(250, 16, 19, 28);
    this.bg = new BackgroundSystem(this, 'snow');
    this.add.rectangle(GAME_WIDTH / 2, 360, 780, 600, 0x1d2335, 0.94).setStrokeStyle(5, 0xffd35a).setDepth(4);
    txt(this, GAME_WIDTH / 2, 100, 'SETTINGS', 52, '#ffd35a').setDepth(5);
    const onOff = (v: boolean): string => (v ? 'ON' : 'OFF');
    const rows: Array<{ label: string; value: () => string; click: () => void }> = [
      { label: 'Music', value: () => onOff(s.music), click: () => { s.music = !s.music; sv.audio.refresh(); } },
      { label: 'Sound', value: () => onOff(s.sound), click: () => { s.sound = !s.sound; } },
      { label: 'Vibration', value: () => onOff(s.vibration), click: () => { s.vibration = !s.vibration; } },
      { label: 'Effects Quality', value: () => s.quality.toUpperCase(), click: () => { s.quality = QUALITIES[(QUALITIES.indexOf(s.quality) + 1) % QUALITIES.length]; } },
      { label: 'Reduced Motion', value: () => onOff(s.reducedMotion), click: () => { s.reducedMotion = !s.reducedMotion; } },
    ];
    rows.forEach((r, i) => {
      const y = 190 + i * 78;
      txt(this, 330, y, r.label, 30, '#ffffff', [0, 0.5]).setDepth(5);
      const btn = new Button(this, 880, y, r.value(), () => { r.click(); sv.save.commit(); btn.setLabel(r.value()); }, { w: 200, h: 58, fontSize: 26, color: 0x3a6fb0 }).setDepth(5);
    });
    new Button(this, 440, 620, 'RESET SAVE', () => {
      new Dialog(this, 'RESET PROGRESS?', 'This permanently erases levels, coins,\nupgrades and achievements.', [
        { label: 'CANCEL', color: 0x555a66 },
        { label: 'ERASE', color: 0xc0392b, onClick: () => { sv.save.reset(); this.scene.restart(); } },
      ], 340);
    }, { w: 260, h: 56, fontSize: 22, color: 0xc0392b }).setDepth(5);
    new Button(this, 840, 620, 'BACK', () => this.scene.start('MainMenu'), { w: 260, h: 56, fontSize: 24, color: 0x555a66 }).setDepth(5);
  }

  update(_t: number, delta: number): void { this.bg.update(delta / 1000, this.input.activePointer.x); }
}
