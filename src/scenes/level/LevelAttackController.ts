import Phaser from 'phaser';
import {
  ATTACK_ARC_HALF_ANGLE,
  ATTACK_COOLDOWN_MS,
  ATTACK_DAMAGE,
  ATTACK_IMPACT_MS,
  ATTACK_RANGE,
  ATTACK_RECOVER_MS,
  ATTACK_SFX_KEY,
  ATTACK_STARTUP_MS,
  ENEMY_DOWN_SFX_KEY,
  ENEMY_HIT_KNOCKBACK,
  ENEMY_STAGGER_MS,
} from './constants';
import type { AttackPhase, EnemyState } from './types';

type AttackDeps = {
  player: Phaser.Physics.Arcade.Sprite;
  playerFacing: Phaser.Math.Vector2;
  getEnemies: () => EnemyState[];
  getAliveEnemiesCount: () => number;
  onMeaningfulAction: (isCombat?: boolean) => void;
  onEnemyDefeated: () => void;
  onAttackResult: (message: string, combatHappened?: boolean) => void;
};

export class LevelAttackController {
  private attackPhase: AttackPhase = 'idle';
  private lastAttackTime = -Infinity;

  constructor(private readonly scene: Phaser.Scene, private readonly deps: AttackDeps) {}

  tryAttack(time: number): boolean {
    if (time - this.lastAttackTime < ATTACK_COOLDOWN_MS || this.attackPhase !== 'idle') return false;

    this.lastAttackTime = time;
    this.deps.onMeaningfulAction();
    this.scene.sound.play(ATTACK_SFX_KEY, { volume: 0.5 });
    this.attackPhase = 'startup';
    this.playAttackStartup();

    this.scene.time.delayedCall(ATTACK_STARTUP_MS, () => {
      if (!this.deps.player.active) return;
      this.attackPhase = 'impact';
      this.playAttackImpact();
      this.resolveAttackImpact();
    });

    this.scene.time.delayedCall(ATTACK_STARTUP_MS + ATTACK_IMPACT_MS, () => {
      if (!this.deps.player.active) return;
      this.attackPhase = 'recover';
      this.playAttackRecover();
    });

    this.scene.time.delayedCall(ATTACK_STARTUP_MS + ATTACK_IMPACT_MS + ATTACK_RECOVER_MS, () => {
      if (this.deps.player.active) this.attackPhase = 'idle';
    });

    return true;
  }

  getAttackPhase(): AttackPhase {
    return this.attackPhase;
  }

  private resolveAttackImpact(): void {
    const hitEnemies = this.deps.getEnemies().filter((enemyState) => this.isEnemyHit(enemyState));
    if (hitEnemies.length === 0) return void this.deps.onAttackResult('Удар впустую. Враги наступают!');

    hitEnemies.forEach((enemyState) => {
      this.deps.onMeaningfulAction(true);
      enemyState.hp = Math.max(0, enemyState.hp - ATTACK_DAMAGE);
      enemyState.staggerUntil = this.scene.time.now + ENEMY_STAGGER_MS;

      const knockbackDirection = new Phaser.Math.Vector2(
        enemyState.sprite.x - this.deps.player.x,
        enemyState.sprite.y - this.deps.player.y,
      );
      if (knockbackDirection.lengthSq() > 0) knockbackDirection.normalize();
      enemyState.sprite.setVelocity(knockbackDirection.x * ENEMY_HIT_KNOCKBACK, knockbackDirection.y * ENEMY_HIT_KNOCKBACK);
      enemyState.sprite.setTintFill(0xfff1c1);
      this.scene.time.delayedCall(90, () => enemyState.sprite.active && enemyState.sprite.clearTint());
      this.scene.tweens.add({ targets: enemyState.sprite, scaleX: 1.2, scaleY: 0.84, duration: 55, yoyo: true, ease: 'Quad.easeOut' });

      if (enemyState.hp <= 0) {
        enemyState.sprite.disableBody(true, true);
        this.scene.sound.play(ENEMY_DOWN_SFX_KEY, { volume: 0.34 });
        this.deps.onEnemyDefeated();
      }
    });

    this.scene.cameras.main.shake(90, 0.002);
    this.deps.onAttackResult(`Попадание x${hitEnemies.length}. Осталось врагов: ${this.deps.getAliveEnemiesCount()}`, true);
  }

  private playAttackStartup(): void {
    this.deps.player.setTintFill(0xc8d6ff);
    this.scene.tweens.add({ targets: this.deps.player, scaleX: 1.1, scaleY: 0.92, duration: ATTACK_STARTUP_MS, ease: 'Quad.easeOut' });
  }

  private playAttackImpact(): void {
    const baseScaleX = this.deps.player.scaleX;
    const baseScaleY = this.deps.player.scaleY;
    this.deps.player.setTintFill(0xf1fa8c);
    this.scene.tweens.add({
      targets: this.deps.player,
      scaleX: baseScaleX * 1.22,
      scaleY: baseScaleY * 0.86,
      yoyo: true,
      duration: ATTACK_IMPACT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => this.deps.player.setScale(baseScaleX, baseScaleY),
    });

    const angle = Phaser.Math.RadToDeg(this.deps.playerFacing.angle());
    const slash = this.scene.add.arc(this.deps.player.x, this.deps.player.y, ATTACK_RANGE, angle - 35, angle + 35, false, 0xf1fa8c, 0.45).setStrokeStyle(3, 0xffffff, 0.85).setDepth(8);
    this.scene.tweens.add({ targets: slash, alpha: 0, scale: 1.25, duration: 110, ease: 'Quad.easeOut', onComplete: () => slash.destroy() });
  }

  private playAttackRecover(): void {
    this.deps.player.clearTint();
    this.scene.tweens.add({
      targets: this.deps.player,
      alpha: 0.92,
      yoyo: true,
      duration: ATTACK_RECOVER_MS,
      ease: 'Sine.easeOut',
      onComplete: () => this.deps.player.setAlpha(1),
    });
  }

  private isEnemyHit(enemyState: EnemyState): boolean {
    if (!enemyState.sprite.active || enemyState.hp <= 0) return false;
    const toEnemy = new Phaser.Math.Vector2(enemyState.sprite.x - this.deps.player.x, enemyState.sprite.y - this.deps.player.y);
    const enemyDistance = toEnemy.length();
    if (enemyDistance === 0 || enemyDistance > ATTACK_RANGE) return false;
    const enemyDirection = toEnemy.normalize();
    const facingAngle = Phaser.Math.Angle.Wrap(this.deps.playerFacing.angle() - enemyDirection.angle());
    return Math.abs(facingAngle) <= ATTACK_ARC_HALF_ANGLE;
  }
}
