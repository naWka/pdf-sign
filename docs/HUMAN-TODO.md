# HUMAN-TODO — что делаешь ты, а не агент

Всё здесь агент выполнить не может (или не должен): создание аккаунтов, ввод платёжных/личных данных, бизнес-решения, прохождение верификаций. Агент ведёт этот список и дополняет его по ходу; ты — закрываешь пункты.

**Правило безопасности:** секреты (API-ключи, приватный ключ подписи, service_role) вставляй только в `.env` и в дашборды сервисов. Никогда не пиши их в код расширения, в бандл, в репозиторий и в чат.

---

## Порядок (важно — начни с длинного «хвоста»)

### 🔴 Сделать СЕЙЧАС (долгая верификация — блокирует монетизацию)
**1. Paddle vendor account**
- Зарегистрируйся как продавец на Paddle. **Верификация бизнеса/личности может занять несколько дней** — поэтому запускай первым.
- После аппрува создай: product «Sign & Fill PDF — Lifetime» + one-time **price** (валюта, цена — см. решения ниже) → запиши **price ID**.
- Возьми: **API key**, **client-side token** (для checkout), позже — **webhook secret** (после шага 6).
- Разблокирует: Milestone 6 (лицензии), Milestone 7 (checkout).

### 🟠 Сделать в ближайшие дни (быстро, но нужно рано)
**2. Supabase проект**
- Создай проект. Скопируй: **Project URL**, **anon key**, **service_role key** (последний — только для сервера/Edge Functions, во фронт не давать).
- Разблокирует: Milestone 6.

**3. Пара ключей подписи (Ed25519)**
- Сгенерируй локально (пример):
  ```bash
  openssl genpkey -algorithm ed25519 -out private.pem
  openssl pkey -in private.pem -pubout -out public.pem
  ```
- **Приватный ключ** → положи в **Supabase Vault** (его агент бандлить НЕ должен).
- **Публичный ключ** → отдай агенту, он вложит его в бандл расширения для локальной проверки лицензии.
- Разблокирует: Milestone 6 (офлайн-валидация, подход A).

**4. Vercel аккаунт/проект**
- Подключи репозиторий сайта-спутника к Vercel (деплой сделает агент, но проект/доступ — на тебе).
- Разблокирует: Milestone 7.

### 🟡 Сделать до публикации (можно чуть позже)
**5. Chrome Web Store developer account**
- Разовый взнос **~$5**, Google-аккаунт, верификация личности. Для нового аккаунта ревью первого расширения дольше (**7–14 дней**) — лучше завести заранее.
- Разблокирует: Milestone 8 (загрузка в стор — **загружаешь ты**, не агент).

**6. Настроить webhook Paddle → Supabase**
- Агент даст тебе URL Edge Function. Вставь его в настройки webhook у Paddle, скопируй **webhook secret** обратно агенту (в `.env`).
- Разблокирует: полный цикл покупки в Milestone 6.

---

## Бизнес-решения (только ты)
- [ ] **Цена lifetime** (и стартовая скидка, если делаешь). Без этого не создать price в Paddle.
- [ ] **Лимит бесплатных действий** — подтвердить 4 или 5.
- [ ] **Финальное название** расширения из вариантов в `pdf-sign-aso-listing.md` §2.
- [ ] Текст **privacy policy** одобрить (агент даст черновик; смысл — «файлы обрабатываются локально в браузере и не загружаются»).

---

## Ручные «стены», которые появятся по ходу
- [ ] Верификация продавца в **Paddle** (возможны документы) — самый долгий пункт.
- [ ] Капчи/подтверждения при регистрациях — проходишь сам.
- [ ] Отправка расширения на **ревью Chrome Web Store** (загрузка собранного пакета).
- [ ] Privacy policy должна быть **живой по URL до** отправки в стор.

---

