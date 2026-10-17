import Phaser from 'phaser';
import { TEX, enemyBodyTex, enemyHeadTex } from '../config/AssetConfig';
import { COMBAT, GAME_WIDTH, GROUND_Y } from '../config/GameConfig';
import type { EnemyDef } from '../types/EnemyTypes';
import type { Circle, Rect } from '../utils/PhysicsUtils';
import { rand } from '../utils/RandomUtils';
import type { Anchor } from './Arrow';

export type DamageSource = 'arrow' | 'explosion' | 'dot' | 'lightning';
export type StatusFx = 'fire' | 'poison' | 'ice';
export interface EnemyEvents {
  melee(e: Enemy): void; shoot(e: Enemy): void; death(e: Enemy): void; fx(kind: StatusFx, x: number, y: number): void;
}
export interface EnemyUpdateCtx { archerX: number; covers: readonly Rect[] }

export class Enemy extends Phaser.GameObjects.Container implements Anchor {
  readonly def: EnemyDef;
  readonly maxHp: number;
  hp: number;
  dead = false;
  killedBy: DamageSource = 'arrow';
  moving = false;
  // hit zones, mutated in place each frame (no per-frame allocation)
  readonly headC: Circle = { x: 0, y: 0, r: 0 };
  readonly weakC: Circle = { x: 0, y: 0, r: 0 };
  readonly bodyR: Rect = { x: 0, y: 0, w: 0, h: 0 };
  readonly shieldR: Rect = { x: 0, y: 0, w: 0, h: 0 };
  readonly hasShield: boolean;
  readonly hasWeak: boolean;

  protected readonly events: EnemyEvents;
  protected chargeT = 0;
  private readonly bodyImg: Phaser.GameObjects.Image;
  private readonly headImg: Phaser.GameObjects.Image;
  private readonly core?: Phaser.GameObjects.Image;
  private readonly bar: Phaser.GameObjects.Graphics;
  private flashT = 0; private burnT = 0; private burnDps = 0; private poisonT = 0; private poisonDps = 0; private freezeT = 0; private fxT = 0;
  private meleeT = 0.4; private shootT = 1.2; private hopT = 0; private nextHop = 0; private hop = 0; private walkT = Math.random() * 6;
  private coverState = 0; private coverX = 0; private coverWait = 0; private readonly wobble = Math.random() * 6.28;

  constructor(scene: Phaser.Scene, x: number, def: EnemyDef, events: EnemyEvents, hpMul = 1) {
    super(scene, x, GROUND_Y);
    this.def = def; this.events = events;
    this.maxHp = Math.round(def.health * hpMul); this.hp = this.maxHp;
    this.hasShield = def.shield; this.hasWeak = !!def.weakPoint;
    this.bodyImg = scene.add.image(0, 0, enemyBodyTex(def.kind)).setOrigin(0.5, 1);
    this.headImg = scene.add.image(0, -72, enemyHeadTex(def.kind)).setOrigin(0.5, 34 / 52);
    this.add([this.bodyImg, this.headImg]);
    if (def.shield) this.add(scene.add.image(-32, -36, TEX.shield));
    if (this.hasWeak) {
      this.core = scene.add.image(0, -34, TEX.orb).setTint(0xff3030).setScale(1.3).setBlendMode(Phaser.BlendModes.ADD);
      this.add(this.core);
      scene.tweens.add({ targets: this.core, alpha: { from: 0.45, to: 1 }, duration: 420, yoyo: true, repeat: -1 });
    }
    this.setScale(def.scale).setDepth(10);
    this.bar = scene.add.graphics().setDepth(11);
    scene.add.existing(this);
    this.nextHop = rand(500, 1500);
    this.syncZones();
  }

  protected syncZones(): void {
    const s = this.def.scale, x = this.x, y = this.y;
    this.bodyR.x = x - 20 * s; this.bodyR.y = y - 62 * s; this.bodyR.w = 40 * s; this.bodyR.h = 62 * s;
    this.headC.x = x; this.headC.y = y - 72 * s; this.headC.r = 17 * s;
    this.weakC.x = x; this.weakC.y = y - 34 * s; this.weakC.r = 13 * s;
    this.shieldR.x = x - 39 * s; this.shieldR.y = y - 64 * s; this.shieldR.w = 14 * s; this.shieldR.h = 56 * s;
  }

  takeDamage(amount: number, source: DamageSource): number {
    if (this.dead) return 0;
    const eff = amount * (1 - this.def.defense);
    this.flashT = 0.08;
    this.applyDamage(eff, source);
    this.refreshTint();
    return eff;
  }

  private applyDamage(n: number, source: DamageSource): void {
    this.hp -= n;
    if (this.hp <= 0 && !this.dead) { this.hp = 0; this.killedBy = source; this.die(); }
  }

  burn(secs: number, dps: number): void { this.burnT = secs; this.burnDps = dps; }
  poison(secs: number, dps: number): void { this.poisonT = secs; this.poisonDps = dps; }
  freeze(secs: number): void { this.freezeT = secs; }
  get frozen(): boolean { return this.freezeT > 0; }
  startCharge(): void { this.chargeT = 1.3; }

  private die(): void {
    this.dead = true;
    this.events.death(this);
    this.bar.destroy();
    this.scene.tweens.add({ targets: this, angle: 85, alpha: 0, y: this.y + 8, duration: 460, onComplete: () => this.destroy() });
  }

