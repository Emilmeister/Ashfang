# Ashfang Client

Стартовый репозиторий игрового клиента на **TypeScript + Phaser 3 + Vite**.

## Запуск проекта

```bash
npm install
npm run dev
```

## Доступные команды

- `npm run dev` — запуск dev-сервера;
- `npm run build` — проверка TypeScript + production-сборка;
- `npm run preview` — локальный preview production-сборки;
- `npm run lint` — запуск ESLint.

## Структура

- `src/game/config.ts` — конфигурация Phaser;
- `src/scenes/BootScene.ts` — базовая загрузочная сцена;
- `src/scenes/MenuScene.ts` — шаблон главного меню;
- `src/scenes/LevelScene.ts` — шаблон игрового уровня.
