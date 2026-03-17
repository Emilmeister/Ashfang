import Phaser from 'phaser';
import { DASH_COOLDOWN_MS, ONBOARDING_HINTS, PLAYER_MAX_HP } from './constants';
import type { AttackPhase } from './types';

type UiElements = {
  hudText: Phaser.GameObjects.Text;
  objectiveText: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
  onboardingText: Phaser.GameObjects.Text;
  dialogueText: Phaser.GameObjects.Text;
};

type HudState = {
  playerHp: number;
  aliveEnemies: number;
  portalUnlocked: boolean;
  attackPhase: AttackPhase;
  firstCombatTimeMs: number | null;
  levelStartTime: number;
  lastDashTime: number;
};

export class LevelUiController {
  private onboardingStepIndex = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly ui: UiElements) {}

  onResize(gameSize: Phaser.Structs.Size): void {
    this.ui.dialogueText.setPosition(gameSize.width / 2, gameSize.height - 70);
    this.ui.dialogueText.setWordWrapWidth(Math.min(gameSize.width - 80, 900));
    this.ui.onboardingText.setPosition(gameSize.width - 24, 22);
    this.ui.onboardingText.setWordWrapWidth(Math.min(gameSize.width * 0.44, 460));
  }

  playIntroDialogue(): void {
    this.ui.dialogueText.setText('Астрелия: Ashfang, руины шепчут голосами павших и зовут к Сердцу.');
    this.scene.time.delayedCall(3200, () => {
      this.ui.dialogueText.setText('Ashfang: Я найду осколок и верну надежду племени Белого Пламени.');
    });
    this.scene.time.delayedCall(6500, () => {
      this.ui.dialogueText.setText('Очисти руины от скверны. Портал к Сердцу откроется после победы.');
    });
  }

  scheduleOnboardingHints(hasMoved: () => boolean, hasAttacked: () => boolean): void {
    this.showOnboarding(ONBOARDING_HINTS[0]);

    this.scene.time.delayedCall(7000, () => {
      if (!hasMoved()) {
        this.showOnboarding('Подсказка: зажми W/A/S/D для рывка по руинам.');
      }
    });

    this.scene.time.delayedCall(13000, () => {
      if (!hasAttacked()) {
        this.showOnboarding('Подсказка: атака проходит фазы startup → impact → recover. Лови момент impact.');
      }
    });
  }

  advanceOnboarding(stepIndex: number): void {
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

  setDialogue(text: string): void {
    this.ui.dialogueText.setText(text);
  }

  setStatus(text: string): void {
    this.ui.statusText.setText(text);
  }

  setObjective(text: string): void {
    this.ui.objectiveText.setText(text);
  }

  updateHud(state: HudState): void {
    const elapsedSeconds = Math.max(0, Math.round((this.scene.time.now - state.levelStartTime) / 1000));
    const dashRemainingMs = Math.max(0, DASH_COOLDOWN_MS - (this.scene.time.now - state.lastDashTime));
    const dashLabel = dashRemainingMs > 0 ? `${(dashRemainingMs / 1000).toFixed(1)}с` : 'готов';

    this.ui.hudText.setText(
      `HP: ${state.playerHp}/${PLAYER_MAX_HP} | Враги: ${state.aliveEnemies} | Рывок: ${dashLabel} | Атака: ${state.attackPhase} | Время: ${elapsedSeconds}с | FPS: ${Math.round(this.scene.game.loop.actualFps)}`,
    );

    if (!state.portalUnlocked) {
      this.ui.objectiveText.setText(`Цель: Уничтожь врагов (${state.aliveEnemies}) и войди в портал`);
    }

    const ttfText = state.firstCombatTimeMs === null ? 'в процессе' : `${(state.firstCombatTimeMs / 1000).toFixed(1)}с`;
    const statusLabel = state.portalUnlocked ? 'Путь к боссу открыт' : 'В бою';
    this.ui.statusText.setText(`Статус: ${statusLabel} | TTF: ${ttfText}`);
  }

  private showOnboarding(text: string): void {
    this.ui.onboardingText.setAlpha(1);
    this.ui.onboardingText.setText(text);
    this.scene.tweens.killTweensOf(this.ui.onboardingText);
    this.scene.tweens.add({
      targets: this.ui.onboardingText,
      alpha: 0.72,
      duration: 380,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
  }
}
