import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { MODE_INFO } from '../data/GameData';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { services } from '../systems/Services';
import type { GameMode } from '../types/GameTypes';
import { Button, txt } from '../ui/Button';
import { LevelCard } from '../ui/LevelCard';

const PER_PAGE = 10;

export class LevelSelectScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  private page = 0;
  private content: Phaser.GameObjects.GameObject[] = [];
  constructor() { super('LevelSelect'); }

  create(data?: { page?: number }): void {
    const sv = services(this);
    this.cameras.main.fadeIn(250, 16, 19, 28);
    this.content = [];
    const total = sv.levels.count, pages = Math.ceil(total / PER_PAGE);
    this.page = Math.min(pages - 1, data?.page ?? Math.floor((Math.min(sv.save.d.unlocked, total) - 1) / PER_PAGE));
    const env = sv.levels.get(this.page * PER_PAGE + 1)?.environment ?? 'forest';
    this.bg = new BackgroundSystem(this, env);
    txt(this, GAME_WIDTH / 2, 56, 'SELECT LEVEL', 48, '#ffd35a').setDepth(5);
    this.render();

    new Button(this, 120, 668, 'BACK', () => this.scene.start('MainMenu'), { w: 170, h: 56, fontSize: 24, color: 0x555a66 }).setDepth(6);
    const modes: GameMode[] = ['endless', 'timeAttack', 'precision', 'bossRush'];
    modes.forEach((m, i) => new Button(this, 370 + i * 230, 668, MODE_INFO[m].label.toUpperCase(), () => {
      const d = sv.save.d, id = Math.max(1, Math.min(d.unlocked, total));
      this.scene.start('Game', { mode: m, levelId: id });
    }, { w: 215, h: 56, fontSize: 21, color: 0x8a4fb0 }).setDepth(6));
    const prev = new Button(this, 70, 380, '<', () => this.scene.restart({ page: this.page - 1 }), { w: 64, h: 90, fontSize: 40, color: 0x3b4560 }).setDepth(6).setEnabled(this.page > 0);
    const next = new Button(this, GAME_WIDTH - 70, 380, '>', () => this.scene.restart({ page: this.page + 1 }), { w: 64, h: 90, fontSize: 40, color: 0x3b4560 }).setDepth(6).setEnabled(this.page < pages - 1);
    void prev; void next;
  }

  private render(): void {
    const sv = services(this), d = sv.save.d;
    const first = this.page * PER_PAGE + 1, total = sv.levels.count;
    this.content.push(txt(this, GAME_WIDTH / 2, 104, `Levels ${first} - ${Math.min(total, first + PER_PAGE - 1)}`, 24, '#e8ecf5').setDepth(5));
    const g = this.add.graphics().setDepth(4); this.content.push(g);
    const pos: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < PER_PAGE; i++) pos.push({ x: 190 + i * 100, y: 360 + Math.sin(i * 1.15) * 100 });
    g.lineStyle(10, 0x10131c, 0.5);
    g.beginPath().moveTo(pos[0].x, pos[0].y); pos.forEach(p => g.lineTo(p.x, p.y)); g.strokePath();
    for (let i = 0; i < PER_PAGE; i++) {
      const id = first + i;
      if (id > total) break;
      const res = sv.save.levelResult(id), lvl = sv.levels.get(id);
      new LevelCard(this, pos[i].x, pos[i].y, { id, unlocked: id <= d.unlocked && !!lvl, stars: res?.stars ?? 0, best: res?.bestScore ?? 0, boss: !!lvl?.boss },
        () => this.scene.start('Game', { mode: 'campaign', levelId: id })).setDepth(6);
      if (res) txt(this, pos[i].x, pos[i].y + 88, String(Math.floor(res.bestScore)), 15, '#b8c2d8', [0.5, 0.5], false).setDepth(6);
    }
  }

  update(_t: number, delta: number): void { this.bg.update(delta / 1000, this.input.activePointer.x); }
}