  private refreshTint(): void {
    if (this.flashT > 0) { this.bodyImg.setTintFill(0xffffff); this.headImg.setTintFill(0xffffff); return; }
    const c = this.freezeT > 0 ? 0x88ccff : this.burnT > 0 ? 0xff9955 : this.poisonT > 0 ? 0x88ff88 : 0;
    if (c) { this.bodyImg.setTint(c); this.headImg.setTint(c); } else { this.bodyImg.clearTint(); this.headImg.clearTint(); }
  }

  update(dt: number, time: number, ctx: EnemyUpdateCtx): void {
    if (this.dead) return;
    this.flashT = Math.max(0, this.flashT - dt);
    const s = this.def.scale;
    if (this.burnT > 0) {
      this.burnT -= dt; this.applyDamage(this.burnDps * dt, 'dot'); this.fxT -= dt;
      if (this.fxT <= 0) { this.fxT = 0.2; this.events.fx('fire', this.x, this.y - 40 * s); }
    }
    if (!this.dead && this.poisonT > 0) {
      this.poisonT -= dt; this.applyDamage(this.poisonDps * dt, 'dot'); this.fxT -= dt;
      if (this.fxT <= 0) { this.fxT = 0.3; this.events.fx('poison', this.x, this.y - 50 * s); }
    }
    if (this.dead) return;
    if (this.freezeT > 0) {
      this.freezeT -= dt; this.moving = false;
      if (this.freezeT <= 0) this.events.fx('ice', this.x, this.y - 40 * s);
    } else this.move(dt, time, ctx);
    this.refreshTint();
    this.syncZones();
    this.drawBar();
  }

  private move(dt: number, time: number, ctx: EnemyUpdateCtx): void {
    const d = this.def;
    const dist = this.x - ctx.archerX;
    this.meleeT -= dt; this.shootT -= dt;
    let vx: number;
    if (this.chargeT > 0) {
      this.chargeT -= dt; vx = -d.speed * 4.5;
      if (dist <= COMBAT.meleeRange + 30 * d.scale) { vx = 0; this.chargeT = 0; this.events.melee(this); }
    } else {
      switch (d.behavior) {
        case 'ranged': {
          const hold = ctx.archerX + d.attackRange;
          vx = this.x > hold + 4 ? -d.speed : this.x < hold - 70 ? d.speed * 0.6 : 0;
          if (d.fireRate > 0 && this.x <= hold + 30 && this.shootT <= 0) { this.shootT = d.fireRate / 1000; this.events.shoot(this); }
          break;
        }
        case 'patrol': vx = -d.speed * 0.35 + Math.sin(time * 0.0028 + this.wobble) * d.speed * 0.9; break;
        case 'dodge': vx = -d.speed; this.updateHop(dt, time); break;
        case 'cover': vx = this.coverVx(dt, ctx); break;
        default: vx = -d.speed;
      }
      if (d.behavior !== 'ranged' && dist <= COMBAT.meleeRange) {
        vx = 0;
        if (this.meleeT <= 0) { this.meleeT = COMBAT.meleeCooldown; this.events.melee(this); }
      }
    }
    this.x = Math.min(GAME_WIDTH + 80, this.x + vx * dt);
    this.moving = Math.abs(vx) > 1;
    this.walkT += dt * (this.moving ? 9 : 2);
    this.y = GROUND_Y - this.hop;
    this.bodyImg.scaleY = 1 + Math.sin(this.walkT) * 0.035;
  }

  private updateHop(dt: number, time: number): void {
    if (this.hopT > 0) this.hopT -= dt;
    else if (time > this.nextHop) { this.hopT = 0.6; this.nextHop = time + rand(1400, 2800); }
    this.hop = this.hopT > 0 ? Math.sin(Math.PI * (1 - this.hopT / 0.6)) * 80 * this.def.scale : 0;
  }

  private coverVx(dt: number, ctx: EnemyUpdateCtx): number {
    if (this.coverState === 0) {
      let best: Rect | null = null;
      for (const c of ctx.covers) if (c.x + c.w < this.x - 5 && c.x > ctx.archerX + 120 && (!best || c.x > best.x)) best = c;
      if (best) { this.coverX = best.x + best.w + 34 * this.def.scale; this.coverState = 1; } else this.coverState = 3;
    }
    if (this.coverState === 1) {
      if (this.x > this.coverX) return -this.def.speed * 1.2;
      this.coverState = 2; this.coverWait = 1.8; return 0;
    }
    if (this.coverState === 2) { this.coverWait -= dt; if (this.coverWait <= 0) this.coverState = 3; return 0; }
    return -this.def.speed;
  }

  private drawBar(): void {
    this.bar.clear();
    if (this.hp >= this.maxHp) return;
    const s = this.def.scale, w = 44 * s, x = this.x - w / 2, y = this.y - 100 * s;
    this.bar.fillStyle(0x10131c, 0.8).fillRect(x - 1, y - 1, w + 2, 7);
    this.bar.fillStyle(this.hp / this.maxHp > 0.4 ? 0x66dd55 : 0xff5544, 1).fillRect(x, y, w * (this.hp / this.maxHp), 5);
  }

  override destroy(fromScene?: boolean): void {
    if (this.bar.active) this.bar.destroy();
    super.destroy(fromScene);
  }
}
