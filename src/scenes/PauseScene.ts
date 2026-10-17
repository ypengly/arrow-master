import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { Button, txt } from '../ui/Button';
import type { GameSceneData } from '../types/GameTypes';

export class PauseScene extends Phaser.Scene {
  private data0: GameSceneData = { mode: 'campaign', levelId: 1 };
  constructor() { super('Pause'); }
  init(data: GameSceneData): void { this.data0 = data; }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65).setInteractive();
    this.add.rectangle(cx, GAME_HEIGHT / 2, 520, 440, 0x1d2335).setStrokeStyle(5, 0xffd35a);
    txt(this, cx, 200, 'PAUSED', 64, '#ffd35a');
    const resume = (): void => { this.scene.resume('Game'); this.scene.stop(); };
    new Button(this, cx, 300, 'RESUME', resume, { w: 340, h: 66, color: 0x3f8f4f, fontSize: 32 });
    new Button(this, cx, 386, 'RESTART', () => { this.scene.stop('Game'); this.scene.start('Game', this.data0); }, { w: 340, h: 66, fontSize: 32 });
    new Button(this, cx, 472, 'QUIT TO MENU', () => { this.scene.stop('Game'); this.scene.start('MainMenu'); }, { w: 340, h: 66, color: 0x555a66, fontSize: 30 });
    txt(this, cx, 545, 'ESC to resume', 20, '#b8c2d8', [0.5, 0.5], false);
    this.input.keyboard?.on('keydown-ESC', resume);
  }
}
