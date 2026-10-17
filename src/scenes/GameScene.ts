import Phaser from 'phaser';
import { isKnownSpawn } from '../config/EnemyConfig';
import { ARCHER, COMBAT, FEEL, FOCUS_TIME_SCALE, GAME_HEIGHT, GAME_WIDTH, GROUND_Y, PHYSICS, PICKUP_CFG } from '../config/GameConfig';
import { ABILITIES, ARROWS, ARROW_ORDER, POWERUPS } from '../config/WeaponConfig';
import { Archer } from '../entities/Archer';
import type { Arrow } from '../entities/Arrow';
import { Boss } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import { Prop } from '../entities/Prop';
import { Target } from '../entities/Target';
import { HitZone, type GameMode, type GameSceneData, type ResultData, type ResultNote, type RunSummary } from '../types/GameTypes';
import type { PlayerStats, PowerUpKind, ArrowKind, AbilityId } from '../types/WeaponTypes';
import type { LevelData } from '../types/LevelTypes';
import { AchievementSystem } from '../systems/AchievementSystem';
import { AimSystem } from '../systems/AimSystem';
import { ArrowPhysics, type ArrowHooks } from '../systems/ArrowPhysics';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { InputManager } from '../systems/InputManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { Pickup, PowerUpSystem } from '../systems/PowerUpSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { services, type Services } from '../systems/Services';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { HUD } from '../ui/HUD';
import { txt } from '../ui/Button';
import { clamp, dist, lerp } from '../utils/MathUtils';
import { vibrate } from '../utils/DeviceUtils';
import { predictTrajectory, type Rect } from '../utils/PhysicsUtils';
import { chance, rand, seeded, shuffle } from '../utils/RandomUtils';

export class GameScene extends Phaser.Scene {
  private mode: GameMode = 'campaign';
  private levelId = 1;
  private sv!: Services;
  private level!: LevelData;
  private pstats!: PlayerStats;
  private bg!: BackgroundSystem;
  private fx!: ParticleSystem;
  private archer!: Archer;
  private arrows!: ArrowPhysics;
  private collision!: CollisionSystem;
  private enemySys!: EnemySystem;
  private waves!: WaveSystem;
  private combo!: ComboSystem;
  private scoreSys!: ScoreSystem;
  private powerups!: PowerUpSystem;
  private aim!: AimSystem;
  private hud!: HUD;
  private inputMgr!: InputManager;
  private trajG!: Phaser.GameObjects.Graphics;
  private hurtFlash!: Phaser.GameObjects.Rectangle;
  private debugText?: Phaser.GameObjects.Text;
  private debugG?: Phaser.GameObjects.Graphics;
  private props: Prop[] = [];
  private coverRects: Rect[] = [];
  private targets: Target[] = [];
  private floats: Phaser.GameObjects.Text[] = [];
  private ammo: Partial<Record<ArrowKind, number>> = {};
  private ownedArrows: ArrowKind[] = ['normal'];
  private arrowKind: ArrowKind = 'normal';
  private hooks!: ArrowHooks;
  private targetEnemy: Enemy | null = null;
  private targetT = 0;
  // run state
  private hp = 100; private maxHp = 100;
  private gameT = 0; private lastShot = -9; private hitStop = 0; private focusUntil = 0; private focusReadyAt = 0; private mendUsed = false;
  private arrowsFired = 0; private hitArrows = 0; private headshots = 0; private kills = 0; private bossKills = 0;
  private damageTaken = 0; private coinsRun = 0; private usedSpecial = false; private arrowsLeft: number | null = null;
  private ended = false; private waveLabel = '';

  constructor() { super('Game'); }

  init(data: Partial<GameSceneData>): void { this.mode = data.mode ?? 'campaign'; this.levelId = data.levelId ?? 1; }

