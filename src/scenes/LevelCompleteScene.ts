import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { MODE_INFO } from '../data/GameData';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { services } from '../systems/Services';
import type { ResultData } from '../types/GameTypes';
import { Button, txt } from '../ui/Button';
import { toast } from '../ui/Dialog';
import { drawStar } from '../ui/LevelCard';
import { formatNumber, formatTime } from '../utils/MathUtils';

export class LevelCompleteScene extends Phaser.Scene {
  private res!: ResultData;
  private bg!: BackgroundSystem;
  constructor() { super('LevelComplete'); }
  init(data: ResultData): void { this.res = data; }

  create(): void {
    const sv = services(this), s = this.res.summary;
    this.cameras.main.fadeIn(300);
    this.bg = new BackgroundSystem(this, sv.levels.get(s.levelId)?.environment ?? 'temple');
    const fx = new ParticleSystem(this, sv.save);
    sv.audio.playMusic('menu');
    const campaignLike = s.mode === 'campaign' || s.mode === 'precision';
    this.add.rectangle(GAME_WIDTH / 2, 370, 760, 560, 0x1d2335, 0.94).setStrokeStyle(5, 0xffd35a).setDepth(5);
    txt(this, GAME_WIDTH / 2, 120, campaignLike ? 'LEVEL COMPLETE!' : s.mode === 'timeAttack' ? "TIME'S UP!" : 'VICTORY!', 56, '#ffd35a').setDepth(6);
    if (campaignLike) {
      const g = this.add.graphics().setDepth(6);
      for (let i = 0; i < 3; i++) {
        const x = GAME_WIDTH / 2 + (i - 1) * 110, y = 215 + (i === 1 ? -18 : 0);
        drawStar(g, x, y, 46, 0x39404f);
        if (i < s.stars) {
          const st = this.add.graphics({ x, y }).setDepth(7).setScale(0);
          drawStar(st, 0, 0, 46, 0xffd35a);
          this.tweens.add({ targets: st, scale: 1, duration: 420, delay: 500 + i * 450, ease: 'Back.easeOut',
            onStart: () => { sv.audio.play('star'); fx.burst('coin', x, y); } });
        }
      }
    } else txt(this, GAME_WIDTH / 2, 215, MODE_INFO[s.mode].label.toUpperCase(), 36, '#ffffff').setDepth(6);
    const rows: Array<[string, string]> = [
      ['Score', formatNumber(s.score) + (s.newBest ? '   NEW BEST!' : '')], ['Accuracy', `${Math.round(s.accuracy * 100)}%`],
      ['Headshots', String(s.headshots)], ['Kills', String(s.kills)], ['Best combo', `x${s.maxCombo}`], ['Time', formatTime(s.time)], ['Coins earned', `+${formatNumber(s.coins)}`],
    ];
    rows.forEach(([k, v], i) => {
      txt(this, 520, 310 + i * 40, k, 26, '#b8c2d8', [0, 0.5], false).setDepth(6);
      txt(this, 760, 310 + i * 40, v, 28, k === 'Coins earned' ? '#ffd35a' : '#ffffff', [0, 0.5]).setDepth(6);
    });
    const last = sv.levels.count;
    const canNext = s.mode === 'campaign' && s.levelId < last;
    if (canNext) new Button(this, 400, 640, 'NEXT LEVEL', () => this.scene.start('Game', { mode: 'campaign', levelId: s.levelId + 1 }), { w: 260, color: 0x3f8f4f }).setDepth(6);
    new Button(this, canNext ? 680 : 480, 640, 'RETRY', () => this.scene.start('Game', { mode: s.mode, levelId: s.levelId }), { w: 220 }).setDepth(6);
    new Button(this, canNext ? 920 : 800, 640, 'MENU', () => this.scene.start('MainMenu'), { w: 200, color: 0x555a66 }).setDepth(6);
    this.time.delayedCall(600, () => fx.burst('victory', GAME_WIDTH / 2, 700));
    this.res.notes.forEach((n, i) => this.time.delayedCall(1400 + i * 3000, () => toast(this, n.title, n.sub)));
  }

  update(_t: number, delta: number): void { this.bg.update(delta / 1000, this.input.activePointer.x); }
}
