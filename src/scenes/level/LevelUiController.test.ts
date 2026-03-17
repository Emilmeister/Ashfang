import { describe, expect, it, vi } from 'vitest';
import { LevelUiController } from './LevelUiController';

vi.mock('phaser', () => ({
  default: {
    Math: {
      DegToRad: (degrees: number) => (degrees * Math.PI) / 180,
    },
  },
}));

type FakeText = {
  setText: ReturnType<typeof vi.fn>;
  setPosition: ReturnType<typeof vi.fn>;
  setWordWrapWidth: ReturnType<typeof vi.fn>;
  setAlpha: ReturnType<typeof vi.fn>;
};

const createText = (): FakeText => ({
  setText: vi.fn(),
  setPosition: vi.fn(),
  setWordWrapWidth: vi.fn(),
  setAlpha: vi.fn(),
});

const createController = () => {
  const callbacks: Array<() => void> = [];

  const scene = {
    time: {
      now: 10_000,
      delayedCall: vi.fn((_: number, callback: () => void) => {
        callbacks.push(callback);
      }),
    },
    tweens: {
      killTweensOf: vi.fn(),
      add: vi.fn(),
    },
    game: {
      loop: {
        actualFps: 58.8,
      },
    },
  } as const;

  const ui = {
    hudText: createText(),
    objectiveText: createText(),
    statusText: createText(),
    onboardingText: createText(),
    dialogueText: createText(),
  };

  const controller = new LevelUiController(scene as never, ui as never);
  return { controller, scene, ui, callbacks };
};

describe('LevelUiController', () => {
  it('updates HUD values with dash cooldown and combat status', () => {
    const { controller, ui } = createController();

    controller.updateHud({
      playerHp: 120,
      aliveEnemies: 4,
      portalUnlocked: false,
      attackPhase: 'impact',
      firstCombatTimeMs: 1800,
      levelStartTime: 2_000,
      lastDashTime: 9_700,
      spiritEnergy: 66,
      strategyHint: 'Безопасно: Q (дальний удар)',
      sessionKills: 1,
      progressionGoal: 2,
      activeModifiers: ['Эхо-волна'],
    });

    expect(ui.hudText.setText).toHaveBeenCalledWith(expect.stringContaining('HP: 120/180'));
    expect(ui.hudText.setText).toHaveBeenCalledWith(expect.stringContaining('Рывок: 1.1с'));
    expect(ui.hudText.setText).toHaveBeenCalledWith(expect.stringContaining('Прогресс: 1/2'));
    expect(ui.objectiveText.setText).toHaveBeenCalledWith('Цель: Уничтожь врагов (4) и войди в портал');
    expect(ui.statusText.setText).toHaveBeenCalledWith('Статус: В бою | TTF: 1.8с | Безопасно: Q (дальний удар)');
  });

  it('advances onboarding and avoids duplicate hint replay', () => {
    const { controller, scene, ui } = createController();

    controller.advanceOnboarding(2);
    controller.advanceOnboarding(2);

    expect(ui.onboardingText.setText).toHaveBeenCalledTimes(1);
    expect(ui.onboardingText.setText).toHaveBeenCalledWith('Теперь протестируй рывок: SHIFT, затем добей врагов.');
    expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(ui.onboardingText);
    expect(scene.tweens.add).toHaveBeenCalledTimes(1);
  });

  it('shows reminder hints when user has not moved or attacked', () => {
    const { controller, callbacks, ui } = createController();

    controller.scheduleOnboardingHints(
      () => false,
      () => false,
    );

    callbacks.forEach((callback) => callback());

    const renderedHints = (ui.onboardingText.setText.mock.calls as [string][]).map(([value]) => value);
    expect(renderedHints).toContain('Обучение: Двигайся WASD / стрелками. Управление не блокируется.');
    expect(renderedHints).toContain('Подсказка: зажми W/A/S/D для рывка по руинам.');
    expect(renderedHints).toContain('Подсказка: атака проходит фазы startup → impact → recover. Лови момент impact.');
  });
});
