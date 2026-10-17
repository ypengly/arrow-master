export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_Y = 620;
export const HUD_MARGIN = 48;
export const SAVE_KEY = 'arrow-master-save-v1';

export const PHYSICS = {
  gravity: 1150, minSpeed: 380, maxSpeed: 1550, chargeMs: 1000, minPower: 0.18, stickMs: 3000, maxArrows: 48,
  trajectorySteps: 44, trajectoryDt: 0.04, boundsLeft: -140, boundsRight: GAME_WIDTH + 180, boundsTop: -800,
  shotCooldown: 0.2,
} as const;
export const ARCHER = { x: 150, minX: 80, maxX: 430, hitRadius: 32, bowPivotY: -52, baseHealth: 100, baseMoveSpeed: 140, maxPull: 22 } as const;
export const COMBAT = {
  headMult: 2.5, weakMult: 3, critMult: 1.5, longDistance: 650, explosionRadius: 115, explosionMult: 1.3,
  barrelRadius: 135, barrelDamage: 75, lightningRange: 230, lightningChains: 3, lightningMult: 0.6,
  burnSecs: 3, burnDps: 9, poisonSecs: 5, poisonDps: 7, freezeSecs: 2, splitDelay: 0.3, splitCount: 2, splitAngle: 0.2,
  perfectGravity: 0.3, meleeCooldown: 0.9, meleeRange: 62, maxSpread: 0.09, baseDamage: 32,
  hpPerLevel: 0.007, damagePerLevel: 0.006,
} as const;
export const SCORE_VALUES = { hit: 100, headshot: 500, longDistance: 300, moving: 250, explosive: 400, bullseye: 400, comboStep: 100 } as const;
export const COMBO_CFG = { windowMs: 4500, maxMult: 10 } as const;
export const FEEL = { shootShake: 0.0025, hitShake: 0.004, headShake: 0.008, explosionShake: 0.014, hurtShake: 0.01, hitStopMs: 45 } as const;
export const PICKUP_CFG = { dropChance: 0.14, lifeSecs: 9, radius: 26 } as const;
export const SPAWN_X = GAME_WIDTH + 70;
export const FOCUS_TIME_SCALE = 0.35;
