import Phaser from 'phaser';

const PLAYER_SPEED = 240;
const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1400;
const PLAYER_TEXTURE_KEY = 'player-wolf';
const ENEMY_TEXTURE_KEY = 'enemy-fiend';
const ATTACK_COOLDOWN_MS = 450;
const ATTACK_DAMAGE = 25;
const ENEMY_MAX_HP = 100;
const ATTACK_RANGE = 72;
const ATTACK_ARC_HALF_ANGLE = Phaser.Math.DegToRad(42);

const OBSTACLE_TEXTURE_KEY = 'object-ruin-crate';
const BACKGROUND_TEXTURE_KEY = 'bg-ash-sky';

type EnemyState = {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
};

export class LevelScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private enemies: EnemyState[] = [];

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
    this.add
      .tileSprite(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, BACKGROUND_TEXTURE_KEY)
      .setTint(0x6f6f6f)
      .setDepth(-10);

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

    const obstacleData: Array<{ x: number; y: number; width: number; height: number }> = [
      { x: 460, y: 300, width: 780, height: 70 },
      { x: 1220, y: 560, width: 420, height: 70 },
      { x: 920, y: 900, width: 840, height: 80 },
      { x: 1700, y: 360, width: 560, height: 70 },
      { x: 1840, y: 1120, width: 480, height: 70 },
    ];

    obstacleData.forEach((obstacle) => {
      const platform = this.physics.add
        .staticImage(obstacle.x, obstacle.y, OBSTACLE_TEXTURE_KEY)
        .setDisplaySize(obstacle.width, obstacle.height)
        .setTint(0x706060)
        .refreshBody();
      obstacles.add(platform);
    });

    this.player = this.physics.add
      .sprite(100, 100, PLAYER_TEXTURE_KEY)
      .setDisplaySize(48, 48)
      .setCollideWorldBounds(true)
      .setDrag(900, 900)
      .setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);

    this.physics.add.collider(this.player, obstacles);
    this.spawnEnemies(obstacles);
    this.combatText.setText(this.getCombatHudText());

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
      this.player.setFlipX(moveDirection.x < 0);
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

  private spawnEnemies(obstacles: Phaser.Physics.Arcade.StaticGroup): void {
    const enemySpawnPoints: Array<{ x: number; y: number }> = [
      { x: 340, y: 120 },
      { x: 560, y: 180 },
      { x: 760, y: 140 },
      { x: 980, y: 220 },
      { x: 1200, y: 180 },
    ];

    enemySpawnPoints.forEach((spawnPoint, index) => {
      const enemy = this.physics.add
        .sprite(spawnPoint.x, spawnPoint.y, ENEMY_TEXTURE_KEY)
        .setDisplaySize(44, 44)
        .setImmovable(true)
        .setCollideWorldBounds(true)
        .setPushable(false);

      this.enemies.push({ sprite: enemy, hp: ENEMY_MAX_HP });

      this.physics.add.collider(enemy, obstacles);
      this.physics.add.collider(this.player, enemy);

      this.tweens.add({
        targets: enemy,
        y: enemy.y - 8,
        yoyo: true,
        repeat: -1,
        duration: 420 + index * 70,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private performAttack(time: number): void {
    this.lastAttackTime = time;
    this.playAttackAnimation();

    const hitEnemies = this.enemies.filter((enemyState) => this.isEnemyHit(enemyState));

    if (hitEnemies.length === 0) {
      this.combatText.setText(`Промах. КД ${this.getCooldownText(this.lastAttackTime)} сек`);
      return;
    }

    hitEnemies.forEach((enemyState) => {
      enemyState.hp = Math.max(0, enemyState.hp - ATTACK_DAMAGE);

      enemyState.sprite.setTintFill(0xffffff);
      this.time.delayedCall(90, () => {
        if (enemyState.sprite.active) {
          enemyState.sprite.clearTint();
        }
      });

      if (enemyState.hp <= 0) {
        enemyState.sprite.disableBody(true, true);
      }
    });

    this.cameras.main.shake(90, 0.002);

    const aliveEnemies = this.enemies.filter((enemyState) => enemyState.hp > 0).length;

    if (aliveEnemies === 0) {
      this.combatText.setText('Комбо! Все враги побеждены.');
      return;
    }

    this.combatText.setText(`Попадание x${hitEnemies.length}! Осталось врагов: ${aliveEnemies}. КД ${this.getCooldownText(this.lastAttackTime)} сек`);
  }

  private playAttackAnimation(): void {
    this.player.setTintFill(0xf1fa8c);
    this.player.setScale(1, 1);

    this.tweens.add({
      targets: this.player,
      scaleX: 1.22,
      scaleY: 0.86,
      yoyo: true,
      duration: 85,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.player.clearTint();
        this.player.setScale(1, 1);
      },
    });

    const slash = this.add
      .arc(this.player.x, this.player.y, ATTACK_RANGE, this.getFacingAngle() - 35, this.getFacingAngle() + 35, false, 0xf1fa8c, 0.45)
      .setStrokeStyle(3, 0xffffff, 0.85)
      .setDepth(8);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      scale: 1.25,
      duration: 110,
      ease: 'Quad.easeOut',
      onComplete: () => slash.destroy(),
    });
  }

  private isEnemyHit(enemyState: EnemyState): boolean {
    if (!enemyState.sprite.active || enemyState.hp <= 0) {
      return false;
    }

    const toEnemy = new Phaser.Math.Vector2(
      enemyState.sprite.x - this.player.x,
      enemyState.sprite.y - this.player.y,
    );
    const enemyDistance = toEnemy.length();

    if (enemyDistance === 0 || enemyDistance > ATTACK_RANGE) {
      return false;
    }

    const enemyDirection = toEnemy.normalize();
    const facingAngle = Phaser.Math.Angle.Wrap(this.playerFacing.angle() - enemyDirection.angle());

    return Math.abs(facingAngle) <= ATTACK_ARC_HALF_ANGLE;
  }

  private getCombatHudText(): string {
    return `Врагов: ${this.enemies.length} | Урон: ${ATTACK_DAMAGE} | КД: ${(ATTACK_COOLDOWN_MS / 1000).toFixed(2)} сек`;
  }

  private getCooldownText(lastAttackTime: number): string {
    const availableAt = lastAttackTime + ATTACK_COOLDOWN_MS;
    const remainingMs = Math.max(0, availableAt - this.time.now);
    return (remainingMs / 1000).toFixed(2);
  }

  private getFacingAngle(): number {
    return Phaser.Math.RadToDeg(this.playerFacing.angle());
  }
}
