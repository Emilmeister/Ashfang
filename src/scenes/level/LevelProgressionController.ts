import Phaser from 'phaser';
import { ECHO_WAVE_DAMAGE, ECHO_WAVE_RADIUS } from './constants';
import type { EnemyState, ProgressionModifierId } from './types';

type Deps = {
  player: Phaser.Physics.Arcade.Sprite;
  getAliveEnemies: () => EnemyState[];
  onEnemyDefeated: () => void;
  onAttackResult: (message: string, combatHappened?: boolean) => void;
};

export class LevelProgressionController {
  private activeModifiers = new Set<ProgressionModifierId>();

  constructor(private readonly scene: Phaser.Scene, private readonly deps: Deps) {}

  addModifier(modifierId: ProgressionModifierId): void {
    this.activeModifiers.add(modifierId);
  }

  getActiveModifierIds(): ProgressionModifierId[] {
    return Array.from(this.activeModifiers);
  }

  hasModifier(modifierId: ProgressionModifierId): boolean {
    return this.activeModifiers.has(modifierId);
  }

  triggerEchoWave(): void {
    if (!this.hasModifier('echo-wave')) return;

    const wave = this.scene.add.circle(this.deps.player.x, this.deps.player.y, 40, 0x90f7ec, 0.24).setDepth(6);
    this.scene.tweens.add({ targets: wave, alpha: 0, scale: 4.3, duration: 250, ease: 'Quad.easeOut', onComplete: () => wave.destroy() });

    let hits = 0;
    this.deps.getAliveEnemies().forEach((enemyState) => {
      const distance = Phaser.Math.Distance.Between(this.deps.player.x, this.deps.player.y, enemyState.sprite.x, enemyState.sprite.y);
      if (distance > ECHO_WAVE_RADIUS) return;

      enemyState.hp = Math.max(0, enemyState.hp - ECHO_WAVE_DAMAGE);
      enemyState.staggerUntil = this.scene.time.now + 180;
      enemyState.sprite.setTintFill(0x90f7ec);
      this.scene.time.delayedCall(80, () => enemyState.sprite.active && enemyState.sprite.clearTint());
      hits += 1;

      if (enemyState.hp <= 0) {
        enemyState.sprite.disableBody(true, true);
        this.deps.onEnemyDefeated();
      }
    });

    if (hits > 0) {
      this.deps.onAttackResult(`Эхо-волна задела врагов: ${hits}.`, true);
    }
  }

  applyPhaseDashDamage(): void {
    if (!this.hasModifier('phase-dash')) return;

    const hitRadius = 110;
    let hits = 0;

    this.deps.getAliveEnemies().forEach((enemyState) => {
      const distance = Phaser.Math.Distance.Between(this.deps.player.x, this.deps.player.y, enemyState.sprite.x, enemyState.sprite.y);
      if (distance > hitRadius) return;

      enemyState.hp = Math.max(0, enemyState.hp - 22);
      enemyState.staggerUntil = this.scene.time.now + 160;
      enemyState.sprite.setTintFill(0xc4fff9);
      this.scene.time.delayedCall(90, () => enemyState.sprite.active && enemyState.sprite.clearTint());
      hits += 1;

      if (enemyState.hp <= 0) {
        enemyState.sprite.disableBody(true, true);
        this.triggerEchoWave();
        this.deps.onEnemyDefeated();
      }
    });

    if (hits > 0) {
      this.deps.onAttackResult(`Фазовый рывок задел ${hits} враг(ов).`, true);
    }
  }
}
