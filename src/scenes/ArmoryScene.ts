import Phaser from 'phaser';
import { TEX } from '../config/AssetConfig';
import { GAME_WIDTH } from '../config/GameConfig';
import { ABILITIES, ARMORS, ARROWS, ARROW_ORDER, BOWS } from '../config/WeaponConfig';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { services } from '../systems/Services';
import type { AbilityId, ArrowKind } from '../types/WeaponTypes';
import { Button, txt } from '../ui/Button';
import { formatNumber } from '../utils/MathUtils';

type Tab = 'BOWS' | 'ARROWS' | 'ARMOR' | 'ABILITIES';
interface Item { id: string; name: string; desc: string; cost: number; owned: boolean; equipped: boolean; equippable: boolean; color: number; ammo?: number }

export class ArmoryScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  private tab: Tab = 'BOWS';
  private content: Phaser.GameObjects.GameObject[] = [];
  private coinText!: Phaser.GameObjects.Text;
  private tabBtns = new Map<Tab, Button>();
  constructor() { super('Armory'); }

  create(): void {
    const sv = services(this);
    this.cameras.main.fadeIn(250, 16, 19, 28);
    this.content = []; this.tabBtns = new Map();
    this.bg = new BackgroundSystem(this, 'ruins');
    this.add.rectangle(GAME_WIDTH / 2, 360, GAME_WIDTH, 720, 0x000000, 0.45).setDepth(3);
    txt(this, GAME_WIDTH / 2, 50, 'ARMORY', 52, '#ffd35a').setDepth(5);
    this.add.image(GAME_WIDTH - 230, 52, TEX.coin).setScale(1.6).setDepth(5);
    this.coinText = txt(this, GAME_WIDTH - 204, 52, formatNumber(sv.save.d.coins), 32, '#ffffff', [0, 0.5]).setDepth(5);
    (['BOWS', 'ARROWS', 'ARMOR', 'ABILITIES'] as Tab[]).forEach((t, i) =>
      this.tabBtns.set(t, new Button(this, 250 + i * 260, 125, t, () => { this.tab = t; this.render(); }, { w: 240, h: 56, fontSize: 24 }).setDepth(5)));
    new Button(this, 130, 684, 'BACK', () => this.scene.start('MainMenu'), { w: 190, h: 52, fontSize: 24, color: 0x555a66 }).setDepth(6);
    new Button(this, 1120, 684, 'UPGRADES', () => this.scene.start('Upgrade'), { w: 220, h: 52, fontSize: 24, color: 0x8a4fb0 }).setDepth(6);
    this.render();
  }

  private items(): Item[] {
    const d = services(this).save.d;
    switch (this.tab) {
      case 'BOWS': return Object.values(BOWS).map(b => ({ id: b.id, name: b.name, desc: b.desc, cost: b.cost, owned: d.ownedBows.includes(b.id), equipped: d.equippedBow === b.id, equippable: true, color: b.color }));
      case 'ARMOR': return Object.values(ARMORS).map(a => ({ id: a.id, name: a.name, desc: a.desc, cost: a.cost, owned: d.ownedArmor.includes(a.id), equipped: d.equippedArmor === a.id, equippable: true, color: a.color }));
      case 'ARROWS': return ARROW_ORDER.map(k => ({ id: k, name: `${ARROWS[k].name} Arrow`, desc: ARROWS[k].desc, cost: ARROWS[k].cost, owned: d.ownedArrows.includes(k), equipped: d.equippedArrow === k, equippable: true, color: ARROWS[k].color, ammo: ARROWS[k].ammo }));
      default: return Object.values(ABILITIES).map(a => ({ id: a.id, name: a.name, desc: a.desc, cost: a.cost, owned: d.ownedAbilities.includes(a.id), equipped: d.ownedAbilities.includes(a.id), equippable: false, color: 0x66aaff }));
    }
  }

  private act(it: Item): void {
    const sv = services(this), d = sv.save.d;
    if (!it.owned) {
      if (!sv.save.spend(it.cost)) { sv.audio.play('clank'); return; }
      sv.audio.play('coin');
      if (this.tab === 'BOWS') d.ownedBows.push(it.id);
      else if (this.tab === 'ARMOR') d.ownedArmor.push(it.id);
      else if (this.tab === 'ARROWS') d.ownedArrows.push(it.id as ArrowKind);
      else d.ownedAbilities.push(it.id as AbilityId);
    }
    if (it.equippable) {
      if (this.tab === 'BOWS') d.equippedBow = it.id; else if (this.tab === 'ARMOR') d.equippedArmor = it.id; else d.equippedArrow = it.id as ArrowKind;
    }
    sv.save.commit();
    this.render();
  }

  private render(): void {
    for (const o of this.content) o.destroy();
    this.content = [];
    const sv = services(this);
    this.coinText.setText(formatNumber(sv.save.d.coins));
    for (const [t, b] of this.tabBtns) b.setOutline(t === this.tab ? 0xffd35a : 0x10131c);
    const items = this.items(), perRow = 4;
    items.forEach((it, i) => {
      const x = 190 + (i % perRow) * 300, y = 300 + Math.floor(i / perRow) * 215;
      const bg = this.add.rectangle(x, y, 280, 200, 0x1d2335).setStrokeStyle(4, it.equipped ? 0xffd35a : 0x3b4560).setDepth(5);
      const swatch = this.add.circle(x - 100, y - 62, 18, it.color).setStrokeStyle(3, 0x10131c).setDepth(6);
      const name = txt(this, x - 70, y - 62, it.name, 21, '#ffffff', [0, 0.5]).setDepth(6);
      const desc = txt(this, x, y - 18, it.desc, 17, '#b8c2d8', [0.5, 0.5], false).setWordWrapWidth(250).setAlign('center').setDepth(6);
      const label = it.equipped && it.equippable ? 'EQUIPPED' : it.owned ? (it.equippable ? 'EQUIP' : 'OWNED') : `BUY ${formatNumber(it.cost)}`;
      const btn = new Button(this, x, y + 58, label, () => this.act(it), { w: 230, h: 50, fontSize: 21, color: it.owned ? 0x3f8f4f : 0xc9822b }).setDepth(6);
      btn.setEnabled(!(it.owned && (!it.equippable || it.equipped)));
      this.content.push(bg, swatch, name, desc, btn);
      if (it.ammo !== undefined && it.id !== 'normal') this.content.push(txt(this, x, y + 90, `${it.ammo} per level`, 15, '#8fa0bf', [0.5, 0.5], false).setDepth(6));
    });
  }

  update(_t: number, delta: number): void { this.bg.update(delta / 1000, this.input.activePointer.x); }
}
