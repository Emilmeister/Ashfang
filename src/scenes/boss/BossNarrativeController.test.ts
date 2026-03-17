import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: {
      DegToRad: (degrees: number) => (degrees * Math.PI) / 180,
    },
  },
}));

import { BossNarrativeController } from './BossNarrativeController';

describe('BossNarrativeController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('plays intro story lines via delayed calls', () => {
    const callbacks: Array<() => void> = [];
    const dialogueText = {
      setText: vi.fn(),
    };

    const scene = {
      time: {
        delayedCall: vi.fn((_: number, callback: () => void) => callbacks.push(callback)),
      },
    };

    const controller = new BossNarrativeController(scene as never, dialogueText as never, {} as never, () => false);
    controller.playIntroStory();

    expect(scene.time.delayedCall).toHaveBeenCalledTimes(2);

    callbacks[0]();
    callbacks[1]();

    expect(dialogueText.setText).toHaveBeenNthCalledWith(
      1,
      'Астрелия: Это Страж Сердца. Он хранит память о падшем мире.',
    );
    expect(dialogueText.setText).toHaveBeenNthCalledWith(
      2,
      'Ashfang: Я освобожу его и узнаю, кто расколол Белое Сердце.',
    );
  });

  it('shows epilogue once and starts Menu on Enter', () => {
    const enterCallbacks: Array<() => void> = [];
    const onboardingText = { setVisible: vi.fn() };

    const rectObj = { setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() };
    const titleObj = {
      setOrigin: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };

    const bodyObj = {
      setOrigin: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };

    const scene = {
      add: {
        rectangle: vi.fn(() => rectObj),
        text: vi
          .fn()
          .mockReturnValueOnce(titleObj)
          .mockReturnValueOnce(bodyObj),
      },
      tweens: { add: vi.fn() },
      input: {
        keyboard: {
          once: vi.fn((_: string, cb: () => void) => enterCallbacks.push(cb)),
        },
      },
      sound: { play: vi.fn() },
      scene: { start: vi.fn() },
    };

    const controller = new BossNarrativeController(scene as never, {} as never, onboardingText as never, () => false);

    controller.playVictoryEpilogue();
    controller.playVictoryEpilogue();

    expect(onboardingText.setVisible).toHaveBeenCalledWith(false);
    expect(scene.add.rectangle).toHaveBeenCalledTimes(1);
    expect(scene.add.text).toHaveBeenCalledTimes(2);
    expect(scene.tweens.add).toHaveBeenCalledTimes(1);
    expect(scene.input.keyboard.once).toHaveBeenCalledTimes(1);

    enterCallbacks[0]();

    expect(scene.sound.play).toHaveBeenCalledWith('sfx-ui-confirm', { volume: 0.45 });
    expect(scene.scene.start).toHaveBeenCalledWith('Menu');
  });
});
