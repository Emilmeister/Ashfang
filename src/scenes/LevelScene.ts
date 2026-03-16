import Phaser from 'phaser';

const PLAYER_SPEED = 240;
const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1400;

export class LevelScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private fpsText!: Phaser.GameObjects.Text;

  private wasdKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super('Level');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, 0x1a1a1a).setDepth(-10);

    this.add
      .text(24, 24, 'WASD / стрелки — движение\nESC — в меню', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#f5f5f5',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.fpsText = this.add
      .text(this.scale.width - 24, 24, 'FPS: --', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#8be9fd',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10);

    const obstacles = this.physics.add.staticGroup();

    const obstacleData: Array<{ x: number; y: number; width: number; height: number; color: number }> = [
      { x: 460, y: 300, width: 780, height: 70, color: 0x3b3b55 },
      { x: 1220, y: 560, width: 420, height: 70, color: 0x3b3b55 },
      { x: 920, y: 900, width: 840, height: 80, color: 0x3b3b55 },
      { x: 1700, y: 360, width: 560, height: 70, color: 0x3b3b55 },
      { x: 1840, y: 1120, width: 480, height: 70, color: 0x3b3b55 },
    ];

    obstacleData.forEach((obstacle) => {
      const platform = this.add.rectangle(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height,
        obstacle.color,
      );
      this.physics.add.existing(platform, true);
      obstacles.add(platform);
    });

    this.player = this.physics.add.sprite(100, 100, '__DEFAULT');
    this.player
      .setDisplaySize(40, 40)
      .setTint(0x50fa7b)
      .setCollideWorldBounds(true)
      .setDrag(900, 900)
      .setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);

    this.physics.add.collider(this.player, obstacles);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.cursors = this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    this.wasdKeys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as {
      up: Phaser.Input.Keyboard.Key;
      down: Phaser.Input.Keyboard.Key;
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
    };

    keyboard.once('keydown-ESC', () => {
      this.scene.start('Menu');
    });
  }

  update(): void {
    if (!this.player?.body) {
      return;
    }

    const moveLeft = this.cursors.left?.isDown || this.wasdKeys?.left.isDown;
    const moveRight = this.cursors.right?.isDown || this.wasdKeys?.right.isDown;
    const moveUp = this.cursors.up?.isDown || this.wasdKeys?.up.isDown;
    const moveDown = this.cursors.down?.isDown || this.wasdKeys?.down.isDown;

    let velocityX = 0;
    let velocityY = 0;

    if (moveLeft) velocityX -= 1;
    if (moveRight) velocityX += 1;
    if (moveUp) velocityY -= 1;
    if (moveDown) velocityY += 1;

    const velocity = new Phaser.Math.Vector2(velocityX, velocityY).normalize().scale(PLAYER_SPEED);
    this.player.setVelocity(velocity.x, velocity.y);

    this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
  }
}
