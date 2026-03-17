# AGENTS.md

Этот файл нужен как быстрый onboarding для любого агента/разработчика, который заходит в репозиторий **Ashfang**.

## Что это за проект

**Ashfang: Echoes of the Fallen Wild** — MVP 2D браузерной игры на **TypeScript + Phaser 3 + Vite**.

Текущий фокус MVP:
- базовый игровой цикл «меню → уровень → босс → возврат/продолжение»;
- перемещение, бой, HUD, пауза;
- интеграция и использование базовых ассетов;
- качество и готовность к демонстрации MVP.

## Быстрая навигация по репозиторию

- `src/main.ts` — точка входа клиента.
- `src/game/config.ts` — Phaser-конфиг и порядок подключения сцен.
- `src/scenes/BootScene.ts` — preload ассетов и переход в меню.
- `src/scenes/MenuScene.ts` — стартовый экран и управление началом игры.
- `src/scenes/LevelScene.ts` — основной MVP-уровень.
- `src/scenes/BossScene.ts` — бой с боссом.
- `src/scenes/PauseScene.ts` — overlay-сцена паузы.
- `src/style.css` — базовые стили контейнера.
- `docs/README.md` — карта документации.
- `docs/game-design/game-concept.md` — концепция игры.
- `docs/project-management/mvp-scope-success-criteria.md` — рамки и критерии успеха MVP.
- `docs/project-management/mvp-roadmap-tasks.md` — декомпозиция задач к выпуску MVP.

## Команды для работы

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

Минимальный quality gate перед PR:
1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`

## Как ориентироваться в игровом флоу

1. Инициализация приложения в `src/main.ts`.
2. Порядок сцен задаётся в `src/game/config.ts`.
3. `BootScene` грузит текстуры, затем переводит в `Menu`.
4. `MenuScene` запускает `Level`.
5. `LevelScene` держит основной gameplay (цели, враги, HUD, переходы).
6. `BossScene` завершает боевой цикл MVP.
7. `PauseScene` используется как отдельный слой поверх активной gameplay-сцены.

## Правила внесения изменений

- Для новых механик сначала обновлять/добавлять документацию в `docs/` (если меняется поведение или scope).
- Новые ассеты складывать в структуру `public/assets/*` и использовать явные ключи загрузки в `BootScene`.
- Если добавляется новая сцена:
  1) создать файл в `src/scenes/`;
  2) подключить сцену в `src/game/config.ts`;
  3) описать назначение сцены в этом файле (`AGENTS.md`) и при необходимости в `README.md`.
- Не смешивать крупные рефакторинги и gameplay-фичи в одном PR.

## Что делать агенту перед завершением задачи

- Проверить, что проект собирается (`npm run build`).
- Проверить статический контроль (`npm run typecheck`, `npm run lint`).
- Кратко описать изменения в PR: что сделано, зачем, как проверить.

## Полезный контекст по статусу проекта

- Проект находится в треке подготовки MVP.
- В `docs/project-management/` уже зафиксированы scope, критерии успеха и roadmap задач.
- Приоритет на текущем этапе: удобная разработка, прозрачная структура и предсказуемый процесс релиза.
