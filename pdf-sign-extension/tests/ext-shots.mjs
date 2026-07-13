// Screenshot the built extension surfaces (editor, signature modal, popup,
// options) for visual color review. Serves dist/ via the static server on 5178
// with the chrome.* shim injected.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

const base = 'http://localhost:5178'
const dir = new URL('.', import.meta.url).pathname
const shim = readFileSync(dir + 'chrome-shim.js', 'utf8')
const sample = dir + 'fixtures/sample.pdf'
const out = new URL('../shots/', import.meta.url).pathname
await mkdir(out, { recursive: true })

const browser = await chromium.launch()

// --- Editor with a loaded, signed document ---
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(shim)
  const page = await ctx.newPage()
  await page.goto(base + '/src/editor/editor.html', { waitUntil: 'load' })
  await page.setInputFiles('#file-input', sample)
  await page.waitForSelector('.page__canvas')
  await page.waitForTimeout(400)

  // Place a text mark + a typed signature so the editor isn't empty.
  await page.click('[data-tool="text"]')
  await page.locator('.overlay').first().click({ position: { x: 150, y: 150 } })
  await page.waitForSelector('.ov--text.is-editing')
  await page.keyboard.type('Alex Morgan')
  await page.locator('.ov--text .ov__text').blur()

  await page.screenshot({ path: `${out}ext-editor.png` })
  console.log('  ext-editor.png')

  // Signature capture modal (Type tab)
  await page.click('[data-tool="signature"]')
  await page.locator('.overlay').first().click({ position: { x: 300, y: 360 } })
  await page.waitForSelector('.modal.sig')
  await page.click('.sig__tab[data-mode="type"]')
  await page.fill('.sig-type__input', 'Alex Morgan')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}ext-signature-modal.png` })
  console.log('  ext-signature-modal.png')
  await ctx.close()
}

// --- Popup ---
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 460 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(shim)
  const page = await ctx.newPage()
  await page.goto(base + '/src/popup/popup.html', { waitUntil: 'load' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}ext-popup.png` })
  console.log('  ext-popup.png')
  await ctx.close()
}

// --- Options ---
{
  const ctx = await browser.newContext({ viewport: { width: 820, height: 720 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(shim)
  const page = await ctx.newPage()
  await page.goto(base + '/src/options/options.html', { waitUntil: 'load' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}ext-options.png`, fullPage: true })
  console.log('  ext-options.png')
  await ctx.close()
}

await browser.close()
console.log('done')
