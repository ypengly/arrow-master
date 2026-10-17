import Phaser from 'phaser';
import { Button, txt } from './Button';
import type { UpgradeDef } from '../types/WeaponTypes';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { services } from '../systems/Services';
import { formatNumber } from '../utils/MathUtils';

export class UpgradeCard extends Phaser.GameObjects.Container {
  private readonly lv: Phaser.GameObjects.Text;
  private readonly seg: Phaser.GameObjects.Graphics;
  private readonly btn: Button;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly def: UpgradeDef, private readonly sys: UpgradeSystem, private readonly onChange: () => void) {
    super(scene, x, y);
    const bg = scene.add.rectangle(0, 0, 380, 118, 0x1d2335).setStrokeStyle(3, 0x3b4560);
    const name = txt(scene, -176, -38, def.name.toUpperCase(), 24, '#ffd35a', [0, 0.5]);
    const desc = txt(scene, -176, -10, def.desc, 17, '#b8c2d8', [0, 0.5], false);
    this.lv = txt(scene, 176, -38, '', 20, '#ffffff', [1, 0.5]);
    this.seg = scene.add.graphics();
    this.btn = new Button(scene, 100, 34, '', () => { if (this.sys.buy(this.def.id)) { services(scene).audio.play('coin'); this.onChange(); } else services(scene).audio.play('clank'); }, { w: 170, h: 44, fontSize: 21, color: 0x3f8f4f });
    this.add([bg, name, desc, this.lv, this.seg, this.btn]);
    scene.add.existing(this);
    this.refresh();
  }

  refresh(): void {
    const lv = this.sys.level(this.def.id), cost = this.sys.cost(this.def.id);
    this.lv.setText(`Lv ${lv}/${this.def.maxLevel}`);
    this.seg.clear();
    const w = 150 / this.def.maxLevel;
    for (let i = 0; i < this.def.maxLevel; i++) this.seg.fillStyle(i < lv ? 0xffd35a : 0x39404f, 1).fillRect(-176 + i * w, 20, w - 3, 16);
    if (cost === null) this.btn.setLabel('MAXED').setEnabled(false);
    else this.btn.setLabel(`UPGRADE  ${formatNumber(cost)}`).setEnabled(true);
  }
}
