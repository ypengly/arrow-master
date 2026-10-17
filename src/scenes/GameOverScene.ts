import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { MODE_INFO } from '../data/GameData';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { services } from '../systems/Services';
import type { ResultData } from '../types/GameTypes';
import { Button, txt } from '../ui/Button';
import { toast } from '../ui/Dialog';
import { formatNumber, formatTime } from '../utils/MathUtils';

export class GameOverScene extends Phaser.Scene {
  private res!: ResultData;
  private bg!: BackgroundSystem;
  constructor() { super('GameOver'); }
  init(data: ResultData): void { this.res = data; }

  create(): void {
    const sv = services(this), s = this.res.summary;
    this.cameras.main.fadeIn(300);
    this.bg = new BackgroundSystem(this, 'dungeon');
    sv.audio.playMusic('menu');
    this.add.rectangle(GAME_WIDTH / 2, 360, 700, 520, 0x1d2335, 0.94).setStrokeStyle(5, 0xc0392b).setDepth(5);
    const endlessLike = s.mode === 'endless';
    txt(this, GAME_WIDTH / 2, 130, endlessLike ? 'SIEGE ENDED' : s.mode === 'precision' ? 'OUT OF ARROWS' : 'DEFEATED', 56, '#ff5544').setDepth(6);
    txt(this, GAME_WIDTH / 2, 190, MODE_INFO[s.mode].label, 24, '#b8c2d8').setDepth(6);
    const rows: Array<[string, string]> = [
      ['Score', formatNumber(s.score) + (s.newBest ? '   NEW BEST!' : '')], ['Kills', String(s.kills)], ['Headshots', String(s.headshots)],
      ['Accuracy', `${Math.round(s.accuracy * 100)}%`], ['Time', formatTime(s.time)], ['Coins earned', `+${formatNumber(s.coins)}`],
    ];
    rows.forEach(([k, v], i) => {
      txt(this, 480, 260 + i * 44, k, 26, '#b8c2d8', [0, 0.5], false).setDepth(6);
      txt(this, 740, 260 + i * 44, v, 28, k === 'Coins earned' ? '#ffd35a' : '#ffffff', [0, 0.5]).setDepth(6);
    });
    new Button(this, 480, 600, 'RETRY', () => this.scene.start('Game', { mode: s.mode, levelId: s.levelId }), { w: 230, color: 0x3f8f4f }).setDepth(6);
    new Button(this, 800, 600, 'MENU', () => this.scene.start('MainMenu'), { w: 230, color: 0x555a66 }).setDepth(6);
    new Button(this, 640, 520, 'UPGRADES', () => this.scene.start('Upgrade'), { w: 260, h: 54, fontSize: 24, color: 0x8a4fb0 }).setDepth(6);
    this.res.notes.forEach((n, i) => this.time.delayedCall(900 + i * 3000, () => toast(this, n.title, n.sub)));
  }

  update(_t: number, delta: number): void { this.bg.update(delta / 1000, this.input.activePointer.x); }
}
