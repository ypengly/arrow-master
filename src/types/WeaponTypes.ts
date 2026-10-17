export type ArrowKind = 'normal' | 'fire' | 'explosive' | 'lightning' | 'ice' | 'pierce' | 'split' | 'poison';
export type PowerUpKind = 'damage' | 'rapid' | 'aim' | 'shield' | 'heal' | 'coin';
export type AbilityId = 'focus' | 'mend';
export type UpgradeGroup = 'Bow' | 'Archer' | 'Arrows';
export type UpgradeId =
  | 'bowDamage' | 'bowPower' | 'bowAccuracy' | 'drawSpeed'
  | 'health' | 'armor' | 'movement' | 'critChance'
  | 'arrowSpeed' | 'penetration' | 'explosion' | 'elemental';

export interface ArrowDef { kind: ArrowKind; name: string; short: string; color: number; damageMul: number; speedMul: number; cost: number; ammo: number; pierce: number; desc: string }
export interface UpgradeDef { id: UpgradeId; group: UpgradeGroup; name: string; desc: string; maxLevel: number; baseCost: number; growth: number }
export interface BowDef { id: string; name: string; cost: number; damageMul: number; powerMul: number; color: number; desc: string }
export interface ArmorDef { id: string; name: string; cost: number; healthBonus: number; defense: number; color: number; desc: string }
export interface AbilityDef { id: AbilityId; name: string; cost: number; cooldown: number; duration: number; desc: string }
export interface PowerUpDef { kind: PowerUpKind; label: string; glyph: string; color: number; duration: number }
export interface PlayerStats {
  damage: number; power: number; accuracy: number; chargeMs: number; health: number; defense: number;
  moveSpeed: number; critChance: number; arrowSpeed: number; pierceBonus: number; explosion: number; elemental: number;
}
