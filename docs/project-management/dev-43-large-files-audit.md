# DEV-43 — Аудит больших файлов и распил

- Статус: active
- Владелец: @devops-agent
- Последняя проверка: 2026-03-17
- Следующий срок ревизии: 2026-04-17
- Связанные артефакты: DEV-43

## Контекст

В рамках задачи DEV-43 проведен аудит production-файлов на размер > 300 строк и выполнен распил крупных сцен на модули.

## Что было до

По результатам `wc -l`:
- `src/scenes/LevelScene.ts` — 818 строк.
- `src/scenes/BossScene.ts` — 441 строка.

## Что сделано

### 1) Распилен `LevelScene`

Создана модульная структура:
- `src/scenes/level/constants.ts`
- `src/scenes/level/types.ts`
- `src/scenes/level/LevelUiController.ts`
- `src/scenes/level/LevelCombatController.ts`
- `src/scenes/LevelScene.ts` (оставлен orchestration-слой)

Результат:
- Основной файл сцены сокращен до orchestration-ответственности.
- UI-логика, onboarding и HUD вынесены отдельно.
- Боевая логика, враги, атаки, рывок, downtime-pressure вынесены отдельно.

### 2) Распилен `BossScene`

Создана модульная структура:
- `src/scenes/boss/constants.ts`
- `src/scenes/boss/BossNarrativeController.ts`
- `src/scenes/BossScene.ts` (orchestration + core combat loop)

Результат:
- Нарратив и эпилог вынесены из основного файла сцены.
- Константы вынесены в отдельный модуль.

## Актуальный статус после распила

Целевые крупные файлы (>300 строк) устранены.

## Правило для предотвращения повторения

Добавлен документ `docs/CODEBASE_RULES.md` с обязательным ограничением:
- production-файлы должны быть меньше 300 строк кода;
- при 250+ строках заранее выносить логику в отдельные модули.

## Как проверять

1. Проверить размеры файлов (`wc -l`) в `src/scenes/*`.
2. Прогнать quality gate:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
