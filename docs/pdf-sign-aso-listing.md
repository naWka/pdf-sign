# ASO-листинг: «Sign & Fill PDF» (локально, без аккаунта)

> Готовый к публикации листинг для Chrome Web Store, приоритизированный по реальным частотностям (US), снятым на этапе валидации. Ниже: клин, тексты (заголовок / краткое / полное описание), карта ключей, скриншоты и что из этого вытекает для MVP.

---

## 0. Клин (одно предложение на весь продукт)

**Sign & fill any PDF right in your browser. No upload. No account. Your files never leave your computer.**

Три опоры сообщения — повторяются в сторе, на сайте и в скриншотах:
1. **Приватность** — файл не уходит на сервер, работает офлайн.
2. **Ноль трения** — без регистрации, без загрузки, подпись за 10 секунд.
3. **Навсегда** — один платёж вместо подписки Adobe/Smallpdf (lifetime).

Anti-positioning (чего мы НЕ делаем): не «DocuSign для команд», не облачный документооборот, не аудит-трейл. Осознанно узкий инструмент «для себя».

---

## 1. Данные, на которых строим ASO (US, запросов/мес)

| Запрос | Объём | Куда ставим |
|---|---|---|
| sign pdf | 14 800 | заголовок (head) |
| how to sign a pdf | 9 900 | краткое описание + страницы сайта-спутника |
| sign pdf free | 9 900 | заголовок / краткое описание |
| sign pdf online | 8 100 | полное описание |
| add signature to pdf | 6 600 | полное описание |
| esign pdf | 2 900 | полное описание |
| pdf form filler | 1 900 | полное описание (ветка «заполнение») |
| fill and sign pdf | 1 300 | заголовок (вторичный) |
| fill out pdf form | 720 | полное описание |
| sign pdf without adobe | 70 | якорь клина в описании |

Принцип: заголовок и первые ~150 символов краткого описания весят в ранжировании Chrome Web Store сильнее всего — туда идут самые крупные и точно совпадающие с продуктом запросы.

---

## 2. Название расширения (title)

**Основной вариант:**
`Sign PDF — Fill & Sign PDF Free, No Upload`

Покрывает: `sign pdf` (14.8k), `fill and sign pdf` (1.3k), `sign pdf free` (9.9k) + клин «No Upload».

**Запасные:**
- `Sign PDF Free: Fill & Sign PDF Online — No Account`
- `Sign & Fill PDF — Private, No Upload, No Sign-up`

Выбирай по читаемости; главное — `Sign PDF` в начале, не длиннее ~45–50 видимых символов до отсечки.

---

## 3. Краткое описание (summary, ~132 символа)

`Sign and fill any PDF in your browser. No upload, no account — your files never leave your computer. Free, private, offline.`

Содержит: sign/fill pdf, «no upload», «no account», «free», «private», «offline» — весь клин в одну строку.

---

## 4. Полное описание (detailed description)

> Sign and fill any PDF right in your browser — no upload, no account, nothing sent to a server.
>
> Most tools make you create an account and upload your document to their cloud just to add a signature. This one doesn't. Everything happens locally on your computer, so your contracts, forms, and personal files stay private.
>
> **What you can do**
> - Sign a PDF: draw your signature, type it, or upload it as an image. Save 2–3 signatures for reuse.
> - Fill out PDF forms: add text anywhere, tick checkboxes, insert dates and initials.
> - Add a signature to any PDF, then download the finished file instantly.
> - Works offline — open a PDF, sign it, done.
>
> **Why people use it**
> - No upload — your file never leaves your device.
> - No account, no sign-up, no email required.
> - Free to start; one-time lifetime unlock, no subscription.
> - A simple way to sign a PDF without Adobe.
>
> Perfect for freelancers, small business owners, realtors, and anyone who signs contracts and forms regularly and doesn't want to hand sensitive documents to a third-party server.

Ключи, вплетённые естественно: sign pdf, fill pdf / fill out pdf form, add signature to pdf, sign a pdf without adobe, esign, sign pdf online (через «in your browser»), pdf form.

---

## 5. Скриншоты (5 шт., каждый = один тезис)

1. **Главный кадр:** PDF с наложенной подписью + подпись-плашка «No upload · No account · 100% local».
2. **Подпись тремя способами:** draw / type / upload — коллаж.
3. **Заполнение формы:** текстовые поля, чекбоксы, дата на реальном бланке.
4. **Приватность:** иконка «файл остаётся на устройстве», «works offline».
5. **Lifetime:** «Pay once. Yours forever.» против «$X/mo» подписок.

Промо-тайл: клин одной строкой + иконка замка/локальности.

---

## 6. Что из этого вытекает для MVP (передача в архитектуру)

Листинг фиксирует обещания, а они жёстко определяют стек:

- «No upload / files never leave your computer» → **всё клиентское**: рендер и правка PDF в браузере (`pdf.js` + `pdf-lib`), никакого бэкенда для файлов.
- «No account» → лицензия по ключу без регистрации (**Paddle** как Merchant of Record + **Supabase** только для валидации ключа, не для файлов).
- «Free to start, lifetime unlock» → 4–5 бесплатных действий, затем пейволл; один платёж.
- «Works offline» → расширение самодостаточно, без обязательных сетевых вызовов для основной функции.

**Do NOT build (осознанно за бортом MVP):** аккаунты, облачное хранилище, командные фичи, аудит-трейл, интеграции с CRM, мобильную версию.

---

## 7. Чек-лист перед публикацией

- [ ] Название с `Sign PDF` в начале
- [ ] Краткое описание содержит весь клин в 132 символах
- [ ] 5 скриншотов = 5 тезисов
- [ ] Категория: Productivity / Tools
- [ ] Ключи не «набиты», а вплетены в живой текст (спам режется модерацией и алгоритмом)
- [ ] Privacy-практика в листинге совпадает с реальностью (никаких лишних разрешений)
