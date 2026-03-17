import Phaser from 'phaser';
import {
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  DASH_SPEED,
  DOWNTIME_LIMIT_MS,
  ENEMY_MAX_HP,
  ENEMY_TEXTURE_KEY,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAX_PRESSURE_SPAWNS,
  MOVEMENT_SMOOTHING,
  PHASE_DASH_COOLDOWN_MULTIPLIER,
  PLAYER_HIT_COOLDOWN_MS,
  PLAYER_SPEED,
  SPIRIT_STRIKE_COST,
  SPIRIT_STRIKE_DAMAGE,
  SPIRIT_STRIKE_RANGE,
} from './constants';
import { LevelAttackController } from './LevelAttackController';
import { LevelProgressionController } from './LevelProgressionController';
import { LevelSpiritEnergyController } from './LevelSpiritEnergyController';
import type { AttackPhase, EnemyState, ProgressionModifierId } from './types';

type Dependencies = {
  player: Phaser.Physics.Arcade.Sprite;
  playerFacing: Phaser.Math.Vector2;
  movementVelocity: Phaser.Math.Vector2;
  dashDirection: Phaser.Math.Vector2;
  obstacleGroup?: Phaser.Physics.Arcade.StaticGroup;
  onEnemyHitPlayer: (damage: number) => void;
  onEnemyDefeated: () => void;
  onAttackResult: (message: string, combatHappened?: boolean) => void;
  onDash: () => void;
  onMeaningfulAction: (isCombat?: boolean) => void;
};

export class LevelCombatController {
  private enemies: EnemyState[] = [];
  private lastDashTime = -Infinity;
  private dashEndTime = -Infinity;
  private lastMeaningfulActionTime = 0;
  private pressureSpawnCount = 0;
  private readonly attackController: LevelAttackController;
  private readonly progressionController: LevelProgressionController;
  private readonly spiritEnergyController: LevelSpiritEnergyController;

  constructor(private readonly scene: Phaser.Scene, private readonly deps: Dependencies) {
    this.progressionController = new LevelProgressionController(scene, {
      player: deps.player,
      getAliveEnemies: () => this.getAliveEnemies(),
      onEnemyDefeated: deps.onEnemyDefeated,
      onAttackResult: deps.onAttackResult,
    });
    this.spiritEnergyController = new LevelSpiritEnergyController({
      player: deps.player,
      getAliveEnemies: () => this.getAliveEnemies(),
    });

    this.attackController = new LevelAttackController(scene, {
      player: deps.player,
      playerFacing: deps.playerFacing,
      getEnemies: () => this.enemies,
      getAliveEnemiesCount: () => this.getAliveEnemies().length,
      onMeaningfulAction: (isCombat) => {
        deps.onMeaningfulAction(isCombat);
        this.lastMeaningfulActionTime = this.scene.time.now;
      },
      onEnemyDefeated: () => {
        this.progressionController.triggerEchoWave();
        deps.onEnemyDefeated();
      },
      onAttackResult: deps.onAttackResult,
      onRiskyHit: (count) => this.spiritEnergyController.grantRiskEnergy(8 * count),
    });

  }

  initialize(now: number): void {
    this.lastMeaningfulActionTime = now;
    this.spiritEnergyController.initialize(now);
  }

  spawnEnemies(spawnPoints: Array<{ x: number; y: number; speed: number; damage: number }>): void {
    spawnPoints.forEach((spawnPoint) => {
      this.createEnemy(spawnPoint.x, spawnPoint.y, spawnPoint.speed, spawnPoint.damage, this.deps.obstacleGroup);
    });

  }

  addModifier(modifierId: ProgressionModifierId): void {
    this.progressionController.addModifier(modifierId);
  }

  getActiveModifierIds(): ProgressionModifierId[] {
    return this.progressionController.getActiveModifierIds();
  }

  getDashCooldownMs(): number {
    return this.progressionController.hasModifier('phase-dash') ? DASH_COOLDOWN_MS * PHASE_DASH_COOLDOWN_MULTIPLIER : DASH_COOLDOWN_MS;
  }

