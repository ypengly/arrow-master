import { ARCHER, COMBAT, PHYSICS } from '../config/GameConfig';
import { ARMORS, BOWS, UPGRADES } from '../config/WeaponConfig';
import type { PlayerStats, UpgradeId } from '../types/WeaponTypes';
import { clamp } from '../utils/MathUtils';
import type { SaveManager } from './SaveManager';

export class UpgradeSystem {
  constructor(private readonly save: SaveManager) {}

  level(id: UpgradeId): number { return this.save.upgradeLevel(id); }

  cost(id: UpgradeId): number | null {
    const def = UPGRADES.find(u => u.id === id);
    if (!def) return null;
    const lv = this.level(id);
    return lv >= def.maxLevel ? null : Math.round(def.baseCost * Math.pow(def.growth, lv));
  }

  buy(id: UpgradeId): boolean {
    const cost = this.cost(id);
    if (cost === null || !this.save.spend(cost)) return false;
    this.save.setUpgradeLevel(id, this.level(id) + 1);
    return true;
  }

  stats(): PlayerStats {
    const lv = (id: UpgradeId): number => this.level(id);
    const bow = BOWS[this.save.d.equippedBow] ?? BOWS.oak;
    const armor = ARMORS[this.save.d.equippedArmor] ?? ARMORS.cloth;
    return {
      damage: COMBAT.baseDamage * (1 + 0.08 * lv('bowDamage')) * bow.damageMul,
      power: (1 + 0.04 * lv('bowPower')) * bow.powerMul,
      accuracy: clamp(0.55 + 0.045 * lv('bowAccuracy'), 0, 1),
      chargeMs: PHYSICS.chargeMs * (1 - 0.06 * lv('drawSpeed')),
      health: ARCHER.baseHealth + 12 * lv('health') + armor.healthBonus,
      defense: clamp(0.025 * lv('armor') + armor.defense, 0, 0.7),
      moveSpeed: ARCHER.baseMoveSpeed * (1 + 0.12 * lv('movement')),
      critChance: 0.05 + 0.03 * lv('critChance'),
      arrowSpeed: 1 + 0.03 * lv('arrowSpeed'),
      pierceBonus: Math.floor(lv('penetration') / 2),
      explosion: 1 + 0.1 * lv('explosion'),
      elemental: 1 + 0.15 * lv('elemental'),
    };
  }
}
