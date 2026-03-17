import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.add
      .image(this.scale.width / 2, this.scale.height / 2, 'bg-ash-sky')
      .setDisplaySize(this.scale.width, this.scale.height)
      .setTint(0x666666);

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 30, 'Ashfang: Echoes of the Fallen Wild', {
        fontFamily: 'Arial',
        fontSize: '42px',
        color: '#f5f5f5',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 + 60,
        'SPACE — начать уровень\nWASD/стрелки — движение\nSPACE — атака | ESC — в меню',
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#f1f5f9',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('Level');
    });
  }
}
