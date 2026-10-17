import Phaser from 'phaser';
import { ENV_THEMES, TEX, bgTex } from '../config/AssetConfig';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../config/GameConfig';
import type { EnvironmentKind } from '../types/LevelTypes';

/** Layered parallax backdrop: sky, celestial glow, far/near silhouettes, ground, lighting overlay. */
export class BackgroundSystem {
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly near: Phaser.GameObjects.TileSprite;
  private t = 0;

  constructor(scene: Phaser.Scene, env: EnvironmentKind) {
    const th = ENV_THEMES[env];
    scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgTex('sky', env)).setDepth(-100).setScrollFactor(0);
    scene.add.image(1010, 150, TEX.orb).setTint(th.celestial).setScale(5).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(-99);
    this.far = scene.add.tileSprite(GAME_WIDTH / 2, GROUND_Y - 10 - 170, GAME_WIDTH + 160, 340, bgTex('far', env)).setDepth(-90);
    this.near = scene.add.tileSprite(GAME_WIDTH / 2, GROUND_Y + 2 - 150, GAME_WIDTH + 160, 300, bgTex('near', env)).setDepth(-80);
    scene.add.tileSprite(GAME_WIDTH / 2, GROUND_Y - 6 + 56, GAME_WIDTH + 160, 112, bgTex('ground', env)).setDepth(-10);
    scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 200, GAME_HEIGHT + 200, th.overlay, 0.1).setDepth(80).setScrollFactor(0);
    scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.vignette).setDepth(90).setScrollFactor(0).setAlpha(0.8);
  }

  update(dt: number, pointerX: number): void {
    this.t += dt;
    const px = (pointerX - GAME_WIDTH / 2) * 0.02;
    this.far.tilePositionX = this.t * 3 + px;
    this.near.tilePositionX = this.t * 8 + px * 2.2;
  }
}
