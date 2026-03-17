import Phaser from 'phaser';
import { BACKGROUND_TEXTURE_KEY, MAP_HEIGHT, MAP_WIDTH, PATH_LANDMARKS } from './constants';

export const createLevelArena = (scene: Phaser.Scene): void => {
  scene.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
  scene.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

  scene.add.tileSprite(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, BACKGROUND_TEXTURE_KEY).setTint(0x676767).setDepth(-10);
  scene.add.rectangle(110, 110, 180, 180, 0x4caf50, 0.15).setStrokeStyle(4, 0x7bed9f, 0.75).setDepth(-1);
  scene.add.text(30, 32, 'Старт: Руины Пепла', { fontFamily: 'Arial', fontSize: '20px', color: '#d7ffd6' }).setDepth(1);

  PATH_LANDMARKS.forEach((landmark) => {
    const beacon = scene.add.circle(landmark.x, landmark.y, 18, 0xffd166, 0.26).setDepth(-1);
    scene.add.circle(landmark.x, landmark.y, 8, 0xffef99, 0.65).setDepth(-1);
    scene.add.text(landmark.x - 68, landmark.y + 22, landmark.label, { fontFamily: 'Arial', fontSize: '14px', color: '#ffeaa7' }).setDepth(0);
    scene.tweens.add({ targets: beacon, alpha: 0.6, scale: 1.2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });
};
