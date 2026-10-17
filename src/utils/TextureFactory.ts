import Phaser from 'phaser';
import { ENV_THEMES, TEX, arrowTex, bgTex, enemyBodyTex, enemyHeadTex, type EnvTheme } from '../config/AssetConfig';
import { BOSSES, ENEMIES } from '../config/EnemyConfig';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { ARROWS } from '../config/WeaponConfig';
import type { EnemyDef } from '../types/EnemyTypes';
import { ENVIRONMENTS, type EnvironmentKind } from '../types/LevelTypes';
import { seeded } from './RandomUtils';

type G = Phaser.GameObjects.Graphics;
const W = GAME_WIDTH;

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return; // external asset (or earlier generation) wins
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}
const shade = (c: number, f: number): number => {
  const r = Math.min(255, Math.floor(((c >> 16) & 255) * f)), gr = Math.min(255, Math.floor(((c >> 8) & 255) * f)), b = Math.min(255, Math.floor((c & 255) * f));
  return (r << 16) | (gr << 8) | b;
};
const periodic = (x: number, waves: ReadonlyArray<readonly [number, number, number]>): number => {
  let v = 0;
  for (const [k, a, p] of waves) v += a * Math.sin((2 * Math.PI * k * x) / W + p);
  return v;
};

export function generateAllTextures(scene: Phaser.Scene): void {
  genBasics(scene);
  for (const a of Object.values(ARROWS)) genArrow(scene, a.kind, a.color);
  genArcher(scene);
  for (const d of [...Object.values(ENEMIES), ...Object.values(BOSSES)]) genEnemy(scene, d);
  genProps(scene);
  for (const env of ENVIRONMENTS) genBackground(scene, env, ENV_THEMES[env]);
}

function genBasics(scene: Phaser.Scene): void {
  make(scene, TEX.dot, 16, 16, g => { g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8); });
  make(scene, TEX.orb, 32, 32, g => {
    for (let r = 16; r > 0; r -= 2) { g.fillStyle(0xffffff, 0.06 + ((16 - r) / 16) * 0.3); g.fillCircle(16, 16, r); }
  });
  make(scene, TEX.coin, 20, 20, g => {
    g.fillStyle(0xb8860b, 1); g.fillCircle(10, 10, 10); g.fillStyle(0xffd35a, 1); g.fillCircle(10, 10, 8);
    g.fillStyle(0xfff2a8, 1); g.fillCircle(7, 7, 3); g.lineStyle(1.5, 0xb8860b, 1); g.strokeCircle(10, 10, 5);
  });
  make(scene, TEX.pickup, 52, 52, g => {
    g.fillStyle(0xffffff, 0.25); g.fillCircle(26, 26, 26); g.fillStyle(0xffffff, 1); g.fillCircle(26, 26, 20);
    g.lineStyle(3, 0x10131c, 0.55); g.strokeCircle(26, 26, 20);
  });
  make(scene, TEX.shield, 16, 60, g => {
    g.fillStyle(0x6b7580, 1); g.fillRoundedRect(0, 0, 16, 60, 5); g.fillStyle(0xaab4bf, 1); g.fillRoundedRect(2, 2, 8, 56, 4);
    g.fillStyle(0xd9a441, 1); g.fillCircle(8, 30, 4);
  });
  make(scene, TEX.vignette, W, GAME_HEIGHT, g => {
    for (let i = 0; i < 40; i++) { g.lineStyle(10, 0x000000, 0.42 * Math.pow(1 - i / 40, 2)); g.strokeRect(i * 6, i * 3.4, W - i * 12, GAME_HEIGHT - i * 6.8); }
  });
  make(scene, TEX.target, 64, 64, g => {
    const rings: Array<[number, number]> = [[31, 0xc0392b], [24, 0xffffff], [17, 0xc0392b], [10, 0xffffff], [4, 0xffd35a]];
    for (const [r, c] of rings) { g.fillStyle(c, 1); g.fillCircle(32, 32, r); }
    g.lineStyle(3, 0x4a2c10, 1); g.strokeCircle(32, 32, 31);
  });
}

function genArrow(scene: Phaser.Scene, kind: string, color: number): void {
  make(scene, arrowTex(kind), 64, 12, g => {
    g.lineStyle(3, 0x8b5a2b, 1); g.beginPath(); g.moveTo(4, 6); g.lineTo(56, 6); g.strokePath();
    g.fillStyle(0xcc3333, 1); g.fillTriangle(0, 0, 12, 6, 3, 6); g.fillTriangle(0, 12, 12, 6, 3, 6);
    if (kind !== 'normal') { g.fillStyle(color, 0.45); g.fillCircle(55, 6, 6); }
    g.fillStyle(kind === 'normal' ? 0xd0d0d8 : color, 1); g.fillTriangle(64, 6, 52, 0.5, 52, 11.5);
  });
}

