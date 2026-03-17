import Phaser from 'phaser';
import { SPIRIT_ENERGY_MAX, SPIRIT_PASSIVE_REGEN_PER_SEC, SPIRIT_RISK_REGEN_PER_SEC } from './constants';
import type { EnemyState } from './types';

type Deps = {
  player: Phaser.Physics.Arcade.Sprite;
  getAliveEnemies: () => EnemyState[];
};

export class LevelSpiritEnergyController {
  private spiritEnergy = SPIRIT_ENERGY_MAX;
  private lastEnergyTickTime = 0;

  constructor(private readonly deps: Deps) {}

  initialize(now: number): void {
    this.lastEnergyTickTime = now;
  }

  getEnergy(): number {
    return this.spiritEnergy;
  }

  grantRiskEnergy(value: number): void {
    this.spiritEnergy = Phaser.Math.Clamp(this.spiritEnergy + value, 0, SPIRIT_ENERGY_MAX);
  }

  consume(value: number): void {
    this.spiritEnergy = Phaser.Math.Clamp(this.spiritEnergy - value, 0, SPIRIT_ENERGY_MAX);
  }

  regen(time: number): void {
    const deltaSeconds = (time - this.lastEnergyTickTime) / 1000;
    if (deltaSeconds <= 0) return;

    this.lastEnergyTickTime = time;
    const dangerRadius = 200;
    const hasNearbyEnemy = this.deps
      .getAliveEnemies()
      .some((enemyState) => Phaser.Math.Distance.Between(this.deps.player.x, this.deps.player.y, enemyState.sprite.x, enemyState.sprite.y) <= dangerRadius);
    const regenPerSecond = hasNearbyEnemy ? SPIRIT_RISK_REGEN_PER_SEC : SPIRIT_PASSIVE_REGEN_PER_SEC;
    this.spiritEnergy = Phaser.Math.Clamp(this.spiritEnergy + regenPerSecond * deltaSeconds, 0, SPIRIT_ENERGY_MAX);
  }
}
