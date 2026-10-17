import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../config/AssetConfig';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { Button, txt } from '../ui/Button';
import { generateAllTextures } from '../utils/TextureFactory';

/** Loads optional external assets (none by default), then generates procedural fallbacks so nothing is ever missing. */
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    txt(this, cx, cy - 60, 'ARROW MASTER', 72, '#ffd35a');
    const label = txt(this, cx, cy + 50, 'Loading...', 24, '#e8ecf5');
    this.add.rectangle(cx, cy + 10, 520, 22, 0x1d2335).setStrokeStyle(3, 0xffd35a);
    const fill = this.add.rectangle(cx - 256, cy + 10, 512, 14, 0xffd35a).setOrigin(0, 0.5).setScale(0, 1);
    this.load.on('progress', (v: number) => { fill.scaleX = v; });
    this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn(`[Preload] missing asset "${file.key}", using fallback`));
    for (const a of ASSET_MANIFEST) {
      if (a.type === 'image') this.load.image(a.key, a.url);
      else this.load.audio(a.key, a.url);
    }
    this.load.once('complete', () => label.setText('Forging arrows...'));
  }

  create(): void {
    try {
      generateAllTextures(this);
    } catch (err) {
      console.error('[Preload] texture generation failed', err);
      txt(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, 'Could not create graphics. Please reload.', 24, '#ff5544');
      new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, 'RELOAD', () => window.location.reload(), { w: 220 });
      return;
    }
    this.cameras.main.fadeOut(350, 16, 19, 28);
    this.time.delayedCall(900, () => this.scene.start('MainMenu'));
  }
}