  updateMovement(time: number, moveDirection: Phaser.Math.Vector2): void {
    const isDashing = time < this.dashEndTime;
    if (!isDashing) {
      const targetVelocity = moveDirection.clone().scale(PLAYER_SPEED);
      this.deps.movementVelocity.lerp(targetVelocity, MOVEMENT_SMOOTHING);
      this.deps.player.setVelocity(this.deps.movementVelocity.x, this.deps.movementVelocity.y);
      return;
    }

    const dashVelocity = this.deps.dashDirection.clone().scale(DASH_SPEED);
    this.deps.player.setVelocity(dashVelocity.x, dashVelocity.y);
  }

  tryAttack(time: number): boolean {
    return this.attackController.tryAttack(time);
  }

  trySpiritStrike(): boolean {
    if (this.spiritEnergyController.getEnergy() < SPIRIT_STRIKE_COST) {
      this.deps.onAttackResult('Недостаточно энергии духа для безопасного удара (Q).');
      return false;
    }

    const target = this.getClosestEnemyInRange(SPIRIT_STRIKE_RANGE);
    if (!target) {
      this.deps.onAttackResult('Нет цели для дальнего удара. Держи дистанцию и кайти врагов.');
      return false;
    }

    this.spiritEnergyController.consume(SPIRIT_STRIKE_COST);
    this.deps.onMeaningfulAction(true);
    target.hp = Math.max(0, target.hp - SPIRIT_STRIKE_DAMAGE);
    target.staggerUntil = this.scene.time.now + 260;
    target.sprite.setTint(0x7afcff);
    this.scene.time.delayedCall(140, () => target.sprite.active && target.sprite.clearTint());

    const bolt = this.scene.add.line(0, 0, this.deps.player.x, this.deps.player.y, target.sprite.x, target.sprite.y, 0x8be9fd, 0.9);
    bolt.setLineWidth(2, 5).setDepth(11);
    this.scene.tweens.add({ targets: bolt, alpha: 0, duration: 120, onComplete: () => bolt.destroy() });

    if (target.hp <= 0) {
      target.sprite.disableBody(true, true);
      this.progressionController.triggerEchoWave();
      this.deps.onEnemyDefeated();
      this.deps.onAttackResult('Безопасный удар из дистанции сработал: цель уничтожена!', true);
    } else {
      this.deps.onAttackResult('Безопасный удар: держи дистанцию и добивай врагов через кайт.', true);
    }

    return true;
  }

  tryDash(time: number, moveDirection: Phaser.Math.Vector2): boolean {
    const dashCooldownMs = this.getDashCooldownMs();
    if (time - this.lastDashTime < dashCooldownMs || time < this.dashEndTime) return false;

    if (moveDirection.lengthSq() > 0) {
      this.deps.dashDirection.copy(moveDirection).normalize();
    } else if (this.deps.playerFacing.lengthSq() > 0) {
      this.deps.dashDirection.copy(this.deps.playerFacing).normalize();
    }

    this.lastDashTime = time;
    this.dashEndTime = time + DASH_DURATION_MS;
    this.deps.onMeaningfulAction();
    this.lastMeaningfulActionTime = this.scene.time.now;
    this.deps.onDash();

    this.progressionController.applyPhaseDashDamage();

    this.deps.player.setTint(0x9be7ff);
    this.scene.cameras.main.shake(75, 0.0018);
    this.scene.time.delayedCall(DASH_DURATION_MS, () => this.deps.player.active && this.deps.player.clearTint());
    return true;
  }

  updateEnemies(time: number): void {
    this.getAliveEnemies().forEach((enemyState) => {
      const direction = new Phaser.Math.Vector2(this.deps.player.x - enemyState.sprite.x, this.deps.player.y - enemyState.sprite.y);
      const distance = direction.length();

      if (time < enemyState.staggerUntil) return;
      if (distance < 2) return void enemyState.sprite.setVelocity(0, 0);

      direction.normalize();
      enemyState.sprite.setVelocity(direction.x * enemyState.speed, direction.y * enemyState.speed);
      enemyState.sprite.setFlipX(direction.x < 0);

      if (distance <= 64 && time - enemyState.lastHitTime >= PLAYER_HIT_COOLDOWN_MS) this.onEnemyTouchPlayer(enemyState);
    });

    this.spiritEnergyController.regen(time);
  }

