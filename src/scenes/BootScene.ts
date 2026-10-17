import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/AssetConfig';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { SERVICES_KEY } from '../systems/Services';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create(): void {
    this.cameras.main.setBackgroundColor('#10131c');
    if (!this.game.registry.has(SERVICES_KEY)) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Failed to start: services missing', { fontFamily: FONT_FAMILY, fontSize: '28px', color: '#ff5544' }).setOrigin(0.5);
      return;
    }
    this.scene.start('Preload');
  }
}
