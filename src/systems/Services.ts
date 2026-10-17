import type Phaser from 'phaser';
import type { SaveManager } from './SaveManager';
import type { AudioManager } from './AudioManager';
import type { LevelManager } from '../config/LevelConfig';

export interface Services { save: SaveManager; audio: AudioManager; levels: LevelManager }
export const SERVICES_KEY = 'services';
export function services(scene: Phaser.Scene): Services { return scene.game.registry.get(SERVICES_KEY) as Services; }