  maybeTriggerDowntimeEvent(time: number, portalUnlocked: boolean): void {
    if (portalUnlocked || this.getAliveEnemies().length === 0) return;
    if (time - this.lastMeaningfulActionTime <= DOWNTIME_LIMIT_MS) return;

    this.spawnPressureEnemy();
    this.deps.onMeaningfulAction();
    this.lastMeaningfulActionTime = this.scene.time.now;
  }

  getAliveEnemies(): EnemyState[] {
    return this.enemies.filter((enemyState) => enemyState.hp > 0 && enemyState.sprite.active);
  }

  getAttackPhase(): AttackPhase {
    return this.attackController.getAttackPhase();
  }

  getLastDashTime(): number { return this.lastDashTime; }
  getSpiritEnergy(): number { return this.spiritEnergyController.getEnergy(); }
  getStrategyHint(): string {
    return this.spiritEnergyController.getEnergy() >= SPIRIT_STRIKE_COST ? 'Безопасно: Q (дальний удар)' : 'Риск: ближний бой для бонуса';
  }

  markMeaningfulAction(): void { this.lastMeaningfulActionTime = this.scene.time.now; }

  private spawnPressureEnemy(): void {
    if (this.pressureSpawnCount >= MAX_PRESSURE_SPAWNS) return;

    const spawnOffset = new Phaser.Math.Vector2().setToPolar(Phaser.Math.FloatBetween(0, Math.PI * 2), 220);
    const spawnX = Phaser.Math.Clamp(this.deps.player.x + spawnOffset.x, 40, MAP_WIDTH - 40);
    const spawnY = Phaser.Math.Clamp(this.deps.player.y + spawnOffset.y, 40, MAP_HEIGHT - 40);
    this.createEnemy(spawnX, spawnY, 140, 14, this.deps.obstacleGroup, 0xff9f43);

    this.pressureSpawnCount += 1;
    this.deps.onAttackResult('Скверна чувствует паузу — новая тварь выходит на охоту!');
  }

  private createEnemy(
    x: number,
    y: number,
    speed: number,
    damage: number,
    obstacles?: Phaser.Physics.Arcade.StaticGroup,
    tint?: number,
  ): void {
    const enemy = this.scene.physics.add.sprite(x, y, ENEMY_TEXTURE_KEY).setDisplaySize(44, 44).setCollideWorldBounds(true);
    if (typeof tint === 'number') enemy.setTint(tint);

    const enemyState: EnemyState = { sprite: enemy, hp: ENEMY_MAX_HP, speed, damage, lastHitTime: -Infinity, staggerUntil: -Infinity };
    this.enemies.push(enemyState);

    if (obstacles) this.scene.physics.add.collider(enemy, obstacles);
    this.scene.physics.add.collider(this.deps.player, enemy, () => this.onEnemyTouchPlayer(enemyState));
  }

  private onEnemyTouchPlayer(enemyState: EnemyState): void {
    if (!enemyState.sprite.active) return;

    const now = this.scene.time.now;
    if (now - enemyState.lastHitTime < PLAYER_HIT_COOLDOWN_MS) return;

    enemyState.lastHitTime = now;
    this.deps.onMeaningfulAction();
    this.lastMeaningfulActionTime = now;

    const pushDirection = new Phaser.Math.Vector2(this.deps.player.x - enemyState.sprite.x, this.deps.player.y - enemyState.sprite.y);
    if (pushDirection.lengthSq() > 0) pushDirection.normalize();
    this.deps.player.setVelocity(pushDirection.x * 220, pushDirection.y * 220);
    enemyState.staggerUntil = now + 110;

    this.deps.onEnemyHitPlayer(enemyState.damage);
  }

  private getClosestEnemyInRange(range: number): EnemyState | null {
    let closest: EnemyState | null = null;
    let closestDistance = Infinity;

    this.getAliveEnemies().forEach((enemyState) => {
      const distance = Phaser.Math.Distance.Between(this.deps.player.x, this.deps.player.y, enemyState.sprite.x, enemyState.sprite.y);
      if (distance <= range && distance < closestDistance) {
        closest = enemyState;
        closestDistance = distance;
      }
    });

    return closest;
  }
}
