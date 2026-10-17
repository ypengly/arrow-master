import Phaser from 'phaser';
import { TEX } from '../config/AssetConfig';
import { GAME_WIDTH } from '../config/GameConfig';
import { UPGRADES } from '../config/WeaponConfig';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { services } from '../systems/Services';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import type { UpgradeGroup } from '../types/WeaponTypes';
import { Button, txt } from '../ui/Button';
import { UpgradeCard } from '../ui/UpgradeCard';
import { formatNumber } from '../utils/MathUtils';

export class UpgradeScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  constructor() { super('Upgrade'); }

  create(): void {
    const sv = services(this), sys = new UpgradeSystem(sv.save);
    this.cameras.main.fadeIn(250, 16, 19, 28);
    this.bg = new BackgroundSystem(this, 'castle');
    this.add.rectangle(GAME_WIDTH / 2, 360, GAME_WIDTH, 720, 0x000000, 0.45).setDepth(3);
    txt(this, GAME_WIDTH / 2, 50, 'UPGRADES', 52, '#ffd35a').setDepth(5);
    this.add.image(GAME_WIDTH - 230, 52, TEX.coin).setScale(1.6).setDepth(5);
    const coins = txt(this, GAME_WIDTH - 204, 52, formatNumber(sv.save.d.coins), 32, '#ffffff', [0, 0.5]).setDepth(5);
    const cards: UpgradeCard[] = [];
    const refresh = (): void => { coins.setText(formatNumber(sv.save.d.coins)); cards.forEach(c => c.refresh()); };
    const groups: UpgradeGroup[] = ['Bow', 'Archer', 'Arrows'];
    groups.forEach((g, gi) => {
      const x = 215 + gi * 425;
      txt(this, x, 120, g.toUpperCase(), 32, '#ffffff').setDepth(5);
      UPGRADES.filter(u => u.group === g).forEach((u, i) => cards.push(new UpgradeCard(this, x, 215 + i * 128, u, sys, refresh).setDepth(5)));
    });
    new Button(this, 130, 684, 'BACK', () => this.scene.start('MainMenu'), { w: 190, h: 52, fontSize: 24, color: 0x555a66 }).setDepth(6);
    new Button(this, 1120, 684, 'ARMORY', () => this.scene.start('Armory'), { w: 220, h: 52, fontSize: 24, color: 0x3a6fb0 }).setDepth(6);
  }

  update(_t: number, delta: number): void { this.bg.update(delta / 1000, this.input.activePointer.x); }
}
