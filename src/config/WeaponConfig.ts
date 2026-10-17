import type { AbilityDef, ArmorDef, ArrowDef, ArrowKind, BowDef, PowerUpDef, PowerUpKind, UpgradeDef } from '../types/WeaponTypes';

export const ARROWS: Record<ArrowKind, ArrowDef> = {
  normal:    { kind: 'normal',    name: 'Standard',  short: 'STD', color: 0xd0d0d8, damageMul: 1,   speedMul: 1,   cost: 0,   ammo: 999, pierce: 0, desc: 'Reliable and unlimited.' },
  fire:      { kind: 'fire',      name: 'Fire',      short: 'FIR', color: 0xff6a2a, damageMul: 0.9, speedMul: 1,   cost: 600, ammo: 12,  pierce: 0, desc: 'Sets enemies ablaze.' },
  explosive: { kind: 'explosive', name: 'Explosive', short: 'EXP', color: 0xffaa22, damageMul: 0.8, speedMul: 1,   cost: 900, ammo: 8,   pierce: 0, desc: 'Area damage on impact.' },
  lightning: { kind: 'lightning', name: 'Lightning', short: 'LTN', color: 0xffee55, damageMul: 0.9, speedMul: 1.1, cost: 900, ammo: 8,   pierce: 0, desc: 'Chains between enemies.' },
  ice:       { kind: 'ice',       name: 'Ice',       short: 'ICE', color: 0x66ddff, damageMul: 0.8, speedMul: 1,   cost: 700, ammo: 10,  pierce: 0, desc: 'Freezes targets in place.' },
  pierce:    { kind: 'pierce',    name: 'Piercing',  short: 'PRC', color: 0xb8ffb8, damageMul: 1,   speedMul: 1.1, cost: 500, ammo: 12,  pierce: 2, desc: 'Passes through enemies.' },
  split:     { kind: 'split',     name: 'Split',     short: 'SPL', color: 0xff88ff, damageMul: 0.7, speedMul: 1,   cost: 800, ammo: 10,  pierce: 0, desc: 'Splits into three arrows.' },
  poison:    { kind: 'poison',    name: 'Poison',    short: 'PSN', color: 0x66dd44, damageMul: 0.7, speedMul: 1,   cost: 650, ammo: 10,  pierce: 0, desc: 'Damage over time.' },
};
export const ARROW_ORDER: readonly ArrowKind[] = ['normal', 'fire', 'explosive', 'lightning', 'ice', 'pierce', 'split', 'poison'];

export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'bowDamage',   group: 'Bow',    name: 'Damage',      desc: '+8% arrow damage',        maxLevel: 10, baseCost: 150, growth: 1.45 },
  { id: 'bowPower',    group: 'Bow',    name: 'Power',       desc: '+4% launch power',        maxLevel: 10, baseCost: 150, growth: 1.4 },
  { id: 'bowAccuracy', group: 'Bow',    name: 'Accuracy',    desc: 'Tighter shot spread',     maxLevel: 10, baseCost: 120, growth: 1.4 },
  { id: 'drawSpeed',   group: 'Bow',    name: 'Draw Speed',  desc: '-6% charge time',         maxLevel: 8,  baseCost: 140, growth: 1.45 },
  { id: 'health',      group: 'Archer', name: 'Health',      desc: '+12 max health',          maxLevel: 10, baseCost: 120, growth: 1.4 },
  { id: 'armor',       group: 'Archer', name: 'Armor',       desc: '+2.5% damage reduction',  maxLevel: 10, baseCost: 160, growth: 1.45 },
  { id: 'movement',    group: 'Archer', name: 'Movement',    desc: '+12% strafe speed (A/D)', maxLevel: 6,  baseCost: 100, growth: 1.4 },
  { id: 'critChance',  group: 'Archer', name: 'Critical',    desc: '+3% critical chance',     maxLevel: 10, baseCost: 180, growth: 1.45 },
  { id: 'arrowSpeed',  group: 'Arrows', name: 'Speed',       desc: '+3% arrow speed',         maxLevel: 10, baseCost: 130, growth: 1.4 },
  { id: 'penetration', group: 'Arrows', name: 'Penetration', desc: '+1 pierce per 2 levels',  maxLevel: 8,  baseCost: 250, growth: 1.5 },
  { id: 'explosion',   group: 'Arrows', name: 'Explosion',   desc: '+10% blast radius',       maxLevel: 10, baseCost: 200, growth: 1.45 },
  { id: 'elemental',   group: 'Arrows', name: 'Elemental',   desc: '+15% burn/poison damage', maxLevel: 10, baseCost: 200, growth: 1.45 },
];

export const BOWS: Record<string, BowDef> = {
  oak:    { id: 'oak',    name: 'Oak Bow',    cost: 0,    damageMul: 1,    powerMul: 1,    color: 0x8b5a2b, desc: 'A trusty starter bow.' },
  hunter: { id: 'hunter', name: 'Hunter Bow', cost: 1200, damageMul: 1.15, powerMul: 1.05, color: 0x4f8a3a, desc: '+15% damage, +5% power.' },
  ranger: { id: 'ranger', name: 'Ranger Bow', cost: 3000, damageMul: 1.3,  powerMul: 1.1,  color: 0x3a6fb0, desc: '+30% damage, +10% power.' },
  dragon: { id: 'dragon', name: 'Dragon Bow', cost: 8000, damageMul: 1.6,  powerMul: 1.2,  color: 0xc0392b, desc: '+60% damage, +20% power.' },
};
export const ARMORS: Record<string, ArmorDef> = {
  cloth:   { id: 'cloth',   name: 'Cloth Tunic',   cost: 0,    healthBonus: 0,  defense: 0,    color: 0x7a8aa0, desc: 'Light and free.' },
  leather: { id: 'leather', name: 'Leather Armor', cost: 800,  healthBonus: 20, defense: 0.05, color: 0x8a5a2b, desc: '+20 health, 5% reduction.' },
  chain:   { id: 'chain',   name: 'Chainmail',     cost: 2500, healthBonus: 40, defense: 0.12, color: 0x9aa3ad, desc: '+40 health, 12% reduction.' },
  plate:   { id: 'plate',   name: 'Plate Armor',   cost: 6000, healthBonus: 70, defense: 0.2,  color: 0xd9dde3, desc: '+70 health, 20% reduction.' },
};
export const ABILITIES: Record<string, AbilityDef> = {
  focus: { id: 'focus', name: 'Focus', cost: 1000, cooldown: 18, duration: 4, desc: 'Slow time for 4s (key Q).' },
  mend:  { id: 'mend',  name: 'Mend',  cost: 1500, cooldown: 0,  duration: 0, desc: 'Restore 40% health once per level (key E).' },
};
export const POWERUPS: Record<PowerUpKind, PowerUpDef> = {
  damage: { kind: 'damage', label: 'Damage Boost', glyph: 'D', color: 0xff5533, duration: 10 },
  rapid:  { kind: 'rapid',  label: 'Rapid Fire',   glyph: 'R', color: 0xffdd33, duration: 10 },
  aim:    { kind: 'aim',    label: 'Perfect Aim',  glyph: 'A', color: 0x33ddff, duration: 10 },
  shield: { kind: 'shield', label: 'Shield',       glyph: 'S', color: 0x66aaff, duration: 8 },
  heal:   { kind: 'heal',   label: 'Health',       glyph: '+', color: 0xff5577, duration: 0 },
  coin:   { kind: 'coin',   label: 'Coin x2',      glyph: '$', color: 0xffd35a, duration: 15 },
};
export const POWERUP_KINDS = Object.keys(POWERUPS) as PowerUpKind[];
