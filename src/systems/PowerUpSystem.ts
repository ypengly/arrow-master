import Phaser from 'phaser';
import { FONT_FAMILY, TEX } from '../config/AssetConfig';
import { GROUND_Y, PICKUP_CFG } from '../config/GameConfig';
import { POWERUPS, POWERUP_KINDS } from '../config/WeaponConfig';
import type { PowerUpKind } from '../types/WeaponTypes';
import { pick } from '../utils/RandomUtils';

export class Pickup extends Phaser.GameObjects.Container {
  readonly kind: PowerUpKind;
  readonly radius = PICKUP_CFG.radius;
  ttl: number = PICKUP_CFG.lifeSecs;
  private readonly baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PowerUpKind) {
    super(scene, x, y);
    this.kind = kind; this.baseY = y;
    const def = POWERUPS[kind];
    const glow = scene.add.image(0, 0, TEX.orb).setTint(def.color).setScale(2.4).setBlendMode(Phaser.BlendModes.ADD);
    const ring = scene.add.image(0, 0, TEX.pickup).setTint(def.color);
    const label = scene.add.text(0, 0, def.glyph, { fontFamily: FONT_FAMILY, fontSize: '26px', fontStyle: 'bold', color: '#10131c' }).setOrigin(0.5);
    this.add([glow, ring, label]).setDepth(18);
    scene.add.existing(this);
    scene.tweens.add({ targets: ring, scale: { from: 0.9, to: 1.12 }, duration: 500, yoyo: true, repeat: -1 });
  }

  tick(dt: number, time: number): void {
    this.ttl -= dt;
    this.y = this.baseY + Math.sin(time / 300) * 8;
    if (this.ttl < 2.5) this.setAlpha(0.45 + 0.55 * Math.abs(Math.sin(time / 90)));
  }
}

export class PowerUpSystem {
  readonly pickups: Pickup[] = [];
  private readonly until: Partial<Record<PowerUpKind, number>> = {};

  constructor(private readonly scene: Phaser.Scene) {}

  drop(x: number, forced?: PowerUpKind): void {
    this.pickups.push(new Pickup(this.scene, Math.min(Math.max(x, 500), 1180), GROUND_Y - 130, forced ?? pick(POWERUP_KINDS)));
  }

  update(dt: number, time: number): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.tick(dt, time);
      if (p.ttl <= 0) { p.destroy(); this.pickups.splice(i, 1); }
    }
  }

  remove(p: Pickup): void { const i = this.pickups.indexOf(p); if (i >= 0) this.pickups.splice(i, 1); p.destroy(); }

  /** Starts a timed effect (now = game-time seconds). Instant kinds (heal) are handled by the scene. */
  activate(kind: PowerUpKind, now: number): void { const d = POWERUPS[kind].duration; if (d > 0) this.until[kind] = now + d; }
  isActive(kind: PowerUpKind, now: number): boolean { return (this.until[kind] ?? 0) > now; }
  active(now: number): Array<{ kind: PowerUpKind; left: number; total: number }> {
    const out: Array<{ kind: PowerUpKind; left: number; total: number }> = [];
    for (const k of POWERUP_KINDS) { const u = this.until[k] ?? 0; if (u > now) out.push({ kind: k, left: u - now, total: POWERUPS[k].duration }); }
    return out;
  }
  clearAll(): void { for (const p of this.pickups) p.destroy(); this.pickups.length = 0; }
}
