import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.image('bg-ash-sky', 'assets/background/ashen-sky.png');
    this.load.image('player-wolf', 'assets/characters/ashfang-hero.png');
    this.load.image('enemy-fiend', 'assets/enemies/wild-fiend.png');
    this.load.image('object-ruin-crate', 'assets/objects/ruin-crate.png');
  }

  create(): void {
    this.scene.start('Menu');
  }
}
