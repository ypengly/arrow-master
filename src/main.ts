import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/GameConfig';
import { LevelManager } from './config/LevelConfig';
import { AudioManager } from './systems/AudioManager';
import { SaveManager } from './systems/SaveManager';
import { SERVICES_KEY, type Services } from './systems/Services';
import { ArmoryScene } from './scenes/ArmoryScene';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PauseScene } from './scenes/PauseScene';
import { PreloadScene } from './scenes/PreloadScene';
import { SettingsScene } from './scenes/SettingsScene';
import { UpgradeScene } from './scenes/UpgradeScene';

const save = new SaveManager();
const services: Services = { save, audio: new AudioManager(save), levels: new LevelManager() };

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#10131c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
  render: { antialias: true, powerPreference: 'high-performance' },
  fps: { target: 60 },
  callbacks: { preBoot: g => g.registry.set(SERVICES_KEY, services) },
  scene: [BootScene, PreloadScene, MainMenuScene, LevelSelectScene, GameScene, PauseScene, LevelCompleteScene, GameOverScene, UpgradeScene, ArmoryScene, SettingsScene],
});

// Browsers require a gesture before audio can start.
const unlock = (): void => services.audio.unlock();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });
// Pause the music when the tab is hidden.
document.addEventListener('visibilitychange', () => { if (document.hidden) game.sound.pauseAll(); else game.sound.resumeAll(); });
window.addEventListener('error', e => console.error('[Arrow Master] uncaught error:', e.message));
