import Phaser from 'phaser';

const PLAYER_SPEED = 240;
const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1400;
const PLAYER_TEXTURE_KEY = 'player-rect';

export class LevelScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

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
    this.cameras.main.setBackgroundColor(0x1a1a1a);

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

    if (!this.textures.exists(PLAYER_TEXTURE_KEY)) {
      const g = this.add.graphics({ x: 0, y: 0 });
      g.fillStyle(0x50fa7b, 1);
      g.fillRect(0, 0, 40, 40);
      g.generateTexture(PLAYER_TEXTURE_KEY, 40, 40);
      g.destroy();
    }

    this.player = this.physics.add
      .sprite(100, 100, PLAYER_TEXTURE_KEY)
      .setCollideWorldBounds(true)
      .setDrag(900, 900)
      .setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);

    this.physics.add.collider(this.player, obstacles);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    const keyboard = this.input.keyboard;

    this.cursors = keyboard?.createCursorKeys();

    if (keyboard) {
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

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.fpsText.setPosition(gameSize.width - 24, 24);
    });
  }

  update(): void {
    if (!this.player?.body) {
      return;
    }

    const moveLeft = Boolean(this.cursors?.left?.isDown || this.wasdKeys?.left.isDown);
    const moveRight = Boolean(this.cursors?.right?.isDown || this.wasdKeys?.right.isDown);
    const moveUp = Boolean(this.cursors?.up?.isDown || this.wasdKeys?.up.isDown);
    const moveDown = Boolean(this.cursors?.down?.isDown || this.wasdKeys?.down.isDown);

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
