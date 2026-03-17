import Phaser from 'phaser';
import { playtestTelemetry } from '../telemetry/playtestTelemetry';

type PauseSceneData = {
  sourceScene: string;
};

export class PauseScene extends Phaser.Scene {
  private sourceScene?: string;

  constructor() {
    super('Pause');
  }

  init(data: PauseSceneData): void {
    this.sourceScene = data.sourceScene;
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.68).setScrollFactor(0);

    this.add
      .text(width / 2, height / 2 - 72, 'Пауза', {
        fontFamily: 'Arial',
        fontSize: '56px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'ESC / R — продолжить\nM — выйти в меню', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#e2e8f0',
        align: 'center',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ESC', () => this.resumeGameplay());
    this.input.keyboard?.once('keydown-R', () => this.resumeGameplay());
    this.input.keyboard?.once('keydown-M', () => this.goToMenu());
  }

  private resumeGameplay(): void {
    if (this.sourceScene) {
      this.scene.resume(this.sourceScene);
    }
    this.scene.stop();
  }

  private goToMenu(): void {
    playtestTelemetry.recordMenuExit();
    playtestTelemetry.finishRun('abandoned');
    if (this.sourceScene) {
      this.scene.stop(this.sourceScene);
    }
    this.scene.start('Menu');
  }
}
