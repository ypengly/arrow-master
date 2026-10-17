import Phaser from 'phaser';
import type { BossAbility, BossDef } from '../types/EnemyTypes';
import { Enemy, type EnemyEvents, type EnemyUpdateCtx } from './Enemy';

export interface BossEvents extends EnemyEvents {
  phase(b: Boss, phase: number): void;
  ability(b: Boss, a: BossAbility, phase: number): void;
}

/** Multi-phase boss: abilities unlock and speed up as health drops (70% / 40%). */
export class Boss extends Enemy {
  readonly bossDef: BossDef;
  phase = 1;
  private abilityT = 3.5;
  private abilityIdx = 0;
  private readonly bossEvents: BossEvents;

  constructor(scene: Phaser.Scene, x: number, def: BossDef, events: BossEvents, hpMul = 1) {
    super(scene, x, def, events, hpMul);
    this.bossDef = def; this.bossEvents = events;
    this.setDepth(9);
  }

  private phaseFor(): number { const r = this.hp / this.maxHp; return r > 0.7 ? 1 : r > 0.4 ? 2 : 3; }

  override update(dt: number, time: number, ctx: EnemyUpdateCtx): void {
    if (this.dead) return;
    const p = this.phaseFor();
    if (p !== this.phase) { this.phase = p; this.abilityT = Math.min(this.abilityT, 1); this.bossEvents.phase(this, p); }
    this.abilityT -= dt;
    if (this.abilityT <= 0 && this.x <= ctx.archerX + this.def.attackRange + 140 && !this.frozen) {
      const pool = this.bossDef.abilities.slice(0, Math.max(1, Math.min(this.bossDef.abilities.length, this.phase)));
      const ability = pool[this.abilityIdx++ % pool.length];
      this.abilityT = 3.2 / (1 + 0.35 * (this.phase - 1));
      this.bossEvents.ability(this, ability, this.phase);
    }
    super.update(dt, time, ctx);
  }
}
