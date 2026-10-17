import type { GameMode, RunSummary, Stats } from '../types/GameTypes';

export interface AchievementCtx { stats: Stats; threeStarLevels: number; run?: RunSummary }
export interface AchievementDef { id: string; icon: string; name: string; desc: string; reward: number; check: (c: AchievementCtx) => boolean }

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'firstBlood',  icon: 'I',   name: 'First Blood',    desc: 'Get your first kill.',               reward: 50,  check: c => c.stats.kills >= 1 },
  { id: 'arrowMaster', icon: 'M',   name: 'Arrow Master',   desc: 'Fire 1,000 arrows.',                 reward: 400, check: c => c.stats.arrowsFired >= 1000 },
  { id: 'headHunter',  icon: 'H',   name: 'Head Hunter',    desc: 'Get 100 headshots.',                 reward: 400, check: c => c.stats.headshots >= 100 },
  { id: 'untouchable', icon: 'U',   name: 'Untouchable',    desc: 'Complete a level without damage.',   reward: 200, check: c => !!c.run && c.run.win && c.run.damageTaken === 0 && c.run.mode === 'campaign' },
  { id: 'perfectionist', icon: 'P', name: 'Perfectionist',  desc: 'Earn 3 stars on 25 levels.',         reward: 800, check: c => c.threeStarLevels >= 25 },
  { id: 'bossSlayer',  icon: 'B',   name: 'Boss Slayer',    desc: 'Defeat 10 bosses.',                  reward: 600, check: c => c.stats.bossesDefeated >= 10 },
  { id: 'comboKing',   icon: 'C',   name: 'Combo King',     desc: 'Reach a x8 combo.',                  reward: 250, check: c => !!c.run && c.run.maxCombo >= 8 },
  { id: 'centurion',   icon: 'K',   name: 'Centurion',      desc: 'Defeat 500 enemies.',                reward: 500, check: c => c.stats.kills >= 500 },
];

export type DailyType = 'headshots' | 'accuracy' | 'noSpecial' | 'kills' | 'combo';
export interface DailyDef { id: string; text: string; type: DailyType; target: number; reward: number }
export const DAILY_CHALLENGES: readonly DailyDef[] = [
  { id: 'd1', text: 'Win a level with 10+ headshots',       type: 'headshots', target: 10, reward: 300 },
  { id: 'd2', text: 'Win a level with 90% accuracy',        type: 'accuracy',  target: 90, reward: 350 },
  { id: 'd3', text: 'Win a level using only standard arrows', type: 'noSpecial', target: 1,  reward: 250 },
  { id: 'd4', text: 'Defeat 40 enemies today',              type: 'kills',     target: 40, reward: 300 },
  { id: 'd5', text: 'Reach a x6 combo',                     type: 'combo',     target: 6,  reward: 300 },
];

export const MODE_INFO: Record<GameMode, { label: string; desc: string }> = {
  campaign:   { label: 'Campaign',    desc: '100 levels, 10 bosses.' },
  endless:    { label: 'Endless',     desc: 'Survive escalating waves.' },
  timeAttack: { label: 'Time Attack', desc: '60 seconds. Score big.' },
  precision:  { label: 'Precision',   desc: 'Limited arrows.' },
  bossRush:   { label: 'Boss Rush',   desc: 'All 10 bosses in a row.' },
};

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function dailyFor(dateKey: string): DailyDef {
  let h = 0;
  for (const ch of dateKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DAILY_CHALLENGES[h % DAILY_CHALLENGES.length];
}
