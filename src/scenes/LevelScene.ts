import Phaser from 'phaser';
import {
  BACKGROUND_TEXTURE_KEY,
  ENEMY_SPAWN_POINTS,
  MAP_HEIGHT,
  MAP_WIDTH,
  OBSTACLE_DATA,
  OBSTACLE_TEXTURE_KEY,
  PLAYER_HIT_SFX_KEY,
  PLAYER_MAX_HP,
  PLAYER_TEXTURE_KEY,
  UI_CONFIRM_SFX_KEY,
} from './level/constants';
import { LevelCombatController } from './level/LevelCombatController';
import { LevelUiController } from './level/LevelUiController';
import type { WasdKeys } from './level/types';
export class LevelScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: WasdKeys;
  private attackKey?: Phaser.Input.Keyboard.Key;
  private dashKey?: Phaser.Input.Keyboard.Key;
  private playerFacing = new Phaser.Math.Vector2(1, 0);
  private movementVelocity = new Phaser.Math.Vector2();
  private dashDirection = new Phaser.Math.Vector2(1, 0);
  private playerHp = PLAYER_MAX_HP;
  private levelStartTime = 0;
  private firstCombatTimeMs: number | null = null;
  private hasMoved = false;
  private hasAttacked = false;
  private portalUnlocked = false;
  private isCompleting = false;
  private obstacleGroup?: Phaser.Physics.Arcade.StaticGroup;
  private portalZone?: Phaser.GameObjects.Zone;
  private ui!: LevelUiController;
  private combat!: LevelCombatController;
  constructor() {
    super('Level');
  }
  create(): void {
    this.levelStartTime = this.time.now;
    this.createArena();
    this.createPlayer();
    this.createObstacles();
    this.createPortal();
    this.createUi();
    this.bindInput();
    this.combat = new LevelCombatController(this, {
      player: this.player,
      playerFacing: this.playerFacing,
      movementVelocity: this.movementVelocity,
      dashDirection: this.dashDirection,
      obstacleGroup: this.obstacleGroup,
      onEnemyHitPlayer: (damage) => this.onEnemyHitPlayer(damage),
      onEnemyDefeated: () => undefined,
      onAttackResult: (message, isCombat) => {
        this.ui.setDialogue(message);
        if (isCombat && this.firstCombatTimeMs === null) {
          this.firstCombatTimeMs = this.time.now - this.levelStartTime;
        }
      },
      onDash: () => this.ui.advanceOnboarding(3),
      onMeaningfulAction: (isCombat) => {
        this.combat.markMeaningfulAction();
        if (isCombat && this.firstCombatTimeMs === null) {
          this.firstCombatTimeMs = this.time.now - this.levelStartTime;
        }
      },
    });
    this.combat.initialize(this.time.now);
    this.combat.spawnEnemies(ENEMY_SPAWN_POINTS);
    this.ui.playIntroDialogue();
    this.ui.scheduleOnboardingHints(() => this.hasMoved, () => this.hasAttacked);
    this.updateHud();
  }
  update(time: number): void {
    if (!this.player?.body || this.isCompleting) {
      return;
    }
    const moveDirection = this.getMoveDirection();
    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      this.playerFacing.copy(moveDirection);
      this.player.setFlipX(moveDirection.x < 0);
      if (!this.hasMoved) {
        this.hasMoved = true;
        this.ui.advanceOnboarding(1);
      }
    }
    this.combat.updateMovement(time, moveDirection);
    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey) && this.combat.tryAttack(time)) {
      if (!this.hasAttacked) {
        this.hasAttacked = true;
        this.ui.advanceOnboarding(2);
      }
    }
    if (this.dashKey && Phaser.Input.Keyboard.JustDown(this.dashKey)) {
      this.combat.tryDash(time, moveDirection);
    }
    this.combat.updateEnemies(time);
    this.combat.maybeTriggerDowntimeEvent(time, this.portalUnlocked);
    if (!this.portalUnlocked && this.combat.getAliveEnemies().length === 0) {
      this.unlockPortal();
    }
    this.updateHud();
  }
  private createArena(): void {
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.add.tileSprite(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, BACKGROUND_TEXTURE_KEY).setTint(0x676767).setDepth(-10);
    this.add.rectangle(110, 110, 180, 180, 0x4caf50, 0.15).setStrokeStyle(4, 0x7bed9f, 0.75).setDepth(-1);
    this.add.text(30, 32, 'Старт: Руины Пепла', { fontFamily: 'Arial', fontSize: '20px', color: '#d7ffd6' }).setDepth(1);
  }
  private createPlayer(): void {
    this.player = this.physics.add
      .sprite(100, 100, PLAYER_TEXTURE_KEY)
      .setDisplaySize(48, 48)
      .setCollideWorldBounds(true)
      .setDrag(900, 900)
      .setMaxVelocity(240, 240);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
  }
  private createObstacles(): void {
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
    this.physics.add.collider(this.player, obstacles);
  }
  private createPortal(): void {
    const portalFrame = this.add.rectangle(MAP_WIDTH - 165, MAP_HEIGHT - 165, 220, 220, 0x00a8ff, 0.08).setStrokeStyle(5, 0x7ed6ff, 0.25).setDepth(-1);
    this.tweens.add({ targets: portalFrame, alpha: 0.4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.portalZone = this.add.zone(MAP_WIDTH - 165, MAP_HEIGHT - 165, 180, 180);
    this.physics.world.enable(this.portalZone);
    const portalBody = this.portalZone.body as Phaser.Physics.Arcade.Body;
    portalBody.setAllowGravity(false);
    portalBody.setImmovable(true);
    this.physics.add.overlap(this.player, this.portalZone, () => {
      if (this.portalUnlocked && !this.isCompleting) {
        this.combat.markMeaningfulAction();
        this.completeLevel();
      }
    });
  }
  private createUi(): void {
    const hudText = this.add.text(22, 20, '', { fontFamily: 'Arial', fontSize: '20px', color: '#f1f5f9' }).setScrollFactor(0).setDepth(20);
    const objectiveText = this.add
      .text(22, 48, 'Цель: Очисти руины и дойди до портала', { fontFamily: 'Arial', fontSize: '20px', color: '#facc15' })
      .setScrollFactor(0)
      .setDepth(20);
    const statusText = this.add.text(22, 76, 'Статус: В бою | TTF: в процессе', { fontFamily: 'Arial', fontSize: '20px', color: '#7dd3fc' }).setScrollFactor(0).setDepth(20);
    const onboardingText = this.add
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
    const dialogueText = this.add
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
    this.ui = new LevelUiController(this, { hudText, objectiveText, statusText, onboardingText, dialogueText });
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => this.ui.onResize(gameSize));
    this.events.on('resume', () => {
      if (!this.isCompleting) {
        this.ui.setStatus('Статус: В бою');
      }
    });
  }
  private bindInput(): void {
    const keyboard = this.input.keyboard;
    this.cursors = keyboard?.createCursorKeys();
    if (!keyboard) return;
    this.wasdKeys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as WasdKeys;
    this.attackKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.dashKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    keyboard.on('keydown-ESC', () => this.togglePause());
  }
  private getMoveDirection(): Phaser.Math.Vector2 {
    const moveLeft = Boolean(this.cursors?.left?.isDown || this.wasdKeys?.left.isDown);
    const moveRight = Boolean(this.cursors?.right?.isDown || this.wasdKeys?.right.isDown);
    const moveUp = Boolean(this.cursors?.up?.isDown || this.wasdKeys?.up.isDown);
    const moveDown = Boolean(this.cursors?.down?.isDown || this.wasdKeys?.down.isDown);
    return new Phaser.Math.Vector2((moveRight ? 1 : 0) - (moveLeft ? 1 : 0), (moveDown ? 1 : 0) - (moveUp ? 1 : 0));
  }
  private onEnemyHitPlayer(damage: number): void {
    if (this.isCompleting) {
      return;
    }
    this.playerHp = Math.max(0, this.playerHp - damage);
    this.player.setTintFill(0xff6b6b);
    this.time.delayedCall(120, () => this.player.active && this.player.clearTint());
    this.sound.play(PLAYER_HIT_SFX_KEY, { volume: 0.42 });
    this.cameras.main.shake(90, 0.0035);
    this.ui.setDialogue(`Тварь ранит Ashfang! -${damage} HP`);
    if (this.playerHp <= 0) {
      this.failLevel();
    }
  }
  private updateHud(): void {
    this.ui.updateHud({
      playerHp: this.playerHp,
      aliveEnemies: this.combat.getAliveEnemies().length,
      portalUnlocked: this.portalUnlocked,
      attackPhase: this.combat.getAttackPhase(),
      firstCombatTimeMs: this.firstCombatTimeMs,
      levelStartTime: this.levelStartTime,
      lastDashTime: this.combat.getLastDashTime(),
    });
  }
  private unlockPortal(): void {
    this.portalUnlocked = true;
    this.combat.markMeaningfulAction();
    this.ui.advanceOnboarding(4);
    this.ui.setStatus('Статус: Путь к боссу открыт');
    this.ui.setObjective('Цель: Войди в портал, чтобы добраться до Сердца руин');
    this.ui.setDialogue('Ashfang: Путь открыт. Источник скверны рядом.');
  }
  private togglePause(): void {
    if (this.isCompleting || this.scene.isActive('Pause')) return;
    this.ui.setStatus('Статус: Пауза');
    this.scene.launch('Pause', { sourceScene: this.scene.key });
    this.scene.pause();
  }
  private completeLevel(): void {
    this.startEndState('Статус: Переход');
    this.sound.play(UI_CONFIRM_SFX_KEY, { volume: 0.4 });
    this.ui.setDialogue('Переход в следующую зону...');
    this.time.delayedCall(1000, () => this.scene.start('Boss', { playerHp: this.playerHp }));
  }
  private failLevel(): void {
    this.startEndState('Статус: Поражение');
    this.ui.setDialogue('Ashfang пал. Нажми R, чтобы начать заново.');
    this.input.keyboard?.once('keydown-R', () => this.scene.restart());
  }
  private startEndState(statusText: string): void {
    this.isCompleting = true;
    this.ui.setStatus(statusText);
    this.player.setVelocity(0, 0);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (playerBody) playerBody.enable = false;
  }
}
