import Phaser from 'phaser';

export class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  create(): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Level Scene Template', {
        fontFamily: 'Arial',
        fontSize: '40px',
        color: '#8be9fd',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start('Menu');
    });
  }
}
