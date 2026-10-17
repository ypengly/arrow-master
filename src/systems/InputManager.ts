import Phaser from 'phaser';
import type { AbilityId } from '../types/WeaponTypes';

export interface InputHandlers {
  down(p: Phaser.Input.Pointer): void;
  up(p: Phaser.Input.Pointer): void;
  cancel(): void;
  pause(): void;
  restart(): void;
  ability(id: AbilityId): void;
  selectArrow(index: number): void;
  debug(key: 'F1' | 'N' | 'W' | 'B' | 'P'): void;
}

/** Unified mouse/touch/keyboard input. Core play needs only the pointer. */
export class InputManager {
  private activeId: number | null = null;
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key | undefined> = {};

  constructor(private readonly scene: Phaser.Scene, private readonly h: InputHandlers) {
    const input = scene.input;
    input.mouse?.disableContextMenu();
    input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.activeId !== null) return; // UI buttons swallow the press
      this.activeId = p.id; h.down(p);
    });
    const release = (p: Phaser.Input.Pointer): void => { if (p.id === this.activeId) { this.activeId = null; h.up(p); } };
    input.on('pointerup', release);
    input.on('gameout', () => { if (this.activeId !== null) { this.activeId = null; h.cancel(); } });

    const kb = input.keyboard;
    if (!kb) return;
    kb.on('keydown-ESC', () => h.pause());
    kb.on('keydown-R', () => h.restart());
    kb.on('keydown-Q', () => h.ability('focus'));
    kb.on('keydown-E', () => h.ability('mend'));
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'].forEach((k, i) => kb.on(`keydown-${k}`, () => h.selectArrow(i)));
    for (const k of ['A', 'D', 'LEFT', 'RIGHT']) this.keys[k] = kb.addKey(k);
    if (import.meta.env.DEV) {
      kb.addCapture('F1');
      kb.on('keydown-F1', () => h.debug('F1'));
      for (const k of ['N', 'W', 'B', 'P'] as const) kb.on(`keydown-${k}`, () => h.debug(k));
    }
  }

  /** Clears the tracked pointer (call after the scene resumes from pause). */
  reset(): void { this.activeId = null; }

  /** -1 (left) .. +1 (right) from A/D or arrow keys. */
  axis(): number {
    const k = this.keys;
    return (k.D?.isDown || k.RIGHT?.isDown ? 1 : 0) - (k.A?.isDown || k.LEFT?.isDown ? 1 : 0);
  }
}
