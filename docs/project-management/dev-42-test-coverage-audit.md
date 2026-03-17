# DEV-42 — Аудит покрытия кода тестами

## Контекст

Задача: провести аудит текущего тестового покрытия, добавить тесты для непокрытых участков и убедиться, что проверки выполняются в CI/CD.

## Что было до изменений

- В проекте не было раннера unit-тестов.
- Скрипт `npm run test` запускал только `typecheck`, без проверки runtime-поведения модулей.
- В CI job `test` также фактически выполнял только TypeScript-проверку типов.

## Что сделано

1. **Добавлен unit-test стек на Vitest**
   - Подключены `vitest` и `@vitest/coverage-v8`.
   - Добавлен `vitest.config.ts` с `jsdom` окружением и отчётами coverage.

2. **Обновлены скрипты package.json**
   - `npm run test` теперь запускает `vitest run`.
   - Добавлен `npm run test:coverage` для запуска тестов с покрытием.

3. **Покрыты тестами ранее непокрытые модули gameplay-логики**
   - `LevelUiController`:
     - рендер HUD-строки и статусов;
     - progression onboarding-хинтов;
     - delayed hints при отсутствии действий игрока.
   - `BossNarrativeController`:
     - сценарий intro-реплик;
     - сценарий victory epilogue (одноразовость, переход по ENTER).

4. **Проверка в CI/CD усилена**
   - В workflow `test` заменён шаг запуска на `npm run test:coverage`.
   - Теперь в CI запускаются именно unit-тесты и считается покрытие.

## Как проверить локально

```bash
npm install
npm run test
npm run test:coverage
npm run typecheck
npm run lint
npm run build
```

## Ожидаемый эффект

- Улучшена защита от регрессий в UI/нарративной логике сцен.
- Job `test` в CI/CD теперь валидирует runtime-поведение, а не только типы.
- Получен базовый фундамент для последующего расширения покрытия на combat/controller модули.
