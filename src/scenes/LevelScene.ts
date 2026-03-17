import Phaser from 'phaser';

const PLAYER_SPEED = 240;
const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1400;
const PLAYER_TEXTURE_KEY = 'player-wolf';
const ENEMY_TEXTURE_KEY = 'enemy-fiend';
const ATTACK_COOLDOWN_MS = 430;
const ATTACK_STARTUP_MS = 90;
const ATTACK_IMPACT_MS = 75;
const ATTACK_RECOVER_MS = 130;
const ATTACK_DAMAGE = 25;
const ENEMY_MAX_HP = 70;
const ATTACK_RANGE = 102;
const ATTACK_ARC_HALF_ANGLE = Phaser.Math.DegToRad(46);
const PLAYER_MAX_HP = 180;
const PLAYER_HIT_COOLDOWN_MS = 650;
const DOWNTIME_LIMIT_MS = 5000;
const MAX_PRESSURE_SPAWNS = 3;
const MOVEMENT_SMOOTHING = 0.22;
const DASH_SPEED = 620;
const DASH_DURATION_MS = 130;
const DASH_COOLDOWN_MS = 1400;
const ENEMY_STAGGER_MS = 210;
const ENEMY_HIT_KNOCKBACK = 280;

const OBSTACLE_TEXTURE_KEY = 'object-ruin-crate';
const BACKGROUND_TEXTURE_KEY = 'bg-ash-sky';

const ATTACK_SFX_KEY = 'sfx-player-attack';
const PLAYER_HIT_SFX_KEY = 'sfx-player-hit';
const ENEMY_DOWN_SFX_KEY = 'sfx-enemy-down';
const UI_CONFIRM_SFX_KEY = 'sfx-ui-confirm';

const OBSTACLE_DATA: Array<{ x: number; y: number; width: number; height: number }> = [
  { x: 460, y: 300, width: 720, height: 70 },
  { x: 1220, y: 560, width: 420, height: 70 },
  { x: 920, y: 900, width: 820, height: 80 },
  { x: 1700, y: 360, width: 560, height: 70 },
  { x: 1840, y: 1120, width: 480, height: 70 },
  { x: 1460, y: 1060, width: 380, height: 60 },
];

const ENEMY_SPAWN_POINTS: Array<{ x: number; y: number; speed: number; damage: number }> = [
  { x: 340, y: 160, speed: 92, damage: 10 },
  { x: 690, y: 250, speed: 106, damage: 10 },
  { x: 1040, y: 210, speed: 115, damage: 11 },
  { x: 1380, y: 520, speed: 118, damage: 12 },
  { x: 1620, y: 790, speed: 126, damage: 12 },
  { x: 1860, y: 930, speed: 130, damage: 13 },
];

const ONBOARDING_HINTS = [
  'Обучение: Двигайся WASD / стрелками. Управление не блокируется.',
  'Обучение: Нажми SPACE для атаки в сторону движения.',
  'Обучение: SHIFT — короткий рывок с кулдауном для уклонения и входа в бой.',
  'Обучение: Победи всех врагов и войди в сияющий портал.',
  'Обучение: Портал открыт! Доберись до него, чтобы начать бой с боссом.',
];

type EnemyState = {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  speed: number;
  damage: number;
  lastHitTime: number;
  staggerUntil: number;
};

type AttackPhase = 'idle' | 'startup' | 'impact' | 'recover';