  create(): void {
    this.sv = services(this);
    this.level = this.sv.levels.forMode(this.mode, this.levelId, this.sv.save.d.unlocked);
    this.pstats = new UpgradeSystem(this.sv.save).stats();
    this.maxHp = this.pstats.health; this.hp = this.maxHp;
    this.resetRunState();

    this.bg = new BackgroundSystem(this, this.level.environment);
    this.fx = new ParticleSystem(this, this.sv.save);
    this.fx.weather(this.level.environment);
    this.spawnProps();
    this.trajG = this.add.graphics().setDepth(15);
    this.archer = new Archer(this, ARCHER.x);
    this.arrows = new ArrowPhysics(this);
    this.combo = new ComboSystem(); this.scoreSys = new ScoreSystem(); this.powerups = new PowerUpSystem(this);
    this.aim = new AimSystem(() => this.archer.pivotWorld, () => this.chargeMs());
    this.waves = new WaveSystem(this.level, this.mode);
    this.collision = new CollisionSystem(() => ({ enemies: this.enemySys.enemies, props: this.props, targets: this.targets, pickups: this.powerups.pickups }), {
      onEnemyHit: (a, e, z, x, y) => this.onEnemyHit(a, e, z, x, y),
      onShieldBlock: (a, e, x, y) => this.onShieldBlock(a, e, x, y),
      onPropHit: (a, p, x, y) => this.onPropHit(a, p, x, y),
      onTargetHit: (a, t, x, y) => this.onTargetHit(a, t, x, y),
      onPickupHit: (_a, p) => this.collectPickup(p),
    });
    this.enemySys = new EnemySystem(this, () => this.archer, {
      onDeath: e => this.onEnemyDeath(e),
      onPlayerHit: (d, x, y) => this.damageArcher(d, x, y),
      onFx: (k, x, y) => this.fx.burst(k, x, y),
      onBossPhase: (b, p) => this.onBossPhase(b, p),
      onBossAbility: (b, a) => { this.shake(120, FEEL.hitShake * 2); if (a === 'charge') this.banner('CHARGE!', '', '#ff8844', 44); void b; },
    }, this.level.difficulty ?? this.level.id);
    this.hooks = {
      test: (a, x1, y1, x2, y2) => this.collision.test(a, x1, y1, x2, y2),
      onSplit: a => this.onSplit(a),
      onGround: a => this.onArrowGround(a),
      onExpire: a => { if (!a.didHit && !a.isChild) this.registerMiss(); },
    };

    const d = this.sv.save.d;
    this.ownedArrows = ARROW_ORDER.filter(k => d.ownedArrows.includes(k));
    this.arrowKind = this.ownedArrows.includes(d.equippedArrow) ? d.equippedArrow : 'normal';
    for (const k of this.ownedArrows) if (k !== 'normal') this.ammo[k] = this.level.specialAmmo ?? ARROWS[k].ammo;
    this.archer.setArrowKind(this.arrowKind);
    this.arrowsLeft = this.level.arrows ?? null;

    this.hurtFlash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 200, GAME_HEIGHT + 200, 0xff0000, 0).setDepth(95).setScrollFactor(0);
    this.hud = new HUD(this, { onPause: () => this.pauseGame(), onArrow: k => this.selectArrow(k), onAbility: id => this.useAbility(id) }, this.ownedArrows, d.ownedAbilities);
    this.inputMgr = new InputManager(this, {
      down: () => this.onPointerDown(), up: () => this.onPointerUp(), cancel: () => this.aim.cancel(),
      pause: () => this.pauseGame(), restart: () => this.scene.restart({ mode: this.mode, levelId: this.levelId }),
      ability: id => this.useAbility(id), selectArrow: i => { const k = this.ownedArrows[i]; if (k) this.selectArrow(k); },
      debug: k => this.debugKey(k),
    });
    this.events.on('resume', () => { this.inputMgr.reset(); this.aim.cancel(); });
    if (import.meta.env.DEV) { this.debugText = this.add.text(12, 120, '', { fontFamily: 'monospace', fontSize: '14px', color: '#9dff9d', backgroundColor: '#000000aa' }).setDepth(900).setScrollFactor(0).setVisible(false); this.debugG = this.add.graphics().setDepth(899).setVisible(false); }

