import Phaser from 'phaser';
import { BossNarrativeController } from './boss/BossNarrativeController';
import {
  ATTACK_ARC_HALF_ANGLE,
  ATTACK_COOLDOWN_MS,
  ATTACK_DAMAGE,
  ATTACK_RANGE,
  ATTACK_SFX_KEY,
  BACKGROUND_TEXTURE_KEY,
  BOSS_CONTACT_RANGE,
  BOSS_DAMAGE,
  BOSS_MAX_HP,
  BOSS_SPEED,
  ENEMY_DOWN_SFX_KEY,
  ENEMY_TEXTURE_KEY,
  OBSTACLE_TEXTURE_KEY,
  PLAYER_HIT_COOLDOWN_MS,
  PLAYER_HIT_SFX_KEY,
  PLAYER_MAX_HP,
  PLAYER_SPEED,
  PLAYER_TEXTURE_KEY,
} from './boss/constants';

export class BossScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private boss!: Phaser.Physics.Arcade.Sprite;
  private hudText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private onboardingText!: Phaser.GameObjects.Text;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private attackKey?: Phaser.Input.Keyboard.Key;

  private playerFacing = new Phaser.Math.Vector2(1, 0);
  private playerHp = PLAYER_MAX_HP;
  private bossHp = BOSS_MAX_HP;
  private lastAttackTime = -Infinity;
  private playerLastHitTime = -Infinity;
  private ending = false;
  private narrative?: BossNarrativeController;

  constructor() {
    super('Boss');
  }

  init(data: { playerHp?: number }): void {
    this.playerHp = Phaser.Math.Clamp(data.playerHp ?? PLAYER_MAX_HP, 1, PLAYER_MAX_HP);
  }

  create(): void {
    this.createArena();
    this.createActors();
    this.createUi();
    this.bindInput();

    this.physics.add.collider(this.player, this.boss, () => this.onBossHitPlayer());
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.narrative = new BossNarrativeController(this, this.dialogueText, this.onboardingText, () => this.ending);
    this.narrative.playIntroStory();
    this.updateHud();
  }

  update(time: number): void {
    if (this.ending) return;

    const movement = this.getMovementDirection();
    if (movement.lengthSq() > 0) {
      movement.normalize();
      this.playerFacing.copy(movement);
      this.player.setFlipX(movement.x < 0);
    }

    this.player.setVelocity(movement.x * PLAYER_SPEED, movement.y * PLAYER_SPEED);

    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey) && time - this.lastAttackTime >= ATTACK_COOLDOWN_MS) {
      this.lastAttackTime = time;
      this.playAttackAnimation();
      this.tryHitBoss();
    }

    this.updateBossAI();
    this.updateHud();
  }

  private createArena(): void {
    this.physics.world.setBounds(0, 0, 1600, 1000);
    this.cameras.main.setBounds(0, 0, 1600, 1000);
    this.add.tileSprite(800, 500, 1600, 1000, BACKGROUND_TEXTURE_KEY).setTint(0x4a3b3b).setDepth(-10);
    this.add.text(800, 48, 'Сцена 2: Сердце руин', { fontFamily: 'Arial', fontSize: '38px', color: '#ffd6a5' }).setOrigin(0.5);
  }

  private createActors(): void {
    const altar = this.physics.add.staticImage(800, 500, OBSTACLE_TEXTURE_KEY).setDisplaySize(260, 110).setTint(0x8a6666).refreshBody();
    this.player = this.physics.add.sprite(300, 780, PLAYER_TEXTURE_KEY).setDisplaySize(48, 48).setDrag(900, 900).setCollideWorldBounds(true);
    this.boss = this.physics.add
      .sprite(1200, 300, ENEMY_TEXTURE_KEY)
      .setDisplaySize(84, 84)
      .setTint(0xff8f8f)
      .setCollideWorldBounds(true);

    this.physics.add.collider(this.player, altar);
    this.physics.add.collider(this.boss, altar);
  }

  private createUi(): void {
    this.hudText = this.add.text(20, 20, '', { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff' }).setScrollFactor(0).setDepth(20);
    this.dialogueText = this.add
      .text(800, 950, 'Босс: Ты не покинешь руины живым, Ashfang!', { fontFamily: 'Arial', fontSize: '24px', color: '#ffe8a3', align: 'center' })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setScrollFactor(0);
    this.statusText = this.add.text(20, 48, 'Статус: Битва с боссом', { fontFamily: 'Arial', fontSize: '20px', color: '#7dd3fc' }).setScrollFactor(0).setDepth(20);
    this.onboardingText = this.add
      .text(1570, 20, 'Цель: Уклоняйся и атакуй SPACE, когда босс рядом.', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#93c5fd',
        align: 'right',
        wordWrap: { width: 520 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(20);

    this.events.on('resume', () => {
      if (!this.ending) this.statusText.setText('Статус: Битва с боссом');
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
    }) as { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };

    this.attackKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    keyboard.on('keydown-ESC', () => this.togglePause());
  }

  private getMovementDirection(): Phaser.Math.Vector2 {
    const x = Number(Boolean(this.cursors?.right?.isDown || this.wasdKeys?.right?.isDown)) - Number(Boolean(this.cursors?.left?.isDown || this.wasdKeys?.left?.isDown));
    const y = Number(Boolean(this.cursors?.down?.isDown || this.wasdKeys?.down?.isDown)) - Number(Boolean(this.cursors?.up?.isDown || this.wasdKeys?.up?.isDown));
    return new Phaser.Math.Vector2(x, y);
  }

  private playAttackAnimation(): void {
    const baseScaleX = this.player.scaleX;
    const baseScaleY = this.player.scaleY;
    this.player.setTintFill(0xf1fa8c);

    this.tweens.add({
      targets: this.player,
      scaleX: baseScaleX * 1.2,
      scaleY: baseScaleY * 0.88,
      yoyo: true,
      duration: 85,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.player.active) return;
        this.player.clearTint();
        this.player.setScale(baseScaleX, baseScaleY);
      },
    });

    const facingAngle = Phaser.Math.RadToDeg(this.playerFacing.angle());
    const slash = this.add.arc(this.player.x, this.player.y, ATTACK_RANGE, facingAngle - 40, facingAngle + 40, false, 0xf1fa8c, 0.42).setStrokeStyle(3, 0xffffff, 0.85).setDepth(8);
    this.tweens.add({ targets: slash, alpha: 0, scale: 1.25, duration: 110, ease: 'Quad.easeOut', onComplete: () => slash.destroy() });
  }

  private updateBossAI(): void {
    if (!this.boss.active) return;

    const chase = new Phaser.Math.Vector2(this.player.x - this.boss.x, this.player.y - this.boss.y);
    const distance = chase.length();

    if (distance > 4) {
      chase.normalize();
      this.boss.setVelocity(chase.x * BOSS_SPEED, chase.y * BOSS_SPEED);
      this.boss.setFlipX(chase.x < 0);
    } else {
      this.boss.setVelocity(0, 0);
    }

    if (distance <= BOSS_CONTACT_RANGE) this.onBossHitPlayer();
  }

  private onBossHitPlayer(): void {
    if (!this.boss.active || this.ending) return;

    const now = this.time.now;
    if (now - this.playerLastHitTime < PLAYER_HIT_COOLDOWN_MS) return;

    this.playerLastHitTime = now;
    this.sound.play(PLAYER_HIT_SFX_KEY, { volume: 0.44 });
    this.playerHp = Math.max(0, this.playerHp - BOSS_DAMAGE);
    this.player.setTintFill(0xff5f5f);
    this.time.delayedCall(110, () => this.player.clearTint());
    this.dialogueText.setText(`Босс наносит ${BOSS_DAMAGE} урона!`);

    if (this.playerHp <= 0) this.endWithFailure();
  }

  private tryHitBoss(): void {
    if (!this.boss.active || this.ending) return;

    const toBoss = new Phaser.Math.Vector2(this.boss.x - this.player.x, this.boss.y - this.player.y);
    const distance = toBoss.length();
    if (distance > ATTACK_RANGE || distance === 0) return void this.dialogueText.setText('Ты промахнулся. Босс контратакует!');

    const attackDirection = toBoss.normalize();
    const angleDiff = Phaser.Math.Angle.Wrap(this.playerFacing.angle() - attackDirection.angle());
    if (Math.abs(angleDiff) > ATTACK_ARC_HALF_ANGLE) return void this.dialogueText.setText('Ashfang не успел довернуть клинок!');

    this.sound.play(ATTACK_SFX_KEY, { volume: 0.5 });
    this.bossHp = Math.max(0, this.bossHp - ATTACK_DAMAGE);
    this.boss.setTintFill(0xffffff);
    this.time.delayedCall(90, () => this.boss.clearTint());
    this.dialogueText.setText(`Попадание! HP босса: ${this.bossHp}/${BOSS_MAX_HP}`);

    if (this.bossHp <= 0) this.endWithVictory();
  }

  private endWithVictory(): void {
    this.startEndState('Статус: Победа');
    this.sound.play(ENEMY_DOWN_SFX_KEY, { volume: 0.36 });
    this.boss.disableBody(true, true);
    this.narrative?.playVictoryEpilogue();
  }

  private endWithFailure(): void {
    this.startEndState('Статус: Поражение');
    this.dialogueText.setText('Ashfang пал от босса. Нажми R для повторной попытки.');
    this.input.keyboard?.once('keydown-R', () => this.scene.restart({ playerHp: PLAYER_MAX_HP }));
  }

  private startEndState(statusText: string): void {
    this.ending = true;
    this.statusText.setText(statusText);
    this.player.setVelocity(0, 0);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (playerBody) playerBody.enable = false;
  }

  private updateHud(): void {
    this.hudText.setText(`HP Ashfang: ${this.playerHp}/${PLAYER_MAX_HP} | HP Босса: ${this.bossHp}/${BOSS_MAX_HP}`);
  }

  private togglePause(): void {
    if (this.ending || this.scene.isActive('Pause')) return;
    this.statusText.setText('Статус: Пауза');
    this.scene.launch('Pause', { sourceScene: this.scene.key });
    this.scene.pause();
  }
}