## Что и куда отдать агенту (шпаргалка по `.env`)
| Значение | Куда | Откуда |
|---|---|---|
| `PADDLE_API_KEY` | server / Edge Function | Paddle → Developer |
| `PADDLE_CLIENT_TOKEN` | сайт (checkout) | Paddle |
| `PADDLE_WEBHOOK_SECRET` | Edge Function | Paddle (шаг 6) |
| `PADDLE_PRICE_ID` | сайт / расширение | Paddle product |
| `SUPABASE_URL` | все | Supabase settings |
| `SUPABASE_ANON_KEY` | фронт | Supabase settings |
| `SUPABASE_SERVICE_ROLE_KEY` | **только** Edge Function | Supabase settings |
| публичный ключ подписи | бандл расширения | шаг 3 (`public.pem`) |
| приватный ключ подписи | **только** Supabase Vault | шаг 3 (`private.pem`) |

Всё, что помечено «только сервер/Vault», во фронт и в бандл расширения не попадает — иначе это дыра и повод для отказа на ревью.

---

## Быстрый чек «можно публиковаться?»
- [ ] Тестовая покупка в Paddle sandbox прошла end-to-end и разблокировала расширение (в т.ч. офлайн).
- [ ] Privacy policy живёт по URL и указана в листинге.
- [ ] Разрешений в манифесте — минимум; удалённого кода нет.
- [ ] 5 скриншотов, иконка, тексты листинга готовы.
- [ ] Chrome dev account верифицирован.

---

## Статус сборки (ведёт агент) — что уже готово в коде

Код всех 8 milestones написан. Структура репозитория:
- `pdf-sign-extension/` — расширение MV3 (Vite + TS, pdf.js + pdf-lib в бандле).
- `pdf-sign-site/` — сайт-спутник (Next.js: лендинг, `/pricing`, `/privacy`, `/success`).
- `supabase/` — миграция `licenses` + 3 Edge Functions (webhook, get-license, license-status).
- `store-assets/` — тексты листинга + 5 HTML-шаблонов скриншотов (1280×800).

### Ровно 4 места, куда ты подставляешь значения (плейсхолдеры помечены в коде)

| Что | Файл | Откуда взять |
|---|---|---|
| **Публичный ключ подписи** (raw 32 байта, base64) | `pdf-sign-extension/src/license/public-key.ts` → `LICENSE_PUBLIC_KEY_B64` | шаг 3 (`public.pem`), команда в `supabase/README.md` |
| **URL сайта / checkout / license-status** | `pdf-sign-extension/.env` (из `.env.example`) | твой домен на Vercel |
| **Paddle client token + price id + env**, **Supabase functions URL**, **цена для показа** | `pdf-sign-site/.env.local` (из `.env.example`) | Paddle / Supabase / бизнес-решение |
| **Серверные секреты** (service_role, webhook secret, приватный ключ PKCS8 base64) | `supabase/.env` (из `.env.example`), через `supabase secrets set` | Supabase / Paddle / шаг 3 |

### Бизнес-решения, зашитые с дефолтами (поменяй при желании)
- Лимит бесплатных экспортов: `FREE_EXPORT_LIMIT = 5` в `pdf-sign-extension/src/shared/constants.ts` (подтверди 4 или 5).
- Отображаемая цена: `NEXT_PUBLIC_PRICE_DISPLAY` в `pdf-sign-site/.env.local` (реальная сумма — из Paddle price).
- Финальное название расширения: выбрано `Sign PDF — Fill & Sign PDF Free, No Upload` в `manifest.config.ts` (альтернативы — в `store-assets/listing.md`).

### Проверки, которые агент оставил под тебя (нужен терминал/аккаунты)
- Прогнать `cd pdf-sign-extension && npm install && npm run build && npm run audit:remote`.
- Прогнать `cd pdf-sign-site && npm install && npm run build`.
- Задеплоить Supabase-функции и сайт, связать Paddle webhook (шаг 6 выше).
- Загрузить `dist/` в Chrome (Load unpacked) и проверить в Network, что байты PDF никуда не уходят.
