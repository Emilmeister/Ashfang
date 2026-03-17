import Phaser from 'phaser';

const ASSET_PATHS = {
  background: 'assets/background/ashen-sky.png',
  player: 'assets/characters/ashfang-hero.png',
  enemy: 'assets/enemies/wild-fiend.png',
  obstacle: 'assets/objects/ruin-crate.png',
  audio: {
    attack: 'assets/audio/combat/player-attack.wav',
    playerHit: 'assets/audio/combat/player-hit.wav',
    enemyDown: 'assets/audio/combat/enemy-down.wav',
    uiConfirm: 'assets/audio/ui/ui-confirm.wav',
  },
} as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.image('bg-ash-sky', ASSET_PATHS.background);
    this.load.image('player-wolf', ASSET_PATHS.player);
    this.load.image('enemy-fiend', ASSET_PATHS.enemy);
    this.load.image('object-ruin-crate', ASSET_PATHS.obstacle);

    this.load.audio('sfx-player-attack', ASSET_PATHS.audio.attack);
    this.load.audio('sfx-player-hit', ASSET_PATHS.audio.playerHit);
    this.load.audio('sfx-enemy-down', ASSET_PATHS.audio.enemyDown);
    this.load.audio('sfx-ui-confirm', ASSET_PATHS.audio.uiConfirm);

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      // Не блокируем запуск MVP-сцены, если пользователь ещё не положил audio-пакет в public/assets.
      console.warn(`[BootScene] Asset failed to load: ${file.src}`);
    });
  }

  create(): void {
    this.scene.start('Menu');
  }
}