    this.sv.audio.playMusic(this.level.boss ? 'boss' : 'game');
    this.cameras.main.fadeIn(300);
    this.time.delayedCall(500, () => this.banner(this.level.id > 0 ? `LEVEL ${this.level.id}` : this.level.name.toUpperCase(), this.level.id > 0 ? this.level.name : '', '#ffd35a', 56, this.level.hint));
  }

  private resetRunState(): void {
    this.gameT = 0; this.lastShot = -9; this.hitStop = 0; this.focusUntil = 0; this.focusReadyAt = 0; this.mendUsed = false;
    this.arrowsFired = 0; this.hitArrows = 0; this.headshots = 0; this.kills = 0; this.bossKills = 0; this.damageTaken = 0;
    this.coinsRun = 0; this.usedSpecial = false; this.ended = false; this.waveLabel = ''; this.targetEnemy = null; this.targetT = 0;
    this.props = []; this.coverRects = []; this.targets = []; this.floats = []; this.ammo = {};
  }

  private chargeMs(): number { return this.pstats.chargeMs * (this.powerups.isActive('rapid', this.gameT) ? 0.4 : 1); }

  // ---------------------------------------------------------------- world setup
  private spawnProps(): void {
    const p = this.level.props ?? { barrels: 0, crates: 0, covers: 0 };
    const kinds: Array<'barrel' | 'crate' | 'cover'> = [];
    for (let i = 0; i < p.covers; i++) kinds.push('cover');
    for (let i = 0; i < p.barrels; i++) kinds.push('barrel');
    for (let i = 0; i < p.crates; i++) kinds.push('crate');
    if (!kinds.length) return;
    const rnd = seeded(this.level.id * 131 + 7);
    shuffle(kinds, rnd);
    const slots = kinds.length, span = 1130 - 560;
    kinds.forEach((k, i) => {
      const x = 560 + (slots === 1 ? span / 2 : (i / (slots - 1)) * span) + (rnd() - 0.5) * 30;
      const prop = new Prop(this, k, x);
      this.props.push(prop);
      if (k === 'cover') this.coverRects.push(prop.rect);
    });
  }

  // ---------------------------------------------------------------- input / shooting
  private onPointerDown(): void {
    if (this.ended) return;
    if (this.arrowsLeft !== null && this.arrowsLeft <= 0) return;
    this.aim.begin(this.gameT * 1000);
    this.sv.audio.play('draw');
  }
  private onPointerUp(): void {
    const shot = this.aim.release();
    if (shot && !this.ended) this.shoot(shot.angle, shot.power);
  }

  private shoot(angle: number, power: number): void {
    const rapid = this.powerups.isActive('rapid', this.gameT);
    if (this.gameT - this.lastShot < (rapid ? PHYSICS.shotCooldown / 2 : PHYSICS.shotCooldown)) return;
    if (this.arrowsLeft !== null && this.arrowsLeft <= 0) return;
    let kind = this.arrowKind;
    if (kind !== 'normal' && (this.ammo[kind] ?? 0) <= 0) { kind = 'normal'; this.arrowKind = 'normal'; this.archer.setArrowKind(kind); }
    const def = ARROWS[kind];
    if (kind !== 'normal') { this.ammo[kind] = (this.ammo[kind] ?? 0) - 1; this.usedSpecial = true; }
    if (this.arrowsLeft !== null) this.arrowsLeft--;
    this.lastShot = this.gameT; this.arrowsFired++;
    const perfect = this.powerups.isActive('aim', this.gameT);
    const spread = perfect ? 0 : (1 - this.pstats.accuracy) * COMBAT.maxSpread * (1 - power * 0.5);
    const a = angle + rand(-spread, spread);
    const speed = lerp(PHYSICS.minSpeed, PHYSICS.maxSpeed, power) * this.pstats.power * this.pstats.arrowSpeed * def.speedMul;
    const dmg = this.pstats.damage * def.damageMul * (this.powerups.isActive('damage', this.gameT) ? 1.6 : 1) * (0.55 + 0.45 * power);
    const tip = this.archer.bowTip(a);
    this.arrows.fire(tip.x, tip.y, Math.cos(a) * speed, Math.sin(a) * speed, kind, dmg, def.pierce + this.pstats.pierceBonus, perfect ? COMBAT.perfectGravity : 1, power);
    this.archer.kick();
    this.sv.audio.play('release');
    this.shake(70, FEEL.shootShake * (0.5 + power));
    this.fx.burst('spark', tip.x, tip.y, 0.5);
  }

  private selectArrow(k: ArrowKind): void {
    if (!this.ownedArrows.includes(k) || (k !== 'normal' && (this.ammo[k] ?? 0) <= 0)) return;
    this.arrowKind = k; this.archer.setArrowKind(k); this.sv.audio.play('click');
  }

  private useAbility(id: AbilityId): void {
    if (this.ended || !this.sv.save.d.ownedAbilities.includes(id)) return;
    if (id === 'focus' && this.gameT >= this.focusReadyAt && this.gameT >= this.focusUntil) {
      this.focusUntil = this.gameT + ABILITIES.focus.duration * FOCUS_TIME_SCALE; // game-time runs slower while focused
      this.focusReadyAt = this.focusUntil + ABILITIES.focus.cooldown;
      this.sv.audio.play('powerup'); this.banner('FOCUS', '', '#66ccff', 40);
    } else if (id === 'mend' && !this.mendUsed && this.hp < this.maxHp) {
      this.mendUsed = true; this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.4);
      this.fx.burst('heal', this.archer.x, GROUND_Y - 60); this.sv.audio.play('powerup'); this.float(this.archer.x, GROUND_Y - 120, 'MEND', '#ff77aa', 30);
    }
  }

  // ---------------------------------------------------------------- hit handling
  private onEnemyHit(a: Arrow, e: Enemy, zone: HitZone, x: number, y: number): void {
    const head = zone === HitZone.Head, weak = zone === HitZone.Weak;
    let mult = head ? COMBAT.headMult : weak ? COMBAT.weakMult : 1;
    const crit = Math.random() < this.pstats.critChance;
    if (crit) mult *= COMBAT.critMult;
    this.markHit(a);
    e.takeDamage(a.damage * mult, 'arrow');
    this.targetEnemy = e; this.targetT = 3;
    if (head) this.headshots++;
    const moving = e.moving && (e.def.behavior === 'dodge' || e.def.behavior === 'patrol' || e.def.speed >= 100);
    const cm = this.combo.hit(this.gameT * 1000);
    const res = this.scoreSys.hit({ head, long: Math.abs(x - a.startX) > COMBAT.longDistance, moving }, cm);
    this.fx.burst(head ? 'headshot' : 'impact', x, y);
    this.sv.audio.play(head ? 'headshot' : 'impact');
    this.shake(head ? 130 : 80, head ? FEEL.headShake : FEEL.hitShake);
    vibrate(head ? 40 : 15, this.sv.save.d.settings.vibration);
    if (head) this.hitStop = FEEL.hitStopMs / 1000;
    if (res.label) this.float(x, y - 40, res.label, head ? '#ff4a3a' : '#66ddff', head ? 40 : 30);
    this.float(x, y - (res.label ? 12 : 30), `+${res.points}`, '#ffd35a', 28);
    if (cm >= 2) { this.float(x + 40, y - 70, `COMBO x${cm}`, '#ffffff', 26); this.sv.audio.play('combo'); }
    if (crit && !head) this.float(x, y - 60, 'CRIT!', '#ff9944', 26);
    if (!e.dead) this.applyArrowEffect(a, e, x, y);
    if (a.kind === 'explosive') { this.explode(x, y, a.damage * COMBAT.explosionMult, COMBAT.explosionRadius * this.pstats.explosion); a.kill(); return; }
    if (a.pierceLeft > 0) a.pierceLeft--; else a.stick(e);
  }

  private markHit(a: Arrow): void { if (!a.didHit) { a.didHit = true; this.hitArrows++; } }

  private applyArrowEffect(a: Arrow, e: Enemy, x: number, y: number): void {
    const el = this.pstats.elemental;
    switch (a.kind) {
      case 'fire': e.burn(COMBAT.burnSecs, COMBAT.burnDps * el); this.fx.burst('fire', x, y); break;
      case 'poison': e.poison(COMBAT.poisonSecs, COMBAT.poisonDps * el); this.fx.burst('poison', x, y); break;
      case 'ice': e.freeze(COMBAT.freezeSecs); this.fx.burst('ice', x, y); break;
      case 'lightning': this.fx.burst('lightning', x, y); this.chain(e, a.damage); break;
      default: break;
    }
  }

  private chain(from: Enemy, dmg: number): void {
    let cx = from.x, cy = from.y - 40 * from.def.scale;
    const done = new Set<Enemy>([from]);
    for (let i = 0; i < COMBAT.lightningChains; i++) {
      let best: Enemy | null = null, bd: number = COMBAT.lightningRange;
      for (const e of this.enemySys.enemies) {
        if (e.dead || done.has(e)) continue;
        const d = dist(cx, cy, e.x, e.y - 40 * e.def.scale);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) break;
      done.add(best);
      const tx = best.x, ty = best.y - 40 * best.def.scale;
      this.bolt(cx, cy, tx, ty);
      best.takeDamage(dmg * COMBAT.lightningMult, 'lightning');
      this.fx.burst('lightning', tx, ty);
      cx = tx; cy = ty;
    }
  }

  private bolt(x1: number, y1: number, x2: number, y2: number): void {
    const g = this.add.graphics().setDepth(35);
    g.lineStyle(4, 0xffee55, 1).beginPath().moveTo(x1, y1);
    const n = 6;
    for (let i = 1; i < n; i++) g.lineTo(lerp(x1, x2, i / n) + rand(-14, 14), lerp(y1, y2, i / n) + rand(-14, 14));
    g.lineTo(x2, y2).strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
  }

  private onShieldBlock(a: Arrow, e: Enemy, x: number, y: number): void {
    this.sv.audio.play('clank'); this.fx.burst('spark', x, y);
    this.float(x, y - 30, 'BLOCKED', '#cfd5e0', 24);
    a.hits.add(e); a.vx = -a.vx * 0.25; a.vy = -260; a.damage *= 0.4;
    this.shake(60, FEEL.hitShake * 0.6);
  }

  private onPropHit(a: Arrow, p: Prop, x: number, y: number): void {
    if (p.kind === 'cover') {
      this.fx.burst('spark', x, y); this.sv.audio.play('thud');
      if (a.kind === 'explosive') { this.explode(x, y, a.damage * COMBAT.explosionMult, COMBAT.explosionRadius * this.pstats.explosion); a.kill(); return; }
      if (!a.didHit && !a.isChild) this.registerMiss();
      a.x = x; a.y = y; a.stick();
    } else if (p.kind === 'crate') {
      this.fx.burst('death', p.x, p.y - 20); this.sv.audio.play('impact');
      this.coinsRun += 15; this.float(p.x, p.y - 60, '+15', '#ffd35a', 24); this.fx.burst('coin', p.x, p.y - 30);
      if (chance(0.3)) this.powerups.drop(p.x);
      p.destroyProp(); a.vx *= 0.8;
    } else {
      this.explodeBarrel(p);
    }
  }

  private explodeBarrel(p: Prop): void {
    if (p.dead) return;
    const x = p.x, y = p.y - 28;
    p.destroyProp();
    this.explode(x, y, COMBAT.barrelDamage, COMBAT.barrelRadius);
  }

  private onTargetHit(a: Arrow, t: Target, x: number, y: number): void {
    const bull = t.ringFor(x, y) < 0.3;
    t.dead = true; this.markHit(a);
    const cm = this.combo.hit(this.gameT * 1000);
    const res = this.scoreSys.hit({ head: false, long: Math.abs(x - a.startX) > COMBAT.longDistance, moving: t.moving, bullseye: bull }, cm);
    this.fx.burst(bull ? 'headshot' : 'impact', t.x, t.y); this.sv.audio.play(bull ? 'headshot' : 'impact');
    this.float(t.x, t.y - 30, bull ? 'BULLSEYE!' : 'HIT!', bull ? '#ff4a3a' : '#ffffff', bull ? 38 : 28);
    this.float(t.x, t.y, `+${res.points}`, '#ffd35a', 28);
    this.coinsRun += bull ? 10 : 5;
    this.tweens.add({ targets: t, scale: 1.6, alpha: 0, duration: 220, onComplete: () => t.destroy() });
    if (a.pierceLeft > 0) a.pierceLeft--; else a.kill();
  }

  private collectPickup(p: Pickup): void {
    const kind: PowerUpKind = p.kind;
    this.powerups.remove(p);
    this.sv.audio.play('powerup'); this.fx.burst('heal', p.x, p.y);
    this.float(p.x, p.y - 30, POWERUPS[kind].label.toUpperCase(), '#ffffff', 26);
    if (kind === 'heal') this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.3);
    else this.powerups.activate(kind, this.gameT);
  }

  private explode(x: number, y: number, dmg: number, radius: number): number {
    this.fx.burst('explosion', x, y); this.sv.audio.play('explosion');
    this.shake(260, FEEL.explosionShake);
    const ring = this.add.circle(x, y, 10, 0xffaa22, 0.45).setDepth(34);
    this.tweens.add({ targets: ring, scale: radius / 10, alpha: 0, duration: 320, onComplete: () => ring.destroy() });
    let n = 0;
    for (const e of this.enemySys.enemies) {
      if (e.dead) continue;
      const reach = radius + 25 * e.def.scale, d = dist(x, y, e.x, e.y - 30 * e.def.scale);
      if (d <= reach) { e.takeDamage(dmg * (1 - 0.6 * (d / reach)), 'explosion'); n++; }
    }
    for (const t of this.targets) if (!t.dead && dist(x, y, t.x, t.y) <= radius + 30) { t.dead = true; this.scoreSys.add(100); this.coinsRun += 5; this.fx.burst('impact', t.x, t.y); t.destroy(); }
    for (const p of this.props) if (p.kind === 'barrel' && !p.dead && dist(x, y, p.x, p.y - 28) <= radius) this.time.delayedCall(140, () => this.explodeBarrel(p));
    return n;
  }

  private onSplit(a: Arrow): void {
    const sp = Math.hypot(a.vx, a.vy), ang = Math.atan2(a.vy, a.vx);
    for (let i = 1; i <= COMBAT.splitCount; i++) {
      const s = i % 2 ? 1 : -1, an = ang + s * COMBAT.splitAngle * Math.ceil(i / 2);
      this.arrows.fire(a.x, a.y, Math.cos(an) * sp, Math.sin(an) * sp, 'split', a.damage, a.pierceLeft, a.gravityScale, a.power, true);
    }
    this.fx.burst('spark', a.x, a.y);
  }

  private onArrowGround(a: Arrow): void {
    if (a.kind === 'explosive') {
      const n = this.explode(a.x, GROUND_Y, a.damage * COMBAT.explosionMult, COMBAT.explosionRadius * this.pstats.explosion);
      if (n > 0) this.markHit(a);
      a.kill();
    } else this.fx.burst('dust', a.x, GROUND_Y);
    if (!a.didHit && !a.isChild) this.registerMiss();
  }

  private registerMiss(): void {
    if (this.combo.count >= 2) this.float(this.archer.x + 80, GROUND_Y - 160, 'COMBO LOST', '#9aa3b5', 22);
    this.combo.miss();
  }

  // ---------------------------------------------------------------- enemies / player
  private onEnemyDeath(e: Enemy): void {
    this.kills++;
    const boss = e instanceof Boss;
    const reward = Math.round(e.def.reward * (this.powerups.isActive('coin', this.gameT) ? 2 : 1));
    this.coinsRun += reward;
    const s = e.def.scale;
    this.fx.burst('death', e.x, e.y - 40 * s, boss ? 3 : 1);
    this.sv.audio.play('death');
    this.float(e.x, e.y - 110 * s, `+${reward}`, '#ffd35a', 26);
    this.fx.burst('coin', e.x, e.y - 50 * s);
    if (e.killedBy === 'explosion') this.float(e.x, e.y - 140 * s, `EXPLOSION! +${this.scoreSys.explosiveKill()}`, '#ffaa22', 30);
    if (boss) this.onBossDefeated(e as Boss);
    else if (chance(PICKUP_CFG.dropChance + (e.def.reward >= 40 ? 0.3 : 0))) this.powerups.drop(e.x);
  }

  private onBossDefeated(b: Boss): void {
    this.bossKills++;
    this.fx.burst('explosion', b.x, b.y - 60 * b.def.scale, 2); this.fx.burst('victory', b.x, b.y - 60);
    this.sv.audio.play('victory'); this.shake(500, FEEL.explosionShake * 1.4); this.hitStop = 0.18;
    this.banner('BOSS DEFEATED!', b.bossDef.name, '#ffd35a', 58);
    this.powerups.drop(b.x, 'heal');
    this.sv.audio.playMusic('game');
  }

  private onBossPhase(b: Boss, phase: number): void {
    this.banner(`PHASE ${phase}`, phase === 3 ? 'Enraged!' : 'It grows stronger!', '#ff5544', 48);
    this.shake(300, FEEL.explosionShake); this.sv.audio.play('boss'); this.fx.burst('explosion', b.x, b.y - 60, 0.7);
  }

  private onBossSpawn(b: Boss): void {
    this.sv.audio.play('boss'); this.sv.audio.playMusic('boss');
    this.banner(b.bossDef.name.toUpperCase(), b.bossDef.title, '#ff5544', 54);
    this.cameras.main.zoomTo(1.07, 600, 'Sine.easeInOut');
    this.time.delayedCall(2200, () => this.cameras.main.zoomTo(1, 700, 'Sine.easeInOut'));
  }

  private damageArcher(dmg: number, x: number, y: number): void {
    if (this.ended) return;
    if (this.powerups.isActive('shield', this.gameT)) { this.fx.burst('ice', this.archer.x, GROUND_Y - 50, 0.5); this.sv.audio.play('clank'); return; }
    const eff = dmg * (1 - this.pstats.defense);
    this.hp -= eff; this.damageTaken += eff;
    this.sv.audio.play('hurt'); this.shake(220, FEEL.hurtShake); vibrate(80, this.sv.save.d.settings.vibration);
    this.fx.burst('impact', x, y);
    this.float(this.archer.x, GROUND_Y - 120, `-${Math.ceil(eff)}`, '#ff5544', 30);
    this.tweens.killTweensOf(this.hurtFlash); this.hurtFlash.setAlpha(0.25);
    this.tweens.add({ targets: this.hurtFlash, alpha: 0, duration: 350 });
  }

  private spawnType(type: string): void {
    if (!isKnownSpawn(type)) { console.warn(`[GameScene] skipping unknown spawn "${type}"`); return; }
    if (type === 'target') { this.targets.push(new Target(this, rand(720, 1150), rand(250, 500), this.level.id >= 11 || this.mode !== 'campaign')); return; }
    if (type.startsWith('boss:')) { const b = this.enemySys.spawnBoss(type.slice(5)); if (b) this.onBossSpawn(b); return; }
    this.enemySys.spawn(type);
  }

  // ---------------------------------------------------------------- feedback helpers
  private shake(ms: number, intensity: number): void {
    const st = this.sv.save.d.settings;
    this.cameras.main.shake(ms, intensity * (st.reducedMotion ? 0.25 : 1));
  }

  private float(x: number, y: number, text: string, color = '#ffffff', size = 28): void {
    let t = this.floats.find(f => !f.active);
    if (!t) { t = txt(this, 0, 0, '', size).setDepth(60); this.floats.push(t); }
    this.tweens.killTweensOf(t);
    t.setActive(true).setVisible(true).setText(text).setColor(color).setFontSize(size).setPosition(x, y).setAlpha(1).setScale(0.6);
    const tt = t;
    this.tweens.add({ targets: tt, scale: 1, duration: 120, ease: 'Back.easeOut' });
    this.tweens.add({ targets: tt, y: y - 60, alpha: 0, duration: 850, delay: 150, onComplete: () => tt.setActive(false).setVisible(false) });
  }

  private banner(text: string, sub = '', color = '#ffd35a', size = 60, hint?: string): void {
    const objs: Phaser.GameObjects.Text[] = [txt(this, GAME_WIDTH / 2, 290, text, size, color)];
    if (sub) objs.push(txt(this, GAME_WIDTH / 2, 290 + size * 0.85, sub, 28, '#e8ecf5'));
    if (hint) objs.push(txt(this, GAME_WIDTH / 2, 290 + size * 0.85 + 46, hint, 24, '#9dd6ff', [0.5, 0.5], false).setWordWrapWidth(900).setAlign('center'));
    for (const o of objs) o.setDepth(200).setScrollFactor(0).setAlpha(0).setScale(0.6);
    this.tweens.add({ targets: objs, alpha: 1, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: objs, alpha: 0, duration: 400, delay: hint ? 2800 : 1500, onComplete: () => objs.forEach(o => o.destroy()) });
  }

  private drawTrajectory(): void {
    const g = this.trajG; g.clear();
    if (!this.aim.charging) return;
    const def = ARROWS[this.arrowKind];
    const power = Math.max(PHYSICS.minPower, this.aim.power);
    const speed = lerp(PHYSICS.minSpeed, PHYSICS.maxSpeed, power) * this.pstats.power * this.pstats.arrowSpeed * def.speedMul;
    const tip = this.archer.bowTip(this.aim.angle);
    const perfect = this.powerups.isActive('aim', this.gameT);
    const pts = predictTrajectory(tip.x, tip.y, Math.cos(this.aim.angle) * speed, Math.sin(this.aim.angle) * speed,
      PHYSICS.gravity * (perfect ? COMBAT.perfectGravity : 1), perfect ? 80 : PHYSICS.trajectorySteps, PHYSICS.trajectoryDt, GROUND_Y, this.coverRects);
    pts.forEach((p, i) => {
      const a = 1 - i / pts.length;
      g.fillStyle(perfect ? 0x66ddff : 0xffffff, 0.15 + 0.7 * a).fillCircle(p.x, p.y, 5 - 2.5 * (i / pts.length));
    });
    const end = pts[pts.length - 1];
    if (end) g.lineStyle(3, 0xffd35a, 0.8).strokeCircle(end.x, end.y, 11);
  }

  // ---------------------------------------------------------------- game loop
  update(_t: number, delta: number): void {
    const raw = Math.min(delta, 50) / 1000;
    this.bg.update(raw, this.input.activePointer.x);
    if (this.ended) return;
    if (this.hitStop > 0) { this.hitStop -= raw; return; }
    const dt = raw * (this.gameT < this.focusUntil ? FOCUS_TIME_SCALE : 1);
    this.gameT += dt;
    const now = this.gameT * 1000;

    const ax = this.inputMgr.axis();
    if (ax !== 0) this.archer.moveTo(clamp(this.archer.x + ax * this.pstats.moveSpeed * dt, ARCHER.minX, ARCHER.maxX));
    const ptr = this.input.activePointer;
    this.aim.setPointer(ptr.worldX, ptr.worldY); this.aim.update(now, dt);
    this.archer.setAim(this.aim.angle, this.aim.power, true, now);
    this.drawTrajectory();

    this.arrows.update(dt, this.hooks);
    this.updateTargets(dt, now);
    this.props = this.props.filter(p => !p.dead);
    this.powerups.update(dt, now);
    this.enemySys.update(dt, now, this.props);
    this.combo.update(now);
    this.waves.update(dt, this.aliveCount(), {
      spawn: t => this.spawnType(t),
      waveStart: (n, total) => { this.waveLabel = total ? `WAVE ${n}/${total}` : `WAVE ${n}`; if (n > 1 || total === null) this.banner(this.waveLabel, '', '#ffffff', 44); },
    });
    this.targetT -= dt;
    this.checkEnd();
    this.updateHud();
    if (import.meta.env.DEV) this.updateDebug();
  }

  private aliveCount(): number { return this.enemySys.alive + this.targets.length; }

  private updateTargets(dt: number, now: number): void {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (t.dead) { this.targets.splice(i, 1); continue; }
      t.tick(dt, now);
      if (t.ttl <= 0) { t.destroy(); this.targets.splice(i, 1); }
    }
  }

  private checkEnd(): void {
    const timed = this.level.timeLimit > 0;
    if (this.hp <= 0) return this.finish(false);
    if (timed && this.gameT >= this.level.timeLimit) return this.finish(this.mode === 'timeAttack');
    if (!this.waves.endless && this.waves.done && this.aliveCount() === 0) return this.finish(true);
    if (this.arrowsLeft !== null && this.arrowsLeft <= 0 && this.arrows.inFlight === 0 && this.aliveCount() > 0) this.finish(false);
  }

  private updateHud(): void {
    let target: { name: string; hp: number; max: number; boss: boolean } | null = null;
    for (const e of this.enemySys.enemies) if (e instanceof Boss && !e.dead) { target = { name: `${e.bossDef.name} - ${e.bossDef.title}`, hp: e.hp, max: e.maxHp, boss: true }; break; }
    if (!target && this.targetT > 0 && this.targetEnemy && !this.targetEnemy.dead) target = { name: this.targetEnemy.def.name, hp: this.targetEnemy.hp, max: this.targetEnemy.maxHp, boss: false };
    const timeLeft = this.level.timeLimit > 0 ? this.level.timeLimit - this.gameT : null;
    this.hud.update({
      hp: Math.max(0, this.hp), maxHp: this.maxHp, score: this.scoreSys.total, coins: this.coinsRun, timeLeft, elapsed: this.gameT,
      power: this.aim.power, combo: this.combo.count, target, arrow: this.arrowKind, ammo: this.ammo, powerups: this.powerups.active(this.gameT),
      waveText: this.level.id > 0 ? `${this.waveLabel}` : this.waveLabel, arrowsLeft: this.arrowsLeft,
      focusCd: Math.max(0, this.focusReadyAt - this.gameT), focusActive: this.gameT < this.focusUntil,
      mendReady: !this.mendUsed && this.hp < this.maxHp, shield: this.powerups.isActive('shield', this.gameT),
    });
  }

  // ---------------------------------------------------------------- end of run
  private finish(win: boolean): void {
    if (this.ended) return;
    this.ended = true; this.aim.cancel(); this.trajG.clear();
    const m = this.mode, save = this.sv.save, d = save.d;
    const campaignLike = m === 'campaign' || m === 'precision';
    const score = Math.floor(this.scoreSys.total);
    const accuracy = this.arrowsFired > 0 ? Math.min(1, this.hitArrows / this.arrowsFired) : 0;
    let stars = 0;
    if (win && campaignLike) { stars = 1; if (score >= this.level.targetScore) stars = 2; if (score >= this.level.threeStarScore) stars = 3; }
    const firstClear = campaignLike && win && !save.levelResult(this.levelId);
    let coins = this.coinsRun;
    if (win && campaignLike) coins += stars * 40 + Math.floor(score / 25) + (firstClear ? 100 : 0);
    else if (!campaignLike) coins += Math.floor(score / 40);
    else coins = Math.floor(coins * 0.6);

    let newBest = false;
    if (campaignLike && win) { newBest = save.recordLevel(this.levelId, stars, score); if (this.levelId < this.sv.levels.count) save.unlockUpTo(this.levelId + 1); }
    else if (m === 'endless') { newBest = score > d.bestEndless; d.bestEndless = Math.max(d.bestEndless, score); }
    else if (m === 'timeAttack') { newBest = score > d.bestTimeAttack; d.bestTimeAttack = Math.max(d.bestTimeAttack, score); }
    d.stats.arrowsFired += this.arrowsFired; d.stats.hits += this.hitArrows; d.stats.kills += this.kills;
    d.stats.headshots += this.headshots; d.stats.bossesDefeated += this.bossKills;
    if (win && m === 'campaign' && this.damageTaken === 0) d.stats.perfectLevels++;
    save.addCoins(coins);

    const summary: RunSummary = {
      mode: m, levelId: this.levelId, win, score, stars, accuracy, headshots: this.headshots, kills: this.kills,
      damageTaken: Math.floor(this.damageTaken), maxCombo: this.combo.best, coins, time: this.gameT, usedSpecial: this.usedSpecial,
      newBest, bossesDefeated: this.bossKills, arrowsFired: this.arrowsFired,
    };
    const notes: ResultNote[] = [];
    const ach = new AchievementSystem(save);
    for (const a of ach.evaluate(summary)) notes.push({ title: `Achievement: ${a.name}`, sub: `${a.desc}  +${a.reward} coins` });
    const daily = ach.daily(summary);
    if (daily) notes.push({ title: 'Daily Challenge complete!', sub: `${daily.text}  +${daily.reward} coins` });

    this.sv.audio.play(win ? 'victory' : 'gameover');
    if (win) { this.fx.burst('victory', GAME_WIDTH / 2, GAME_HEIGHT - 100); }
    const data: ResultData = { summary, notes };
    this.time.delayedCall(win ? 1300 : 900, () => this.cameras.main.fadeOut(250, 0, 0, 0, (_c: unknown, p: number) => { if (p >= 1) this.scene.start(win ? 'LevelComplete' : 'GameOver', data); }));
  }

  private pauseGame(): void {
    if (this.ended || this.scene.isPaused()) return;
    this.aim.cancel();
    this.scene.launch('Pause', { mode: this.mode, levelId: this.levelId });
    this.scene.pause();
  }

  // ---------------------------------------------------------------- debug (dev only)
  private debugKey(k: 'F1' | 'N' | 'W' | 'B' | 'P'): void {
    if (!import.meta.env.DEV) return;
    if (k === 'F1') { const v = !this.debugText?.visible; this.debugText?.setVisible(v); this.debugG?.setVisible(v); if (!v) this.debugG?.clear(); }
    else if (k === 'W') this.finish(true);
    else if (k === 'N') this.scene.restart({ mode: this.mode, levelId: Math.min(this.sv.levels.count, this.levelId + 1) });
    else if (k === 'B') this.spawnType('boss:stoneGiant');
    else if (k === 'P') this.pauseGame();
  }

  private updateDebug(): void {
    if (!this.debugText?.visible || !this.debugG) return;
    const p = this.input.activePointer;
    this.debugText.setText([
      `FPS ${Math.round(this.game.loop.actualFps)}`, `Enemies ${this.enemySys.alive}  Targets ${this.targets.length}`, `Arrows ${this.arrows.active.length}`,
      `Player x ${Math.round(this.archer.x)}  HP ${Math.round(this.hp)}`, `Pointer ${Math.round(p.worldX)},${Math.round(p.worldY)}`,
      `Level ${this.level.id} (${this.mode})  Wave ${this.waves.waveNo}`, `Last hit: ${this.collision.lastInfo}`,
    ]);
    const g = this.debugG; g.clear().lineStyle(1, 0x00ff00, 1);
    for (const e of this.enemySys.enemies) { g.strokeRect(e.bodyR.x, e.bodyR.y, e.bodyR.w, e.bodyR.h); g.strokeCircle(e.headC.x, e.headC.y, e.headC.r); if (e.hasShield) g.strokeRect(e.shieldR.x, e.shieldR.y, e.shieldR.w, e.shieldR.h); }
    g.lineStyle(1, 0xffff00, 1); for (const r of this.coverRects) g.strokeRect(r.x, r.y, r.w, r.h);
  }
}