export class LevelScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private enemies: EnemyState[] = [];

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private hudText!: Phaser.GameObjects.Text;

  private dialogueText!: Phaser.GameObjects.Text;

  private objectiveText!: Phaser.GameObjects.Text;

  private statusText!: Phaser.GameObjects.Text;

  private onboardingText!: Phaser.GameObjects.Text;

  private onboardingStepIndex = 0;

  private hasMoved = false;

  private hasAttacked = false;

  private wasdKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  private attackKey?: Phaser.Input.Keyboard.Key;

  private dashKey?: Phaser.Input.Keyboard.Key;

  private lastAttackTime = -Infinity;

  private lastDashTime = -Infinity;

  private dashEndTime = -Infinity;

  private dashDirection = new Phaser.Math.Vector2(1, 0);

  private movementVelocity = new Phaser.Math.Vector2();

  private attackPhase: AttackPhase = 'idle';

  private playerFacing = new Phaser.Math.Vector2(1, 0);

  private playerHp = PLAYER_MAX_HP;

  private portalUnlocked = false;

  private portalZone?: Phaser.GameObjects.Zone;

  private obstacleGroup?: Phaser.Physics.Arcade.StaticGroup;

  private isCompleting = false;

  private levelStartTime = 0;

  private firstCombatTimeMs: number | null = null;

  private lastMeaningfulActionTime = 0;

  private pressureSpawnCount = 0;

  constructor() {
    super('Level');
  }

  create(): void {
    this.levelStartTime = this.time.now;
    this.lastMeaningfulActionTime = this.levelStartTime;

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
      .text(22, 76, 'Статус: В бою | TTF: в процессе', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#7dd3fc',
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.onboardingText = this.add
      .text(this.scale.width - 24, 22, '', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#93c5fd',
        align: 'right',
        wordWrap: { width: Math.min(this.scale.width * 0.44, 460) },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(22);

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
    this.obstacleGroup = obstacles;
    OBSTACLE_DATA.forEach((obstacle) => {
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
        this.markMeaningfulAction();
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
      this.dashKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      keyboard.on('keydown-ESC', () => this.togglePause());
    }

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.dialogueText.setPosition(gameSize.width / 2, gameSize.height - 70);
      this.dialogueText.setWordWrapWidth(Math.min(gameSize.width - 80, 900));
      this.onboardingText.setPosition(gameSize.width - 24, 22);
      this.onboardingText.setWordWrapWidth(Math.min(gameSize.width * 0.44, 460));
    });

    this.events.on('resume', () => {
      if (!this.isCompleting) {
        this.statusText.setText('Статус: В бою');
      }
    });

    this.playIntroDialogue();
    this.scheduleOnboardingHints();
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

    const isDashing = time < this.dashEndTime;
    if (!isDashing) {
      const targetVelocity = moveDirection.clone().scale(PLAYER_SPEED);
      this.movementVelocity.lerp(targetVelocity, MOVEMENT_SMOOTHING);
      this.player.setVelocity(this.movementVelocity.x, this.movementVelocity.y);
    } else {
      const dashVelocity = this.dashDirection.clone().scale(DASH_SPEED);
      this.player.setVelocity(dashVelocity.x, dashVelocity.y);
    }

    if (!this.hasMoved && moveDirection.lengthSq() > 0) {
      this.hasMoved = true;
      this.advanceOnboarding(1);
    }

    if (
      this.attackKey &&
      Phaser.Input.Keyboard.JustDown(this.attackKey) &&
      time - this.lastAttackTime >= ATTACK_COOLDOWN_MS &&
      this.attackPhase === 'idle'
    ) {
      if (!this.hasAttacked) {
        this.hasAttacked = true;
        this.advanceOnboarding(2);
      }
      this.startAttack(time);
    }

    if (this.dashKey && Phaser.Input.Keyboard.JustDown(this.dashKey)) {
      this.tryDash(time, moveDirection);
    }

    this.updateEnemies(time);
    this.maybeTriggerDowntimeEvent(time);
    this.updateHud();

    if (!this.portalUnlocked && this.getAliveEnemies().length === 0) {
      this.unlockPortal();
    }
  }

  private spawnEnemies(obstacles: Phaser.Physics.Arcade.StaticGroup): void {
    ENEMY_SPAWN_POINTS.forEach((spawnPoint) => {
      this.createEnemy(spawnPoint.x, spawnPoint.y, spawnPoint.speed, spawnPoint.damage, obstacles);
    });
  }

  private spawnPressureEnemy(): void {
    if (this.pressureSpawnCount >= MAX_PRESSURE_SPAWNS || this.portalUnlocked) {
      return;
    }

    const spawnOffset = new Phaser.Math.Vector2().setToPolar(Phaser.Math.FloatBetween(0, Math.PI * 2), 220);
    const spawnX = Phaser.Math.Clamp(this.player.x + spawnOffset.x, 40, MAP_WIDTH - 40);
    const spawnY = Phaser.Math.Clamp(this.player.y + spawnOffset.y, 40, MAP_HEIGHT - 40);
    this.createEnemy(spawnX, spawnY, 140, 14, this.obstacleGroup, 0xff9f43);

    this.pressureSpawnCount += 1;
    this.dialogueText.setText('Скверна чувствует паузу — новая тварь выходит на охоту!');
  }

  private createEnemy(
    x: number,
    y: number,
    speed: number,
    damage: number,
    obstacles?: Phaser.Physics.Arcade.StaticGroup,
    tint?: number,
  ): void {
    const enemy = this.physics.add
      .sprite(x, y, ENEMY_TEXTURE_KEY)
      .setDisplaySize(44, 44)
      .setCollideWorldBounds(true);

    if (typeof tint === 'number') {
      enemy.setTint(tint);
    }

    const enemyState: EnemyState = {
      sprite: enemy,
      hp: ENEMY_MAX_HP,
      speed,
      damage,
      lastHitTime: -Infinity,
      staggerUntil: -Infinity,
    };

    this.enemies.push(enemyState);

    if (obstacles) {
      this.physics.add.collider(enemy, obstacles);
    }

    this.physics.add.collider(this.player, enemy, () => this.onEnemyTouchPlayer(enemyState));
  }

  private updateEnemies(time: number): void {
    this.getAliveEnemies().forEach((enemyState) => {
      const direction = new Phaser.Math.Vector2(this.player.x - enemyState.sprite.x, this.player.y - enemyState.sprite.y);
      const distance = direction.length();

      if (time < enemyState.staggerUntil) {
        return;
      }

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
    this.markMeaningfulAction();
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

  private startAttack(time: number): void {
    this.lastAttackTime = time;
    this.markMeaningfulAction();
    this.sound.play(ATTACK_SFX_KEY, { volume: 0.5 });
    this.attackPhase = 'startup';
    this.playAttackStartup();

    this.time.delayedCall(ATTACK_STARTUP_MS, () => {
      if (!this.player.active || this.isCompleting) {
        return;
      }

      this.attackPhase = 'impact';
      this.playAttackImpact();
      this.resolveAttackImpact();
    });

    this.time.delayedCall(ATTACK_STARTUP_MS + ATTACK_IMPACT_MS, () => {
      if (!this.player.active || this.isCompleting) {
        return;
      }

      this.attackPhase = 'recover';
      this.playAttackRecover();
    });

    this.time.delayedCall(ATTACK_STARTUP_MS + ATTACK_IMPACT_MS + ATTACK_RECOVER_MS, () => {
      if (!this.player.active || this.isCompleting) {
        return;
      }
      this.attackPhase = 'idle';
    });
  }

  private resolveAttackImpact(): void {
    const hitEnemies = this.enemies.filter((enemyState) => this.isEnemyHit(enemyState));

    if (hitEnemies.length === 0) {
      this.dialogueText.setText('Удар впустую. Враги наступают!');
      return;
    }

    hitEnemies.forEach((enemyState) => {
      this.markMeaningfulAction(true);
      enemyState.hp = Math.max(0, enemyState.hp - ATTACK_DAMAGE);
      enemyState.staggerUntil = this.time.now + ENEMY_STAGGER_MS;

      const knockbackDirection = new Phaser.Math.Vector2(enemyState.sprite.x - this.player.x, enemyState.sprite.y - this.player.y);
      if (knockbackDirection.lengthSq() > 0) {
        knockbackDirection.normalize();
      }

      enemyState.sprite.setVelocity(
        knockbackDirection.x * ENEMY_HIT_KNOCKBACK,
        knockbackDirection.y * ENEMY_HIT_KNOCKBACK,
      );
      enemyState.sprite.setTintFill(0xfff1c1);
      this.time.delayedCall(90, () => {
        if (enemyState.sprite.active) {
          enemyState.sprite.clearTint();
        }
      });

      this.tweens.add({
        targets: enemyState.sprite,
        scaleX: 1.2,
        scaleY: 0.84,
        duration: 55,
        yoyo: true,
        ease: 'Quad.easeOut',
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

  private playAttackStartup(): void {
    this.player.setTintFill(0xc8d6ff);
    this.tweens.add({
      targets: this.player,
      scaleX: 1.1,
      scaleY: 0.92,
      duration: ATTACK_STARTUP_MS,
      ease: 'Quad.easeOut',
    });
  }

  private playAttackImpact(): void {
    const baseScaleX = this.player.scaleX;
    const baseScaleY = this.player.scaleY;

    this.player.setTintFill(0xf1fa8c);

    this.tweens.add({
      targets: this.player,
      scaleX: baseScaleX * 1.22,
      scaleY: baseScaleY * 0.86,
      yoyo: true,
      duration: ATTACK_IMPACT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
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

  private playAttackRecover(): void {
    this.player.clearTint();
    this.tweens.add({
      targets: this.player,
      alpha: 0.92,
      yoyo: true,
      duration: ATTACK_RECOVER_MS,
      ease: 'Sine.easeOut',
      onComplete: () => this.player.setAlpha(1),
    });
  }

  private tryDash(time: number, moveDirection: Phaser.Math.Vector2): void {
    if (time - this.lastDashTime < DASH_COOLDOWN_MS || time < this.dashEndTime) {
      return;
    }

    if (moveDirection.lengthSq() > 0) {
      this.dashDirection.copy(moveDirection).normalize();
    } else if (this.playerFacing.lengthSq() > 0) {
      this.dashDirection.copy(this.playerFacing).normalize();
    }

    this.lastDashTime = time;
    this.dashEndTime = time + DASH_DURATION_MS;
    this.markMeaningfulAction();
    this.advanceOnboarding(3);

    this.player.setTint(0x9be7ff);
    this.cameras.main.shake(75, 0.0018);

    this.time.delayedCall(DASH_DURATION_MS, () => {
      if (this.player.active) {
        this.player.clearTint();
      }
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
    const aliveEnemies = this.getAliveEnemies().length;
    const elapsedSeconds = Math.max(0, Math.round((this.time.now - this.levelStartTime) / 1000));
    const dashRemainingMs = Math.max(0, DASH_COOLDOWN_MS - (this.time.now - this.lastDashTime));
    const dashLabel = dashRemainingMs > 0 ? `${(dashRemainingMs / 1000).toFixed(1)}с` : 'готов';
    this.hudText.setText(
      `HP: ${this.playerHp}/${PLAYER_MAX_HP} | Враги: ${aliveEnemies} | Рывок: ${dashLabel} | Атака: ${this.attackPhase} | Время: ${elapsedSeconds}с | FPS: ${Math.round(this.game.loop.actualFps)}`,
    );

    if (!this.portalUnlocked) {
      this.objectiveText.setText(`Цель: Уничтожь врагов (${aliveEnemies}) и войди в портал`);
    }

    const ttfText = this.firstCombatTimeMs === null ? 'в процессе' : `${(this.firstCombatTimeMs / 1000).toFixed(1)}с`;
    const statusLabel = this.portalUnlocked ? 'Путь к боссу открыт' : 'В бою';
    this.statusText.setText(`Статус: ${statusLabel} | TTF: ${ttfText}`);
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
    this.markMeaningfulAction();
    this.advanceOnboarding(4);
    this.statusText.setText('Статус: Путь к боссу открыт');
    this.objectiveText.setText('Цель: Войди в портал, чтобы добраться до Сердца руин');
    this.dialogueText.setText('Ashfang: Путь открыт. Источник скверны рядом.');
  }

  private completeLevel(): void {
    this.startEndState('Статус: Переход');
    this.sound.play(UI_CONFIRM_SFX_KEY, { volume: 0.4 });
    this.dialogueText.setText('Переход в следующую зону...');

    this.time.delayedCall(1000, () => {
      this.scene.start('Boss', { playerHp: this.playerHp });
    });
  }

  private failLevel(): void {
    this.startEndState('Статус: Поражение');
    this.dialogueText.setText('Ashfang пал. Нажми R, чтобы начать заново.');

    this.input.keyboard?.once('keydown-R', () => this.scene.restart());
  }

  private playIntroDialogue(): void {
    this.dialogueText.setText('Астрелия: Ashfang, руины шепчут голосами павших и зовут к Сердцу.');
    this.time.delayedCall(3200, () => {
      this.dialogueText.setText('Ashfang: Я найду осколок и верну надежду племени Белого Пламени.');
    });
    this.time.delayedCall(6500, () => {
      this.dialogueText.setText('Очисти руины от скверны. Портал к Сердцу откроется после победы.');
    });
  }

  private scheduleOnboardingHints(): void {
    this.showOnboarding(ONBOARDING_HINTS[0]);

    this.time.delayedCall(7000, () => {
      if (!this.hasMoved) {
        this.showOnboarding('Подсказка: зажми W/A/S/D для рывка по руинам.');
      }
    });

    this.time.delayedCall(13000, () => {
      if (!this.hasAttacked) {
        this.showOnboarding('Подсказка: атака проходит фазы startup → impact → recover. Лови момент impact.');
      }
    });
  }

  private advanceOnboarding(stepIndex: number): void {
    if (stepIndex <= this.onboardingStepIndex) {
      return;
    }

    this.onboardingStepIndex = stepIndex;

    const hintsByStep: Record<number, string> = {
      1: 'Отлично! Теперь попробуй атаку: SPACE.',
      2: 'Теперь протестируй рывок: SHIFT, затем добей врагов.',
      3: 'Хорошо! Добей врагов и открой путь к порталу.',
      4: 'Финал этапа: войди в портал, чтобы встретить источник скверны.',
    };

    const nextHint = hintsByStep[stepIndex];
    if (nextHint) {
      this.showOnboarding(nextHint);
    }
  }

  private startEndState(statusText: string): void {
    this.isCompleting = true;
    this.statusText.setText(statusText);
    this.player.setVelocity(0, 0);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (playerBody) {
      playerBody.enable = false;
    }
  }

  private showOnboarding(text: string): void {
    this.onboardingText.setAlpha(1);
    this.onboardingText.setText(text);
    this.tweens.killTweensOf(this.onboardingText);
    this.tweens.add({
      targets: this.onboardingText,
      alpha: 0.72,
      duration: 380,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
  }

  private getFacingAngle(): number {
    return Phaser.Math.RadToDeg(this.playerFacing.angle());
  }

  private markMeaningfulAction(isCombat = false): void {
    this.lastMeaningfulActionTime = this.time.now;

    if (isCombat && this.firstCombatTimeMs === null) {
      this.firstCombatTimeMs = this.time.now - this.levelStartTime;
    }
  }

  private maybeTriggerDowntimeEvent(time: number): void {
    if (this.portalUnlocked || this.getAliveEnemies().length === 0) {
      return;
    }

    if (time - this.lastMeaningfulActionTime > DOWNTIME_LIMIT_MS) {
      this.spawnPressureEnemy();
      this.markMeaningfulAction();
    }
  }
}
