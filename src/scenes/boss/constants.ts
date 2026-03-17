import Phaser from 'phaser';

export const PLAYER_TEXTURE_KEY = 'player-wolf';
export const ENEMY_TEXTURE_KEY = 'enemy-fiend';
export const BACKGROUND_TEXTURE_KEY = 'bg-ash-sky';
export const OBSTACLE_TEXTURE_KEY = 'object-ruin-crate';

export const PLAYER_SPEED = 250;
export const PLAYER_MAX_HP = 180;
export const PLAYER_HIT_COOLDOWN_MS = 700;
export const ATTACK_COOLDOWN_MS = 380;
export const ATTACK_RANGE = 116;
export const ATTACK_DAMAGE = 25;
export const ATTACK_ARC_HALF_ANGLE = Phaser.Math.DegToRad(62);
export const BOSS_MAX_HP = 320;
export const BOSS_DAMAGE = 19;
export const BOSS_SPEED = 128;
export const BOSS_CONTACT_RANGE = 80;

export const ATTACK_SFX_KEY = 'sfx-player-attack';
export const PLAYER_HIT_SFX_KEY = 'sfx-player-hit';
export const ENEMY_DOWN_SFX_KEY = 'sfx-enemy-down';
export const UI_CONFIRM_SFX_KEY = 'sfx-ui-confirm';

export const EPILOGUE_BODY =
  'Сердце руин очищено, но в пепле вспыхнул новый след.\nАстрелия видит путь к северным бастионам Ургрима —\nтам просыпается осколок, способный подчинить целые кланы.\n\nНажми ENTER, чтобы вернуться в меню и начать следующий поход.';
