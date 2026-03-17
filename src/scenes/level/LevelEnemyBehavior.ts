import Phaser from 'phaser';
import type { EnemySpawnPoint, EnemyState } from './types';

export const getRandomizedSpawnPoints = (spawnPoints: EnemySpawnPoint[]): EnemySpawnPoint[] => {
  const shuffled = Phaser.Utils.Array.Shuffle([...spawnPoints]);
  const spawnCount = Phaser.Math.Between(Math.max(4, shuffled.length - 2), shuffled.length);
  return shuffled.slice(0, spawnCount).map((spawnPoint) => ({
    ...spawnPoint,
    x: Phaser.Math.Clamp(spawnPoint.x + Phaser.Math.Between(-42, 42), 40, 2160),
    y: Phaser.Math.Clamp(spawnPoint.y + Phaser.Math.Between(-42, 42), 40, 1360),
  }));
};

export const applyEnemyMovementByArchetype = (
  enemyState: EnemyState,
  direction: Phaser.Math.Vector2,
  distance: number,
  time: number,
  enemySpeedMultiplier: number,
): void => {
  const baseSpeed = enemyState.speed * enemySpeedMultiplier;
  const normDirection = direction.clone().normalize();

  if (enemyState.archetype === 'brute') {
    const slowSpeed = baseSpeed * (distance < 130 ? 0.5 : 0.8);
    enemyState.sprite.setVelocity(normDirection.x * slowSpeed, normDirection.y * slowSpeed);
    enemyState.sprite.setScale(1.1);
  } else if (enemyState.archetype === 'raider') {
    const burstSpeed = time >= enemyState.burstReadyAt ? baseSpeed * 1.45 : baseSpeed;
    if (time >= enemyState.burstReadyAt) {
      enemyState.burstReadyAt = time + Phaser.Math.Between(1800, 2600);
    }
    enemyState.sprite.setVelocity(normDirection.x * burstSpeed, normDirection.y * burstSpeed);
    enemyState.sprite.setScale(0.95);
  } else if (enemyState.archetype === 'spitter') {
    const targetDistance = 220;
    if (distance < targetDistance - 30) {
      enemyState.sprite.setVelocity(-normDirection.x * baseSpeed * 0.72, -normDirection.y * baseSpeed * 0.72);
    } else {
      const lateral = new Phaser.Math.Vector2(-normDirection.y * enemyState.orbitDirection, normDirection.x * enemyState.orbitDirection);
      enemyState.sprite.setVelocity(lateral.x * baseSpeed * 0.78, lateral.y * baseSpeed * 0.78);
    }
    enemyState.sprite.setTint(0x9b8cff);
  } else {
    enemyState.sprite.setVelocity(normDirection.x * baseSpeed, normDirection.y * baseSpeed);
    enemyState.sprite.clearTint();
    enemyState.sprite.setScale(1);
  }

  enemyState.sprite.setFlipX(direction.x < 0);
};
