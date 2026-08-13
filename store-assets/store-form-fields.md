# Chrome Web Store dashboard — paste-ready field values

Item ID: `coafhpeijoldaeglennbdiepigipebco`
Package: `build/sign-fill-pdf-v0.1.1.zip`

v0.1.1 ships with monetisation switched OFF (`PAYWALL_ENABLED = false` in
`src/shared/constants.ts`): unlimited exports, no counter, no unlock UI, and no
network requests at all. Site links point at the live GitHub Pages site. Flip the
flag back on when there is a real checkout.

The dashboard renders descriptions as PLAIN TEXT — no markdown. Everything below
is already plain text; paste as-is, keep the blank lines.

---

## Tab: Описание продукта (Store listing)

### Описание (Description) — 1 447 / 16 000

```
Sign and fill any PDF right in your browser — no upload, no account, nothing sent to a server.

Most tools make you create an account and upload your document to their cloud just to add a signature. This one doesn't. Everything happens locally on your computer, so your contracts, forms and personal files stay private.

WHAT YOU CAN DO

• Sign a PDF — draw your signature with the mouse or trackpad, type it in a handwriting font, or upload it as an image. Save your signatures and reuse them.
• Fill out PDF forms — add text anywhere on the page, tick checkboxes, insert dates and initials.
• Add a signature to any PDF, then download the finished file instantly.
• Tidy up pages — rotate, reorder or delete pages before you export.
• Works offline — open a PDF, sign it, done.

WHY PEOPLE USE IT

• No upload. Your file never leaves your device: the PDF is opened, edited and saved entirely by your browser.
• No account, no sign-up, no email required.
• Completely free — no subscription, no export limit, no watermark.
• A simple way to sign a PDF online without Adobe.

HOW IT WORKS

1. Click the extension icon and open a PDF from your computer (or drag and drop it).
2. Place your signature, text, dates or checkmarks wherever you need them.
3. Download the signed PDF. Nothing was uploaded anywhere.

Perfect for freelancers, small business owners, realtors and anyone who signs contracts and forms regularly and doesn't want to hand sensitive documents to a third-party server.

Privacy: this extension does not collect, transmit or sell any data. There is no analytics and no server-side processing of your documents.
```

### Категория (Category)
`Работа и планирование` / `Workflow & Planning`, in the `РАБОТА` / Work group.

The dashboard now shows one flat list — the old `Productivity` parent is gone and
`Workflow & Planning` is its document-oriented successor. `Инструменты` / `Tools`
is the generic-browser-utility bucket (converters, timers, clipboards) and is a
weaker match for "sign pdf" intent. Category can be changed later without
rebuilding the package (re-review only).

### Язык (Language)
`English (United States)` — the whole UI and listing are English.

### Графические объекты (Assets) — all generated, all 24-bit PNG without alpha
Regenerate any of them with `npm run gen:screenshots` in `pdf-sign-extension/`.

| Поле в дашборде | Требование | Файл |
|---|---|---|
| Значок магазина * | 128×128 | `store-assets/store-icon-128.png` |
| Скриншоты * (до 5) | 1280×800 | `store-assets/screenshots/out/01-hero.png` … `05-lifetime.png` |
| Маленькое рекламное изображение | 440×280 | `store-assets/promo/out/small-440x280.png` |
| Очень большое рекламное изображение | 1400×560 | `store-assets/promo/out/marquee-1400x560.png` |
| Глобальный проморолик | YouTube URL | — none, leave empty |

Upload the screenshots in numeric order — the store shows them in upload order and
each one carries a different message (hero → three ways → form → privacy → lifetime).

### Дополнительные поля (Additional fields)
- **Официальный URL**: leave `Нет`. That dropdown only lists domains verified in
  Google Search Console; skipping it costs nothing.
- **URL главной страницы**: `https://nawka.github.io/pdf-sign/`
- **URL службы поддержки**: `https://nawka.github.io/pdf-sign/#privacy`
  (the site footer carries the contact email; there is no dedicated support page yet)
- **Только для взрослых**: off

---

## Tab: Конфиденциальность (Privacy)

### Единая цель (Single purpose)

```
Sign and fill PDF documents locally in the browser: the user opens a PDF from their own computer, places a signature, text, dates or checkmarks on it, and downloads the result. All processing happens on the user's device.
```

### Обоснование разрешений (Permission justifications)

`storage`

```
Stores the user's own reusable signatures and their editor preferences in chrome.storage.local, so that a signature drawn once can be reused on the next document instead of being redrawn every time. No document content and no personal data is stored, the data stays on the user's device, and nothing is transmitted anywhere.
```

`downloads`

```
Saves the finished, signed PDF to the user's Downloads folder. The file is generated in the browser and written straight to disk; it is never uploaded.
```

`contextMenus`

```
Adds a single right-click item on PDF links and pages ("Open in Sign & Fill PDF") so the user can start signing a PDF without opening the popup first.
```

### Удалённый код (Remote code)
Select **"No, I am not using remote code"**, then paste the justification:

```
All executable code ships inside the package, including the bundled pdf.js and pdf-lib libraries and the web fonts. Nothing is fetched from a CDN or any other server at runtime. The extension declares the strict content security policy "script-src 'self'; object-src 'self'", which blocks remote scripts and eval outright.
```

### Использование данных (Data usage) — declare ALL boxes UNCHECKED
Nothing is collected. Then certify the three statements:
- I do not sell or transfer user data to third parties… ✔
- I do not use or transfer user data for purposes unrelated to my item's single purpose ✔
- I do not use or transfer user data to determine creditworthiness or for lending purposes ✔

### URL политики конфиденциальности (Privacy policy URL)
`https://nawka.github.io/pdf-sign/privacy/`

---

## Tab: Инструкции для тестирования (Testing instructions)

```
No account, login or test credentials are required — every feature below works on a fresh install.

1. Click the extension icon, then "Open PDF" and pick any local PDF (or drag and drop one onto the editor tab).
2. Click "Signature" and create one in any of the three ways: draw it, type it, or upload a PNG/JPG. Drag it onto the page and resize it.
3. Optionally add text, a date or a checkmark from the toolbar.
4. Click "Download" — the signed PDF is saved to your Downloads folder.

Every feature is free and unlimited — there is no paywall, no export limit and nothing to purchase.

The extension makes no network requests at all. It works fully offline — you can disconnect the network and repeat steps 1–4.
```

---

## Tab: Распространение (Distribution)
- Видимость: `Public` (or `Unlisted` for a quiet first release)
- Регионы: all
- Расширение платное? No — free with an in-extension one-time unlock sold on the site.

---

## Why "Отправить на проверку" is greyed out
Required before submit: Description, Category, Language, at least one 1280×800
screenshot, the whole Конфиденциальность tab (single purpose, one justification
per permission, remote-code answer, data-usage certifications, privacy policy
URL), and Распространение visibility.
