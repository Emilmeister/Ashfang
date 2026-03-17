# Ассеты MVP

- Статус: active
- Владелец: @devops-agent
- Последняя проверка: 2026-03-17
- Следующий срок ревизии: 2026-04-17
- Связанные артефакты: [DEV-15](https://linear.app), [DEV-25](https://linear.app)

## Куда положить файлы

Скачанные файлы нужно положить строго по этим путям:

### Графика

- `public/assets/background/ashen-sky.png`
- `public/assets/characters/ashfang-hero.png`
- `public/assets/enemies/wild-fiend.png`
- `public/assets/objects/ruin-crate.png`

### Звук (ключевые действия)

- `public/assets/audio/combat/player-attack.wav` — звук атаки игрока.
- `public/assets/audio/combat/player-hit.wav` — звук получения урона игроком.
- `public/assets/audio/combat/enemy-down.wav` — звук убийства врага/босса.
- `public/assets/audio/ui/ui-confirm.wav` — подтверждение действия в UI (старт/переход).

## Откуда скачать

### Графика

- Фон (`ashen-sky.png`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/skies/deepblue.png
- Игрок (`ashfang-hero.png`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/phaser-dude.png
- Враг (`wild-fiend.png`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/ufo.png
- Объект (`ruin-crate.png`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/crate.png

### Звук

- Атака игрока (`player-attack.wav`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/shot1.wav
- Попадание по игроку (`player-hit.wav`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/key.wav
- Победа над врагом (`enemy-down.wav`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/alien_death1.wav
- UI подтверждение (`ui-confirm.wav`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/numkey.wav

## Быстрый вариант (через curl)

```bash
mkdir -p public/assets/background public/assets/characters public/assets/enemies public/assets/objects
mkdir -p public/assets/audio/combat public/assets/audio/ui

curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/skies/deepblue.png -o public/assets/background/ashen-sky.png
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/phaser-dude.png -o public/assets/characters/ashfang-hero.png
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/ufo.png -o public/assets/enemies/wild-fiend.png
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/crate.png -o public/assets/objects/ruin-crate.png

curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/shot1.wav -o public/assets/audio/combat/player-attack.wav
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/key.wav -o public/assets/audio/combat/player-hit.wav
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/alien_death1.wav -o public/assets/audio/combat/enemy-down.wav
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/numkey.wav -o public/assets/audio/ui/ui-confirm.wav
```

## Примечание

Бинарные ассеты (png/wav/mp3) намеренно не добавляются в этот коммит: вы добавляете их отдельным коммитом после скачивания.
