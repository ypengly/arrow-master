import Phaser from 'phaser';
import { getBossDef, getEnemyDef } from '../config/EnemyConfig';
import { ARCHER, COMBAT, GROUND_Y, SPAWN_X } from '../config/GameConfig';
import { Boss, type BossEvents } from '../entities/Boss';
import { Enemy, type StatusFx } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import type { Prop } from '../entities/Prop';
import type { BossAbility } from '../types/EnemyTypes';
import { rand } from '../utils/RandomUtils';

export interface EnemySystemHandlers {
  onDeath(e: Enemy): void;
  onPlayerHit(damage: number, x: number, y: number): void;
  onFx(kind: StatusFx | 'impact', x: number, y: number): void;
  onBossPhase(b: Boss, phase: number): void;
  onBossAbility(b: Boss, a: BossAbility): void;
}

const COLORS: Record<string, number> = { archer: 0xd9a05b, mage: 0xb26bff, boss: 0xff5577, rain: 0xff8844 };
const MAX_ALIVE = 16;

export class EnemySystem {
  readonly enemies: Enemy[] = [];
  private readonly projectiles: Projectile[] = [];
  private readonly pool: Projectile[] = [];
  private readonly events: BossEvents;
  private readonly hpMul: number;
  private readonly bossHpMul: number;
  private readonly dmgMul: number;

  constructor(private readonly scene: Phaser.Scene, private readonly archerPos: () => { x: number }, private readonly h: EnemySystemHandlers, difficulty: number) {
    this.hpMul = 1 + COMBAT.hpPerLevel * difficulty;
    this.bossHpMul = 1 + 0.004 * difficulty;
    this.dmgMul = 1 + COMBAT.damagePerLevel * difficulty;
    this.events = {
      melee: e => this.h.onPlayerHit(e.def.damage * this.dmgMul * (e instanceof Boss ? 1.4 : 1), e.x, e.y - 40),
      shoot: e => this.shootAtPlayer(e),
      death: e => this.h.onDeath(e),
      fx: (k, x, y) => this.h.onFx(k, x, y),
      phase: (b, p) => this.h.onBossPhase(b, p),
      ability: (b, a, p) => this.bossAbility(b, a, p),
    };
  }

  get alive(): number { let n = 0; for (const e of this.enemies) if (!e.dead) n++; return n; }

  spawn(kind: string, x = SPAWN_X): Enemy | null {
    const def = getEnemyDef(kind);
    if (!def) { console.warn(`[EnemySystem] unknown enemy type "${kind}"`); return null; }
    const e = new Enemy(this.scene, x, def, this.events, this.hpMul);
    this.enemies.push(e);
    return e;
  }

  spawnBoss(kind: string): Boss | null {
    const def = getBossDef(kind);
    if (!def) { console.warn(`[EnemySystem] unknown boss "${kind}"`); return null; }
    const b = new Boss(this.scene, SPAWN_X + 160, def, this.events, this.bossHpMul);
    this.enemies.push(b);
    return b;
  }

  update(dt: number, time: number, props: readonly Prop[]): void {
    const archerX = this.archerPos().x;
    const covers = props.filter(p => p.kind === 'cover' && !p.dead).map(p => p.rect);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) { this.enemies.splice(i, 1); continue; }
      e.update(dt, time, { archerX, covers });
    }
    this.updateProjectiles(dt, archerX);
  }

  private acquire(): Projectile { return this.pool.pop() ?? new Projectile(this.scene); }

  private shootAtPlayer(e: Enemy): void {
    const p = this.archerPos();
    const sx = e.x - 20 * e.def.scale, sy = e.y - 60 * e.def.scale;
    const tx = p.x, ty = GROUND_Y - 50;
    const a = Math.atan2(ty - sy, tx - sx), sp = e.def.projectileSpeed || 450;
    const pr = this.acquire();
    pr.fire(sx, sy, Math.cos(a) * sp, Math.sin(a) * sp, e.def.damage * this.dmgMul, COLORS[e.def.kind] ?? COLORS.archer, 0, e.def.kind === 'mage' ? 1.2 : 0.8);
    this.projectiles.push(pr);
  }

  private bossAbility(b: Boss, a: BossAbility, phase: number): void {
    const p = this.archerPos();
    switch (a) {
      case 'spread': {
        const n = 3 + phase * 2, sx = b.x - 30 * b.def.scale, sy = b.y - 60 * b.def.scale;
        const base = Math.atan2(GROUND_Y - 50 - sy, p.x - sx);
        for (let i = 0; i < n; i++) {
          const ang = base + (i - (n - 1) / 2) * 0.16;
          const pr = this.acquire();
          pr.fire(sx, sy, Math.cos(ang) * 480, Math.sin(ang) * 480, 12 * this.dmgMul, COLORS.boss, 0, 1.1);
          this.projectiles.push(pr);
        }
        break;
      }
      case 'rain': {
        const n = 3 + phase * 2;
        for (let i = 0; i < n; i++) {
          this.scene.time.delayedCall(i * 170, () => {
            const pr = this.acquire();
            pr.fire(p.x + rand(-100, 320), -30, 0, 560, 14 * this.dmgMul, COLORS.rain, 0, 1.5);
            this.projectiles.push(pr);
          });
        }
        break;
      }
      case 'summon':
        for (let i = 0; i < 2; i++) if (this.alive < MAX_ALIVE) this.spawn(i === 0 ? 'basic' : 'fast', b.x - 50 - i * 40);
        break;
      case 'charge': b.startCharge(); break;
    }
    this.h.onBossAbility(b, a);
  }

  private updateProjectiles(dt: number, archerX: number): void {
    const hitR = ARCHER.hitRadius, cy = GROUND_Y - 45;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      let remove = false;
      if (Math.hypot(p.x - archerX, p.y - cy) < hitR + p.radius) { this.h.onPlayerHit(p.damage, p.x, p.y); remove = true; }
      else if (p.y >= GROUND_Y) { this.h.onFx('impact', p.x, GROUND_Y); remove = true; }
      else if (p.x < -60 || p.x > 1500 || p.y < -200) remove = true;
      if (remove) { p.kill(); this.pool.push(p); this.projectiles.splice(i, 1); }
    }
  }

  clear(): void {
    for (const e of this.enemies) e.destroy();
    this.enemies.length = 0;
    for (const p of this.projectiles) { p.kill(); this.pool.push(p); }
    this.projectiles.length = 0;
  }
}
