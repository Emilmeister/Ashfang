import Phaser from 'phaser';
import type { EnemySpawnPoint, ObstacleData } from './types';

export const PLAYER_SPEED = 240;
export const MAP_WIDTH = 2200;
export const MAP_HEIGHT = 1400;
export const PLAYER_TEXTURE_KEY = 'player-wolf';
export const ENEMY_TEXTURE_KEY = 'enemy-fiend';
export const ATTACK_COOLDOWN_MS = 430;
export const ATTACK_STARTUP_MS = 90;
export const ATTACK_IMPACT_MS = 75;
export const ATTACK_RECOVER_MS = 130;
export const ATTACK_DAMAGE = 25;
export const ENEMY_MAX_HP = 70;
export const ATTACK_RANGE = 102;
export const ATTACK_ARC_HALF_ANGLE = Phaser.Math.DegToRad(46);
export const PLAYER_MAX_HP = 180;
export const PLAYER_HIT_COOLDOWN_MS = 650;
export const DOWNTIME_LIMIT_MS = 5000;
export const MAX_PRESSURE_SPAWNS = 3;
export const MOVEMENT_SMOOTHING = 0.22;
export const DASH_SPEED = 620;
export const DASH_DURATION_MS = 130;
export const DASH_COOLDOWN_MS = 1400;
export const ENEMY_STAGGER_MS = 210;
export const ENEMY_HIT_KNOCKBACK = 280;

export const OBSTACLE_TEXTURE_KEY = 'object-ruin-crate';
export const BACKGROUND_TEXTURE_KEY = 'bg-ash-sky';

export const ATTACK_SFX_KEY = 'sfx-player-attack';
export const PLAYER_HIT_SFX_KEY = 'sfx-player-hit';
export const ENEMY_DOWN_SFX_KEY = 'sfx-enemy-down';
export const UI_CONFIRM_SFX_KEY = 'sfx-ui-confirm';

export const OBSTACLE_DATA: ObstacleData[] = [
  { x: 460, y: 300, width: 720, height: 70 },
  { x: 1220, y: 560, width: 420, height: 70 },
  { x: 920, y: 900, width: 820, height: 80 },
  { x: 1700, y: 360, width: 560, height: 70 },
  { x: 1840, y: 1120, width: 480, height: 70 },
  { x: 1460, y: 1060, width: 380, height: 60 },
];

export const ENEMY_SPAWN_POINTS: EnemySpawnPoint[] = [
  { x: 340, y: 160, speed: 92, damage: 10 },
  { x: 690, y: 250, speed: 106, damage: 10 },
  { x: 1040, y: 210, speed: 115, damage: 11 },
  { x: 1380, y: 520, speed: 118, damage: 12 },
  { x: 1620, y: 790, speed: 126, damage: 12 },
  { x: 1860, y: 930, speed: 130, damage: 13 },
];

export const ONBOARDING_HINTS = [
  'Обучение: Двигайся WASD / стрелками. Управление не блокируется.',
  'Обучение: Нажми SPACE для атаки в сторону движения.',
  'Обучение: SHIFT — короткий рывок с кулдауном для уклонения и входа в бой.',
  'Обучение: Победи всех врагов и войди в сияющий портал.',
  'Обучение: Портал открыт! Доберись до него, чтобы начать бой с боссом.',
];
