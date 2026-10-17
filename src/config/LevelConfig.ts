import { BOSSES, ENEMIES } from './EnemyConfig';
import type { GameMode } from '../types/GameTypes';
import { ENVIRONMENTS, type EnemySpawn, type EnvironmentKind, type LevelData, type PropCounts } from '../types/LevelTypes';

const modules = import.meta.glob<LevelData>('../data/levels/*.json', { eager: true, import: 'default' });
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Validates untrusted JSON. Returns a sanitized level or null when unusable. */
export function validateLevel(raw: unknown): LevelData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (!isNum(o.id) || o.id < 1 || typeof o.name !== 'string') return null;
  if (!ENVIRONMENTS.includes(o.environment as EnvironmentKind)) return null;
  if (!Array.isArray(o.enemies)) return null;
  const enemies: EnemySpawn[] = [];
  for (const e of o.enemies as unknown[]) {
    if (typeof e !== 'object' || e === null) return null;
    const s = e as Record<string, unknown>;
    if (typeof s.type !== 'string' || !isNum(s.count) || s.count < 1) return null;
    if (s.type !== 'target' && !ENEMIES[s.type]) { console.warn(`[Level ${o.id}] unknown enemy type "${s.type}"`); return null; }
    enemies.push({ type: s.type, count: Math.floor(s.count) });
  }
  const boss = typeof o.boss === 'string' ? o.boss : undefined;
  if (boss && !BOSSES[boss]) { console.warn(`[Level ${o.id}] unknown boss "${boss}"`); return null; }
  if (enemies.length === 0 && !boss) return null;
  const p = (o.props ?? {}) as Partial<PropCounts>;
  return {
    id: Math.floor(o.id), name: o.name, environment: o.environment as EnvironmentKind, enemies, boss,
    targetScore: isNum(o.targetScore) ? o.targetScore : 1000,
    timeLimit: isNum(o.timeLimit) ? o.timeLimit : 90,
    threeStarScore: isNum(o.threeStarScore) ? o.threeStarScore : 2500,
    waves: isNum(o.waves) ? Math.max(1, Math.floor(o.waves)) : undefined,
    arrows: isNum(o.arrows) ? o.arrows : undefined,
    specialAmmo: isNum(o.specialAmmo) ? o.specialAmmo : undefined,
    hint: typeof o.hint === 'string' ? o.hint : undefined,
    props: { barrels: p.barrels ?? 0, crates: p.crates ?? 0, covers: p.covers ?? 0 },
  };
}

const fallbackLevel = (): LevelData => ({
  id: 1, name: 'Training Grounds', environment: 'forest', enemies: [{ type: 'basic', count: 3 }, { type: 'target', count: 1 }],
  targetScore: 1000, timeLimit: 90, threeStarScore: 2500, props: { barrels: 0, crates: 0, covers: 0 },
});

export class LevelManager {
  private readonly levels = new Map<number, LevelData>();

  constructor() {
    for (const [path, raw] of Object.entries(modules)) {
      const level = validateLevel(raw);
      if (level) this.levels.set(level.id, level);
      else console.warn(`[LevelManager] invalid level skipped: ${path}`);
    }
    if (this.levels.size === 0) this.levels.set(1, fallbackLevel());
  }

  get count(): number { return Math.max(...this.levels.keys()); }
  has(id: number): boolean { return this.levels.has(id); }
  get(id: number): LevelData | undefined { return this.levels.get(id); }
  totalEnemies(l: LevelData): number { return l.enemies.reduce((n, e) => n + e.count, 0) + (l.boss ? 1 : 0); }

  forMode(mode: GameMode, levelId: number, progress = 1): LevelData {
    const base = this.get(levelId) ?? this.get(1) ?? fallbackLevel();
    const synth = (name: string, env: EnvironmentKind, extra: Partial<LevelData>): LevelData => ({
      id: 0, name, environment: env, enemies: [], targetScore: 0, timeLimit: 0, threeStarScore: 0,
      props: { barrels: 2, crates: 2, covers: 2 }, difficulty: Math.max(8, Math.floor(progress * 0.8)), specialAmmo: 10, ...extra,
    });
    switch (mode) {
      case 'endless': return synth('Endless Siege', ENVIRONMENTS[Math.floor(progress / 12) % ENVIRONMENTS.length], { endless: true });
      case 'timeAttack': return synth('Time Attack', 'desert', { endless: true, timeLimit: 60 });
      case 'bossRush': return synth('Boss Rush', 'dungeon', { bossRush: true, props: { barrels: 0, crates: 0, covers: 1 } });
      case 'precision': return { ...base, name: `Precision: ${base.name}`, arrows: this.totalEnemies(base) * 2 + 3, timeLimit: 0 };
      default: return base;
    }
  }
}
