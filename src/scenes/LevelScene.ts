import Phaser from 'phaser';

const PLAYER_SPEED = 240;
const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1400;
const PLAYER_TEXTURE_KEY = 'player-rect';
const ENEMY_TEXTURE_KEY = 'enemy-rect';
const ATTACK_COOLDOWN_MS = 550;
const ATTACK_DAMAGE = 20;
const ENEMY_MAX_HP = 100;
const ATTACK_RANGE = 56;
const ATTACK_ARC_HALF_ANGLE = Phaser.Math.DegToRad(35);

export class LevelScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private enemy?: Phaser.Physics.Arcade.Sprite;

  private enemyHp = ENEMY_MAX_HP;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private fpsText!: Phaser.GameObjects.Text;

  private combatText!: Phaser.GameObjects.Text;

  private wasdKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  private attackKey?: Phaser.Input.Keyboard.Key;

  private lastAttackTime = -Infinity;

  private playerFacing = new Phaser.Math.Vector2(1, 0);

  constructor() {
    super('Level');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBackgroundColor(0x1a1a1a);

    this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, 0x1a1a1a).setDepth(-10);

    this.add
      .text(24, 24, 'WASD / стрелки — движение\nПРОБЕЛ — атака\nESC — в меню', {
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

    this.combatText = this.add
      .text(24, this.scale.height - 24, this.getCombatHudText(), {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffb86c',
      })
      .setOrigin(0, 1)
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

    if (!this.textures.exists(ENEMY_TEXTURE_KEY)) {
      const g = this.add.graphics({ x: 0, y: 0 });
      g.fillStyle(0xff5555, 1);
      g.fillRect(0, 0, 40, 40);
      g.generateTexture(ENEMY_TEXTURE_KEY, 40, 40);
      g.destroy();
    }

    this.player = this.physics.add
      .sprite(100, 100, PLAYER_TEXTURE_KEY)
      .setCollideWorldBounds(true)
      .setDrag(900, 900)
      .setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);

    this.enemy = this.physics.add
      .sprite(340, 120, ENEMY_TEXTURE_KEY)
      .setImmovable(true)
      .setCollideWorldBounds(true)
      .setPushable(false);

    this.physics.add.collider(this.player, obstacles);

    if (this.enemy) {
      this.physics.add.collider(this.enemy, obstacles);
      this.physics.add.collider(this.player, this.enemy);
    }

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

      this.attackKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      keyboard.once('keydown-ESC', () => {
        this.scene.start('Menu');
      });
    }

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.fpsText.setPosition(gameSize.width - 24, 24);
      this.combatText.setPosition(24, gameSize.height - 24);
    });
  }

  update(time: number): void {
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

    const moveDirection = new Phaser.Math.Vector2(velocityX, velocityY);

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      this.playerFacing.copy(moveDirection);
    }

    const velocity = moveDirection.clone().scale(PLAYER_SPEED);
    this.player.setVelocity(velocity.x, velocity.y);

    if (
      this.attackKey &&
      Phaser.Input.Keyboard.JustDown(this.attackKey) &&
      time - this.lastAttackTime >= ATTACK_COOLDOWN_MS
    ) {
      this.performAttack(time);
    }

    this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
  }

  private performAttack(time: number): void {
    this.lastAttackTime = time;
    this.player.setTintFill(0xf1fa8c);
    this.time.delayedCall(100, () => {
      this.player.clearTint();
    });

    const enemy = this.enemy;

    if (!enemy?.active) {
      this.combatText.setText('Враг повержен. Удар в пустоту.');
      return;
    }

    const toEnemy = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y);
    const enemyDistance = toEnemy.length();

    if (enemyDistance === 0 || enemyDistance > ATTACK_RANGE) {
      this.combatText.setText(`Промах. КД ${this.getCooldownText(this.lastAttackTime)} сек`);
      return;
    }

    const enemyDirection = toEnemy.normalize();
    const facingAngle = Phaser.Math.Angle.Wrap(this.playerFacing.angle() - enemyDirection.angle());

    if (Math.abs(facingAngle) > ATTACK_ARC_HALF_ANGLE) {
      this.combatText.setText(`Промах по направлению. КД ${this.getCooldownText(this.lastAttackTime)} сек`);
      return;
    }

    this.enemyHp = Math.max(0, this.enemyHp - ATTACK_DAMAGE);

    enemy.setTintFill(0xffffff);
    this.time.delayedCall(90, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });

    this.cameras.main.shake(90, 0.002);

    if (this.enemyHp <= 0) {
      enemy.disableBody(true, true);
      this.combatText.setText('Попадание! Враг побежден.');
      return;
    }

    this.combatText.setText(`Попадание! HP врага: ${this.enemyHp}. КД ${this.getCooldownText(this.lastAttackTime)} сек`);
  }

  private getCombatHudText(): string {
    return `HP врага: ${this.enemyHp} | Урон: ${ATTACK_DAMAGE} | КД: ${(ATTACK_COOLDOWN_MS / 1000).toFixed(2)} сек`;
  }

  private getCooldownText(lastAttackTime: number): string {
    const availableAt = lastAttackTime + ATTACK_COOLDOWN_MS;
    const remainingMs = Math.max(0, availableAt - this.time.now);
    return (remainingMs / 1000).toFixed(2);
  }
}
