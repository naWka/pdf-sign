# 02 — Архитектура и стек

## Ключевые технические ограничения (Manifest V3, 2026)
Учитывай их с самого начала, они определяют структуру:
- **Только MV3.** MV2 отключён в Chrome. Никаких persistent background pages — вместо них **event-driven service worker** (нет DOM, нельзя рассчитывать на сохранение состояния в памяти между событиями).
- **Запрещён удалённо загружаемый код.** Вся логика — внутри пакета расширения. `pdf.js`, `pdf-lib`, шрифты, любые либы — **бандлить локально**, не тянуть с CDN и не `fetch`-ить исполняемый код. Нарушение = отказ на ревью («Blue Argon»).
- **Строгий CSP** для extension pages: `eval`/`new Function` запрещены (только в sandboxed iframe при крайней нужде — нам не нужно).
- **Privacy policy обязательна**, раз мы «обрабатываем данные пользователя» (даже локально) — разместим на сайте-спутнике.
- Ревью: 2–5 раб. дней для трастового аккаунта, 7–14 для нового. Заложи буфер ~2 недели до «живого» листинга.

## Стек
- **Язык/сборка:** TypeScript + **Vite** (плагин для MV3, напр. `@crxjs/vite-plugin` или ручной конфиг). Service worker и content-скрипты — vanilla TS. UI редактора можно на лёгком React, но без React в service worker.
- **PDF рендер:** `pdf.js` (`pdfjs-dist`) → отрисовка страниц на `<canvas>`.
- **PDF правка/экспорт:** `pdf-lib` → загрузка исходных байтов, наложение подписи (embed PNG), рисование текста/дат/чекбоксов, поворот/удаление страниц, вывод новых байтов.
- **Хранилище:** `chrome.storage.local` — сохранённые подписи (base64 PNG), счётчик бесплатных действий, кэш лицензии. Файлы PDF **не** храним и не выгружаем.

## Поверхности UI
1. **Popup** (`chrome.action`) — маленький лаунчер: «Open editor», «Open current PDF», статус лицензии. Не редактор.
2. **Editor page** (`editor.html`, полноценная extension page) — основной интерфейс: canvas со страницами PDF + оверлей-слой для подписи/текста/чекбоксов. Здесь вся работа.
3. **Options page** (`options.html`) — ввод лицензионного ключа, управление сохранёнными подписями, ссылка на «купить».
4. **(Опц.) Content script / context menu** — правый клик по ссылке на PDF → «Open in Sign & Fill». Авто-детект открытого PDF держи опциональным: он тянет широкие host-разрешения.

## Поток данных (весь клиентский)
```
Пользователь выбирает PDF (drag&drop / picker / контекст-меню)
        │  (ArrayBuffer, в памяти, никуда не отправляется)
        ▼
pdf.js рендерит страницы → <canvas>
        │
Оверлей-слой (HTML/canvas поверх): пользователь ставит подпись,
текст, чекбоксы, даты. Координаты хранятся в JS-состоянии.
        │
        ▼
На экспорт: pdf-lib берёт ИСХОДНЫЕ байты + оверлеи →
embed подписи (PNG), drawText/drawRectangle, поворот/удаление стр. →
новые байты PDF
        │
        ▼
Blob → chrome.downloads (или <a download>) → файл сохраняется локально
```
Нигде в этом потоке нет сети. Это проверяемо и является продуктом.

## Подписи (три способа → PNG)
- **Draw:** canvas для рисования → export PNG.
- **Type:** ввод текста, рендер стилизованным (рукописным) шрифтом на canvas → PNG. Шрифт бандлить локально.
- **Upload:** пользователь грузит картинку подписи → нормализуем (обрезка, прозрачный фон по возможности).
- Сохранять 2–3 подписи как base64 PNG в `chrome.storage.local`.

## Разрешения (минимизируй!)
Стартовый набор — по возможности только:
- `storage` — подписи, счётчик, лицензия.
- `downloads` — сохранение результата (или обойтись `<a download>` и не просить даже это).
- `contextMenus` — если делаем правый клик по PDF-ссылке.

Избегай `<all_urls>` / широких host-permissions. Если хочется авто-детекта открытых PDF — предпочитай `activeTab` + действие пользователя, а не постоянный доступ ко всем сайтам. Каждое разрешение = предупреждение при установке и повод для отказа на ревью.

## Структура проекта (ориентир)
```
/pdf-sign-extension
  /src
    /background        # service worker (MV3): context menu, download orchestration
    /editor            # editor.html + логика: pdf.js render, overlay, export via pdf-lib
      /overlay         # компоненты: signature, text field, checkbox, date
      /pdf             # обёртки над pdf.js и pdf-lib
    /popup             # launcher
    /options           # ввод лицензии, управление подписями
    /license           # проверка подписи токена локально (bundled public key)
    /paywall           # счётчик бесплатных действий, гейт
    /lib               # bundled pdfjs-dist, pdf-lib, шрифты
    /shared            # storage helpers, типы
  manifest.json        # MV3
  vite.config.ts
/pdf-sign-site         # Next.js сайт-спутник (см. ниже)
/supabase              # Edge Functions + SQL миграции (см. 03-monetization.md)
```

## manifest.json (каркас)
```jsonc
{
  "manifest_version": 3,
  "name": "Sign PDF — Fill & Sign PDF Free, No Upload",
  "version": "0.1.0",
  "action": { "default_popup": "popup.html" },
  "background": { "service_worker": "background.js", "type": "module" },
  "options_page": "options.html",
  "permissions": ["storage", "downloads", "contextMenus"],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
  // host_permissions: НЕ добавлять без крайней нужды
}
```

## Сайт-спутник (Next.js на Vercel)
Минимальный, но обязателен (там живут checkout и privacy policy):
- **Лендинг** — клин, скриншоты/гифка, кнопка «Add to Chrome» (→ листинг) и «Buy lifetime» (→ Paddle checkout).
- **Privacy policy** — короткая, честная: «files are processed locally in your browser and never uploaded». Ссылку кладём в листинг стора.
- **«How to»-страницы** (Фаза 2) — под запросы `how to sign a pdf`, `sign pdf without adobe` и т.п.; каждая ведёт на установку.
- Хостит Paddle-checkout и (опц.) Supabase Edge Function-эндпоинты для лицензий.

Технически: App Router, статические страницы, деплой на Vercel. Аналитика — приватная/легковесная (напр. Plausible), без тяжёлого трекинга.
