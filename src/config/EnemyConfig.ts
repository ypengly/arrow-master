import enemiesJson from '../data/enemies/enemies.json';
import bossesJson from '../data/enemies/bosses.json';
import type { BossDef, EnemyDef } from '../types/EnemyTypes';

/** Enemy and boss definitions live in src/data/enemies/*.json: adding an enemy needs no gameplay code. */
export const ENEMIES: Record<string, EnemyDef> = enemiesJson as unknown as Record<string, EnemyDef>;
export const BOSSES: Record<string, BossDef> = bossesJson as unknown as Record<string, BossDef>;
export const BOSS_ORDER: readonly string[] = Object.keys(BOSSES);

export const getEnemyDef = (kind: string): EnemyDef | undefined => ENEMIES[kind];
export const getBossDef = (kind: string): BossDef | undefined => BOSSES[kind];
export const isKnownSpawn = (type: string): boolean =>
  type === 'target' || (type.startsWith('boss:') ? BOSSES[type.slice(5)] !== undefined : ENEMIES[type] !== undefined);
