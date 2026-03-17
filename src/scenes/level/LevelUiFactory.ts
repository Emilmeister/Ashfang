import Phaser from 'phaser';

type UiElements = {
  hudText: Phaser.GameObjects.Text;
  objectiveText: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
  onboardingText: Phaser.GameObjects.Text;
  dialogueText: Phaser.GameObjects.Text;
};

export const createLevelUiElements = (scene: Phaser.Scene): UiElements => {
  const hudText = scene.add.text(22, 20, '', { fontFamily: 'Arial', fontSize: '20px', color: '#f1f5f9' }).setScrollFactor(0).setDepth(20);
  const objectiveText = scene.add
    .text(22, 48, 'Цель: Очисти руины и дойди до портала', { fontFamily: 'Arial', fontSize: '20px', color: '#facc15' })
    .setScrollFactor(0)
    .setDepth(20);
  const statusText = scene.add.text(22, 76, 'Статус: В бою | TTF: в процессе', { fontFamily: 'Arial', fontSize: '20px', color: '#7dd3fc' }).setScrollFactor(0).setDepth(20);
  const onboardingText = scene.add
    .text(scene.scale.width - 24, 22, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#93c5fd',
      align: 'right',
      wordWrap: { width: Math.min(scene.scale.width * 0.44, 460) },
    })
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setDepth(22);
  const dialogueText = scene.add
    .text(scene.scale.width / 2, scene.scale.height - 70, '', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffe8a3',
      align: 'center',
      wordWrap: { width: Math.min(scene.scale.width - 80, 900) },
    })
    .setOrigin(0.5, 1)
    .setScrollFactor(0)
    .setDepth(20);

  return { hudText, objectiveText, statusText, onboardingText, dialogueText };
};