function genArcher(scene: Phaser.Scene): void {
  make(scene, TEX.archerBody, 48, 80, g => {
    g.fillStyle(0x5a3a1a, 1); g.fillRoundedRect(4, 10, 9, 36, 3); g.fillStyle(0xcc3333, 1); g.fillRect(6, 6, 2, 8); g.fillRect(9, 8, 2, 6);
    g.fillStyle(0x2c5d8f, 1); g.fillRoundedRect(12, 20, 26, 44, 7);
    g.fillStyle(0x1d4166, 1); g.fillRect(12, 44, 26, 5);
    g.fillStyle(0x4a3220, 1); g.fillRect(14, 62, 9, 18); g.fillRect(27, 62, 9, 18);
    g.fillStyle(0xf1c9a0, 1); g.fillRoundedRect(30, 26, 12, 9, 4);
  });
  make(scene, TEX.archerHead, 44, 44, g => {
    g.fillStyle(0xf1c9a0, 1); g.fillCircle(22, 24, 15);
    g.fillStyle(0x2f7a3a, 1); g.beginPath(); g.arc(22, 21, 17, Math.PI, 0, false); g.closePath(); g.fillPath();
    g.fillTriangle(5, 22, 20, 22, 2, 36); g.fillStyle(0x1b1b1b, 1); g.fillCircle(28, 24, 2.4);
  });
  make(scene, TEX.bow, 34, 100, g => {
    g.lineStyle(6, 0x6b3f1d, 1); g.beginPath();
    for (let i = 0; i <= 24; i++) { const t = i / 24; const x = 26 - 18 * Math.sin(Math.PI * t), y = 4 + 92 * t; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.strokePath();
    g.lineStyle(2, 0xd9a066, 1); g.beginPath();
    for (let i = 0; i <= 24; i++) { const t = i / 24; const x = 25 - 18 * Math.sin(Math.PI * t), y = 4 + 92 * t; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.strokePath(); g.fillStyle(0x2b1b10, 1); g.fillRoundedRect(5, 43, 9, 14, 3);
  });
}

function genEnemy(scene: Phaser.Scene, d: EnemyDef): void {
  const dark = shade(d.color, 0.6);
  make(scene, enemyBodyTex(d.kind), 56, 66, g => {
    g.fillStyle(dark, 1); g.fillRect(14, 50, 12, 16); g.fillRect(30, 50, 12, 16);
    g.fillStyle(d.color, 1); g.fillRoundedRect(10, 12, 36, 42, 9);
    g.fillStyle(shade(d.color, 1.25), 1); g.fillRoundedRect(14, 14, 28, 8, 4);
    g.fillStyle(0x2b1b10, 1); g.fillRect(10, 40, 36, 5);
    g.fillStyle(d.accent, 1); g.fillRoundedRect(2, 24, 12, 9, 4); // front arm (left)
    if (d.behavior === 'ranged' && d.fireRate > 0 && d.accessory !== 'hat') { g.lineStyle(3, 0x6b3f1d, 1); g.beginPath(); g.arc(4, 28, 14, -1.3, 1.3, false); g.strokePath(); }
    if (d.accessory === 'hat') { g.lineStyle(3, 0x6b3f1d, 1); g.beginPath(); g.moveTo(3, 4); g.lineTo(3, 60); g.strokePath(); g.fillStyle(0xb26bff, 1); g.fillCircle(3, 4, 5); }
    if (d.accessory === 'helmet' || d.accessory === 'horns') { g.fillStyle(0x9aa3ad, 1); g.fillRoundedRect(6, 12, 12, 12, 4); g.fillRoundedRect(38, 12, 12, 12, 4); }
    if (!d.weakPoint && d.shield === false && d.behavior === 'advance') { g.lineStyle(4, 0x5a3a1a, 1); g.beginPath(); g.moveTo(2, 26); g.lineTo(2, 46); g.strokePath(); }
  });
  make(scene, enemyHeadTex(d.kind), 52, 52, g => {
    const cy = 34;
    g.fillStyle(d.accent, 1); g.fillCircle(26, cy, 16);
    g.fillStyle(0xffffff, 1); g.fillCircle(17, cy - 2, 4.5); g.fillCircle(30, cy - 2, 3.5);
    g.fillStyle(d.weakPoint ? 0xff3030 : 0x1b1b1b, 1); g.fillCircle(16, cy - 2, 2.4); g.fillCircle(29, cy - 2, 2);
    g.lineStyle(2, 0x3a1a10, 1); g.beginPath(); g.moveTo(14, cy + 8); g.lineTo(26, cy + 6); g.strokePath();
    switch (d.accessory) {
      case 'helmet': g.fillStyle(0x9aa3ad, 1); g.beginPath(); g.arc(26, cy - 2, 17, Math.PI, 0, false); g.closePath(); g.fillPath(); g.fillRect(24, cy - 2, 4, 12); break;
      case 'hat': g.fillStyle(0x4a2a8a, 1); g.fillTriangle(8, cy - 8, 44, cy - 8, 26, 0); g.fillRect(6, cy - 10, 40, 5); break;
      case 'hood': g.fillStyle(shade(d.color, 0.8), 1); g.beginPath(); g.arc(26, cy - 2, 17, Math.PI * 0.95, Math.PI * 2.05, false); g.closePath(); g.fillPath(); break;
      case 'horns': g.fillStyle(0xe8e0c8, 1); g.fillTriangle(8, cy - 8, 14, cy - 12, 4, 4); g.fillTriangle(44, cy - 8, 38, cy - 12, 48, 4); g.fillStyle(0x9aa3ad, 1); g.beginPath(); g.arc(26, cy - 2, 17, Math.PI, 0, false); g.closePath(); g.fillPath(); break;
      case 'crown': g.fillStyle(0xffd35a, 1); g.fillRect(10, cy - 16, 32, 8); for (let i = 0; i < 4; i++) g.fillTriangle(10 + i * 10, cy - 16, 18 + i * 10, cy - 16, 14 + i * 10, cy - 28); break;
      default: break;
    }
  });
}

function genProps(scene: Phaser.Scene): void {
  make(scene, TEX.barrel, 44, 58, g => {
    g.fillStyle(0x8a4b1f, 1); g.fillRoundedRect(2, 0, 40, 58, 10);
    g.fillStyle(0x4a2a10, 1); g.fillRect(2, 10, 40, 5); g.fillRect(2, 42, 40, 5);
    g.fillStyle(0xd63a2a, 1); g.fillRect(14, 22, 16, 14); g.fillStyle(0xffffff, 1); g.fillTriangle(22, 24, 18, 33, 26, 33);
  });
  make(scene, TEX.crate, 48, 48, g => {
    g.fillStyle(0xb98a4e, 1); g.fillRect(0, 0, 48, 48); g.lineStyle(4, 0x6b4a22, 1); g.strokeRect(2, 2, 44, 44);
    g.beginPath(); g.moveTo(4, 4); g.lineTo(44, 44); g.moveTo(44, 4); g.lineTo(4, 44); g.strokePath();
  });
  make(scene, TEX.cover, 96, 130, g => {
    g.fillStyle(0x6f7580, 1); g.fillRoundedRect(0, 24, 96, 106, 16); g.fillRoundedRect(14, 4, 68, 40, 14);
    g.fillStyle(0x8b919c, 1); g.fillRoundedRect(8, 30, 40, 90, 12);
    g.lineStyle(2, 0x4a4f59, 1); g.beginPath(); g.moveTo(60, 40); g.lineTo(52, 70); g.lineTo(66, 90); g.moveTo(24, 100); g.lineTo(34, 120); g.strokePath();
    g.fillStyle(0x5c8a3a, 1); g.fillRoundedRect(16, 2, 64, 9, 4);
  });
}

function genBackground(scene: Phaser.Scene, env: EnvironmentKind, t: EnvTheme): void {
  make(scene, bgTex('sky', env), W, GAME_HEIGHT, g => {
    g.fillGradientStyle(t.skyTop, t.skyTop, t.skyBottom, t.skyBottom, 1); g.fillRect(0, 0, W, GAME_HEIGHT);
    if (env === 'dungeon' || env === 'volcano') { const r = seeded(7); g.fillStyle(0xffffff, 0.5); for (let i = 0; i < 40; i++) g.fillCircle(r() * W, r() * 300, 1 + r() * 1.2); }
  });
  make(scene, bgTex('far', env), W, 340, g => {
    g.fillStyle(shade(t.far, 1.15), 0.9); g.beginPath(); g.moveTo(0, 340);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, 160 + periodic(x, [[3, 34, 1.1], [7, 14, 0.3]]));
    g.lineTo(W, 340); g.closePath(); g.fillPath();
    g.fillStyle(t.far, 1); g.beginPath(); g.moveTo(0, 340);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, 210 + periodic(x, [[2, 40, 0.5], [5, 22, 1.7], [9, 10, 2.4]]));
    g.lineTo(W, 340); g.closePath(); g.fillPath();
  });
  make(scene, bgTex('near', env), W, 300, g => {
    const r = seeded(env.length * 977 + env.charCodeAt(0));
    g.fillStyle(t.near, 1); g.fillRect(0, 262, W, 38);
    for (let i = 0; i < 16; i++) {
      const x = r() * W, h = 80 + r() * 150, k = r();
      for (const off of [-W, 0, W]) drawNearItem(g, env, t, x + off, 282, h, k);
    }
  });
  make(scene, bgTex('ground', env), W, 112, g => {
    g.fillStyle(t.ground, 1); g.fillRect(0, 6, W, 106);
    g.fillStyle(0x000000, 0.22); g.fillRect(0, 62, W, 50);
    g.fillStyle(t.edge, 1); g.fillRect(0, 0, W, 12);
    const r = seeded(env.length + 31);
    for (let i = 0; i < 60; i++) { g.fillStyle(shade(t.ground, 0.7 + r() * 0.5), 1); g.fillCircle(r() * W, 24 + r() * 80, 2 + r() * 4); }
    for (let x = 0; x < W; x += 14) { g.fillStyle(t.edge, 1); g.fillTriangle(x, 8, x + 5, -2 + ((x * 7) % 5), x + 10, 8); }
  });
}

