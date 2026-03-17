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
  ENEMY_HIT_BARKS,
  ENEMY_HIT_KNOCKBACK,
  ENEMY_STAGGER_MS,
  RISKY_DAMAGE_MULTIPLIER,
  RISKY_MELEE_RANGE,
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
  onRiskyHit: (count: number) => void;
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

    let defeatedInSwing = 0;
    let riskyHits = 0;

    hitEnemies.forEach((enemyState) => {
      this.deps.onMeaningfulAction(true);

      const distanceToPlayer = Phaser.Math.Distance.Between(
        enemyState.sprite.x,
        enemyState.sprite.y,
        this.deps.player.x,
        this.deps.player.y,
      );
      const isRiskyMelee = distanceToPlayer <= RISKY_MELEE_RANGE;
      if (isRiskyMelee) riskyHits += 1;

      const damage = Math.round(ATTACK_DAMAGE * (isRiskyMelee ? RISKY_DAMAGE_MULTIPLIER : 1));
      enemyState.hp = Math.max(0, enemyState.hp - damage);
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
      this.playHitBurst(enemyState.sprite.x, enemyState.sprite.y);

      if (enemyState.hp <= 0) {
        defeatedInSwing += 1;
        enemyState.sprite.disableBody(true, true);
        this.scene.sound.play(ENEMY_DOWN_SFX_KEY, { volume: 0.34 });
        this.playFinisherFeedback(enemyState.sprite.x, enemyState.sprite.y);
        this.deps.onEnemyDefeated();
      }
    });

    if (riskyHits > 0) {
      this.deps.onRiskyHit(riskyHits);
    }

    this.scene.cameras.main.shake(90, 0.002);
    const bark = Phaser.Utils.Array.GetRandom(ENEMY_HIT_BARKS);
    const riskLabel = riskyHits > 0 ? ` | Риск-бонус x${riskyHits}` : '';
    const resultLabel =
      defeatedInSwing > 0
        ? `Попадание x${hitEnemies.length}. Добивание x${defeatedInSwing}! Осталось врагов: ${this.deps.getAliveEnemiesCount()}`
        : `Попадание x${hitEnemies.length}. Осталось врагов: ${this.deps.getAliveEnemiesCount()}`;
    this.deps.onAttackResult(`${resultLabel}${riskLabel} | ${bark}`, true);
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
    const slash = this.scene.add
      .arc(this.deps.player.x, this.deps.player.y, ATTACK_RANGE, angle - 35, angle + 35, false, 0xf1fa8c, 0.45)
      .setStrokeStyle(3, 0xffffff, 0.85)
      .setDepth(8);
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

  private playHitBurst(x: number, y: number): void {
    for (let i = 0; i < 8; i += 1) {
      const spark = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), Phaser.Math.RND.pick([0xfff1c1, 0xffd166, 0xffffff]), 0.9).setDepth(12);
      const velocity = new Phaser.Math.Vector2().setToPolar(Phaser.Math.FloatBetween(0, Math.PI * 2), Phaser.Math.Between(20, 65));
      this.scene.tweens.add({
        targets: spark,
        x: x + velocity.x,
        y: y + velocity.y,
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(90, 140),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private playFinisherFeedback(x: number, y: number): void {
    const flash = this.scene.add.circle(x, y, 22, 0xfff3b0, 0.75).setDepth(13);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 2.8, duration: 170, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
    this.scene.cameras.main.shake(120, 0.0032);
    this.scene.cameras.main.flash(90, 255, 244, 214, false);
    this.scene.sound.play(ENEMY_DOWN_SFX_KEY, { volume: 0.2, detune: 450, rate: 1.15 });
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
