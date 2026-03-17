import Phaser from 'phaser';

const PLAYER_SPEED = 240;
const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1400;
const PLAYER_TEXTURE_KEY = 'player-wolf';
const ENEMY_TEXTURE_KEY = 'enemy-fiend';
const ATTACK_COOLDOWN_MS = 430;
const ATTACK_DAMAGE = 25;
const ENEMY_MAX_HP = 70;
const ATTACK_RANGE = 102;
const ATTACK_ARC_HALF_ANGLE = Phaser.Math.DegToRad(46);
const PLAYER_MAX_HP = 180;
const PLAYER_HIT_COOLDOWN_MS = 650;

const OBSTACLE_TEXTURE_KEY = 'object-ruin-crate';
const BACKGROUND_TEXTURE_KEY = 'bg-ash-sky';

const ATTACK_SFX_KEY = 'sfx-player-attack';
const PLAYER_HIT_SFX_KEY = 'sfx-player-hit';
const ENEMY_DOWN_SFX_KEY = 'sfx-enemy-down';
const UI_CONFIRM_SFX_KEY = 'sfx-ui-confirm';

type EnemyState = {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  speed: number;
  damage: number;
  lastHitTime: number;
};

export class LevelScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private enemies: EnemyState[] = [];

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private hudText!: Phaser.GameObjects.Text;

  private dialogueText!: Phaser.GameObjects.Text;

  private objectiveText!: Phaser.GameObjects.Text;

  private statusText!: Phaser.GameObjects.Text;

  private wasdKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  private attackKey?: Phaser.Input.Keyboard.Key;

  private lastAttackTime = -Infinity;

  private playerFacing = new Phaser.Math.Vector2(1, 0);

  private playerHp = PLAYER_MAX_HP;

  private portalUnlocked = false;

  private portalZone?: Phaser.GameObjects.Zone;

  private isCompleting = false;

  constructor() {
    super('Level');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.add
      .tileSprite(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, BACKGROUND_TEXTURE_KEY)
      .setTint(0x676767)
      .setDepth(-10);

    this.add
      .rectangle(110, 110, 180, 180, 0x4caf50, 0.15)
      .setStrokeStyle(4, 0x7bed9f, 0.75)
      .setDepth(-1);

    this.add
      .text(30, 32, 'Старт: Руины Пепла', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#d7ffd6',
      })
      .setDepth(1);

    const portalFrame = this.add
      .rectangle(MAP_WIDTH - 165, MAP_HEIGHT - 165, 220, 220, 0x00a8ff, 0.08)
      .setStrokeStyle(5, 0x7ed6ff, 0.25)
      .setDepth(-1);

    this.tweens.add({
      targets: portalFrame,
      alpha: 0.4,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.portalZone = this.add.zone(MAP_WIDTH - 165, MAP_HEIGHT - 165, 180, 180);
    this.physics.world.enable(this.portalZone);
    const portalBody = this.portalZone.body as Phaser.Physics.Arcade.Body;
    portalBody.setAllowGravity(false);
    portalBody.setImmovable(true);

    this.hudText = this.add
      .text(22, 20, '', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#f1f5f9',
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.objectiveText = this.add
      .text(22, 48, 'Цель: Очисти руины и дойди до портала', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#facc15',
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.statusText = this.add
      .text(22, 76, 'Статус: В бою', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#7dd3fc',
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.dialogueText = this.add
      .text(this.scale.width / 2, this.scale.height - 70, '', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#ffe8a3',
        align: 'center',
        wordWrap: { width: Math.min(this.scale.width - 80, 900) },
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(20);

    const obstacles = this.physics.add.staticGroup();
    const obstacleData: Array<{ x: number; y: number; width: number; height: number }> = [
      { x: 460, y: 300, width: 720, height: 70 },
      { x: 1220, y: 560, width: 420, height: 70 },
      { x: 920, y: 900, width: 820, height: 80 },
      { x: 1700, y: 360, width: 560, height: 70 },
      { x: 1840, y: 1120, width: 480, height: 70 },
      { x: 1460, y: 1060, width: 380, height: 60 },
    ];

    obstacleData.forEach((obstacle) => {
      const platform = this.physics.add
        .staticImage(obstacle.x, obstacle.y, OBSTACLE_TEXTURE_KEY)
        .setDisplaySize(obstacle.width, obstacle.height)
        .setTint(0x625555)
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

    this.physics.add.overlap(this.player, this.portalZone, () => {
      if (this.portalUnlocked && !this.isCompleting) {
        this.completeLevel();
      }
    });

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
      keyboard.on('keydown-ESC', () => this.togglePause());
    }

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.dialogueText.setPosition(gameSize.width / 2, gameSize.height - 70);
      this.dialogueText.setWordWrapWidth(Math.min(gameSize.width - 80, 900));
    });

    this.events.on('resume', () => {
      if (!this.isCompleting) {
        this.statusText.setText('Статус: В бою');
      }
    });

    this.playIntroDialogue();
    this.updateHud();
  }

  update(time: number): void {
    if (!this.player?.body || this.isCompleting) {
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

    this.updateEnemies(time);
    this.updateHud();

    if (!this.portalUnlocked && this.getAliveEnemies().length === 0) {
      this.unlockPortal();
    }
  }

  private spawnEnemies(obstacles: Phaser.Physics.Arcade.StaticGroup): void {
    const enemySpawnPoints: Array<{ x: number; y: number; speed: number; damage: number }> = [
      { x: 340, y: 160, speed: 92, damage: 10 },
      { x: 690, y: 250, speed: 106, damage: 10 },
      { x: 1040, y: 210, speed: 115, damage: 11 },
      { x: 1380, y: 520, speed: 118, damage: 12 },
      { x: 1620, y: 790, speed: 126, damage: 12 },
      { x: 1860, y: 930, speed: 130, damage: 13 },
    ];

    enemySpawnPoints.forEach((spawnPoint) => {
      const enemy = this.physics.add
        .sprite(spawnPoint.x, spawnPoint.y, ENEMY_TEXTURE_KEY)
        .setDisplaySize(44, 44)
        .setCollideWorldBounds(true);

      const enemyState: EnemyState = {
        sprite: enemy,
        hp: ENEMY_MAX_HP,
        speed: spawnPoint.speed,
        damage: spawnPoint.damage,
        lastHitTime: -Infinity,
      };

      this.enemies.push(enemyState);

      this.physics.add.collider(enemy, obstacles);
      this.physics.add.collider(this.player, enemy, () => this.onEnemyTouchPlayer(enemyState));
    });
  }

  private updateEnemies(time: number): void {
    this.getAliveEnemies().forEach((enemyState) => {
      const direction = new Phaser.Math.Vector2(this.player.x - enemyState.sprite.x, this.player.y - enemyState.sprite.y);
      const distance = direction.length();

      if (distance < 2) {
        enemyState.sprite.setVelocity(0, 0);
        return;
      }

      direction.normalize();
      enemyState.sprite.setVelocity(direction.x * enemyState.speed, direction.y * enemyState.speed);
      enemyState.sprite.setFlipX(direction.x < 0);

      if (distance <= 64 && time - enemyState.lastHitTime >= PLAYER_HIT_COOLDOWN_MS) {
        this.onEnemyTouchPlayer(enemyState);
      }
    });
  }

  private onEnemyTouchPlayer(enemyState: EnemyState): void {
    if (!enemyState.sprite.active || this.isCompleting) {
      return;
    }

    const now = this.time.now;

    if (now - enemyState.lastHitTime < PLAYER_HIT_COOLDOWN_MS) {
      return;
    }

    enemyState.lastHitTime = now;
    this.playerHp = Math.max(0, this.playerHp - enemyState.damage);
    this.player.setTintFill(0xff6b6b);

    this.time.delayedCall(120, () => {
      if (this.player.active) {
        this.player.clearTint();
      }
    });

    this.sound.play(PLAYER_HIT_SFX_KEY, { volume: 0.42 });
    this.cameras.main.shake(90, 0.0035);
    this.dialogueText.setText(`Тварь ранит Ashfang! -${enemyState.damage} HP`);
    this.updateHud();

    if (this.playerHp <= 0) {
      this.failLevel();
    }
  }

  private performAttack(time: number): void {
    this.lastAttackTime = time;
    this.sound.play(ATTACK_SFX_KEY, { volume: 0.5 });
    this.playAttackAnimation();

    const hitEnemies = this.enemies.filter((enemyState) => this.isEnemyHit(enemyState));

    if (hitEnemies.length === 0) {
      this.dialogueText.setText('Удар впустую. Враги наступают!');
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
        this.sound.play(ENEMY_DOWN_SFX_KEY, { volume: 0.34 });
      }
    });

    this.cameras.main.shake(90, 0.002);
    const aliveEnemies = this.getAliveEnemies().length;
    this.dialogueText.setText(`Попадание x${hitEnemies.length}. Осталось врагов: ${aliveEnemies}`);
    this.updateHud();
  }

  private playAttackAnimation(): void {
    const baseScaleX = this.player.scaleX;
    const baseScaleY = this.player.scaleY;

    this.player.setTintFill(0xf1fa8c);

    this.tweens.add({
      targets: this.player,
      scaleX: baseScaleX * 1.22,
      scaleY: baseScaleY * 0.86,
      yoyo: true,
      duration: 85,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.player.clearTint();
        this.player.setScale(baseScaleX, baseScaleY);
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

    const toEnemy = new Phaser.Math.Vector2(enemyState.sprite.x - this.player.x, enemyState.sprite.y - this.player.y);
    const enemyDistance = toEnemy.length();

    if (enemyDistance === 0 || enemyDistance > ATTACK_RANGE) {
      return false;
    }

    const enemyDirection = toEnemy.normalize();
    const facingAngle = Phaser.Math.Angle.Wrap(this.playerFacing.angle() - enemyDirection.angle());

    return Math.abs(facingAngle) <= ATTACK_ARC_HALF_ANGLE;
  }

  private updateHud(): void {
    this.hudText.setText(`HP: ${this.playerHp}/${PLAYER_MAX_HP} | Враги: ${this.getAliveEnemies().length} | FPS: ${Math.round(this.game.loop.actualFps)}`);
  }

  private togglePause(): void {
    if (this.isCompleting || this.scene.isActive('Pause')) {
      return;
    }

    this.statusText.setText('Статус: Пауза');
    this.scene.launch('Pause', { sourceScene: this.scene.key });
    this.scene.pause();
  }

  private getAliveEnemies(): EnemyState[] {
    return this.enemies.filter((enemyState) => enemyState.hp > 0 && enemyState.sprite.active);
  }

  private unlockPortal(): void {
    this.portalUnlocked = true;
    this.statusText.setText('Статус: Путь к боссу открыт');
    this.objectiveText.setText('Цель: Войди в портал, чтобы добраться до Сердца руин');
    this.dialogueText.setText('Ashfang: Путь открыт. Источник скверны рядом.');
  }

  private completeLevel(): void {
    this.isCompleting = true;
    this.statusText.setText('Статус: Переход');
    this.player.setVelocity(0, 0);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (playerBody) {
      playerBody.enable = false;
    }
    this.sound.play(UI_CONFIRM_SFX_KEY, { volume: 0.4 });
    this.dialogueText.setText('Переход в следующую зону...');

    this.time.delayedCall(1000, () => {
      this.scene.start('Boss', { playerHp: this.playerHp });
    });
  }

  private failLevel(): void {
    this.isCompleting = true;
    this.statusText.setText('Статус: Поражение');
    this.player.setVelocity(0, 0);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (playerBody) {
      playerBody.enable = false;
    }
    this.dialogueText.setText('Ashfang пал. Нажми R, чтобы начать заново.');

    this.input.keyboard?.once('keydown-R', () => this.scene.restart());
  }

  private playIntroDialogue(): void {
    this.dialogueText.setText('Старейшина: Ashfang, в руинах пробудилась дикая скверна.');
    this.time.delayedCall(3200, () => {
      this.dialogueText.setText('Ashfang: Я очищу путь и доберусь до Сердца руин.');
    });
    this.time.delayedCall(6500, () => {
      this.dialogueText.setText('Убей всех врагов. После этого активируется портал к боссу.');
    });
  }

  private getFacingAngle(): number {
    return Phaser.Math.RadToDeg(this.playerFacing.angle());
  }
}
