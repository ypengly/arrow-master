import { ACHIEVEMENTS, dailyFor, todayKey, type AchievementDef } from '../data/GameData';
import type { RunSummary } from '../types/GameTypes';
import type { SaveManager } from './SaveManager';

export class AchievementSystem {
  constructor(private readonly save: SaveManager) {}

  /** Unlocks and rewards any newly satisfied achievements. */
  evaluate(run?: RunSummary): AchievementDef[] {
    const d = this.save.d;
    const unlocked: AchievementDef[] = [];
    for (const a of ACHIEVEMENTS) {
      if (d.achievements.includes(a.id)) continue;
      if (a.check({ stats: d.stats, threeStarLevels: this.save.threeStarCount(), run })) {
        d.achievements.push(a.id); d.coins += a.reward; unlocked.push(a);
      }
    }
    if (unlocked.length) this.save.commit();
    return unlocked;
  }

  /** Updates the daily challenge. Returns reward coins if it was just completed. */
  daily(run: RunSummary): { text: string; reward: number } | null {
    const d = this.save.d;
    const today = todayKey();
    if (d.daily.date !== today) d.daily = { date: today, progress: 0, claimed: false };
    const def = dailyFor(today);
    if (d.daily.claimed) return null;
    switch (def.type) {
      case 'headshots': if (run.win) d.daily.progress = Math.max(d.daily.progress, run.headshots); break;
      case 'accuracy': if (run.win) d.daily.progress = Math.max(d.daily.progress, Math.round(run.accuracy * 100)); break;
      case 'noSpecial': if (run.win && !run.usedSpecial) d.daily.progress = 1; break;
      case 'kills': d.daily.progress += run.kills; break;
      case 'combo': d.daily.progress = Math.max(d.daily.progress, run.maxCombo); break;
    }
    let result: { text: string; reward: number } | null = null;
    if (d.daily.progress >= def.target) { d.daily.claimed = true; d.coins += def.reward; result = { text: def.text, reward: def.reward }; }
    this.save.commit();
    return result;
  }

  dailyStatus(): { text: string; progress: number; target: number; reward: number; done: boolean } {
    const d = this.save.d; const today = todayKey(); const def = dailyFor(today);
    const progress = d.daily.date === today ? d.daily.progress : 0;
    return { text: def.text, progress: Math.min(progress, def.target), target: def.target, reward: def.reward, done: d.daily.date === today && d.daily.claimed };
  }
}
