import Phaser from 'phaser';
import { EPILOGUE_BODY, UI_CONFIRM_SFX_KEY } from './constants';

export class BossNarrativeController {
  private epilogueShown = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly dialogueText: Phaser.GameObjects.Text,
    private readonly onboardingText: Phaser.GameObjects.Text,
    private readonly isEnding: () => boolean,
  ) {}

  playIntroStory(): void {
    this.scene.time.delayedCall(1800, () => {
      if (!this.isEnding()) {
        this.dialogueText.setText('Астрелия: Это Страж Сердца. Он хранит память о падшем мире.');
      }
    });

    this.scene.time.delayedCall(5200, () => {
      if (!this.isEnding()) {
        this.dialogueText.setText('Ashfang: Я освобожу его и узнаю, кто расколол Белое Сердце.');
      }
    });
  }

  playVictoryEpilogue(): void {
    if (this.epilogueShown) {
      return;
    }

    this.epilogueShown = true;
    this.onboardingText.setVisible(false);

    const overlay = this.scene.add.rectangle(800, 500, 1600, 1000, 0x05060f, 0.82).setScrollFactor(0).setDepth(30);
    const title = this.scene.add
      .text(800, 270, 'Глава завершена: Эхо руин', {
        fontFamily: 'Arial',
        fontSize: '52px',
        color: '#ffe8a3',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31);

    const body = this.scene.add
      .text(800, 460, EPILOGUE_BODY, {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#e2e8f0',
        align: 'center',
        wordWrap: { width: 1180 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31);

    this.scene.tweens.add({
      targets: [overlay, title, body],
      alpha: { from: 0, to: 1 },
      duration: 550,
      ease: 'Sine.easeOut',
    });

    this.scene.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.sound.play(UI_CONFIRM_SFX_KEY, { volume: 0.45 });
      this.scene.scene.start('Menu');
    });
  }
}
