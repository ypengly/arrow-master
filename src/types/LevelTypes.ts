import type { BossKind } from './EnemyTypes';

export type EnvironmentKind = 'forest' | 'desert' | 'snow' | 'castle' | 'ruins' | 'volcano' | 'dungeon' | 'temple';
export const ENVIRONMENTS: readonly EnvironmentKind[] = ['forest', 'desert', 'snow', 'castle', 'ruins', 'volcano', 'dungeon', 'temple'];

export interface EnemySpawn { type: string; count: number }
export interface PropCounts { barrels: number; crates: number; covers: number }
export interface LevelData {
  id: number; name: string; environment: EnvironmentKind; enemies: EnemySpawn[];
  targetScore: number; timeLimit: number; threeStarScore: number;
  waves?: number; boss?: BossKind; props?: PropCounts; arrows?: number; specialAmmo?: number; hint?: string;
  endless?: boolean; bossRush?: boolean; difficulty?: number;
}
