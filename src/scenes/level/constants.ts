import Phaser from 'phaser';
import type { EnemySpawnPoint, ObstacleData, RoomModifier } from './types';

export const PLAYER_SPEED = 240;
export const MAP_WIDTH = 1800;
export const MAP_HEIGHT = 1180;
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
export const DOWNTIME_LIMIT_MS = 15000;
export const MAX_PRESSURE_SPAWNS = 3;
export const MOVEMENT_SMOOTHING = 0.22;
export const DASH_SPEED = 620;
export const DASH_DURATION_MS = 130;
export const DASH_COOLDOWN_MS = 1400;
export const ENEMY_STAGGER_MS = 210;
export const ENEMY_HIT_KNOCKBACK = 280;
export const RISKY_MELEE_RANGE = 58;
export const RISKY_DAMAGE_MULTIPLIER = 1.55;
export const SPIRIT_STRIKE_DAMAGE = 30;
export const SPIRIT_STRIKE_RANGE = 300;
export const SPIRIT_STRIKE_COST = 40;
export const SPIRIT_ENERGY_MAX = 100;
export const SPIRIT_PASSIVE_REGEN_PER_SEC = 8;
export const SPIRIT_RISK_REGEN_PER_SEC = 22;

export const SESSION_PROGRESS_OBJECTIVES = [2, 4] as const;
export const ECHO_WAVE_RADIUS = 180;
export const ECHO_WAVE_DAMAGE = 18;
export const PHASE_DASH_COOLDOWN_MULTIPLIER = 0.6;

export const ENEMY_HIT_BARKS = [
  'Скверна шипит: "Р-рра!"',
  'Тварь рычит: "Не-еет!"',
  'Враг воет: "Пепел... жжёт!"',
  'Скверна скалится: "Ты заплатишь!"',
];

export const OBSTACLE_TEXTURE_KEY = 'object-ruin-crate';
export const BACKGROUND_TEXTURE_KEY = 'bg-ash-sky';

export const ATTACK_SFX_KEY = 'sfx-player-attack';
export const PLAYER_HIT_SFX_KEY = 'sfx-player-hit';
export const ENEMY_DOWN_SFX_KEY = 'sfx-enemy-down';
export const UI_CONFIRM_SFX_KEY = 'sfx-ui-confirm';

export const OBSTACLE_DATA: ObstacleData[] = [
  { x: 430, y: 260, width: 620, height: 70 },
  { x: 980, y: 520, width: 380, height: 70 },
  { x: 760, y: 790, width: 700, height: 80 },
  { x: 1410, y: 360, width: 420, height: 70 },
  { x: 1520, y: 1010, width: 320, height: 70 },
  { x: 1220, y: 970, width: 300, height: 60 },
];

export const ENEMY_SPAWN_POINTS: EnemySpawnPoint[] = [
  { x: 320, y: 150, speed: 92, damage: 10, archetype: 'stalker' },
  { x: 620, y: 260, speed: 106, damage: 10, archetype: 'raider' },
  { x: 890, y: 250, speed: 115, damage: 11, archetype: 'brute' },
  { x: 1150, y: 480, speed: 118, damage: 12, archetype: 'spitter' },
  { x: 1370, y: 700, speed: 126, damage: 12, archetype: 'stalker' },
  { x: 1540, y: 860, speed: 130, damage: 13, archetype: 'raider' },
];

export const PATH_LANDMARKS = [
  { x: 560, y: 210, label: 'Следы когтей' },
  { x: 980, y: 430, label: 'Шепот руин' },
  { x: 1360, y: 760, label: 'Пульс скверны' },
] as const;

export const PROGRESSION_MODIFIERS = [
  {
    id: 'echo-wave',
    title: 'Эхо-волна',
    description: 'Каждое добивание выпускает волну, наносящую урон ближайшим врагам.',
  },
  {
    id: 'phase-dash',
    title: 'Фазовый рывок',
    description: 'Рывок перезаряжается быстрее и может задевать врагов на траектории.',
  },
] as const;

export const ONBOARDING_HINTS = [
  'Обучение: Двигайся WASD / стрелками. Управление не блокируется.',
  'Обучение: Нажми SPACE для атаки в сторону движения.',
  'Обучение: SHIFT — короткий рывок с кулдауном для уклонения и входа в бой.',
  'Обучение: Q — безопасный дальний удар за энергию духа. Ближний бой даёт бонус энергии.',
  'Обучение: Победи всех врагов и войди в сияющий портал.',
  'Обучение: Портал открыт! Доберись до него, чтобы начать бой с боссом.',
];


export const ROOM_MODIFIERS: RoomModifier[] = [
  {
    id: 'fog',
    title: 'Пепельный туман',
    description: 'Видимость снижена: сложнее читать дистанцию и фланги.',
    enemySpeedMultiplier: 1,
    playerDamageMultiplier: 1,
    fogAlpha: 0.2,
  },
  {
    id: 'swift-enemies',
    title: 'Бешеная охота',
    description: 'Скверна ускоряется и быстрее закрывает дистанцию.',
    enemySpeedMultiplier: 1.18,
    playerDamageMultiplier: 1,
    fogAlpha: 0,
  },
  {
    id: 'empowered-strikes',
    title: 'Пламя предков',
    description: 'Удары Ashfang мощнее и лучше режут толпу.',
    enemySpeedMultiplier: 1,
    playerDamageMultiplier: 1.22,
    fogAlpha: 0,
  },
] as const;
