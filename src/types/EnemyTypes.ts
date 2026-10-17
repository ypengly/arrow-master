export type EnemyKind = string;
export type BossKind = string;
export type EnemyBehavior = 'advance' | 'patrol' | 'ranged' | 'dodge' | 'cover';
export type BossAbility = 'spread' | 'summon' | 'rain' | 'charge';
export type Accessory = 'none' | 'helmet' | 'hat' | 'hood' | 'crown' | 'horns';

export interface EnemyDef {
  kind: EnemyKind; name: string; health: number; speed: number; damage: number; defense: number;
  attackRange: number; reward: number; behavior: EnemyBehavior; scale: number; color: number; accent: number;
  shield: boolean; fireRate: number; projectileSpeed: number; accessory: Accessory;
  weakPoint?: boolean; title?: string; abilities?: BossAbility[];
}
export interface BossDef extends EnemyDef { title: string; abilities: BossAbility[]; weakPoint: true }
