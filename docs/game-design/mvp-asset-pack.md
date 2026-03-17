# Ассеты MVP

- Статус: active
- Владелец: @devops-agent
- Последняя проверка: 2026-03-16
- Следующий срок ревизии: 2026-04-16
- Связанные артефакты: [DEV-25](https://linear.app)

## Куда положить файлы

Скачанные файлы нужно положить строго по этим путям:

- `public/assets/background/ashen-sky.png`
- `public/assets/characters/ashfang-hero.png`
- `public/assets/enemies/wild-fiend.png`
- `public/assets/objects/ruin-crate.png`

## Откуда скачать

- Фон (`ashen-sky.png`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/skies/deepblue.png
- Игрок (`ashfang-hero.png`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/phaser-dude.png
- Враг (`wild-fiend.png`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/ufo.png
- Объект (`ruin-crate.png`):
  - https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/crate.png

## Быстрый вариант (через curl)

```bash
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/skies/deepblue.png -o public/assets/background/ashen-sky.png
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/phaser-dude.png -o public/assets/characters/ashfang-hero.png
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/ufo.png -o public/assets/enemies/wild-fiend.png
curl -L https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/crate.png -o public/assets/objects/ruin-crate.png
```

## Примечание

PNG-файлы намеренно не хранятся в репозитории: их добавляете отдельным коммитом.
