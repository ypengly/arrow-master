import type { Arrow } from '../entities/Arrow';
import type { Enemy } from '../entities/Enemy';
import type { Prop } from '../entities/Prop';
import type { Target } from '../entities/Target';
import type { Pickup } from './PowerUpSystem';
import { HitZone } from '../types/GameTypes';
import { segmentHitsCircle, segmentHitsRect } from '../utils/PhysicsUtils';

export interface CollisionTargets { enemies: readonly Enemy[]; props: readonly Prop[]; targets: readonly Target[]; pickups: readonly Pickup[] }
export interface CollisionHandlers {
  onEnemyHit(a: Arrow, e: Enemy, zone: HitZone, x: number, y: number): void;
  onShieldBlock(a: Arrow, e: Enemy, x: number, y: number): void;
  onPropHit(a: Arrow, p: Prop, x: number, y: number): void;
  onTargetHit(a: Arrow, t: Target, x: number, y: number): void;
  onPickupHit(a: Arrow, p: Pickup): void;
}
interface Candidate { d: number; apply: () => void }

/** Swept-segment collision: picks the nearest valid hit along the arrow path (head/weak/body/shield/props/targets/pickups). */
export class CollisionSystem {
  private readonly cands: Candidate[] = [];
  lastInfo = '';

  constructor(private readonly targets: () => CollisionTargets, private readonly h: CollisionHandlers) {}

  /** Returns true when the arrow was stopped. */
  test(a: Arrow, x1: number, y1: number, x2: number, y2: number): boolean {
    const t = this.targets();
    const c = this.cands; c.length = 0;
    const dist = (cx: number, cy: number): number => Math.hypot(cx - x1, cy - y1);

    for (const p of t.props) {
      if (p.dead || a.hits.has(p)) continue;
      if (segmentHitsRect(x1, y1, x2, y2, p.rect)) c.push({ d: dist(p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h / 2), apply: () => { a.hits.add(p); this.lastInfo = `prop:${p.kind}`; this.h.onPropHit(a, p, x2, y2); } });
    }
    for (const e of t.enemies) {
      if (e.dead || a.hits.has(e)) continue;
      if (e.hasShield && a.vx > 0 && segmentHitsRect(x1, y1, x2, y2, e.shieldR) && !segmentHitsCircle(x1, y1, x2, y2, e.headC)) {
        c.push({ d: dist(e.shieldR.x, e.shieldR.y + e.shieldR.h / 2), apply: () => { this.lastInfo = 'shield'; this.h.onShieldBlock(a, e, x2, y2); } });
        continue;
      }
      let zone: HitZone | null = null; let zx = e.x; let zy = e.y;
      if (segmentHitsCircle(x1, y1, x2, y2, e.headC)) { zone = HitZone.Head; zx = e.headC.x; zy = e.headC.y; }
      else if (e.hasWeak && segmentHitsCircle(x1, y1, x2, y2, e.weakC)) { zone = HitZone.Weak; zx = e.weakC.x; zy = e.weakC.y; }
      else if (segmentHitsRect(x1, y1, x2, y2, e.bodyR)) { zone = HitZone.Body; zx = e.bodyR.x + e.bodyR.w / 2; zy = e.bodyR.y + e.bodyR.h / 2; }
      if (zone) { const z = zone; c.push({ d: dist(zx - 30, zy), apply: () => { a.hits.add(e); this.lastInfo = z; this.h.onEnemyHit(a, e, z, x2, y2); } }); }
    }
    for (const tg of t.targets) {
      if (tg.dead || a.hits.has(tg)) continue;
      if (segmentHitsCircle(x1, y1, x2, y2, tg.circle)) c.push({ d: dist(tg.x, tg.y), apply: () => { a.hits.add(tg); this.lastInfo = 'target'; this.h.onTargetHit(a, tg, x2, y2); } });
    }
    for (const pk of t.pickups) {
      if (a.hits.has(pk)) continue;
      if (segmentHitsCircle(x1, y1, x2, y2, { x: pk.x, y: pk.y, r: pk.radius })) c.push({ d: dist(pk.x, pk.y), apply: () => { a.hits.add(pk); this.h.onPickupHit(a, pk); } });
    }
    if (c.length === 0) return false;
    let best = c[0];
    for (let i = 1; i < c.length; i++) if (c[i].d < best.d) best = c[i];
    best.apply();
    // Pickups never stop the arrow; everything else is decided by the handler (stick/kill/pierce).
    return a.stuck || !a.active;
  }
}
