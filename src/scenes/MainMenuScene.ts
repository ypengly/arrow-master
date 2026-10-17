import Phaser from 'phaser';
import { TEX } from '../config/AssetConfig';
import { GAME_WIDTH } from '../config/GameConfig';
import { ACHIEVEMENTS } from '../data/GameData';
import { AchievementSystem } from '../systems/AchievementSystem';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { services } from '../systems/Services';
import { Button, txt } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { formatNumber } from '../utils/MathUtils';

export class MainMenuScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  constructor() { super('MainMenu'); }

  create(): void {
    const sv = services(this);
    this.cameras.main.fadeIn(350, 16, 19, 28);
    this.bg = new BackgroundSystem(this, 'forest');
    new ParticleSystem(this, sv.save).weather('forest');
    sv.audio.playMusic('menu');

    const bow = this.add.image(GAME_WIDTH / 2, 118, TEX.bow).setScale(1.5).setDepth(5);
    this.add.image(GAME_WIDTH / 2 + 10, 118, 'arrow_fire').setOrigin(0.5).setScale(1.2).setDepth(6);
    this.tweens.add({ targets: bow, angle: { from: -4, to: 4 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const title = txt(this, GAME_WIDTH / 2, 218, 'ARROW MASTER', 92, '#ffd35a').setDepth(5);
    this.tweens.add({ targets: title, scale: { from: 1, to: 1.04 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const d = sv.save.d, last = sv.levels.count;
    const go = (key: string, data?: object): void => { this.cameras.main.fadeOut(200, 16, 19, 28); this.time.delayedCall(200, () => this.scene.start(key, data)); };
    const items: Array<[string, () => void, number]> = [
      ['PLAY', () => go('Game', { mode: 'campaign', levelId: Math.min(d.unlocked, last) }), 0xc9822b],
      ['LEVELS', () => go('LevelSelect'), 0x3f8f4f],
      ['ARMORY', () => go('Armory'), 0x3a6fb0],
      ['UPGRADES', () => go('Upgrade'), 0x8a4fb0],
      ['SETTINGS', () => go('Settings'), 0x555a66],
    ];
    items.forEach(([label, fn, color], i) => new Button(this, GAME_WIDTH / 2, 330 + i * 76, label, fn, { w: 320, h: 64, color, fontSize: 32 }).setDepth(6));

    this.add.image(GAME_WIDTH - 210, 60, TEX.coin).setScale(1.6).setDepth(6);
    txt(this, GAME_WIDTH - 184, 60, formatNumber(d.coins), 32, '#ffffff', [0, 0.5]).setDepth(6);

    const ach = new AchievementSystem(sv.save), daily = ach.dailyStatus();
    this.add.rectangle(1080, 440, 340, 190, 0x1d2335, 0.92).setStrokeStyle(4, 0xffd35a).setDepth(5);
    txt(this, 1080, 372, 'DAILY CHALLENGE', 24, '#ffd35a').setDepth(6);
    txt(this, 1080, 428, daily.text, 20, '#e8ecf5', [0.5, 0.5], false).setWordWrapWidth(300).setAlign('center').setDepth(6);
    txt(this, 1080, 488, daily.done ? 'COMPLETED' : `${daily.progress}/${daily.target}   Reward ${daily.reward}`, 22, daily.done ? '#66dd55' : '#ffffff').setDepth(6);

    new Button(this, 200, 660, 'ACHIEVEMENTS', () => {
      const lines = ACHIEVEMENTS.map(a => `${d.achievements.includes(a.id) ? '[x]' : '[ ]'} ${a.name}: ${a.desc}`).join('\n');
      new Dialog(this, 'ACHIEVEMENTS', lines, [{ label: 'CLOSE' }], 520, 22);
    }, { w: 300, h: 56, fontSize: 22, color: 0x3b4560 }).setDepth(6);
    txt(this, GAME_WIDTH / 2, 700, 'Hold to charge  -  release to shoot  -  aim for the head', 20, '#ffffff', [0.5, 0.5], false).setDepth(6).setAlpha(0.8);
  }

  update(_t: number, delta: number): void { this.bg.update(delta / 1000, this.input.activePointer.x); }
}
