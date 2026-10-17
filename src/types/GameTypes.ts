import type { ArrowKind, UpgradeId, AbilityId } from './WeaponTypes';

export type GameMode = 'campaign' | 'endless' | 'timeAttack' | 'precision' | 'bossRush';
export enum HitZone { Head = 'head', Body = 'body', Weak = 'weak', Shield = 'shield', Environment = 'environment' }
export type SfxName = 'click' | 'draw' | 'release' | 'impact' | 'headshot' | 'death' | 'explosion' | 'powerup' | 'combo'
  | 'victory' | 'gameover' | 'coin' | 'clank' | 'hurt' | 'boss' | 'star' | 'thud';
export type MusicMode = 'menu' | 'game' | 'boss';
export type Quality = 'low' | 'medium' | 'high';

export interface Settings { music: boolean; sound: boolean; vibration: boolean; quality: Quality; reducedMotion: boolean }
export interface LevelResult { stars: number; bestScore: number }
export interface Stats { arrowsFired: number; hits: number; kills: number; headshots: number; bossesDefeated: number; perfectLevels: number }
export interface DailyState { date: string; progress: number; claimed: boolean }
export interface SaveData {
  version: number; coins: number; unlocked: number; levels: Record<string, LevelResult>;
  upgrades: Partial<Record<UpgradeId, number>>;
  ownedArrows: ArrowKind[]; equippedArrow: ArrowKind;
  ownedBows: string[]; equippedBow: string; ownedArmor: string[]; equippedArmor: string;
  ownedAbilities: AbilityId[]; achievements: string[];
  settings: Settings; stats: Stats; daily: DailyState; bestEndless: number; bestTimeAttack: number;
}
export interface RunSummary {
  mode: GameMode; levelId: number; win: boolean; score: number; stars: number; accuracy: number; headshots: number;
  kills: number; damageTaken: number; maxCombo: number; coins: number; time: number; usedSpecial: boolean;
  newBest: boolean; bossesDefeated: number; arrowsFired: number;
}
export interface GameSceneData { mode: GameMode; levelId: number }
export interface ResultNote { title: string; sub: string }
export interface ResultData { summary: RunSummary; notes: ResultNote[] }
