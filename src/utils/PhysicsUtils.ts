export interface Rect { x: number; y: number; w: number; h: number }
export interface Circle { x: number; y: number; r: number }
export interface Point { x: number; y: number }

export function segmentHitsCircle(x1: number, y1: number, x2: number, y2: number, c: Circle): boolean {
  const dx = x2 - x1, dy = y2 - y1;
  const a = dx * dx + dy * dy;
  let t = a === 0 ? 0 : -((x1 - c.x) * dx + (y1 - c.y) * dy) / a;
  t = Math.min(1, Math.max(0, t));
  const px = x1 + dx * t - c.x, py = y1 + dy * t - c.y;
  return px * px + py * py <= c.r * c.r;
}

/** Liang-Barsky segment vs axis-aligned rectangle. */
export function segmentHitsRect(x1: number, y1: number, x2: number, y2: number, r: Rect): boolean {
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}

export const pointInRect = (x: number, y: number, r: Rect): boolean => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

export function predictTrajectory(x: number, y: number, vx: number, vy: number, gravity: number, steps: number, dt: number, groundY: number, blockers: readonly Rect[]): Point[] {
  const pts: Point[] = [];
  let px = x, py = y;
  const pvx = vx;
  let pvy = vy;
  for (let i = 0; i < steps; i++) {
    pvy += gravity * dt;
    px += pvx * dt; py += pvy * dt;
    if (py >= groundY) { pts.push({ x: px, y: groundY }); break; }
    let blocked = false;
    for (const b of blockers) if (pointInRect(px, py, b)) { blocked = true; break; }
    pts.push({ x: px, y: py });
    if (blocked) break;
  }
  return pts;
}
