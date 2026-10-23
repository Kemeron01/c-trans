# C-Trans — frontend

Админ-панель (`/admin`) и клиентская платформа (`/`) C-Trans.
Основа — шаблон [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) (MIT, см. `LICENSE`):
Vite + React + TypeScript + shadcn/ui + TanStack Router/Query/Table.
Требования к системе — `../docs/requirements.md`.

## Запуск

```sh
pnpm install
pnpm dev        # http://localhost:5173, API замокан через MSW
pnpm lint
pnpm build
pnpm test       # vitest в браузере (нужен Chromium для Playwright)
```

## Переменные окружения

Скопируйте `.env.example` в `.env.local`.

| Переменная       | По умолчанию | Назначение                                            |
| ---------------- | ------------ | ----------------------------------------------------- |
| `VITE_API_URL`   | `/api/v1`    | Базовый URL backend (Django)                          |
| `VITE_API_MOCKS` | `true` в dev | `false` — ходить в настоящий backend вместо MSW-моков |

В production-сборку моки не попадают.

## Демо-аккаунты (моки)

Пароль у всех — `demo1234`; на странице входа в dev они показаны списком.

| Логин             | Роль        | Склад                 |
| ----------------- | ----------- | --------------------- |
| `superadmin`      | super_admin | —                     |
| `admin.china`     | admin       | Гуанчжоу (зарубежный) |
| `worker.china`    | worker      | Гуанчжоу (зарубежный) |
| `admin.tashkent`  | admin       | Ташкент (узбекский)   |
| `worker.tashkent` | worker      | Ташкент (узбекский)   |

Клиенты (вход по телефону, SMS-код в моках — `123456`): `+998901234567`, `+998937654321`, `+998971112233`; новый номер создаёт новый аккаунт.

Моковая БД сохраняется в `localStorage` и переживает перезагрузку страницы. Сбросить — кнопка «Сбросить демо-данные» на странице входа.

## Структура

- `src/api/` — всё, что связано с backend: типы (`types.ts`), axios-клиент, запросы по разделам, MSW-моки (`mocks/`). Когда появится OpenAPI, типы заменяются сгенерированными.
- `src/lib/permissions.ts` — матрица доступа: роль + вид склада → разделы админки.
- `src/lib/route-guards.ts` — проверки в `beforeLoad` маршрутов.
- `src/routes/` — файловый роутинг TanStack Router (`routeTree.gen.ts` генерируется автоматически).
- `src/components/layout/data/staff-nav.ts` — пункты сайдбара админки.
- `src/locales/` — переводы ru (основной) / uz / en; ключи проверяются типами.
- `src/features/` — экраны.
