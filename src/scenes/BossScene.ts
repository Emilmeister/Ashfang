import Phaser from 'phaser';

const PLAYER_TEXTURE_KEY = 'player-wolf';
const ENEMY_TEXTURE_KEY = 'enemy-fiend';
const BACKGROUND_TEXTURE_KEY = 'bg-ash-sky';
const OBSTACLE_TEXTURE_KEY = 'object-ruin-crate';

const PLAYER_SPEED = 250;
const PLAYER_MAX_HP = 140;
const PLAYER_HIT_COOLDOWN_MS = 700;
const ATTACK_COOLDOWN_MS = 380;
const ATTACK_RANGE = 82;
const ATTACK_DAMAGE = 25;
const BOSS_MAX_HP = 320;
const BOSS_DAMAGE = 19;

export class BossScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private boss!: Phaser.Physics.Arcade.Sprite;

  private playerHp = PLAYER_MAX_HP;

  private bossHp = BOSS_MAX_HP;

  private hudText!: Phaser.GameObjects.Text;

  private dialogueText!: Phaser.GameObjects.Text;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private wasdKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  private attackKey?: Phaser.Input.Keyboard.Key;

  private playerFacing = new Phaser.Math.Vector2(1, 0);

  private lastAttackTime = -Infinity;

  private playerLastHitTime = -Infinity;

  private ending = false;

  constructor() {
    super('Boss');
  }

  init(data: { playerHp?: number }): void {
    this.playerHp = Phaser.Math.Clamp(data.playerHp ?? PLAYER_MAX_HP, 1, PLAYER_MAX_HP);
  }

  create(): void {
    this.physics.world.setBounds(0, 0, 1600, 1000);
    this.cameras.main.setBounds(0, 0, 1600, 1000);

    this.add
      .tileSprite(800, 500, 1600, 1000, BACKGROUND_TEXTURE_KEY)
      .setTint(0x4a3b3b)
      .setDepth(-10);

    this.add
      .text(800, 48, 'Сцена 2: Сердце руин', {
        fontFamily: 'Arial',
        fontSize: '38px',
        color: '#ffd6a5',
      })
      .setOrigin(0.5);

    const altar = this.physics.add
      .staticImage(800, 500, OBSTACLE_TEXTURE_KEY)
      .setDisplaySize(260, 110)
      .setTint(0x8a6666)
      .refreshBody();

    this.player = this.physics.add
      .sprite(300, 780, PLAYER_TEXTURE_KEY)
      .setDisplaySize(48, 48)
      .setDrag(900, 900)
      .setCollideWorldBounds(true);

    this.boss = this.physics.add
      .sprite(1200, 300, ENEMY_TEXTURE_KEY)
      .setDisplaySize(84, 84)
      .setTint(0xff8f8f)
      .setCollideWorldBounds(true);

    this.physics.add.collider(this.player, altar);
    this.physics.add.collider(this.boss, altar);
    this.physics.add.collider(this.player, this.boss, () => this.onBossHitPlayer());

    this.hudText = this.add
      .text(20, 20, '', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.dialogueText = this.add
      .text(800, 950, 'Босс: Ты не покинешь руины живым, Ashfang!', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffe8a3',
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setScrollFactor(0);

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
    }

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.updateHud();
  }

  update(time: number): void {
    if (this.ending) {
      return;
    }

    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors?.left?.isDown || this.wasdKeys?.left?.isDown) velocityX -= 1;
    if (this.cursors?.right?.isDown || this.wasdKeys?.right?.isDown) velocityX += 1;
    if (this.cursors?.up?.isDown || this.wasdKeys?.up?.isDown) velocityY -= 1;
    if (this.cursors?.down?.isDown || this.wasdKeys?.down?.isDown) velocityY += 1;

    const movement = new Phaser.Math.Vector2(velocityX, velocityY);

    if (movement.lengthSq() > 0) {
      movement.normalize();
      this.playerFacing.copy(movement);
      this.player.setFlipX(movement.x < 0);
    }

    this.player.setVelocity(movement.x * PLAYER_SPEED, movement.y * PLAYER_SPEED);

    if (
      this.attackKey &&
      Phaser.Input.Keyboard.JustDown(this.attackKey) &&
      time - this.lastAttackTime >= ATTACK_COOLDOWN_MS
    ) {
      this.lastAttackTime = time;
      this.tryHitBoss();
    }

    this.updateBossAI();
    this.updateHud();
  }

  private updateBossAI(): void {
    if (!this.boss.active) {
      return;
    }

    const chase = new Phaser.Math.Vector2(this.player.x - this.boss.x, this.player.y - this.boss.y);
    const distance = chase.length();

    if (distance > 4) {
      chase.normalize();
      this.boss.setVelocity(chase.x * 128, chase.y * 128);
      this.boss.setFlipX(chase.x < 0);
    } else {
      this.boss.setVelocity(0, 0);
    }

    if (distance <= 80) {
      this.onBossHitPlayer();
    }
  }

  private onBossHitPlayer(): void {
    if (!this.boss.active || this.ending) {
      return;
    }

    const now = this.time.now;

    if (now - this.playerLastHitTime < PLAYER_HIT_COOLDOWN_MS) {
      return;
    }

    this.playerLastHitTime = now;
    this.playerHp = Math.max(0, this.playerHp - BOSS_DAMAGE);
    this.player.setTintFill(0xff5f5f);
    this.time.delayedCall(110, () => this.player.clearTint());
    this.dialogueText.setText(`Босс наносит ${BOSS_DAMAGE} урона!`);

    if (this.playerHp <= 0) {
      this.endWithFailure();
    }
  }

  private tryHitBoss(): void {
    if (!this.boss.active || this.ending) {
      return;
    }

    const toBoss = new Phaser.Math.Vector2(this.boss.x - this.player.x, this.boss.y - this.player.y);
    const distance = toBoss.length();

    if (distance > ATTACK_RANGE || distance === 0) {
      this.dialogueText.setText('Ты промахнулся. Босс контратакует!');
      return;
    }

    const attackDirection = toBoss.normalize();
    const angleDiff = Phaser.Math.Angle.Wrap(this.playerFacing.angle() - attackDirection.angle());

    if (Math.abs(angleDiff) > Phaser.Math.DegToRad(48)) {
      this.dialogueText.setText('Ashfang не успел довернуть клинок!');
      return;
    }

    this.bossHp = Math.max(0, this.bossHp - ATTACK_DAMAGE);
    this.boss.setTintFill(0xffffff);
    this.time.delayedCall(90, () => this.boss.clearTint());
    this.dialogueText.setText(`Попадание! HP босса: ${this.bossHp}/${BOSS_MAX_HP}`);

    if (this.bossHp <= 0) {
      this.endWithVictory();
    }
  }

  private endWithVictory(): void {
    this.ending = true;
    this.boss.disableBody(true, true);
    this.player.setVelocity(0, 0);
    this.dialogueText.setText('Победа! Сердце руин очищено. Нажми ENTER для возврата в меню.');
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Menu'));
  }

  private endWithFailure(): void {
    this.ending = true;
    this.player.setVelocity(0, 0);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (playerBody) {
      playerBody.enable = false;
    }
    this.dialogueText.setText('Ashfang пал от босса. Нажми R для повторной попытки.');
    this.input.keyboard?.once('keydown-R', () => this.scene.restart({ playerHp: PLAYER_MAX_HP }));
  }

  private updateHud(): void {
    this.hudText.setText(`HP Ashfang: ${this.playerHp}/${PLAYER_MAX_HP} | HP Босса: ${this.bossHp}/${BOSS_MAX_HP}`);
  }
}
