# C-Trans Admin

Админ-панель (Vue 3 + Vite + Vue Router + Vuex + Bootstrap).

## Требования

- Node.js **20.19+** или **22.12+** (требование Vite 7). Проверить: `node -v`
- npm 10+

## Запуск

```sh
# 1. Установить зависимости
npm install

# 2. (необязательно) настроить адреса API
cp .env.example .env.local
#    и при необходимости поменять VITE_API_URL / VITE_MOCK_API_URL

# 3. Запустить dev-сервер с hot-reload
npm run dev
```

Откройте адрес из консоли (обычно http://localhost:5173) и войдите под учётной записью администратора.
Без входа все страницы панели перенаправляют на страницу логина.

## Сборка для продакшена

```sh
npm run build     # результат в dist/
npm run preview   # локальный просмотр собранной версии
```

Файл `public/_redirects` нужен для Netlify — чтобы прямые ссылки (`/lids`, `/users` …) не давали 404.

## Переменные окружения

| Переменная          | По умолчанию                       | Для чего                                   |
|---------------------|------------------------------------|--------------------------------------------|
| `VITE_API_URL`      | `http://89.169.2.238:8002/api/v1`  | Основной backend: логин, лиды, заказы      |
| `VITE_MOCK_API_URL` | `http://localhost:3000`            | Mock-сервер для ещё не подключённых страниц |

## Mock-сервер (Adminlar, Foydalanuvchilar, Sharhlar)

Эти страницы пока работают не с реальным backend, а с [json-server](https://github.com/typicode/json-server).
Создайте `db.json` с коллекциями `users` и `orders` и запустите в отдельном терминале:

```sh
npx json-server db.json --port 3000
```

Без него эти страницы просто будут пустыми.

## Структура

- `src/api/index.js` — общий axios-клиент: базовый URL, токен в заголовке, выход при 401
- `src/router/index.js` — маршруты (ленивая загрузка, заголовки страниц в `meta.title`, проверка авторизации)
- `src/pages/*` — страницы, `src/components/*` — Sidebar, Navbar, модалки
