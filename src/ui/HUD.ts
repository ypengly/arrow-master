import Phaser from 'phaser';
import { TEX } from '../config/AssetConfig';
import { GAME_WIDTH, HUD_MARGIN } from '../config/GameConfig';
import { ARROWS, POWERUPS } from '../config/WeaponConfig';
import type { AbilityId, ArrowKind, PowerUpKind } from '../types/WeaponTypes';
import { formatNumber, formatTime } from '../utils/MathUtils';
import { Button, txt } from './Button';
import { HealthBar } from './HealthBar';
import { ProgressBar } from './ProgressBar';

export interface HudCallbacks { onPause(): void; onArrow(k: ArrowKind): void; onAbility(id: AbilityId): void }
export interface HudState {
  hp: number; maxHp: number; score: number; coins: number; timeLeft: number | null; elapsed: number; power: number;
  combo: number; target: { name: string; hp: number; max: number; boss: boolean } | null;
  arrow: ArrowKind; ammo: Partial<Record<ArrowKind, number>>; powerups: Array<{ kind: PowerUpKind; left: number; total: number }>;
  waveText: string; arrowsLeft: number | null; focusCd: number; focusActive: boolean; mendReady: boolean; shield: boolean;
}

const D = 100;
/** In-game overlay. Everything is scroll-fixed, large, and kept inside a 48px safe margin. */
export class HUD {
  private readonly hp: HealthBar; private readonly hpText: Phaser.GameObjects.Text;
  private readonly score: Phaser.GameObjects.Text; private readonly wave: Phaser.GameObjects.Text;
  private readonly coins: Phaser.GameObjects.Text; private readonly time: Phaser.GameObjects.Text;
  private readonly power: ProgressBar; private readonly powerLabel: Phaser.GameObjects.Text;
  private readonly combo: Phaser.GameObjects.Text; private lastCombo = 0;
  private readonly enemyBar: ProgressBar; private readonly enemyName: Phaser.GameObjects.Text;
  private readonly arrowBtns = new Map<ArrowKind, { btn: Button; ammo: Phaser.GameObjects.Text }>();
  private readonly focusBtn?: Button; private readonly mendBtn?: Button;
  private readonly pu: Phaser.GameObjects.Text; private readonly shieldTxt: Phaser.GameObjects.Text;
  private readonly arrowsLeft: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene, cb: HudCallbacks, arrows: ArrowKind[], abilities: AbilityId[]) {
    const m = HUD_MARGIN;
    const fix = <T extends Phaser.GameObjects.GameObject>(o: T): T => { (o as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor(0); (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(D); return o; };
    fix(txt(scene, m, m - 4, '\u2665', 34, '#ff5577', [0, 0.5]));
    this.hp = fix(new HealthBar(scene, m + 40, m - 4, 240, 24));
    this.hpText = fix(txt(scene, m + 160, m - 4, '', 18));
    this.score = fix(txt(scene, GAME_WIDTH / 2, m - 6, '0', 40, '#ffd35a'));
    this.wave = fix(txt(scene, GAME_WIDTH / 2, m + 32, '', 20, '#e8ecf5'));
    fix(scene.add.image(GAME_WIDTH - m - 190, m - 4, TEX.coin).setScale(1.5));
    this.coins = fix(txt(scene, GAME_WIDTH - m - 168, m - 4, '0', 30, '#ffffff', [0, 0.5]));
    this.time = fix(txt(scene, GAME_WIDTH - m - 190, m + 34, '', 24, '#e8ecf5', [0, 0.5]));
    fix(new Button(scene, GAME_WIDTH - m - 24, m + 12, 'II', cb.onPause, { w: 64, h: 64, fontSize: 30, color: 0x3b4560 }));
    this.enemyName = fix(txt(scene, GAME_WIDTH / 2, m + 66, '', 22, '#ffffff'));
    this.enemyBar = fix(new ProgressBar(scene, GAME_WIDTH / 2 - 260, m + 96, 520, 18, 0xff5544));
    this.powerLabel = fix(txt(scene, m, 668, 'POWER', 20, '#ffffff', [0, 0.5]));
    this.power = fix(new ProgressBar(scene, m + 92, 668, 240, 22, 0xffc83a));
    this.combo = fix(txt(scene, m + 10, 190, '', 40, '#ffd35a', [0, 0.5]));
    this.pu = fix(txt(scene, m, 104, '', 20, '#e8ecf5', [0, 0], false));
    this.shieldTxt = fix(txt(scene, 250, 560, '', 22, '#66aaff'));
    this.arrowsLeft = fix(txt(scene, m + 10, 140, '', 26, '#ffffff', [0, 0.5]));

    const show = arrows.length > 1 ? arrows : [];
    show.forEach((k, i) => {
      const bx = GAME_WIDTH - m - 36 - (show.length - 1 - i) * 76, by = 666;
      const btn = fix(new Button(scene, bx, by, `${i + 1}`, () => cb.onArrow(k), { w: 68, h: 68, fontSize: 18, color: ARROWS[k].color & 0x7f7f7f | 0x202020 }));
      const name = fix(txt(scene, bx, by - 9, ARROWS[k].short, 17));
      const ammo = fix(txt(scene, bx, by + 17, '', 18, '#ffffff'));
      this.arrowBtns.set(k, { btn: btn.setLabel(''), ammo });
      void name;
    });
    let ax = 400;
    if (abilities.includes('focus')) { this.focusBtn = fix(new Button(scene, ax, 666, 'FOCUS', () => cb.onAbility('focus'), { w: 110, h: 60, fontSize: 18, color: 0x3a6fb0 })); ax += 124; }
    if (abilities.includes('mend')) this.mendBtn = fix(new Button(scene, ax, 666, 'MEND', () => cb.onAbility('mend'), { w: 110, h: 60, fontSize: 18, color: 0x3f8f4f }));
  }

  update(s: HudState): void {
    this.hp.set(s.hp / s.maxHp);
    this.hpText.setText(`${Math.ceil(s.hp)}`);
    this.score.setText(formatNumber(s.score));
    this.wave.setText(s.waveText);
    this.coins.setText(formatNumber(s.coins));
    this.time.setText(s.timeLeft === null ? formatTime(s.elapsed) : formatTime(Math.max(0, s.timeLeft)));
    this.time.setColor(s.timeLeft !== null && s.timeLeft < 10 ? '#ff5544' : '#e8ecf5');
    this.power.setVisible(s.power > 0 || true); this.power.set(s.power);
    this.power.setColor(s.power > 0.85 ? 0xff5544 : 0xffc83a);
    this.powerLabel.setAlpha(s.power > 0 ? 1 : 0.6);
    if (s.combo >= 2) {
      this.combo.setText(`COMBO x${Math.min(s.combo, 99)}`).setVisible(true);
      if (s.combo !== this.lastCombo) this.scene.tweens.add({ targets: this.combo, scale: { from: 1.4, to: 1 }, duration: 160 });
    } else this.combo.setVisible(false);
    this.lastCombo = s.combo;
    this.enemyBar.setVisible(!!s.target); this.enemyName.setVisible(!!s.target);
    if (s.target) { this.enemyName.setText(s.target.name); this.enemyBar.set(s.target.hp / s.target.max); this.enemyBar.setScale(1, s.target.boss ? 1.4 : 1); }
    this.arrowsLeft.setText(s.arrowsLeft === null ? '' : `ARROWS ${s.arrowsLeft}`);
    this.pu.setText(s.powerups.map(p => `${POWERUPS[p.kind].label} ${Math.ceil(p.left)}s`).join('   '));
    this.shieldTxt.setText(s.shield ? 'SHIELD' : '');
    for (const [k, v] of this.arrowBtns) {
      const n = s.ammo[k];
      v.ammo.setText(k === 'normal' ? '\u221E' : String(n ?? 0));
      v.btn.setOutline(k === s.arrow ? 0xffd35a : 0x10131c).setEnabled(k === 'normal' || (n ?? 0) > 0);
    }
    this.focusBtn?.setLabel(s.focusActive ? 'ON' : s.focusCd > 0 ? `${Math.ceil(s.focusCd)}s` : 'FOCUS').setEnabled(s.focusCd <= 0 && !s.focusActive);
    this.mendBtn?.setEnabled(s.mendReady);
  }
}
