import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Placeholder for loading assets.
  }

  create(): void {
    this.scene.start('Menu');
  }
}
