import { SAVE_KEY } from '../config/GameConfig';
import { ABILITIES, ARMORS, ARROWS, BOWS, UPGRADES } from '../config/WeaponConfig';
import type { SaveData } from '../types/GameTypes';
import type { AbilityId, ArrowKind, UpgradeId } from '../types/WeaponTypes';

const SAVE_VERSION = 1;
const defaultSave = (): SaveData => ({
  version: SAVE_VERSION, coins: 0, unlocked: 1, levels: {}, upgrades: {},
  ownedArrows: ['normal'], equippedArrow: 'normal', ownedBows: ['oak'], equippedBow: 'oak',
  ownedArmor: ['cloth'], equippedArmor: 'cloth', ownedAbilities: [], achievements: [],
  settings: { music: true, sound: true, vibration: true, quality: 'high', reducedMotion: false },
  stats: { arrowsFired: 0, hits: 0, kills: 0, headshots: 0, bossesDefeated: 0, perfectLevels: 0 },
  daily: { date: '', progress: 0, claimed: false }, bestEndless: 0, bestTimeAttack: 0,
});

/** The only place in the project that touches localStorage. */
export class SaveManager {
  private data: SaveData;

  constructor() { this.data = this.load(); }

  get d(): SaveData { return this.data; }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      return this.sanitize(JSON.parse(raw) as unknown);
    } catch (err) {
      console.warn('[SaveManager] corrupt or unavailable save, starting fresh', err);
      return defaultSave();
    }
  }

  private sanitize(p: unknown): SaveData {
    const base = defaultSave();
    if (typeof p !== 'object' || p === null) return base;
    const o = p as Partial<SaveData>;
    const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);
    const strIn = <T extends string>(v: unknown, allowed: readonly string[], d: T): T => (typeof v === 'string' && allowed.includes(v) ? (v as T) : d);
    const list = <T extends string>(v: unknown, allowed: readonly string[], d: T[]): T[] =>
      Array.isArray(v) ? (v.filter(x => typeof x === 'string' && allowed.includes(x)) as T[]) : d;
    const ownedArrows = list<ArrowKind>(o.ownedArrows, Object.keys(ARROWS), base.ownedArrows);
    if (!ownedArrows.includes('normal')) ownedArrows.unshift('normal');
    const ownedBows = list<string>(o.ownedBows, Object.keys(BOWS), base.ownedBows);
    if (!ownedBows.includes('oak')) ownedBows.unshift('oak');
    const ownedArmor = list<string>(o.ownedArmor, Object.keys(ARMORS), base.ownedArmor);
    if (!ownedArmor.includes('cloth')) ownedArmor.unshift('cloth');
    const upgrades: SaveData['upgrades'] = {};
    for (const u of UPGRADES) {
      const lv = num((o.upgrades as Record<string, unknown> | undefined)?.[u.id], 0);
      if (lv > 0) upgrades[u.id as UpgradeId] = Math.min(u.maxLevel, Math.floor(lv));
    }
    const levels: SaveData['levels'] = {};
    if (typeof o.levels === 'object' && o.levels !== null) {
      for (const [k, v] of Object.entries(o.levels)) {
        if (v && typeof v.stars === 'number' && typeof v.bestScore === 'number') levels[k] = { stars: Math.min(3, Math.max(0, Math.floor(v.stars))), bestScore: Math.max(0, v.bestScore) };
      }
    }
    const equippedArrow = strIn<ArrowKind>(o.equippedArrow, ownedArrows, 'normal');
    return {
      ...base, coins: num(o.coins, 0), unlocked: Math.max(1, Math.floor(num(o.unlocked, 1))), levels, upgrades, ownedArrows, equippedArrow,
      ownedBows, equippedBow: strIn(o.equippedBow, ownedBows, 'oak'), ownedArmor, equippedArmor: strIn(o.equippedArmor, ownedArmor, 'cloth'),
      ownedAbilities: list<AbilityId>(o.ownedAbilities, Object.keys(ABILITIES), []),
      achievements: Array.isArray(o.achievements) ? o.achievements.filter(a => typeof a === 'string') : [],
      settings: { ...base.settings, ...(typeof o.settings === 'object' && o.settings ? o.settings : {}) },
      stats: { ...base.stats, ...(typeof o.stats === 'object' && o.stats ? o.stats : {}) },
      daily: { ...base.daily, ...(typeof o.daily === 'object' && o.daily ? o.daily : {}) },
      bestEndless: num(o.bestEndless, 0), bestTimeAttack: num(o.bestTimeAttack, 0),
    };
  }

  commit(): void {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); }
    catch (err) { console.warn('[SaveManager] could not persist save', err); }
  }

  addCoins(n: number): void { this.data.coins += Math.max(0, Math.floor(n)); this.commit(); }
  spend(n: number): boolean {
    if (this.data.coins < n) return false;
    this.data.coins -= n; this.commit(); return true;
  }
  upgradeLevel(id: UpgradeId): number { return this.data.upgrades[id] ?? 0; }
  setUpgradeLevel(id: UpgradeId, lv: number): void { this.data.upgrades[id] = lv; this.commit(); }

  recordLevel(id: number, stars: number, score: number): boolean {
    const prev = this.data.levels[String(id)];
    const newBest = !prev || score > prev.bestScore;
    this.data.levels[String(id)] = { stars: Math.max(prev?.stars ?? 0, stars), bestScore: Math.max(prev?.bestScore ?? 0, score) };
    this.commit();
    return newBest;
  }
  unlockUpTo(id: number): void { if (id > this.data.unlocked) { this.data.unlocked = id; this.commit(); } }
  levelResult(id: number): { stars: number; bestScore: number } | undefined { return this.data.levels[String(id)]; }
  threeStarCount(): number { return Object.values(this.data.levels).filter(l => l.stars >= 3).length; }

  reset(): void { this.data = defaultSave(); this.commit(); }
}
