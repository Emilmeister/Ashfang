import Phaser from 'phaser';

export type EnemyState = {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  speed: number;
  damage: number;
  archetype: EnemyArchetype;
  lastHitTime: number;
  staggerUntil: number;
  orbitDirection: 1 | -1;
  burstReadyAt: number;
};

export type AttackPhase = 'idle' | 'startup' | 'impact' | 'recover';

export type WasdKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

export type EnemyArchetype = 'stalker' | 'raider' | 'brute' | 'spitter';

export type EnemySpawnPoint = {
  x: number;
  y: number;
  speed: number;
  damage: number;
  archetype: EnemyArchetype;
};
export type ObstacleData = { x: number; y: number; width: number; height: number };

export type RoomModifierId = 'fog' | 'swift-enemies' | 'empowered-strikes';

export type RoomModifier = {
  id: RoomModifierId;
  title: string;
  description: string;
  enemySpeedMultiplier: number;
  playerDamageMultiplier: number;
  fogAlpha: number;
};

export type ProgressionModifierId = 'echo-wave' | 'phase-dash';

export type ProgressionModifier = {
  id: ProgressionModifierId;
  title: string;
  description: string;
};