function drawNearItem(g: G, env: EnvironmentKind, t: EnvTheme, x: number, base: number, h: number, k: number): void {
  const c = t.near, light = shade(t.near, 1.3);
  switch (env) {
    case 'forest': case 'snow': {
      g.fillStyle(0x3b2a1a, 1); g.fillRect(x - 5, base - h * 0.25, 10, h * 0.25);
      for (let i = 0; i < 3; i++) {
        const w = h * 0.42 * (1 - i * 0.2), y0 = base - h * 0.2 - i * h * 0.25;
        g.fillStyle(i % 2 ? light : c, 1); g.fillTriangle(x - w, y0, x + w, y0, x, y0 - h * 0.45);
        if (env === 'snow') { g.fillStyle(0xffffff, 0.9); g.fillTriangle(x - w * 0.45, y0 - h * 0.2, x + w * 0.45, y0 - h * 0.2, x, y0 - h * 0.45); }
      }
      break;
    }
    case 'desert':
      g.fillStyle(c, 1); g.fillRoundedRect(x - 7, base - h * 0.7, 14, h * 0.7, 6); g.fillRoundedRect(x - 24, base - h * 0.5, 18, 9, 4); g.fillRoundedRect(x - 24, base - h * 0.5 - 22, 9, 26, 4);
      g.fillRoundedRect(x + 6, base - h * 0.4, 18, 9, 4); g.fillRoundedRect(x + 15, base - h * 0.4 - 20, 9, 24, 4); break;
    case 'castle':
      g.fillStyle(c, 1); g.fillRect(x - 24, base - h, 48, h); for (let i = 0; i < 4; i++) g.fillRect(x - 24 + i * 14, base - h - 11, 10, 11);
      g.fillStyle(0xffd27f, 0.9); g.fillRect(x - 4, base - h * 0.65, 8, 16); break;
    case 'ruins':
      g.fillStyle(c, 1); g.fillRect(x - 11, base - h, 22, h); g.fillTriangle(x - 11, base - h, x + 11, base - h, x + 3, base - h - 16);
      g.fillStyle(light, 1); g.fillRect(x - 18, base - 9, 36, 9); break;
    case 'volcano':
      g.fillStyle(c, 1); g.fillTriangle(x - 34, base, x + 34, base, x + (k - 0.5) * 20, base - h);
      g.fillStyle(0xff5a1a, 0.85); g.fillTriangle(x - 5, base - h * 0.8, x + 5, base - h * 0.8, x, base - h); break;
    case 'dungeon':
      g.fillStyle(c, 1); g.fillTriangle(x - 16, base, x + 16, base, x, base - h * 0.6); g.fillTriangle(x - 18, 0, x + 18, 0, x, h * 0.55);
      if (k > 0.75) { g.fillStyle(0xffa040, 0.9); g.fillCircle(x, base - h * 0.75, 6); g.fillStyle(0xffa040, 0.25); g.fillCircle(x, base - h * 0.75, 18); } break;
    case 'temple':
      g.fillStyle(c, 1); g.fillRect(x - 15, base - h, 30, h); g.fillStyle(light, 1); g.fillRect(x - 21, base - h - 9, 42, 9); g.fillRect(x - 21, base - 8, 42, 8);
      g.lineStyle(2, 0x3fa070, 0.8); g.beginPath(); g.moveTo(x - 8, base - h); g.lineTo(x - 11, base - h * 0.5); g.strokePath(); break;
  }
}
