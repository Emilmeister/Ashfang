import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Ashfang\nPress SPACE to start', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#f5f5f5',
        align: 'center',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('Level');
    });
  }
}
